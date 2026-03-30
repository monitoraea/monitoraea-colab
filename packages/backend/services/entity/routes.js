const express = require('express');
const router = express.Router();
const { sendError } = require('dorothy-dna-services').util;

const entity = require('./index');

router.get('/', async (req, res) => {
  const { filter, my_entity_type, my_entity_id } = req.query;
  
  try {   

    const result = await entity.list({ filter, my_entity_type, my_entity_id });

    res.json(result);
  } catch (ex) {
    sendError(res, ex);
  }
});

router.get('/relations_options', async (req, res) => {
  // TODO: context, order
  
  try {   

    const result = await entity.getRelationsOptions();

    res.json(result);
  } catch (ex) {
    sendError(res, ex);
  }
});

router.get('/:entity_type/:entity_id', async (req, res) => {
  const { entity_type, entity_id } = req.params;
  
  try {   

    const result = await entity.getRelations(entity_type, entity_id);

    res.json(result);
  } catch (ex) {
    sendError(res, ex);
  }
});

router.get('/initiatives', async (req, res) => {
  const { filter, my_entity_type, my_entity_id, organizacao } = req.query;
  
  try {   

    const result = await entity.listEntities({ filter, my_entity_type, my_entity_id, organizacao });

    res.json(result);
  } catch (ex) {
    sendError(res, ex);
  }
});

router.get('/initiatives/:id', async (req, res) => {
  const { id } = req.params;
  
  try {   

    const result = await entity.get(id);

    res.json(result);
  } catch (ex) {
    sendError(res, ex);
  }
});

router.get('/:id', async (req, res) => {
  const { id } = req.params;
  
  try {   

    const result = await entity.get(id);

    res.json(result);
  } catch (ex) {
    sendError(res, ex);
  }
});

module.exports = router;
