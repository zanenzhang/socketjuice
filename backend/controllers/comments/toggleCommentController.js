const Comment = require('../../model/Comment');
const User = require('../../model/User');
const ToggleComment = require('../../model/ToggleComment');
const ObjectId  = require('mongodb').ObjectId;

const getToggleComment = async (req, res) => {
    
    const { userId } = req.params

    if (!userId) {
        return res.status(400).json({ message: 'User ID Required' })
    }

    const toggledComments = await ToggleComment.find({ _userId: userId })

    res.json(toggledComments)
}   


const addToggleCommentLike = async (req, res) => {

    const { userId, likedCommentId, isReply, originalId } = req.body

    if (!userId || !likedCommentId ) return res.status(400).json({ 'message': 'Missing required fields!' });


    try {

        let foundComment = await ToggleComment.findOne({"_userId":userId})

        let userComment = await Comment.findOne({"_id": likedCommentId})

        if(!foundComment || !userComment){
            return res.status(500).json({ 'Message': "Not found" });
        }
        
        var updatedComment = null
        var updatedUserComment = null
        var savedFoundComment = null

        if (foundComment){

            const foundLiked = foundComment?.userLikedComments.some(e => e._commentId.toString() === ((likedCommentId)))

            if(foundLiked){

                return res.status(401).json({ 'message': 'User already liked comment!' })
            
            } else {

                const commentLikedPushDone = await foundComment.userLikedComments.push({_commentId: likedCommentId})

                if(commentLikedPushDone){
                    savedFoundComment = await foundComment.save()
                }

            }   
        }
        
        if (userComment){

            const found = userComment?.likedBy.some(e => e._userId.toString() === userId)

            if(found){

                return res.status(401).json({ 'message': 'User already liked comment!' })
            
            } else {

                userComment.likedBy.push({_userId: userId})

                const userLikedPushDone = await userComment.save()

                if(userLikedPushDone){
                    updatedUserComment = true;
                }

                if(isReply == 1){

                    const foundOriginal = await Comment.findOne({_id: originalId},{"commentReplies._commentId": likedCommentId})

                    if(foundOriginal){

                        foundOriginal?.commentReplies?.likedCommentId?.likedBy.push({_userId: userId})
                        updatedComment = await foundOriginal.save();
                    }
                
                } else {
                    updatedComment = true;
                }

            }   
        }

        if(updatedComment && updatedUserComment && savedFoundComment){
            return res.status(201).json({ message: 'Success' })
        }        

    } catch (err) {

        return res.status(400).json({ message: 'Failed' })
    }
}


const addToggleCommentValue = async (req, res) => {

    const { userId, valuedCommentId, isReply, originalId, commentUserId } = req.body

    // Confirm data
    if (!userId || !valuedCommentId || !commentUserId ) return res.status(400).json({ 'message': 'Missing required fields!' });

    try {

        let foundToggle = await ToggleComment.findOne({"_userId":userId})
        let foundUser = await User.findOne({_id: commentUserId})
        let foundComment = await Comment.findOne({"_id": valuedCommentId})


        if(!foundToggle || !foundUser || !foundComment){
            return res.status(500).json({ 'Message': "Not found" });
        }
        
        var updatedToggle = null;
        var updatedComment = null;
        var doneUpdate = null;

        if (foundToggle && foundUser){

            const foundValued = foundToggle?.userValuedComments?.some(e => e._commentId.toString() === ((valuedCommentId)))

            if(foundValued){

                return res.status(401).json({ 'message': 'User already valued comment!' })
            
            } else {

                foundToggle?.userValuedComments?.push({_commentId: valuedCommentId})
                foundUser.totalGems = foundUser.totalGems + 1

                const savedToggle = await foundToggle.save()
                const savedUser = await foundUser.save()

                if(savedToggle && savedUser){
                    updatedToggle = true;
                }
            }   
        }
        
        if (foundComment){

            const found = foundComment?.valuedBy.some(e => e._userId.toString() === userId)

            if(found){

                return res.status(401).json({ 'message': 'User already valued comment!' })
            
            } else {

                foundComment.valuedBy.push({_userId: userId})
                foundComment.valuesCount = foundComment.valuesCount + 1

                if(isReply == 1){

                    const foundOriginal = await Comment.updateOne({_id: originalId, "commentReplies._commentId": valuedCommentId},{$push: {"commentReplies.$.valuedBy": {_userId: userId}}})

                    if(foundOriginal ){
                        
                        const updatedCount = await Comment.updateOne({_id: originalId, "commentReplies._commentId": valuedCommentId},{$inc: {"commentReplies.$.valuesCount": 1}})
                        
                        if(updatedCount){
                            updatedComment = true;
                        }

                    } else {
                        updatedComment = false;
                    }
                
                } else {

                    updatedComment = true;
                }
            }  
            
            const savedComment = await foundComment.save();
            if(savedComment){
                doneUpdate = true;
            }
        }

        if(updatedComment && updatedToggle && doneUpdate){

            return res.status(201).json({ message: 'Success' })
        }        

    } catch (err) {

        return res.status(400).json({ message: 'Failed' })
    }
}


