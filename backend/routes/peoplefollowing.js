const express = require('express');
const router = express.Router();
const peopleFollowingController = require('../controllers/followprocess/peopleFollowingController');
const verifyJWT = require('../middleware/verifyJWT')

router.use(verifyJWT)

router.get('/:userId', peopleFollowingController.getPeopleFollowing);
router.post('/', peopleFollowingController.addPeopleFollowing);

router.delete('/', peopleFollowingController.removePeopleFollowing);

module.exports = router;