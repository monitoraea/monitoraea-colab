const express = require('express');
const router = express.Router();
const { sendError } = require('dorothy-dna-services').util;

const entity = require('./index');

/* TODO */
router.get("/", async (req, res) => {
    const { uf } = req.query;

    try {
        const result = await entity.list({
            uf: !!uf
        });

        res.json(result);
    } catch (ex) {
        sendError(res, ex, 500);
    }
});

/* TODO */
router.get("/:cd_mun/bbox", async (req, res) => {
    const { cd_mun } = req.params;

    try {
        const result = await entity.bbox(cd_mun);

        res.json(result);
    } catch (ex) {
        sendError(res, ex, 500);
    }
});

/* TODO */
router.get("/:cd_mun/feature", async (req, res) => {
    const { cd_mun } = req.params;

    try {
        const result = await entity.feature(cd_mun);

        res.json(result);
    } catch (ex) {
        sendError(res, ex, 500);
    }
});

/* TODO */
router.get("/related", async (req, res) => {

    const { search, uf } = req.query;

    try {
        const result = await entity.getRelated({ search, uf });

        res.json(result);
    } catch (ex) {
        sendError(res, ex, 500);
    }
});



/* TODO */
router.get("/single/:cd_mun", async (req, res) => {
    const { cd_mun } = req.params;

    try {
        const result = await entity.getSingle(cd_mun);

        res.json(result);
    } catch (ex) {
        sendError(res, ex, 500);
    }
});

/* TODO */
router.get("/:cd_mun", async (req, res) => {
    const { cd_mun } = req.params;

    try {
        const result = await entity.get(cd_mun);

        res.json(result);
    } catch (ex) {
        sendError(res, ex, 500);
    }
});

module.exports = router;