const express = require('express');
const router = express.Router();
const warningsController = require('../controllers/userdata/warningsController');
const verifyJWT = require('../middleware/verifyJWT')

router.use(verifyJWT)
router.post('/', warningsController.addWarnings);

module.exports = router;