const db = require('../database');
const Sequelize = require('sequelize');

const { getSegmentedId } = require('../../utils');

const dayjs = require('dayjs');

const shapefile = require('shapefile');
const simplify = require('simplify-geojson');

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
        * -- TODO
      FROM ppea.politicas p
      WHERE p.politica_id = :id
      AND versao = 'draft'
        `,
      {
        replacements: { id },
        type: Sequelize.QueryTypes.SELECT,
      },
    );

    return entity[0];
  }

  async getDraftInfo(id) {
    const entity = await db.instance().query(
      `
      SELECT
        p.nome,
        p.area,
        p.area_tematica,
        p.link,
        instituicao_nome,
        instituicao_enquadramento,
        responsavel_nome,
        responsavel_cargo,
        responsavel_telefone,
        responsavel_email,
        fase,
        fase_ano,
        fase_descricao,
        dificuldades,
        contemplados
      FROM ppea.politicas p
      WHERE p.politica_id = :id
      AND versao = 'draft'
        `,
      {
        replacements: { id },
        type: Sequelize.QueryTypes.SELECT,
      },
    );

    let policy = entity[0];

    return policy;
  }

  async saveDraft(user, form, entity, files, id) {

    await db.models['Ppea'].update(entity, {
      where: { politica_id: id, versao: 'draft' }
    })

    return entity;
  }

  async getDraftIndic(form, indic_name, id) {
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
        const fileModel = await db.models['File'].findByPk(indicator[f.key])
        // substitui o conteudo no campo
        indicator[f.key] = {
          url: `${process.env.S3_CONTENT_URL}/${this.getFileKey(id, 'ppea', f.key, fileModel.get('url'))}`,
          file: { name: fileModel.get('file_name') },
        }
      }

    }

    return indicator;
  }

  async saveDraftIndic(user, form, indic_name, entity, files, id) {

    const ppea = await db.models['Ppea'].findOne({ where: { politica_id: id, versao: 'draft' } }, {
      raw: true,
      nest: true
    })
    const model = ppea.get({ plain: true })

    // para cada campo file - remove ou atualiza file - substituir valor de file por ID em files
    for (let f of form.fields.filter(f => ['file', 'thumbnail'].includes(f.type))) {

      if (entity[f.key] === 'remove') await this.removeFile(entity, f.key, model[f.key])
      else if (files[f.key]) await this.updateFile(id, entity, files[f.key][0], f.key, `ppea_${f.key}`, model[f.key])
      else entity[f.key] = model.indicadores[indic_name][f.key]

    }

    // gravar JSON em indics na posicao certa (indic_name)
    await db.models['Ppea'].update({ ...model, indicadores: { ...model.indicadores, [indic_name]: entity } }, {
      where: { id: model.id }
    })

    // console.log('>>>>>>>>', { ...model, indicadores: {...model.indicadores, [indic_name]: entity }})

    return entity
  }

  /* *********************** GENERALIZAR.Begin */ /* TODO */
  async removeFile(entity, fieldName, fileId) {

    entity[fieldName] = null

    /* remove file */
    db.models['File'].destroy({
      where: { id: fileId }
    });

    /* TODO: remove from S3? */

    return entity
  }

  async updateFile(id, entity, file, fieldName, document_type, existingFileId) {
    // S3
    await s3.putObject({
      Bucket: s3BucketName,
      Key: this.getFileKey(id, 'ppea', fieldName, file.originalname),
      Body: file.buffer,
      ACL: 'public-read',
    }).promise()

    await this.updateFileModel(
      entity,
      fieldName,
      file.originalname,
      file.originalname.includes('.pdf') ? `application/pdf` : `image/jpeg`,
      document_type,
      existingFileId
    )
  }

  async updateFileModel(entity, fieldName, file_name, content_type, document_type, existingFileId) {
    let fileModel
    if (existingFileId) fileModel = await db.models['File'].findByPk(existingFileId)

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

  getFileKey(id, main_folder, folder, filename) {
    const segmentedId = getSegmentedId(id);

    return `${main_folder}/${segmentedId}/${folder}/original/${filename}`;
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
        where politica_id = :id`,
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
    )

    if (!p_draft.length) throw new Error('Unknow draft!')

    const politica_versao_id = p_draft[0].id

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
}

const singletonInstance = new Service();
module.exports = singletonInstance;
