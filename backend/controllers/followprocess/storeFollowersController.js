const Storefollowers = require('../../model/Storefollowers');
const User = require('../../model/User');
const ObjectId  = require('mongodb').ObjectId;

const getStoreFollowers = async (req, res) => {
    
    const userId = req.params.userId

    if (!userId) {
        return res.status(400).json({ message: 'User ID Required' })
    }

    try {

        const storeFollowers = await Storefollowers.findOne({ _userId: userId })

        if (!storeFollowers) {
            return res.status(400).json({ message: 'User not found' })
        
        } else {

            // const blockedProfiles = await User.find({"_id":{"$in": foundUser.blockedUsers.map(c => c._userId)}}).
            // select("_id username profilePicURL privacySetting")

            const profiles = await User.find({"_id":{"$in": storeFollowers.allStoreFollowers.map(c => c._followerId)}}).
                select("_id username profilePicURL privacySetting blockedUsers roles")

                if (profiles){
                    return res.status(200).json(profiles)
                }
        }

    } catch (err){

        console.log(err)
    }

}

const addStoreFollowers = async (req, res) => {

  const { profileUserId, userIdToAdd } = req.body

    if (!profileUserId || !userIdToAdd ) return res.status(400).json({ 'message': 'Missing required fields!' });

    try {

        const foundFollowers = await Storefollowers.findOne({ _userId: profileUserId })

        if (foundFollowers) {

            const found = foundFollowers.allStoreFollowers?.some(e => e._followerId.toString() === ((userIdToAdd)) )

            if(!found){

                const updated = await Storefollowers.findOneAndUpdate({ _userId: profileUserId },{$push:{allStoreFollowers:{_followerId: userIdToAdd}},$inc:{storeFollowersCount:1}},{new:true})

                if(updated.allStoreFollowers.length !== updated.storeFollowersCount){

                    var newCount = updated.allStoreFollowers.length

                    const newUpdate = await Storefollowers.updateOne({_userId: profileUserId},{$set:{storeFollowersCount:newCount}})
                    
                    if(newUpdate){
                        return res.status(200).json(Math.max(newCount, 1))    
                    }
    
                } else {
                    
                    return res.status(200).json(Math.max(updated.storeFollowersCount, 1))
                }
                
            } else {

                foundFollowers.storeFollowersCount = foundFollowers.allStoreFollowers.length

                const saved = await foundFollowers.save()

                if(saved){
                    return res.status(201).json({ message: 'Store already followed!' })
                }
            }

        } else {

            return res.status(400).json({ message: 'Failed!' })
        }

    } catch (err) {

        console.log(err)

        return res.status(403).json({ message: 'Failed' })
    }

}

const checkStoreFollowers = async (req, res) => {

    const { profileUserId, loggedUserId } = req.body
    
    try {

        const user = await Storefollowers.findOne({ _userId: profileUserId })

        if (user) {

            const found = user.allStoreFollowers.some(e => e._followerId.toString() === ((loggedUserId)))

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

const removeStoreFollowers = async (req, res) => {

    const { loggedUserId, userIdToRemove } = req.query
  
      if (!loggedUserId || !userIdToRemove ) return res.status(400).json({ 'message': 'Missing required fields!' });
  
      try {

        const foundFollowers = await Storefollowers.findOne({_userId: loggedUserId})

        if(foundFollowers){

            const found = foundFollowers.allStoreFollowers?.some(e => e._followerId.toString() === ((userIdToRemove)) )
        
            if(found){

                const updatedFollow = await Storefollowers.findOneAndUpdate({ _userId: loggedUserId },{$pull:{allStoreFollowers:{_followerId: userIdToRemove}},$inc:{storeFollowersCount:-1}},{new:true})

                if(updatedFollow){
                    return res.status(200).json(foundFollowers.storeFollowersCount)
                }

            } else {

                foundFollowers.storeFollowersCount = foundFollowers.allStoreFollowers.length

                const saved = await foundFollowers.save()

                if(saved){
                    return res.status(201).json({message: "Already removed"})
                }

            }

        } else {
            return res.status(201)
        }
  
      } catch (err) {
  
          return res.status(400).json({ message: 'Failed' })
      }
  
  }


module.exports = { getStoreFollowers, addStoreFollowers, checkStoreFollowers, removeStoreFollowers }