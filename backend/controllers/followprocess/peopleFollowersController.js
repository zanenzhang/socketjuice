const Peoplefollowers = require('../../model/Peoplefollowers');
const User = require('../../model/User');
const ObjectId  = require('mongodb').ObjectId;

const getPeopleFollowers = async (req, res) => {
    
    const userId = req.params.userId

    if (!userId) {
        return res.status(400).json({ message: 'User ID Required' })
    }

    try {

        const peopleFollowers = await Peoplefollowers.findOne({ _userId: userId })

        if (!peopleFollowers) {
            return res.status(400).json({ message: 'User not found' })
        
        } else {

            // const blockedProfiles = await User.find({"_id":{"$in": foundUser.blockedUsers.map(c => c._userId)}}).
            // select("_id username profilePicURL privacySetting")

            const profiles = await User.find({"_id":{"$in": peopleFollowers.allPeopleFollowers.map(c => c._followerId)}}).
                select("_id username profilePicURL privacySetting blockedUsers roles")

                if (profiles){
                    return res.status(200).json(profiles)
                }
        }

    } catch (err){

        console.log(err)
    }

}

const addPeopleFollowers = async (req, res) => {

  const { profileUserId, userIdToAdd } = req.body

    if (!profileUserId || !userIdToAdd ) return res.status(400).json({ 'message': 'Missing required fields!' });

    try {

        const foundFollowers = await Peoplefollowers.findOne({ _userId: profileUserId })
        const foundUser = await User.findOne({_id:profileUserId})

        if (foundFollowers && foundUser) {

            const check = foundFollowers.allPeopleFollowers?.some(e => e._followerId.toString() === ((userIdToAdd)) )

            if(!check){

                const updatedFollow = await Peoplefollowers.findOneAndUpdate({ _userId: profileUserId },{$push:{allPeopleFollowers:{_followerId: userIdToAdd}},$inc:{peopleFollowersCount:1}},{new:true})

                var reviewed = false;

                if(updatedFollow){

                    if(updatedFollow.allPeopleFollowers.length !== updatedFollow.peopleFollowersCount){
                        
                        var newCount = updatedFollow.allPeopleFollowers.length

                        const newUpdate = await Peoplefollowers.updateOne({_userId: profileUserId},{$set:{peopleFollowersCount:newCount}})
                        
                        if(newUpdate){
                            return res.status(200).json(updatedFollow.peopleFollowersCount)
                        }
                    
                    } else {
                        return res.status(200).json(updatedFollow.peopleFollowersCount)
                    }

                } else {

                    return res.status(400).json({ message: 'Failed' })
                }
                
            } else {
                
                foundFollowers.peopleFollowersCount = foundFollowers.allPeopleFollowers.length

                const saved = await foundFollowers.save()

                if(saved){

                    console.log("Adding people followers 3")
                    return res.status(201).json({ message: 'User already followed!' })
                }
                
            }

        } else {
            return res.status(400).json({ message: 'Failed' })
        }

    } catch (err) {

        console.log(err)

        return res.status(400).json({ message: 'Failed' })
    }

}

const checkPeopleFollowers = async (req, res) => {

    const { profileUserId, loggedUserId } = req.body
    
    try {

        const user = await Peoplefollowers.findOne({ _userId: profileUserId })

        if (user) {

            const found = user.allPeopleFollowers.some(e => e._followerId.toString() === ((loggedUserId)))

            if(!found){
                return res.json(false)

            } else {
                return res.json(true)
            }
        } 

    } catch (err) {

        return res.status(400).json({ message: 'Failed' })
    }
}

const removePeopleFollowers = async (req, res) => {

    const { loggedUserId, userIdToRemove } = req.query
  
      if (!loggedUserId || !userIdToRemove ) return res.status(400).json({ 'message': 'Missing required fields!' });

      try {

        const foundFollowers = await Peoplefollowers.findOne({_userId: loggedUserId})

        if(foundFollowers){

            const found = foundFollowers.allPeopleFollowers?.some(e => e._followerId.toString() === ((userIdToRemove)) )
        
            if(found){

                const updatedFollow = await Peoplefollowers.findOneAndUpdate({ _userId: loggedUserId },{$pull:{allPeopleFollowers:{_followerId: userIdToRemove}},$inc:{peopleFollowersCount:-1}},{new:true})

                if(updatedFollow){

                    return res.status(200).json(updatedFollow.peopleFollowersCount)

                } else {
                    return res.status(401).json({message: "Error, failed operation"})
                }

            } else {

                foundFollowers.peopleFollowersCount = foundFollowers.allPeopleFollowers.length

                const saved = await foundFollowers.save()

                if(saved){
                    return res.status(201).json({message: "Already removed"})
                }

            }
        }
  
      } catch (err) {

        console.log(err)
  
          return res.status(400).json({ message: 'Failed' })
      }
  
  }


module.exports = { getPeopleFollowers, addPeopleFollowers, checkPeopleFollowers, removePeopleFollowers }