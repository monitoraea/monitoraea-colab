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

router.get('/:id/geo-draw/has-geo', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await entity.hasGeo(id);

    res.json(result);
  } catch (error) {
    sendError(res, error);
  }
});

router.put('/:id/geo-draw/:isAble', async (req, res) => {
  try {
    const { id, isAble } = req.params;

    const result = await entity.geoAble(id, isAble);

    res.json(result);
  } catch (error) {
    sendError(res, error);
  }
});

router.get('/:id/geo-draw', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await entity.getGeoDraw(id);

    res.json(result);
  } catch (error) {
    sendError(res, error);
  }
});

router.post('/:id/geo-draw', async (req, res) => {
  try {
    const { id } = req.params;
    const { geoms } = req.body;

    const result = await entity.getGeoDrawSave(id, geoms);

    res.json(result);
  } catch (error) {
    sendError(res, error);
  }
});

router.post('/upload-shp', fileUpload, async (req, res) => {
  try {
    const result = await entity.importSHP(req.file.path);

    res.json(result);
  } catch (error) {
    sendError(res, error);
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
/* *** FORMS.End *** */

router.put('/:id/draft/justification', async (req, res) => {
  try {
    const { id } = req.params;
    const { value } = req.body;

    const result = await entity.saveProjectJustDraft(id, value);

    res.json(result);
  } catch (ex) {
    sendError(res, ex);
  }
});

module.exports = router;
