const express = require('express');
const router = express.Router();
const multer = require('multer');

const stream = require('stream');

const upload = multer(); // Memory
const { sendError } = require('dorothy-dna-services').util;
const entity = require('./index');

const FormManager = require('../../FormsManager');

const upTimelineImage = upload.fields([{ name: 'imagem', maxCount: 1 }]);

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

router.get('/geo', async (req, res) => {
  try {
    const { f_id } = req.query;

    const where = buildFiltersWhere(
      req.query,
      ['p."deletedAt" is null', "p.versao = 'current'"],
    );

    const result = await entity.listProjectsIDs(f_id, where);

    res.json(result);
  } catch (ex) {
    sendError(res, ex);
  }
});

router.get('/regions', async (req, res) => {
  try {
    const where = buildFiltersWhere(
      req.query,
      ['p."deletedAt" is null', "p.versao = 'current'"],
      'f_regioes',
    );

    const result = await entity.getRegions(where);

    res.json(result);
  } catch (ex) {
    sendError(res, ex);
  }
});

router.get('/ufs', async (req, res) => {

  const { f_regioes } = req.query;

  try {

    const result = await entity.getUFs({ f_regioes });

    res.json(result);
  } catch (ex) {
    sendError(res, ex);
  }
});

/* TODO */
router.get('/timeline', async (req, res) => {

  try {
    const result = await entity.getTimeline();

    res.json(result);
  } catch (ex) {
    sendError(res, ex, 500);
  }
});

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
  const { direction } = req.query;

  try {
    const result = await entity.getListForUser(res.locals.user, { direction });

    res.json(result);
  } catch (ex) {
    sendError(res, ex);
  }
});

router.get('/:id/atuacoes', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await entity.getGeo(id);

    res.json(result);
  } catch (ex) {
    sendError(res, ex);
  }
});


