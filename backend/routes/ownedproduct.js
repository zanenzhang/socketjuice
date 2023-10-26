const express = require('express');
const router = express.Router();
const ownedProductsController = require('../controllers/ownedProducts/ownedProductsController');

const verifyJWT = require('../middleware/verifyJWT')

router.use(verifyJWT)

router.get('/:userId', ownedProductsController.getOwnedProducts);
router.post('/user', ownedProductsController.addUserOwnedProduct);
router.post('/store', ownedProductsController.addStoreOwnedProduct);


module.exports = router;