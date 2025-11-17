const db = require('../database');
const Sequelize = require('sequelize');

// const FormManager = require('../../FormsManager')
const { check } = require('../../form_utils');

const { /* applyJoins ,*/ applyWhere, /* getIds ,*/ protect, getSegmentedId, parseBBOX } = require('../../utils');

const dayjs = require('dayjs');

const aws = require('aws-sdk');
const s3BucketName = process.env.S3_BUCKET_NAME;

const s3 = new aws.S3({
  apiVersion: '2006-03-01',

  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
});

const { Messagery } = require('dorothy-dna-services');

var fs = require('fs');
const YAML = require('yaml');
const lists_file = fs.readFileSync(require.resolve(`../../../../forms/ciea/lists1.yml`), 'utf8');

const { v4: uuidv4 } = require('uuid');

const defaultLimit = 5;

class Service {
  /* Entity */
  async get(id) {
    const result = await db.instance().query(
      `
      select
        CONCAT('CIEA-',u.sigla) as nome,
        u.nm_estado,
        c.data_criacao,
        c.coordenacao,
        c.coordenacao_especifique,
        c.composicao_cadeiras_soc_civ,
        c.composicao_cadeiras_set_pub,
        c.composicao_cadeiras_outros,
        ppea_tem,
        ppea_decreto,
        ppea_lei,
        ppea_arquivo,
        programa_estadual_tem,
        programa_estadual_decreto,
        programa_estadual_lei,
        programa_estadual_arquivo,
        ppea2_tem,
        ppea2_decreto,
        ppea2_lei,
        ppea2_arquivo,
        plano_estadual_tem,
        plano_estadual_decreto,
        plano_estadual_lei,
        plano_estadual_arquivo,
        f1.url as ppea_link,
        f2.url as ppea2_link,
        f3.url as plano_estadual_link,
        f4.url as programa_estadual_link
      from ciea.comissoes c
      inner join ufs u on u.id = c.uf
      left join files f1 on f1.id = c.ppea_arquivo
      left join files f2 on f2.id = c.ppea2_arquivo
      left join files f3 on f3.id = c.plano_estadual_arquivo
      left join files f4 on f4.id = c.programa_estadual_arquivo
      where c.id = :id
        `,
      {
        replacements: { id },
        type: Sequelize.QueryTypes.SELECT,
      },
    );

    let entity = result[0];

    try {
      const { lists } = YAML.parse(lists_file);
      const tipo_coordenacao = lists.find(i => i.key === 'tipo_coordenacao').options.filter(o => o.value !== -1);

      entity.coordenacao_name = tipo_coordenacao.find(tc => tc.value === entity.coordenacao).label;
    } catch (e) {
      console.log(e);
    }

    return entity;
  }

  async removeDraftTimeline(id, tlId) {
    const timeline = await db.models['Commision_timeline'].findByPk(tlId);

    if (timeline.get('timeline_arquivo')) {
      /* remove file */
      await db.models['File'].destroy({
        where: { id: timeline.get('timeline_arquivo') },
      });
    }

    await db.models['Commision_timeline'].destroy({
      where: {
        id: tlId,
        comissao_id: id,
      },
    });

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
      if (!!tl.url)
        tl.timeline_arquivo = `${process.env.S3_CONTENT_URL}/${this.getFileKey(id, 'timeline_arquivo', tl.url)}`;
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
    else if (timeline_arquivo)
      await this.updateFile(entityModel, timeline_arquivo, 'timeline_arquivo', entityModel.get('comissao_id'));

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

    let commission = {
      /* TODO: dá para simplificar com FormManager */ ...entity[0],
      data_criacao: entity[0].data_criacao ? dayjs(`01-01-${entity[0].data_criacao}`, 'MM-DD-YYYY') : null,
    };

    /* TODO: dá para simplificar com FormManager */
    for (let document of [
      'logo',
      'documento_criacao',
      'regimento_interno',
      'ppea',
      'ppea2',
      'programa_estadual',
      'plano_estadual',
    ]) {
      if (document !== 'logo') commission[`${document}_tipo`] = null;

      if (!!entity[0][`${document}_arquivo`]) {
        const file_entity = await db
          .instance()
          .query(`select f.url, f.file_name, f.content_type from files f where f.id = :file_id`, {
            replacements: { file_id: entity[0][`${document}_arquivo`] },
            type: Sequelize.QueryTypes.SELECT,
          });

        if (file_entity.length) {
          if (document === 'logo' || file_entity[0].content_type !== 'text/uri-list') {
            commission[`${document}_arquivo${document !== 'logo' ? 2 : ''}`] = {
              url: `${process.env.S3_CONTENT_URL}/${this.getFileKey(id, `${document}_arquivo`, file_entity[0].url)}`,
              file: { name: file_entity[0].file_name },
            };
          } else {
            commission[`${document}_arquivo`] = file_entity[0].file_name;
          }

          if (document !== 'logo')
            commission[`${document}_tipo`] = file_entity[0].content_type === 'text/uri-list' ? 'link' : 'file';
        }
      }
    }

    return commission;
  }

