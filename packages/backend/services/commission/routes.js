const express = require('express');
const router = express.Router();
const { sendError } = require('dorothy-dna-services').util;
const entity = require('./index');

const multer = require('multer');
const upload = multer(); // Memory

const FormManager = require('../../FormsManager')

const upTimelineImage = upload.fields([
  { name: 'imagem', maxCount: 1 },
]);

/* TODO */
router.delete('/:id/draft/timeline/:tlId', async (req, res) => {
  const { id, tlId } = req.params;

  try {
    const result = await entity.removeDraftTimeline(id, tlId);

    res.json(result);
  } catch (ex) {
    sendError(res, ex, 500);
  }
});

/* TODO */
router.get('/:id/draft/timeline', async (req, res) => {
  const { id } = req.params;

  try {
    const result = await entity.getDraftTimeline(id);

    res.json(result);
  } catch (ex) {
    sendError(res, ex, 500);
  }
});

router.put('/:id/draft/timeline/:tlid', upTimelineImage, async (req, res) => {
  const { id, tlid } = req.params;
  const { entity: entityData } = req.body;

  const { imagem } = req.files;

  try {
    const result = await entity.saveDraftTimeline(res.locals.user,
      JSON.parse(entityData),
      imagem && imagem.length ? imagem[0] : null,
      id,
      tlid
    );

    res.json(result);
  } catch (ex) {
    sendError(res, ex, 500);
  }
});
router.post('/:id/draft/timeline', upTimelineImage, async (req, res) => {
  const { id } = req.params;
  const { entity: entityData } = req.body;

  const { imagem } = req.files;

  try {
    const result = await entity.saveDraftTimeline(res.locals.user,
      JSON.parse(entityData),
      imagem && imagem.length ? imagem[0] : null,
      id
    );

    res.json(result);
  } catch (ex) {
    sendError(res, ex, 500);
  }
});

/* *** FORMS.Begin *** */
(async function setupForms() {
  
  const form1 = await FormManager.getForm('ciea/form1')

  router.get('/:id/draft', async (req, res) => {
    const { id } = req.params;

    try {
      const result = await entity.getDraft(id);

      res.json(result);
    } catch (ex) {
      sendError(res, ex, 500);
    }
  }); 

  router.put("/:id/draft", upload.fields(FormManager.upFields(form1)), async (req, res) => {

    try {
      const result = await entity.saveDraft(
        res.locals.user,
        form1,
        FormManager.parse(form1, req.body.entity) /* Transformations */,
        req.files,
        req.params.id
      );

      res.json(result);
    } catch (ex) {
      sendError(res, ex, 500);
    }
  });
})()
/* *** FORMS.End *** */

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
router.get('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const result = await entity.get(id);

    res.json(result);
  } catch (ex) {
    sendError(res, ex, 500);
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

module.exports = router;
