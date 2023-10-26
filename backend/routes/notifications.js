const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/userdata/notificationController');
const verifyJWT = require('../middleware/verifyJWT')

router.use(verifyJWT)

router.get('', notificationController.getNotifications);

router.post('/addvalue', notificationController.addValueNoti);
router.post('/addcomment', notificationController.addCommentNoti);
router.post('/addreply', notificationController.addReplyNoti);
router.post('/addcommentvalue', notificationController.addCommentValueNoti);
router.post('/addshare', notificationController.addShareNoti);

router.post('/addfollow', notificationController.addFollowNoti);
router.post('/followrequested', notificationController.addFollowRequestedNoti);
router.post('/followapproved', notificationController.addFollowApprovedNoti);

router.post('/addmessage', notificationController.addMessageNoti);

router.patch('/readrecent', notificationController.editReadRecent);
router.patch('/openedalert', notificationController.editOpenedAlert);
router.patch('/newmessagesfill', notificationController.editNewMessagesFill);
router.patch('/newrequestsfill', notificationController.editNewRequestsFill);

module.exports = router;