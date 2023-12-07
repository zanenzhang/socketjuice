const express = require('express');
const router = express.Router();
const paymentsController = require('../controllers/payments/paymentsController');
const verifyJWT = require('../middleware/verifyJWT')

router.use(verifyJWT)

router.get('/incoming', paymentsController.getHostIncomingPayments);
router.get('/outgoing', paymentsController.getDriverOutgoingPayments);
router.get('/requests', paymentsController.getPayoutRequests);

router.post('/newpayout', paymentsController.addPayout);
router.post('/request', paymentsController.requestPayout);
router.post('/reject', paymentsController.rejectPayout);

router.post('/order', paymentsController.addPaypalOrder);
router.post('/capture', paymentsController.capturePaypalOrder);


module.exports = router;