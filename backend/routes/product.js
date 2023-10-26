const express = require('express');
const router = express.Router();
const productProfileController = require('../controllers/products/productProfileController');
const verifyJWT = require('../middleware/verifyJWT')

router.use(verifyJWT)
router.get('/profile', productProfileController.getProductProfile);
router.get('/posts', productProfileController.getProductPosts);
router.get('/owners', productProfileController.getProductOwners);

router.post('/ban', productProfileController.addProductBan);
router.delete('/ban', productProfileController.removeProductBan);

module.exports = router;