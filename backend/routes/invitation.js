const express = require('express');
const router = express.Router();
const invitationController = require('../controllers/email/emailInviteController');
const verifyJWT = require('../middleware/verifyJWT')

router.use(verifyJWT)

router.post('/email', invitationController.addEmailInvite);

module.exports = router;