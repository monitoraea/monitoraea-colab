const express = require('express');
const router = express.Router();
const { sendError } = require('dorothy-dna-services').util;
const entity = require('./index');

const multer = require('multer');
const upload = multer(); // Memory

const upFields = upload.fields([{ name: 'logo', maxCount: 1 }, { name: 'documento_criacao', maxCount: 1 }]);

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

  const { logo, documento_criacao } = req.files;

  try {
      const result = await entity.saveDraft(res.locals.user,
          JSON.parse(entityData),
          {
              logo_arquivo: logo && logo.length ? logo[0] : null,
              documento_criacao_arquivo: documento_criacao && documento_criacao.length ? documento_criacao[0] : null,
          },
          id
      );

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

module.exports = router;
