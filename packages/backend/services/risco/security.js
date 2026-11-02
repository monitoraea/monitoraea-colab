const { SecurityManager } = require('dorothy-dna-services');
const config = require('../../config');

module.exports = [
  {
    // só administradores limpam o cache dos dados do painel (útil logo depois de recarregar os dados)
    method: 'post',
    route: '/cache/clear',
    func: async (user) => SecurityManager.isMember(user, config.communities.ADM),
  },
];
