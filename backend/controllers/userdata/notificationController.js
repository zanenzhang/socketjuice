const NotificationSettings = require('../../model/NotificationSettings');
const Notification = require('../../model/Notification');
const User = require('../../model/User');
const Chat = require('../../model/Chat');
const Appointment = require('../../model/Appointment');
const Message = require('../../model/Message');


const getNotifications = async (req, res) => {
    
    const { userId, pageNumber } = req.query

    if (!userId || !pageNumber) {
        return res.status(400).json({ message: 'Missing required fields' })
    }

    try {

        const checkUser = await User.findOne({_id: userId})

        if(checkUser){

            if(checkUser.deactivated === true){
                
                return res.status(403).json({"message": "Operation failed"})
            
            } else {

                let skipValue = pageNumber - 10;
                const settings = await NotificationSettings.findOne({_userId: userId })
                const notiData = await Notification.find({_receivingUserId: userId }).sort({createdAt: -1}).skip(skipValue).limit(10)
    
                if(notiData && settings){
    
                    const userData = await User.find({_id: {$in: notiData.map(e=>e._otherUserId)}}).select("_id username roles profilePicURL")
                    const relatedAppointments = await Appointment.find({_id: {$in: notiData?.map((item)=>item._relatedAppointment)}})
                    const relatedMessages = await Message.find({_id: {$in: notiData?.map((item)=>item._relatedMessage)}})
    
                    if(userData && relatedAppointments && relatedMessages){
    
                        var stop = 0
                        return res.status(200).json({notiData, userData, settings, relatedAppointments, relatedMessages, stop})
                    
                    } else {
    
                        var stop = 1
                        return res.status(400).json({message: "failed operation", stop})    
                    }
    
                } else {
    
                    var stop = 1
                    return res.status(100).json({stop})
                }
            }
        
        } else {

            var stop = 1
            res.status(400).json({"message": err.message, stop})
        } 
 
    } catch(err) {

        console.log(err)
        res.status(400).json({"message": err.message})
    }   
}


const addValueNoti = async (req, res) => {

    const { loggedUserId, otherUserId, postId, postCaption, postProductname } = req.body

    if (!loggedUserId || !otherUserId || !postId ) return res.status(400).json({ 'message': 'Missing required fields!' });

    try {
        
        const duplicate = await Notification.findOne({_userId: loggedUserId, _otherUserId: otherUserId, 
                notificationType: "value", _relatedPost: postId})
        
        if(duplicate){

            return res.status(201).json({message: "Already notified user!"})
        
        } else {

            const newNoti = new Notification({
                "_userId": loggedUserId,
                "_otherUserId": otherUserId, 
                "notificationType": "value", 
                "_relatedPost": postId,
                "postCaption": postCaption,
                "postProductname": postProductname
            })

            const settings = await NotificationSettings.updateOne({ _userId: loggedUserId },{$set: {newAlerts: true}})

            const saved = await newNoti.save()

            if(saved && settings){
                return res.status(201).json({ message: 'Success' })
            }
        }

    } catch (err) {

        return res.status(401).json({ message: 'Failed' })
    }
}


const addCommentNoti = async (req, res) => {

    const { loggedUserId, otherUserId, postId, postCaption, commentId, commentContent, postProductname } = req.body

    if (!loggedUserId || !otherUserId || !postId || !commentId ) return res.status(400).json({ 'message': 'Missing required fields!' });

    try {
        
        const duplicate = await Notification.findOne({_otherUserId: otherUserId, notificationType: "comment",
        _relatedPost: postId, postCaption: postCaption,
        _relatedComment: commentId, commentContent: commentContent})
        
        if(duplicate){

            return res.status(201).json({message: "Already notified user!"})
        
        } else {

            const newNoti = new Notification({ "_userId": loggedUserId,
                "_otherUserId": otherUserId, "notificationType": "comment",
                        "_relatedPost": postId, "postCaption": postCaption,
                        "_relatedComment": commentId, "commentContent": commentContent, 
                        "postProductname": postProductname
            })

            const settings = await NotificationSettings.updateOne({ _userId: loggedUserId },{$set: {newAlerts: true}})

            const saved = await newNoti.save()

            if(saved && settings){
                return res.status(201).json({ message: 'Success' })
            }
        }

    } catch (err) {

        return res.status(401).json({ message: 'Failed' })
    }
}


