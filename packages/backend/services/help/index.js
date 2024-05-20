const Sequelize = require('sequelize');
const db = require('../database');

const { Messagery } = require('dorothy-dna-services');

const { applyJoins, applyWhere } = require('../../utils');

class Service {
  async get(id) {
    const helps = await db.instance().query(
      `
        SELECT *
        FROM help_requests
        WHERE id = :id
        `,
      {
        type: Sequelize.QueryTypes.SELECT,
        replacements: { id }
      },
    );

    if (!helps.length) return null;

    return helps[0];
  }

  async close(id, communityId, field) {
    await db.instance().query(
      `
        UPDATE help_requests
        SET "closedAt" = NOW()
        WHERE id = :id
        `,
      {
        type: Sequelize.QueryTypes.SELECT,
        replacements: { id }
      },
    );

    /* refresh notification (LIVE) */
    const watch = `help_${id}`;
    Messagery.refreshNotifications(watch);

    return { success: true };
  }

  async request(userId, communityId, tab, text) {    

    // create help request
    const result = await db.instance().query(
      `
        INSERT INTO help_requests("createdAt", "updatedAt", community_id, tab, text)
        VALUES(NOW(), NOW(), :communityId, :tab, :text)
        RETURNING id
        `,
      {
        type: Sequelize.QueryTypes.SELECT,
        replacements: { communityId, tab, text }
      },
    );
    const help_id = result[0].id;

    // create message content and watch
    const content = {
      help_id,
      tab,
      text,
      communityId,
    };
    const watch = `help_${help_id}`;

    // send SE notification
    await Messagery.sendNotification({ id: userId }, 'room_c1_t1', {
      content,
      userId: userId,
      tool: {
        type: "native",
        element: "HelpNotification"
      },
    }, [watch]);

    // send community notification
    await Messagery.sendNotification({ id: userId }, `room_c${communityId}_t1`, {
      content,
      userId: userId,
      tool: {
        type: "native",
        element: "HelpNotification"
      },
    }, [watch]);

    // retrieve the facilitator
    const projects = await db.instance().query(
      `
        SELECT id
        FROM projetos
        WHERE community_id = :communityId
        `,
      {
        type: Sequelize.QueryTypes.SELECT,
        replacements: { communityId }
      },
    );

    if (!!projects.length) {
      const supporters = await require('../project').retrieveSupporters(projects[0].id);
      // send facilitator notification
      for (let sup of supporters) { // para cada facilitador
        await Messagery.sendNotification({ id: userId }, `room_c${sup.communityId}_t1`, {
          content,
          userId: userId,
          tool: {
            type: "native",
            element: "HelpNotification"
          },
        }, [watch]);
      }
    }

    return { success: true }
  }
}

const singletonInstance = new Service();
module.exports = singletonInstance;
