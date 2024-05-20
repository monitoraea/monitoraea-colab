const Sequelize = require('sequelize');
const db = require('../database');

const { applyJoins, applyWhere, protect } = require('../../utils');

const aws = require('aws-sdk');
const s3ContentBucketName = process.env.S3_CONTENT_BUCKET_NAME;

const s3 = new aws.S3({
  apiVersion: '2006-03-01',

  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
});

const s3ContentURL = process.env.S3_CONTENT_URL;

class Service {
  async getImagesFromGallery(config) {
    let replacements = {
      limit: config.limit,
      offset: (config.page - 1) * config.limit,
    };

    let joins = ['INNER JOIN files f ON f.id = gi.file_id'];
    let where = [];

    const entities = await db.instance().query(
      `
        SELECT 
          gi.id as "imageId"
          , f.id as "fileId"
          , f.content_type
          , f.file_name
        FROM gallery_images gi
        ${applyJoins(joins)} 
        ${applyWhere(where)}
        ORDER BY ${
          !config.last ? `${protect.order(config.order)} ${protect.direction(config.direction)}` : 'gi."createdAt" DESC'
        }
        LIMIT :limit 
        OFFSET :offset
        `,
      {
        replacements,
        type: Sequelize.QueryTypes.SELECT,
      },
    );

    let preparedImages = entities.map(ent => {
      return {
        ...ent,
        fileUrl: `${s3ContentURL}/content/images/${ent.file_name}`,
        // fileUrl: `${s3ContentURL}/${ent.file_name}`, //wall01.jpeg
      };
    });

    const total = entities.length;
    const rawPages = entities.length ? parseInt(total) / config.limit : 0;
    let pages = rawPages === Math.trunc(rawPages) ? rawPages : Math.trunc(rawPages) + 1;
    let hasPrevious = config.page > 1;
    let hasNext = config.page !== pages;

    return {
      images: preparedImages,
      pages,
      total,
      hasPrevious,
      hasNext,
    };
  }

  async saveImage(entityJSON, files) {
    if (!files || !entityJSON) return;

    let fileModel = await this.updateFile(files.file);

    const result = await db.instance().query(
      `
      INSERT INTO gallery_images (file_id) 
      VALUES (:file_id)
      RETURNING id
        `,
      {
        replacements: {
          file_id: fileModel.id,
        },
        type: Sequelize.QueryTypes.SELECT,
      },
    );    

    return { new_image_id: result[0].id };
  }

  async updateFile(file) {
    // S3
    await s3
      .putObject({
        Bucket: s3ContentBucketName,
        Key: `content/images/${file.originalname}`,
        Body: file.buffer,
        ACL: 'public-read',
      })
      .promise();

    const fileModel = await db.models['File'].create({
      file_name: file.originalname,
      url: file.originalname,
      document_type: `content`,
      content_type: `image/jpeg`, //file.content_type?
    });

    return fileModel;
  }

  //TODO: discover who is entityModel before try to remove it at s3.deleteObject
  async removeFile(image_id) {
    let entityModel = await db.instance().query(
      `
        SELECT f.id as "fileId", f.url
        FROM gallery_images g 
        JOIN files f ON f.id = g.file_id 
        WHERE g.id = :image_id 
      `,
      {
        replacements: {
          image_id,
        },
        type: Sequelize.QueryTypes.SELECT,
      },
    );

    let fieldName = 'fileId';

    if (!entityModel) return { fail: 'fileId reference not found' };

    let fileId = entityModel[0][fieldName];

    /* remove file */
    db.models['File'].destroy({
      where: { id: fileId },
    });

    await db.instance().query(`delete from gallery_images where id = :image_id`, {
      replacements: { image_id },
      type: Sequelize.QueryTypes.DELETE,
    });
  }


  async selectImage(gallery_id, image_id) {
    await db.instance().query(
      `
      UPDATE
        gallery_images
      SET
        favorite_image = false
      WHERE
        gallery_id = :gallery_id 
      `,
      {
        replacements: { gallery_id },
        type: Sequelize.QueryTypes.UPDATE,
      },
    );

    if (!image_id) return { success: true };

    let updatedRow = await db.instance().query(
      `
      UPDATE
        gallery_images
      SET
        favorite_image = true
      WHERE
        id = :image_id 
      RETURNING *
      `,
      {
        replacements: { image_id },
        type: Sequelize.QueryTypes.UPDATE,
      },
    );

    //TODO: this works but is very ugly. needs refactor
    let fileInfo = await db.models['File'].findByPk(updatedRow[0][0].file_id);

    let fileUrl = `${s3ContentURL}/content/${fileInfo.id}_${fileInfo.file_name}`;

    return fileUrl;
  }

  
}

const singletonInstance = new Service();
module.exports = singletonInstance;
