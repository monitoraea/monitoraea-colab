const express = require('express');
const router = express.Router();
const multer = require('multer');

const stream = require('stream');

const { IDService } = require('dorothy-dna-services');

const { emitError } = require('../utils');

const { sendError } = require('dorothy-dna-services').util;

const constants = {
  communities: {
    ADM: 1,
  },
};

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

const upload = multer(); // Memory

const upTimelineImage = upload.fields([{ name: 'imagem', maxCount: 1 }]);

const service = require('./index');

/* TODO */
router.delete('/:id/draft/timeline/:tlId', async (req, res) => {
  const { id, tlId } = req.params;

  try {
    const result = await service.removeDraftTimeline(id, tlId);

    res.json(result);
  } catch (ex) {
    sendError(res, ex, 500);
  }
});

/* TODO */
router.get('/:id/draft/timeline', async (req, res) => {
  const { id } = req.params;

  try {
    const result = await service.getDraftTimeline(id);

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
    const result = await service.saveDraftTimeline(
      res.locals.user,
      JSON.parse(entityData),
      imagem && imagem.length ? imagem[0] : null,
      id,
      tlid,
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
    const result = await service.saveDraftTimeline(
      res.locals.user,
      JSON.parse(entityData),
      imagem && imagem.length ? imagem[0] : null,
      id,
    );

    res.json(result);
  } catch (ex) {
    sendError(res, ex, 500);
  }
});

router.get('/:id/download', async (req, res) => {
  const { id } = req.params;

  try {
    const { zipFileName, content } = await service.downloadProject(id);

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

router.get('/spreadsheet', async (req, res) => {
  try {
    /* TODO: SO MODERADOR OU ADM */
    const { zipFileName, content } = await service.spreadsheet();
    console.log('titulo ', zipFileName, content);
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

router.get('/list', async (req, res) => {
  try {
    const { nome } = req.query;

    const where = buildFiltersWhere(req.query, [
      'publicacao is NOT NULL',
      `LOWER(unaccent(nome)) like '%${nome.toLowerCase()}%'`,
    ]);

    const result = await service.listProjectsByName(where);

    res.json(result);
  } catch (ex) {
    sendError(res, ex);
  }
});

router.get('/list_all_indic', async (req, res) => {
  try {
    const { me } = req.query;

    const result = await service.listAllIndicProjects(me);

    res.json(result);
  } catch (ex) {
    sendError(res, ex);
  }
});

router.get('/opt_relations/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await service.getOptRelations(id);

    res.json(result);
  } catch (ex) {
    sendError(res, ex);
  }
});

router.get('/opt_relations', async (req, res) => {
  try {
    const { institution } = req.query;

    const result = await service.listOptRelations({
      institution,
    });

    res.json(result);
  } catch (ex) {
    sendError(res, ex);
  }
});

router.get('/instiuicao/list', async (req, res) => {
  try {
    const { nome } = req.query;

    const result = await service.listIntituicoesByName(nome);

    res.json(result);
  } catch (ex) {
    sendError(res, ex);
  }
});

router.get('/facilitators_states', async (req, res) => {
  try {
    const result = await service.listFacilitatorsStates();

    res.json(result);
  } catch (ex) {
    sendError(res, ex);
  }
});

router.get('/facilitators', async (req, res) => {
  const { uf } = req.query;

  try {
    const result = await service.listFacilitators({ uf });

    res.json(result);
  } catch (ex) {
    sendError(res, ex);
  }
});

router.get('/facilitator', async (req, res) => {
  try {
    const { community_id } = req.query;

    const result = await service.listProjectsByFacilitator(community_id);

    res.json(result);
  } catch (ex) {
    sendError(res, ex);
  }
});

router.get('/municipios', async (req, res) => {
  try {
    const { nome } = req.query;

    const where = buildFiltersWhere(
      req.query,
      [`LOWER(unaccent(m.nm_mun)) like '%${nome.toLowerCase()}%'`],
      ['f_municipios'],
    );

    const result = await service.listMunicipiosByName(where);

    res.json(result);
  } catch (ex) {
    sendError(res, ex);
  }
});

router.get('/options', async (req, res) => {
  const { all } = req.query;

  try {
    const result = await service.getOptions(all && all === 1);

    res.json(result);
  } catch (ex) {
    sendError(res, ex);
  }
});

router.get('/regions', async (req, res) => {
  try {
    const result = await service.getAllRegions();

    res.json(result);
  } catch (ex) {
    sendError(res, ex);
  }
});

router.get('/ufs', async (req, res) => {
  try {
    const { f_regioes } = req.query;

    const result = await service.getUFs(f_regioes);

    res.json(result);
  } catch (ex) {
    sendError(res, ex);
  }
});

router.get('/uf_list', async (req, res) => {
  try {
    const { f_regioes } = req.query;

    const result = await service.getUFList(f_regioes);

    res.json(result);
  } catch (ex) {
    sendError(res, ex);
  }
});

router.get('/id_from_community/:community_id', async (req, res) => {
  try {
    const { community_id } = req.params;

    const result = await service.getProjectIdFromCommunity(community_id);

    res.json(result);
  } catch (ex) {
    sendError(res, ex);
  }
});

router.get('/suggestions/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await service.getSuggestion(id);

    res.json(result);
  } catch (ex) {
    sendError(res, ex);
  }
});

router.get('/translate/:field/:values', async (req, res) => {
  try {
    const { field, values } = req.params;

    const result = await service.translate(field, values.split(','));

    res.json(result);
  } catch (ex) {
    sendError(res, ex);
  }
});

router.get('/:id/draft', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await service.getProjectDraft(id);

    res.json(result);
  } catch (ex) {
    sendError(res, ex);
  }
});

router.get('/:id/relation/agreement/:type/:sourceDraftId/:indicationId', async (req, res) => {
  try {
    const { id, type, sourceDraftId, indicationId } = req.params;

    const result = await service.getRelationAgreement(id, type, sourceDraftId, indicationId);

    res.json(result);
  } catch (ex) {
    sendError(res, ex);
  }
});

router.put('/:id/relation/agreement', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await service.saveRelationAgreement(id, req.body);

    res.json(result);
  } catch (ex) {
    sendError(res, ex);
  }
});