  async saveDraft(user, form, entity, files, id) {
    await db.models['Commission'].update(
      {
        ...entity,

        logo_arquivo: undefined /* TODO: files/thumbnail except those in link_or_file */,

        /* TODO: files in link_or_file */ /* ENTENDER!!!!!!! */
        documento_criacao_arquivo: entity.documento_criacao_tipo === null ? null : undefined,
        regimento_interno_arquivo: entity.regimento_interno_tipo === null ? null : undefined,
        ppea_arquivo: entity.ppea_tipo === null ? null : undefined,
        ppea2_arquivo: entity.ppea2_tipo === null ? null : undefined,
        programa_estadual_arquivo: entity.programa_estadual_tipo === null ? null : undefined,
        plano_estadual_arquivo: entity.plano_estadual_tipo === null ? null : undefined,
      },
      {
        where: { id },
      },
    );

    const entityModel = await db.models['Commission'].findByPk(id);

    /* TODO: GENERALIZAR: recuperar em form.yml - files/thumbnai que não em link_or_file <<-- faz sentido, pois é algo que diz respeito somente a esta aplicação e não ao Form */
    if (entity.logo_arquivo === 'remove') await this.removeFile(entityModel, 'logo_arquivo');
    else if (files.logo_arquivo) await this.updateFile(entityModel, files.logo_arquivo, 'logo_arquivo');

    files = {
      /* TODO: recuperar em form - nem precisa existir, pode ser resolvido abaixo */
      logo_arquivo: files.logo_arquivo && files.logo_arquivo.length ? files.logo_arquivo[0] : null,
      documento_criacao_arquivo:
        files.documento_criacao_arquivo && files.documento_criacao_arquivo.length
          ? files.documento_criacao_arquivo[0]
          : null,
      regimento_interno_arquivo:
        files.regimento_interno_arquivo && files.regimento_interno_arquivo.length
          ? files.regimento_interno_arquivo[0]
          : null,
      ppea_arquivo: files.ppea_arquivo && files.ppea_arquivo.length ? files.ppea_arquivo[0] : null,
      ppea2_arquivo: files.ppea2_arquivo && files.ppea2_arquivo.length ? files.ppea2_arquivo[0] : null,
      programa_estadual_arquivo:
        files.programa_estadual_arquivo && files.programa_estadual_arquivo.length
          ? files.programa_estadual_arquivo[0]
          : null,
      plano_estadual_arquivo:
        files.plano_estadual_arquivo && files.plano_estadual_arquivo.length ? files.plano_estadual_arquivo[0] : null,
    };

    // !!!!! form.link_or_file_fields <<-- faz sentido, pois é algo que diz respeito somente a esta aplicação e não ao Form
    /* TODO: GENERALIZAR: recuperar em form.yml - updateFile deveria ser único (util?) */
    for (let wFile of [
      'documento_criacao',
      'regimento_interno',
      'ppea',
      'ppea2',
      'programa_estadual',
      'plano_estadual',
    ]) {
      if (entity[`${wFile}_tipo`] === 'link')
        await this.updateFileModel(entityModel, `${wFile}_arquivo`, entity[`${wFile}_arquivo`], 'text/uri-list');
      else if (entity[`${wFile}_tipo`] === 'file') {
        if (entity[`${wFile}_arquivo2`] === 'remove') await this.removeFile(entityModel, `${wFile}_arquivo`);
        else if (files[`${wFile}_arquivo`])
          await this.updateFile(entityModel, files[`${wFile}_arquivo`], `${wFile}_arquivo`);
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
      where: { id: fileId },
    });

    /* TODO: remove from S3? */
  }

