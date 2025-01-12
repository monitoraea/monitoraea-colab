const express = require('express');
const router = express.Router();
const { sendError } = require('dorothy-dna-services').util;
const entity = require('./index');

/* TODO */
router.get('/mine', async (req, res) => {
  try {
    const result = await entity.getListForUser(res.locals.user);

    res.json(result);
  } catch (ex) {
    sendError(res, ex);
  }
});

router.post('/:id/participate', async (req, res) => {
  try {
    const { id } = req.params;
    const { isADM } = req.body;

    const result = await entity.participate(res.locals.user, id, isADM);

    res.json(result);
  } catch (error) {
    res.json({ error: error.message });
  }
});

module.exports = router;
