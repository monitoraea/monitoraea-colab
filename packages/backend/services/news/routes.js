const express = require('express');
const router = express.Router();
const { sendError } = require('dorothy-dna-services').util;
const service = require('./index');

router.get('/', async (req, res) => {
  const { page, order, direction, limit, offset } = req.query;

  const result = await service.getAllNews({
    page: page ? parseInt(page) : 1,
    order: order ? order : 'publishedAt',
    direction: direction ? direction : 'DESC',
    limit: limit && limit !== 'none' ? parseInt(limit) : 10,
    all: limit === 'none',
    offset: offset,
    type: 'news',
  });

  res.json({ news: result.entities });
});

router.get('/total', async (req, res) => {
  const result = await service.getTotal();

  res.json(result);
});

router.get('/:id', async (req, res) => {
  const { id } = req.params;

  const result = await service.getNewsById(id);

  res.json(result);
});

router.post('/', async (req, res) => {
  const { id, title, image_url, category, body, image_alt_text, big_image_url } = req.body;

  try {
    const result = await service.save(id, title, image_url, category, body, image_alt_text, big_image_url);

    res.json(result);
  } catch (ex) {
    sendError(res, ex, 500);
  }
});

module.exports = router;
