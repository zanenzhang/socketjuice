const Post = require('../../model/Post');
const User = require('../../model/User');
const Flags = require('../../model/Flags');
const UsageLimit = require('../../model/UsageLimit');
const BannedUser = require('../../model/BannedUser');
const Comment = require('../../model/Comment');
const ObjectId  = require('mongodb').ObjectId;
const languageList = require('../languageCheck');

const getPostComments = async (req, res) => {
    
    const { postId, loggedUserId } = req.query

    if (!postId) {
        return res.status(400).json({ message: 'Post ID Required' })
    }

    const commentsByPost = await Comment.find({ _postId: postId })
    
    if(commentsByPost){

        const userData = await User.find({_id:{$in: commentsByPost.map(e => e._userId)}}).
            select("_id username roles profilePicURL")

        const flaggedComments = await Flags.find({_userId: loggedUserId}).select("commentFlags")

        if(userData && flaggedComments){
            return res.status(200).json({commentsByPost, userData, flaggedComments})
        }
    
    } else {

        return res.status(200).json({})
    }
}   


const addPostComment = async (req, res) => {

    const { loggedUserId, loggedUsername, postId, content, isReply, 
        repliedToCommentId, repliedToUsername, originalCommentId,
         } = req.body

    if (!loggedUserId || !postId || !content || content.length > 1000) return res.status(400).json({ 'message': 'Missing required fields or submitted data does not meet requirements!' });

    try {

        const foundUser = await User.findOne({_id: loggedUserId})
        const foundLimits = await UsageLimit.findOne({_userId: loggedUserId})

        var todaysDate = new Date().toLocaleDateString()
        var doneOperation = false;

        var checkContent = content.toLowerCase();

        if(foundLimits && foundUser){

            if(foundUser.deactivated === true){
                return res.status(403).json({"message": "Failed operation"})
            }

            for(let i=0; i < languageList.length; i++){

                if(checkContent.indexOf(languageList[i]) !== -1){

                    foundLimits.warningsCount = foundLimits.warningsCount + 3
                    
                    if(foundLimits.warningsCount >= 7){
                        
                        foundUser.deactivated = true;
                        
                        const addIPBan = await BannedUser.updateOne({admin: "admin"},{$push: {ipAddresses: {userIP: foundUser.primaryGeoData.IPv4}}})
                        const savedLimits = await foundLimits.save();
                        const savedUser = await foundUser.save();

                        if(savedUser && addIPBan && savedLimits){
                            return res.status(401).json({"message":"Inappropriate content"})          
                        }
                    
                    } else {

                        const savedLimits = await foundLimits.save()

                        if(savedLimits){

                            return res.status(401).json({"message":"Inappropriate content"})  
                        }
                    }
                }
            }

            if(foundLimits.numberOfComments?.length > 0){

                if(foundLimits.numberOfComments.some(e=>e.date === todaysDate)){

                    for(let i=0; i< foundLimits.numberOfComments.length; i++){

                        if(foundLimits.numberOfComments[i].date === todaysDate){
    
                            if(foundLimits.numberOfComments[i].commentsNumber >= 60){
                                
                                return res.status(401).json({ message: 'Reached comment limit for today' })
                            
                            } else {
    
                                foundLimits.numberOfComments[i].commentsNumber = foundLimits.numberOfComments[i].commentsNumber + 1
                                const savedLimits = await foundLimits.save()
    
                                if(savedLimits){
                                    doneOperation = true;
                                }
                                
                                break;
                            }
                        }
                    }
                
                } else {

                    foundLimits.numberOfComments.push({date: todaysDate, commentsNumber: 1 })
                    const savedLimits = await foundLimits.save()
                    if(savedLimits){
                        doneOperation = true;
                    }
                }

            } else {

                foundLimits.numberOfComments = [{date: todaysDate, commentsNumber: 1 }]
                const savedLimits = await foundLimits.save()
                if(savedLimits){
                    doneOperation = true;
                }
            }
        }

        if(doneOperation){ 

            let foundPost = await Post.findOne({_id:postId})

            var addComment = new Comment({
                "_userId": loggedUserId,
                "username": loggedUsername,
                "_postId": postId,
                "content": content,
                "isReply": isReply,
                "_repliedToComment": repliedToCommentId, 
                "_repliedToUsername": repliedToUsername,
                "_originalCommentId": originalCommentId
            })

            var savedComment = false;

            if(isReply == 1){

                const foundComment = await Comment.findOne({_id: originalCommentId})

                if(foundComment && addComment){
                    
                    foundComment.hasReply = true;

                    foundComment.commentReplies.push({ 
                        _commentId: addComment._id, _userId: loggedUserId, username: loggedUsername,
                        content: content, _repliedToComment: repliedToCommentId, isReply: isReply,
                        _repliedToUsername: repliedToUsername, _originalCommentId: originalCommentId })
                        
                    const savedReply = await foundComment.save()

                    if(savedReply){
                        savedComment = true;   
                    }
                }

            } else {

                savedComment = true;
            }

            const savedNew = await addComment.save()

            if (foundPost && savedNew && savedComment){
                
                foundPost.postComments.push({ _commentId:`${addComment._id}`});
                foundPost.commentsCount = foundPost.commentsCount + 1
                foundPost.score = foundPost.score + 20

                const savedPost = await foundPost.save()

                if(savedPost){
                    return res.status(201).json({ addComment });
                }
            
            } else {

                return res.status(500).json({ 'Message': err.message });
            }
        }
        
    } catch (err) {

        return res.status(400).json({ message: 'Failed' })
    }
}


