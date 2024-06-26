const User = require('../../model/User');
const Chat = require('../../model/Chat');
const Message = require('../../model/Message');
const UsageLimit = require('../../model/UsageLimit');
const { sendMessageUpdate } = require("../../middleware/mailer")
const { sendChatMessageSMS } = require("../../controllers/authentication/twilioController")

const ObjectId  = require('mongodb').ObjectId;


const getChatMessages = async (req, res) => {
    
    var { chatId, pageNumber } = req.query

    if (!chatId || !pageNumber) {
        return res.status(400).json({ message: 'Missing required fields!' })
    }

    if(Number(pageNumber) === NaN || Number(pageNumber) < 0 || Number(pageNumber) > 1000){
        return res.status(400).json({ message: 'Content does not meet requirements' })
    }
    pageNumber = Number(pageNumber)

    var stop = 0;

    const messageList = await Chat.findOne({_id: chatId}).select("messages")
    
    if(messageList?.messages){

        const messageCount = messageList.messages.length
        let skipValue = 0;

        if( pageNumber >= messageCount){
            skipValue = 0;
            limitValue = Math.max(messageCount - (pageNumber - 10), 0)
            stop = 1;

        } else {
            skipValue = messageCount - pageNumber;
            limitValue = 10;
        }

        const messagesByChat = await Message.find({ _chatId: chatId }).skip( (skipValue) ).limit(limitValue)
    
        if(messagesByChat?.length > 0){

            const userData = await User.find({_id:{$in: messagesByChat.map(e => e._userId)}}).
                select("_id username roles profilePicURL firstName lastName")

            if(userData){
                
                return res.status(200).json({messagesByChat, userData, stop})
            }

        } else {

            return res.status(200).json({})
        }
    }
}   


