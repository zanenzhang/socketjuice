const express = require('express');
const router = express.Router();
const activateUserController = require('../controllers/authentication/activateUserController');

router.get('/:userId/:hash', activateUserController.handleUserActivation);

module.exports = router;