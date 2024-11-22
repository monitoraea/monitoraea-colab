const express = require('express');
const router = express.Router();
const { sendError } = require('dorothy-dna-services').util;
const entity = require('./index');

/* TODO */
router.get("/", async (req, res) => {

    try {
        const result = await entity.all();

        res.json(result);
    } catch (ex) {
        sendError(res, ex, 500);
    }
});

module.exports = router;
