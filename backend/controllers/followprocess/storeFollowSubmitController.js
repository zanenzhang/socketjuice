const Storefollowing = require('../../model/Storefollowing');
const User = require('../../model/User');
const ObjectId  = require('mongodb').ObjectId;

const getStoreFollowSubmit = async (req, res) => {
    
    const { userId } = req.params

    if (!userId) {
        return res.status(400).json({ message: 'User ID Required' })
    }

    try {

        const submitted = await Storefollowing.aggregate([
            {$match: { _userId: userId }},
            {"$unwind" : "$submittedFollowRequests"},
            {"$match": {"submittedFollowRequests.isActiveRequest": true} },
            {"$group": {"_id": "$_id", "submittedFollowRequests":{"$push":"$submittedFollowRequests"}}},
            {"$project":{"submittedFollowRequests._submittedToUser":1}}
        ])

        if (!submitted) {
            return res.status(400).json({ message: 'User not found' })
        
        } else {

            var requests=[];
            if(submitted[0]?.submittedFollowRequests !== undefined){
                for(let item of (submitted[0].submittedFollowRequests)){
                    requests.push(item._submittedToUser)
                }
            }

            const profiles = await User.find( {_id: { $in: requests } }).select("_id username profilePicURL privacySetting roles")

            if (profiles){
                return res.status(200).json(profiles)
            
            } else {
                return res.status(400).json({ message: 'User not found' })
            }
        }

    } catch (err){

        console.log(err)
    }

}   

const addStoreFollowSubmit = async (req, res) => {
    
    const { loggedUserId, otherUserId } = req.body

    if (!loggedUserId || !otherUserId || loggedUserId === otherUserId ) return res.status(400).json({ 'message': 'Missing required fields!' });

    try {

        const foundEdit = await Storefollowing.findOne({_userId: loggedUserId, "submittedFollowRequests._submittedToUser": otherUserId})

        if(foundEdit){

            const foundRequests = await Storefollowing.updateOne(
                { _userId: loggedUserId, "submittedFollowRequests._submittedToUser": otherUserId  },
                {$set:{"submittedFollowRequests.$.isActiveRequest": true}}
            )

            if(foundRequests){

                return res.status(201).json({ message: 'Success' })
            }

        } else {

            const foundNew = await Storefollowing.updateOne({_userId: loggedUserId},{$push:{submittedFollowRequests:{_submittedToUser: otherUserId}}})

            if(foundNew){
                
                return res.status(201).json({ message: 'Success' })
            
            } else {

                return res.status(401).json({ message: 'User not found' })
            }
        }

    } catch (err) {

        return res.status(400).json({ message: 'Failed' })
    }
}   

const editStoreFollowSubmit = async (req, res) => {
    
    const { primaryUserId, otherUserId } = req.body

    if (!primaryUserId || !otherUserId ) return res.status(400).json({ 'message': 'Missing required fields!' });

    try {

        const found = await Storefollowing.updateOne({ 
            _userId: primaryUserId, 
            "submittedFollowRequests._submittedToUser": otherUserId },
            {$set:{"submittedFollowRequests.$.isActiveRequest": false}}
        )

        if(found){

            return res.status(201).json({ message: 'Success' })

        } else {

            return res.status(401).json({ message: 'Failed' })
        }

    } catch (err) {

        return res.status(401).json({ message: 'Failed' })
    }
}   


module.exports = { getStoreFollowSubmit, addStoreFollowSubmit, editStoreFollowSubmit }