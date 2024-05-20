const express = require('express');
const router = express.Router();
const { sendError } = require('dorothy-dna-services').util;

const entity = require('./index');

router.get('/home', async (req, res) => {
  const { id } = req.params;

  const result = await entity.getHomeStatistics(id);

  res.json(result);
});

module.exports = router;
