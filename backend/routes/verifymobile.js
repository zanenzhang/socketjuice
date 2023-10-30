const express = require('express');
const router = express.Router();
const verifyMobileController = require('../controllers/authentication/verifyMobileController'); 

const verifyJWT = require('../middleware/verifyJWT')

router.use(verifyJWT)

router.get('/getcode', verifyMobileController.getCode);
router.get('/verifycode', verifyMobileController.verifyCode);


module.exports = router;
