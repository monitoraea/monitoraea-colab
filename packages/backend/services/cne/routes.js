const express = require('express');
const router = express.Router();
const { sendError } = require('dorothy-dna-services').util;
const entity = require('./index');

const FormManager = require('../../FormsManager')



/* TODO */
router.get('/:id/draft/info', async (req, res) => {
  const { id } = req.params;

  try {
    const result = await entity.getDraftInfo(id);

    res.json(result);
  } catch (ex) {
    sendError(res, ex, 500);
  }
});

/* TODO */
router.get('/mine', async (req, res) => {
  try {
    const result = await entity.getListForUser(res.locals.user);

    res.json(result);
  } catch (ex) {
    sendError(res, ex);
  }
});

/* TODO */
router.get('/id_from_community/:community_id', async (req, res) => {
  try {
    const { community_id } = req.params;

    const result = await entity.getIdFromCommunity(community_id);

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

/* *** FORMS.Begin *** */
(async function setupForms() {

  /* INFORMAÇÃO */
  const form1 = await FormManager.getForm('cne/form1')

  /* VERIFY */
  router.get('/:id/verify', async (req, res) => {
    try {
      const { id } = req.params;

      /* TODO: SO MODERADOR OU ADM */
      const result = await entity.verify(id, form1);

      res.json(result);
    } catch (ex) {
      sendError(res, ex);
    }
  });

})()

module.exports = router;
