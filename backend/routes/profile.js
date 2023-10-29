const express = require('express');
const router = express.Router();
const profileController = require('../controllers/userdata/profileController');
const hostProfileController = require('../controllers/hostdata/hostProfileController');
const citiesController = require('../controllers/userdata/citiesController');
const verifyJWT = require('../middleware/verifyJWT');

router.use(verifyJWT)
router.get('/driver', profileController.getDriverProfile);
router.get('/host', hostProfileController.getHostProfile);

router.patch('/usersettings', profileController.editSettingsUserProfile);
router.patch('/userpass', profileController.editSettingsUserPass);
router.patch('/usergeneral', profileController.editSettingsUserGeneral);
router.patch('/profilepic', profileController.editProfilePic);

router.patch('/cities', citiesController.updatePreferences);

router.patch('/hostsettings', hostProfileController.editSettingsHostProfile);

router.delete('/oldpic', profileController.deleteOldProfilePic);

router.post('/ban', profileController.addUserBan);
router.delete('/ban', profileController.removeUserBan);

module.exports = router;