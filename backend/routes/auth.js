const express = require('express');
const router = express.Router();
const authController = require('../controllers/authentication/authController');

router.post('/', authController.handleLogin);
router.post('/useridphotos', authController.uploadUserIdPhotos);
router.post('/driverphotos', authController.uploadDriverPhotos);
router.post('/hostphotos', authController.uploadHostPhotos);


module.exports = router;