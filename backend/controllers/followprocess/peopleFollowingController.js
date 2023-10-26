const Peoplefollowing = require('../../model/Peoplefollowing');
const User = require('../../model/User');
const ObjectId  = require('mongodb').ObjectId;

const getPeopleFollowing = async (req, res) => {
    
    const userId = req.params.userId

    if (!userId) {
        return res.status(400).json({ message: 'User ID Required' })
    }

    try {

        const peopleFollowing = await Peoplefollowing.findOne({ _userId: userId })

        if (!peopleFollowing) {

            return res.status(400).json({ message: 'User not found' })

        } else {

            const profiles = await User.find({"_id":{"$in": peopleFollowing.allPeopleFollowing.map(c => c._followingId)}}).
                select("_id username profilePicURL privacySetting blockedUsers")

                if (profiles){
                    return res.status(200).json(profiles)
                }
        }

    } catch (err){

        console.log(err)
    }
}

const addPeopleFollowing = async (req, res) => {

    const { primaryUserId, userIdToAdd } = req.body
  
      if (!primaryUserId || !userIdToAdd ) return res.status(400).json({ 'message': 'Missing required fields!' });
  
      try {
  
        const foundUser = await Peoplefollowing.findOne({ _userId: primaryUserId })

        if (foundUser) {

            const found = foundUser.allPeopleFollowing?.some(e => e._followingId.toString() === ((userIdToAdd)))

            if(!found){

                const updated = await Peoplefollowing.findOneAndUpdate({ _userId: primaryUserId },{$push:{allPeopleFollowing:{_followingId: userIdToAdd}}, $inc: {peopleFollowingCount: 1}},{new:true})

                if(updated.allPeopleFollowing.length !== updated.peopleFollowingCount){

                    var newCount = updated.allPeopleFollowing.length

                    const newUpdate = await Peoplefollowing.updateOne({_userId:primaryUserId},{$set:{peopleFollowingCount:newCount}})
                    
                    if(newUpdate){
                        return res.status(200).json(Math.max(newCount, 1))    
                    }
    
                } else {
                    
                    return res.status(200).json(Math.max(updated.peopleFollowingCount, 1))
                }

            } else {

                foundUser.peopleFollowingCount = foundUser.allPeopleFollowing.length

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

  const removePeopleFollowing = async (req, res) => {

    const { loggedUserId, userIdToRemove } = req.query
  
      if (!loggedUserId || !userIdToRemove ) return res.status(400).json({ 'message': 'Missing required fields!' });
  
      try {

        const foundFollowing = await Peoplefollowing.findOne({_userId: loggedUserId})

        if(foundFollowing){

            const check = foundFollowing.allPeopleFollowing?.some(e => e._followingId.toString() === ((userIdToRemove)))

            if(check){

                let foundUser = await Peoplefollowing.findOneAndUpdate({ _userId: loggedUserId },{$pull:{allPeopleFollowing:{_followingId: userIdToRemove}}, $inc: {peopleFollowingCount: -1}},{new:true})

                if(foundUser){

                    return res.status(200).json(foundUser.peopleFollowingCount)

                } else {
                    return res.status(401).json({message:"Operating failed"})
                }

            } else {

                foundFollowing.peopleFollowingCount = foundFollowing.allPeopleFollowing.length

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

module.exports = { getPeopleFollowing, addPeopleFollowing, removePeopleFollowing }