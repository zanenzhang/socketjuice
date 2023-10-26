const express = require('express');
const router = express.Router();
const profileController = require('../controllers/userdata/profileController');

router.get('/', profileController.checkUser);

module.exports = router;