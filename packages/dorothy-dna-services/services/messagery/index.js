const Messagery = require('./Messagery');

const db = require("../../database");
const Sequelize = require("sequelize");

const { prepareAlert } = require("../../util");

const MAX_MESSAGES = 5; /* TODO: vai para config geral */
class Service {

    test({ room, event, payload }) {
        Messagery.test({ room, event, payload });

        return { room, event, payload };
    }

    command(command, payload) {
        Messagery.command(command, payload);

        return { command, payload };
    }

    async fetchAlerts(userId) {
        const sequelize = db.instance();

        let result;

        result = await sequelize.query(
            `select a.id, a.room, a."communityId", a."type", "initiatorId" 
            from ${process.env.DB_PREFIX}alerts a 
            where "userId" = :userId
            and "readAt" is null
            and "canceledAt" is null
            order by "createdAt" `,
            {
                replacements: { userId },
                type: Sequelize.QueryTypes.SELECT,
            }
        );

        let alerts = [];
        for (let idx = 0; idx < result.length; idx++) {
            let r = result[idx];
            alerts.push(await prepareAlert(r.room, r.id, r['communityId']));
        }

        return alerts;
    }

    async fetchMessages({ room, threshold }, userId) {
        const sequelize = db.instance();

        let result;

        let thresholdWhere = '';
        if (threshold) thresholdWhere = `and m.id < ${threshold}`;

        result = await sequelize.query(
            `select m."createdAt", m.id, u.id as "user_id", u.name as "user_name", m.tool, m.content 
             from ${process.env.DB_PREFIX}messages m
             left join ${process.env.DB_PREFIX}users u on u.id = m."userId"
             where room = :room and m."deletedAt" is NULL and m."sentAt" is NOT NULL
             ${thresholdWhere}
             order by m."updatedAt" desc
             LIMIT ${MAX_MESSAGES + 1}`,
            {
                replacements: { room, threshold },
                type: Sequelize.QueryTypes.SELECT,
            }
        );

        let hasMore = false;
        let messageRef = null;
        let notifications = [...result];
        if (notifications.length > MAX_MESSAGES) {
            notifications.pop(); // TODO: is this ok?
            messageRef = notifications[notifications.length - 1].id;
            hasMore = true;
        }

        /* reset alerts for this room */
        Messagery.resetAlerts(room, userId);

        return {
            notifications,
            hasMore,
            messageRef,
        }
    }

    async countAlerts(id) {
        const sequelize = db.instance();

        let result = await sequelize.query(
            `
            select count(*) as total
            from ${process.env.DB_PREFIX}alerts a 
            where a."userId" = :id
            `,
            {
                replacements: { id },
                type: Sequelize.QueryTypes.SELECT,
            }
        );

        return { count: result[0].total }
    }

    async batchNotification() {

        await Messagery.sendBatchNotifications();

        return { success: true }
    }

    async sendEmails(config) {
        await Messagery.sendEmails(config);

        return { success: true }
    }

    async isFollowing(userId, room) {
        const entities = await db.instance().query(
            `
              SELECT f.id, f."type"
              from ${process.env.DB_PREFIX}following f
              where f."userId" = :userId and f.room = :room
              `,
            {
                replacements: { userId, room },
                type: Sequelize.QueryTypes.SELECT,
            },
        );

        return !entities.length ? { type: 'none' } : entities[0];
    }

    async follow(userId, room, communityId, following_type) { /* following type null -> remove */
        const entities = await db.instance().query(
            `
          SELECT f.id, f."type"
          from dorothy_following f
          where f."userId" = :userId and f.room = :room
          `,
            {
                replacements: { userId, room },
                type: Sequelize.QueryTypes.SELECT,
            },
        );

        let following = null;
        if (!!entities.length) following = entities[0];

        if (!!following && !following_type) { /* Tem following e e' para remover */
            /* remove following */
            await db.instance().query(
                `
              DELETE 
              from dorothy_following
              where "userId" = :userId and room = :room
              `,
                {
                    replacements: { userId, room },
                    type: Sequelize.QueryTypes.SELECT,
                },
            );

            return { changed: true };
        }

        if (!following) { /* N tem following */
            /* insert following */

            await db.instance().query(
                `
                INSERT INTO dorothy_following("userId", room, "communityId", "type")
                VALUES(:userId, :room, :communityId, :following_type )
                `,
                {
                    replacements: { userId, room, communityId, following_type },
                    type: Sequelize.QueryTypes.INSERT,
                },
            );

            return { changed: true };
        }

        if (following.type !== following_type) { /* Tem following e following_type e' diferente */
            /* update following */
            await db.instance().query(
                `
                UPDATE dorothy_following
                set "type" = :following_type
                WHERE id = :id
                `,
                {
                    replacements: { id: following.id, following_type },
                    type: Sequelize.QueryTypes.INSERT,
                },
            );

            return { changed: true };
        }

        return { changed: false };
    }

}


const singletonInstance = new Service();
module.exports = singletonInstance;

