const express = require('express');
const router = express.Router();
const productsController = require('../controllers/products/productsController');
const verifyJWT = require('../middleware/verifyJWT')

router.use(verifyJWT)
router.get('/:productId', productsController.getAllPostsByProduct);

module.exports = router;