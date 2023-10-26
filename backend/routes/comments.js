const express = require('express');
const router = express.Router();
const commentController = require('../controllers/comments/commentController');

const verifyJWT = require('../middleware/verifyJWT')

router.use(verifyJWT)

router.get('/', commentController.getPostComments);
router.post('/', commentController.addPostComment); 
router.patch('/', commentController.editPostComment); 
router.delete('/', commentController.removePostComment); 

router.get('/likes/:commentId', commentController.getCommentLikes);
router.patch('/likes', commentController.editCommentLikes);
router.get('/values/:commentId', commentController.getCommentValues);
router.patch('/values', commentController.editCommentValues);

module.exports = router;