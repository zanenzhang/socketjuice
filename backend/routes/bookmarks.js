const express = require('express');
const router = express.Router();
const bookmarkController = require('../controllers/bookmarks/bookmarkController');

const verifyJWT = require('../middleware/verifyJWT')

router.use(verifyJWT)

router.get('/', bookmarkController.getBookmarks);
router.post('/', bookmarkController.addBookmark);
router.delete('/', bookmarkController.removeBookmark);

module.exports = router;