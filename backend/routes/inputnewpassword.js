const express = require('express');
const router = express.Router();
const inputNewPassController = require('../controllers/authentication/inputNewPassController');

router.post('/', inputNewPassController.handleInputNewPassword);

module.exports = router;