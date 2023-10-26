const express = require('express');
const router = express.Router();
const citiesController = require('../controllers/userdata/citiesController');

router.get('/', citiesController.getCities);

module.exports = router;