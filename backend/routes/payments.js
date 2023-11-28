const express = require('express');
const router = express.Router();
const paymentsController = require('../controllers/payments/paymentsController');
const verifyJWT = require('../middleware/verifyJWT')

router.use(verifyJWT)

router.get('/host', paymentsController.getHostIncomingPayments);
router.get('/driver', paymentsController.getDriverOutgoingPayments);

router.post('/newpayout', paymentsController.addPayout);
router.post('/request', paymentsController.requestPayout);

router.post('/order', paymentsController.addPaypalOrder);
router.post('/capture', paymentsController.capturePaypalOrder);


module.exports = router;