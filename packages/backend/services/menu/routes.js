const express = require('express');
const router = express.Router();
const { sendError } = require('dorothy-dna-services').util;

const entity = require('./index');

router.get('/', async (req, res) => {
  try {
    const result = await entity.getMenu();
    res.json(result);
  } catch (ex) {
    sendError(res, ex, 500);
  }
});

router.get('/:id', async (req, res) => {
  const { id: menu_id } = req.params;

  try {
    const result = await entity.getMenuById(menu_id);
    res.json(result);
  } catch (ex) {
    sendError(res, ex, 500);
  }
});

router.get('/:id/childs', async (req, res) => {
  const { id: menu_id } = req.params;

  try {
    const result = await entity.getMenuChilds(menu_id);
    res.json(result);
  } catch (ex) {
    sendError(res, ex, 500);
  }
});

router.post('/', async (req, res) => {
  // const {adm_id} = req.params
  const { entity: model } = req.body;

  try {
    const result = await entity.saveMenu(model.isAdm, model.entity);
    res.json(result);
  } catch (ex) {
    sendError(res, ex, 500);
  }
});

router.delete('/:menu_id', async (req, res) => {
  const { menu_id } = req.params;

  try {
    const result = await entity.deleteMenu(menu_id);
    res.json(result);
  } catch (ex) {
    sendError(res, ex, 500);
  }
});

router.put('/:menu_id', async (req, res) => {
  const { menu_id } = req.params;
  const { entity: entityJSON } = req.body;

  try {
    const result = await entity.updateMenu(menu_id, entityJSON);
    res.json(result);
  } catch (ex) {
    sendError(res, ex, 500);
  }
});

module.exports = router;
