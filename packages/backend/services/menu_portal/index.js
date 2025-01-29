const Sequelize = require('sequelize');
const db = require('../database');
const { move } = require('dorothy-dna-services/router');

const MAX_LEVEL = 2;

class Service {
  async list() {
    const entities = await db.instance().query(
      `
      select * 
      from menu_portal mp 
      where mp."deletedAt" is NULL
      order by mp."order" 
        `,
      {
        type: Sequelize.QueryTypes.SELECT,
      },
    );

    function getLevel(data, level, current_item) {

      let first = true;
      let lastItem = null;
      for (let item of data.filter(i => !!current_item.id ? i.parent_id === current_item.id : !i.parent_id)) {
        let i = { ...item, first, last: false, level, can_children: level < MAX_LEVEL, children: [] };
        first = false;
        lastItem = i;

        // itera filhos
        getLevel(data, level+1, i);

        current_item.children.push(i)
      }
      if(lastItem) lastItem.last = true;

    }
    let root_item = { children: [], id: null };
    getLevel(entities, 0, root_item);

    return root_item;
  }

  async get(id) {
    const entities = await db.instance().query(
      `
      SELECT * FROM menu_portal WHERE id = :id;
        `,
      {
        replacements: { id },
        type: Sequelize.QueryTypes.SELECT,
      },
    );

    return entities[0];
  }

  async save(model, id) {

    if (model.type !== 'page') model.content_id = null;
    else if (model.type !== 'link') {
      model.link = null;
      model.blank = false;
    }

    if (!id) { // INSERT
      // Empurra irmaos que tem order igual ou maior
      await db.instance().query(
        `
          UPDATE menu_portal 
          SET "order" = "order"+1
          WHERE parent_id = :parent_id
          AND "order" >= :newOrder
        `,
        {
          replacements: {
            parent_id: model.parent_id,
            newOrder: model.order,
          },
          type: Sequelize.QueryTypes.UPDATE,
        },
      );

      await db.instance().query(
        `
      INSERT INTO menu_portal
      (title, link, content_id, parent_id, "type", "createdAt", "updatedAt", "order", blank)
      VALUES(:title, :link, :content_id, :parent_id, :type, now(), now(), :order, :blank);
      `,
        {
          replacements: {
            parent_id: model.parent_id || null,
            title: model.title,
            link: model.link,
            content_id: model.content_id || null,
            type: model.type,
            order: model.order,
            blank: model.blank,
          },
          type: Sequelize.QueryTypes.INSERT,
        },
      );
    } else { // EDIT
      await db.instance().query(
        `
      UPDATE menu_portal
      SET title = :title,
          link = :link,
          content_id = :content_id,
          type = :type,
          "updatedAt" = NOW(),
          blank = :blank
      WHERE id = :id
      `,
        { /* TODO: order */
          replacements: {
            title: model.title,
            link: model.link,
            content_id: model.content_id || null,
            type: model.type,
            blank: model.blank,
            id,
          },
          type: Sequelize.QueryTypes.INSERT,
        },
      );
    }

    return { success: true };
  }

  async move(id, movement) {
    const item = await this.get(id);

    // console.log({ movement, originalPos: item.order })

    let newOrder;
    if (movement === 'down') {
      newOrder = item.order + 1;
    } else {
      newOrder = item.order - 1;
    }

    // se tiver algum irmao na nova posicao, troca a posicao dele
    await db.instance().query(
      `
        UPDATE menu_portal 
        SET "order" = :oldOrder
        WHERE parent_id = :parent_id
        AND "order" = :newOrder
      `,
      {
        replacements: {
          parent_id: item.parent_id,
          oldOrder: item.order,
          newOrder,
        },
        type: Sequelize.QueryTypes.UPDATE,
      },
    );

    // muda a order do item
    await db.instance().query(
      `
        UPDATE menu_portal 
        SET "order" = :newOrder
        WHERE id = :id
      `,
      {
        replacements: {
          id,
          newOrder,
        },
        type: Sequelize.QueryTypes.UPDATE,
      },
    );

    return { success: true };
  }

  async moveOut(id) {

    const entities = await db.instance().query(
      `
      SELECT parent_id FROM menu_portal WHERE id = :id
      `,
      {
        replacements: {
          id,
        },
        type: Sequelize.QueryTypes.SELECT,
      },
    );

    const parent_id = entities[0].parent_id;

    const parent_entities = await db.instance().query(
      `
      SELECT parent_id FROM menu_portal WHERE id = :parent_id
      `,
      {
        replacements: {
          parent_id,
        },
        type: Sequelize.QueryTypes.SELECT,
      },
    );

    const grand_parent_id = parent_entities[0].parent_id;

    const parent_children = await db.instance().query(
      `
      SELECT count(*) as total FROM menu_portal WHERE parent_id = :grand_parent_id
      `,
      {
        replacements: {
          grand_parent_id,
        },
        type: Sequelize.QueryTypes.SELECT,
      },
    );

    const total_children = parent_children[0].total;

    await db.instance().query(
      `
        UPDATE menu_portal 
        SET "order" = :order,
            parent_id = :grand_parent_id
        WHERE id = :id
      `,
      {
        replacements: {
          id,
          grand_parent_id,
          order: total_children+1,
        },
        type: Sequelize.QueryTypes.UPDATE,
      },
    );

    await this.stabilizeSiblingsOrder(parent_id);
  }

  async stabilizeSiblingsOrder(parent_id) {
    await db.instance().query(`
    with in_order as (
      select mp.id,ROW_NUMBER () OVER (ORDER BY mp."order") as idx
      from menu_portal mp
      where parent_id = :parent_id
      and "deletedAt" is null
      order by mp."order"
    )
    UPDATE menu_portal
    SET "order" = idx
    FROM in_order
    WHERE menu_portal.id = in_order.id
    `,
      {
        replacements: {
          parent_id,
        },
        type: Sequelize.QueryTypes.UPDATE,
      },
    );
  }

  async delete(id) {

    const entities = await db.instance().query(
      `
      SELECT parent_id FROM menu_portal WHERE id = :id
      `,
      {
        replacements: {
          id,
        },
        type: Sequelize.QueryTypes.SELECT,
      },
    );

    const updatedMenu = await db.instance().query(
      `
        UPDATE menu_portal 
        SET "deletedAt" = now()
        WHERE id = :id
        RETURNING *
      `,
      {
        replacements: {
          id,
        },
        type: Sequelize.QueryTypes.UPDATE,
      },
    );

    await this.stabilizeSiblingsOrder(entities[0].parent_id);

    return updatedMenu[0];
  }
}

const singletonInstance = new Service();
module.exports = singletonInstance;
