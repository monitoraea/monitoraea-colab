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

    product,
    last,
  } = req.query;

  try {
    const result = await entity.list({
      page: page ? parseInt(page) : 1,
      order: order ? order : 'title',
      direction: direction ? direction : 'ASC',
      limit: limit && limit !== 'none' ? parseInt(limit) : 10,
      all: limit === 'none',

      product,
      last,
    });

    res.json(result);
  } catch (ex) {
    sendError(res, ex, 500);
  }
});


/* TODO */
router.get('/for_indic/:portal/:form', async (req, res) => {
  const { portal, form } = req.params;

  try {
    const result = await entity.getForIndic(portal, form);

    res.json(result);
  } catch (ex) {
    sendError(res, ex, 500);
  }
});

/* TODO */
router.get('/related', async (req, res) => {
  const { type } = req.query;

  try {
    const result = await entity.listRelated(type);

    res.json(result);
  } catch (ex) {
    sendError(res, ex, 500);
  }
});

/* TODO */
router.get('/featured', async (req, res) => {
  const { portal } = req.query;

  try {
    const result = await entity.listFeatured(portal);

    res.json(result);
  } catch (ex) {
    sendError(res, ex, 500);
  }
});

router.get('/by_type/:type', async (req, res) => {
  const { type='news' } = req.params;
  const { page, order, direction, portal, limit, offset } = req.query;

  const result = await entity.getByType({
    page: page ? parseInt(page) : 1,
    order: order ? order : 'publishedAt',
    direction: direction ? direction : 'DESC',
    limit: limit && limit !== 'none' ? parseInt(limit) : 10,
    all: limit === 'none',
    offset: offset,
    type,
    portal,
  });

  res.json(result);
});

/* TODO */
router.get('/faq', async (req, res) => {
  const { portal } = req.query;

  try {
    const result = await entity.getFAQ(portal);

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

/* TODO */
router.post('/', async (req, res) => {
  const model = req.body;

  try {
    const result = await entity.save(model);

    res.json(result);
  } catch (ex) {
    sendError(res, ex, 500);
  }
});

/* TODO */
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const model = req.body;

  try {
    const result = await entity.save(model, id);

    res.json(result);
  } catch (ex) {
    sendError(res, ex, 500);
  }
});

/* TODO */
router.delete('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const result = await entity.remove(id);

    res.json(result);
  } catch (ex) {
    sendError(res, ex, 500);
  }
});

module.exports = router;
