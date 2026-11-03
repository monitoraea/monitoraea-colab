const express = require('express');
const router = express.Router();
const multer = require('multer');

const { sendError } = require('dorothy-dna-services').util;
const { SecurityManager } = require('dorothy-dna-services');
const entity = require('./index');

const fileUpload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, process.env.TMP_DIR),
    filename: (req, file, cb) => cb(null, file.originalname),
  }),
  limits: { fileSize: 25 * 1024 * 1024 }, // 25MB
}).single('file');

router.get('/id_from_community/:community_id', async (req, res) => {
  try {
    res.json(await entity.getIdFromCommunity(req.params.community_id));
  } catch (ex) {
    sendError(res, ex);
  }
});

router.get('/:id/geo-draw', async (req, res) => {
  try {
    res.json(await entity.getGeoDraw(req.params.id));
  } catch (ex) {
    sendError(res, ex);
  }
});

router.post('/:id/geo-draw', async (req, res) => {
  try {
    res.json(await entity.getGeoDrawSave(req.params.id, req.body.geoms));
  } catch (ex) {
    sendError(res, ex);
  }
});

/* Painel: iniciativas dentro do recorte (cache por GT) */
router.get('/:id/painel', async (req, res) => {
  try {
    res.json(await entity.getPanel(req.params.id));
  } catch (ex) {
    sendError(res, ex);
  }
});

/* Mapa do painel: contorno + geometrias das iniciativas recortadas (cache por GT) */
router.get('/:id/painel/mapa', async (req, res) => {
  try {
    res.json(await entity.getMap(req.params.id));
  } catch (ex) {
    sendError(res, ex);
  }
});

/* Descarta o cache do GT e recalcula. Restrito a administradores (security.js). */
router.post('/:id/painel/reload', SecurityManager.check(async (req, res) => {
  try {
    entity.invalidate(req.params.id);
    res.json(await entity.getPanel(req.params.id));
  } catch (ex) {
    sendError(res, ex);
  }
}));

router.post('/upload-shp', fileUpload, async (req, res) => {
  try {
    res.json(await entity.importSHP(req.file.path));
  } catch (ex) {
    sendError(res, ex);
  }
});

module.exports = router;
