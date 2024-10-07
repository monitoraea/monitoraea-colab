const Sequelize = require('sequelize');
const db = require('../database');

const { applyJoins, applyWhere, getSegmentedId } = require('../../utils');

const crypto = require('crypto');

const aws = require('aws-sdk');
const s3BucketName = process.env.S3_BUCKET_NAME;

const s3 = new aws.S3({
  apiVersion: '2006-03-01',

  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
});

const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const dayjs = require('dayjs');

const { User } = require('dorothy-dna-services');

const perspectives_networks = {
  pppzcm: process.env.PPPZCM_NETWORK_GT,
  ciea: process.env.CIEA_NETWORK_GT,
}

class Service {
  /* Entity */
  async requestRecoveryCode(email) {
    const { code, user } = await User.requestRecoveryCode(email);

    /* send email */

    const to = `${user.name} <${email}>`;

    const message = `Link para recuperação de senha: <a href="${process.env.PLATFORM_URL}login/recuperar/${code}">clique aqui</a>`;

    const msg = {
      to,
      from: process.env.CONTACT_EMAIL,
      subject: `Recuperação de senha`,
      html: message,
    };

    await sgMail.send(msg);

    return code;
  }

  async thumb(id) {
    const entities = await db.instance().query(`
    SELECT u.id, u.avatar
    from dorothy_users u
    where u.id = :id
    `, {
      replacements: { id },
      type: Sequelize.QueryTypes.SELECT,
    });

    /* Tem foto? Nao tem? */

    if (!entities.length || !entities[0].avatar) {
      return await s3.getObject({ // S3
        Bucket: s3BucketName,
        Key: `users/no_photo.png`,
      }).promise();
    }

    return await s3.getObject({ // S3
      Bucket: s3BucketName,
      Key: this.getFileKey(id, entities[0].avatar),
    }).promise();
  }

  async signup({ email, name, password, perspectives }) {
    let result;

    /* Verify email */
    result = await db.instance().query(`select count(*)::int as total from dorothy_users where email = :email`, {
      replacements: { email },
      type: Sequelize.QueryTypes.SELECT,
    });

    if (result[0].total !== 0) return { fail: 'email' };

    /* Cadastra usuario */
    result = await db.instance().query(
      `insert into dorothy_users(name, email, password, "createdAt", "updatedAt")
            values(:name, :email, :password, NOW(), NOW() )
            RETURNING id`,
      {
        replacements: { name, email, password: crypto.createHash('md5').update(password).digest('hex') },
        type: Sequelize.QueryTypes.SELECT,
      },
    );

    const newUserId = result[0].id; /* recupera o id recem criado */

    /* Torna o usuario membro das redes das perspectivas selecionadas */

    for(let p of perspectives)
      await require('../gt').addMember(perspectives_networks[p], newUserId, 'member', 1);

    return { success: true };
  }

  async isFollowing(userId, room) {
    const entities = await db.instance().query(
      `
        SELECT f.id
        from dorothy_following f
        where f."userId" = :userId and f.room = :room
        `,
      {
        replacements: { userId, room },
        type: Sequelize.QueryTypes.SELECT,
      },
    );

    return {
      following: !!entities.length,
    }
  }

  async follow(userId, room, communityId, following) {

    const entities = await db.instance().query(
      `
        SELECT f.id
        from dorothy_following f
        where f."userId" = :userId and f.room = :room
        `,
      {
        replacements: { userId, room },
        type: Sequelize.QueryTypes.SELECT,
      },
    );

    if (!!entities.length && !following) {
      /* DELETE */
      await db.instance().query(
        `
        DELETE FROM dorothy_following
        where "userId" = :userId and room = :room
        `,
        {
          replacements: { userId, room },
          type: Sequelize.QueryTypes.DELETE,
        },
      );
    }

    if (!entities.length && following) {
      /* INSERT */


      await db.instance().query(
        `
        INSERT INTO dorothy_following("userId", room, "communityId")
        VALUES(:userId, :room, :communityId )
        `,
        {
          replacements: { userId, room, communityId },
          type: Sequelize.QueryTypes.INSERT,
        },
      );
    }

    return { success: true };
  }

  async setThumb(user, thumb) {

    const fileName = `${dayjs().format('YYYY.MM.DD')}.jpg`;

    await s3.putObject({
      Bucket: s3BucketName,
      Key: this.getFileKey(user.id, fileName),
      Body: thumb.buffer,
      ACL: 'public-read',
      ContentEncoding: 'base64',
      ContentType: 'image/jpeg',
    }).promise()

    await db.instance().query(`
    UPDATE dorothy_users
    SET avatar = :fileName
    where id = :id
    `, {
      replacements: { id: user.id, fileName },
      type: Sequelize.QueryTypes.UPDATE,
    });

    return { success: true }
  }

  async hasThumb(id) {
    const entities = await db.instance().query(`
    SELECT u.id, u.avatar
    from dorothy_users u
    where u.id = :id
    `, {
      replacements: { id },
      type: Sequelize.QueryTypes.SELECT,
    });

    return (!!entities.length && !!entities[0].avatar);
  }

  async removeThumb(id) {
    await db.instance().query(`
    UPDATE dorothy_users
    SET avatar = NULL
    where id = :id
    `, {
      replacements: { id },
      type: Sequelize.QueryTypes.UPDATE,
    });

    return { success: true };
  }

  async getExtendedInfo(id) {
    const entities = await db.instance().query(`
    SELECT 
        du.id,
        du."name",
        coalesce(u.about,'') as about
    from dorothy_users du
    left join user_ext_info u on u.id = du.id
    where du.id = :id
    `, {
      replacements: { id },
      type: Sequelize.QueryTypes.SELECT,
    });

    return entities[0];
  }



  async setExtendedInfo(id, data) {
    await db.instance().query(`
    UPDATE dorothy_users 
    set "name" = :name
    where id = :id
    `, {
      replacements: { id, name: data.name },
      type: Sequelize.QueryTypes.UPDATE,
    });

    await db.instance().query(`
    insert into user_ext_info(id, about) 
    values(:id, :about)
    ON CONFLICT ON CONSTRAINT user_ext_info_pk
    do update set about = :about 
    `, {
      replacements: { id, about: data.about },
      type: Sequelize.QueryTypes.UPDATE,
    });

    return { success: true }
  }

  getFileKey(id, filename) {

    const segmentedId = getSegmentedId(id);

    return `users/${segmentedId}/original/${filename}`;
  }

}

const singletonInstance = new Service();
module.exports = singletonInstance;
