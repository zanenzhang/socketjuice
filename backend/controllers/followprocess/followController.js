const User = require('../../model/User');
const Peoplefollowers = require('../../model/Peoplefollowers');
const Peoplefollowing = require('../../model/Peoplefollowing');
const Storefollowers = require('../../model/Storefollowers');
const Storefollowing = require('../../model/Storefollowing');
const ObjectId  = require('mongodb').ObjectId;


const getFollowers = async (req, res) => {
    
    const userId = req.params.userId

    if (!userId) {
        return res.status(400).json({ message: 'User ID Required' })
    }

    try {

        const peopleFollowers = await Peoplefollowers.findOne({ _userId: userId })
        const storeFollowers = await Storefollowers.findOne({ _userId: userId })

        if (peopleFollowers && storeFollowers) {
            
            const profiles = await User.find({$or: [{"_id":{"$in": peopleFollowers.allPeopleFollowers.map(c => c._followerId)}},{"_id":{"$in": storeFollowers.allStoreFollowers.map(c => c._followerId)}}] }).
                select("_id username profilePicURL privacySetting blockedUsers roles")

                if (profiles){
                    return res.status(200).json(profiles)
                }

        } else {

            return res.status(400).json({ message: 'User not found' })
        }

    } catch (err){

        console.log(err)
    }

}

const getFollowing = async (req, res) => {
    
    const userId = req.params.userId

    if (!userId) {
        return res.status(400).json({ message: 'User ID Required' })
    }

    try {

        const peopleFollowing = await Peoplefollowing.findOne({ _userId: userId })
        const storeFollowing = await Storefollowing.findOne({ _userId: userId })

        if (peopleFollowing && storeFollowing) {

            const profiles = await User.find({$or: [{"_id":{"$in": peopleFollowing.allPeopleFollowing.map(c => c._followingId)}},
                {"_id":{"$in": storeFollowing.allStoreFollowing.map(c => c._followingId)}}] }).
                select("_id username profilePicURL privacySetting blockedUsers roles")

                if (profiles){
                    return res.status(200).json(profiles)
                }

        } else {

            return res.status(400).json({ message: 'User not found' })            
        }

    } catch (err){

        console.log(err)
    }
}

const getFollowReceive = async (req, res) => {
    
    const { userId } = req.params

    if (!userId) {
        return res.status(400).json({ message: 'User ID Required' })
    }

    try {

        const peopleReceived = await Peoplefollowers.aggregate([
            {"$match": { _userId: userId }},
            {"$unwind" : "$receivedFollowRequests"},
            {"$match": {"receivedFollowRequests.isActiveRequest": true} },
            {"$group": {"_id": "$_id", "receivedFollowRequests":{"$push":"$receivedFollowRequests"}}},
            {"$project":{"receivedFollowRequests._fromRequestedUser":1}}
        ])

        const storeReceived = await Storefollowers.aggregate([
            {"$match": { _userId: userId }},
            {"$unwind" : "$receivedFollowRequests"},
            {"$match": {"receivedFollowRequests.isActiveRequest": true} },
            {"$group": {"_id": "$_id", "receivedFollowRequests":{"$push":"$receivedFollowRequests"}}},
            {"$project":{"receivedFollowRequests._fromRequestedUser":1}}
        ])

        if (peopleReceived && storeReceived) {
            
            var requests=[];
            if(peopleReceived[0]?.receivedFollowRequests !== undefined){
                for(let item of (peopleReceived[0].receivedFollowRequests)){
                    requests.push(item._fromRequestedUser)
                }
            }
            if(storeReceived[0]?.receivedFollowRequests !== undefined){
                for(let item of (storeReceived[0].receivedFollowRequests)){
                    requests.push(item._fromRequestedUser)
                }
            }

            const profiles = await User.find( {_id: { $in: requests } }).select("_id username profilePicURL privacySetting blockedUsers roles")

            if (profiles){
                return res.status(200).json(profiles)
            
            } else {
                return res.status(400).json({ message: 'User not found' })
            }

        } else {

            return res.status(400).json({ message: 'User not found' })
            
        }

    } catch (err){

        console.log(err)
    }
}