router.put('/:id/draft/indicadores/:lae_id/:indic/:question/file', fileUpload, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await saveProjectDraftIndicFile(id, lae_id, indic, question, file);

    res.json(result);
  } catch (ex) {
    sendError(res, ex);
  }
});

router.put('/:id/draft/indicadores/:lae_id/:indic/:question', async (req, res) => {
  try {
    const { value } = req.body;

    const { id, lae_id, indic, question } = req.params;

    const result = await service.saveProjectDraftIndic(id, lae_id, indic, question, value);

    res.json(result);
  } catch (ex) {
    sendError(res, ex);
  }
});

router.put('/:id/draft', async (req, res) => {
  try {
    const data = req.body;

    const result = await service.saveProjectDraft(data);

    res.json(result);
  } catch (ex) {
    sendError(res, ex);
  }
});

router.put('/:id/draft/justification', async (req, res) => {
  try {
    const { id } = req.params;
    const { value } = req.body;

    const result = await service.saveProjectJustDraft(id, value);

    res.json(result);
  } catch (ex) {
    sendError(res, ex);
  }
});

/* TODO */
router.get('/mine', async (req, res) => {
  const { direction } = req.query;

  try {
    const result = await service.getListForUser(res.locals.user, { direction });

    res.json(result);
  } catch (ex) {
    sendError(res, ex);
  }
});

router.get('/:id/atuacoes', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await service.getProjectGeo(id);

    res.json(result);
  } catch (ex) {
    sendError(res, ex);
  }
});

router.post('/:id/:field/suggest', async (req, res) => {
  try {
    const { id, field } = req.params;

    const { data, communityId } = req.body;

    const result = await service.suggest(id, field, data, communityId, res.locals.user);

    res.json(result);
  } catch (ex) {
    sendError(res, ex);
  }
});
router.post('/suggestions/:id/vote', async (req, res) => {
  try {
    const { id } = req.params;
    const { like } = req.query;

    const result = await service.vote(id, like, res.locals.user);

    res.json(result);
  } catch (ex) {
    sendError(res, ex);
  }
});
router.get('/suggestions/:id/votes', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await service.getVotes(id);

    res.json(result);
  } catch (ex) {
    sendError(res, ex);
  }
});
router.get('/suggestions/:id/myvote', async (req, res) => {
  try {
    const { id } = req.params;
    const { like } = req.query;

    const result = await service.myVote(id, res.locals.user);

    res.json(result);
  } catch (ex) {
    sendError(res, ex);
  }
});
router.post('/suggestions/:id/promote', async (req, res) => {
  try {
    const { id } = req.params;
    const { communityId } = req.body;

    const result = await service.promote(id, communityId, res.locals.user);

    res.json(result);
  } catch (ex) {
    sendError(res, ex);
  }
});

