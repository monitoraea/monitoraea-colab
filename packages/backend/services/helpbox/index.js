const Sequelize = require('sequelize');
const db = require('../database');

class Service {
  async getContentIdByKeyRef(keyref) {
    if (!keyref) return;

    const content = await db.instance().query(
      `
      SELECT
        c.*, h.key_ref 
      FROM
        helpboxes h
      INNER JOIN contents c ON
        c.id = h.content_id
      WHERE
        h.key_ref = :keyref and c.published = true and c."deletedAt" is NULL
      `,
      {
        replacements: { keyref },
        type: Sequelize.QueryTypes.SELECT,
      },
    );

    return content[0] ?? null;
  }

  async getHelpboxByContentId(content_id) {
    if (!content_id) return;

    const content = await db.instance().query(
      `
      SELECT
        h.id, h.key_ref, h.type 
      FROM
        helpboxes h
      WHERE
        h.content_id = :content_id
      `,
      {
        replacements: { content_id },
        type: Sequelize.QueryTypes.SELECT,
      },
    );

    return content.length === 0
      ? null
      : {
          id: content[0].id,
          keyref: content[0].key_ref,
          type: content[0].type,
        };
  }

  async save(entityJSON) {
    if (entityJSON?.id) {
      const updatedHelpbox = await db.instance().query(
        `
          UPDATE helpboxes
          SET key_ref = :keyRef, type = :type
          WHERE content_id = :contentId 
          RETURNING *
        `,
        {
          replacements: {
            type: entityJSON.type,
            keyRef: entityJSON.keyRef,
            contentId: entityJSON.contentId,
          },
          type: Sequelize.QueryTypes.UPDATE,
        },
      );
      return updatedHelpbox[0];
    } else {
      const helpbox = await db.instance().query(
        `
        INSERT INTO helpboxes (type, key_ref, content_id, "createdAt", "updatedAt")
        VALUES (:type, :keyRef, :contentId, NOW(), NOW())
        RETURNING *
      `,
        {
          replacements: {
            type: entityJSON.type,
            keyRef: entityJSON.keyRef,
            contentId: entityJSON.contentId,
          },
          type: Sequelize.QueryTypes.INSERT,
        },
      );

      return helpbox[0];
    }
  }
}

const singletonInstance = new Service();
module.exports = singletonInstance;
