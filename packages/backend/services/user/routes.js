const express = require('express');
const router = express.Router();
const { sendError } = require('dorothy-dna-services').util;

const { User } = require('dorothy-dna-services');

const FormManager = require('../../FormsManager');

const multer = require('multer');
const upload = multer(); // Memory

const entity = require('./index');

/* TODO */
router.get('/check_nick_availability/:nick', async (req, res) => {
  const { nick } = req.params;

  try {
    const result = await entity.checkNickAvailability(nick, res.locals.user.id);

    res.json(result);
  } catch (ex) {
    sendError(res, ex, 500);
  }
});

/* TODO */
router.get('/request_recovery_code/:email', async (req, res) => {
  const { email } = req.params;

  try {
    const result = await entity.requestRecoveryCode(email);

    res.json(result);
  } catch (ex) {
    sendError(res, ex, 500);
  }
});

/* TODO */
router.get('/verify_recovery_code/:code', async (req, res) => {
  const { code } = req.params;

  try {
    const result = await User.verifyRecoveryCode(code);

    res.json(result);
  } catch (ex) {
    sendError(res, ex, 500);
  }
});

/* TODO */
router.put('/change_password/:code', async (req, res) => {
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
router.put('/change_my_password', async (req, res) => {
  const { password } = req.body;

  try {
    const result = await User.changePassword(res.locals.user, password);

    res.json(result);
  } catch (ex) {
    sendError(res, ex, 500);
  }
});

/* TODO */
router.get('/:id/thumb', async (req, res) => {
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
router.post('/signup', async (req, res) => {
  try {
    const result = await entity.signup(req.body);

    res.json(result);
  } catch (ex) {
    sendError(res, ex, 500);
  }
});

router.get('/:id/following/:room', async (req, res) => {
  const { room } = req.params;

  try {
    const result = await entity.isFollowing(res.locals.user?.id, room);

    res.json(result);
  } catch (ex) {
    sendError(res, ex, 500);
  }
});

router.put('/:id/follow', async (req, res) => {
  const { room, communityId, following } = req.body;

  try {
    const result = await entity.follow(res.locals.user?.id, room, communityId, String(following) === '1');

    res.json(result);
  } catch (ex) {
    sendError(res, ex, 500);
  }
});

/* TODO */
router.get('/has_thumb', async (req, res) => {
  const { id } = req.params;

  try {
    const result = await entity.hasThumb(res.locals.user.id);

    res.json(result);
  } catch (ex) {
    sendError(res, ex, 500);
  }
});

/* TODO */
router.get('/files', async (req, res) => {
  const { id } = req.params;

  try {
    const result = await entity.getFiles(res.locals.user.id);

    res.json(result);
  } catch (ex) {
    sendError(res, ex, 500);
  }
});

/* TODO */
router.get('/info', async (req, res) => {
  const { id } = req.params;

  try {
    const result = await entity.getExtendedInfo(res.locals.user.id);

    res.json(result);
  } catch (ex) {
    sendError(res, ex, 500);
  }
});
/* TODO */
router.put('/info', async (req, res) => {
  const data = req.body;

  try {
    const result = await entity.setExtendedInfo(res.locals.user.id, data);

    res.json(result);
  } catch (ex) {
    sendError(res, ex, 500);
  }
});
/* TODO */
router.delete('/thumb', async (req, res) => {
  try {
    const result = await entity.removeThumb(res.locals.user.id);

    res.json(result);
  } catch (ex) {
    sendError(res, ex, 500);
  }
});

const upFields = upload.fields([{ name: 'thumb', maxCount: 1 }]);

router.post('/thumb', upFields, async (req, res) => {
  const { thumb } = req.files;

  try {
    const result = await entity.setThumb(res.locals.user, thumb[0]);

    res.json(result);
  } catch (ex) {
    sendError(res, ex, 500);
  }
});

/* *** FORMS.Begin *** */
(async function setupForms() {
  const form1 = await FormManager.getForm('profiles/user/form1');

  router.get('/draft', async (req, res) => {
    try {
      const result = await entity.getDraft(res.locals.user.id);

      res.json(result);
    } catch (ex) {
      sendError(res, ex, 500);
    }
  });

  router.put('/draft', upload.fields(FormManager.upFields(form1)), async (req, res) => {
    try {
      const result = await entity.saveDraft(
        form1,
        FormManager.parse(form1, req.body.entity) /* Transformations */,
        req.files,
        res.locals.user.id,
      );

      res.json(result);
    } catch (ex) {
      sendError(res, ex, 500);
    }
  });
})();
/* *** FORMS.End *** */

module.exports = router;
