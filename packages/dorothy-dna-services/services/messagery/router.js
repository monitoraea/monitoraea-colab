const express = require('express');
const router = express.Router();

const service = require('./index');

const { sendError } = require('../../util');

/* User */

/* Secutiry: free */
router.post('/test', async (req, res) => {
    const { room, event, payload } = req.body;

    try {
        const result = await service.test({ room, event, payload });

        res.json(result);
    } catch ({ message }) {
        sendError(res, message, 401)
    }

});

router.post('/command/:command', async (req, res) => {
    const { command } = req.params;

    const payload = req.body;

    try {
        const result = await service.command(command, payload);

        res.json(result);
    } catch ({ message }) {
        sendError(res, message, 401)
    }

});

router.get('/messages/:room', async (req, res) => {
    const { room } = req.params;
    const { threshold } = req.query;

    try {
        const result = await service.fetchMessages({ room, threshold }, res.locals.user.id);

        res.json(result);
    } catch ({ message }) {
        sendError(res, message, 401)
    }

});

router.get('/alerts', async (req, res) => {
    try {
        const result = await service.fetchAlerts(res.locals.user.id);

        res.json(result);
    } catch ({ message }) {
        sendError(res, message, 401)
    }

});

// 

router.get('/alerts/count', async (req, res) => {

    try {
        const result = await service.countAlerts(res.locals.user.id);

        res.json(result);
    } catch ({ message }) {
        sendError(res, message, 401)
    }

});

router.post('/force_emails', async (req, res) => {

    const config = req.body;

    try {
        const result = await service.sendEmails(config);

        res.json(result);
    } catch ({ message }) {
        sendError(res, message, 401)
    }

});

router.post('/pulse', async (req, res) => {

    try {
        const resultBatch = await service.batchNotification();
        const resultEmails = await service.sendEmails();

        res.json({
            resultEmails,
            resultBatch,
        });
    } catch ({ message }) {
        sendError(res, message, 401)
    }

});

router.get("/:user_id/following/:room", async (req, res) => {
    const { user_id, room } = req.params;

    try {
        const result = await service.isFollowing(user_id, room);

        res.json(result);
    } catch (ex) {
        sendError(res, ex, 500);
    }
});

router.put("/:user_id/following/:room", async (req, res) => {
    const { user_id, room } = req.params;
    const { communityId, following } = req.body;

    try {
        const result = await service.follow(user_id, room, communityId, following);

        res.json(result);
    } catch (ex) {
        sendError(res, ex, 500);
    }
});

module.exports = router;