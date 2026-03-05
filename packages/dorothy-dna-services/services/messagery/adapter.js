const db = require("../../database");
const Sequelize = require("sequelize");

const { toPGArray, prepareAlert, applyWhere } = require("../../util");

const _ = require("lodash");
const dayjs = require('dayjs');

const Config = require('../../configurable');

const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

class Adapter {
    batch_notification_tools = [];

    constructor() {
        this.retrieveNotificationTools()
    }

    async retrieveNotificationTools() {
        this.batch_notification_tools = await db.instance().query(`
        select t.element, 
        t.descriptor_json, 
        (t.descriptor_json->>'delay')::int as delay
        from ${process.env.DB_PREFIX}tools t 
        where class = 'batch_notification'
        `,
            {
                type: Sequelize.QueryTypes.SELECT,
            }
        );
    }

    getNotificationTool(tool) {
        return this.batch_notification_tools.find(t => t.element === tool);
    }

    async addNotification(room, notification, newWatch = [], config = {}) {
        const sequelize = db.instance();
        let result;

        if (config.dedup) {
            result = await sequelize.query(`
            select m.id, trim(m.room) as room 
            from ${process.env.DB_PREFIX}messages m 
            where :key=ANY(m.watch)
            `,
                {
                    replacements: { key: config.dedup },
                    type: Sequelize.QueryTypes.SELECT,
                }
            );

            if (!!result.length) return null;
        }

        const {
            content: originalContent,
            userId: user_id,
            tool,
        } = notification;

        let doSend = true;
        let content = originalContent;
        let isNew = true;
        let notificationId;

        // is this a batch notification?
        const batch_notification = this.getNotificationTool(tool.element);
        if (!!batch_notification) {
            // is there an open notification (sentAt is null) for this notification?
            const notification = await sequelize.query(`
            select 
                m.id,
                m."content",
                m.watch 
            from ${process.env.DB_PREFIX}messages m
            where m.tool->>'element' = :element
            and m."deletedAt" is null
            and m."sentAt" is null
            and room = :room
            `,
                {
                    replacements: { room, element: tool.element },
                    type: Sequelize.QueryTypes.SELECT,
                }
            );

            let content_length = 1;
            if (notification.length) {
                isNew = false;
                notificationId = notification[0].id;

                const currentContent = notification[0].content;
                content_length = currentContent.length + 1;
                content = [...currentContent, content]; // merge

                newWatch = [...notification[0].watch, ...newWatch];
            } else content = [content]; // as array


            if (batch_notification.descriptor_json.limit > content_length) doSend = false; // the limit was not reached?

        }

        if (isNew) { // yes: insert (normal)
            result = await sequelize.query(`
            INSERT INTO ${process.env.DB_PREFIX}messages(
                room, content, "createdAt", "updatedAt", "userId", tool, watch, "sentAt"
            ) 
            VALUES( 
                :room, :content, NOW(), NOW(), :user_id, :tool, :watch, ${doSend ? 'NOW()' : 'NULL'}
            ) RETURNING id`,
                {
                    replacements: {
                        room,
                        content: JSON.stringify(content),
                        user_id, tool: JSON.stringify(tool),
                        watch: toPGArray(newWatch),
                    },
                    type: Sequelize.QueryTypes.SELECT,
                }
            );

            notificationId = result[0].id; // recupera o id recem criado
        } else { // no : update content and //TODO: watch
            await sequelize.query(`
            UPDATE ${process.env.DB_PREFIX}messages
            set content = :content, watch = :watch, "updatedAt" = NOW(), "sentAt" = ${doSend ? 'NOW()' : 'NULL'}
            WHERE id = :notificationId
            `,
                {
                    replacements: {
                        content: JSON.stringify(content),
                        watch: toPGArray(newWatch),
                        notificationId,
                    },
                    type: Sequelize.QueryTypes.SELECT,
                }
            );
        }

        // if this is not a batch or the batch limit was reached - return notification otherwise return null
        if (!doSend) return null;

        result = await sequelize.query(`
            select m."createdAt", m.id, u.id as "user_id", u.name as "user_name", m.tool, m.content 
            from ${process.env.DB_PREFIX}messages m
            left join ${process.env.DB_PREFIX}users u on u.id = m."userId"
            where m.id = :notificationId`,
            {
                replacements: { notificationId },
                type: Sequelize.QueryTypes.SELECT,
            }
        );

        return result[0];
    }

