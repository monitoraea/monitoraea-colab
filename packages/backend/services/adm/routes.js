const express = require('express');
const router = express.Router();
const { sendError } = require('dorothy-dna-services').util;

const entity = require('./index');

/* TODO */
router.get("/test", async (req, res) => {
    try {
        const result = await entity.test();

        res.json(result);
    } catch (ex) {
        sendError(res, ex, 500);
    }
});

router.post('/send_contact', async (req, res) => {
    try {
        const { name, email, message } = req.body;

        const result = await entity.sendContact(name, email, message);

        res.json(result);
    } catch (error) {
        sendError(res, error);
    }
});

/* TODO */
router.post("/update_recipes/:uuid", async (req, res) => {
    const { uuid } = req.params;

    try {
        const result = await entity.updateRecipes(uuid);

        res.json(result);
    } catch (ex) {
        sendError(res, ex, 500);
    }
});

/* TODO */
router.post("/send_system_notification/:uuid", async (req, res) => {
    const { uuid } = req.params;

    try {
        const result = await entity.sendSystemNotification(uuid, req.body);

        res.json(result);
    } catch (ex) {
        sendError(res, ex, 500);
    }
});

/* TODO */
router.get("/report/:id", async (req, res) => {
    const { id } = req.params;

    try {
        const result = await entity.getReport(id);

        res.json(result);
    } catch (ex) {
        sendError(res, ex, 500);
    }
});

/* TODO */
router.get("/statistics/indic/:type/:lae_id/:indic_id/:question_id?", async (req, res) => {
    const { type, lae_id, indic_id, question_id } = req.params;

    try {
        const result = await entity.getIndicStatistics(
            type,
            lae_id,
            indic_id,
            question_id,
            req.query,
        );

        res.json(result);
    } catch (ex) {
        sendError(res, ex, 500);
    }
});

/* TODO */
router.get("/statistics/participation/number_of_members", async (req, res) => {

    try {
        const result = await entity.getNumberOfMembers();

        res.json(result);
    } catch (ex) {
        sendError(res, ex, 500);
    }
});

/* TODO */
router.get("/statistics/participation/rank_of_members", async (req, res) => {

    try {
        const result = await entity.getNumberOfMembersRank();

        res.json(result);
    } catch (ex) {
        sendError(res, ex, 500);
    }
});

/* TODO */
router.get("/statistics/total_iniciatives", async (req, res) => {

    try {
        const result = await entity.getTotalOfInitiatives();

        res.json(result);
    } catch (ex) {
        sendError(res, ex, 500);
    }
});

module.exports = router;