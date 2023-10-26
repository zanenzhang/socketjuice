const express = require('express');
const router = express.Router();
const resendVerificationController = require('../controllers/authentication/resendVerificationController');

router.post('/', resendVerificationController.handleResendVerification);

module.exports = router;