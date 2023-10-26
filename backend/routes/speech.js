const express = require('express');
const router = express.Router();
const multer = require('multer');
const User = require('../model/User');
const ObjectId  = require('mongodb').ObjectId;

const verifyJWT = require('../middleware/verifyJWT');
router.use(verifyJWT);
const upload = multer()

const speechcheckController = require('../controllers/media/speechcheckController');
router.post('/transcribe', upload.single('video'), speechcheckController.checkfile);

module.exports = router;