const addReplyNoti = async (req, res) => {

    const { loggedUserId, otherUserId, postId, postCaption,
        repliedToCommentId, commentContent, postProductname } = req.body

    if (!loggedUserId || !otherUserId || !postId || !repliedToCommentId ) return res.status(400).json({ 'message': 'Missing required fields!' });

    try {
        
        const duplicate = await Notification.findOne({_userId: loggedUserId, _otherUserId: otherUserId, notificationType: "reply",
        _relatedPost: postId, postCaption: postCaption, _relatedComment: repliedToCommentId,
        commentContent: commentContent})
        
        if(duplicate){

            return res.status(201).json({message: "Already notified user!"})
        
        } else {

            const newNoti = new Notification({"_userId": loggedUserId,
                _otherUserId: otherUserId, notificationType: "reply",
                _relatedPost: postId, postCaption: postCaption, _relatedComment: repliedToCommentId,
                commentContent: commentContent, postProductname: postProductname
            })

            const settings = await NotificationSettings.updateOne({ _userId: loggedUserId },{$set: {newAlerts: true}})

            const saved = await newNoti.save()

            if(saved && settings){
                return res.status(201).json({ message: 'Success' })
            }
        }

    } catch (err) {

        return res.status(400).json({ message: 'Failed' })
    }
}


const addCommentValueNoti = async (req, res) => {

    const { loggedUserId, otherUserId, postId, postCaption, commentId, commentContent, postProductname } = req.body

    if (!loggedUserId || !otherUserId || !postId || !commentId ) return res.status(400).json({ 'message': 'Missing required fields!' });

    try {
        
        const duplicate = await Notification.findOne({_userId: loggedUserId, _otherUserId: otherUserId, 
            notificationType: "replyvalue", _relatedPost: postId, postCaption: postCaption, _relatedComment: commentId,
            commentContent: commentContent})
        
        if(duplicate){

            return res.status(201).json({message: "Already notified user!"})
        
        } else {

            const newNoti = new Notification({ _userId: loggedUserId,
                _otherUserId: otherUserId, notificationType: "replyvalue",
                        _relatedPost: postId, postCaption: postCaption, _relatedComment: commentId,
                            commentContent: commentContent, postProductname: postProductname
            })

            const settings = await NotificationSettings.updateOne({ _userId: loggedUserId },{$set: {newAlerts: true}})

            const saved = await newNoti.save()

            if(saved && settings){
                return res.status(201).json({ message: 'Success' })
            }
        }

    } catch (err) {

        return res.status(400).json({ message: 'Failed' })
    }
}

const addShareNoti = async (req, res) => {

    const { loggedUserId, otherUserId, postId, postCaption, postProductname } = req.body

    if (!loggedUserId || !otherUserId || !postId ) return res.status(400).json({ 'message': 'Missing required fields!' });

try {
        
        const duplicate = await Notification.findOne({_userId: loggedUserId, _otherUserId: otherUserId, notificationType: "sharedpost",
        _relatedPost: postId, postCaption: postCaption })
        
        if(duplicate){

            return res.status(201).json({message: "Already notified user!"})
        
        } else {

            const newNoti = new Notification({ _userId: loggedUserId,
                _otherUserId: otherUserId, notificationType: "sharedpost",
                        _relatedPost: postId, postCaption: postCaption, 
                        postProductname: postProductname
            })

            const settings = await NotificationSettings.updateOne({ _userId: loggedUserId },{$set: {newAlerts: true}})

            const saved = await newNoti.save()

            if(saved && settings){
                return res.status(201).json({ message: 'Success' })
            }
        }

    } catch (err) {

        return res.status(400).json({ message: 'Failed' })
    }
}


const addFollowNoti = async (req, res) => {

    const { loggedUserId, otherUserId } = req.body

    if (!loggedUserId || !otherUserId  ) return res.status(400).json({ 'message': 'Missing required fields!' });

    try {
        
        const duplicate = await Notification.findOne({_userId: loggedUserId, _otherUserId: otherUserId, notificationType: "newfollow"})
        
        if(duplicate){

            return res.status(201).json({message: "Already notified user!"})
        
        } else {

            const newNoti = new Notification({ _userId: loggedUserId,
                _otherUserId: otherUserId, notificationType: "newfollow",
            })

            const settings = await NotificationSettings.updateOne({ _userId: loggedUserId },{$set: {newAlerts: true}})

            const saved = await newNoti.save()

            if(saved && settings){
                return res.status(201).json({ message: 'Success' })
            }
        }

    } catch (err) {

        return res.status(400).json({ message: 'Failed' })
    }
}


