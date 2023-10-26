const Post = require('../../model/Post');
const User = require('../../model/User');
const TogglePost = require('../../model/TogglePost');
const ObjectId  = require('mongodb').ObjectId;

const getTogglePost = async (req, res) => {
    
    const { userId } = req.params

    if (!userId) {
        return res.status(400).json({ message: 'User ID Required' })
    }

    const toggledPosts = await TogglePost.find({ _userId: userId })

    res.json(toggledPosts)
}   

const addTogglePostLike = async (req, res) => {

    const { userId, likedPostId } = req.body

    // Confirm data
    if (!userId || !likedPostId ) return res.status(400).json({ 'message': 'Missing required fields!' });

    try {

        let foundPost = await TogglePost.findOne({"_userId":userId})

        let userPost = await Post.findOne({"_id": likedPostId})

        if(!foundPost || !userPost){
            return res.status(500).json({ 'Message': err.message });
        }
        
        if (foundPost){

            const found = foundPost.userLikedPosts.some(e => e._postId.toString() === ((likedPostId)))

            if(!found){

                foundPost.userLikedPosts.push({_postId:likedPostId})

                const postLikedPushDone = await foundPost.save()
                
                if(postLikedPushDone){
                    foundPost.save()
                }
            
            } else {

                return res.status(400).json({ 'message': 'User already liked post!' })
            }   
        }
        
        if (userPost){

            const found = userPost.likedBy.some(e => e._userId.toString() === userId)

            if(!found){

                const userLikedPushDone = await userPost.likedBy.push({_userId:userId})

                if(userLikedPushDone){
                    userPost.save()
                }
            
            } else {

                return res.status(400).json({ 'message': 'User already liked post!' })
            }   
        }

        return res.status(201).json({ message: 'Success' })

    } catch (err) {

        return res.status(400).json({ message: 'Failed' })
    }
}

const addTogglePostValue = async (req, res) => {

    const { userId, valuedPostId, postUserId } = req.body

    if (!userId || !valuedPostId || !postUserId ) return res.status(400).json({ 'message': 'Missing required fields!' });

    try {

        let foundUser = await User.updateOne({_id: postUserId},{$inc: {totalGems: 1}})
        let foundToggle = await TogglePost.updateOne({_userId:userId},{$push:{userValuedPosts:{_postId: valuedPostId}}})
        let userPost = await Post.updateOne({_id: valuedPostId},{$push:{valuedBy:{_userId: userId}}, $inc:{valuesCount: 1}})
        
        if (foundToggle && foundUser && userPost){
            
            return res.status(201).json({ message: 'Success' })
        
        } else {

            return res.status(400).json({ message: 'Failed' })
        }

    } catch (err) {

        return res.status(400).json({ message: 'Failed' })
    }
}

const removeTogglePostLike = async (req, res) => {

    const { userId, likedPostId } = req.query

    if (!userId || !likedPostId ) return res.status(400).json({ 'message': 'Missing required fields!' });

    try {

        let foundPost = await TogglePost.findOneAndUpdate({ _userId: userId }, { $pull: { userLikedPosts: { _postId:likedPostId }}}, { new:true, multi:true })

        let userPost = await Post.findOneAndUpdate({ _id: likedPostId}, { $pull: { likedBy: { _userId:userId } }}, { new:true, multi:true })

        if(!foundPost || !userPost){
            return res.status(400).json({ 'Message': err.message });
        }

        if(foundPost && userPost){
            return res.status(201).json({ message: 'Success' })
        }    

    } catch (err) {

        return res.status(400).json({ message: 'Failed' })
    }
}


const removeTogglePostValue = async (req, res) => {

    const { userId, valuedPostId, postUserId } = req.query

    if (!userId || !valuedPostId || !postUserId ) return res.status(400).json({ 'message': 'Missing required fields!' });

    try {

        let foundUser = await User.findOneAndUpdate({_id: postUserId},{$inc: {totalGems: -1}},{ new: true })
        let foundToggle = await TogglePost.updateOne({_userId:userId},{$pull:{userValuedPosts:{_postId: valuedPostId}}})
        let userPost = await Post.findOneAndUpdate({_id: valuedPostId},{$pull:{valuedBy:{_userId: userId}}, $inc:{valuesCount: -1}},{ new: true })
        
        if (foundToggle && foundUser && userPost){
         
            var savedPost = null;
            var savedUser = null;

            if(userPost.valuesCount < 0){

                console.log("updating post)")

                savedPost = await Post.updateOne({_id: valuedPostId}, {$set: {valuesCount: 0}})

            } else {
                savedPost = true
            }

            if(foundUser.totalGems < 0){

                savedUser = await User.updateOne({_id: postUserId}, {$set: {totalGems: 0}})
            
            } else {
                savedUser = true
            }
            
            if(savedUser && savedPost){
                return res.status(201).json({ message: 'Success' })
            }

        } else {

            return res.status(400).json({ message: 'Failed' })
        }

    } catch (err) {

        return res.status(400).json({ message: 'Failed' })
    }
}

module.exports = { getTogglePost, addTogglePostLike, addTogglePostValue, removeTogglePostLike, removeTogglePostValue }