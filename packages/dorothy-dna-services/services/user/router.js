const express = require('express');
const router = express.Router();

const service = require('./index');
const Messagery = require('../messagery/index');

const { sendError } = require('../../util');

require('./security');
const SecurityManager = require('../../security-manager');

/* User */

/* Secutiry: free */
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        const result = await service.login(email, password);

        res.json(result);
    } catch (error) {
        sendError(res, error, 401)
    }

});
/* Secutiry: free */
router.get('/me', async (req, res) => {
    try {
        if(!res.locals.user) throw new Error('You are not logged!');
        
        const result = await service.getMe(res.locals.user.id);

        res.json(result);
    } catch ({ message }) {
        sendError(res, message, 401)
    }
});

/* Communities */

/* Secutiry: Posso acessar essa comunidade? (Faco parte ou tenho algum direito especial) */
router.get('/me/community/:id/membership', SecurityManager.check(async (req, res) => {
    const { id } = req.params;

    try {      
        if(!res.locals.user) throw new Error('You are not logged!');

        const result = await service.getCommunityAndMembership(id, res.locals.user.id);

        res.json(result);
    } catch ({ message }) {
        sendError(res, message, 401)
    }
}));

router.get("/me/following/:room", async (req, res) => {
    const { room } = req.params;

    try {
        const result = await Messagery.isFollowing(res.locals.user?.id, room);

        res.json(result);
    } catch (ex) {
        sendError(res, ex, 500);
    }
});

router.put("/me/following/:room", async (req, res) => {
    const { room } = req.params;
    const { communityId, following } = req.body;

    try {
        const result = await Messagery.follow(res.locals.user?.id, room, communityId, following);

        res.json(result);
    } catch (ex) {
        sendError(res, ex, 500);
    }
});

module.exports = router;