router.post('/', async (req, res) => {
  try {
    const { nome } = req.body;
    const { communityId } = req.query;

    const result = await service.createProject(nome, communityId, res.locals.user);

    res.json(result);
  } catch (ex) {
    sendError(res, ex);
  }
});

router.get('/total', async (req, res) => {
  try {
    const result = await service.getTotal();

    res.json(result);
  } catch (ex) {
    sendError(res, ex);
  }
});

router.get('/getnames', async (req, res) => {
  try {
    const { ids } = req.query;

    const result = await service.getNames(ids);

    res.json(result);
  } catch (ex) {
    sendError(res, ex);
  }
});

router.get('/geo', async (req, res) => {
  try {
    const { f_id } = req.query;

    const where = buildFiltersWhere(req.query, ['publicacao is NOT NULL']);

    const result = await service.listProjectsIDs(f_id, where);

    res.json(result);
  } catch (ex) {
    sendError(res, ex);
  }
});

router.get('/:id/waiting-list', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await service.waiting(id);

    res.json(result);
  } catch (error) {
    res.json({ error: error.message });
  }
});
router.get('/waiting-list', async (req, res) => {
  try {
    const result = await service.waiting();

    res.json(result);
  } catch (error) {
    res.json({ error: error.message });
  }
});
router.put('/waiting-list/:id', async (req, res) => {
  /* TODO: seguranca */

  const { id } = req.params;

  try {
    const result = await service.approveWaiting(id);

    res.json(result);
  } catch (error) {
    res.json({ error: error.message });
  }
});
router.delete('/waiting-list/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const result = await service.cancelWaiting(id);

    res.json(result);
  } catch (error) {
    res.json({ error: error.message });
  }
});

router.get('/', async (req, res) => {
  try {
    const { page, f_id, limit } = req.query;

    const where = buildFiltersWhere(req.query, ['publicacao is NOT NULL']);

    const result = await service.listProjects(page ? parseInt(page) : 1, f_id, where, limit);

    res.json(result);
  } catch (ex) {
    sendError(res, ex);
  }
});

router.get('/from_map', async (req, res) => {
  try {
    const { ids } = req.query;

    const result = await service.fromMap(ids);

    res.json(result);
  } catch (ex) {
    sendError(res, ex);
  }
});

function buildFiltersWhere(filters, where = [], exclude = []) {
  let whereArray = [...where];
  // if (filters['f_modalidades'] && !exclude.includes('f_modalidades'))
  //   whereArray.push(`p.modalidade_id IN (${filters['f_modalidades']})`);
  if (filters['f_linhas_acao'] && !exclude.includes('f_linhas_acao'))
    whereArray.push(`pla.linha_acao_id IN (${filters['f_linhas_acao']})`);
  if (filters['f_regioes'] && !exclude.includes('f_regioes'))
    whereArray.push(
      `pa.nm_regiao IN (${filters['f_regioes']
        .split(',')
        .map(r => `'${r}'`)
        .join(',')})`,
    );
  if (filters['f_ufs'] && !exclude.includes('f_ufs')) whereArray.push(`m.cd_uf IN (${filters['f_ufs']})`);
  if (filters['f_municipios'] && !exclude.includes('f_municipios'))
    whereArray.push(`m.cd_mun IN (${filters['f_municipios']})`);
  if (filters['f_instituicao'] && !exclude.includes('f_instituicao'))
    whereArray.push(`p.instituicao_id IN (${filters['f_instituicao']})`);

  if (filters['f_instituicao_segmento'] && !exclude.includes('f_instituicao_segmento'))
    whereArray.push(`ARRAY[${filters['f_instituicao_segmento']}] && i.segmentos`);

  if (filters['f_ids'] && !exclude.includes('f_ids')) whereArray.push(`p.id IN (${filters['f_ids']})`);

  return whereArray.length ? `WHERE ${whereArray.join(' AND ')}` : '';
}

router.get('/:id/geo-draw/has-geo', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await service.hasGeo(id);

    res.json(result);
  } catch (error) {
    sendError(res, error);
  }
});

router.put('/:id/geo-draw/:isAble', async (req, res) => {
  try {
    const { id, isAble } = req.params;

    const result = await service.geoAble(id, isAble);

    res.json(result);
  } catch (error) {
    sendError(res, error);
  }
});

router.get('/:id/geo-draw', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await service.getGeoDraw(id);

    res.json(result);
  } catch (error) {
    sendError(res, error);
  }
});

router.post('/:id/geo-draw', async (req, res) => {
  try {
    const { id } = req.params;
    const { geoms } = req.body;

    const result = await service.getGeoDrawSave(id, geoms);

    res.json(result);
  } catch (error) {
    sendError(res, error);
  }
});

