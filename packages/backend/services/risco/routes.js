const express = require('express');
const router = express.Router();
const { sendError } = require('dorothy-dna-services').util;

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

module.exports = router;
