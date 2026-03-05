const security = require('../../security-manager');

module.exports = [
    {
        method: 'get', route: '/me/community/:id/membership', func: async (user, req) => {
            let { id } = req.params;

            /* O usuario e' membro desta comunidade */
            return (await security.isMember(user, id));
        }
    }
]