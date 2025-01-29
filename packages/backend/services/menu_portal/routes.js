const express = require('express');
const router = express.Router();
const { sendError } = require('dorothy-dna-services').util;

const service = require('./index');

router.get('/', async (req, res) => {
  try {
    const result = await service.list();
    res.json(result);
  } catch (ex) {
    sendError(res, ex, 500);
  }
});

router.get('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const result = await service.get(id);
    res.json(result);
  } catch (ex) {
    sendError(res, ex, 500);
  }
});

router.post('/', async (req, res) => {
  // const {adm_id} = req.params
  const model = req.body;

  try {
    const result = await service.save(model);
    res.json(result);
  } catch (ex) {
    sendError(res, ex, 500);
  }
});

router.delete('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const result = await service.delete(id);
    res.json(result);
  } catch (ex) {
    sendError(res, ex, 500);
  }
});

router.put('/:id/out', async (req, res) => {
  const { id } = req.params;

  try {
    const result = await service.moveOut(id);
    res.json(result);
  } catch (ex) {
    sendError(res, ex, 500);
  }
});

router.put('/:id/:movement', async (req, res) => {
  const { id, movement } = req.params;

  try {
    const result = await service.move(id, movement);
    res.json(result);
  } catch (ex) {
    sendError(res, ex, 500);
  }
});

router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const model = req.body;

  try {
    const result = await service.save(model, id);
    res.json(result);
  } catch (ex) {
    sendError(res, ex, 500);
  }
});

module.exports = router;
