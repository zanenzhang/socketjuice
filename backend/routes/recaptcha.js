const express = require('express');
const activateController = require('../controllers/authentication/activateUserController');
const router = express.Router();

router.post('/verify', activateController.verifyRecaptcha);

module.exports = router;