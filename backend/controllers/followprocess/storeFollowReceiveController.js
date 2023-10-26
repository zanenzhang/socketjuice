const Storefollowers = require('../../model/Storefollowers');
const User = require('../../model/User');
const ObjectId  = require('mongodb').ObjectId;


const getStoreFollowReceive = async (req, res) => {
    
    const { userId } = req.params

    if (!userId) {
        return res.status(400).json({ message: 'User ID Required' })
    }

    try {

        const received = await Storefollowers.aggregate([
            {$match: { _userId: userId }},
            {"$unwind" : "$receivedFollowRequests"},
            {"$match": {"receivedFollowRequests.isActiveRequest": true} },
            {"$group": {"_id": "$_id", "receivedFollowRequests":{"$push":"$receivedFollowRequests"}}},
            {"$project":{"receivedFollowRequests._fromRequestedUser":1}}
        ])

        if (!received) {
            return res.status(400).json({ message: 'User not found' })
        
        } else {

            var requests=[];
            if(received[0]?.receivedFollowRequests !== undefined){
                for(let item of (received[0].receivedFollowRequests)){
                    requests.push(item._fromRequestedUser)
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

const addStoreFollowReceive = async (req, res) => {
    
    const { loggedUserId, otherUserId } = req.body

    if (!loggedUserId || !otherUserId || loggedUserId === otherUserId ) return res.status(400).json({ 'message': 'Missing required fields!' });

    try {

        const foundEdit = await Storefollowers.findOne({_userId: loggedUserId, "receivedFollowRequests._fromRequestedUser": otherUserId})

        if(foundEdit){

            const foundRequests = await Storefollowers.updateOne(
                { _userId: loggedUserId, "receivedFollowRequests._fromRequestedUser": otherUserId  },
                {$set:{"receivedFollowRequests.$.isActiveRequest": true}}
            )

            if(foundRequests){

                return res.status(201).json({ message: 'Success' })
            }

        } else {

            const foundNew = await Storefollowers.updateOne({_userId: loggedUserId},{$push:{receivedFollowRequests:{_fromRequestedUser: otherUserId}}})

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


const editStoreFollowReceive = async (req, res) => {
    
    const { primaryUserId, otherUserId } = req.body

    if (!primaryUserId || !otherUserId ) return res.status(400).json({ 'message': 'Missing required fields!' });

    try {

        const found = await Storefollowers.updateOne({ 
            _userId: primaryUserId, 
            "receivedFollowRequests._fromRequestedUser": otherUserId },
            {$set:{"receivedFollowRequests.$.isActiveRequest": false}}
        )

        if(found){

            return res.status(201).json({ message: 'Success' })

        } else {

            return res.status(401).json({ message: 'Failed' })
        }

    } catch (err) {

        return res.status(400).json({ message: 'Failed' })
    }
}   

const checkStoreFollowReceived = async (req, res) => {

    const { profileUserId, loggedUserId } = req.body
    
    try {

        const user = await Storefollowers.findOne({ _userId: profileUserId })

        if (user) {

            const found = user.receivedFollowRequests.some(e => e._fromRequestedUser.toString() === ((loggedUserId)))

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


module.exports = { getStoreFollowReceive, addStoreFollowReceive, editStoreFollowReceive, checkStoreFollowReceived }