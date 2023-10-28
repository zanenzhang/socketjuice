const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/reviews/reviewController');
const verifyJWT = require('../middleware/verifyJWT')

router.use(verifyJWT)

router.get('/', reviewController.getReviews);
router.patch('/', reviewController.editReview);
router.post('/', reviewController.addReview);
router.delete('/', reviewController.deleteReview);

module.exports = router;