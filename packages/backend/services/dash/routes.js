const express = require('express');
const router = express.Router();
const { sendError } = require('dorothy-dna-services').util;

const entity = require('./index');

router.get('/home', async (req, res) => {
  const { id } = req.params;

  try {
    const result = await entity.getHomeStatistics(id);

    res.json(result);
  } catch (ex) {
    sendError(res, ex, 500);
  }
});

module.exports = router;
