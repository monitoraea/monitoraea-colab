const express = require('express');
const router = express.Router();

const { sendError } = require('dorothy-dna-services').util;

const entity = require('./index');

/* v2 */

router.get('/', async (req, res) => {
  try {

    const result = await entity.list();

    res.json(result);
  } catch (ex) {
    sendError(res, ex);
  }
});

router.get("/:id", async (req, res) => {
  const { id } = req.params;

  try {
      const result = await entity.get(id);

      res.json(result);
  } catch (ex) {
      sendError(res, ex, 500);
  }
});

router.post("/", async (req, res) => {
  const { name } = req.body;

  try {
    const result = await entity.add({
      name,
    });

    res.json(result);
  } catch (ex) {
    sendError(res, ex, 500);
  }
});

/* .v2 */

module.exports = router;
