const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/userdata/notificationController');
const verifyJWT = require('../middleware/verifyJWT')

router.use(verifyJWT)

router.get('/', notificationController.getNotifications);
router.post('/addmessage', notificationController.addMessageNoti);
router.patch('/readrecent', notificationController.editReadRecent);
router.patch('/openedalert', notificationController.editOpenedAlert);
router.patch('/newmessagesfill', notificationController.editNewMessagesFill);


module.exports = router;