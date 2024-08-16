const db = require('../database');
const Sequelize = require('sequelize');

const { /* applyJoins ,*/ applyWhere, /* getIds ,*/ protect, getSegmentedId } = require('../../utils');

const dayjs = require('dayjs');

const aws = require('aws-sdk');
const s3BucketName = process.env.S3_BUCKET_NAME;

const s3 = new aws.S3({
  apiVersion: '2006-03-01',

  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,

});

class Service {
  /* Entity */
  async get(id) {
    const entity = await db.instance().query(
      `
      SELECT
        u.nm_estado,
        u.nm_regiao,
        c.link,
        c.data_criacao,
        c.documento_criacao,
        (select f.url from files f where f.id = c.documento_criacao_arquivo) as documento_criacao_arquivo,
        c.regimento_interno,
        (select f.url from files f where f.id = c.regimento_interno_arquivo) as regimento_interno_arquivo,
        c.ppea_tem = 1 as ppea_tem,
        c.ppea_decreto,
        c.ppea_lei,
        (select f.url from files f where f.id = c.ppea_arquivo) as ppea_arquivo
      FROM ciea.comissoes c
      inner join ufs u on u.id = c.uf
      WHERE c.id = :id
        `,
      {
        replacements: { id },
        type: Sequelize.QueryTypes.SELECT,
      },
    );

    return entity[0];
  }


  async getDraft(id) {
    const entity = await db.instance().query(
      `
      SELECT
        c.uf,
        u.nm_estado as uf_nome,        
        u.nm_regiao as regiao,
        c.logo_arquivo,
        c.link,
        c.data_criacao,
        c.ativo,
        c.documento_criacao,
        c.documento_criacao_arquivo,
        c.regimento_interno_tem,
        c.regimento_interno_arquivo,
        c.composicao_cadeiras_set_pub,
        c.composicao_cadeiras_soc_civ,
        c.composicao_cadeiras_outros,
        c.coordenacao,
        c.coordenacao_especifique,
        c.org_interna_periodicidade,
        c.organizacao_interna_periodicidade_especifique,
        c.organizacao_interna_estrutura_tem,
        c.organizacao_interna_estrutura_especifique,
        c.ppea_tem,
        c.ppea_decreto,
        c.ppea_lei,
        c.ppea_arquivo,
        c.membros
      FROM ciea.comissoes c
      inner join ufs u on u.id = c.uf
      WHERE c.id = :id
      AND versao = 'draft'
        `,
      {
        replacements: { id },
        type: Sequelize.QueryTypes.SELECT,
      },
    );

    let commission = {
      ...entity[0],
      data_criacao: entity[0].data_criacao ? dayjs(`01-01-${entity[0].data_criacao}`, "MM-DD-YYYY") : null,
      regimento_interno_tem: !entity[0].regimento_interno_tem ? null : (entity[0].regimento_interno_tem ? '1' : '0'),
    };

    for (let document of ['logo', 'documento_criacao', 'regimento_interno', 'ppea']) {
      if (document !== 'logo') commission[`${document}_tipo`] = null;
      
      if (!!entity[0][`${document}_arquivo`]) {
        const file_entity = await db.instance().query(
          `select f.url, f.file_name, f.content_type from files f where f.id = :file_id`,
          { replacements: { file_id: entity[0][`${document}_arquivo`] }, type: Sequelize.QueryTypes.SELECT }
        );

        if (file_entity.length) {
          if (document === 'logo' || file_entity[0].content_type !== 'text/uri-list') {
            commission[`${document}_arquivo${document !== 'logo' ? 2 : ''}`] = {
              url: `${process.env.S3_CONTENT_URL}/${this.getFileKey(id, `${document}_arquivo`, file_entity[0].url)}`,
              file: { name: file_entity[0].file_name },
            };
          } else {
            commission[`${document}_arquivo`] = file_entity[0].file_name;
          }

          if (document !== 'logo') commission[`${document}_tipo`] = file_entity[0].content_type === 'text/uri-list' ? 'link' : 'file';
        } 
      }
    }

    return commission;
  }

  async saveDraft(user, entity, files, id) {

    /* Transformations */
    if (!!entity.data_criacao) entity.data_criacao = dayjs(entity.data_criacao).year();

    await db.models['Commission'].update({
      ...entity,
      logo_arquivo: undefined,
      documento_criacao_arquivo: entity.documento_criacao_tipo === 'none' ? null : undefined,
    }, {
      where: { id }
    });

    const entityModel = await db.models['Commission'].findByPk(id);

    if (entity.logo_arquivo === 'remove') await this.removeFile(entityModel, 'logo_arquivo');
    else if (files.logo_arquivo) await this.updateFile(entityModel, files.logo_arquivo, 'logo_arquivo');

    if (entity.documento_criacao_tipo === 'link') await this.updateFileModel(entityModel, 'documento_criacao_arquivo', entity.documento_criacao_arquivo, 'text/uri-list');
    else if (entity.documento_criacao_tipo === 'file') {
      if (entity.documento_criacao_arquivo2 === 'remove') await this.removeFile(entityModel, 'documento_criacao_arquivo');
      else if (files.documento_criacao_arquivo) await this.updateFile(entityModel, files.documento_criacao_arquivo, 'documento_criacao_arquivo');
    }

    return entity;
  }

  /* Retorna o id do projeto relacionado a uma comunidade */
  async getIdFromCommunity(community_id) {
    const sequelize = db.instance();

    let result;

    result = await sequelize.query(
      ` select  c.id
        from ciea.comissoes c
        where c.community_id = :community_id`,
      {
        replacements: { community_id },
        type: Sequelize.QueryTypes.SELECT,
      },
    );

    if (!result.length) return null;

    const id = result[0].id;

    return { id };
  }

  async removeFile(entityModel, fieldName) {

    let fileId = entityModel.get(fieldName);
    entityModel.set(fieldName, null);

    entityModel.save();

    /* remove file */
    db.models['File'].destroy({
      where: { id: fileId }
    });

    /* TODO: remove from S3? */
  }

  async updateFile(entityModel, file, fieldName) {
    // S3
    await s3.putObject({
      Bucket: s3BucketName,
      Key: this.getFileKey(entityModel.get('id'), fieldName, file.originalname),
      Body: file.buffer,
      ACL: 'public-read',
    }).promise()

    this.updateFileModel(entityModel, fieldName, file.originalname, file.originalname.includes('.pdf') ? `application/pdf` : `image/jpeg`)
  }

  async updateFileModel(entityModel, fieldName, file_name, content_type) {
    let fileModel;
    if (!!entityModel[fieldName]) {
      fileModel = await db.models['File'].findByPk(entityModel[fieldName]);
    }

    if (!!fileModel) {

      fileModel.file_name = file_name;
      fileModel.url = file_name;
      fileModel.document_type = `ciea_${fieldName}`;
      fileModel.content_type = content_type;

      fileModel.save();
    } else {
      const fileModel = await db.models['File'].create({
        file_name,
        url: file_name,
        document_type: `ciea_${fieldName}`,
        content_type,
      });

      entityModel.set(fieldName, fileModel.id);

      entityModel.save();
    }
  }

  getFileKey(id, folder, filename) {
    const segmentedId = getSegmentedId(id);

    return `ciea/${segmentedId}/${folder}/original/${filename}`;
  }
}

const singletonInstance = new Service();
module.exports = singletonInstance;
