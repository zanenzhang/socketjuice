const express = require('express');
const router = express.Router();
const productFollowersController = require('../controllers/products/productFollowersController')
const verifyJWT = require('../middleware/verifyJWT')

router.use(verifyJWT)

router.get('/:productId', productFollowersController.getProductFollowers);
router.post('/', productFollowersController.addProductFollowers); 
router.post('/check', productFollowersController.checkProductFollowers); 

router.delete('/', productFollowersController.removeProductFollowers);

module.exports = router;