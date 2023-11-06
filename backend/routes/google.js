const express = require('express');
const router = express.Router();
const googleController = require('../controllers/mapdata/googleMapController'); 

const verifyJWT = require('../middleware/verifyJWT')

router.use(verifyJWT)

router.get('/coordinates', googleController.getCoordinates);
router.get('/matrix', googleController.getMatrix);


module.exports = router;
