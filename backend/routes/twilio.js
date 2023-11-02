const express = require('express');
const router = express.Router();
const twilioController = require('../controllers/authentication/twilioController'); 

const verifyJWT = require('../middleware/verifyJWT')

router.use(verifyJWT)

router.post('/send', twilioController.sendVerification);
router.post('/check', twilioController.checkVerification);


module.exports = router;
