const express = require('express');
const router = express.Router();
const hostRegisterController = require('../controllers/authentication/hostRegisterController');

router.post('/', hostRegisterController.handleNewHost);

module.exports = router;