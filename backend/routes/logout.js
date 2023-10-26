const express = require('express');
const router = express.Router();
const logoutController = require('../controllers/authentication/logoutController');

router.get('/', logoutController.handleLogout);

module.exports = router;