router.post('/:id/send_contact', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, message } = req.body;

    const result = await service.sendContact(id, name, email, message);

    res.json(result);
  } catch (error) {
    sendError(res, error);
  }
});

router.post('/:id/participate', async (req, res) => {
  try {
    const { id } = req.params;
    const { isADM } = req.body;

    const result = await service.participate(res.locals.user, id, isADM);

    res.json(result);
  } catch (error) {
    res.json({ error: error.message });
  }
});

router.post('/upload-shp', fileUpload, async (req, res) => {
  try {
    const result = await service.importSHP(req.file.path);

    res.json(result);
  } catch (error) {
    sendError(res, error);
  }
});

/* v2 */
router.get('/:id/draft/info', async (req, res) => {
  try {
    /* TODO: SO MODERADOR OU ADM */

    const { id } = req.params;

    const result = await service.getDraftInfo(id);

    // console.log(result);

    res.json(result);
  } catch (ex) {
    sendError(res, ex);
  }
});

router.get('/draft/name/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await service.getDraftName(id);

    // console.log(result);

    res.json(result);
  } catch (ex) {
    sendError(res, ex);
  }
});

router.put('/:id/draft/info', async (req, res) => {
  try {
    const { id } = req.params;
    const data = req.body;

    const result = await service.saveDraftInfo(id, data);

    res.json(result);
  } catch (ex) {
    sendError(res, ex);
  }
});



router.get('/:id/draft/network', async (req, res) => {
  try {

    const { id } = req.params;

    const result = await service.getDraftNetwork(id);

    // console.log(result);

    res.json(result);
  } catch (ex) {
    sendError(res, ex);
  }
});

router.put('/:id/draft/network', async (req, res) => {
  try {
    const { id } = req.params;
    const data = req.body;

    const result = await service.saveDraftNetwork(id, data);

    res.json(result);
  } catch (ex) {
    sendError(res, ex);
  }
});

router.post('/indication/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const data = req.body;

    const result = await service.saveIndicationInfo(id, data);

    res.json(result);
  } catch (ex) {
    sendError(res, ex);
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { user } = req.body;

    /* TODO: SO MODERADOR OU ADM */
    const result = await service.delete(id, res.locals.user);

    res.json(result);
  } catch (ex) {
    sendError(res, ex);
  }
});

router.get('/:id/verify', async (req, res) => {
  try {
    const { id } = req.params;

    /* TODO: SO MODERADOR OU ADM */
    const result = await service.verify(id);

    res.json(result);
  } catch (ex) {
    sendError(res, ex);
  }
});

router.put('/:id/publish', async (req, res) => {
  try {
    const { id } = req.params;

    /* TODO: SO MODERADOR OU ADM */
    const result = await service.publish(id);

    res.json(result);
  } catch (ex) {
    sendError(res, ex);
  }
});

router.get('/:id/indic/:indicKey', async (req, res) => {
  try {
    const { id, indicKey } = req.params;

    /* TODO: SO MODERADOR OU ADM */
    const result = await service.getIndic(id, indicKey);

    res.json(result);
  } catch (ex) {
    sendError(res, ex);
  }
});

router.put('/:id/indic/:indicKey', async (req, res) => {
  try {
    const { id, indicKey } = req.params;

    /* TODO: SO MODERADOR OU ADM */
    const result = await service.saveIndic(id, indicKey, req.body);

    res.json(result);
  } catch (ex) {
    sendError(res, ex);
  }
});

// router.get('/analysis/json', async (req, res) => {

//   try {
//     /* TODO: SO ADM */
//     res.json(result);

//   } catch (ex) {
//     sendError(res, ex);
//   }
// });

// router.get('/analysis', async (req, res) => { /* TODO: TEMP */

//   try {
//     /* TODO: SO ADM */

//     /* const { zipFileName, content } = await service.downloadProject(id);

//     // download
//     const readStream = new stream.PassThrough();
//     readStream.end(content);

//     res.set('Content-disposition', 'attachment;filename=' + zipFileName);
//     res.set('Content-Type', 'application/octet-stream');

//     readStream.pipe(res); */

//     const result = await service.analysis();

//     // res.json(result);

//     let styles = `
//     <style>
//       table{
//         border-collapse: collapse;
//       }
//       table, table th, table td {
//         border: solid 1px #999;
//       }
//       table th, table td {
//         padding: 3px 5px;
//       }
//     </style>
//     `;

//     let columns = `<tr>
//       <th>Linha de acao estruturante</th>
//       <th>Nome do indicador</th>
//       <th>Questao</th>
//       <th>Consolidacao</th>
//     </tr>`;

