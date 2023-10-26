const express = require('express');
const router = express.Router();
const flagController = require('../controllers/flags/flagController');

const verifyJWT = require('../middleware/verifyJWT')

router.use(verifyJWT)

router.get('/:userId', flagController.getAllFlags);

router.post('/comment', flagController.addCommentFlag);
router.delete('/comment', flagController.removeCommentFlag);
router.post('/user', flagController.addUserFlag);
router.delete('/user', flagController.removeUserFlag);
router.post('/post', flagController.addPostFlag);
router.delete('/post', flagController.removePostFlag);
router.post('/product', flagController.addProductFlag);
router.delete('/product', flagController.removeProductFlag);

router.delete('/clearproducts', flagController.clearProductFlags);
router.delete('/clearposts', flagController.clearPostFlags);
router.delete('/clearcomments', flagController.clearCommentFlags);
router.delete('/clearusers', flagController.clearUserFlags);


module.exports = router;