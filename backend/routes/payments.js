const express = require('express');
const router = express.Router();
const paymentsController = require('../controllers/payments/paymentsController');
const verifyJWT = require('../middleware/verifyJWT')

router.use(verifyJWT)

router.get('/host', paymentsController.getHostIncomingPayments);
router.get('/driver', paymentsController.getDriverOutgoingPayments);
router.get('/token', paymentsController.getBraintreeToken);

router.post('/newrefund', paymentsController.addRefund);
router.post('/payout', paymentsController.addPayout);
router.post('/sale', paymentsController.addBraintreeSale);


module.exports = router;