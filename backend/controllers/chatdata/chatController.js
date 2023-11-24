const User = require('../../model/User');
const Chat = require('../../model/Chat');
const Message = require('../../model/Message');
const Comm = require('../../model/Communications');
const ObjectId  = require('mongodb').ObjectId;


const getUserChats = async (req, res) => {
    
    const { userId } = req.params

    if (!userId) {
        return res.status(400).json({ message: 'User ID Required' })
    }

    try{

        const foundComm = await Comm.find({ _userId: userId }).select("chats")

        if(foundComm){

            const chatIds = foundComm[0].chats;

            const userChats = await Chat.find({_id: {$in: chatIds.map(e=>e._chatId)} }).sort({lastUpdated: -1})
    
            if(userChats){

                let chatsHash = {}

                for (let i=0; i < userChats.length; i++){

                    for (let j=0; j < userChats[i].participants.length; j++){

                        let item = userChats[i].participants[j]

                        if( !(item._userId in chatsHash) ){
                            chatsHash[item._userId] = item
                        }
                    }
                }

                const userData = await User.find({_id:{$in: Object.keys(chatsHash)}}).
                    select("_id username roles profilePicURL firstName lastName")

                if(userData){
                
                    res.status(200).json({userChats, userData})
                }
        
            } else {
                res.status(200).json({})
            }
        }   

    } catch(err){

        res.status(400).json({message: "Operation failed"})
    }
}   


const getSingleChat = async (req, res) => {

    const { chatId } = req.params

    if (!chatId) {
        return res.status(400).json({ message: 'Chat ID Required' })
    }

    try{

        const foundChat = await Chat.findOne({ _id: chatId })

        if(foundChat?.participants){

            const userData = await User.find({_id:{$in: foundChat?.participants.map(e=>e._userId)}}).
                select("_id username roles profilePicURL")

            if(userData){       
                res.status(200).json({foundChat, userData})
            }
    
        } else {
            res.status(200).json({})
        }
          
    } catch(err){

        res.status(400).json({message: "Operation failed"})
    }
}


const addChat = async (req, res) => {

    const { participantsList } = req.body

    console.log("Adding new chat", participantsList)

    if (!participantsList ) return res.status(400).json({ 'message': 'Missing required fields!' });

    try {

        const newCount = Object.keys(participantsList).length

        if(newCount > 40){
            res.status(400).json({ 'message': 'Too many chat participants' })
        }

        Comm.findOne({_userId: participantsList[0]._userId}, async function(err, duplicate){

            if(err){
                console.log(err)
                return res.status(400).json({message: "Operation failed"})
            }

            for(let i= 0 ; i< Object.keys(duplicate.chats).length; i++){

                var item = duplicate.chats[i]
                var newList1 = JSON.stringify(item.participants.map(e=>e._userId))
                var newList2 = JSON.stringify(participantsList.map(e=>e._userId))

                if(item.participantsNumber == newCount && newList1 === newList2 ){
                    return res.status(401).json({message: "Chat already exists!"})
                }               
            }

            var newChat = new Chat({
                "participants": participantsList,
                "lastUpdated": Date.now(),
                "participantsNumber": participantsList.length
            })

            const savedNew = await newChat.save();

            if(savedNew){

                for(let i=0; i<newCount; i++){

                    var item = participantsList[i];

                    try{

                        Comm.findOne({_userId: item._userId}, async function(err, newComm){

                            if(err) {return res.status(400).json({message: "Operation failed"})}
        
                            if(newComm?.chats.length > 0){
            
                                newComm.chats.push({_chatId: savedNew._id, participants: participantsList, 
                                    participantsNumber: newCount})
            
                            } else {
            
                                newComm.chats = [{_chatId: savedNew._id, participants: participantsList, 
                                    participantsNumber: newCount}]
                            }

                            const savedComm = await newComm.save();

                            if(savedComm){
                                return res.status(201).json({ savedNew });
                            } else {
                                return res.status(401).json({"message": "Failed operation"});
                            }
                        })

                    } catch(err){

                        console.log(err)
                        res.status(500).json({ 'Message': err.message });        
                    }
                }

            } else {

                res.status(500).json({ 'Message': err.message });
            }
        })
        
    } catch (err) {

        console.log(err);
        return res.status(403).json({ message: 'Failed' })
    }
}


