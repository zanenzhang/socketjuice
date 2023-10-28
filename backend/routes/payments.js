const express = require('express');
const router = express.Router();
const paymentsController = require('../controllers/payments/paymentsController');
const verifyJWT = require('../middleware/verifyJWT')

router.use(verifyJWT)

router.get('/host', paymentsController.getHostIncomingPayments);
router.get('/driver', paymentsController.getDriverOutgoingPayments);
router.post('/newpayment', paymentsController.addPayment);
router.post('/newrefund', paymentsController.addRefund);

module.exports = router;