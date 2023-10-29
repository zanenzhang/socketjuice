const express = require('express');
const router = express.Router();
const flagController = require('../controllers/flags/flagController');

const verifyJWT = require('../middleware/verifyJWT')

router.use(verifyJWT)

router.get('/:userId', flagController.getAllFlags);

router.post('/user', flagController.addUserFlag);
router.delete('/user', flagController.removeUserFlag);
router.delete('/clearusers', flagController.clearUserFlags);


module.exports = router;