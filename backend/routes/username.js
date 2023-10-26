const express = require('express');
const router = express.Router();
const profileController = require('../controllers/userdata/profileController');
const verifyJWT = require('../middleware/verifyJWT')

router.use(verifyJWT)
router.get('/:username', profileController.getUserIdByUsername);

module.exports = router;

