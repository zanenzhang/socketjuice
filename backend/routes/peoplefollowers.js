const express = require('express');
const router = express.Router();
const peopleFollowersController = require('../controllers/followprocess/peopleFollowersController')
const verifyJWT = require('../middleware/verifyJWT')

router.use(verifyJWT)

router.get('/:userId', peopleFollowersController.getPeopleFollowers);
router.post('/', peopleFollowersController.addPeopleFollowers); 
router.post('/check', peopleFollowersController.checkPeopleFollowers); 

router.delete('/', peopleFollowersController.removePeopleFollowers);

module.exports = router;