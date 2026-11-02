const express = require('express');
const router = express.Router();
const { sendError } = require('dorothy-dna-services').util;
const { SecurityManager } = require('dorothy-dna-services');

const entity = require('./index');

const serve = (name) => async (req, res) => {
  try {
    const { body, gzip, etag } = await entity.get(name);

    res.set({ ETag: etag, 'Cache-Control': 'public, max-age=300', Vary: 'Accept-Encoding' });
    if (req.headers['if-none-match'] === etag) return res.status(304).end();

    res.type('application/json');
    if (/\bgzip\b/.test(req.headers['accept-encoding'] || '')) {
      res.set('Content-Encoding', 'gzip');
      return res.send(gzip);
    }
    return res.send(body);
  } catch (ex) {
    return sendError(res, ex, 500);
  }
};

router.get('/dados', serve('dados'));
router.get('/malha', serve('malha'));
router.get('/meta', serve('meta'));

/* Descarta os documentos em cache; o próximo acesso lê o banco de novo. Restrito a administradores (security.js). */
router.post('/cache/clear', SecurityManager.check(async (req, res) => {
  try {
    entity.clear();
    res.json({ cleared: true });
  } catch (ex) {
    sendError(res, ex, 500);
  }
}));

module.exports = router;
