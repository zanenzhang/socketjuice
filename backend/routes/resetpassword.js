const express = require('express');
const router = express.Router();
const resetPassController = require('../controllers/authentication/resetPassController');

router.post('/', resetPassController.handleResetPassword);

module.exports = router;