const express = require('express');
const router = express.Router();
const appointmentController = require('../controllers/appointments/appointmentController'); 

const verifyJWT = require('../middleware/verifyJWT')

router.use(verifyJWT)

router.get('/driver', appointmentController.getDriverAppointments);
router.get('/host', appointmentController.getHostAppointments);
router.post('/', appointmentController.addAppointment);
router.delete('/', appointmentController.removeAppointment);



module.exports = router;
