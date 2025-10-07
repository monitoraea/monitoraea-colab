const db = require('../database');
const Sequelize = require('sequelize');

const { applyWhere, parseBBOX, protect } = require('../../utils');

const removeAccents = require('remove-accents');
const dayjs = require('dayjs');

const AdmZip = require('adm-zip');

const { check } = require('../../form_utils');

const shapefile = require('shapefile');
const simplify = require('simplify-geojson');

const FormManager = require('../../FormsManager');

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
const lists_file = fs.readFileSync(require.resolve(`../../../../forms/educom_clima/lists1.yml`), 'utf8');

class Service {
  /* Entity */
  async get(id) {
    const result = await db.instance().query(
      `
      SELECT
        p.id,
        p.nome,
        p.temas,
        p.midias,
        p.apresentacao,
        p.materiais_didaticos,
        p.estrategias_educativas,
        p.conte_mais,
        p.nivel,
        p.definicao,
        p.redes_sociais,
        p.faixa_etaria,
        p.participantes_genero,
        p.racas_etnias,
        array_agg(u.sigla_uf) as ufs
      FROM educom_clima.iniciativas p
      left join br_uf u on u.cd_uf::smallint = any(p.uf)
      WHERE p.iniciativa_id = :id
      AND versao = 'current'
      group by 1
        `,
      {
        replacements: { id },
        type: Sequelize.QueryTypes.SELECT,
      },
    );

    let entity = result[0];

    try {
      const { lists } = YAML.parse(lists_file);

      const tipo_nivel = lists.find(i => i.key === 'nivel').options.filter(o => o.value !== -1);
      entity.nivel = entity.nivel.map(n => tipo_nivel.find(ta => ta.value === n).label);

      const tipo_definicao = lists.find(i => i.key === 'definicao').options.filter(o => o.value !== -1);
      entity.definicao = tipo_definicao.find(ta => ta.value === entity.definicao).label;

      const tipo_faixa = lists.find(i => i.key === 'faixa_etaria').options.filter(o => o.value !== -1);
      entity.faixa_etaria = entity.faixa_etaria.map(n => tipo_faixa.find(ta => ta.value === n).label);

      const tipo_genero = lists.find(i => i.key === 'participantes_genero').options.filter(o => o.value !== -1);
      entity.participantes_genero = entity.participantes_genero.map(n => tipo_genero.find(ta => ta.value === n).label);

      const tipo_etnia = lists.find(i => i.key === 'racas_etnias').options.filter(o => o.value !== -1);
      entity.racas_etnias = entity.racas_etnias.map(n => tipo_etnia.find(ta => ta.value === n).label);
    } catch (e) {
      console.log(e);
    }

    return entity;
  }

