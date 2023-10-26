const express = require('express');
const router = express.Router();
const deleteController = require('../controllers/deletedata/deleteUserController');
const verifyJWT = require('../middleware/verifyJWT')

router.use(verifyJWT)

router.delete('/deleterequest/', deleteController.deleteUserData);

module.exports = router;