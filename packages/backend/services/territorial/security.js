const { SecurityManager } = require('dorothy-dna-services');
const config = require('../../config');

module.exports = [
  {
    // só administradores forçam o recálculo do painel territorial
    method: 'post',
    route: '/:id/painel/reload',
    func: async (user) => SecurityManager.isMember(user, config.communities.ADM),
  },
];
