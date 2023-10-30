const express = require('express');
const router = express.Router();
const verifyMobileController = require('../controllers/authentication/verifyUserController'); 

const verifyJWT = require('../middleware/verifyJWT')

router.use(verifyJWT)

router.get('/create', verifyMobileController.createService);
router.get('/send', verifyMobileController.sendVerification);
router.get('/check', verifyMobileController.checkVerification);
router.get('/verifyphone', verifyMobileController.verifyUserProfilePhone);
router.get('/verifyphotos', verifyMobileController.verifyUserIdPhotos);


module.exports = router;
