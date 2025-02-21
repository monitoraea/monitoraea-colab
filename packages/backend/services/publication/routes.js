const express = require('express');
const router = express.Router();

const { sendError } = require('dorothy-dna-services').util;

const entity = require('./index');

router.get('/', async (req, res) => {

  const { tipo, titulo, ano } = req.query;

  try {

    const result = await entity.list({
      tipo, titulo, ano
    });

    res.json(result);
  } catch (ex) {
    sendError(res, ex);
  }
});

router.get('/tipos', async (req, res) => {

  try {

    const result = await entity.listTipos();

    res.json(result);
  } catch (ex) {
    sendError(res, ex);
  }
});

router.get('/anos', async (req, res) => {

  try {

    const result = await entity.listAnos();

    res.json(result);
  } catch (ex) {
    sendError(res, ex);
  }
});

module.exports = router;
