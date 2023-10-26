const User = require('../../model/User');
const Peoplefollowing = require('../../model/Peoplefollowing');
const Peoplefollowers = require('../../model/Peoplefollowers');
const Storefollowing = require('../../model/Storefollowing');
const Storefollowers = require('../../model/Storefollowers');
const Chat = require('../../model/Chat');
const Communications = require('../../model/Communications');
const ObjectId  = require('mongodb').ObjectId;
const jwt = require('jsonwebtoken');


const getUserBlocks = async (req, res) => {
    
    const { userId } = req.params

    if (!userId) {
        return res.status(400).json({ message: 'User ID Required' })
    }

    try {

        const foundUser = await User.findOne({ _id: userId })

        if(foundUser.blockedUsers){

            const blockedProfiles = await User.find({"_id":{"$in": foundUser.blockedUsers.map(c => c._userId)}}).
            select("_id username profilePicURL privacySetting")

            if (blockedProfiles){
                return res.status(200).json(blockedProfiles)
            }
        
        } else {
            return res.status(200).json([])
        }

    } catch(err){

        console.log(err)
    }
}   


const checkUserBlocks = async (req, res) => {
    
    const { userId, loggedUserId } = req.query

    if (!loggedUserId || !userId) {
        return res.status(400).json({ message: 'User ID Required' })
    }

    try {

        const foundUser = await User.findOne({ _id: userId })

        if(foundUser){

            if (foundUser.blockedUsers){

                const blocked = (foundUser?.blockedUsers.some(e=>e._userId.toString() === loggedUserId))

                return res.status(200).json(blocked)

            } else {

                return res.status(200).json(false)
            }

        } else {

            return res.status(400).json({ message: 'User not found!' })
        }

    } catch(err){

        console.log(err)
    }
}   


