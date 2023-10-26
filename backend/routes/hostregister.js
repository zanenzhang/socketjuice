const express = require('express');
const router = express.Router();
const storeRegisterController = require('../controllers/authentication/storeRegisterController');

router.post('/', storeRegisterController.handleNewStore);

module.exports = router;