const addFollowRequestedNoti = async (req, res) => {

    const { loggedUserId, otherUserId  } = req.body

    if (!loggedUserId || !otherUserId  ) return res.status(400).json({ 'message': 'Missing required fields!' });

    try {
        
        const duplicate = await Notification.findOne({_userId: loggedUserId, _otherUserId: otherUserId, notificationType: "followrequested" })
        
        if(duplicate){

            return res.status(201).json({message: "Already notified user!"})
        
        } else {

            const newNoti = new Notification({
                _userId: loggedUserId, _otherUserId: otherUserId, notificationType: "followrequested"
            })

            const settings = await NotificationSettings.updateOne({ _userId: loggedUserId },{$set: {newRequests: true}})

            const saved = await newNoti.save()

            if(saved && settings){
                
                return res.status(201).json({ message: 'Success' })
            }
        }

    } catch (err) {

        return res.status(400).json({ message: 'Failed' })
    }
}


const addFollowApprovedNoti = async (req, res) => {

    const { loggedUserId, otherUserId  } = req.body

    if (!loggedUserId || !otherUserId  ) return res.status(400).json({ 'message': 'Missing required fields!' });

    try {
        
        const duplicate = await Notification.findOne({_userId: loggedUserId, _otherUserId: otherUserId, notificationType: "followapproved"})
        
        if(duplicate){

            return res.status(201).json({message: "Already notified user!"})
        
        } else {

            const newNoti = new Notification({ _userId: loggedUserId,
                _otherUserId: otherUserId, notificationType: "followapproved",
            })

            const settings = await NotificationSettings.updateOne({ _userId: loggedUserId },{$set: {newAlerts: true}})

            const saved = await newNoti.save()

            if(saved && settings){
                return res.status(201).json({ message: 'Success' })
            }
        }

    } catch (err) {

        return res.status(400).json({ message: 'Failed' })
    }
}

const addMessageNoti = async (req, res) => {

    const { sendingUserId, chatId } = req.body;

    if ( !sendingUserId || !chatId ) return res.status(400).json({ 'message': 'Missing required fields!' });

    try {

        const foundChat = await Chat.findOne({_id: chatId})

        if(foundChat){

            var receiverUserId = null
            for(let i=0; i<foundChat?.participants?.length; i++){
                if(foundChat?.participants[i]._userId !== sendingUserId){
                    receiverUserId = foundChat?.participants[i]._userId
                }
            }

            const settings = await NotificationSettings.updateMany({$and: [{_userId: {$in: foundChat?.participants?.map(e=>e._userId)}},{_userId: {$ne: sendingUserId}}]},{$set:{"newMessages": true}})
            //Send limit email and sms notification for user to check app for messages

            if(settings){
                
                return res.status(201).json({ message: 'Success' })
            
            } else {

                return res.status(400).json({ message: 'Failed' })
            }

        } else {

            return res.status(400).json({ message: 'Failed' })
        }
    
    } catch (err) {

        return res.status(400).json({ message: 'Failed' })
    }
}


const editReadRecent = async (req, res) => {

    const { notificationId, loggedUserId } = req.body

    if (!notificationId || !loggedUserId ) return res.status(400).json({ 'message': 'Missing required fields!' });

    const notiUser = await Notification.updateOne({_id: notificationId}, {$set: {readAlert: true }});

    if(notiUser){

        return res.status(201).json({ message: 'Success' })
    
    } else {    

        return res.status(400).json({ message: 'Failed' })
    }
}

const editOpenedAlert = async (req, res) => {

    const { userId } = req.body

    if (!userId ) return res.status(400).json({ 'message': 'Missing required fields!' });

    const notiSettings = await NotificationSettings.updateOne({_userId: userId}, {$set: {newAlerts: false }})    

    if(notiSettings){

        return res.status(201).json({ message: 'Success' })
    
    } else {

        return res.status(400).json({ message: 'Failed' })
    }
}

const editNewMessagesFill = async (req, res) => {

    const { userId } = req.body

    if (!userId ) return res.status(400).json({ 'message': 'Missing required fields!' });

    const notiSettings = await NotificationSettings.updateOne({_userId: userId}, {$set: {newMessages: false }})    

    if(notiSettings){

        return res.status(201).json({ message: 'Success' })
    
    } else {

        return res.status(401).json({ message: 'Failed' })
    }
}

const editNewRequestsFill = async (req, res) => {

    const { userId } = req.body

    if (!userId ) return res.status(400).json({ 'message': 'Missing required fields!' });

    const notiSettings = await NotificationSettings.updateOne({_userId: userId}, {$set: {newRequests: false }})    

    if(notiSettings){

        return res.status(201).json({ message: 'Success' })
    
    } else {

        return res.status(401).json({ message: 'Failed' })
    }
}


module.exports = { getNotifications, addMessageNoti, editReadRecent, 
        editOpenedAlert, editNewMessagesFill }


//Need deletecomment, deletereply, and deletemessage routes and process