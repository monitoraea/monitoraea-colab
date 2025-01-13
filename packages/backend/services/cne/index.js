const db = require('../database');
const Sequelize = require('sequelize');

// const FormManager = require('../../FormsManager')

const { /* applyJoins ,*/ applyWhere, /* getIds ,*/ protect, getSegmentedId } = require('../../utils');

const { check } = require('../../form_utils')

class Service {
    /* Entity */
    async getListForUser(user) {
        const entities = await db.instance().query(`
        with entities as (
            select 
                c.id,
                dc.id as "community_id",
                dc.descriptor_json->>'title' as "name",
                count(dm.*) > 0 as "has_members"
            from cne.cnes c 
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

        return entities;
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
            ` select  c.id
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

    async getDraftInfo(id) {
        const entity = await db.instance().query(
            `
          SELECT
            p.nome,
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

        let policy = entity[0];

        return policy;
    }

    async verify(id, form) {

        // get data
        const data = await this.getDraftInfo(id)

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

            if (!data.atuacao_naplica_just || !data.atuacao_naplica_just.length) analysis.question_problems.push('naplica_just');
        }

        // check INFORMACOES
        const { is_form_valid, fields } = check(form, data)
        if (!is_form_valid) conclusion.ready = false
        analysis.information = { ...fields }

        return {
            ready: conclusion.ready,
            analysis,
        }
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
    async getGeoDrawSave(id, geoms) {

        // encontra a versao draft desta cne
        const p_draft = await db.instance().query(
            `
            select id
            from cne.cnes p
            where p.cne_id = :id
            and p.versao = 'draft'
        `,
            {
                replacements: { id },
                type: Sequelize.QueryTypes.SELECT,
            },
        )

        if (!p_draft.length) throw new Error('Unknow draft!')

        const cne_versao_id = p_draft[0].id

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
}

const singletonInstance = new Service();
module.exports = singletonInstance;