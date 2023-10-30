const express = require('express');
const router = express.Router();
const resendVerificationController = require('../controllers/authentication/resendVerificationController');

router.post('/email', resendVerificationController.handleResendVerificationEmail);
router.post('/sms', resendVerificationController.handleResendVerificationSMS);

module.exports = router;