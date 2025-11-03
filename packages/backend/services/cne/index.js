const db = require('../database');
const Sequelize = require('sequelize');

// const FormManager = require('../../FormsManager')

const { /* applyJoins ,*/ applyWhere, /* getIds ,*/ protect, getSegmentedId, parseBBOX } = require('../../utils');

var fs = require('fs');
const YAML = require('yaml');

const aws = require('aws-sdk');
const s3BucketName = process.env.S3_BUCKET_NAME;

const s3 = new aws.S3({
  apiVersion: '2006-03-01',

  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
});

const shapefile = require('shapefile');
const simplify = require('simplify-geojson');

const { Messagery } = require('dorothy-dna-services');

const { check } = require('../../form_utils');

const lists_file = fs.readFileSync(require.resolve(`../../../../forms/cne/lists1.yml`), 'utf8');

class Service {
  /* Entity */
  async getListForUser(user) {
    const entities = await db.instance().query(
      `
        with entities as (
            select
                c.id,
                dc.id as "community_id",
                dc.descriptor_json->>'title' as "name",
                count(dm.*) > 0 as "has_members",
                count(*) OVER() AS total_count
            from cne.cnes c
            inner join dorothy_communities dc on dc.id = c.community_id
            left join dorothy_members dm on dm."communityId" = dc.id
            where c.versao = 'draft'
            group by c.id, dc.id
            )
            select
            c.id,
            c.community_id,
            c."name",
            dm."createdAt" is not null as "is_member",
            c."has_members",
            p.id is not null as "is_requesting"
            from entities c
            left join dorothy_members dm on dm."communityId" = c.community_id and dm."userId" = 1
            left join participar p on p."communityId" = c.community_id and p."userId" = 1 and p."resolvedAt" is null
            order by c."name"
        `,
      {
        replacements: { userId: user.id },
        type: Sequelize.QueryTypes.SELECT,
      },
    );

    return { entities, total: entities[0].total_count };
  }

  async participate(user, id, isADM) {
    /* Recupera o id da comunidade, a partir do id da comissao */
    const community = await db.instance().query(
      `
            select
                c.community_id,
                dc.descriptor_json->>'title' as "nome"
            from cne.cnes c
            inner join dorothy_communities dc on dc.id = c.community_id
            where c.id = :id
          `,
      {
        replacements: { id },
        type: Sequelize.QueryTypes.SELECT,
      },
    );

    if (!community) throw new Error('CNE without community');

    const communityId = community[0].community_id;
    const entityName = community[0].nome;

    return require('../gt').participate(user, communityId, entityName, isADM);
  }

