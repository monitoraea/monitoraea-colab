const db = require("../../database");
const Sequelize = require("sequelize");
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');

const secret = process.env.SECRET;
class Service {

  async getMe(id) {
    const sequelize = db.instance();

    let result;

    /* Verify email and password */
    result = await sequelize.query(
      `select * 
      from ${process.env.DB_PREFIX}users 
      where id = :id`,
      {
        replacements: { id },
        type: Sequelize.QueryTypes.SELECT,
      }
    );

    if (!result.length) throw new Error('Me Error!');

    const { email, name } = result[0];

    const membership = await this.getMembership(id);

    /* Alerts */
    let alertCounter = await this.getAlertCounter(id);

    const simplerUser = { id, email, name, membership, alertCounter };

    return {
      user: simplerUser,
      token: jwt.sign(simplerUser, secret)
    };
  }

  async getCommunityAndMembership(communityId, userId) {
    const sequelize = db.instance();

    let result;

    result = await sequelize.query(
      `select c.id, c.alias, c.descriptor_json, c.descriptor_json->>'title' as "name", TRIM(m."type") as "type", m."order"  
      from ${process.env.DB_PREFIX}communities c
      left join ${process.env.DB_PREFIX}members m on m."communityId" = c.id and m."userId" = :userId
      where c.id = :communityId`,
      {
        replacements: { communityId, userId },
        type: Sequelize.QueryTypes.SELECT,
      }
    );

    if (!result.length) throw new Error('Community not found!');

    const community = result[0];

    await this.mergeToolsConfig([community]);

    return community;
  }

  async getMembership(id) {
    const sequelize = db.instance();

    let result;

    result = await sequelize.query(
      `select c.id, c.alias, c.descriptor_json, c.descriptor_json->>'title' as "name", TRIM(m."type") as "type", m."order"  
      from ${process.env.DB_PREFIX}members m
      inner join ${process.env.DB_PREFIX}communities c on c.id = m."communityId" 
      where "userId" = :id
      order by m."order" asc`,
      {
        replacements: { id },
        type: Sequelize.QueryTypes.SELECT,
      }
    );

    await this.mergeToolsConfig(result);

    return result;
  }

  async isMember(id, communities, all = false) {
    if (!Array.isArray(communities)) communities = [communities];

    /* recupera as comunidades que este usuario e' membro e verifica se inclui pelo menos uma das comunidade enviadas */
    const sequelize = db.instance();

    let result;

    result = await sequelize.query(`
      select array_agg(m."communityId") as communities 
      from ${process.env.DB_PREFIX}members m
      where "userId" = :id
      `,
      {
        replacements: { id },
        type: Sequelize.QueryTypes.SELECT,
      }
    );

    /* TODO: all x at least one */

    return result[0].communities.some(c => communities.find(cc => parseInt(cc) === c))
  }

  async login(email, password) {
    const sequelize = db.instance();

    const password_hash = crypto.createHash('md5').update(password).digest("hex");

    let result;

    /* Verify email and password */
    result = await sequelize.query(
      `select * 
      from ${process.env.DB_PREFIX}users 
      where email = :email and password = :password`,
      {
        replacements: { email, password: password_hash },
        type: Sequelize.QueryTypes.SELECT,
      }
    );

    if (!result.length) throw new Error('Login Error!');

    const { id, name } = result[0];

    const membership = await this.getMembership(id);

    /* Alerts */
    result = await sequelize.query(
      `
      select count(*) as total
      from ${process.env.DB_PREFIX}alerts a 
      where a."userId" = :id
      and a."readAt" is null
      and a."canceledAt" is null
      `,
      {
        replacements: { id },
        type: Sequelize.QueryTypes.SELECT,
      }
    )

    /* Alerts */
    let alertCounter = await this.getAlertCounter(id);

    const simplerUser = { id, email, name, membership, alertCounter };
    const tokenUser = { id, email, name };

    return {
      user: simplerUser,
      token: jwt.sign(tokenUser, secret)
    };
  }

