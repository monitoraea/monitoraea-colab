const express = require('express');
const router = express.Router();
const { sendError } = require('dorothy-dna-services').util;

const { User } = require('dorothy-dna-services');

const entity = require('./index');

/* TODO */
router.get("/request_recovery_code/:email", async (req, res) => {
    const { email } = req.params;

    try {
        const result = await entity.requestRecoveryCode(email);

        res.json(result);
    } catch (ex) {
        sendError(res, ex, 500);
    }
});

/* TODO */
router.get("/verify_recovery_code/:code", async (req, res) => {
    const { code } = req.params;

    try {
        const result = await User.verifyRecoveryCode(code);

        res.json(result);
    } catch (ex) {
        sendError(res, ex, 500);
    }
});

/* TODO */
router.put("/change_password/:code", async (req, res) => {
    const { code } = req.params;
    const { password } = req.body;

    try {
        const result = await User.changePasswordUsingRecoveryCode(password, code);

        res.json(result);
    } catch (ex) {
        sendError(res, ex, 500);
    }
});

/* TODO */
router.put("/change_my_password", async (req, res) => {
    const { password } = req.body;

    try {
        const result = await User.changePassword(res.locals.user, password);

        res.json(result);
    } catch (ex) {
        sendError(res, ex, 500);
    }
});

/* TODO */
router.get("/:id/thumb", async (req, res) => {
    const { id } = req.params;

    try {
        const data = await entity.thumb(id);

        res.writeHead(200, { 'Content-Type': 'image/jpeg' });
        res.write(data.Body, 'binary');
        res.end(null, 'binary');
    } catch (ex) {
        sendError(res, ex, 500);
    }
});

/* TODO */
router.post("/signup", async (req, res) => {

    try {
        const result = await entity.signup(req.body);

        res.json(result);
    } catch (ex) {
        sendError(res, ex, 500);
    }
});

router.get("/:id/following/:room", async (req, res) => {
    const { room } = req.params;

    try {
        const result = await entity.isFollowing(res.locals.user?.id, room);

        res.json(result);
    } catch (ex) {
        sendError(res, ex, 500);
    }
});

router.put("/:id/follow", async (req, res) => {
    const { room, communityId, following } = req.body;

    try {
        const result = await entity.follow(res.locals.user?.id, room, communityId, String(following) === '1');

        res.json(result);
    } catch (ex) {
        sendError(res, ex, 500);
    }
});

module.exports = router;