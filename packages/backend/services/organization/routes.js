const express = require('express');
const router = express.Router();

const { sendError } = require('dorothy-dna-services').util;

const entity = require('./index');

router.get('/', async (req, res) => {
  const { page, order, direction, limit, filter } = req.query;

  try {
    const result = await entity.list({
      filter,
      page: page ? parseInt(page) : 1,
      order: order ? order : 'nome',
      direction: direction ? direction : 'ASC',
      limit: limit && limit !== 'none' ? parseInt(limit) : 10,
    });

    res.json(result);
  } catch (ex) {
    sendError(res, ex);
  }
});

router.get('/similar/:id', async (req, res) => {
  const { id } = req.params;
  const { level } = req.query;

  try {
    const result = await entity.getSimilar(id, level || 40);

    res.json(result);
  } catch (ex) {
    sendError(res, ex);
  }
});

router.get('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const result = await entity.get(id);

    res.json(result);
  } catch (ex) {
    sendError(res, ex);
  }
});

module.exports = router;
