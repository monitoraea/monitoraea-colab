const express = require('express');
const router = express.Router();
const { sendError } = require('dorothy-dna-services').util;

const entity = require('./index');

router.get('/perspectives', async (req, res) => {

  const result = await entity.getPerspectives();

  res.json(result);
});

router.get('/perspectives/user', async (req, res) => {

  const result = await entity.getPerspectivesUser(res.locals.user);

  res.json(result);
});

router.get('/:communityId', async (req, res) => {
  const { communityId } = req.params;
  const { alias, order, direction } = req.query;

  const result = await entity.list(communityId, alias, {
    order: order || 'name',
    direction: direction || 'asc',
  });

  res.json(result);
});

/* TODO */
router.get("/:communityId/membership", async (req, res) => {
  const { communityId } = req.params;

  const {
    page,
    order,
    direction,
    limit,

  } = req.query;

  try {
    const result = await entity.members(communityId, {
      page: page ? parseInt(page) : 1,
      order: order ? order : 'name',
      direction: direction ? direction : 'ASC',
      limit: limit ? parseInt(limit) : 10,
    });

    res.json(result);
  } catch (ex) {
    sendError(res, ex, 500);
  }
});

/* TODO */
router.get("/:communityId/invites", async (req, res) => {
  const { communityId } = req.params;

  const {
    page,
    order,
    direction,
    limit,

  } = req.query;

  try {
    const result = await entity.invites(communityId, {
      page: page ? parseInt(page) : 1,
      order: order ? order : 'name',
      direction: direction ? direction : 'ASC',
      limit: limit ? parseInt(limit) : 10,
    });

    res.json(result);
  } catch (ex) {
    sendError(res, ex, 500);
  }
});

/* TODO */
router.get("/:communityId/participation", async (req, res) => {
  const { communityId } = req.params;

  const {
    page,
    order,
    direction,
    limit,

    ini_date,
    end_date,
    participation_type,

  } = req.query;

  try {
    const result = await entity.participation(communityId, {
      page: page ? parseInt(page) : 1,
      order: order ? order : 'name',
      direction: direction ? direction : 'ASC',
      limit: limit ? parseInt(limit) : 10,

      ini_date,
      end_date,
      participation_type: participation_type === 'none' ? undefined : participation_type,
    });

    res.json(result);
  } catch (ex) {
    sendError(res, ex, 500);
  }
});

router.delete("/:communityId/membership/:userId", async (req, res) => {
  const { communityId, userId } = req.params;

  try {
    const result = await entity.remove(communityId, userId);

    res.json(result);
  } catch (ex) {
    sendError(res, ex, 500);
  }
});

router.delete("/:communityId/invites/:id", async (req, res) => {
  const { communityId, id } = req.params;

  try {
    const result = await entity.removeInvite(communityId, id);

    res.json(result);
  } catch (ex) {
    sendError(res, ex, 500);
  }
});

router.delete("/:communityId/participation/:id", async (req, res) => {
  const { communityId, id } = req.params;

  try {
    const result = await entity.removeParticipation(communityId, id);

    res.json(result);
  } catch (ex) {
    sendError(res, ex, 500);
  }
});

router.put("/:communityId/participation/:id", async (req, res) => {
  const { /* communityId,  */id } = req.params;

  try {
    const result = await entity.approveParticipacion(/* communityId,  */id);

    res.json(result);
  } catch (ex) {
    sendError(res, ex, 500);
  }
});

router.post('/:communityId/membership', async (req, res) => {
  try {
    const { communityId } = req.params;
    const { name, email } = req.body;

    const result = await entity.invite(communityId, name, email);

    res.json(result);
  } catch (ex) {
    sendError(res, ex);
  }
});

router.put("/invitation/:uuid", async (req, res) => {
  const { uuid } = req.params;

  try {
    const result = await entity.verifyInvitation(uuid, res.locals.user);

    res.json(result);
  } catch (ex) {
    sendError(res, ex, 500);
  }
});

router.post("/signup", async (req, res) => {
  const { password, uuid } = req.body;

  try {
    const result = await entity.signup(password, uuid);

    res.json(result);
  } catch (ex) {
    sendError(res, ex, 500);
  }
});

router.post("/broadcasting", async (req, res) => {
  const { type, message } = req.body;

  try {
    const result = await entity.broadcasting(type, message);

    res.json(result);
  } catch (ex) {
    sendError(res, ex, 500);
  }
});

router.post("/add_user_perspective/:communityId", async (req, res) => {
  const { communityId } = req.params;

  try {
    if(res.locals.user) {

      const result = await entity.addMember(communityId, res.locals.user.id, 'member');
      res.json(result);

    } else sendError(res, 'User not found!', 500);
  } catch (ex) {
    sendError(res, ex, 500);
  }
});

module.exports = router;
