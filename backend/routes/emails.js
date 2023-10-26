const express = require('express');
const router = express.Router();
const emailController = require('../controllers/email/emailReportController');
const verifyJWT = require('../middleware/verifyJWT')

router.use(verifyJWT)

router.post('/report/', emailController.addEmailReport);
router.post('/orders/', emailController.addEmailOrders);

module.exports = router;