  async mergeToolsConfig(communities) {
    const sequelize = db.instance();

    if (!communities.length) return [];

    const allTools = [];
    communities.forEach(({ descriptor_json }) => descriptor_json.tools.forEach(({ id }) => {
      if (id && !allTools.includes(id)) allTools.push(id);
    }));

    let tools = [];
    if (allTools.length)
      tools = await sequelize.query(
        `select id, type, element, descriptor_json from ${process.env.DB_PREFIX}tools where id in(${allTools.join(',')})`,
        {
          type: Sequelize.QueryTypes.SELECT,
        }
      );

    communities.forEach(c => {
      c.descriptor_json.tools = c.descriptor_json.tools.map(cT => {
        const t = tools.find(({ id }) => id === cT.id);
        if (t) {
          cT = { ...t.descriptor_json, ...cT };
          cT.element = t.element;
          cT.type = t.type;
        }

        return cT;
      })
    });

    return communities;
  }

  async getAlertCounter(userId) {
    const sequelize = db.instance();

    /* Alerts */
    let result = await sequelize.query(
      `
      select count(*) as total
      from ${process.env.DB_PREFIX}alerts a 
      where a."userId" = :userId
      and a."readAt" is null
      and a."canceledAt" is null
      `,
      {
        replacements: { userId },
        type: Sequelize.QueryTypes.SELECT,
      }
    )

    return parseInt(result[0].total);
  }

  async requestRecoveryCode(email) {
    /* encontra o email */
    let users = await db.instance().query(
      `
      select u.id, u.name, TRIM(u.recover) as recover
      from ${process.env.DB_PREFIX}users u 
      where u.email = :email
      `,
      {
        replacements: { email },
        type: Sequelize.QueryTypes.SELECT,
      }
    );

    if (!users || !users.length) throw "Requested user not found";

    let user = users[0];

    /* cria codigo */
    let code = user.recover;

    if (!code) {
      code = uuidv4();
      /* grava codigo */
      await db.instance().query(
        `
        update ${process.env.DB_PREFIX}users
        set recover = :code
        where id = :id
        `,
        {
          replacements: { code, id: user.id },
          type: Sequelize.QueryTypes.SELECT,
        }
      );
    }

    return {
      user,
      code,
    };

  }

  async verifyRecoveryCode(code) {
    /* encontra o user */
    let users = await db.instance().query(
      `
      select u.id, u.name
      from ${process.env.DB_PREFIX}users u 
      where u.recover = :code
      `,
      {
        replacements: { code },
        type: Sequelize.QueryTypes.SELECT,
      }
    );

    if (!users || !users.length) return {
      success: false,
      reason: {
        code: 0,
        message: 'recovery code not found',
      }
    };

    return {
      success: true,
      user: users[0],
    }

  }

  async changePasswordUsingRecoveryCode(password, code) {
    const password_hash = crypto.createHash('md5').update(password).digest("hex");

    /* encontra o user */
    const [_, metadata] = await db.instance().query(
      `
      update ${process.env.DB_PREFIX}users
      set recover = NULL, password = :password
      where recover = :code
      `,
      {
        replacements: { code, password: password_hash },
        type: Sequelize.QueryTypes.UPDATE,
      }
    );
    
    return { success: (metadata === 1) };

  }

  async changePassword(user, password) {
    const password_hash = crypto.createHash('md5').update(password).digest("hex");

    /* encontra o user */
    const [_, metadata] = await db.instance().query(
      `
      update ${process.env.DB_PREFIX}users
      set recover = NULL, password = :password
      where id = :id
      `,
      {
        replacements: { id: user.id, password: password_hash },
        type: Sequelize.QueryTypes.UPDATE,
      }
    );
    
    return { success: (metadata === 1) };

  }

}


const singletonInstance = new Service();
module.exports = singletonInstance;

