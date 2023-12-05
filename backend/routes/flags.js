const express = require('express');
const router = express.Router();
const flagController = require('../controllers/flags/flagController');

const verifyJWT = require('../middleware/verifyJWT')

router.use(verifyJWT)

router.get('/user/:userId', flagController.getAllFlags);
router.get('/appointmentadmin/:userId', flagController.getAppointmentFlagsAdmin);
router.get('/appointment/:userId', flagController.getAppointmentFlags);

router.post('/user', flagController.addUserFlag);
router.delete('/user', flagController.removeUserFlag);

router.post('/appointment', flagController.addAppointmentFlag);
router.delete('/appointment', flagController.removeAppointmentFlag);

router.delete('/clearusers', flagController.clearUserFlags);


module.exports = router;