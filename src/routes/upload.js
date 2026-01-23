const express = require('express');
const router = express.Router();
const upload = require('../config/multer');
const { uploadMedia, deleteMedia } = require('../controllers/uploadController');
const auth = require('../middleware/auth');
const tenant = require('../middleware/tenant');

router.post('/media', auth(), upload.single('file'), uploadMedia);
router.delete('/media/:publicId', auth(), deleteMedia);

module.exports = router;