const getFollowSubmit = async (req, res) => {
    
    const { userId } = req.params

    if (!userId) {
        return res.status(400).json({ message: 'User ID Required' })
    }

    try {

        const peopleSubmitted = await Peoplefollowing.aggregate([
            {$match: { _userId: userId }},
            {"$unwind" : "$submittedFollowRequests"},
            {"$match": {"submittedFollowRequests.isActiveRequest": true} },
            {"$group": {"_id": "$_id", "submittedFollowRequests":{"$push":"$submittedFollowRequests"}}},
            {"$project":{"submittedFollowRequests._submittedToUser":1}}
        ])

        const storeSubmitted = await Storefollowing.aggregate([
            {$match: { _userId: userId }},
            {"$unwind" : "$submittedFollowRequests"},
            {"$match": {"submittedFollowRequests.isActiveRequest": true} },
            {"$group": {"_id": "$_id", "submittedFollowRequests":{"$push":"$submittedFollowRequests"}}},
            {"$project":{"submittedFollowRequests._submittedToUser":1}}
        ])

        if (peopleSubmitted && storeSubmitted) {
            
            var requests=[];
            if(peopleSubmitted[0]?.submittedFollowRequests !== undefined){
                for(let item of (peopleSubmitted[0].submittedFollowRequests)){
                    requests.push(item._submittedToUser)
                }
            }
            if(storeSubmitted[0]?.submittedFollowRequests !== undefined){
                for(let item of (storeSubmitted[0].submittedFollowRequests)){
                    requests.push(item._submittedToUser)
                }
            }

            const profiles = await User.find( {_id: { $in: requests } }).select("_id username profilePicURL privacySetting blockedUsers roles")

            if (profiles){
                return res.status(200).json(profiles)
            
            } else {
                return res.status(400).json({ message: 'User not found' })
            }
        
        } else {

            return res.status(400).json({ message: 'User not found' })
        }

    } catch (err){

        console.log(err)
    }
}   

const getFollowSettings = async (req, res) => {
    
    const userId = req.params.userId

    if (!userId) {
        return res.status(400).json({ message: 'User ID Required' })
    }

    try {

        var doneFollowers = null;
        var doneFollowing = null;
        var doneSubmits = null;

        var submitProfiles = null;
        var followerProfiles = null;
        var followingProfiles = null;

        const peopleFollowers = await Peoplefollowers.findOne({ _userId: userId })
        const storeFollowers = await Storefollowers.findOne({ _userId: userId })

        const peopleSubmitted = await Peoplefollowing.aggregate([
            {$match: { _userId: userId }},
            {"$unwind" : "$submittedFollowRequests"},
            {"$match": {"submittedFollowRequests.isActiveRequest": true} },
            {"$group": {"_id": "$_id", "submittedFollowRequests":{"$push":"$submittedFollowRequests"}}},
            {"$project":{"submittedFollowRequests._submittedToUser":1}}
        ])

        const storeSubmitted = await Storefollowing.aggregate([
            {$match: { _userId: userId }},
            {"$unwind" : "$submittedFollowRequests"},
            {"$match": {"submittedFollowRequests.isActiveRequest": true} },
            {"$group": {"_id": "$_id", "submittedFollowRequests":{"$push":"$submittedFollowRequests"}}},
            {"$project":{"submittedFollowRequests._submittedToUser":1}}
        ])

        const peopleFollowing = await Peoplefollowing.findOne({ _userId: userId })
        const storeFollowing = await Storefollowing.findOne({ _userId: userId })

        if (peopleFollowing && storeFollowing) {

            followingProfiles = await User.find({$or: [{"_id":{"$in": peopleFollowing.allPeopleFollowing.map(c => c._followingId)}},
            {"_id":{"$in": storeFollowing.allStoreFollowing.map(c => c._followingId)}}] }).
            select("_id username profilePicURL privacySetting blockedUsers roles")

            if (followingProfiles){
                doneFollowing = true;
            }
        }

        if (peopleSubmitted && storeSubmitted) {
            
            var requests=[];
            if(peopleSubmitted[0]?.submittedFollowRequests !== undefined){
                for(let item of (peopleSubmitted[0].submittedFollowRequests)){
                    requests.push(item._submittedToUser)
                }
            }
            if(storeSubmitted[0]?.submittedFollowRequests !== undefined){
                for(let item of (storeSubmitted[0].submittedFollowRequests)){
                    requests.push(item._submittedToUser)
                }
            }

            submitProfiles = await User.find( {_id: { $in: requests } }).select("_id username profilePicURL privacySetting blockedUsers roles")

            if (submitProfiles){
                doneSubmits = true;
            } 
        }

        if (peopleFollowers && storeFollowers) {
            
            followerProfiles = await User.find({$or: [{"_id":{"$in": peopleFollowers.allPeopleFollowers.map(c => c._followerId)}},{"_id":{"$in": storeFollowers.allStoreFollowers.map(c => c._followerId)}}] }).
                select("_id username profilePicURL privacySetting blockedUsers roles")

            if (followerProfiles){
                doneFollowers = true;
            }
        } 

        if(doneFollowers && doneFollowing && doneSubmits){
        
            return res.status(200).json({submitProfiles, followerProfiles, followingProfiles})
        
        } else {

            return res.status(401).json({"message": "Operation failed"})
        }

    } catch (err){

        console.log(err)
        return res.status(401).json({"message": "Operation failed"})
    }

}


module.exports = { getFollowers, getFollowing, getFollowReceive, getFollowSubmit, getFollowSettings}