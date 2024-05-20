const express = require('express');
const router = express.Router();
const { sendError } = require('dorothy-dna-services').util;
const entity = require('./index');

/* TODO */
router.get("/related", async (req, res) => {

    try {
        const result = await entity.listRelated();

        res.json(result);
    } catch (ex) {
        sendError(res, ex, 500);
    }
});

/* TODO */
router.get("/:id", async (req, res) => {
    const { id } = req.params;

    try {
        const result = await entity.get(id);

        res.json(result);
    } catch (ex) {
        sendError(res, ex, 500);
    }
});

module.exports = router;
