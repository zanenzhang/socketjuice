const express = require('express');
const router = express.Router();
const refreshTokenController = require('../controllers/authentication/refreshTokenController');

router.get('/', refreshTokenController.handleRefreshToken);

module.exports = router;