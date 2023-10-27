const express = require('express');
const router = express.Router();
const profileController = require('../controllers/userdata/profileController');
const HostProfileController = require('../controllers/storedata/HostProfileController');
const citiesController = require('../controllers/userdata/citiesController');
const verifyJWT = require('../middleware/verifyJWT');

router.use(verifyJWT)
router.get('/user', profileController.getUserProfile);

router.patch('/usersettings', profileController.editSettingsUserProfile);
router.patch('/userpass', profileController.editSettingsUserPass);
router.patch('/usergeneral', profileController.editSettingsUserGeneral);
router.patch('/profilepic', profileController.editProfilePic);
router.patch('/private', profileController.makePrivate);
router.patch('/public', profileController.makePublic);
router.patch('/receivepayments', profileController.editUserReceivePayments);
router.patch('/cities', citiesController.updatePreferences);

router.patch('/storesettings', HostProfileController.editSettingsHostProfile);

router.get('/suggested/:loggedUserId', profileController.getSuggestedProfiles);
router.delete('/oldpic', profileController.deleteOldProfilePic);

router.post('/ban', profileController.addUserBan);
router.delete('/ban', profileController.removeUserBan);

module.exports = router;