  async updateFile(entityModel, file, fieldName, entityId) {
    // S3
    await s3
      .putObject({
        Bucket: s3BucketName,
        Key: this.getFileKey(entityId || entityModel.get('id'), fieldName, file.originalname),
        Body: file.buffer,
        ACL: 'public-read',
      })
      .promise();

    await this.updateFileModel(
      entityModel,
      fieldName,
      file.originalname,
      file.originalname.includes('.pdf') ? `application/pdf` : `image/jpeg`,
    );
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
    const commissions = await db.instance().query(
      `
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

  async list(page, f_ids, where, limit) {
    const sequelize = db.instance();

    const specificLimit = limit || defaultLimit;

    let query;

    if (f_ids) where = `${where} AND u.id in (${f_ids})`;

    query = `
            select distinct c.id, u.sigla, CONCAT('CIEA-',u.sigla) as nome, u.nm_regiao, c.uf,
            count(*) OVER() AS total_count
            from ciea.comissoes c
            left join ufs u on u.id = c.uf
            ${where}
            order by u.sigla
            LIMIT ${specificLimit}
            OFFSET ${(page - 1) * specificLimit}
        `;

    const instance = await sequelize.query(query, {
      type: Sequelize.QueryTypes.SELECT,
    });

    // bboxes
    for (let i = 0; i < instance.length; i++) {
      const c = instance[i];

      const [bbox] = await sequelize.query(
        `
        with bounds as (
            select ST_Extent(ST_Transform(geom,4326)) as bbox
            from ufs u
            inner join ciea.comissoes c on c.uf = u.id
            where c.id = ${parseInt(c.id)}
            and u.geom is not null
        )
        select ST_YMin(bbox) as y1, ST_XMin(bbox) as x1, ST_YMax(bbox) as y2, ST_XMax(bbox) as x2
        from bounds
        `,
        {
          type: Sequelize.QueryTypes.SELECT,
        },
      );

      instance[i].bbox = bbox && bbox.y1 && bbox.x1 && bbox.y2 && bbox.x2 ? bbox : null;
    }

    const rawPages = instance.length ? parseInt(instance[0]['total_count']) / specificLimit : 0;
    let pages = rawPages === Math.trunc(rawPages) ? rawPages : Math.trunc(rawPages) + 1;
    let hasPrevious = page > 1;
    let hasNext = page !== pages;

    /* instance and members */
    for (let i = 0; i < instance.length; i++) {
      const c = instance[i];

      query = `
      select count(*)::integer as total
      from dorothy_members m
      inner join ciea.comissoes c on c.community_id = m."communityId"
      where c.id = ${c.id}
      `;
      const members = await sequelize.query(query, {
        type: Sequelize.QueryTypes.SELECT,
      });

      c.total_members = !members || !members.length ? 0 : members[0].total;
    }

    return {
      entities: instance,
      pages,
      hasPrevious,
      hasNext,
      currentPage: page,
      total: parseInt(instance.length ? instance[0]['total_count'] : 0),
    };
  }

  async listIDs(f_ids, where) {
    const sequelize = db.instance();

    if (f_ids) where = `${where} AND c.id in (${f_ids})`;

    const query = `
            select distinct c.id
            from ciea.comissoes c
            left join ufs u on u.id = c.uf
            ${where}
            and u.geom is not null
        `;

    const enitities = await sequelize.query(query, {
      type: Sequelize.QueryTypes.SELECT,
    });

    return enitities.map(e => e.id);
  }

  async getUFs(f_regioes) {
    const sequelize = db.instance();

    let where = '';
    if (f_regioes)
      where = `where u.nm_regiao IN (${f_regioes
        .split(',')
        .map(r => `'${r}'`)
        .join(',')})`;

    const query = `
        select distinct u.id as value, upper(u.nm_estado) as "label"
        from ciea.comissoes c
        inner join ufs u on u.id = c.uf
        ${where}
        order by "label"`;

    const ufs = await sequelize.query(query, {
      type: Sequelize.QueryTypes.SELECT,
    });

    return ufs;
  }

  async getOptions(all = false) {
    /* se all, recupera todas as opcoes e nao somente aquelas que participam de projetos */
    const sequelize = db.instance();

    let regioes;
    if (!all) {
      regioes = await sequelize.query(
        `
        select distinct u.nm_regiao as value, upper(u.nm_regiao) as "label"
        from ciea.comissoes c
        inner join ufs u on u.id = c.uf
        where u.nm_regiao <> 'NACIONAL'
        order by "label"`,
        {
          type: Sequelize.QueryTypes.SELECT,
        },
      );
    } else {
      let regions = await this.getAllRegions();

      regioes = regions.list;
    }

    return regioes;
  }

  async sendContact(id, name, email, message) {
    // descobre o id do gt
    let entities;

    entities = await db.instance().query(
      `
      select CONCAT('CIEA-',u.sigla) as nome,
          p.community_id
      from ciea.comissoes p
      inner join ufs u on u.id = p.uf
      where p.id = :id
      `,
      {
        replacements: { id },
        type: Sequelize.QueryTypes.SELECT,
      },
    );

    const projectName = entities[0].nome;
    const communityId = entities[0].community_id;

    // se gt tem membros, envia para gt
    entities = await db.instance().query(
      `
      select count(*) as total
      from dorothy_members dm
      where dm."communityId" = :communityId
      `,
      {
        replacements: { communityId },
        type: Sequelize.QueryTypes.SELECT,
      },
    );

    const hasMembers = entities[0].total > 0;

    // se gt nao tem membros, envia para adm (referindo o GT)
    let room;
    if (hasMembers) room = `room_c${communityId}_t1`;
    else room = `room_c1_t1`;

    /* NOTIFICACAO */

    let content = {
      projectName,
      communityId,
      name,
      email,
      message,
      isADM: !hasMembers,
    };

    await Messagery.sendNotification({ id: 0 }, room, {
      content,
      userId: 0,
      tool: {
        type: 'native',
        element: 'NewContactFromSite',
      },
    });

    return {
      success: true,
    };
  }

  async enterInInitiative(user) {
    /* descobre o id da comunidade rede */
    const result = await db.instance().query(
      `
      select id
      from dorothy_communities dc
      where alias = 'rede_ciea'
    `,
      {
        type: Sequelize.QueryTypes.SELECT,
      },
    );

    const community_id = result[0].id;

    /* torna o criador membro da iniciativa */
    await require('../gt').addMember(community_id, user.id, 'member', 99);

    /* retorna id da comunidade */
    return { communityId: community_id };
  }

  async getGeo(id) {
    const sequelize = db.instance();

    let atuacoes = await sequelize.query(
      `
        select u.id, ST_AsGeoJSON(ST_Transform(u.geom,4326)) as geojson, ST_AsGeoJSON(ST_Envelope(ST_Transform(u.geom,4326))) as bbox
        from ufs u
        inner join ciea.comissoes c on c.uf = u.id
        where c.id = ${parseInt(id)}
        and u.geom is not null
        `,
      {
        type: Sequelize.QueryTypes.SELECT,
      },
    );

    atuacoes = atuacoes.map(a => {
      a.bounds = parseBBOX(a.bbox);

      return a;
    });

    const bbox = await sequelize.query(
      `
        with bounds as (
            select ST_Extent(ST_Transform(geom,4326)) as bbox
            from ufs u
            inner join ciea.comissoes c on c.uf = u.id
            where c.id = ${parseInt(id)}
            and u.geom is not null
        )
        select ST_YMin(bbox) as y1, ST_XMin(bbox) as x1, ST_YMax(bbox) as y2, ST_XMax(bbox) as x2
        from bounds
        `,
      {
        type: Sequelize.QueryTypes.SELECT,
      },
    );

    return {
      atuacoes,
      bbox: bbox[0],
    };
  }

  async getInfoForParticipation(id) {
    const sequelize = db.instance();

    let result;

    result = await sequelize.query(
      `
        select p.id, CONCAT('CIEA-',u.sigla) as nome
        from ciea.comissoes p
        inner join ufs u on u.id = p.uf
        where p.id = ${parseInt(id)}
        and p.versao = 'draft'`,
      {
        type: Sequelize.QueryTypes.SELECT,
      },
    );

    if (!result.length) return null;

    let project = result[0];

    const members = await sequelize.query(
      `
      select count(*)::integer as total
      from dorothy_members m
      inner join ciea.comissoes p on p.community_id = m."communityId"
      where p.versao = 'draft'
      and p.id = ${parseInt(id)}
      `,
      {
        type: Sequelize.QueryTypes.SELECT,
      },
    );

    project.total_members = !members || !members.length ? 0 : members[0].total;

    return project;
  }

  async delete(id, user) {
    const result = await this.getIdFromCommunity(id);

    if (result) {
      let ciea = result.id;

      await db.models['Commission'].destroy({
        where: {
          id: ciea,
        },
      });
    }

    // TODO: remove community and members
    await db.instance().query(
      `
      delete from dorothy_communities
      where id = :id
  `,
      {
        replacements: {
          id: id,
        },
        type: Sequelize.QueryTypes.DELETE,
      },
    );

    await db.instance().query(
      `
      delete from dorothy_members
      where "communityId" = :communityId
  `,
      {
        replacements: {
          communityId: id,
        },
        type: Sequelize.QueryTypes.DELETE,
      },
    );

    // get user membership from DB
    const membership = await db.instance().query(
      `
      select dm."communityId" as id
      from dorothy_members dm
      where dm."userId" = :userId
      `,
      {
        replacements: {
          userId: user.id,
        },
        type: Sequelize.QueryTypes.SELECT,
      },
    );

    if (membership.some(m => m.id === 1)) {
      return 1;
    } else if (membership.some(m => m.id === 603)) {
      return 603;
    } else {
      await require('../gt').addMember(603, user.id);
      return 603;
    }
  }

  async getDraftIndic(form, indic_name, id) {
    const entity = await db.instance().query(
      `
      SELECT
        indicadores as indicadores
      FROM ciea.comissoes p
      WHERE p.id = :id
      AND versao = 'draft'
      AND "deletedAt" is null
        `,
      {
        replacements: { id },
        type: Sequelize.QueryTypes.SELECT,
      },
    );

    let indicator = entity[0].indicadores?.[indic_name];

    // para cada campo file - remove ou atualiza file - substituir valor de file por ID em files
    for (let f of form.fields.filter(f => ['file', 'thumbnail'].includes(f.type))) {
      // console.log({ indicator, key: f.key })

      if (indicator?.[f.key]) {
        // recupera o arquivo
        const fileModel = await db.models['File'].findByPk(indicator[f.key]);
        // substitui o conteudo no campo
        indicator[f.key] = {
          url: `${process.env.S3_CONTENT_URL}/${this.getFileKey_i(id, 'ciea', f.key, fileModel.get('url'))}`,
          file: { name: fileModel.get('file_name') },
        };
      }
    }

    return indicator || {};
  }

  async saveDraftIndic(user, form, indic_name, entity, files, id) {
    const iniciativa = await db.models['Commission'].findOne(
      { where: { id, versao: 'draft' } },
      {
        raw: true,
        nest: true,
      },
    );
    const model = iniciativa.get({ plain: true });

    for (let f of form.fields.filter(f => ['file', 'thumbnail'].includes(f.type))) {
      console.log(f.key, entity[f.key] === 'remove', files[f.key], model.indicadores[indic_name]?.[f.key]);
    }

    // para cada campo file - remove ou atualiza file - substituir valor de file por ID em files
    for (let f of form.fields.filter(f => ['file', 'thumbnail'].includes(f.type))) {
      if (entity[f.key] === 'remove') await this.removeFile_i(entity, f.key, model.indicadores[indic_name]?.[f.key]);
      else if (files[f.key])
        await this.updateFile_i(
          id,
          entity,
          files[f.key][0],
          f.key,
          `ciea_indic_${f.key}`,
          model.indicadores[indic_name]?.[f.key],
        );
      else entity[f.key] = model.indicadores[indic_name]?.[f.key];
    }

    // gravar JSON em indics na posicao certa (indic_name)
    await db.models['Commission'].update(
      { ...model, indicadores: { ...model.indicadores, [indic_name]: entity } },
      {
        where: { id: model.id },
      },
    );

    // console.log('>>>>>>>>', { ...model, indicadores: {...model.indicadores, [indic_name]: entity }})

    return entity;
  }

  async getDraftInfo(id) {
    const entity = await db.instance().query(
      `
      SELECT

        -- more fields

        indicadores,
        ("createdAt" = "updatedAt") as is_new
      FROM ciea.comissoes p
      WHERE id = :id
      AND versao = 'draft'
        `,
      {
        replacements: { id },
        type: Sequelize.QueryTypes.SELECT,
      },
    );

    let iniciative = entity[0];

    return iniciative;
  }

  async verify(id, form, indic_forms) {
    // get data
    const data = await this.getDraftInfo(id);

    if (!data) return null;

    let conclusion = { ready: true };

    let analysis = {
      dims: {},
      indics: {},
      question_problems: [],
      is_new: data.is_new,
    };

    // check INDICATORES
    for (let dbKey of Object.keys(indic_forms)) {
      const dim = dbKey.split('_')[0]; /* DIM */

      analysis.indics[dbKey] = {
        ready: true,
      };
      analysis.dims[dim] = { ready: true };

      const itemData = data.indicadores?.[dbKey];
      const { is_form_valid, fields } = check(indic_forms[dbKey], itemData);

      if (!is_form_valid) {
        analysis.indics[dbKey].ready = false;
        analysis.dims[dim].ready = false;
        conclusion.ready = false;
        for (let f_key of Object.keys(fields)) if (!fields[f_key]) analysis.question_problems.push(`${dbKey}_${f_key}`);
      }
    }

    return {
      ready: conclusion.ready,
      analysis,
    };
  }

  /* *********************** GENERALIZAR.Begin */ /* TODO */
  async removeFile_i(entity, fieldName, fileId) {
    entity[fieldName] = null;

    /* remove file */
    db.models['File'].destroy({
      where: { id: fileId },
    });

    /* TODO: remove from S3? */

    return entity;
  }

  async updateFile_i(id, entity, file, fieldName, document_type, existingFileId) {
    // S3
    await s3
      .putObject({
        Bucket: s3BucketName,
        Key: this.getFileKey_i(id, 'ciea', fieldName, file.originalname),
        Body: file.buffer,
        ACL: 'public-read',
      })
      .promise();

    await this.updateFileModel_i(
      entity,
      fieldName,
      file.originalname,
      file.originalname.includes('.pdf') ? `application/pdf` : `image/jpeg`,
      document_type,
      existingFileId,
    );
  }

  async updateFileModel_i(entity, fieldName, file_name, content_type, document_type, existingFileId) {
    let fileModel;
    if (existingFileId) fileModel = await db.models['File'].findByPk(existingFileId);

    if (!!fileModel) {
      fileModel.file_name = file_name;
      fileModel.url = file_name;
      fileModel.document_type = document_type;
      fileModel.content_type = content_type;

      fileModel.save();
    } else {
      const fileModel = await db.models['File'].create({
        file_name,
        url: file_name,
        document_type: document_type,
        content_type,
      });

      entity[fieldName] = fileModel.id;
    }
  }

  getFileKey_i(id, main_folder, folder, filename) {
    const segmentedId = getSegmentedId(id);

    return `${main_folder}/${segmentedId}/${folder}/original/${filename}`;
  }
  /* *********************** GENERALIZAR.End */
}

const singletonInstance = new Service();
module.exports = singletonInstance;
