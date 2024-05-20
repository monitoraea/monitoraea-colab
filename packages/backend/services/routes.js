const path = require('path');
const fs = require('fs');
const router = require('express').Router();

const { SecurityManager } = require('dorothy-dna-services');

const services = require('.');

/* DOROTHY SERVICES */
router.use(require('dorothy-dna-services').router);

/* DOROTHY SECURITY */
SecurityManager.addFromConfig(
  require('./dorothy_security'),
); /* sobrepoe a regras core */

/* Service routes */
services.forEach(m => {
  let ePath = path.resolve('services', `${m}/routes.js`);
  let ePathSecurity = path.resolve('services', `${m}/security.js`);

  if (fs.existsSync(ePath)) {
    console.log(`Mapped service: ${m}`);
    router.use(`/${m}`, require(ePath));
  }

  if (fs.existsSync(ePathSecurity)) {
    SecurityManager.add(m, require(ePathSecurity));
  }
});

/* WELCOME */
router.get('/', async (req, res) => {
  res.json({ alive: true });
});

module.exports = router;