//     let rows = '';
//     let currentLae;
//     let currentIndic;

//     for (let indic of Object.values(result.analysis.indicators)) {

//       let showLae = false;
//       let showIndic = false;
//       if (indic.lae_id !== currentLae) {
//         showLae = true;
//         showIndic = true;
//         currentLae = indic.lae_id;
//       } else if (indic.indic_id !== currentIndic) {
//         showIndic = true;
//         currentIndic = indic.indic_id;
//       }

//       rows += `
//       <tr>
//         <td>${showLae ? indic.lae_title : '&rdsh;'}</td>
//         <td>${showIndic ? indic.indic_title : '&rdsh;'}</td>
//         <td>${indic.base_title} (base)</td>
//         <td>
//           <table>
//             <tr>
//               <td>Resposta</td>
//               <td>Val</td>
//               <td>%</td>
//               <td>%resp</td>
//             </tr>
//             <tr>
//               <td><strong>SIM</strong></td>
//               <td>${indic.base['SIM'].value}</td>
//               <td>${Math.round(indic.base['SIM'].percent * 100)}%</td>
//               <td>${Math.round(indic.base['SIM'].percent_relevant * 100)}%</td>
//             </tr>
//             <tr>
//               <td><strong>NAO</strong></td>
//               <td>${indic.base['NAO'].value}</td>
//               <td>${Math.round(indic.base['NAO'].percent * 100)}%</td>
//               <td>${Math.round(indic.base['NAO'].percent_relevant * 100)}%</td>
//             </tr>
//             <tr>
//               <td><strong>NAO_APLICA</strong></td>
//               <td>${indic.base['NAO_APLICA'].value}</td>
//               <td>${Math.round(indic.base['NAO_APLICA'].percent * 100)}%</td>
//               <td>${Math.round(indic.base['NAO_APLICA'].percent_relevant * 100)}%</td>
//               </tr>
//               <tr>
//                 <td><strong>NAO_RESPOND</strong></td>
//                 <td>${indic.base['NAO_RESPONDIDO'].value}</td>
//                 <td>${Math.round(indic.base['NAO_RESPONDIDO'].percent * 100)}%</td>
//                 <td></td>
//               </tr>
//           </table>
//         </td>
//       </tr>
//       `;

//       for (let q of Object.values(indic.questions)) {

//         let consolida = '';
//         if (q.type === 'avg') {
//           consolida = `|<strong>Media</strong>: ${Math.round(q.avg)}`;
//         } else {

//           let opt = '';
//           for (let o of Object.values(q.options)) {
//             opt += `
//               <tr>
//                 <td>${o.title}</td>
//                 <td>${o.value}</td>
//                 <td>${Math.round(o.percent * 100)}%<td>
//               </tr>
//             `;
//           }

//           consolida = `
//             <table>
//               <tr>
//                 <td>Resposta</td>
//                 <td>Val</td>
//                 <td>%</td>
//               </tr>
//               ${opt}
//             </table>

//           `;
//         }

//         rows += `
//         <tr>
//           <td>&rdsh;</td>
//           <td>&rdsh;</td>
//           <td>${q.title}</td>
//           <td>
//             ${consolida}
//           </td>
//         </tr>
//       `;
//       }

//     }

//     let html = `
//     <!DOCTYPE html>
//     <html>
//       <head>
//       ${styles}
//       </head>
//       <body>
//         <table>
//           <thead>
//             ${columns}
//           </thead>
//           <tbody>
//             ${rows}
//           </tbody>
//         </table>
//       </body>
//     </html>`

//     res.send(html);

//   } catch (ex) {
//     sendError(res, ex);
//   }
// });

/* .v2 */

router.get('/for_participation/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await service.getProjectForParticipation(id);

    res.json(result);
  } catch (ex) {
    sendError(res, ex);
  }
});

router.post('/enter_in_network', async (req, res) => {
  try {
    const result = await service.enterInInitiative(res.locals.user);

    res.json(result);
  } catch (ex) {
    sendError(res, ex);
  }
});

router.get('/total_institutions', async (req, res) => {
  try {
    const result = await service.getTotalInstitutions();

    res.json(result);
  } catch (ex) {
    sendError(res, ex);
  }
});

router.get('/statistics/linhas', async (req, res) => {
  try {
    const result = await service.getStatisticsLinhas();

    res.json(result);
  } catch (ex) {
    sendError(res, ex);
  }
});

router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await service.getProject(id);

    res.json(result);
  } catch (ex) {
    sendError(res, ex);
  }
});

module.exports = router;
