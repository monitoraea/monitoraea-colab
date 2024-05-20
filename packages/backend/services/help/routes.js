const express = require('express');
const router = express.Router();
const { sendError } = require('dorothy-dna-services').util;

const entity = require('./index');

router.get('/:id', async (req, res) => {
  const { id } = req.params;

  const result = await entity.get(id);

  res.json(result);
});

router.put('/:id/close', async (req, res) => {
  const { id } = req.params;
  const { communityId } = req.body;

  const result = await entity.close(id, communityId);

  res.json(result);
});

router.post('/request', async (req, res) => {
  const {
    communityId,
    tab,
    text,
  } = req.body;

  const result = await entity.request(res.locals.user.id, communityId, tab, text);

  res.json(result);
});

module.exports = router;