const removeToggleCommentLike = async (req, res) => {

    const { userId, likedCommentId, isReply, originalId } = req.query;

    var updatedReply = null;

    // Confirm data
    if (!userId || !likedCommentId ) return res.status(400).json({ 'message': 'Missing required fields!' });

    try {

        let foundComment = await ToggleComment.findOneAndUpdate({ _userId: userId }, { $pull: { userLikedComments: { _commentId:likedCommentId }}}, { new:true, multi:true })

        let userComment = await Comment.findOneAndUpdate({ _id: likedCommentId}, { $pull: { likedBy: { _userId:userId } }}, { new:true, multi:true })

        if(isReply == 1){

            let foundReply = await Comment.findOneAndUpdate({_id: originalId}, { $pull: { "commentReplies.$[].likedBy": userId }}, { new:true })
        
            if(foundReply){
                updatedReply = true;
            } else {
                updatedReply = false;
            }

        } else {
            updatedReply = true
        }


        if(!foundComment || !userComment){
            return res.status(400).json({ 'Message': err.message });
        }

        if(foundComment && userComment && updatedReply){
            return res.status(201).json({ message: 'Success' })
        }    

    } catch (err) {

        return res.status(400).json({ message: 'Failed' })
    }
}


const removeToggleCommentValue = async (req, res) => {

    const { userId, valuedCommentId, isReply, originalId, commentUserId } = req.query;

    var updatedReply = null;
    var updatedComment = null;

    // Confirm data
    if (!userId || !valuedCommentId ||!commentUserId ) return res.status(400).json({ 'message': 'Missing required fields!' });

    try {

        let updatedToggle = await ToggleComment.updateOne({ _userId: userId }, { $pull: { userValuedComments: { _commentId: valuedCommentId }}})
        let foundUser = await User.findOne({_id: commentUserId})
        let foundComment = await Comment.findOne({ _id: valuedCommentId})

        if(foundUser && foundComment){

            foundComment.valuedBy?.pull({ _userId: userId })
            foundComment.valuesCount = Math.max(foundComment.valuesCount - 1)

            foundUser.totalGems = Math.max(foundUser.totalGems - 1, 0)

            if(isReply == 1){

                let foundReply = await Comment.updateOne({_id: originalId, "commentReplies._commentId": valuedCommentId}, { $pull: { "commentReplies.$.valuedBy": {_userId: userId }}} )
            
                if(foundReply){

                    const updatedCount = await Comment.updateOne({_id: originalId, "commentReplies._commentId": valuedCommentId},{$inc: {"commentReplies.$.valuesCount": -1}})

                    if(updatedCount){
                        updatedReply = true;
                    }

                } else {
                    
                    updatedReply = false;
                }
                
            } else {

                updatedReply = true;
            }

            const savedUser = await foundUser.save();
            const savedComment = await foundComment.save();

            if(savedUser && savedComment){
                updatedComment = true
            }
        }

        if(updatedComment && updatedReply && updatedToggle){
            
            return res.status(201).json({ message: 'Success' })
        }        

    } catch (err) {

        return res.status(401).json({ message: 'Failed' })
    }
}

module.exports = { getToggleComment, addToggleCommentLike, addToggleCommentValue, removeToggleCommentLike, removeToggleCommentValue }