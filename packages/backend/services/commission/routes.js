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



router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { user } = req.body;

    /* TODO: SO MODERADOR OU ADM */
    const result = await entity.delete(id, res.locals.user);

    res.json(result);
  } catch (ex) {
    sendError(res, ex);
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

router.get('/', async (req, res) => {
  try {
    const { page, f_id, limit } = req.query;

    const where = buildFiltersWhere(req.query, ["versao = 'draft'"]); // TODO: 'current'

    const result = await entity.list(page ? parseInt(page) : 1, f_id, where, limit);

    res.json(result);
  } catch (ex) {
    sendError(res, ex);
  }
});

router.get('/geo', async (req, res) => {
  try {
    const { f_id } = req.query;

    const where = buildFiltersWhere(req.query, ["versao = 'draft'"]); // TODO: 'current'

    const result = await entity.listIDs(f_id, where);

    res.json(result);
  } catch (ex) {
    sendError(res, ex);
  }
});

router.get('/ufs', async (req, res) => {
  try {
    const { f_regioes } = req.query;

    const result = await entity.getUFs(f_regioes);

    res.json(result);
  } catch (ex) {
    sendError(res, ex);
  }
});



router.get('/options', async (req, res) => {
  const { all } = req.query;

  try {
    const result = await entity.getOptions(all && all === 1);

    res.json(result);
  } catch (ex) {
    sendError(res, ex);
  }
});

function buildFiltersWhere(filters, where = [], exclude = []) {
  let whereArray = [...where];

  if (filters['f_regioes'] && !exclude.includes('f_regioes'))
    whereArray.push(
      `u.nm_regiao IN (${filters['f_regioes']
        .split(',')
        .map(r => `'${r}'`)
        .join(',')})`,
    );
  if (filters['f_ufs'] && !exclude.includes('f_ufs')) whereArray.push(`u.id IN (${filters['f_ufs']})`);

  return whereArray.length ? `WHERE ${whereArray.join(' AND ')}` : '';
}
router.get('/:id/atuacoes', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await entity.getGeo(id);

    res.json(result);
  } catch (ex) {
    sendError(res, ex);
  }
});

router.post('/:id/send_contact', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, message } = req.body;

    const result = await entity.sendContact(id, name, email, message);

    res.json(result);
  } catch (error) {
    sendError(res, error);
  }
});

router.post('/enter_in_network', async (req, res) => {
  try {

    const result = await entity.enterInInitiative(res.locals.user);

    res.json(result);
  } catch (ex) {
    sendError(res, ex);
  }
});

router.get('/for_participation/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await entity.getInfoForParticipation(id);

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

module.exports = router;
