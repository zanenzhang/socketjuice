const express = require('express');
const router = express.Router();
const appointmentController = require('../controllers/appointments/appointmentController'); 

const verifyJWT = require('../middleware/verifyJWT')

router.use(verifyJWT)

router.get('/driver', appointmentController.getDriverAppointments);
router.get('/host', appointmentController.getHostAppointments);

router.post('/request', appointmentController.addAppointmentRequest);
router.post('/approval', appointmentController.addAppointmentApproval);
router.post('/completion', appointmentController.addAppointmentCompletion);
router.post('/drivercancelsubmit', appointmentController.driverRequestCancelSubmit);
router.post('/drivercancelapprove', appointmentController.driverRequestCancelApprove);
router.post('/hostcancelsubmit', appointmentController.hostRequestCancelSubmit);
router.post('/hostcancelapprove', appointmentController.hostRequestCancelApprove);

router.delete('/', appointmentController.removeAppointment);


module.exports = router;
