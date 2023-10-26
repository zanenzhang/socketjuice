const express = require('express');
const router = express.Router();
const postsController = require('../controllers/postdata/postsController');
const verifyJWT = require('../middleware/verifyJWT')

router.use(verifyJWT)
router.get('/userbought/', postsController.getBoughtPostsUser);
router.get('/userselling/', postsController.getSellingPostsUser);
router.get('/usersocial/', postsController.getSocialPostsUser);
router.get('/storeselling/', postsController.getSellingPostsStore);
router.get('/storepromotion/', postsController.getPromotionPostsStore);
router.get('/storesocial/', postsController.getSocialPostsStore);

module.exports = router;