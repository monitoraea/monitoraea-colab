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
}

const singletonInstance = new Service();
module.exports = singletonInstance;