    async addAlerts(room, type, watch = [], instantiator_id, exclude) {
        const sequelize = db.instance();

        let query, result;

        /* 
            Buscar todos os alertas:
            - room
            - readAt: null
            - canceledAt: null
            - type
            - userId (followers)
        */
        query = `
            select f."userId", a.id as "alertId", a.watch, a.notifications, f."communityId", a."pendingEmail" 
            from ${process.env.DB_PREFIX}following f
            left join ${process.env.DB_PREFIX}alerts a on a."userId" = f."userId" and a.room = :room and a."type" = :type and a."readAt" is null and a."canceledAt" is null
            where f.room = :room
        `; /* trazer tambem os usuarios seguem este room */

        result = await sequelize.query(query, {
            replacements: { room, type },
            type: Sequelize.QueryTypes.SELECT,
        });

        let new_alerts = [];
        for (let idx = 0; idx < result.length; idx++) {
            let row = result[idx];

            // console.log({ row })

            /* 
            Aqueles com id de alerta nulo, que nao e' sender e nao esta na sala
            - cria alerta
            - inclui o novo alerta na lista de new_alerts
            */

            // se pendingEmail e' falso (ou seja, o email ja foi enviado), cancela este alerta e cria um novo
            // desta forma, nao duplicamos um alerta para a mesma sala e tipo, mas ainda garantimos o envio do novo email (com novo conteudo)
            if (!row['pendingEmail']) {
                await sequelize.query(`
                    UPDATE ${process.env.DB_PREFIX}alerts
                    SET "canceledAt" = NOW()
                    WHERE id = :alert_id
                `, {
                    replacements: {
                        alert_id: row['alertId'],
                    },
                    type: Sequelize.QueryTypes.UPDATE,
                });
            }

            if (!row['alertId'] || !row['pendingEmail']) { /* (1) NAO TEM um alerta no contexto requerido ou (2) TEM um alerta no contexto requerido com o EMAIL ENVIADO */
                if (!exclude.includes(row['userId']) && !new_alerts.find(a => a.userId === row['userId'])) { /* (1) usuario nao esta na lista de exclusao e (2) nenhum alerta foi enviado para este usuario (workaround for multiple alerts for same user - BUG)  */
                    let alertResult = await sequelize.query(`
                        INSERT INTO ${process.env.DB_PREFIX}alerts
                        ("userId", room, "type", watch, "createdAt", "updatedAt", "initiatorId", "communityId", notifications)
                        VALUES(:user_id, :room, :type, :watch, NOW(), NOW(), :instantiator_id, :community_id, :notifications)
                        RETURNING id
                    `, {
                        replacements: {
                            user_id: row['userId'],
                            room,
                            type,
                            watch: toPGArray(watch),
                            instantiator_id,
                            community_id: row['communityId'],
                            notifications: toPGArray([instantiator_id]),
                        },
                        type: Sequelize.QueryTypes.SELECT,
                    });

                    const newId = alertResult[0].id; // recupera o id recem criado

                    if (!row['alertId']) { // se e' REALMENTE um novo alerta
                        new_alerts.push({
                            userId: row['userId'],
                            alert: await prepareAlert(room, newId/* , row['communityId'] */),
                        })
                    }
                }
            } else { /* TEM um alerta no contexto requerido */
                /* 
                Aqueles com id de alerta NAO nulo
                - inclui watch (se ja nao estiver)
                */

                // implementei este !row['watch'] para remover bug - repassar esta logica
                if (!row['watch'] || !row['watch'].some(w => watch?.includes(w))) await sequelize.query(`
                    UPDATE ${process.env.DB_PREFIX}alerts
                    SET 
                    watch = :watch, 
                    notifications = :notifications,
                    "updatedAt" = NOW()
                    WHERE id = :alert_id
                `, {
                    replacements: {
                        alert_id: row['alertId'],
                        watch: !row['watch'] ? toPGArray([watch]) : toPGArray([...row['watch'], ...watch]),
                        notifications: toPGArray([...row['notifications'], instantiator_id])
                    },
                    type: Sequelize.QueryTypes.UPDATE,
                });
            }
        }

        return { new_alerts };
    }