const addMessage = async (req, res) => {

    const { loggedUserId, chatId, content} = req.body

    if (!loggedUserId || !chatId || !content ) return res.status(400).json({ 'message': 'Missing required fields!' });

    try {

        const foundUser = await User.findOne({_id: loggedUserId})
        const foundLimits = await UsageLimit.findOne({_userId: loggedUserId})

        var todaysDate = new Date().toLocaleDateString()
        var doneOperation = null;
        var doneEmail = null;
        var doneSMS = null;
        var toUpdate = null;

        if(foundLimits && foundUser){

            if(foundUser.deactivated === true){
                return res.status(403).json({"message": "Failed operation"})
            }

            if(foundLimits.numberOfMessages?.length > 0){

                if(foundLimits.numberOfMessages?.some(e=>e.date === todaysDate)){

                    for(let i=0; i< foundLimits.numberOfMessages.length; i++){
    
                        if(foundLimits.numberOfMessages[i].date === todaysDate){
    
                            if(foundLimits.numberOfMessages[i].messagesNumber >= 200){
                                
                                return res.status(401).json({ message: 'Reached message limit for today' })
                            
                            } else {
    
                                foundLimits.numberOfMessages[i].messagesNumber = foundLimits.numberOfMessages[i].messagesNumber + 1
                                const savedLimits = await foundLimits.save()
    
                                if(savedLimits){
                                    doneOperation = true;
                                    break;
                                }
                            }
                        }
                    }
    
                } else {
    
                    foundLimits.numberOfMessages.push({date: todaysDate, messagesNumber: 1 })
                    const savedLimits = await foundLimits.save()
                    if(savedLimits){
                        doneOperation = true;
                    }
                }

            } else {

                foundLimits.numberOfMessages = [{date: todaysDate, messagesNumber: 1 }]
                const savedLimits = await foundLimits.save()
                if(savedLimits){
                    doneOperation = true;
                }
            }

            if(foundLimits.numberOfMessageEmails?.length > 0){

                if(foundLimits.numberOfMessageEmails?.some(e=>e.date === todaysDate)){

                    for(let i=0; i< foundLimits.numberOfMessageEmails.length; i++){
    
                        if(foundLimits.numberOfMessageEmails[i].date === todaysDate){
    
                            if(foundLimits.numberOfMessageEmails[i].emailsNumber >= 1){
                                
                                doneEmail = true;
                                toUpdate = false;
                            
                            } else {
    
                                foundLimits.numberOfMessageEmails[i].emailsNumber = foundLimits.numberOfMessageEmails[i].emailsNumber + 1
                                const savedLimits = await foundLimits.save()
    
                                if(savedLimits){
                                    toUpdate = true;
                                    doneEmail = true;
                                    break;
                                }
                            }
                        }
                    }
    
                } else {
    
                    foundLimits.numberOfMessageEmails.push({date: todaysDate, emailsNumber: 1 })
                    const savedLimits = await foundLimits.save()
                    if(savedLimits){
                        toUpdate = true;
                        doneEmail = true;
                    }
                }

            } else {

                foundLimits.numberOfMessageEmails = [{date: todaysDate, emailsNumber: 1 }]
                const savedLimits = await foundLimits.save()
                if(savedLimits){
                    toUpdate = true;
                    doneEmail = true;
                }
            }

            if(foundLimits.numberOfMessageTexts?.length > 0){

                if(foundLimits.numberOfMessageTexts?.some(e=>e.date === todaysDate)){

                    for(let i=0; i< foundLimits.numberOfMessageTexts.length; i++){
    
                        if(foundLimits.numberOfMessageTexts[i].date === todaysDate){
    
                            if(foundLimits.numberOfMessageTexts[i].textsNumber >= 1){
                                
                                doneSMS = true;
                                toUpdate = false;
                            
                            } else {
    
                                foundLimits.numberOfMessageTexts[i].textsNumber = foundLimits.numberOfMessageTexts[i].textsNumber + 1
                                const savedLimits = await foundLimits.save()
    
                                if(savedLimits){
                                    doneSMS = true;
                                    toUpdate = true;
                                    break;
                                }
                            }
                        }
                    }
    
                } else {
    
                    foundLimits.numberOfMessageTexts.push({date: todaysDate, textsNumber: 1 })
                    const savedLimits = await foundLimits.save()
                    if(savedLimits){
                        doneSMS = true;
                        toUpdate = true;
                    }
                }

            } else {

                foundLimits.numberOfMessageTexts = [{date: todaysDate, textsNumber: 1 }]
                const savedLimits = await foundLimits.save()
                if(savedLimits){
                    doneSMS = true;
                    toUpdate = true;
                }
            }
        } 

        if(doneOperation && doneEmail && doneSMS){

            console.log("Doneemail", doneEmail)
            console.log("Donesms", doneSMS)
            console.log("toUpdate", toUpdate)

            let foundChat = await Chat.findOne({"_id":chatId})

            var addMessage = await Message.create({
                "_userId": loggedUserId,
                "firstName": foundUser.firstName,
                "_chatId": chatId,
                "content": content,
                "createdAt": Date.now()
            })         

            if(addMessage && foundChat){

                var recipient = ""

                foundChat.messages.push({_messageId: addMessage._id})

                foundChat.mostRecentMessage = {_userId: loggedUserId,
                    firstName: foundUser.firstName, content: content, 
                    lastUpdated: Date.now()}

                foundChat.lastUpdated = Date.now()

                for(let i=0; i<foundChat?.participants?.length; i++){
                    if(foundChat.participants[i]._userId.toString() !== loggedUserId.toString()){
                        recipient = foundChat.participants[i]._userId
                    }
                }

                const done = await foundChat.save()

                if(done){

                    if(toUpdate){
                
                        const recipientUser = await User.findOne({_id: recipient})
    
                        if(recipientUser){
    
                            const sentEmail = await sendMessageUpdate({toUser: recipientUser.email, firstName: recipientUser.firstName, fromUserFirstName: foundUser.firstName })
                            
                            const sentSms = await sendChatMessageSMS(recipientUser._id, foundUser.firstName)
    
                            if(sentEmail && sentSms){
                                return res.status(201).json({ 'Message': "Success" });
                            } else {
                                return res.status(401).json({ 'Message': "Failed operation" });
                            }
                        }
                    
                    } else {
    
                        return res.status(201).json({ 'Message': "Success" });
                    }
                }
            
            } else {

                return res.status(500).json({ 'Message': err.message });
            }
        }
        
    } catch (err) {

        console.log(err)
        return res.status(400).json({ message: err })
    }
}


const removeMessage = async (req, res) => {

    const { messageId, chatId, loggedUserId, loggedFirstName } = req.query

    // Confirm data
    if (!messageId || !chatId || !loggedUserId || !loggedFirstName ) return res.status(400).json({ 'message': 'Missing required fields!' });

    try {

        const setDeleted = await Message.updateOne({_id: messageId},{$set: {hidden: true, content: "Message deleted"}})
        const foundChat = await Chat.updateOne({_id: chatId},{$set: {mostRecentMessage: {_userId: loggedUserId,
            firstName: loggedFirstName, content: "Deleted a message", lastUpdated: Date.now()}, lastUpdated: Date.now()} })

        if(setDeleted && foundChat){

            return res.status(201).json({ 'Message': "Success" });
        
        } else {

            return res.status(401).json({ 'Message': err.message });
        }

    } catch (err) {

        return res.status(400).json({ message: 'Failed' })
    }

}


module.exports = { getChatMessages, addMessage, removeMessage }