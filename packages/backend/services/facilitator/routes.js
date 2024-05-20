const express = require('express');
const router = express.Router();
const { sendError } = require('dorothy-dna-services').util;
const entity = require('./index');

/* TODO */
router.get('/', async (req, res) => {
  const {
    page,
    order,
    direction,
    limit,
  } = req.query;

  try {
    const result = await entity.list({
      page: page ? parseInt(page) : 1,
      order: order ? order : 'name',
      direction: direction ? direction : 'ASC',
      limit,
    });

    res.json(result);
  } catch (ex) {
    sendError(res, ex, 500);
  }
});

router.get('/some_random', async (req, res) => {
  const { limit=4 } = req.query;

  try {
    const result = await entity.listRandom(limit);

    res.json(result);
  } catch (ex) {
    sendError(res, ex, 500);
  }
});

/* TODO */
router.get('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const result = await entity.get(id);

    res.json(result);
  } catch (ex) {
    sendError(res, ex, 500);
  }
});

module.exports = router;