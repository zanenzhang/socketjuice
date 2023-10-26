const express = require('express');
const router = express.Router();
const authController = require('../controllers/authentication/authController');

router.post('/', authController.handleLogin);

module.exports = router;