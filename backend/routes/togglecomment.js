const express = require('express');
const router = express.Router();
const toggleCommentController = require('../controllers/comments/toggleCommentController');
const verifyJWT = require('../middleware/verifyJWT')

router.use(verifyJWT)
router.get('/:commentId', toggleCommentController.getToggleComment);

router.post('/liked', toggleCommentController.addToggleCommentLike);
router.post('/valued', toggleCommentController.addToggleCommentValue);

router.delete('/liked', toggleCommentController.removeToggleCommentLike);
router.delete('/valued', toggleCommentController.removeToggleCommentValue);

module.exports = router;