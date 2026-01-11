const express = require('express');
const router = express.Router();
const controller = require('../controllers/appointment.controller');

router.post('/parse', controller.parseAppointment);

module.exports = router;
