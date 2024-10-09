const express = require('express');
const router = express.Router();
const { sendError } = require('dorothy-dna-services').util;
const entity = require('./index');

const multer = require('multer');
const upload = multer(); // Memory

const upFields = upload.fields([
  { name: 'logo', maxCount: 1 }, 
  { name: 'documento_criacao', maxCount: 1 }, 
  { name: 'regimento_interno', maxCount: 1 },
  { name: 'ppea', maxCount: 1 },
  { name: 'ppea2', maxCount: 1 },
  { name: 'programa_estadual', maxCount: 1 },
  { name: 'plano_estadual', maxCount: 1 },
]);

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

/* TODO */
router.get('/:id/draft', async (req, res) => {
  const { id } = req.params;

  try {
    const result = await entity.getDraft(id);

    res.json(result);
  } catch (ex) {
    sendError(res, ex, 500);
  }
});


/* TODO */
router.put("/:id/draft", upFields, async (req, res) => {
  const { id } = req.params;
  const { entity: entityData } = req.body;

  const { logo, documento_criacao, regimento_interno, ppea, ppea2, programa_estadual, plano_estadual } = req.files;

  try {
      const result = await entity.saveDraft(res.locals.user,
          JSON.parse(entityData),
          {
              logo_arquivo: logo && logo.length ? logo[0] : null,
              documento_criacao_arquivo: documento_criacao && documento_criacao.length ? documento_criacao[0] : null,
              regimento_interno_arquivo: regimento_interno && regimento_interno.length ? regimento_interno[0] : null,
              ppea_arquivo: ppea && ppea.length ? ppea[0] : null,
              ppea2_arquivo: ppea2 && ppea2.length ? ppea2[0] : null,
              programa_estadual_arquivo: programa_estadual && programa_estadual.length ? programa_estadual[0] : null,
              plano_estadual_arquivo: plano_estadual && plano_estadual.length ? plano_estadual[0] : null,
          },
          id
      );

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
