const express = require('express');
const router = express.Router();
const publicHostProfileController = require('../controllers/hostdata/publicController');


router.get('/hostcoord', publicHostProfileController.getPublicHostProfilesCoord);


module.exports = router;