    async resetAlerts(room, userId) {
        const sequelize = db.instance();

        let query, result;

        query = `
            select id 
            from ${process.env.DB_PREFIX}alerts
            where room = :room
            and "userId" = :user_id
            and "readAt" is null
            and "canceledAt" is null
        `;

        let alerts = await sequelize.query(query, {
            replacements: { room, user_id: userId },
            type: Sequelize.QueryTypes.SELECT,
        });

        if (alerts.length === 0) return [];

        query = `
            update ${process.env.DB_PREFIX}alerts
            set "readAt" = NOW()
            where room = :room
            and "userId" = :user_id
            and "readAt" is null
            and "canceledAt" is null
        `;

        result = await sequelize.query(query, {
            replacements: { room, user_id: userId },
            type: Sequelize.QueryTypes.UPDATE,
        });

        return alerts;
    }

    async removeAlerts(watch) {
        const sequelize = db.instance();

        let query, result;

        let alerts_to_remove = [];

        // buscar alertas com este watch
        query = `
        select a.id, a."userId", a.watch 
        from ${process.env.DB_PREFIX}alerts a
        where :watch=ANY(a.watch)
        and a."readAt" is NULL and a."canceledAt" is NULL
        `;

        let alerts = await sequelize.query(query, {
            replacements: { watch },
            type: Sequelize.QueryTypes.SELECT,
        });

        // cada alerta, remover este watch, se este e' o ultimo watch, marcar canceledAt e registrar userId
        // o userId pode aparecer mais de uma vez, portanto, retornar [{ userId, count }] - caso raro?
        for (let idx = 0; idx < alerts.length; idx++) {
            let alert = alerts[idx];

            let canceledAtString = '';
            if (alert.watch.length === 1) {
                canceledAtString = ',\n"canceledAt" = NOW()';

                // register userId (and count)
                let atr = alerts_to_remove.find(a => a.userId === alert.userId);
                if (!atr) {
                    atr = {
                        userId: alert.userId,
                        alerts: [],
                    };
                    alerts_to_remove.push(atr)
                }
                atr.alerts.push(alert.id);
            }

            let newWatch = alert.watch.filter(w => w !== watch);

            query = `
            update ${process.env.DB_PREFIX}alerts
            set watch = :watch
            ${canceledAtString}
            where id = :id
            `;

            result = await sequelize.query(query, {
                replacements: { id: alert.id, watch: toPGArray(newWatch) },
                type: Sequelize.QueryTypes.UPDATE,
            });
        }

        return { alerts_to_remove };
    }

    async getNotificationsWatching(key) {
        const sequelize = db.instance();

        let result;

        result = await sequelize.query(`
            select m.id, trim(m.room) as room 
            from ${process.env.DB_PREFIX}messages m 
            where :key=ANY(m.watch)`,
            {
                replacements: { key },
                type: Sequelize.QueryTypes.SELECT,
            }
        );

        return result;

    }

    async getNotificationContent(criteria, target) { // criteria: { type: 'id', key: 'ID' } or { type: 'watch', key: 'WATCH' }

        let where = ['m.id = :id'];
        let replacements = { id: criteria.key }

        if (criteria.type === 'watch') {
            where = [':watch=ANY(m.watch)'];
            replacements = { watch: criteria.key }
        }

        let result;

        result = await db.instance().query(`
            select content
            from ${process.env.DB_PREFIX}messages m 
            ${applyWhere(where)}
            `,
            {
                replacements,
                type: Sequelize.QueryTypes.SELECT,
            }
        );

        if (!result.length) return null;

        // target is only for batch notifications
        if (!target || !Array.isArray(result[0].content)) return result[0].content;

        // target
        const targetIndex = _.findIndex(result[0].content, target);
        return result[0].content[targetIndex];
    }

