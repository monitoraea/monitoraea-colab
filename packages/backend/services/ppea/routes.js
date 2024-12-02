const express = require('express');
const router = express.Router();
const multer = require('multer');
const upload = multer(); // Memory
const { sendError } = require('dorothy-dna-services').util;
const entity = require('./index');

const FormManager = require('../../FormsManager')

/* TODO: TMP!!!! */
fileUpload = multer({
  storage: multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, process.env.TMP_DIR);
    },
    filename: function (req, file, cb) {
      cb(null, file.originalname);
    },
  }),
}).single('file');

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

/* router.get('/:id/draft/indics', async (req, res) => {
  const { id } = req.params;

  try {
    const result = await entity.getDraftIndic(id);

    res.json(result);
  } catch (ex) {
    sendError(res, ex, 500);
  }
}); */

/* *** FORMS.Begin *** */
(async function setupForms() {

  const indic_forms = await FormManager.getForms('ppea/indics')

  for (let form of indic_forms) {

    const indic_name = form.replace('indic_', '').replace('.yml', '')
    const indic_form = await FormManager.getForm(`ppea/indics/indic_${indic_name}`)

    router.get(`/:id/draft/indics/${indic_name}`, async (req, res) => {

      try {
        const result = await entity.getDraftIndic(indic_form, indic_name, req.params.id);

        res.json(result);
      } catch (ex) {
        sendError(res, ex, 500);
      }
    });

    router.put(`/:id/draft/indics/${indic_name}`, upload.fields(FormManager.upFields(indic_form)), async (req, res) => {

      try {
        const result = await entity.saveDraftIndic(
          res.locals.user,
          indic_form,
          indic_name,
          FormManager.parse(indic_form, req.body.entity) /* Transformations */,
          req.files,
          req.params.id
        );

        res.json(result);
      } catch (ex) {
        sendError(res, ex, 500);
      }
    });
  }

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

router.post('/upload-shp', fileUpload, async (req, res) => {
  try {
    const result = await entity.importSHP(req.file.path);

    res.json(result);
  } catch (error) {
    sendError(res, error);
  }
});

module.exports = router;
