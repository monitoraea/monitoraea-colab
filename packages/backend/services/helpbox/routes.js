const express = require('express');
const router = express.Router();
const { sendError } = require('dorothy-dna-services').util;

const entity = require('./index');

router.get('/:keyref', async (req, res) => {
  const { keyref } = req.params;

  try {
    const result = await entity.getContentIdByKeyRef(keyref);
    res.json(result);
  } catch (ex) {
    sendError(res, ex, 500);
  }
});

router.get('/content/:id', async (req, res) => {
  const { id: content_id } = req.params;

  try {
    const result = await entity.getHelpboxByContentId(content_id);
    res.json(result);
  } catch (ex) {
    sendError(res, ex, 500);
  }
});

module.exports = router;
