const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatdata/chatController');
const verifyJWT = require('../middleware/verifyJWT');

router.use(verifyJWT)
router.get('/:chatId', chatController.getSingleChat);


module.exports = router;