    async updateNotificationContent(criteria, content, target) {  // criteria: { type: 'id', key: 'ID' } or { type: 'watch', key: 'WATCH' }

        let where = ['m.id = :id'];
        let replacements = { id: criteria.key }

        if (criteria.type === 'watch') {
            where = [':watch=ANY(m.watch)'];
            replacements = { watch: criteria.key }
        }

        let result;

        result = await db.instance().query(`
            select *
            from ${process.env.DB_PREFIX}messages m 
            ${applyWhere(where)}
            `,
            {
                replacements,
                type: Sequelize.QueryTypes.SELECT,
            }
        );

        if (!result.length) return null;

        // target (only for batch notifications)
        let finalContent = content;
        if (!!target && Array.isArray(result[0].content)) {
            const targetIndex = _.findIndex(result[0].content, target); // find target in content
            finalContent = result[0].content;
            finalContent[targetIndex] = _.assign(finalContent[targetIndex], content); // update target
        }

        await db.instance().query(`
            update ${process.env.DB_PREFIX}messages m 
            set content = :content
            ${applyWhere(where)}
            `,
            {
                replacements: { ...replacements, content: JSON.stringify(finalContent) },
                type: Sequelize.QueryTypes.UPDATE,
            }
        );


        result = await db.instance().query(`
            select m."createdAt", m.id, u.id as "user_id", u.name as "user_name", m.tool, m.content, m.room 
            from ${process.env.DB_PREFIX}messages m
            left join ${process.env.DB_PREFIX}users u on u.id = m."userId"
            ${applyWhere(where)}
            `,
            {
                replacements,
                type: Sequelize.QueryTypes.SELECT,
            }
        );

        return {
            updatedNotification: result[0],
            room: result[0].room.trim()
        };
    }

    async sendBatchNotifications() {
        const INTERVAL = process.env.EMAIL_ALERTS_PULSE || 10;

        /* discover current group */
        const todayMinutes = dayjs().diff(dayjs().format('YYYY-MM-DD'), 'minute');
        const current_group = Math.floor(todayMinutes / INTERVAL);

        /* batch notification configs with current_group pulse match */
        const configs = this.batch_notification_tools.filter(c => current_group % c.delay === 0);

        let allAffectedNotifications = [];
        for (let c of configs) { // para cada tipo de batch notification com match entre seu delay e o grupo atual
            const tool = c.element;

            console.log(`Running batch notification: ${tool} (pulse: ${current_group})`);

            let pendingNotifications = await db.instance().query(`
            select 
                m.id,
                m.room,
                m."content",
                m.watch,
                m."createdAt", 
                m.tool,
                u.id as "user_id", 
                u.name as "user_name"
            from ${process.env.DB_PREFIX}messages m
            left join ${process.env.DB_PREFIX}users u on u.id = m."userId"
            where m.tool->>'element' = :tool
            and m."deletedAt" is null
            and m."sentAt" is null
            `,
                {
                    replacements: { tool },
                    type: Sequelize.QueryTypes.SELECT,
                }
            );

            if (!pendingNotifications.length) continue;

            await db.instance().query(`
            update ${process.env.DB_PREFIX}messages
            set "sentAt" = NOW()
            where id in (${pendingNotifications.map(n => n.id).join(',')})
            `,
                {
                    type: Sequelize.QueryTypes.UPDATE,
                }
            );

            allAffectedNotifications = [...allAffectedNotifications, ...pendingNotifications];
        }

        return allAffectedNotifications;
    }