const addUserBlock = async (req, res) => {

    const cookies = req.cookies;

    if (!cookies?.purchiesjwt) return res.sendStatus(202);
    const refreshToken = cookies.purchiesjwt;

    User.findOne({ refreshToken }, async function(err, foundUser){

        if (err || !foundUser) return res.sendStatus(202); 
    
        jwt.verify(
            refreshToken,
            process.env.REFRESH_TOKEN_SECRET,
            (err, decoded) => {

                if (err || foundUser.username !== decoded.username || !foundUser._id.toString() === ((decoded.userId)) ) return res.sendStatus(403);
            }
            )
        
        const { loggedUserId, blockedUserId, loggedUserOrStore, profileUserOrStore } = req.body

        if (!loggedUserId || !foundUser._id.toString() === loggedUserId || !blockedUserId || !loggedUserOrStore || !profileUserOrStore ||
            loggedUserId === blockedUserId ) return res.status(400).json({ 'message': 'Missing required fields!' });

        try {

            var updatedFollowing1 = null;
            var updatedFollowers1 = null;
            var updatedFollowing2 = null;
            var updatedFollowers2 = null;
            var updatedChats = null;

            if (!foundUser.blockedUsers?.some(e => e._userId.toString() === ((blockedUserId)))) {
            
                foundUser.blockedUsers.push({_userId: blockedUserId})
        
                const saved = await foundUser.save()

                if(saved){

                    const userComms = await Communications.findOne({_userId: loggedUserId})
                    var blockedChatsList = []

                    if(userComms){

                        var peopleSet = new Set();
                        
                        for(let i=0; i<userComms.chats?.length; i++){
                            if(userComms.chats[i].participants.some(e=>e._userId.toString() === ((blockedUserId)))){
                                
                                blockedChatsList.push(userComms.chats[i]);

                                for(let x=0; x<userComms.chats[i].participants?.length; x++){
                                    var item = userComms.chats[i].participants[x]
                                    peopleSet.add(item._userId)
                                }
                            }
                        }

                        var blockedChatsHash = {}
                        for(let i=0; i<blockedChatsList?.length; i++){
                            blockedChatsHash[blockedChatsList[i]._chatId] = blockedChatsList[i]._chatId
                            userComms.chats?.pull({_chatId:blockedChatsList[i]._chatId})
                        }

                        var peopleList = [...peopleSet]

                        if(peopleList?.length > 0){
                            for(let i=0; i< peopleList.length; i++){

                                if(! peopleList[i].toString() === ((loggedUserId))){

                                    Communications.findOne({_userId:peopleList[i]}, function(err, otherComm){

                                        if(err){
                                            console.log(err)
                                        }
    
                                        if(otherComm.chats?.length > 0){
                                            for(let j=0; j< otherComm.chats?.length; j++){
                                                console.log(otherComm.chats[j]._chatId)
                                                if(blockedChatsHash[otherComm.chats[j]._chatId] !== undefined){
                                                    otherComm.chats[j].participants?.pull({_userId: loggedUserId})
                                                    otherComm.chats[j].participantsNumber = otherComm.chats[j].participantsNumber - 1
                                                }
                                            }
                                            otherComm.save()
                                        }
    
                                    })
                                }
                            }
                        }

                        const savedComms = await userComms.save();
                        const removed = await Chat.updateMany({_id: {$in: blockedChatsList.map(e=>e._chatId)}}, {$pull: {participants: {_userId: loggedUserId}}, $inc: {participantsNumber: - 1}})

                        if(removed && savedComms){
                            updatedChats = true;
                        }
                    }

                    if(profileUserOrStore == 1){

                        console.log("Adding user block 3")

                        const following = await Peoplefollowing.findOne({_userId: loggedUserId})
                        const followers = await Peoplefollowers.findOne({_userId: loggedUserId})

                        if(following){

                            if(following.submittedFollowRequests?.some(e=>e._submittedToUser.toString() === ((blockedUserId)))){
                                
                                const updated = await Peoplefollowing.updateOne({_userId: loggedUserId},{$set:{"submittedFollowRequests.$[elem].isActiveRequest":false}},{arrayFilters:[{'elem._submittedToUser':blockedUserId}]} )

                                if(updated){
                                    updatedFollowing1 = true;
                                }

                            } else {

                                following.allPeopleFollowing?.pull({_followingId: blockedUserId})
                                following.peopleFollowingCount = Math.max(following.peopleFollowingCount - 1, 0)

                                const removed = await following.save()

                                if(removed){
                                    updatedFollowing1 = true;
                                }
                            }

                        } else {

                            updatedFollowing1 = true;
                        }

                        if(followers){

                            console.log("Adding user block 4")

                            if(followers.receivedFollowRequests?.some(e=>e._fromRequestedUser.toString() === ((blockedUserId)))){
                                
                                const updated = await Peoplefollowers.updateOne({_userId: loggedUserId},{$set:{"receivedFollowRequests.$[elem].isActiveRequest":false}},{arrayFilters:[{'elem._fromRequestedUser':blockedUserId}]} )

                                if(updated){
                                    updatedFollowers1 = true;
                                }

                            } else {

                                followers.allPeopleFollowers?.pull({_followerId: blockedUserId})
                                followers.peopleFollowersCount = Math.max(followers.peopleFollowersCount - 1, 0)

                                const removed = await followers.save()

                                if(removed){
                                    updatedFollowers1 = true;
                                }
                            }
                        
                        } else {

                            updatedFollowers1 = true;
                        }

                    } else {

                        console.log("Adding user block 5")

                        const following = await Storefollowing.findOne({_userId: loggedUserId})
                        const followers = await Storefollowers.findOne({_userId: loggedUserId})

                        if(following){

                            if(following.submittedFollowRequests?.some(e=>e._submittedToUser.toString() === ((blockedUserId)))){
                                
                                const updated = await Storefollowing.updateOne({_userId: loggedUserId},{$set:{"submittedFollowRequests.$[elem].isActiveRequest":false}},{arrayFilters:[{'elem._submittedToUser':blockedUserId}]} )

                                if(updated){
                                    updatedFollowing1 = true;
                                }

                            } else {

                                following.allStoreFollowing?.pull({_followingId: blockedUserId})
                                following.storeFollowingCount = Math.max(following.storeFollowingCount - 1, 0)

                                const removed = await following.save()

                                if(removed){
                                    updatedFollowing1 = true;
                                }
                            }

                        } else {
                            
                            updatedFollowing1 = true;
                        }

                        if(followers){

                            console.log("Adding user block 6")

                            if(followers.receivedFollowRequests?.some(e=>e._fromRequestedUser.toString() === ((blockedUserId)))){
                                
                                const updated = await Storefollowers.updateOne({_userId: loggedUserId},{$set:{"receivedFollowRequests.$[elem].isActiveRequest":false}},{arrayFilters:[{'elem._fromRequestedUser':blockedUserId}]} )

                                if(updated){
                                    updatedFollowers1 = true;
                                }

                            } else {

                                followers.allStoreFollowers?.pull({_followerId: blockedUserId})
                                followers.storeFollowersCount = Math.max(followers.storeFollowersCount - 1, 0)

                                const removed = await followers.save()

                                if(removed){
                                    updatedFollowers1 = true;
                                }
                            }

                        } else {
                            updatedFollowers1 = true;
                        }
                    }

                    if(loggedUserOrStore == 1){

                        console.log("Adding user block 7")

                        const following = await Peoplefollowing.findOne({_userId: blockedUserId})
                        const followers = await Peoplefollowers.findOne({_userId: blockedUserId})

                        if(following){

                            if(following.submittedFollowRequests?.some(e=>e._submittedToUser.toString() === ((loggedUserId)))){
                                
                                const updated = await Peoplefollowing.updateOne({_userId: blockedUserId},{$set:{"submittedFollowRequests.$[elem].isActiveRequest":false}},{arrayFilters:[{'elem._submittedToUser':loggedUserId}]} )

                                if(updated){
                                    updatedFollowing2 = true;
                                }

                            } else {

                                following.allPeopleFollowing?.pull({_followingId: loggedUserId})
                                following.peopleFollowingCount = Math.max(following.peopleFollowingCount - 1, 0)

                                const removed = await following.save()

                                if(removed){
                                    updatedFollowing2 = true;
                                }
                            }

                        } else {

                            updatedFollowing2 = true;
                        }

                        if(followers){

                            console.log("Adding user block 8")

                            if(followers.receivedFollowRequests?.some(e=>e._fromRequestedUser.toString() === ((loggedUserId)))){
                                
                                const updated = await Peoplefollowers.updateOne({_userId: blockedUserId},{$set:{"receivedFollowRequests.$[elem].isActiveRequest":false}},{arrayFilters:[{'elem._fromRequestedUser':loggedUserId}]} )

                                if(updated){
                                    updatedFollowers2 = true;
                                }

                            } else {

                                followers.allPeopleFollowers?.pull({_followerId: loggedUserId})
                                followers.peopleFollowersCount = Math.max(followers.peopleFollowersCount - 1, 0)

                                const removed = await followers.save()

                                if(removed){
                                    updatedFollowers2 = true;
                                }
                            }
                        
                        } else {

                            updatedFollowers2 = true;
                        }

                    } else {

                        const following = await Storefollowing.findOne({_userId: blockedUserId})
                        const followers = await Storefollowers.findOne({_userId: blockedUserId})

                        console.log("Adding user block 9")

                        if(following){

                            if(following.submittedFollowRequests?.some(e=>e._submittedToUser.toString() === ((loggedUserId)))){
                                
                                const updated = await Storefollowing.updateOne({_userId: blockedUserId},{$set:{"submittedFollowRequests.$[elem].isActiveRequest":false}},{arrayFilters:[{'elem._submittedToUser':loggedUserId}]} )

                                if(updated){
                                    updatedFollowing2 = true;
                                }

                            } else {

                                following.allStoreFollowing?.pull({_followingId: loggedUserId})
                                following.storeFollowingCount = Math.max(following.storeFollowingCount - 1, 0)

                                const removed = await following.save()

                                if(removed){
                                    updatedFollowing2 = true;
                                }
                            }

                        } else {
                            
                            updatedFollowing2 = true;
                        }

                        if(followers){

                            console.log("Adding user block 10")

                            if(followers.receivedFollowRequests?.some(e=>e._fromRequestedUser.toString() === ((loggedUserId)))){
                                
                                const updated = await Storefollowers.updateOne({_userId: blockedUserId},{$set:{"receivedFollowRequests.$[elem].isActiveRequest":false}},{arrayFilters:[{'elem._fromRequestedUser':loggedUserId}]} )

                                if(updated){
                                    updatedFollowers2 = true;
                                }

                            } else {

                                followers.allStoreFollowers?.pull({_followerId: loggedUserId})
                                followers.storeFollowersCount = Math.max(followers.storeFollowersCount - 1, 0)

                                const removed = await followers.save()

                                if(removed){
                                    updatedFollowers2 = true;
                                }
                            }

                        } else {
                            updatedFollowers2 = true;
                        }
                    }

                    if(updatedChats && updatedFollowing1 && updatedFollowing2 && updatedFollowers1 && updatedFollowers2){
                        
                        return res.status(201).json({ message: 'Success' })
                    }
                
                } else {

                    return res.status(500).json({ 'Message': err.message });
                }

            } else {

                return res.status(401).json({ message: 'User already blocked' })
            }

        } catch (err) {

            return res.status(401).json({ message: 'Failed' })
        }
    })
}   