const addUserToChat = async (req, res) => {

    const { chatId, userId, username, participantsList } = req.body;

    if (!chatId || !userId ) 
        {return res.status(400).json({ 'message': 'Missing required fields!' });}

    try {

        const newCount = Object.keys(participantsList).length;

        Comm.findOne({_userId:userId}, async function(err, duplicate){

            if(err){
                return res.status(400).json({message: "Operation failed"})
            }

            for(let i= 0 ; i< Object.keys(duplicate.chats).length; i++){

                var item = duplicate.chats[i]
                var newList1 = JSON.stringify(item.participants.map(e=>e._userId))
                var newList2 = JSON.stringify(participantsList.map(e=>e._userId))

                if(item.participantsNumber == newCount && newList1 === newList2 ){
                    return res.status(401).json({message: "Chat already exists!"})
                }               
            }

            const foundChat = await Chat.findOne({_id: chatId})

            if(foundChat){

                const userData = await User.find({_id: {$in: foundChat.participants?.map(e=>e._userId)} }).select("blockedUsers")

                if(userData){

                    for(let i=0; i<userData.length; i++){
                        
                        if(userData[i].blockedUsers?.some(e => e._userId.toString() === userId)){
                            
                            return res.status(403).json({"message": "user is blocked by one or more participants"})
                        }
                    }
                }

                const updatedChat = await Chat.findOneAndUpdate({_id: chatId},{$push: {participants: { _userId: userId, username: username }}, $inc: {participantsNumber: 1}},{new: true})

                if(updatedChat){

                    const updatedComms = await Comm.updateMany({_userId: {$in: participantsList.map(e=>e._userId), $ne: userId}},{$pull: {chats: {_chatId: chatId}}})
                    
                    if(updatedComms){
                        const pushComms = await Comm.updateMany({_userId: {$in: participantsList.map(e=>e._userId)}},{$push:{chats: { _chatId: chatId, participants: updatedChat.participants, 
                            participantsNumber: newCount }}})

                        if(pushComms){
                            return res.status(200).json({ message: 'Success, added user!' })
                        }
                    }
                }

            } else {

                return res.status(400).json({ message: 'Failed' })        
            }
        })

    } catch (err) {

        return res.status(402).json({ message: 'Failed' })
    }
}


const removeUserFromChat = async (req, res) => {

    const { loggedUserId, loggedUsername, chatId } = req.query

    if (!loggedUserId || !loggedUsername || !chatId ) return res.status(400).json({ 'message': 'Missing required fields!' });

    try {

        const leftChat = await Chat.updateOne({_id: chatId},{$pull:{participants: {_userId: loggedUserId}}, $inc: {participantsNumber: -1}});         
        const foundComm = await Comm.updateOne( {_userId: loggedUserId},{$pull: {chats: {_chatId: chatId}}});
        var doneChatUpdate = false

        if(leftChat){

            const updatedChat = await Chat.findOne({_id: chatId}); 

            if(updatedChat){

                var newCount = updatedChat.participants?.length;

                for(let i=0; i<newCount; i++){

                    try{

                        var person = updatedChat.participants[i]
                        if(person._userId !== loggedUserId){

                            Comm.findOne({_userId: person._userId}, function(err, foundComm){

                                if(err) {return res.status(400).json({message: "Operation failed"})}
            
                                if(foundComm.chats?.length > 0){

                                    for(let j=0; j<foundComm.chats.length; j++){

                                        if(foundComm.chats[j]._chatId.toString() === ((chatId))){

                                            foundComm.chats[j].participants.pull({_userId: loggedUserId})
                                            foundComm.chats[j].participantsNumber = foundComm.chats[j].participantsNumber - 1;
                                            
                                            foundComm.save();

                                            break;
                                        }
                                    }
                                } 
                            })
                        }

                    } catch(err){

                        console.log(err)
                        res.status(500).json({ 'Message': err.message });        
                    }
                }

                if(updatedChat.participantsNumber == 0 || updatedChat.participants?.length == 0){
                    const deletedChat = await Chat.deleteOne({"_id": chatId}); 
                    const deletedMessages = await Message.deleteMany({_chatId:chatId})

                    if(deletedChat && deletedMessages){
                        doneChatUpdate = true
                    } else {
                        return res.status(403).json({ message: 'Failed to delete chat' })
                    }

                } else {
                    doneChatUpdate = true
                }
            }

            if(foundComm){

                const updatedComm = await Comm.updateOne({"_userId": loggedUserId},{$inc:{participantsNumber: - 1}}); 
            
                if(doneChatUpdate && updatedComm){
                    res.status(201).json({ 'Message': "Success, left chat" });
                }
            }
        
        } else {
            res.status(401).json({ 'Message': "Failed operation" });
        }

    } catch (err) {

        console.log(err)
        return res.status(400).json({ message: err})
    }
}

const deleteChat = async (req, res) => {

    const { chatId, userId } = req.query


    if (!chatId || !userId ) return res.status(400).json({ 'message': 'Missing required fields!' });

    try {
        const deletedChat = await Chat.deleteOne({_id: chatId}); 
        const foundComm = await Comm.updateOne({_userId: userId},{$pull: {_chatId: chatId}})
        const deletedMessages = await Message.deleteMany({_chatId:chatId})

        if(deletedChat && foundComm && deletedMessages){

            return res.status(201).json({ 'Message': "Success, deleted chat" });
        }

    } catch (err) {

        return res.status(400).json({ message: 'Failed' })
    }
}

const muteChat = async (req, res) => {

    const { loggedUserId, loggedUsername, chatId } = req.body

    if (!loggedUserId || !loggedUsername || !chatId ) return res.status(400).json({ 'message': 'Missing required fields!' });

    try {

        const mutedChat = await Chat.updateOne({ _id: chatId, "participants._userId": loggedUserId},
            {$set:{"participants.$.isActive": true}}) 

        const mutedComm = await Comm.updateOne({ _userId: loggedUserId, "chats._chatId": chatId},
            {$set:{"chats.$.isActive": true}})

        if(mutedChat && mutedComm){

            res.status(201).json({ 'Message': "Success, muted chat" });
        }

    } catch (err) {

        return res.status(400).json({ message: 'Failed' })
    }
}

module.exports = { getUserChats, getSingleChat, addChat, removeUserFromChat, addUserToChat, muteChat, deleteChat }