const Sequelize = require('sequelize');
const db = require('../database');

class Service {
  async getMenu() {
    const menus = await db.instance().query(
      `
        SELECT 
         id
        , title
        , link 
        , "type"
        , content_id
        , blank
        FROM 
          menu 
        WHERE 
          "deletedAt" IS NULL 
          AND menu_parent_id IS NULL
        ORDER by "order"
        `,
      {
        type: Sequelize.QueryTypes.SELECT,
      },
    );

    return menus;
  }

  async getMenuById(menu_id) {
    const menu = await db.instance().query(
      `
      SELECT * FROM menu WHERE id = :menu_id;
        `,
      {
        replacements: { menu_id },
        type: Sequelize.QueryTypes.SELECT,
      },
    );

    return menu[0];
  }

  async getMenuChilds(menu_parent_id) {
    const childs = await db.instance().query(
      `
      SELECT * FROM menu WHERE menu_parent_id = :menu_parent_id and "deletedAt" is null order by "order";
        `,
      {
        replacements: { menu_parent_id },
        type: Sequelize.QueryTypes.SELECT,
      },
    );
    return childs;
  }

  async saveMenu(isAdm, entityJSON) {
    if (!isAdm || isAdm === false) return;

    const post = await db.instance().query(
      `
        INSERT INTO menu (menu_parent_id, title, link, content_id, type, blank)
        VALUES (:menu_parent_id, :title, :link, :content_id, :type, :blank)
        RETURNING *
      `,
      {
        replacements: {
          menu_parent_id: entityJSON.menu_parent_id || null,
          title: entityJSON.title,
          link: entityJSON.link,
          content_id: entityJSON.content_id || null,
          type: entityJSON.type,
          blank: entityJSON.blank,
        },
        type: Sequelize.QueryTypes.INSERT,
      },
    );

    return post[0];
  }

  async deleteMenu(menu_id) {

    const updatedMenu = await db.instance().query(
      `
        UPDATE menu SET "deletedAt" = now()
        WHERE id = :menu_id
        RETURNING *
      `,
      {
        replacements: {
          menu_id,
        },
        type: Sequelize.QueryTypes.UPDATE,
      },
    );

    return updatedMenu[0];
  }

  async updateMenu(menu_id, entityJSON) {
    if (!entityJSON.isAdm) return;

    const entity = entityJSON.entity;

    const updatedMenu = await db.instance().query(
      `
        UPDATE menu SET 
          title = :title, 
          link = :link, 
          content_id = :content_id, 
          menu_parent_id = :menu_parent_id, 
          "type" = :type,
          blank = :blank
        WHERE id = :menu_id
        RETURNING *
      `,
      {
        replacements: {
          menu_id,
          title: entity.title,
          link: entity.link,
          content_id: entity.content_id,
          menu_parent_id: entity.menu_parent_id,
          type: entity.type,
          blank: entity.blank,
        },
        type: Sequelize.QueryTypes.UPDATE,
      },
    );

    return updatedMenu[0];
  }
}

const singletonInstance = new Service();
module.exports = singletonInstance;
