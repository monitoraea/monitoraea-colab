const express = require('express');
const router = express.Router();

const service = require('./index');

const { sendError } = require('../../util');

require('./security');
const SecurityManager = require('../../security-manager');

/* Community */

/* Secutiry: Ninguem acessa esta rota? (Pode ser liberado pelo host) */
router.get('/', SecurityManager.check(async (req, res) => {
    const { 
        page,
        order,
        direction,
        limit,

        type,
        search,
     } = req.query;

    try {      
        const result = await service.list({
            page: page ? parseInt(page) : 1,
            order: order ? order : 'name',
            direction: direction ? direction : 'ASC',
            limit: limit ? parseInt(limit) : 10,

            type,
            search,
        });

        res.json(result);
    } catch ({ message }) {
        sendError(res, message, 401)
    }
}));

/* Secutiry: Ninguem acessa esta rota? (Pode ser liberado pelo host) */
router.post('/', SecurityManager.check(async (req, res) => {
    const {
        entity,
        type,
    } = req.body;

    try {      
        const result = await service.save(entity, type);

        res.json(result);
    } catch ({ message }) {
        sendError(res, message, 401)
    }
}));

/* Secutiry: Ninguem acessa esta rota? (Pode ser liberado pelo host) */
router.delete('/:id', SecurityManager.check(async (req, res) => {
    const { 
        id,
     } = req.params;

    try {      
        const result = await service.delete(id);

        res.json(result);
    } catch ({ message }) {
        sendError(res, message, 401)
    }
}));

router.get('/type/:id', async (req, res) => {    

    const { id } = req.params;

    try {      
        const result = await service.getType(id);

        res.json(result);
    } catch ({ message }) {
        sendError(res, message, 401)
    }
});

router.get('/type', async (req, res) => {    

    const { used, creatable } = req.query;

    try {      
        const result = await service.getTypes({ used, creatable });

        res.json(result);
    } catch ({ message }) {
        sendError(res, message, 401)
    }
});

module.exports = router;