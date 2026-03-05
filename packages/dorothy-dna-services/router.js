const express = require('express');
const router = express.Router();

const security = require('./security-manager');

/* TOKEN MIDDLEWARE */
router.use(require('./token-router'));

/* USER */
security.add('user', require('./services/user/security.js'));
router.use('/user', require('./services/user/router.js'));

/* COMMUNITY */
security.add('community', require('./services/community/security.js'));
router.use('/community', require('./services/community/router.js'));

/* MESSAGERY */
security.add('messagery', require('./services/messagery/security.js'));
router.use('/messagery', require('./services/messagery/router.js'));

module.exports = router; 