const express = require('express');
const router = express.Router();

const { sendError } = require('dorothy-dna-services').util;

const entity = require('./index');

router.get('/', async (req, res) => {

  try {

    const result = await entity.list();

    res.json(result);
  } catch (ex) {
    sendError(res, ex);
  }
});

module.exports = router;
