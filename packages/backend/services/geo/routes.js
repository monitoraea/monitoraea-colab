const express = require('express');
const router = express.Router();
const { sendError } = require('dorothy-dna-services').util;

const entity = require('./index');

router.get("/:e/:key/:id", async (req, res) => {
  const { e, key, id } = req.params;

  try {
    const result = await entity.getGeojson(e, key, id);

    res.json(result);
  } catch (ex) {
    sendError(res, ex, 500);
  }
});

module.exports = router;