router.get('/formap/', async (req, res) => {
  const { page, limit } = req.query;

  const where = buildFiltersWhere(
    req.query,
    ['p."deletedAt" is null', "p.versao = 'current'"],
  );

  try {
    const result = await entity.list4Map(where, {
      page: page ? parseInt(page) : 1,
      limit: limit && limit !== 'none' ? parseInt(limit) : 6,
    });

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

router.post('/enter_in_network', async (req, res) => {
  try {
    const result = await entity.enterInInitiative(res.locals.user);

    res.json(result);
  } catch (ex) {
    sendError(res, ex);
  }
});

router.post('/', async (req, res) => {
  try {
    const { nome } = req.body;

    const result = await entity.createInitiative(nome, res.locals.user);

    res.json(result);
  } catch (ex) {
    sendError(res, ex);
  }
});

/* TODO */
router.delete('/draft/timeline/:tlId', async (req, res) => {
  const { tlId } = req.params;

  try {
    const result = await entity.removeDraftTimeline(tlId);

    res.json(result);
  } catch (ex) {
    sendError(res, ex, 500);
  }
});

router.get('/:id/download', async (req, res) => {
  const { id } = req.params;

  try {
    const { zipFileName, content } = await entity.downloadProject(id);

    // download
    const readStream = new stream.PassThrough();
    readStream.end(content);

    res.set('Content-disposition', 'attachment;filename=' + zipFileName);
    res.set('Content-Type', 'application/octet-stream');

    readStream.pipe(res);
  } catch ({ message }) {
    res.status(401).send({ error: message });
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
router.get('/draft/timeline', async (req, res) => {

  try {
    const result = await entity.getDraftTimeline();

    res.json(result);
  } catch (ex) {
    sendError(res, ex, 500);
  }
});

router.put('/draft/timeline/:tlid', upTimelineImage, async (req, res) => {
  const { tlid } = req.params;
  const { entity: entityData } = req.body;

  const { imagem } = req.files;

  try {
    const result = await entity.saveDraftTimeline(
      res.locals.user,
      JSON.parse(entityData),
      imagem && imagem.length ? imagem[0] : null,
      tlid,
    );

    res.json(result);
  } catch (ex) {
    sendError(res, ex, 500);
  }
});
router.post('/draft/timeline', upTimelineImage, async (req, res) => {
  const { entity: entityData } = req.body;

  const { imagem } = req.files;

  try {
    const result = await entity.saveDraftTimeline(
      res.locals.user,
      JSON.parse(entityData),
      imagem && imagem.length ? imagem[0] : null,
    );

    res.json(result);
  } catch (ex) {
    sendError(res, ex, 500);
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
  /* INFORMAÇÃO */
  const form1 = await FormManager.getForm('ppea/form1');

  router.put('/:id/draft', upload.fields(FormManager.upFields(form1)), async (req, res) => {
    try {
      const result = await entity.saveDraft(
        res.locals.user,
        form1,
        FormManager.parse(form1, req.body.entity) /* Transformations */,
        req.files,
        req.params.id,
      );

      res.json(result);
    } catch (ex) {
      sendError(res, ex, 500);
    }
  });

  /* INDICADORES */

  const indic_forms = await FormManager.getForms('ppea/indics2024');
  let indic_forms_form = {};

  for (let form of indic_forms) {
    const indic_name = form.replace('indic_', '').replace('.yml', '');
    const indic_form = await FormManager.getForm(`ppea/indics2024/indic_${indic_name}`);
    indic_forms_form[indic_name] = indic_form;

    router.get(`/:id/draft/indicadores/${indic_name}`, async (req, res) => {
      try {
        const result = await entity.getDraftIndic(indic_form, indic_name, req.params.id);

        res.json(result);
      } catch (ex) {
        sendError(res, ex, 500);
      }
    });

    router.put(
      `/:id/draft/indicadores/${indic_name}`,
      upload.fields(FormManager.upFields(indic_form)),
      async (req, res) => {
        try {
          const result = await entity.saveDraftIndic(
            res.locals.user,
            indic_form,
            indic_name,
            FormManager.parse(indic_form, req.body.entity) /* Transformations */,
            req.files,
            req.params.id,
          );

          res.json(result);
        } catch (ex) {
          sendError(res, ex, 500);
        }
      },
    );
  }

  /* INDICADORES LEGADOS */

  const indic_forms_old = await FormManager.getForms('ppea/indics');

  for (let form of indic_forms_old) {
    const indic_name = form.replace('indic_', '').replace('.yml', '');
    const indic_form = await FormManager.getForm(`ppea/indics/indic_${indic_name}`);

    router.get(`/:id/draft/indics/${indic_name}`, async (req, res) => {
      try {
        const result = await entity.getDraftIndicOld(indic_form, indic_name, req.params.id);

        res.json(result);
      } catch (ex) {
        sendError(res, ex, 500);
      }
    });

    router.put(`/:id/draft/indics/${indic_name}`, upload.fields(FormManager.upFields(indic_form)), async (req, res) => {
      try {
        const result = await entity.saveDraftIndicOld(
          res.locals.user,
          indic_form,
          indic_name,
          FormManager.parse(indic_form, req.body.entity) /* Transformations */,
          req.files,
          req.params.id,
        );

        res.json(result);
      } catch (ex) {
        sendError(res, ex, 500);
      }
    });
  }

  /* VERIFY */
  router.get('/:id/verify', async (req, res) => {
    try {
      const { id } = req.params;

      /* TODO: SO MODERADOR OU ADM */
      const result = await entity.verify(id, form1, indic_forms_form);

      res.json(result);
    } catch (ex) {
      sendError(res, ex);
    }
  });
})();
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

router.get('/statistics/institutions', async (req, res) => {

  const { enquads } = req.query;

  try {
    const result = await entity.total_institutions({ enquads: enquads ? enquads.split(',') : null });

    res.json(result);
  } catch (ex) {
    sendError(res, ex, 500);
  }
});

router.get('/statistics/iniciatives', async (req, res) => {

  const { enquads } = req.query;

  try {
    const result = await entity.total_iniciatives({ enquads: enquads ? enquads.split(',') : null });

    res.json(result);
  } catch (ex) {
    sendError(res, ex, 500);
  }
});

router.get('/statistics/members', async (req, res) => {

  const { enquads } = req.query;

  try {
    const result = await entity.total_members({ enquads: enquads ? enquads.split(',') : null });

    res.json(result);
  } catch (ex) {
    sendError(res, ex, 500);
  }
});

router.put('/:id/publish', async (req, res) => {
  try {
    const { id } = req.params;

    /* TODO: SO MODERADOR OU ADM */
    const result = await entity.publish(id);

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
router.get('/', async (req, res) => {
  const {  } = req.params;
  const {
    version,
    page,
    order,
    direction,
    limit,
  } = req.query;

  try {
    const result = await entity.list(version, {
      page: page ? parseInt(page) : 1,
      order: order ? order : 'nome',
      direction: direction ? direction : 'ASC',
      limit: limit && limit !== 'none' ? parseInt(limit) : 10,
    });

    res.json(result);
  } catch (ex) {
    sendError(res, ex, 500);
  }
});

function buildFiltersWhere(filters, where = [], exclude = []) {
  let whereArray = [...where];

  // if (filters['f_regioes'] && !exclude.includes('f_regioes'))
  //   whereArray.push(`array[${filters['f_regioes'].split(',').map(r => `'${r}'`)}] && p.regions`);

  if (filters['f_ufs'] && !exclude.includes('f_ufs')) whereArray.push(`p.uf::int[] @> array[${filters['f_ufs']}]`);

  /* if (filters['f_instituicao'] && !exclude.includes('f_instituicao'))
    whereArray.push(`p.instituicao_id IN (${filters['f_instituicao']})`); */

  if (filters['f_ids'] && !exclude.includes('f_ids')) {
    whereArray.push(`p.uf::int[] @> array[${filters['f_ids']}]`);
  }

  return whereArray.length ? `WHERE ${whereArray.join(' AND ')}` : '';
}

module.exports = router;
