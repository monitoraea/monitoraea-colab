const { SecurityManager } = require('dorothy-dna-services');
const config = require('../config');

module.exports = {
    'community': [
        {
            method: 'get', route: '/', func: async (user, req) => { 
            
                return (await SecurityManager.isMember(user, config.communities.ADM ));
            }
        }    
    ],
    'user': [
        {
            method: 'get', route: '/me/community/:id/membership', func: async (user, req) => {
                let { id } = req.params;
    
                /* O usuario e' membro desta comunidade */
                /* OU O usuario e' membro de comunidade especial (ADM) */
    
                return (await SecurityManager.isMember(user, [id, config.communities.ADM]));
            }
        },
        
    ]
}