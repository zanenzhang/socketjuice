const express = require('express');
const router = express.Router();
const verifyController = require('../controllers/authentication/verifyUserController'); 

const verifyJWT = require('../middleware/verifyJWT')

router.use(verifyJWT);

router.post('/approvephone', verifyController.approveUserProfilePhone);
router.post('/approvephotos', verifyController.approveUserIdPhotos);
router.post('/rejectuser', verifyController.rejectUserUploads);
router.get('/userstatus', verifyController.getUserStatusPhotos);


module.exports = router;