  async getGeo(id) {
    const sequelize = db.instance();

    let atuacoes = await sequelize.query(
      `
        select u.id, ST_AsGeoJSON(u.geom) as geojson, ST_AsGeoJSON(ST_Envelope(u.geom)) as bbox
        from br_uf u
        inner join educom_clima.iniciativas p on u.cd_uf::smallint = any(p.uf) and p.versao = 'current'
        where p.iniciativa_id =  ${parseInt(id)}
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
          select ST_Extent(geom) as bbox
          from br_uf u
          inner join educom_clima.iniciativas p on u.cd_uf = any(p.uf::text[])
          where p.iniciativa_id = ${parseInt(id)}
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

  async getDraftInfo(iniciativa_id) {
    const entity = await db.instance().query(
      `
      SELECT
        p.*
      FROM educom_clima.iniciativas p
      WHERE p.iniciativa_id = :iniciativa_id
      AND versao = 'draft'
        `,
      {
        replacements: { iniciativa_id },
        type: Sequelize.QueryTypes.SELECT,
      },
    );

    let policy = entity[0];

    return policy;
  }

  async verify(id, form, indic_forms) {
    // get data
    const data = await this.getDraftInfo(id);

    if (!data) return null;

    let conclusion = { ready: true };

    let analysis = {
      information: {},
      connections: true,
      dims: {},
      indics: {},
      geo: true,
      question_problems: [],
      is_new: data.is_new,
    };

    // ATUACAO
    if (data.atuacao_aplica === null) {
      analysis.geo = false;
      conclusion.ready = false;
    }
    if (data.atuacao_aplica === false && (!data.atuacao_naplica_just || !data.atuacao_naplica_just.length)) {
      analysis.geo = false;
      conclusion.ready = false;

      if (!data.atuacao_naplica_just || !data.atuacao_naplica_just.length)
        analysis.question_problems.push('naplica_just');
    }

    // check INFORMACOES
    const { is_form_valid, fields } = check(form, data);
    if (!is_form_valid) conclusion.ready = false;
    analysis.information = { ...fields };

    // check INDICATORES
    for (let dbKey of Object.keys(indic_forms)) {
      const dim = dbKey.split('_')[0]; /* DIM */

      analysis.indics[dbKey] = {
        ready: true,
      };
      analysis.dims[dim] = { ready: true };

      const itemData = data.indicadores2024[dbKey];
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

  async saveDraft(user, form, entity, files, id) {
    if (!!id) {
      delete entity.id;
      delete entity.versao;

      // atualiza tanto draft quanto current, por enquanto
      await db.models['Educom_clima'].update(entity, {
        where: { iniciativa_id: id },
      });
    } else {
      const result = await db.instance().query(
        `
      SELECT MAX(iniciativa_id)+1 as next from educom_clima.iniciativas
      `,
        {
          type: Sequelize.QueryTypes.SELECT,
        },
      );

      const iniciativa_id = result[0].next;

      // current e draft por enquanto
      await db.models['Educom_clima'].create({ ...entity, versao: 'draft', iniciativa_id });
      await db.models['Educom_clima'].create({ ...entity, versao: 'current', iniciativa_id });
    }

    return entity;
  }

  async getDraftIndic(form, indic_name, id) {
    const entity = await db.instance().query(
      `
      SELECT
        indicadores2024 as indicadores
      FROM ppea.politicas p
      WHERE p.politica_id = :id
      AND versao = 'draft'
      AND "deletedAt" is null
        `,
      {
        replacements: { id },
        type: Sequelize.QueryTypes.SELECT,
      },
    );

    let indicator = entity[0].indicadores[indic_name];

    // para cada campo file - remove ou atualiza file - substituir valor de file por ID em files
    for (let f of form.fields.filter(f => ['file', 'thumbnail'].includes(f.type))) {
      // console.log({ indicator, key: f.key })

      if (indicator?.[f.key]) {
        // recupera o arquivo
        const fileModel = await db.models['File'].findByPk(indicator[f.key]);
        // substitui o conteudo no campo
        indicator[f.key] = {
          url: `${process.env.S3_CONTENT_URL}/${this.getFileKey(id, 'ppea', f.key, fileModel.get('url'))}`,
          file: { name: fileModel.get('file_name') },
        };
      }
    }

    return indicator || {};
  }

  async saveDraftIndic(user, form, indic_name, entity, files, id) {
    const ppea = await db.models['Ppea'].findOne(
      { where: { politica_id: id, versao: 'draft' } },
      {
        raw: true,
        nest: true,
      },
    );
    const model = ppea.get({ plain: true });

    for (let f of form.fields.filter(f => ['file', 'thumbnail'].includes(f.type))) {
      console.log(f.key, entity[f.key] === 'remove', files[f.key], model.indicadores2024[indic_name]?.[f.key]);
    }

    // para cada campo file - remove ou atualiza file - substituir valor de file por ID em files
    for (let f of form.fields.filter(f => ['file', 'thumbnail'].includes(f.type))) {
      if (entity[f.key] === 'remove') await this.removeFile(entity, f.key, model.indicadores2024[indic_name]?.[f.key]);
      else if (files[f.key])
        await this.updateFile(
          id,
          entity,
          files[f.key][0],
          f.key,
          `ppea_indic_${f.key}`,
          model.indicadores2024[indic_name]?.[f.key],
        );
      else entity[f.key] = model.indicadores2024[indic_name]?.[f.key];
    }

    console.log({ entity });

    // gravar JSON em indics na posicao certa (indic_name)
    await db.models['Ppea'].update(
      { ...model, indicadores2024: { ...model.indicadores2024, [indic_name]: entity } },
      {
        where: { id: model.id },
      },
    );

    // console.log('>>>>>>>>', { ...model, indicadores: {...model.indicadores, [indic_name]: entity }})

    return entity;
  }

  async getDraftIndicOld(form, indic_name, id) {
    const entity = await db.instance().query(
      `
      SELECT
        indicadores
      FROM ppea.politicas p
      WHERE p.politica_id = :id
      AND versao = 'draft'
        `,
      {
        replacements: { id },
        type: Sequelize.QueryTypes.SELECT,
      },
    );

    let indicator = entity[0].indicadores[indic_name];

    // para cada campo file - remove ou atualiza file - substituir valor de file por ID em files
    for (let f of form.fields.filter(f => ['file', 'thumbnail'].includes(f.type))) {
      if (indicator[f.key]) {
        // recupera o arquivo
        const fileModel = await db.models['File'].findByPk(indicator[f.key]);
        // substitui o conteudo no campo
        indicator[f.key] = {
          url: `${process.env.S3_CONTENT_URL}/${this.getFileKey(id, 'ppea', f.key, fileModel.get('url'))}`,
          file: { name: fileModel.get('file_name') },
        };
      }
    }

    return indicator;
  }

  async saveDraftIndicOld(user, form, indic_name, entity, files, id) {
    const ppea = await db.models['Ppea'].findOne(
      { where: { politica_id: id, versao: 'draft' } },
      {
        raw: true,
        nest: true,
      },
    );
    const model = ppea.get({ plain: true });

    // para cada campo file - remove ou atualiza file - substituir valor de file por ID em files
    for (let f of form.fields.filter(f => ['file', 'thumbnail'].includes(f.type))) {
      if (entity[f.key] === 'remove') await this.removeFile(entity, f.key, model.indicadores[indic_name][f.key]);
      else if (files[f.key])
        await this.updateFile(
          id,
          entity,
          files[f.key][0],
          f.key,
          `ppea_${f.key}`,
          model.indicadores[indic_name][f.key],
        );
      else entity[f.key] = model.indicadores[indic_name][f.key];
    }

    // gravar JSON em indics na posicao certa (indic_name)
    await db.models['Ppea'].update(
      { ...model, indicadores: { ...model.indicadores, [indic_name]: entity } },
      {
        where: { id: model.id },
      },
    );

    // console.log('>>>>>>>>', { ...model, indicadores: {...model.indicadores, [indic_name]: entity }})

    return entity;
  }

  /* *********************** GENERALIZAR.Begin */ /* TODO */
  async removeFile(entity, fieldName, fileId) {
    entity[fieldName] = null;

    /* remove file */
    db.models['File'].destroy({
      where: { id: fileId },
    });

    /* TODO: remove from S3? */

    return entity;
  }

  async updateFile(id, entity, file, fieldName, document_type, existingFileId) {
    // S3
    await s3
      .putObject({
        Bucket: s3BucketName,
        Key: this.getFileKey(id, 'ppea', fieldName, file.originalname),
        Body: file.buffer,
        ACL: 'public-read',
      })
      .promise();

    await this.updateFileModel(
      entity,
      fieldName,
      file.originalname,
      file.originalname.includes('.pdf') ? `application/pdf` : `image/jpeg`,
      document_type,
      existingFileId,
    );
  }

  async updateFileModel(entity, fieldName, file_name, content_type, document_type, existingFileId) {
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

  getFileKey(folder, filename) {
    return `educom_clima/${folder}/original/${filename}`;
  }
  /* *********************** GENERALIZAR.End */

  /* Retorna o id do projeto relacionado a uma comunidade */
  async getIdFromCommunity(community_id) {
    const sequelize = db.instance();

    let result;

    result = await sequelize.query(
      ` select  c.politica_id as id
        from ppea.politicas c
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

  async getGeoDraw(id) {
    const sequelize = db.instance();

    const geoms = await sequelize.query(
      `
      select ST_AsGeoJSON((ST_Dump(ST_Simplify(pa.geom,0.001))).geom)::jsonb as geojson
      from ppea.politicas_atuacao pa
      inner join ppea.politicas p on p.id = pa.politica_versao_id
      where p.politica_id = :id
      and p.versao = 'draft'`,
      {
        replacements: { id },
        type: Sequelize.QueryTypes.SELECT,
      },
    );

    const bbox = await sequelize.query(
      `
      select
            st_xmin(bb) as bbxmin,
            st_ymin(bb) as bbymin,
            st_xmax(bb) as bbxmax,
            st_ymax(bb) as bbymax
        from (select ST_Extent(geom) as bb
				      from ppea.politicas_atuacao pa
              inner join ppea.politicas p on p.id = pa.politica_versao_id
              where p.politica_id = :id
              and p.versao = 'draft'
			       ) s1
      `,
      {
        replacements: { id },
        type: Sequelize.QueryTypes.SELECT,
      },
    );

    return {
      geoms: geoms.map(({ geojson }) => geojson),
      bbox: [
        [bbox[0].bbymin, bbox[0].bbxmin],
        [bbox[0].bbymax, bbox[0].bbxmax],
      ],
    };
  }

  async hasGeo(id) {
    const sequelize = db.instance();

    const [{ atuacao_aplica, atuacao_naplica_just }] = await sequelize.query(
      `
    select atuacao_aplica, atuacao_naplica_just
    from ppea.politicas pa
    where pa.politica_id = :id`,
      {
        replacements: { id },
        type: Sequelize.QueryTypes.SELECT,
      },
    );

    return { atuacao_aplica, atuacao_naplica_just };
  }

  async geoAble(id, isAble) {
    let isAbleString = null;
    if (isAble === '1') isAbleString = true;
    if (isAble === '0') isAbleString = false;

    await db.instance().query(
      `
    update ppea.politicas
    set atuacao_aplica = :isAbleString
    where politica_id = :id`,
      {
        replacements: { id, isAbleString },
        type: Sequelize.QueryTypes.UPDATE,
      },
    );

    return { success: true };
  }

  async saveProjectJustDraft(id, value) {
    await db.instance().query(
      `
        update ppea.politicas
        set atuacao_naplica_just = :value
        where politica_id = :id and versao = 'draft'`,
      {
        replacements: {
          id,
          value,
        },
        type: Sequelize.QueryTypes.SELECT,
      },
    );

    return { ok: true };
  }

  async participate(user, id, isADM) {
    /* Recupera o id da comunidade, a partir do id da politica */
    const community = await db.instance().query(
      `
      select
        c.community_id,
        dc.descriptor_json->>'title' as "nome"
      from ppea.politicas c
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
    const policyName = community[0].nome;

    return require('../gt').participate(user, communityId, policyName, isADM);
  }

  async enterInInitiative(user) {
    /* descobre o id da comunidade rede de ppea */
    const result = await db.instance().query(
      `
      select id
      from dorothy_communities dc
      where alias = 'rede_ppea'
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

  async createInitiative(nome, user) {
    let query, result;

    /* community for project */
    result = await db.instance().query(
      `
    select * from dorothy_community_recipes where name = 'policy'
    `,
      {
        type: Sequelize.QueryTypes.SELECT,
      },
    );

    const communityRecipe = result[0];

    result = await db.instance().query(
      `
    INSERT INTO dorothy_communities(
      descriptor_json,
      "createdAt",
      "updatedAt",
      alias,
      type
    )
    VALUES(
        '${JSON.stringify(communityRecipe['descriptor_json']).replace('%TITLE%', nome.replace(/"/g, ''))}',
        NOW(),
        NOW(),
        '${communityRecipe['alias']}',
        '${communityRecipe['type']}'
    ) RETURNING id
    `,
      {
        type: Sequelize.QueryTypes.SELECT,
      },
    );

    const community_id = result[0].id;

    result = await db.instance().query(
      `
    SELECT MAX(politica_id)+1 as next from ppea.politicas
    `,
      {
        type: Sequelize.QueryTypes.SELECT,
      },
    );

    const politica_id = result[0].next;

    result = await db.instance().query(
      `
    INSERT into ppea.politicas(nome, community_id, politica_id, versao, "createdAt", "updatedAt") values(:nome, :community_id, :politica_id, 'draft', NOW(), NOW())
    `,
      {
        replacements: { nome, community_id, politica_id },
        type: Sequelize.QueryTypes.INSERT,
      },
    );

    /* torna o criador membro da iniciativa */
    await require('../gt').addMember(community_id, user.id);

    return { communityId: community_id };
  }

  async getListForUser(user, config) {
    const entities = await db.instance().query(
      `
    with policies as (
      select
        c.id,
        dc.id as "community_id",
        dc.descriptor_json->>'title' as "name",
        count(dm.*) > 0 as "has_members"
      from ppea.politicas c
      inner join dorothy_communities dc on dc.id = c.community_id
      left join dorothy_members dm on dm."communityId" = dc.id
      where c.versao = 'draft' and c."deletedAt" is null
      group by c.id, dc.id
    )
    select
      c.id,
      c.community_id,
      c."name",
      dm."createdAt" is not null as "is_member",
      c."has_members",
      p.id is not null as "is_requesting",
      count(*) OVER() AS total_count
    from policies c
    left join dorothy_members dm on dm."communityId" = c.community_id and dm."userId" = :userId
    left join participar p on p."communityId" = c.community_id and p."userId" = :userId and p."resolvedAt" is null
    order by c."name" ${config.direction || 'asc'}
    `,
      {
        replacements: { userId: user.id },
        type: Sequelize.QueryTypes.SELECT,
      },
    );

    return { entities, total: entities[0].total_count };
  }

  async sendContact(id, name, email, message) {
    // descobre o id do gt
    let entities;

    entities = await db.instance().query(
      `
      select p.nome,
        p.community_id
      from ppea.politicas p
      where p.politica_id = :id
      and p.versao = 'current'
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

  async getGeoDrawSave(id, geoms) {
    // encontra a versao draft desta politica
    const p_draft = await db.instance().query(
      `
    select id
    from ppea.politicas p
    where p.politica_id = :id
    and p.versao = 'draft'
    `,
      {
        replacements: { id },
        type: Sequelize.QueryTypes.SELECT,
      },
    );

    if (!p_draft.length) throw new Error('Unknow draft!');

    const politica_versao_id = p_draft[0].id;

    /* apaga os registro para este projeto id */
    await db.instance().query(
      `
        delete from ppea.politicas_atuacao where politica_versao_id = :politica_versao_id`,
      {
        replacements: { politica_versao_id },
        type: Sequelize.QueryTypes.DELETE,
      },
    );

    /* grava os novos registro para este projeto id */
    for (let idx = 0; idx < geoms.length; idx++) {
      const geom = geoms[idx];

      await db.instance().query(
        `
        insert into ppea.politicas_atuacao(politica_versao_id, geom)
        values(:politica_versao_id, ST_GeomFromGeoJSON(:geom))`,
        {
          replacements: { politica_versao_id, geom: JSON.stringify(geom) },
          type: Sequelize.QueryTypes.INSERT,
        },
      );
    }

    return { ok: true };
  }

  async importSHP(filePath) {
    const source = await shapefile.openShp(filePath);
    const result = await source.read();

    const feature = {
      type: 'Feature',
      geometry: result.value,
      properties: {
        name: 'co2',
      },
    };

    return { geojson: simplify(feature, 0.001) };
  }

  async list(version, config) {
    let where = ['e."deletedAt" is NULL', 'e.versao = :version'];

    let replacements = {
      version,
      limit: config.limit,
      offset: config.offset || (config.page - 1) * config.limit,
    };

    if (config.name?.length) {
      where.push('unaccent(e.nome) ilike :search');
      replacements.search = `%${removeAccents(config.name.trim())}%`;
    }

    const entities = await db.instance().query(
      `
    select
        e.id,
        e.iniciativa_id,
        e.nome,
        e.email,
        count(*) OVER() AS total_count
    from educom_clima.iniciativas e
    ${applyWhere(where)}
    order by ${`"${protect.order(config.order)}" ${protect.direction(config.direction)}, e.nome`}
    LIMIT ${!config.all ? ':limit' : 'NULL'}
    OFFSET ${!config.all ? ':offset' : 'NULL'}
    `,
      {
        replacements,
        type: Sequelize.QueryTypes.SELECT,
      },
    );

    // bboxes
    // for (let i = 0; i < entities.length; i++) {
    //   const p = entities[i];

    //   const [bbox] = await db.instance().query(
    //     `
    //         with bounds as (
    //           select ST_Extent(geom) as bbox
    //           from ppea.politicas_atuacao pa
    //           inner join ppea.politicas p on p.id = pa.politica_versao_id and p.versao = 'draft'
    //           where p.politica_id = :politica_id
    //           and pa.geom is not null
    //         )
    //         select ST_YMin(bbox) as y1, ST_XMin(bbox) as x1, ST_YMax(bbox) as y2, ST_XMax(bbox) as x2
    //         from bounds
    //     `,
    //     {
    //       type: Sequelize.QueryTypes.SELECT,
    //       replacements: { politica_id: p.politica_id },
    //     },
    //   );

    //   p.bbox = bbox && bbox.y1 && bbox.x1 && bbox.y2 && bbox.x2 ? bbox : null;
    // }

    /* pages (count), hasPrevious, hasNext */
    const total = entities.length ? parseFloat(entities[0]['total_count']) : 0;
    const rawPages = entities.length ? parseInt(total) / config.limit : 0;
    let pages = rawPages === Math.trunc(rawPages) ? rawPages : Math.trunc(rawPages) + 1;
    let hasPrevious = config.page > 1;
    let hasNext = config.page !== pages;

    return {
      entities,
      pages: !config.all ? pages : 1,
      total,
      hasPrevious,
      hasNext,
    };
  }

  async total_institutions(config) {
    let where = ['p."deletedAt" is null' /* , "p.versao='current'" */];

    if (config.enquads) {
      where.push(`p.instituicao_enquadramento in (${config.enquads.map(e => parseInt(e)).join(',')})`);
    }

    // retrieve
    let result = await db.instance().query(
      `
      select count(distinct p.instituicao_nome)::integer as total
      from ppea.politicas p
      ${applyWhere(where)}
      `,
      {
        type: Sequelize.QueryTypes.SELECT,
      },
    );

    return result[0].total;
  }

  async total_iniciatives(config) {
    let where = ['p."deletedAt" is null' /* , "p.versao='current'" */];

    if (config.enquads) {
      where.push(`p.instituicao_enquadramento in (${config.enquads.map(e => parseInt(e)).join(',')})`);
    }

    // retrieve
    let result = await db.instance().query(
      `
      select count(distinct p.politica_id)::integer as total
      from ppea.politicas p
      ${applyWhere(where)}
      `,
      {
        type: Sequelize.QueryTypes.SELECT,
      },
    );

    return result[0].total;
  }

  async total_members(config) {
    let where = ['p."deletedAt" is null' /* , "p.versao='current'" */];

    if (config.enquads) {
      where.push(`p.instituicao_enquadramento in (${config.enquads.map(e => parseInt(e)).join(',')})`);
    }

    // retrieve
    let result = await db.instance().query(
      `
      select count(distinct dm."userId")::integer as total
      from ppea.politicas p
      inner join dorothy_members dm on dm."communityId" = p.community_id
      ${applyWhere(where)}
      `,
      {
        type: Sequelize.QueryTypes.SELECT,
      },
    );

    return result[0].total;
  }

  async getInfoForParticipation(id) {
    const sequelize = db.instance();

    let result;

    result = await sequelize.query(
      `
        select p.id, p.nome
        from ppea.politicas p
        where p.politica_id = ${parseInt(id)}
        and p.versao = 'current'`,
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
      inner join ppea.politicas p on p.community_id = m."communityId"
      where p.versao = 'current'
      and p.politica_id = ${parseInt(id)}
      `,
      {
        type: Sequelize.QueryTypes.SELECT,
      },
    );

    project.total_members = !members || !members.length ? 0 : members[0].total;

    return project;
  }

  async getTimeline() {
    // Portal
    const educom_climaTLs = await this.getDraftTimeline();

    return {
      list: educom_climaTLs.map(tl => ({
        id: tl.id,
        text: tl.texto,
        thumb: tl.timeline_arquivo,
        publishedAt: tl.date,
      })),
    };
  }

  async getDraftTimeline() {
    const educom_climaTLs = await db.instance().query(
      `
              SELECT
                  lt.id,
                  lt."date",
                  lt.texto,
                  f.url,
                  f.file_name
              FROM educom_clima.linhas_do_tempo lt
              left join files f on f.id = lt.timeline_arquivo
              order by lt."date"
          `,
      {
        type: Sequelize.QueryTypes.SELECT,
      },
    );

    for (let tl of educom_climaTLs) {
      if (!!tl.url)
        tl.timeline_arquivo = `${process.env.S3_CONTENT_URL}/${this.getFileKey('timeline_arquivo', tl.url)}`;
    }

    return educom_climaTLs;
  }

  async saveDraftTimeline(user, entity, timeline_arquivo, tlid) {
    let entityModel;
    if (!tlid) {
      entityModel = await db.models['Educom_clima_timeline'].create({
        ...entity,
        timeline_arquivo: undefined,
      });
    } else {
      // recupera
      entityModel = await db.models['Educom_clima_timeline'].findByPk(tlid);
      // atualiza
      entityModel.date = entity.date;
      entityModel.texto = entity.texto;
      // salva
      entityModel.save();
    }

    if (entity.timeline_arquivo === 'remove') await this.removeFile(entityModel, 'timeline_arquivo');
    else if (timeline_arquivo) await this.updateFile2(entityModel, timeline_arquivo, 'timeline_arquivo');

    return entityModel;
  }

  async removeDraftTimeline(tlId) {
    const timeline = await db.models['Educom_clima_timeline'].findByPk(tlId);

    if (timeline.get('timeline_arquivo')) {
      /* remove file */
      await db.models['File'].destroy({
        where: { id: timeline.get('timeline_arquivo') },
      });
    }

    await db.models['Educom_clima_timeline'].destroy({
      where: {
        id: tlId,
      },
    });

    return true;
  }

  async getPPEADraftId(politica_id) {
    // encontra a versao draft desta politica
    const p_draft = await db.instance().query(
      `
      select id
        from ppea.politicas p
        where p.politica_id = :politica_id
        and p.versao = 'draft'
      `,
      {
        replacements: { politica_id },
        type: Sequelize.QueryTypes.SELECT,
      },
    );

    if (!p_draft.length) throw new Error('Unknow draft!');

    return p_draft[0].id;
  }

  async updateFile2(entityModel, file, fieldName) {
    // S3
    await s3
      .putObject({
        Bucket: s3BucketName,
        Key: this.getFileKey(fieldName, file.originalname),
        Body: file.buffer,
        ACL: 'public-read',
      })
      .promise();

    await this.updateFileModel2(
      entityModel,
      fieldName,
      file.originalname,
      file.originalname.includes('.pdf') ? `application/pdf` : `image/jpeg`,
    );
  }

  async updateFileModel2(entityModel, fieldName, file_name, content_type) {
    let fileModel;
    if (!!entityModel[fieldName]) {
      fileModel = await db.models['File'].findByPk(entityModel[fieldName]);
    }

    if (!!fileModel) {
      fileModel.file_name = file_name;
      fileModel.url = file_name;
      fileModel.document_type = `educom_clima_${fieldName}`;
      fileModel.content_type = content_type;

      fileModel.save();
    } else {
      const fileModel = await db.models['File'].create({
        file_name,
        url: file_name,
        document_type: `educom_clima_${fieldName}`,
        content_type,
      });

      entityModel.set(fieldName, fileModel.id);

      await entityModel.save();
    }
  }

  async delete(id, user) {
    await db.models['Educom_clima'].destroy({
      where: {
        iniciativa_id: id,
      },
    });

    return { success: true };
  }

  async publish(politica_id) {
    const transaction = await db.instance().transaction();

    try {
      /**** >>> A.REMOVE CURRENT (if exists) <<< ****/
      const politica_current = await db.models['Ppea'].findOne({
        where: {
          politica_id,
          versao: 'current',
        },
      });
      if (politica_current) {
        const timelines = await db.models['Ppea_timeline'].findAll({
          where: {
            politica_versao_id: politica_current.id,
          },
        });
        for (let tl of timelines) {
          // A.1A REMOVE TIMELINE FILES
          if (tl.timeline_arquivo) {
            await db.models['File'].destroy({
              where: { id: tl.timeline_arquivo },
              transaction,
            });
          }
          // A.1B REMOVE TIMELINE
          await db.models['Ppea_timeline'].destroy({
            where: { id: tl.id },
            transaction,
          });
        }
        // A.2 REMOVE GEOM
        await db.instance().query(
          `
            DELETE FROM ppea.politicas_atuacao
            WHERE politica_versao_id = :politica_versao_id
          `,
          {
            replacements: { politica_versao_id: politica_current.id },
            type: Sequelize.QueryTypes.DELETE,
            transaction,
          },
        );
        // A.3 REMOVE FILES
        // if (politica_current.logo_arquivo) {
        //   await db.models['File'].destroy({
        //     where: { id: politica_current.logo_arquivo },
        //     transaction,
        //   });
        // }
        // A.4 REMOVE politica
        politica_current.destroy({ transaction });
      }

      /**** >>> B.DRAFT->CURRENT <<< ****/
      const politica_draft = await db.models['Ppea'].findOne({
        where: {
          politica_id,
          versao: 'draft',
        },
      });
      if (!politica_draft) throw new Error('politica without draft');
      politica_draft.versao = 'current';
      await politica_draft.save({
        transaction,
      });

      /**** >>> C.CLONE new CURRENT -> DRAFT <<< ****/

      // C.1 CLONE FILE
      // const new_file = await db.instance().query(
      //   `
      //   insert into files(file_name, description, "content_type", "createdAt", "updatedAt", tags, url, file_size, legacy_id, origin, document_type, send_date)
      //   SELECT file_name, description, "content_type", NOW(), NOW(), tags, url, file_size, legacy_id, origin, document_type, send_date
      //   FROM files
      //   WHERE id = :file_id
      //   RETURNING id
      // `,
      //   {
      //     replacements: { file_id: politica_draft.logo_arquivo },
      //     type: Sequelize.QueryTypes.SELECT,
      //     transaction,
      //   },
      // );

      // C.2 CLONE politica
      const politica_clone = await db.models['Ppea'].create(
        {
          ...politica_draft.get({ plain: true }),
          id: undefined,
          versao: 'draft',
          // logo_arquivo: new_file[0].id,
        },
        {
          transaction,
        },
      );

      // C.3A CLONE TIMELINE
      const timelines = await db.models['Ppea_timeline'].findAll({
        where: {
          politica_versao_id: politica_draft.id,
        },
      });
      for (let tl of timelines) {
        // C.3B CLONE TIMELINE FILES
        const new_file = await db.instance().query(
          `
          insert into files(file_name, description, "content_type", "createdAt", "updatedAt", tags, url, file_size, legacy_id, origin, document_type, send_date)
          SELECT file_name, description, "content_type", NOW(), NOW(), tags, url, file_size, legacy_id, origin, document_type, send_date
          FROM files
          WHERE id = :file_id
          RETURNING id
        `,
          {
            replacements: { file_id: tl.timeline_arquivo },
            type: Sequelize.QueryTypes.SELECT,
            transaction,
          },
        );

        await db.models['Ppea_timeline'].create(
          {
            ...tl.get({ plain: true }),
            id: undefined,
            politica_versao_id: politica_clone.id,
            timeline_arquivo: new_file[0].id,
          },
          {
            transaction,
          },
        );
      }

      // C.4 CLONE GEOM
      await db.instance().query(
        `
        INSERT INTO ppea.politicas_atuacao(politica_versao_id, geom)
        SELECT ${politica_clone.id} as politica_versao_id, geom FROM ppea.politicas_atuacao
        WHERE politica_versao_id = :politica_versao_id
      `,
        {
          replacements: { politica_versao_id: politica_draft.id },
          type: Sequelize.QueryTypes.INSERT,
          transaction,
        },
      );

      /* atualiza o nome da comunidade */
      await db.instance().query(
        `
      update dorothy_communities
      set descriptor_json = jsonb_set(descriptor_json , '{"title"}', jsonb '"${politica_draft.nome}"', true)
      where id = :id
      `,
        {
          replacements: {
            id: politica_draft.community_id,
          },
          type: Sequelize.QueryTypes.UPDATE,
          transaction,
        },
      );

      // COMMIT TRANSACTION
      await transaction.commit();

      // SEND NOTIFICATION --> TODO (ISSUE)

      return { success: true };
    } catch (error) {
      // ROLLBACK TRANSACTION

      await transaction.rollback();
      throw error;
    }
  }

  async downloadProject(id) {
    /* recupera projeto e linhas de acao */

    let rows = await db.instance().query(
      `
      select
        id, politica_id, legacy_id, community_id, enquadramento_1, enquadramento_1_just, enquadramento_2, enquadramento_2_just, enquadramento_3, enquadramento_3_just, enquadramento_4, enquadramento_4_just, instituicao_nome, instituicao_enquadramento, responsavel_nome, responsavel_cargo, responsavel_telefone, responsavel_email, nome, link, fase, fase_ano, fase_descricao, area, area_tematica,
        -- dificuldades,
        contemplados, "createdAt", "updatedAt", versao, atuacao_aplica, atuacao_naplica_just
      from ppea.politicas p
      where p.versao='draft' and p.politica_id = :id
      `,
      {
        replacements: { id },
        type: Sequelize.QueryTypes.SELECT,
      },
    );

    if (!rows.length) return null;

    let title = rows[0].nome;

    // fileName
    const fileName = `politica_publica_${id}`;

    const csvFileName = `${fileName}.csv`;
    const zipFileName = `${fileName}.zip`;

    // 1. transformar em csv
    const columns = Object.keys(rows[0]).filter(k => !['coordinates', 'bbox'].includes(k));
    let initialContent = columns.join(';') + '\n';

    const content = rows.reduce((accum, r) => {
      const row = columns.reduce((accum, key) => {
        if (typeof r[key] === 'string') r[key] = r[key].replace(/\n/g, ' ').replace(/;/g, ',').trim();

        return [...accum, r[key]];
      }, []);
      return `${accum} ${row.join(`;`)}\n`;
    }, initialContent);

    // 2. zipar e colocar na memoria
    const zip = new AdmZip();
    zip.addFile(csvFileName, Buffer.from(content, 'latin1'));

    return {
      zipFileName,
      content: zip.toBuffer(), // get in-memory zip
    };
  }

  async list4Map(where, config) {
    let replacements = {
      limit: config.limit,
      offset: config.offset || (config.page - 1) * config.limit,
    };

    const entities = await db.instance().query(
      `
    select
      p.id,
      p.iniciativa_id,
      p.nome,
      p.regions as regioes,
      count(*) OVER() AS total_count
    from educom_w_region p
    ${where}
    order by p.nome
    LIMIT ${!config.all ? ':limit' : 'NULL'}
    OFFSET ${!config.all ? ':offset' : 'NULL'}
    `,
      {
        replacements,
        type: Sequelize.QueryTypes.SELECT,
      },
    );

    // bboxes
    for (let i = 0; i < entities.length; i++) {
      const p = entities[i];

      const [bbox] = await db.instance().query(
        `
            with bounds as (
              select ST_Extent(geom) as bbox
              from br_uf u
              inner join educom_clima.iniciativas p on u.cd_uf = any(p.uf::text[])
              where p.iniciativa_id = :iniciativa_id
            )
            select ST_YMin(bbox) as y1, ST_XMin(bbox) as x1, ST_YMax(bbox) as y2, ST_XMax(bbox) as x2
            from bounds
        `,
        {
          type: Sequelize.QueryTypes.SELECT,
          replacements: { iniciativa_id: p.iniciativa_id },
        },
      );

      p.bbox = bbox && bbox.y1 && bbox.x1 && bbox.y2 && bbox.x2 ? bbox : null;
    }

    /* pages (count), hasPrevious, hasNext */
    const total = entities.length ? parseFloat(entities[0]['total_count']) : 0;
    const rawPages = entities.length ? parseInt(total) / config.limit : 0;
    let pages = rawPages === Math.trunc(rawPages) ? rawPages : Math.trunc(rawPages) + 1;
    let hasPrevious = config.page > 1;
    let hasNext = config.page !== pages;

    return {
      entities,
      pages: !config.all ? pages : 1,
      total,
      hasPrevious,
      hasNext,
    };
  }

  async getRegions(where) {
    const entities = await db.instance().query(
      `
    with all_ufs as (
      select distinct unnest(p.uf) as id
      from educom_w_region p
      ${where}
    )
    select
      distinct u.nm_regiao as value,
      u.nm_regiao as label
    from all_ufs au
    inner join ufs u on u.fid = au.id
    order by 2
    `,
      {
        type: Sequelize.QueryTypes.SELECT,
      },
    );

    return entities;
  }

  async getUFs(config) {
    let where = [];

    if (config.f_regioes) {
      where.push(`u.nm_regia in (${config.f_regioes.split(',').map(r => `'${r.toUpperCase()}'`)})`);
    }

    const entities = await db.instance().query(
      `
      select
        u.cd_uf as value,
        u.nm_uf as label
      from br_uf u
      ${applyWhere(where)}
      order by 2
    `,
      {
        type: Sequelize.QueryTypes.SELECT,
      },
    );

    return entities;
  }

  async listProjectsIDs(f_id, where) {
    const sequelize = db.instance();

    if (f_id) where = `${where} AND p.id = ${f_id}`;

    const query = `
            select distinct unnest(p.uf) as id
            from educom_clima.iniciativas p
            ${where}
        `;

    const projects = await sequelize.query(query, {
      type: Sequelize.QueryTypes.SELECT,
    });

    return projects.map(p => p.id);
  }

  async spreadsheet(type) {
    const { lists } = YAML.parse(lists_file);

    let data = [];

    let header = [
      '#',
      'nome',
      'email responsável',
      'tipo organização',
      'nível territorial',
      'estados atuação',
      'faixa etaria',
      'gênero',
      'etnia',
      'recebeu notícia falsa?',
      'exemplo notícia falsa',
      'aborda desinformação?',
      'exemplo desinformação',
      'apresentacao',
      'redes sociais',
      'outros detalhes',
      'temas',
      'materiais didáticos',
      'estratégia educativas',
    ];

    data.push(header);

    const query = `
    select
      e.*,
      array_agg(u.sigla_uf) as ufs
    from educom_clima.iniciativas e
    left join br_uf u on u.cd_uf::smallint = any(e.uf)
    where e."deletedAt" is null
    and e.versao = 'current'
    group by e.id
    order by e.nome
    `;

    const iniciativas = await db.instance().query(query, {
      type: Sequelize.QueryTypes.SELECT,
    });

    for (let idx in iniciativas) {
      const p = iniciativas[idx];

      let i_data = [];

      i_data.push(p.id);
      i_data.push(p.nome);
      i_data.push(p.email);

      const tipo_definicao = lists.find(i => i.key === 'definicao').options.filter(o => o.value !== -1);
      i_data.push(tipo_definicao.find(ta => ta.value === p.definicao).label);

      const tipo_nivel = lists.find(i => i.key === 'nivel').options.filter(o => o.value !== -1);
      i_data.push(p.nivel.map(n => tipo_nivel.find(ta => ta.value === n).label));

      i_data.push(p.ufs.join(','));

      const tipo_faixa = lists.find(i => i.key === 'faixa_etaria').options.filter(o => o.value !== -1);
      i_data.push(p.faixa_etaria.map(n => tipo_faixa.find(ta => ta.value === n).label));

      const tipo_genero = lists.find(i => i.key === 'participantes_genero').options.filter(o => o.value !== -1);
      i_data.push(p.participantes_genero.map(n => tipo_genero.find(ta => ta.value === n).label));

      const tipo_etnia = lists.find(i => i.key === 'racas_etnias').options.filter(o => o.value !== -1);
      i_data.push(p.racas_etnias.map(n => tipo_etnia.find(ta => ta.value === n).label));

      i_data.push(p.noticia_falsa_recebeu == 1 ? 'sim' : 'não');
      i_data.push(p.noticia_falsa_exemplo);
      i_data.push(p.aborda_desinformacao == 1 ? 'sim' : 'não');
      i_data.push(p.aborda_desinformacao_exemplo);

      i_data.push(p.apresentacao);
      i_data.push(p.redes_sociais);
      i_data.push(p.conte_mais);
      i_data.push(p.temas);
      i_data.push(p.estrategias_educativas);
      i_data.push(p.materiais_didaticos);

      data.push(i_data);
    }

    // fileName
    const fileName = `educom_clima_spreadsheet_${dayjs().format('YYYY.MM.DD')}`;

    const csvFileName = `${fileName}.csv`;
    const zipFileName = `${fileName}.zip`;

    // 1. transformar em csv
    let content = data.reduce((accum, row) => {
      return `${accum.length ? `${accum}\n` : ''}${row
        .map(c => String(c).replace(/\n/g, ' ').replace(/;/g, ',').trim())
        .join('\t')}`;
    }, '');

    // 2. zipar e colocar na memoria

    const zip = new AdmZip();
    zip.addFile(csvFileName, Buffer.from(content, 'latin1'));

    return {
      zipFileName,
      content: zip.toBuffer(), // get in-memory zip
    };
  }
}

const singletonInstance = new Service();
module.exports = singletonInstance;
