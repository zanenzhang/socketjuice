const express = require('express');
const router = express.Router();
const messageController = require('../controllers/chatdata/messageController');
const verifyJWT = require('../middleware/verifyJWT')

router.use(verifyJWT)
router.get('/', messageController.getChatMessages);
router.post('/', messageController.addMessage);
router.delete('/', messageController.removeMessage);

module.exports = router;