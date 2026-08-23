const express = require('express');
const router = express.Router();
const { sendError } = require('dorothy-dna-services').util;

const entity = require('./index');

router.get('/:id', async (req, res) => {
  const { id } = req.params;

  if (!/^\d+$/.test(id)) {
    return sendError(res, new Error('Invalid help request id'), 400);
  }

  try {
    const result = await entity.get(id);

    res.json(result);
  } catch (ex) {
    sendError(res, ex, 500);
  }
});

router.put('/:id/close', async (req, res) => {
  const { id } = req.params;
  const { communityId } = req.body;

  if (!/^\d+$/.test(id)) {
    return sendError(res, new Error('Invalid help request id'), 400);
  }

  try {
    const result = await entity.close(id, communityId);

    res.json(result);
  } catch (ex) {
    sendError(res, ex, 500);
  }
});

router.post('/request', async (req, res) => {
  const {
    communityId,
    tab,
    text,
  } = req.body;

  try {
    const result = await entity.request(res.locals.user.id, communityId, tab, text);

    res.json(result);
  } catch (ex) {
    sendError(res, ex, 500);
  }
});

module.exports = router;
