const RecentlyViewed = require('../../model/RecentlyViewed');
const RecentlyVisited = require('../../model/RecentlyVisited');
const Peoplefollowing = require('../../model/Peoplefollowing');
const User = require('../../model/User');
const StoreProfile = require('../../model/StoreProfile');


const getRecentUsersViewed = async (req, res) => {

    const { userId } = req.params

    if (!userId) {
        return res.status(400).json({ message: 'User ID Required' })
    }

    const publicUserEmailList = ["drake@purchies.com", "rihanna@purchies.com", "miley@purchies.com", "matt@purchies.com", 
    "kevin@purchies.com", "therock@purchies.com", "adele@purchies.com", "gordon@purchies.com", "george@purchies.com",
    "tom@purchies.com", "michelle@purchies.com", "jackie@purchies.com"]

    try {
        
        const today = new Date()
        const oneMonthAgo = new Date(today.getFullYear(), today.getMonth(), today.getDate()-30);
        
        const people = await Peoplefollowing.findOne({_userId: userId})

        if(people?.allPeopleFollowing?.length > 0){

            const followsViewed = await RecentlyViewed.find({$and:[{_userId: {$in: people.allPeopleFollowing.map(e => e._followingId)}},
                {_userId: {$ne: userId}}, {lastViewedTime: {$gte: oneMonthAgo}}]}).sort({lastViewedTime: -1}).limit(12)

            if(followsViewed && followsViewed?.length < 12){

                const morePublic = await RecentlyViewed.find({$and:[{_userId: {$nin: followsViewed.map(e=>e._userId)}},{_userId: {$ne: userId}},
                    {privacySetting: {$ne: 2}}, {lastViewedTime: {$gte: oneMonthAgo}}]}).sort({lastViewedTime: -1}).limit((12-followsViewed?.length))

                if(morePublic){

                    const followsData = await User.find({$or:[{_id: {$in: followsViewed.map(e => e._userId)}}, {_id: {$in: morePublic.map(e => e._userId)}}]}).
                    select("_id username roles profilePicURL")

                    const publicData = await User.find({email: {$in: publicUserEmailList}}).
                    select("_id username roles profilePicURL").limit(3)

                    if(followsData && publicData){

                        var userData = [...followsData, ...publicData]
                        
                        return res.status(200).json(userData)
                    }
                }

            } else {

                const userData = await User.find({_id: {$in: followsViewed.map(e => e._userId)}}).limit(12)
                    select("_id username roles profilePicURL")

                    if(userData){
                        
                        return res.status(200).json(userData)
                    }
            }

        } else {

            const userData = await User.find({email: {$in: publicUserEmailList}}).select("_id username roles profilePicURL")

            if(userData){    
                return res.status(200).json(userData)
            }
        }

    } catch(err){

        console.log(err)
        return res.status(401).json({message: "Failed to get users"})
    }
}


const getRecentUsersVisited = async (req, res) => {

    const { userId } = req.params

    // Confirm data
    if (!userId) {
        return res.status(400).json({ message: 'User ID Required' })
    }

    try {

        const today = new Date()
        
        const weekAgo = new Date(today.getFullYear(), today.getMonth(), today.getDate()-7);

        const people = await Peoplefollowing.findOne({_userId: userId})

        if(people){

            if(people.allPeopleFollowing){

                const followsVisited = await RecentlyVisited.find({$and:[{_userId: {"$in": people.allPeopleFollowing.map(e => e._followingId)}},{_userId: {$ne: userId}},{lastViewedTime:{$gte: weekAgo}}]}).limit(10)

                if(followsVisited){

                    const userData = await User.find({_id: {$in: followsVisited.map(e => e._userId)}}).
                    select("_id username roles profilePicURL")

                    const storeData = await StoreProfile.find({_id: {$in: followsVisited.map(e => e._userId)}}).
                    select("_userId displayname address city region")

                    if(userData && storeData){
                        return res.status(200).json({followsVisited, userData})
                    }
                
                } else {

                    return res.status(200).json({})
                }
            
            } else {
                return res.status(200).json({})
            }

        } else {

            return res.status(401).json({message: "Failed to get users"})
        }
        
    } catch(err){

        console.log(err)
        return res.status(401).json({message: "Failed to get users"})
    }
}

const getRandomRecentUsers = async (req, res) => {

    const { userId } = req.params

    if (!userId) {
        return res.status(400).json({ message: 'User ID Required' })
    }

    try {
        const people = Peoplefollowing.findOne({_userId: userId}).select("allPeopleFollowing")

        if(people){

            const followsViewed = RecentlyViewed.find({"$and":[{_userId: {"$nin": people.allPeopleFollowing.map(e => e._followingId)}},{"ne":userId}]},{lastViewedTime:{"$gt": weekAgo}}).limit(10)

            if(followsViewed){

                return res.status(200).json(followsViewed)
            }

        } else {

            return res.status(200).json({})
        }

    } catch(err){

        console.log(err)
        return res.status(401).json({message: "Failed to get users"})
    }
}


module.exports = { getRecentUsersViewed, getRecentUsersVisited, getRandomRecentUsers }
