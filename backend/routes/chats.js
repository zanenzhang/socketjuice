const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatdata/chatController');
const verifyJWT = require('../middleware/verifyJWT')

router.use(verifyJWT)

router.get('/:userId', chatController.getUserChats);

router.post('/new', chatController.addChat);
router.post('/user', chatController.addUserToChat);

router.patch('/mute', chatController.muteChat);

router.delete('/leave', chatController.removeUserFromChat);
router.delete('/remove', chatController.deleteChat);


module.exports = router;