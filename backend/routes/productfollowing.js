const express = require('express');
const router = express.Router();
const productFollowingController = require('../controllers/products/productFollowingController');
const verifyJWT = require('../middleware/verifyJWT')

router.use(verifyJWT)
router.get('/:userId', productFollowingController.getProductFollowing);
router.post('/', productFollowingController.addProductFollowing);

router.delete('/', productFollowingController.removeProductFollowing);

module.exports = router;