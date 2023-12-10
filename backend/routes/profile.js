const express = require('express');
const router = express.Router();
const profileController = require('../controllers/userdata/profileController');
const hostProfileController = require('../controllers/hostdata/hostProfileController');
const citiesController = require('../controllers/userdata/citiesController');
const verifyJWT = require('../middleware/verifyJWT');

router.use(verifyJWT)

router.get('/driver', profileController.getDriverProfile);
router.get('/host', hostProfileController.getHostProfile);
router.get('/hostcoord', hostProfileController.getHostProfilesCoord);
router.get('/stage', profileController.checkStage);
router.get('/userdata', profileController.getUserData);
router.get('/searchusers', profileController.searchUsers);

router.post('/host', profileController.addHostProfile);
router.post('/userphotos', profileController.uploadUserPhotos);
router.post('/driver', profileController.updateDriverProfile);
router.post('/promo', profileController.addPromoCode);

router.patch('/usersettings', profileController.editSettingsUserProfile);
router.patch('/userpass', profileController.editSettingsUserPass);
router.patch('/usergeneral', profileController.editSettingsUserGeneral);
router.patch('/profilepic', profileController.editProfilePic);

router.patch('/hostsettings', hostProfileController.editSettingsHostProfile);
router.patch('/cities', citiesController.updatePreferences);

router.delete('/oldpic', profileController.deleteOldProfilePic);

router.post('/ban', profileController.addUserBan);
router.delete('/ban', profileController.removeUserBan);


module.exports = router;