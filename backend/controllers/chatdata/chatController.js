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

    var { participantsList, loggedUserId, inviteUserId } = req.body

    console.log("Adding new chat", participantsList, loggedUserId, inviteUserId)

    if (!participantsList ) return res.status(400).json({ 'message': 'Missing required fields!' });

    try {

        const newCount = Object.keys(participantsList).length

        if(newCount !== 2 ){
            return res.status(400).json({ 'message': 'Incorrect number of participants' })
        }

        const checkChat = await Comm.findOne({_userId: loggedUserId, "chats.participants": {$elemMatch: { _userId: inviteUserId }}, participantsNumber: newCount})

        if(!checkChat){

            const duplicate = await Comm.findOne({_userId: inviteUserId, "chats.participants": {$elemMatch: { _userId: loggedUserId }}, participantsNumber: newCount})
        
            if(!duplicate){

                var savedNew = await Chat.create({
                    "participants": participantsList,
                    "lastUpdated": Date.now(),
                    "participantsNumber": participantsList.length
                })
    
                if(savedNew){
    
                    const savedComms = await Comm.updateMany({_userId: {$in: participantsList.map(e =>e._userId)}},
                                {$push: {chats: {_chatId: savedNew._id, participants: participantsList, participantsNumber: newCount}}})
                            
                    if(savedComms){
    
                        return res.status(200).json({savedNew})
                    
                    } else {
    
                        return res.status(401).json({ 'Message': "Failed operation" });
                    }
    
                } else {
    
                    return res.status(402).json({ 'Message': "Failed" });
                }
            } else {
                return res.status(402).json({ 'Message': "Failed" });
            }
        } else {
            return res.status(500).json({ 'Message': "Failed" });
        }
        
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

    const { loggedUserId, loggedFirstName, chatId } = req.query

    if (!loggedUserId || !loggedFirstName || !chatId ) return res.status(400).json({ 'message': 'Missing required fields!' });

    console.log(loggedUserId, loggedFirstName, chatId)

    try {

        const leftChat = await Chat.updateOne({_id: chatId},{$pull:{participants: {_userId: loggedUserId}}, $inc: {participantsNumber: -1}});         
        const updatedComm = await Comm.updateOne( {_userId: loggedUserId},{$pull: {chats: {_chatId: chatId}}});
        
        var doneChatUpdate = false
        var doneComm = false

        if(leftChat && updatedComm){

            const updatedChat = await Chat.findOne({_id: chatId}); 

            if(updatedChat){

                var newCount = updatedChat.participants?.length;

                for(let i=0; i<newCount; i++){

                    try{

                        var person = updatedChat.participants[i]

                        if(person._userId !== loggedUserId){

                            const foundComm = await Comm.findOne({_userId: person._userId})

                            if(foundComm){

                                if(foundComm.chats?.length > 0){

                                    for(let j=0; j<foundComm.chats.length; j++){

                                        if(foundComm.chats[j]._chatId.toString() === chatId.toString()){

                                            foundComm.chats[j].participants.pull({_userId: loggedUserId})
                                            foundComm.chats[j].participantsNumber = foundComm.chats[j].participantsNumber - 1;

                                            break;
                                        }
                                    }

                                    const savedComm = await foundComm.save();

                                    if(savedComm){
                                        doneComm = true
                                    }
                                } 
                            }
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

            if(doneComm && doneChatUpdate){
                return res.status(201).json({ 'Message': "Success, left chat" });
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

    const { loggedUserId, loggedFirstName, chatId } = req.body

    if (!loggedUserId || !loggedFirstName || !chatId ) return res.status(400).json({ 'message': 'Missing required fields!' });

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