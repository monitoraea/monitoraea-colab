const db = require('../database');
const Sequelize = require('sequelize');

// const FormManager = require('../../FormsManager')

const { /* applyJoins ,*/ applyWhere, /* getIds ,*/ protect, getSegmentedId } = require('../../utils');

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
}

const singletonInstance = new Service();
module.exports = singletonInstance;