  /* Retorna o id do projeto relacionado a uma comunidade */
  async getIdFromCommunity(community_id) {
    const sequelize = db.instance();

    let result;

    result = await sequelize.query(
      ` select  c.cne_id as id
            from cne.cnes c
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

  async createInitiative(nome, user) {
    let query, result;

    /* community for project */
    result = await db.instance().query(
      `
        select * from dorothy_community_recipes where name = 'cne'
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

    // institution
    result = await db.instance().query(
      `
        INSERT INTO public.instituicoes(nome, "createdAt", "updatedAt")
        VALUES(:nome, now(), now())
        RETURNING id
        `,
      {
        replacements: { nome },
        type: Sequelize.QueryTypes.SELECT,
      },
    );

    const instituicao_id = result[0].id;

    result = await db.instance().query(
      `
        SELECT MAX(cne_id)+1 as next from cne.cnes
        `,
      {
        type: Sequelize.QueryTypes.SELECT,
      },
    );

    const cne_id = result[0].next;

    result = await db.instance().query(
      `
        INSERT INTO cne.cnes(nome, community_id, cne_id, versao, "createdAt", "updatedAt", instituicao_id)
        values(:nome, :community_id, :cne_id, 'draft', NOW(), NOW(), :instituicao_id)
        `,
      {
        replacements: { nome, community_id, cne_id, instituicao_id },
        type: Sequelize.QueryTypes.INSERT,
      },
    );

    /* torna o criador membro da iniciativa */
    await require('../gt').addMember(community_id, user.id);

    return { communityId: community_id };
  }

  async getDraftInfo(id) {
    const entity = await db.instance().query(
      `
          SELECT
            p.nome,
            p.logo_arquivo,
            p.tipologia,
            p.intitutions_it,
            p.managers_it,
            p.data_criacao,
            p.data_inst,
            p.cnpj,
            p.estrategia_desc,
            p.estrategia_arquivo,
            p.estrategia_data,
            p.detalhamento_desc,
            p.detalhamento_arquivo,
            p.detalhamento_data,
            p.outcomes_it,
            (select CONCAT(u.id,'_',u.cd_geocuf) from ufs u where u.id = p.uf) as uf,
            p.municipio,
            ("createdAt" = "updatedAt") as is_new
          FROM cne.cnes p
          WHERE p.cne_id = :id
          AND versao = 'draft'
            `,
      {
        replacements: { id },
        type: Sequelize.QueryTypes.SELECT,
      },
    );

    let cne = entity[0];

    if (!cne.uf) cne.uf = '0_0';
    if (cne.municipio) {
      // cria objeto para o municipio
      cne.municipio = {
        id: cne.municipio,
        name: '',
      };
    }

    /* TODO: dá para simplificar com FormManager */
    for (let document of ['logo', 'estrategia', 'detalhamento']) {
      if (document !== 'logo') cne[`${document}_tipo`] = null;

      if (!!entity[0][`${document}_arquivo`]) {
        const file_entity = await db
          .instance()
          .query(`select f.url, f.file_name, f.content_type from files f where f.id = :file_id`, {
            replacements: { file_id: entity[0][`${document}_arquivo`] },
            type: Sequelize.QueryTypes.SELECT,
          });

        if (file_entity.length) {
          if (document === 'logo' || file_entity[0].content_type !== 'text/uri-list') {
            cne[`${document}_arquivo${document !== 'logo' ? 2 : ''}`] = {
              url: `${process.env.S3_CONTENT_URL}/${this.getFileKey(id, `${document}_arquivo`, file_entity[0].url)}`,
              file: { name: file_entity[0].file_name },
            };
          } else {
            cne[`${document}_arquivo`] = file_entity[0].file_name;
          }

          if (document !== 'logo')
            cne[`${document}_tipo`] = file_entity[0].content_type === 'text/uri-list' ? 'link' : 'file';
        }
      }
    }

    return cne;
  }

  async saveDraft(user, form, entity, files, id) {
    if (entity.uf) entity.uf = entity.uf.split('_')[0];

    await db.models['Cne'].update(
      {
        ...entity,

        logo_arquivo: undefined /* TODO: files/thumbnail except those in link_or_file */,
        estrategia_arquivo: entity.estrategia_tipo === null ? null : undefined,
        detalhamento_arquivo: entity.detalhamento_tipo === null ? null : undefined,
      },
      {
        where: { cne_id: id, versao: 'draft' },
      },
    );

    const entityModel = await db.models['Cne'].findOne({
      where: { cne_id: id, versao: 'draft' },
    });

    if (entity.logo_arquivo === 'remove') await this.removeFile(entityModel, 'logo_arquivo');
    else if (files.logo_arquivo) await this.updateFile(entityModel, files.logo_arquivo[0], 'logo_arquivo', id);

    files = {
      /* TODO: recuperar em form - nem precisa existir, pode ser resolvido abaixo */
      logo_arquivo: files.logo_arquivo && files.logo_arquivo.length ? files.logo_arquivo[0] : null,
      estrategia_arquivo:
        files.estrategia_arquivo && files.estrategia_arquivo.length ? files.estrategia_arquivo[0] : null,
      detalhamento_arquivo:
        files.detalhamento_arquivo && files.detalhamento_arquivo.length ? files.detalhamento_arquivo[0] : null,
    };

    // !!!!! form.link_or_file_fields <<-- faz sentido, pois é algo que diz respeito somente a esta aplicação e não ao Form
    /* TODO: GENERALIZAR: recuperar em form.yml - updateFile deveria ser único (util?) */
    for (let wFile of ['estrategia', 'detalhamento']) {
      if (entity[`${wFile}_tipo`] === 'link')
        await this.updateFileModel(entityModel, `${wFile}_arquivo`, entity[`${wFile}_arquivo`], 'text/uri-list');
      else if (entity[`${wFile}_tipo`] === 'file') {
        if (entity[`${wFile}_arquivo2`] === 'remove') await this.removeFile(entityModel, `${wFile}_arquivo`);
        else if (files[`${wFile}_arquivo`])
          await this.updateFile(entityModel, files[`${wFile}_arquivo`], `${wFile}_arquivo`, entityModel.get('id'));
      }
    }

    /* atualiza o nome da instituicao vinculada */
    if (entityModel.get('instituicao_id')) {
      await db.instance().query(
        `
          update instituicoes
          set nome = :name
          where id = :id
        `,
        {
          replacements: {
            id: entityModel.get('instituicao_id'),
            name: entity.nome,
          },
          type: Sequelize.QueryTypes.UPDATE,
        },
      );
    }

    return entity;
  }

  async verify(id, form) {
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

    return {
      ready: conclusion.ready,
      analysis,
    };
  }

  async getGeoDraw(id) {
    const sequelize = db.instance();

    const geoms = await sequelize.query(
      `
          select ST_AsGeoJSON((ST_Dump(ST_Simplify(pa.geom,0.001))).geom)::jsonb as geojson
          from cne.cnes_atuacao pa
          inner join cne.cnes p on p.id = pa.cne_versao_id
          where p.cne_id = :id
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
                          from cne.cnes_atuacao pa
                  inner join cne.cnes p on p.id = pa.cne_versao_id
                  where p.cne_id = :id
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
            from cne.cnes pa
            where pa.cne_id = :id`,
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
            update cne.cnes
            set atuacao_aplica = :isAbleString
            where cne_id = :id`,
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
            update cne.cnes
            set atuacao_naplica_just = :value
            where cne_id = :id`,
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

  async getCNEDraftId(cne_id) {
    // encontra a versao draft desta cne
    const p_draft = await db.instance().query(
      `
            select id
            from cne.cnes p
            where p.cne_id = :cne_id
            and p.versao = 'draft'
        `,
      {
        replacements: { cne_id },
        type: Sequelize.QueryTypes.SELECT,
      },
    );

    if (!p_draft.length) throw new Error('Unknow draft!');

    return p_draft[0].id;
  }

  async getGeoDrawSave(id, geoms) {
    const cne_versao_id = await this.getCNEDraftId(id);

    /* apaga os registro para este projeto id */
    await db.instance().query(
      `
            delete from cne.cnes_atuacao where cne_versao_id = :cne_versao_id`,
      {
        replacements: { cne_versao_id },
        type: Sequelize.QueryTypes.DELETE,
      },
    );

    /* grava os novos registro para este projeto id */
    for (let idx = 0; idx < geoms.length; idx++) {
      const geom = geoms[idx];

      await db.instance().query(
        `
                insert into cne.cnes_atuacao(cne_versao_id, geom)
                values(:cne_versao_id, ST_GeomFromGeoJSON(:geom))`,
        {
          replacements: { cne_versao_id, geom: JSON.stringify(geom) },
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

  async publish(cne_id) {
    const transaction = await db.instance().transaction();

    try {
      /**** >>> A.REMOVE CURRENT (if exists) <<< ****/
      const cne_current = await db.models['Cne'].findOne({
        where: {
          cne_id,
          versao: 'current',
        },
      });
      if (cne_current) {
        const timelines = await db.models['Cne_timeline'].findAll({
          where: {
            cne_versao_id: cne_current.id,
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
          await db.models['Cne_timeline'].destroy({
            where: { id: tl.id },
            transaction,
          });
        }
        // A.2 REMOVE GEOM
        await db.instance().query(
          `
            DELETE FROM cne.cnes_atuacao
            WHERE cne_versao_id = :cne_versao_id
          `,
          {
            replacements: { cne_versao_id: cne_current.id },
            type: Sequelize.QueryTypes.DELETE,
            transaction,
          },
        );
        // A.3 REMOVE FILES
        if (cne_current.logo_arquivo) {
          await db.models['File'].destroy({
            where: { id: cne_current.logo_arquivo },
            transaction,
          });
        }
        // A.4 REMOVE CNE
        cne_current.destroy({ transaction });
      }

      /**** >>> B.DRAFT->CURRENT <<< ****/
      const cne_draft = await db.models['Cne'].findOne({
        where: {
          cne_id,
          versao: 'draft',
        },
      });
      if (!cne_draft) throw new Error('CNE without draft');
      cne_draft.versao = 'current';
      await cne_draft.save({
        transaction,
      });

      /**** >>> C.CLONE new CURRENT -> DRAFT <<< ****/

      // C.1 CLONE FILE
      const new_file = await db.instance().query(
        `
        insert into files(file_name, description, "content_type", "createdAt", "updatedAt", tags, url, file_size, legacy_id, origin, document_type, send_date)
        SELECT file_name, description, "content_type", NOW(), NOW(), tags, url, file_size, legacy_id, origin, document_type, send_date
        FROM files
        WHERE id = :file_id
        RETURNING id
      `,
        {
          replacements: { file_id: cne_draft.logo_arquivo },
          type: Sequelize.QueryTypes.SELECT,
          transaction,
        },
      );

      // C.2 CLONE CNE
      const cne_clone = await db.models['Cne'].create(
        {
          ...cne_draft.get({ plain: true }),
          id: undefined,
          versao: 'draft',
          logo_arquivo: new_file.length ? new_file[0].id : null,
        },
        {
          transaction,
        },
      );

      // C.3A CLONE TIMELINE
      const timelines = await db.models['Cne_timeline'].findAll({
        where: {
          cne_versao_id: cne_draft.id,
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

        await db.models['Cne_timeline'].create(
          {
            ...tl.get({ plain: true }),
            id: undefined,
            cne_versao_id: cne_clone.id,
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
        INSERT INTO cne.cnes_atuacao(cne_versao_id, geom)
        SELECT ${cne_clone.id} as cne_versao_id, geom FROM cne.cnes_atuacao
        WHERE cne_versao_id = :cne_versao_id
      `,
        {
          replacements: { cne_versao_id: cne_draft.id },
          type: Sequelize.QueryTypes.INSERT,
          transaction,
        },
      );

      /* atualiza o nome da comunidade */
      await db.instance().query(
        `
      update dorothy_communities
      set descriptor_json = jsonb_set(descriptor_json , '{"title"}', jsonb '"${cne_draft.nome}"', true)
      where id = :id
      `,
        {
          replacements: {
            id: cne_draft.community_id,
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

  async total_cnes() {
    // retrieve
    let result = await db.instance().query(
      `
            with institutions_list as (
                select distinct jsonb_array_elements(jsonb_path_query_array(c.intitutions_it, '$.nome_inst')) as institutions
                from cne.cnes c
                where c.versao = 'current' and c."deletedAt" is null
                order by institutions
            )
            select count(*) as total
            from institutions_list
      `,
      {
        type: Sequelize.QueryTypes.SELECT,
      },
    );

    return result[0].total;
  }

  async getDraftTimeline(id) {
    const cneTLs = await db.instance().query(
      `
                SELECT
                    lt.id,
                    lt."date",
                    lt.texto,
                    f.url,
                    f.file_name,
                    p.id as cne_versao_id
                FROM cne.linhas_do_tempo lt
                left join files f on f.id = lt.timeline_arquivo
                inner join cne.cnes p on p.id = lt.cne_versao_id
                where p.cne_id = :id
                and p.versao = 'draft'
                order by lt."date"
            `,
      {
        replacements: { id },
        type: Sequelize.QueryTypes.SELECT,
      },
    );

    for (let tl of cneTLs) {
      if (!!tl.url)
        tl.timeline_arquivo = `${process.env.S3_CONTENT_URL}/${this.getFileKey(id, 'timeline_arquivo', tl.url)}`;
    }

    return cneTLs;
  }

  async saveDraftTimeline(user, entity, timeline_arquivo, id, tlid) {
    const cne_versao_id = await this.getCNEDraftId(id);

    let entityModel;
    if (!tlid) {
      entityModel = await db.models['Cne_timeline'].create({
        ...entity,
        cne_versao_id,
        timeline_arquivo: undefined,
      });
    } else {
      // recupera
      entityModel = await db.models['Cne_timeline'].findByPk(tlid);
      // atualiza
      entityModel.date = entity.date;
      entityModel.texto = entity.texto;
      // salva
      entityModel.save();
    }

    if (entity.timeline_arquivo === 'remove') await this.removeFile(entityModel, 'timeline_arquivo');
    else if (timeline_arquivo) await this.updateFile(entityModel, timeline_arquivo, 'timeline_arquivo', id);

    return entityModel;
  }

  async removeDraftTimeline(id, tlId) {
    const timeline = await db.models['Cne_timeline'].findByPk(tlId);
    const cne_versao_id = await this.getCNEDraftId(id);

    if (timeline.get('timeline_arquivo')) {
      /* remove file */
      await db.models['File'].destroy({
        where: { id: timeline.get('timeline_arquivo') },
      });
    }

    await db.models['Cne_timeline'].destroy({
      where: {
        id: tlId,
        cne_versao_id,
      },
    });

    return true;
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
        Key: this.getFileKey(entityId || entityModel.get('cne_versao_id'), fieldName, file.originalname),
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
      fileModel.document_type = `cne_${fieldName}`;
      fileModel.content_type = content_type;

      fileModel.save();
    } else {
      const fileModel = await db.models['File'].create({
        file_name,
        url: file_name,
        document_type: `cne_${fieldName}`,
        content_type,
      });

      entityModel.set(fieldName, fileModel.id);

      await entityModel.save();
    }
  }

  async list(page, f_id, where, limit) {
    const sequelize = db.instance();

    const specificLimit = limit || defaultLimit;

    let query;

    if (f_id) where = `${where} AND c.id = ${f_id}`;

    query = `
              select c.id, c.nome, u.nm_regiao, c.uf, c.cne_id,
            count(*) OVER() AS total_count
            from cne.cnes c
            left join ufs u on u.id = c.uf
            ${where}
            order by c.nome
              LIMIT ${specificLimit}
              OFFSET ${(page - 1) * specificLimit}
          `;

    const instance = await sequelize.query(query, {
      type: Sequelize.QueryTypes.SELECT,
    });

    // bboxes & instituicoes
    for (let i = 0; i < instance.length; i++) {
      const c = instance[i];

      const [bbox] = await sequelize.query(
        `
            with bounds as (
                select ST_Extent(geom) as bbox
                from cne.cnes_atuacao ca
                inner join cne.cnes c on c.id = ca.cne_versao_id and c.versao = 'current'
                where c.id = :cne_id
                and ca.geom is not null
            )
            select ST_YMin(bbox) as y1, ST_XMin(bbox) as x1, ST_YMax(bbox) as y2, ST_XMax(bbox) as x2
            from bounds
            `,
        {
          type: Sequelize.QueryTypes.SELECT,
          replacements: { cne_id: c.id },
        },
      );

      const instituicoes = await sequelize.query(
        `
            select jsonb_agg(elem->>'nome_inst') AS instituicoes
            from cne.cnes c, jsonb_array_elements(c.intitutions_it) AS elem
            where id = :cne_id
            `,
        {
          type: Sequelize.QueryTypes.SELECT,
          replacements: { cne_id: c.id },
        },
      );

      instance[i].bbox = bbox && bbox.y1 && bbox.x1 && bbox.y2 && bbox.x2 ? bbox : null;
      instance[i].instituicao_nome = instituicoes[0].instituicoes ? instituicoes[0].instituicoes.join(',') : '';
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
        inner join cne.cnes c on c.community_id = m."communityId"
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

  async listIDs(f_id, where) {
    const sequelize = db.instance();

    if (f_id) where = `${where} AND c.id = ${f_id}`;

    const query = `
            select distinct c.cne_id
            from cne.cnes c
            left join ufs u on u.id = c.uf
            ${where}
            and u.geom is not null
        `;

    const enitities = await sequelize.query(query, {
      type: Sequelize.QueryTypes.SELECT,
    });

    return enitities.map(e => e.cne_id);
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
          from cne.cnes c
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
          from cne.cnes c
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

    return {
      regioes,
    };
  }

  async listMunicipiosByName(where) {
    const sequelize = db.instance();

    const query = `
                select distinct m.cd_mun as value, upper(m.nm_mun) as "label"
                from cne.cnes c
                inner join municipios m on m.cd_mun = c.municipio
                ${where}
                order by "label"
            `;

    const municipios = await sequelize.query(query, {
      type: Sequelize.QueryTypes.SELECT,
    });

    return municipios;
  }

  async listByName(where) {
    const sequelize = db.instance();

    const query = `
                select distinct c.id as value, c.nome as "label"
                from cne.cnes c
                ${where}
                order by "label"
            `;

    const entities = await sequelize.query(query, {
      type: Sequelize.QueryTypes.SELECT,
    });

    return entities;
  }

  async listIntituicoesByName(nome) {
    const sequelize = db.instance();

    const query = `
              select distinct i.id as value, i.nome as "label"
              from instituicoes i
              ${where}
              order by "label"
          `;

    const intituicoes = await sequelize.query(query, {
      type: Sequelize.QueryTypes.SELECT,
    });

    return intituicoes;
  }

  getFileKey(id, folder, filename) {
    const segmentedId = getSegmentedId(id);

    return `cne/${segmentedId}/${folder}/original/${filename}`;
  }

  async getEntity(id) {
    const sequelize = db.instance();

    let result;

    result = await sequelize.query(
      `
            select
                c.id,
                c.cne_id,
                c.nome,
                c.intitutions_it,
                c."createdAt" as published,
                c.data_criacao,
                c.data_inst,
                f.url as estrategia_url,
	            c.outcomes_it
            from cne.cnes c
            left join files f on f.id = c.estrategia_arquivo
            where c.cne_id = ${parseInt(id)}
            and c.versao = 'current'`,
      {
        type: Sequelize.QueryTypes.SELECT,
      },
    );

    if (!result.length) return null;

    let entity = result[0];

    // arquivo de sustentabilidade
    if (entity.estrategia_url) {
      entity.estrategia_link = `${process.env.S3_CONTENT_URL}/${this.getFileKey(
        id,
        'estrategia_arquivo',
        entity.estrategia_url,
      )}`;
      delete entity.estrategia_url;
    }

    try {
      const { lists } = YAML.parse(lists_file);
      const tipo_resultados = lists.find(i => i.key === 'tipo_resultados').options.filter(o => o.value !== -1);

      for (let r of entity.outcomes_it) {
        r.resultado_tipo = tipo_resultados.find(tr => tr.value === r.resultado_tipo)?.label;
      }
    } catch (e) {
      console.log(e);
    }

    const members = await sequelize.query(
      `
          select count(*)::integer as total
          from dorothy_members m
          inner join projetos p on p.community_id = m."communityId"
          where p.id = ${parseInt(id)}
          `,
      {
        type: Sequelize.QueryTypes.SELECT,
      },
    );

    entity.total_members = !members || !members.length ? 0 : members[0].total;

    return entity;
  }

  async getGeo(id) {
    const sequelize = db.instance();

    let atuacoes = await sequelize.query(
      `
            select ca.id, ST_AsGeoJSON(ca.geom) as geojson, ST_AsGeoJSON(ST_Envelope(ca.geom)) as bbox
            from cne.cnes_atuacao ca
            inner join cne.cnes c on c.id = ca.cne_versao_id and c.versao = 'current'
            where c.cne_id = ${parseInt(id)}
            and ca.geom is not null
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
                from cne.cnes_atuacao ca
                inner join cne.cnes c on c.id = ca.cne_versao_id and c.versao = 'draft'
                where c.cne_id = ${parseInt(id)}
                and ca.geom is not null
            )
            select ST_YMin(bbox) as y1, ST_XMin(bbox) as x1, ST_YMax(bbox) as y2, ST_XMax(bbox) as x2
            from bounds`,
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
            select p.id, p.nome
            from cne.cnes p
            where p.cne_id = ${parseInt(id)}
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
            inner join cne.cnes p on p.community_id = m."communityId"
            where p.versao = 'draft'
            and p.cne_id = ${parseInt(id)}
          `,
      {
        type: Sequelize.QueryTypes.SELECT,
      },
    );

    project.total_members = !members || !members.length ? 0 : members[0].total;

    return project;
  }

  async enterInInitiative(user) {
    /* descobre o id da comunidade rede */
    const result = await db.instance().query(
      `
          select id
          from dorothy_communities dc
          where alias = 'rede_cne'
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

  async sendContact(id, name, email, message) {
    // descobre o id do gt
    let entities;

    entities = await db.instance().query(
      `
            select p.nome,
                p.community_id
            from cne.cnes p
            where p.versao = 'draft' and p.id = :id
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

  async getDraftNetwork(cne_id) {
    let entity = await db.instance().query(
      `
      select *
      from cne.cnes c
      where cne_id = :cne_id
      and versao = 'draft'
      and c."deletedAt" is null
      `,
      {
        replacements: { cne_id },
        type: Sequelize.QueryTypes.SELECT,
      },
    );

    if (!entity.length) return null;

    const relacoes = await db.instance().query(
      `
      select
        cr."data"->>'pp_base' as "pp_base",
        cr."data"->>'apoiada_base' as "apoiada_base",
        cr."data"->>'apoia_base' as "apoia_base"
      from cne.cne_relacoes cr
      where cr.cne_versao_id = :id
      `,
      {
        replacements: { id: entity[0].id },
        type: Sequelize.QueryTypes.SELECT,
      },
    );

    if (!!relacoes.length) {
      entity[0].pp_base = relacoes[0].pp_base;
      entity[0].apoiada_base = relacoes[0].apoiada_base;
      entity[0].apoia_base = relacoes[0].apoia_base;
    } else {
      entity[0].pp_base = 'none';
      entity[0].apoiada_base = 'none';
      entity[0].apoia_base = 'none';
    }

    entity[0].pp = await db.instance().query(
      `
      select
      politica_id as "id",
      p.nome as "name",
      "type",
        other_type
      from
        cne.cne_relacoes cr,
        jsonb_to_recordset((cr."data"->>'politicas')::jsonb) AS specs(politica_id int, "type" jsonb, "other_type" varchar)
      inner join politicas p on p.id = politica_id
      where cr.cne_versao_id = :id
      `,
      {
        replacements: { id: entity[0].id },
        type: Sequelize.QueryTypes.SELECT,
      },
    );
    const pp_length = entity[0].pp.length;

    for (let i = 5; i >= pp_length; i--) entity[0].pp.push({ id: null, name: '', type: [], other_type: '' });

    //****************************

    entity[0].apoiada = await db.instance().query(
      `
      select
        i.id as instituicao_id,
        coalesce(i.nome,'') as instituicao_name,
        case
          when p_i.id is not null then concat('indic_', p_i.id)
          else null
        end	as iniciativa_id,
        coalesce(p_rasc.nome, p_i."name", '') as iniciativa_name,
        "type",
        other_type
      from
        cne.cne_relacoes cr,
          jsonb_to_recordset((cr."data"->>'recebe_apoio')::jsonb) AS specs(instituicao_id int, projeto_indicado_id int, "type" jsonb, "other_type" varchar)
      left join instituicoes i on i.id = instituicao_id
      left join projetos_indicados p_i on p_i.id = projeto_indicado_id
      left join projetos_rascunho p_rasc on p_rasc.id = p_i.projeto_id
      where cr.cne_versao_id = :id
      `,
      {
        replacements: { id: entity[0].id },
        type: Sequelize.QueryTypes.SELECT,
      },
    );

    const apoiada_length = entity[0].apoiada.length;
    for (let i = 5; i >= apoiada_length; i--)
      entity[0].apoiada.push({
        instituicao_id: null,
        instituicao_name: '',
        iniciativa_id: null,
        iniciativa_name: '',
        type: [],
        other_type: '',
      });

    //****************************

    entity[0].apoia = await db.instance().query(
      `
      select
        i.id as instituicao_id,
        coalesce(i.nome,'') as instituicao_name,
        case
          when p_i.id is not null then concat('indic_', p_i.id)
          else null
        end	as iniciativa_id,
        coalesce(p_rasc.nome, p_i."name", '') as iniciativa_name,
        "type",
        other_type
      from
        cne.cne_relacoes cr,
          jsonb_to_recordset((cr."data"->>'oferece_apoio')::jsonb) AS specs(instituicao_id int, projeto_indicado_id int, "type" jsonb, "other_type" varchar)
      left join instituicoes i on i.id = instituicao_id
      left join projetos_indicados p_i on p_i.id = projeto_indicado_id
      left join projetos_rascunho p_rasc on p_rasc.id = p_i.projeto_id
      where cr.cne_versao_id = :id
      `,
      {
        replacements: { id: entity[0].id },
        type: Sequelize.QueryTypes.SELECT,
      },
    );

    const apoia_length = entity[0].apoia.length;
    for (let i = 5; i >= apoia_length; i--)
      entity[0].apoia.push({
        instituicao_id: null,
        instituicao_name: '',
        iniciativa_id: null,
        iniciativa_name: '',
        type: [],
        other_type: '',
      });

    return entity[0];
  }

  async saveDraftNetwork(cne_id, data) {
    let relation_data = {
      politicas: [],
      recebe_apoio: [],
      oferece_apoio: [],
      pp_base: data.pp_base,
      apoiada_base: data.apoiada_base,
      apoia_base: data.apoia_base,
    };

    //********************************************** */

    let result;

    // recupera dados do projeto indicador
    result = await db.instance().query(
      `
      select c.id, c.nome as "name"
      from cne.cnes c
      where c.cne_id = :cne_id
      and c.versao = 'draft'
      and c."deletedAt" is null
      `,
      {
        replacements: { cne_id },
        type: Sequelize.QueryTypes.SELECT,
      },
    );

    const indicador = result[0];

    if (data.pp_base === 'sim') {
      for (let d of data.pp) {
        if (!!d.name) {
          let ppId = d.id;
          if (!ppId) {
            /* cria politica, se necessario */
            result = await db.instance().query(
              `
              INSERT INTO politicas(nome)
              VALUES(:nome)
              RETURNING id
              `,
              {
                replacements: { nome: d.name },
                type: Sequelize.QueryTypes.SELECT,
              },
            );

            ppId = result[0].id;
          }

          relation_data.politicas.push({
            type: d.type,
            other_type: d.other_type,
            politica_id: ppId,
          });
        }
      }
    }

    //********************************************** */

    for (let what of ['apoiada', 'apoia']) {
      if (data[`${what}_base`] === 'sim') {
        for (let d of data[what]) {
          if (!!d.instituicao_name) {
            let instituionId = d.instituicao_id;
            if (!instituionId) {
              /* cria instituicao, se necessario */
              result = await db.instance().query(
                `
              INSERT INTO instituicoes(nome)
              VALUES(:nome)
              RETURNING id
              `,
                {
                  replacements: { nome: d.instituicao_name },
                  type: Sequelize.QueryTypes.SELECT,
                },
              );

              instituionId = result[0].id;
            }

            let projeto_indicado_id = null;

            if (!!d.iniciativa_name.length) {
              let projectId = d.iniciativa_id;
              if (!projectId) {
                /* NOVA */
                result = await db.instance().query(
                  `
                  INSERT INTO projetos_indicados(name, instituicao_id)
                  VALUES (:name, :instituicao_id)
                  RETURNING id
                  `,
                  {
                    replacements: { name: d.iniciativa_name, instituicao_id: instituionId },
                    type: Sequelize.QueryTypes.SELECT,
                  },
                );

                projeto_indicado_id = result[0].id;

                /* NOTIFICACAO */
                let content = {
                  indicationId: projeto_indicado_id,
                  indicationName: d.iniciativa_name,
                  type: what,
                  answered: false,
                };

                await Messagery.sendNotification({ id: 0 }, `room_c${data.communityId}_t1`, {
                  content,
                  userId: 0,
                  tool: {
                    type: 'native',
                    element: 'NewIndicatedProjectNotification',
                  },
                });
              } else {
                /* tem id, indic ou draft */

                const [type, eId] = projectId.split('_');
                //console.log({ type, eId })
                if (type === 'indic') projeto_indicado_id = eId;
                else {
                  // tem indic para este draft_[este ID]?
                  result = await db.instance().query(
                    `
                    select id
                    from projetos_indicados p
                    where p.projeto_id = :id
                    `,
                    {
                      replacements: { id: eId },
                      type: Sequelize.QueryTypes.SELECT,
                    },
                  );

                  if (!!result.length) projeto_indicado_id = result[0].id;
                  else {
                    result = await db.instance().query(
                      `
                      INSERT INTO projetos_indicados(projeto_id, name, instituicao_id)
                      VALUES (:draft_id, :name, :instituicao_id)
                      RETURNING id
                      `,
                      {
                        replacements: { draft_id: eId, name: d.iniciativa_name, instituicao_id: instituionId },
                        type: Sequelize.QueryTypes.SELECT,
                      },
                    );

                    projeto_indicado_id = result[0].id;
                  }

                  /****
                   * NOTIFICACOES
                   */

                  // qual a comunidade deste projeto?
                  result = await db.instance().query(
                    `
                    select p.community_id
                    from projetos_rascunho pr
                    inner join projetos p on p.id = pr.projeto_id
                    where pr.id = :id
                    `,
                    {
                      replacements: { id: eId },
                      type: Sequelize.QueryTypes.SELECT,
                    },
                  );

                  const communityId = result[0].community_id;

                  const content = {
                    sourceProjectId: id,
                    sourceDraftId: indicador.id,
                    sourceProjectName: indicador.name,
                    indicationId: projeto_indicado_id,
                    type: what,
                  };

                  const key = `indication_${indicador.id}_${projeto_indicado_id}_${what}`;

                  await Messagery.sendNotification(
                    { id: 0 },
                    `room_c${communityId}_t1`,
                    {
                      content,
                      userId: 0,
                      tool: {
                        type: 'native',
                        element: 'IndicationNotification',
                      },
                    },
                    [key],
                    true,
                    {
                      dedup: [key],
                    },
                  );
                }
              }
            }

            relation_data[what === 'apoiada' ? 'recebe_apoio' : 'oferece_apoio'].push({
              type: d.type,
              other_type: d.other_type,
              instituicao_id: instituionId,
              projeto_indicado_id,
            });
          }
        }
      }
    }

    /* descobre o id do draft */
    let entity = await db.instance().query(
      `
      select c.id, cr.id as "relation_id"
      from cne.cnes c
      left join cne.cne_relacoes cr on cr.cne_versao_id = c.id
      where c.cne_id = :cne_id
      and c.versao = 'draft'
      and c."deletedAt" is null`,
      {
        replacements: { cne_id },
        type: Sequelize.QueryTypes.SELECT,
      },
    );

    // console.log(JSON.stringify(relation_data))

    const relationId = entity[0].relation_id;
    if (!!relationId) {
      /* Atualiza */
      await db.instance().query(
        `
        update cne.cne_relacoes
        set data = '${JSON.stringify(relation_data).replace(/\:null/g, ': null')}' /* gambiarra */
        where cne_versao_id = :draft_id
        `,
        {
          replacements: { draft_id: entity[0].id },
          type: Sequelize.QueryTypes.UPDATE,
        },
      );
    } else {
      await db.instance().query(
        `
        insert into cne.cne_relacoes(cne_versao_id, data)
        values(:draft_id, '${JSON.stringify(relation_data).replace(/\:null/g, ': null')}')  /* gambiarra */
        `,
        {
          replacements: { draft_id: entity[0].id },
          type: Sequelize.QueryTypes.INSERT,
        },
      );
    }
  }

  async delete(id, user) {
    const result = await this.getIdFromCommunity(id);

    if (result) {
      let cne_id = result.id;

      await db.models['Cne'].destroy({
        where: {
          cne_id,
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
    } else if (membership.some(m => m.id === 1236)) {
      return 1236;
    } else {
      await require('../gt').addMember(1236, user.id);
      return 1236;
    }
  }
}

const singletonInstance = new Service();
module.exports = singletonInstance;
