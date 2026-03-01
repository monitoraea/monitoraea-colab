const express = require('express');
const router = express.Router();
const { sendError } = require('dorothy-dna-services').util;

const entity = require('./index');
const multer = require('multer');
const upload = multer({
  storage: multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, process.env.TMP_DIR);
    },
    filename: function (req, file, cb) {
      cb(null, file.originalname);
    },
  }),
  limits: {
    fileSize: 25 * 1024 * 1024, // 25MB
  },
}); // DiskStorage
const upFields = upload.fields([{ name: 'file', maxCount: 1 }]);

router.get('/images', async (req, res) => {
  const {
    page,
    order,
    direction,

    category,
    last,
  } = req.query;

  try {
    const result = await entity.getImagesFromGallery({
      page: page ? parseInt(page) : 1,
      order: order ? order : 'f."createdAt"',
      direction: direction ? direction : 'ASC',
      category,
      last,
    });

    res.json(result);
  } catch (ex) {
    sendError(res, ex, 500);
  }
});

/* TODO:remove */
// router.post('/:content_manager_id/novo', async (req, res) => {
//   const { content_manager_id } = req.params;

//   try {
//     const result = await entity.createGallery(content_manager_id);
//     res.json(result);
//   } catch (ex) {
//     sendError(res, ex, 500);
//   }
// });

router.post('/image/', upFields, async (req, res) => {
  const { entity: entityJSON } = req.body;
  const { file } = req.files || {};

  try {
    const result = await entity.saveImage(JSON.parse(entityJSON), {
      file: file && file.length ? file[0] : null,
    });
    res.json(result);
  } catch (ex) {
    sendError(res, ex, 500);
  }
});

router.put('/image/:image_id', async (req, res) => {
  const { gallery_id, image_id } = req.params;

  try {
    const result = await entity.selectImage(gallery_id, image_id);
    res.json(result);
  } catch (ex) {
    sendError(res, ex, 500);
  }
});

router.delete('/image/:image_id', async (req, res) => {
  const { image_id } = req.params;

  try {
    const result = await entity.removeFile(image_id);
    res.json(result);
  } catch (ex) {
    sendError(res, ex, 500);
  }
});

module.exports = router;