    async sendEmails(config) {
        const INTERVAL = process.env.EMAIL_INTERVAL || 10;

        /* discover current group */
        const todayMinutes = dayjs().diff(dayjs().format('YYYY-MM-DD'), 'minute');
        let current_group;
        if (!config?.current_group) current_group = Math.floor(todayMinutes / INTERVAL);
        else current_group = config.current_group;

        const EMAIL_GROUPS_PER_DAY = Math.floor(1440 / INTERVAL); //(1440 minutes per day / INTERVAL = groups per dey)

        console.log(`Running email sending: (group: ${current_group})`);

        const result = await db.instance().query(`
        select 
            a.id, 
            a.room, 
            a.notifications,
            u.name, 
            u.email, 
            f."type" 
        from ${process.env.DB_PREFIX}alerts a
        inner join ${process.env.DB_PREFIX}users u on u.id = a."userId" 
        inner join ${process.env.DB_PREFIX}following f on f."userId" = a."userId" and f.room = a.room 
        where a."pendingEmail" = true 
        and a."readAt" is null
        and a."canceledAt" is null
        and (f."type" = 'single-email' or (f."type" = 'daily-email' and a."userId" % ${EMAIL_GROUPS_PER_DAY} = ${current_group})) -- group
        `,
            {
                type: Sequelize.QueryTypes.SELECT,
            }
        );

        if (!result.length) return;

        for (let row of result) {
            let rooms = [];

            const notifications = await db.instance().query(`
                select 
                    m.id, 
                    m.room,
                    m.tool->>'element' as tool,
                    m.content
                from ${process.env.DB_PREFIX}messages m
                where id in (${row.notifications.join(',')})
            `,
                {
                    type: Sequelize.QueryTypes.SELECT,
                }
            );

            for (let n of notifications) {
                let room = rooms.find(r => r.room === n.room.trim());
                if (!room) {
                    const { data } = await prepareAlert(n.room);

                    room = {
                        room: n.room.trim(),
                        tools: [],
                        data,
                    }

                    if (!!Config.get('room_names') && typeof Config.get('room_names') === 'function') {
                        room.subject = Config.get('room_names')(data);
                    } else room.subject = `Community '${data.extended.communityName}'`;

                    rooms.push(room)
                }

                let room_tool = room.tools.find(rn => rn.tool === n.tool);
                if (!room_tool) {
                    room_tool = {
                        tool: n.tool,
                        notifications: [],
                    }

                    room.tools.push(room_tool);
                }

                room_tool.notifications.push({
                    id: n.id,
                    content: n.content,
                });
            }


            // transform content in email content (html, text, subject)
            const preparedRooms = [];
            for (let room of rooms) {

                let preparedRoom = { ...room, tools: [] };

                for (let tool of room.tools) {
                    let preparedTool = { ...tool, ...await this.buildEmailFragmentContent(tool.tool, this.mixContent(tool.notifications.map(n => n.content)), room.data) }
                    preparedRoom.tools.push(preparedTool)
                }

                preparedRooms.push(preparedRoom);
            }

            const { text, html } = await this.buildEmail(preparedRooms);

            const to = `${row['name']} <${row['email']}>`;

            const msg = {
                to,
                from: process.env.CONTACT_EMAIL,
                subject: process.env.NOTIFICATION_EMAIL_SUBJECT,
                text,
                html,
            };

            await sgMail.send(msg);
            // marcar como enviado!
            await db.instance().query(`
            update ${process.env.DB_PREFIX}alerts 
            set 
                "pendingEmail" = false,
                "emailedAt" = NOW()
                where id = ${row['id']}
            `,
                {
                    type: Sequelize.QueryTypes.UPDATE,
                }
            );
        }
    }

    async buildEmailFragmentContent(tool, content, data) {
        /* text/html for each notification (tool) - 1.specific for too, 2.default, 3.none */
        if (!!Config.get('notification_email_templates') && typeof Config.get('notification_email_templates')[tool] === 'function') {
            return await Config.get('notification_email_templates')[tool](content, data);
        }
        if (!!Config.get('notification_email_templates') && typeof Config.get('notification_email_templates').default === 'function') {
            return await Config.get('notification_email_templates').default(content, data);
        }

        return {
            text: `${Array.isArray(content) ? content.length : 1} update(s)`,
            html: `${Array.isArray(content) ? content.length : 1} update(s)`,
            subject: tool,
        }

    }

    async buildEmail(data) {
        /* text/html for each notification (tool) - 1.custom 2.none */
        if (!!Config.get('notification_email_templates') && typeof Config.get('notification_email_templates').email_template === 'function') {
            return await Config.get('notification_email_templates').email_template(data);
        }

        return {
            text: `DEFAULT ${JSON.stringify(data)}`,
            html: `DEFAULT ${JSON.stringify(data)}`,
        }
    }

    mixContent(data) {
        let content = [];

        for (let n of data) {
            const c = Array.isArray(n) ? n : [n];
            content = [...content, ...c];
        }

        return content;
    }

}

const singletonInstance = new Adapter();
module.exports = singletonInstance;

