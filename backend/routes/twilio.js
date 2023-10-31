const express = require('express');
const router = express.Router();
const twilioController = require('../controllers/authentication/twilioController'); 

router.get('/create', twilioController.createService);
router.get('/send', twilioController.sendVerification);
router.get('/check', twilioController.checkVerification);


module.exports = router;
