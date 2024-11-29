const db = require('../database');
const Sequelize = require('sequelize');

const FormManager = require('../../FormsManager')

const { /* applyJoins ,*/ applyWhere, /* getIds ,*/ protect, getSegmentedId } = require('../../utils');

const dayjs = require('dayjs');

const aws = require('aws-sdk');
const s3BucketName = process.env.S3_BUCKET_NAME;

const s3 = new aws.S3({
  apiVersion: '2006-03-01',

  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,

});

const { v4: uuidv4 } = require('uuid');

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
        (select f.url from files f where f.id = c.ppea_arquivo) as ppea_arquivo,
        c.ppea2_tem = 1 as ppea2_tem,
        c.ppea2_decreto,
        c.ppea2_lei,
        (select f.url from files f where f.id = c.ppea2_arquivo) as ppea2_arquivo,
        c.programa_estadual_tem = 1 as programa_estadual_tem,
        c.programa_estadual_decreto,
        c.programa_estadual_lei,
        (select f.url from files f where f.id = c.programa_estadual_arquivo) as programa_estadual_arquivo,
        c.plano_estadual_tem = 1 as plano_estadual_tem,
        c.plano_estadual_decreto,
        c.plano_estadual_lei,
        (select f.url from files f where f.id = c.plano_estadual_arquivo) as plano_estadual_arquivo
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

  async removeDraftTimeline(id, tlId) {
    const timeline = await db.models['Commision_timeline'].findByPk(tlId);

    if (timeline.get('timeline_arquivo')) {
      /* remove file */
      await db.models['File'].destroy({
        where: { id: timeline.get('timeline_arquivo') }
      });
    }

    await db.models['Commision_timeline'].destroy({
      where: {
        id: tlId,
        comissao_id: id,
      }
    })

    return true;
  }

  async getDraftTimeline(id) {
    const commissionTLs = await db.instance().query(
      `
      SELECT
          lt.id, 
          lt."date",
          lt.texto,
          f.url,
          f.file_name 
      FROM ciea.linhas_do_tempo lt
      left join files f on f.id = lt.timeline_arquivo
      WHERE lt.comissao_id = :id
      order by lt."date"
        `,
      {
        replacements: { id },
        type: Sequelize.QueryTypes.SELECT,
      },
    );

    for (let tl of commissionTLs) {
      if (!!tl.url) tl.timeline_arquivo = `${process.env.S3_CONTENT_URL}/${this.getFileKey(id, 'timeline_arquivo', tl.url)}`;
    }

    return commissionTLs;
  }

  async saveDraftTimeline(user, entity, timeline_arquivo, id, tlid) {

    let entityModel;
    if (!tlid) {
      entityModel = await db.models['Commision_timeline'].create({
        ...entity,
        comissao_id: id,
        timeline_arquivo: undefined,
      });
    } else {
      // recupera
      entityModel = await db.models['Commision_timeline'].findByPk(tlid);
      // atualiza
      entityModel.date = entity.date;
      entityModel.texto = entity.texto;
      // salva
      entityModel.save();
    }

    if (entity.timeline_arquivo === 'remove') await this.removeFile(entityModel, 'timeline_arquivo');
    else if (timeline_arquivo) await this.updateFile(entityModel, timeline_arquivo, 'timeline_arquivo', entityModel.get('comissao_id'));

    return entityModel;
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
        c.regimento_interno,
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
        c.ppea2_tem,
        c.ppea2_decreto,
        c.ppea2_lei,
        c.ppea2_arquivo,
        c.programa_estadual_tem,
        c.programa_estadual_decreto,
        c.programa_estadual_lei,
        c.programa_estadual_arquivo,
        c.plano_estadual_tem,
        c.plano_estadual_decreto,
        c.plano_estadual_lei,
        c.plano_estadual_arquivo,
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

    let commission = { /* TODO: dá para simplificar com FormManager */
      ...entity[0],
      data_criacao: entity[0].data_criacao ? dayjs(`01-01-${entity[0].data_criacao}`, "MM-DD-YYYY") : null,
    };

    /* TODO: dá para simplificar com FormManager */
    for (let document of ['logo', 'documento_criacao', 'regimento_interno', 'ppea', 'ppea2', 'programa_estadual', 'plano_estadual']) {
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

  async saveDraft(user, form, body, files, id) {
    const form1 = await FormManager.getForm('ciea/form1')

    /* Transformations */
    const entity = FormManager.parse(form1, body.entity)    

    await db.models['Commission'].update({
      ...entity,

      logo_arquivo: undefined, /* TODO: files/thumbnail except those in link_or_file */

      /* TODO: files in link_or_file */ /* ENTENDER!!!!!!! */
      documento_criacao_arquivo: entity.documento_criacao_tipo === null ? null : undefined,
      regimento_interno_arquivo: entity.regimento_interno_tipo === null ? null : undefined,
      ppea_arquivo: entity.ppea_tipo === null ? null : undefined,
      ppea2_arquivo: entity.ppea2_tipo === null ? null : undefined,
      programa_estadual_arquivo: entity.programa_estadual_tipo === null ? null : undefined,
      plano_estadual_arquivo: entity.plano_estadual_tipo === null ? null : undefined,

    }, {
      where: { id }
    });

    const entityModel = await db.models['Commission'].findByPk(id);

    /* TODO: GENERALIZAR: recuperar em form.yml - files/thumbnai que não em link_or_file <<-- faz sentido, pois é algo que diz respeito somente a esta aplicação e não ao Form */
    if (entity.logo_arquivo === 'remove') await this.removeFile(entityModel, 'logo_arquivo');
    else if (files.logo_arquivo) await this.updateFile(entityModel, files.logo_arquivo, 'logo_arquivo');

    files = { /* TODO: recuperar em form - nem precisa existir, pode ser resolvido abaixo */
      logo_arquivo: files.logo_arquivo && files.logo_arquivo.length ? files.logo_arquivo[0] : null,
      documento_criacao_arquivo: files.documento_criacao_arquivo && files.documento_criacao_arquivo.length ? files.documento_criacao_arquivo[0] : null,
      regimento_interno_arquivo: files.regimento_interno_arquivo && files.regimento_interno_arquivo.length ? files.regimento_interno_arquivo[0] : null,
      ppea_arquivo: files.ppea_arquivo && files.ppea_arquivo.length ? files.ppea_arquivo[0] : null,
      ppea2_arquivo: files.ppea2_arquivo && files.ppea2_arquivo.length ? files.ppea2_arquivo[0] : null,
      programa_estadual_arquivo: files.programa_estadual_arquivo && files.programa_estadual_arquivo.length ? files.programa_estadual_arquivo[0] : null,
      plano_estadual_arquivo: files.plano_estadual_arquivo && files.plano_estadual_arquivo.length ? files.plano_estadual_arquivo[0] : null,
    }

    // !!!!! form.link_or_file_fields <<-- faz sentido, pois é algo que diz respeito somente a esta aplicação e não ao Form
    /* TODO: GENERALIZAR: recuperar em form.yml - updateFile deveria ser único (util?) */
    for (let wFile of ['documento_criacao', 'regimento_interno', 'ppea', 'ppea2', 'programa_estadual', 'plano_estadual']) {
      if (entity[`${wFile}_tipo`] === 'link') await this.updateFileModel(entityModel, `${wFile}_arquivo`, entity[`${wFile}_arquivo`], 'text/uri-list');
      else if (entity[`${wFile}_tipo`] === 'file') {
        if (entity[`${wFile}_arquivo2`] === 'remove') await this.removeFile(entityModel, `${wFile}_arquivo`);
        else if (files[`${wFile}_arquivo`]) await this.updateFile(entityModel, files[`${wFile}_arquivo`], `${wFile}_arquivo`);
      }
    }

    return entity;
  }

  async participate(user, id, isADM) {
    /* Recupera o id da comunidade, a partir do id da comissao */
    const community = await db.instance().query(
      `
      select 
        c.community_id,
        dc.descriptor_json->>'title' as "nome"
      from ciea.comissoes c 
      inner join dorothy_communities dc on dc.id = c.community_id 
      where c.id = :id
      `,
      {
        replacements: { id },
        type: Sequelize.QueryTypes.SELECT,
      },
    );

    if (!community) throw new Error('Commission without community');

    const communityId = community[0].community_id;
    const commissionName = community[0].nome;

    return require('../gt').participate(user, communityId, commissionName, isADM);
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

  async updateFile(entityModel, file, fieldName, entityId) {
    // S3
    await s3.putObject({
      Bucket: s3BucketName,
      Key: this.getFileKey(entityId || entityModel.get('id'), fieldName, file.originalname),
      Body: file.buffer,
      ACL: 'public-read',
    }).promise()

    await this.updateFileModel(entityModel, fieldName, file.originalname, file.originalname.includes('.pdf') ? `application/pdf` : `image/jpeg`)
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

      await entityModel.save();
    }
  }

  async getListForUser(user) {
    const commissions = await db.instance().query(`
    with commissions as (
      select 
        c.id,
        dc.id as "community_id",
        dc.descriptor_json->>'title' as "name",
        count(dm.*) > 0 as "has_members"
      from ciea.comissoes c 
      inner join dorothy_communities dc on dc.id = c.community_id 
      left join dorothy_members dm on dm."communityId" = dc.id
      group by c.id, dc.id
    )
    select 
      c.id,
      c.community_id,
      c."name",
      dm."createdAt" is not null as "is_member",
      c."has_members",
      p.id is not null as "is_requesting"
    from commissions c 
    left join dorothy_members dm on dm."communityId" = c.community_id and dm."userId" = :userId
    left join participar p on p."communityId" = c.community_id and p."userId" = :userId and p."resolvedAt" is null 
    order by c."name"
    `,
      {
        replacements: { userId: user.id },
        type: Sequelize.QueryTypes.SELECT,
      },
    );

    return commissions;
  }

  getFileKey(id, folder, filename) {
    const segmentedId = getSegmentedId(id);

    return `ciea/${segmentedId}/${folder}/original/${filename}`;
  }
}

const singletonInstance = new Service();
module.exports = singletonInstance;
