const express = require('express');
const router = express.Router();
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });
const controller = require('../controllers/appointment.controller');

// Accept `image_file` as a multipart/form-data file upload (memory storage)
router.post('/parse', upload.single('image_file'), controller.parseAppointment);

module.exports = router;
