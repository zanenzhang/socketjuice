const Storefollowing = require('../../model/Storefollowing');
const User = require('../../model/User');
const ObjectId  = require('mongodb').ObjectId;

const getStoreFollowing = async (req, res) => {
    
    const userId = req.params.userId

    if (!userId) {
        return res.status(400).json({ message: 'User ID Required' })
    }

    try {

        const storeFollowing = await Storefollowing.findOne({ _userId: userId })

        if (!storeFollowing) {

            return res.status(400).json({ message: 'User not found' })

        } else {

            const profiles = await User.find({"_id":{"$in": storeFollowing.allStoreFollowing.map(c => c._followingId)}}).
                select("_id username profilePicURL privacySetting blockedUsers")

                if (profiles){
                    return res.status(200).json(profiles)
                }
        }

    } catch (err){

        console.log(err)
    }
}

const addStoreFollowing = async (req, res) => {

    const { primaryUserId, userIdToAdd } = req.body
  
      if (!primaryUserId || !userIdToAdd ) return res.status(400).json({ 'message': 'Missing required fields!' });
  
      try {
  
        const foundUser = await Storefollowing.findOne({ _userId: primaryUserId })

        if (foundUser) {

            const found = foundUser.allStoreFollowing?.some(e => e._followingId.toString() === ((userIdToAdd)))

            if(!found){

                const updated = await Storefollowing.findOneAndUpdate({ _userId: primaryUserId },{$push:{allStoreFollowing:{_followingId: userIdToAdd}}, $inc: {storeFollowingCount: 1}},{new:true})

                if(updated){

                    if(updated.allStoreFollowing.length !== updated.storeFollowingCount){

                        var newCount = updated.allStoreFollowing.length

                        const newUpdate = await Storefollowing.updateOne({_userId:primaryUserId},{$set:{storeFollowingCount:newCount}})
                        
                        if(newUpdate){
                            return res.status(200).json(Math.max(newCount, 1))    
                        }
        
                    } else {
                        
                        return res.status(200).json(Math.max(updated.storeFollowingCount, 1))
                    }
                }

            } else {

                foundUser.storeFollowingCount = foundUser.allStoreFollowing.length

                const saved = await foundUser.save()

                if(saved){
                    return res.status(200).json({ message: 'Already following!' })
                }
                
            }

        } else {

            return res.status(400).json({ message: 'Failed!' })
        }
  
      } catch (err) {
  
          return res.status(400).json({ message: 'Failed' })
      }
  
  }

  const removeStoreFollowing = async (req, res) => {

    const { loggedUserId, userIdToRemove } = req.query
  
      if (!loggedUserId || !userIdToRemove ) return res.status(400).json({ 'message': 'Missing required fields!' });
  
      try {
  
        const foundFollowing = await Storefollowing.findOne({_userId: loggedUserId})

        if(foundFollowing){

            const check = foundFollowing.allStoreFollowing?.some(e => e._followingId.toString() === ((userIdToRemove)))

            if(check){

                const foundUser = await Storefollowing.findOneAndUpdate({ _userId: loggedUserId },{$pull:{allStoreFollowing:{_followingId: userIdToRemove}}, $inc: {storeFollowingCount: -1}},{new:true})

                if(foundUser){

                    return res.status(200).json(Math.max(foundUser.storeFollowingCount, 0))

                } else {
                    return res.status(401).json({message:"Operating failed"})
                }

            } else {

                foundFollowing.storeFollowingCount = foundFollowing.allStoreFollowing.length

                const saved = await foundFollowing.save()

                if(saved){
                    return res.status(201).json({"message":"Already removed"})
                }
            }
        }      
  
      } catch (err) {

        console.log(err)
  
          return res.status(400).json({ message: 'Failed' })
      }
  
  }

module.exports = { getStoreFollowing, addStoreFollowing, removeStoreFollowing }