const editPostComment = async (req, res) => {

    const { commentId, content, isReply, originalId } = req.body

    if (!commentId || !content ) return res.status(400).json({ 'message': 'Missing required fields!' });

    try {

        const soloComment = Comment.updateOne({_id: commentId},{$set: {content: content}});

        if(isReply == 1){

            const replyData = await Comment.updateMany({_id:originalId},{$set:{"commentReplies.$[element].content": content}},{arrayFilters: [{"element._commentId": commentId}]})
        
            if(soloComment && replyData){
                
                return res.status(200).json({ 'Message': "Edited comment!" });
            
            } else {
                return res.status(400).json({ message: 'error' })
            }

        } else {

            if(soloComment){
                return res.status(200).json({ 'Message': "Edited comment!" });
            
            } else {
                return res.status(400).json({ message: 'error' })
            }
        }

    } catch (err) {

        return res.status(400).json({ message: 'Failed' })
    }
}

const removePostComment = async (req, res) => {
    
    const { commentId, isReply, originalId, postId } = req.query

    if (!commentId || !isReply || !postId ) {
        return res.status(400).json({ message: 'Missing required information' })
    }

    const deletedComment = await Comment.deleteOne({ _id: commentId })
    const foundPost = await Post.findOne({_id: postId})
    const foundUserFlags = await Flags.updateMany({_userId: {$in: foundComment.flaggedBy.map(e=>e._userId)}},{$pull: {commentFlags: {_commentId: commentId}}})
    var updatedPost = false;

    if(foundPost){

        foundPost.postComments?.pull({_commentId: commentId})
        foundPost.commentsCount = Math.max(foundPost.commentsCount - 1, 0)
        const savedPost = await foundPost.save();
        if(savedPost){
            updatedPost = true;
        }
    }
    
    if(isReply == 1){

        const foundOriginal = await Comment.updateMany({_id: originalId},{$pull: {"commentReplies.$._commentId": commentId}})

        if(foundOriginal && deletedComment && updatedPost && foundUserFlags){
            
            return res.status(200).json({'Message': "Deleted comment"})        
        
        } else {

            return res.status(401).json({ message: 'Failed operation' })
        }

    } else {

        if(deletedComment && foundUserFlags){

            return res.status(200).json({'Message': "Deleted comment"})        
        
        } else {

            return res.status(401).json({ message: 'Failed operation' })
        }
    }
}   

const getCommentLikes = async (req, res) => {

    const { commentId } = req.params

    // Confirm data
    if (!commentId) {
        return res.status(400).json({ message: 'User ID Required' })
    }

    // Does the user still have assigned notes?
    const commentData = await Comment.findOne({ _id: commentId })

    res.json(commentData.likesCount)
}

const editCommentLikes = async (req, res) => {

    const { commentId, likesCount } = req.body

    // Confirm data 
    if ( !commentId ) {
            
        return res.status(400).json({ message: 'Missing required fields!' })
    }

    // Does the user exist to update?
    Comment.find({"_id": commentId }, function(err, foundComment){
        if(err){
            return res.status(400).json({ message: 'Post not found' })
        }

        foundComment.likesCount = likesCount;

        foundComment.save( function(err){
            if (err){
                return res.status(400).json({ message: 'Failed' })
            }
            res.json({ message: "Success!" })
        })
    })
}

const getCommentValues = async (req, res) => {

    const { commentId } = req.params

    // Confirm data
    if (!commentId) {
        return res.status(400).json({ message: 'User ID Required' })
    }

    // Does the user still have assigned notes?
    const commentData = await Comment.findOne({ _id: commentId })

    res.json(commentData.valuesCount)

}

const editCommentValues = async (req, res) => {

    const { commentId, valuesCount, isReply, originalId } = req.body

    if ( !commentId ) {
            
        return res.status(400).json({ message: 'Missing required fields!' })
    }

    try {
        if(isReply == '0'){

            const foundComment = await Comment.findOne({_id: commentId})

            if(foundComment){

                foundComment.valuesCount = valuesCount;

                foundComment.save( function(err){
                    if (err){
                        return res.status(400).json({ message: 'Failed' })
                    }
                    res.json({ message: "Success!" })
                })
            }            
        
        } else {

            var savedCurrent = null;

            const foundComment = await Comment.findOne({_id: commentId})

            const originalComment = await Comment.updateOne({_id: originalId, "commentReplies._commentId": commentId},{$set: {"commentReplies.$.valuesCount": valuesCount}})
            

            if(foundComment){

                foundComment.valuesCount = valuesCount;

                savedCurrent = await foundComment.save();

                if(savedCurrent && originalComment){

                    return res.status(200).json({ message: "Successful operation!"})
                }
            }
        }
    } catch(err){

        console.log(err)
        return res.status(400).json({message: "Failed to patch"})
    }
}

module.exports = { getPostComments, addPostComment, editPostComment, getCommentLikes, 
    editCommentLikes, getCommentValues, editCommentValues, removePostComment }