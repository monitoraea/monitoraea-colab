const { SecurityManager } = require('dorothy-dna-services');
const config = require('../config');

const db = require('./database');
const Sequelize = require('sequelize');

module.exports = {
    'community': [
        {
            method: 'get', route: '/', func: async (user, req) => {

                return (await SecurityManager.isMember(user, config.communities.ADM));
            }
        }
    ],
    'user': [
        {
            method: 'get', route: '/me/community/:id/membership', func: async (user, req) => {
                let { id } = req.params;

                /* O usuario e' membro desta comunidade */
                /* OU O usuario e' membro de comunidade de gestao desta comunidade */

                const result = await db.instance().query(`
                select p.adm_community_id  
                from perspectives p 
                inner join dorothy_communities dc on dc.alias = any(p.aliases) 
                and dc.id = :id
                `,
                    {
                        type: Sequelize.QueryTypes.SELECT,
                        replacements: { id }
                    },
                );

                
                if(!result.length) return false;
                return (await SecurityManager.isMember(user, [id, result[0].adm_community_id]));
            }
        },

    ]
}