const removeUserBlock = async (req, res) => {

    const cookies = req.cookies;

    if (!cookies?.purchiesjwt) return res.sendStatus(202);
    const refreshToken = cookies.purchiesjwt;

    User.findOne({ refreshToken }, async function(err, foundUser){

        if (err || !foundUser) return res.sendStatus(202); 
    
        jwt.verify(
            refreshToken,
            process.env.REFRESH_TOKEN_SECRET,
            (err, decoded) => {

                if (err || foundUser.username !== decoded.username || !foundUser._id.toString() === ((decoded.userId)) ) return res.sendStatus(403);
            }
            )

        console.log("Starting removal of block")
        
        const { loggedUserId, blockedUserId } = req.query

        if (!loggedUserId || !foundUser._id.toString() === loggedUserId || !blockedUserId ) return res.status(400).json({ 'message': 'Missing required fields!' });

        console.log("Starting removal of block 0")

        try {

            if(foundUser.blockedUsers?.some(e=>e._userId.toString() === ((blockedUserId)))){
                
                foundUser.blockedUsers.pull({ _userId:blockedUserId })

                let foundBlock = await foundUser.save();
                
                if(foundBlock){
                    return res.status(201).json({ message: 'Success' })
                } else {
                    return res.status(400).json({ message: 'Failed' })
                }
            
            } else {
                return res.status(401).json({ message: 'User was not previously blocked' })
            }

        } catch (err) {

            return res.status(401).json({ message: 'Failed' })
        }
    })
}   

module.exports = { getUserBlocks, addUserBlock, removeUserBlock, checkUserBlocks }

