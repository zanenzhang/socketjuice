const Post = require('../../model/Post');
const User = require('../../model/User');
const UserProfile = require('../../model/UserProfile');
const StoreProfile = require('../../model/StoreProfile');
const Product = require('../../model/Product');
const ProductFollowers = require('../../model/Productfollowers');
const Comment = require('../../model/Comment');
const Sharedpost = require('../../model/Sharedpost');
const Flags = require('../../model/Flags');
const OwnedProducts = require('../../model/OwnedProducts');
const UsageLimit = require('../../model/UsageLimit');
const BannedUser = require("../../model/BannedUser");
const BannedProduct = require("../../model/BannedProduct");
const ObjectId  = require('mongodb').ObjectId;

const languageList = require('../languageCheck');
const jwt = require('jsonwebtoken');
const S3 = require("aws-sdk/clients/s3");
const fns = require('date-fns');

const wasabiPrivateBucketUSA = process.env.WASABI_PRIVATE_BUCKET_NAME_USA;
const wasabiPublicBucketUSA = process.env.WASABI_PUBLIC_BUCKET_NAME_USA;

const wasabiEndpoint = process.env.WASABI_US_EAST_ENDPOINT;
const wasabiRegion = process.env.WASABI_US_EAST_REGION;
const wasabiAccessKeyId = process.env.WASABI_ACCESS_KEY;
const wasabiSecretAccessKey = process.env.WASABI_SECRET_KEY;

const s3 = new S3({
    endpoint: wasabiEndpoint,
    region: wasabiRegion,
    accessKeyId: wasabiAccessKeyId,
    secretAccessKey: wasabiSecretAccessKey,
  })


const getSharedposts = async (req, res) => {
    
    var { userId, pageNumber } = req.query

    if (!userId || !pageNumber ) {
        return res.status(400).json({ message: 'Missing required information' })
    }

    if(Number(pageNumber) === NaN || Number(pageNumber) < 0 || Number(pageNumber) > 1000){
        return res.status(400).json({ message: 'Content does not meet requirements' })
    }
    pageNumber = Number(pageNumber)

    const userSharedposts = await Sharedpost.findOne({ _userId: userId })
    const flaggedList = await Flags.findOne({_userId: userId}).select("userFlags postFlags")

    let userData = null;
    let foundPosts = null;

    let donePosts = false;
    let doneFlags = false;
    let flaggedPosts = [];
    let stop = 0;

    if(flaggedList){

        if(flaggedList.postFlags){
            flaggedPosts = flaggedList.postFlags
        } else {
            flaggedPosts = []
        }

        doneFlags = true;
    }

    if(userSharedposts?.sharedposts?.length > 0){

        foundPosts = await Post.find({$and:[{_id: {$in: userSharedposts.sharedposts.map(e=>e._postId)}} ]}).sort({createdAt: -1}).skip(pageNumber).limit(12)
    
        if(foundPosts){

            if(foundPosts?.length > 0){

                userData = await User.find({_id: {$in: foundPosts.map(e=>e._userId)}}).select("_id profilePicURL roles blockedUsers privacySetting")

                var x = 0;

                while(x < foundPosts.length){

                    var item = foundPosts[x]

                    if(item.mediaCarouselURLs?.length === 0 && item.mediaCarouselObjectIds?.length > 0){

                        var finalMediaURLs = []
        
                        for(let i=0; i<item.mediaCarouselObjectIds?.length; i++){
                        
                            var signParams = {
                                Bucket: wasabiPrivateBucketUSA, 
                                Key: item.mediaCarouselObjectIds[i],
                                Expires: 7200
                              };
                
                            var url = s3.getSignedUrl('getObject', signParams);
                
                            finalMediaURLs.push(url)
                        }
        
                        var finalVideoURLs = []
        
                        for(let i=0; i<item.videoCarouselObjectIds?.length; i++){
                        
                            var signParams = {
                                Bucket: wasabiPrivateBucketUSA, 
                                Key: item.videoCarouselObjectIds[i],
                                Expires: 7200
                              };
                
                            var url = s3.getSignedUrl('getObject', signParams);
                
                            finalVideoURLs.push(url)
                        }
        
                        item.mediaCarouselURLs = finalMediaURLs
                        item.videoCarouselURLs = finalVideoURLs
                        item.previewMediaURL = finalMediaURLs[item.coverIndex]
                        item.markModified('mediaCarouselURLs')
                        item.markModified('videoCarouselURLs')
                        item.markModified('previewMediaURL')
        
                    } else if(item.mediaCarouselObjectIds?.length > 0) {
        
                        for(let i=0; i<item.mediaCarouselURLs?.length; i++){
                            
                            var signedUrl = item.mediaCarouselURLs[i];
        
                            const params = new URLSearchParams(signedUrl)
                            const expiry = Number(params.get("Expires")) * 1000
                            // const creationDate = fns.parseISO(params['X-Amz-Date']);
                            // const expiresInSecs = Number(params['X-Amz-Expires']);
                            
                            // const expiryDate = fns.addSeconds(creationDate, expiresInSecs);
                            // const expiry = Number(params['Expires']);
                            const expiryTime = new Date(expiry)
                            const isExpired = expiryTime < new Date();
                
                            if (isExpired){
                
                                var signParams = {
                                    Bucket: wasabiPrivateBucketUSA, 
                                    Key: item.mediaCarouselObjectIds[i],
                                    Expires: 7200
                                  };
                    
                                var url = s3.getSignedUrl('getObject', signParams);
                    
                                item.mediaCarouselURLs[i] = url
                            }
        
                            if(item.coverIndex === i){
                                item.previewMediaURL = item.mediaCarouselURLs[i]
                            }
                        }
        
                        for(let i=0; i<item.videoCarouselURLs?.length; i++){
                            
                            var signedUrl = item.videoCarouselURLs[i];
        
                            const params = new URLSearchParams(signedUrl)
                            const expiry = Number(params.get("Expires")) * 1000
                            // const creationDate = fns.parseISO(params['X-Amz-Date']);
                            // const expiresInSecs = Number(params['X-Amz-Expires']);
                            
                            // const expiryDate = fns.addSeconds(creationDate, expiresInSecs);
                            // const expiry = Number(params['Expires']);
                            const expiryTime = new Date(expiry)
                            const isExpired = expiryTime < new Date();
                
                            if (isExpired){
                
                                var signParams = {
                                    Bucket: wasabiPrivateBucketUSA, 
                                    Key: item.videoCarouselObjectIds[i],
                                    Expires: 7200
                                  };
                    
                                var url = s3.getSignedUrl('getObject', signParams);
                    
                                item.videoCarouselURLs[i] = url
                            }
                        }
        
                        item.markModified('mediaCarouselURLs')
                        item.markModified('videoCarouselURLs')
                        item.markModified('previewMediaURL')
                    
                    } else if(!item.previewMediaURL && item.mediaCarouselObjectIds?.length === 0){
        
                        var signParams = {
                            Bucket: wasabiPrivateBucketUSA, 
                            Key: item.previewMediaObjectId, 
                            Expires: 7200
                        };
        
                        var url = s3.getSignedUrl('getObject', signParams);
        
                        item.previewMediaURL = url
                        item.markModified('previewMediaURL')
                    
                    } else if(item.mediaCarouselObjectIds?.length === 0) {
        
                        var signedUrl = item.previewMediaURL
        
                        const params = new URLSearchParams(signedUrl)
                        const expiry = Number(params.get("Expires")) * 1000
                        // const creationDate = fns.parseISO(params['X-Amz-Date']);
                        // const expiresInSecs = Number(params['X-Amz-Expires']);
                        
                        // const expiryDate = fns.addSeconds(creationDate, expiresInSecs);
                        // const expiry = Number(params['Expires']);
                        const expiryTime = new Date(expiry)
                        const isExpired = expiryTime < new Date();
        
                        if (isExpired){
        
                            var signParams = {
                                Bucket: wasabiPrivateBucketUSA, 
                                Key: item.previewMediaObjectId,
                                Expires: 7200
                            };
                
                            var url = s3.getSignedUrl('getObject', signParams);
                
                            item.previewMediaURL = url
                            item.markModified('previewMediaURL')
                        }
                    }    

                    item.update()
                    x += 1
                }

                if(userData && x === foundPosts?.length){
                    donePosts = true;
                }
            
            } else {
                stop = 1;
                donePosts = true;
            }

        } else {
        
            stop = 1
            return res.status(201).json({stop})
        }

        if(donePosts && doneFlags ){
            return res.status(201).json({userBookmarks, foundPosts, userData,
                flaggedPosts, stop})
        }
    
    } else {

        stop = 1
        return res.status(201).json({userBookmarks, foundPosts, userData,
            flaggedPosts, stop})
    }
}   


const addSharedpost = async (req, res) => {

    const cookies = req.cookies;

    if (!cookies?.purchiesjwt) return res.sendStatus(401);
    const refreshToken = cookies.purchiesjwt;

    User.findOne({ refreshToken }, async function(err, foundUser){

        if (err || !foundUser) return res.sendStatus(403); 
    
        jwt.verify(
            refreshToken,
            process.env.REFRESH_TOKEN_SECRET,
            (err, decoded) => {

                if (err || foundUser.username !== decoded.username  ) return res.sendStatus(403);
            }
        )

        const { userId, postId } = req.body

        if (!userId || !postId ) return res.status(400).json({ 'message': 'Missing required fields!' });

        try {

            const foundPost = await Post.findOne({_id: postId})
            const sharedpostList = await Sharedpost.findOne({_userId: userId})
            const foundLimits = await UsageLimit.findOne({_userId: userId})

            var todaysDate = new Date().toLocaleDateString()
            
            var doneShare = false;
            var doneOperation = false;

            if (foundPost && foundLimits){

                if(foundLimits.numberOfShares?.length > 0){

                    if(foundLimits.numberOfShares?.some(e=>e.date === todaysDate)){

                        for(let i=0; i< foundLimits.numberOfShares.length; i++){

                            if(foundLimits.numberOfShares[i].date === todaysDate){
        
                                if(foundLimits.numberOfShares[i].sharesNumber >= 30){
                                    
                                    return res.status(401).json({ message: 'Reached bookmarks limit for today' })
                                
                                } else {
        
                                    foundLimits.numberOfShares[i].sharesNumber = foundLimits.numberOfShares[i].sharesNumber + 1
                                    const savedLimits = await foundLimits.save()
        
                                    if(savedLimits){
                                        doneOperation = true;
                                    }
                                    
                                    break;
                                }
                            }
                        }
                    
                    } else {

                        foundLimits.numberOfShares.push({date: todaysDate, sharesNumber: 1 })
                        const savedLimits = await foundLimits.save()
                        if(savedLimits){
                            doneOperation = true;
                        }
                    }

                } else {

                    foundLimits.numberOfShares.push({date: todaysDate, sharesNumber: 1 })
                    const savedLimits = await foundLimits.save()
                    if(savedLimits){
                        doneOperation = true;
                    }
                }

                foundPost.sharesCount = foundPost.sharesCount + 1
                foundPost.score = foundPost.score + 200

                if(sharedpostList){

                    if(sharedpostList?.sharedposts.some(e=>e._postId.toString() === ((foundPost._id)))){

                        for(let i=0; i<sharedpostList?.sharedposts.length; i++){
                            if(sharedpostList.sharedposts[i]._postId.toString() === ((foundPost._id))){
                                sharedpostList.sharedposts[i].sharedCount = sharedpostList.sharedposts[i].sharedCount + 1
                            }
                            break
                        }

                    } else {
                        sharedpostList.sharedposts.push({_postId: foundPost._id, sharedCount: 1})
                        const listPushDone = await sharedpostList.save()
                        if(listPushDone){
                            doneShare = true;
                        }
                    }
                } else {
                    //Create new sharedpostlist
                    const newsharedposts = await Sharedpost.create({
                        _userId: userId,
                        sharedposts:[{
                            _postId: foundPost._id,
                            sharedCount: 1
                        }]
                    })
                    if(newsharedposts){
                        doneShare = true;
                    }
                }

                if(doneShare && doneOperation){

                    if(Object.values(foundUser?.roles).includes(3780)){
                
                        const foundStore = await StoreProfile.findOne({"_userId":userId})
    
                        if(foundStore){
    
                            foundStore.storePosts.push({_postId: foundPost._id, primaryCategory: foundPost.primaryCategory, postClass: 2})
    
                            const updatedUser = await User.updateOne({_id: userId},{$set: {lastPosting: new Date()}})
                            const savedStore = await foundStore.save()
                            const savedPost = await foundPost.save()
    
                            if(savedStore && updatedUser && savedPost){
    
                                return res.status(201).json({ message: 'Success' })
                            }
                        }
    
                    } else {
    
                        const foundUserProfile = await UserProfile.findOne({"_userId":userId})
    
                        if(foundUserProfile){
    
                            foundUserProfile.userPosts.push({_postId: foundPost._id, primaryCategory: foundPost.primaryCategory, postClass: 2})
    
                            const updatedUser = await User.updateOne({_id: userId},{$set: {lastPosting: new Date()}})
                            const savedUser = await foundUserProfile.save()
                            const savedPost = await foundPost.save()
    
                            if(savedUser && updatedUser && savedPost){
    
                                return res.status(201).json({ message: 'Success' })
                            }
                        }
                    }
                
                } else {

                    return res.status(401).json({ message: 'Operation failed' })
                }   
            
            } else {

                return res.status(401).json({ message: 'Operation failed' })
            }
            
        } catch (err) {

            return res.status(400).json({ message: 'Failed' })
        }
    })
}


const removeSharedpost = async (req, res) => {

    const cookies = req.cookies;

    if (!cookies?.purchiesjwt) return res.sendStatus(401);
    const refreshToken = cookies.purchiesjwt;
    
    User.findOne({ refreshToken }, async function(err, foundUser){

        if (err || !foundUser) return res.sendStatus(403); 
    
        jwt.verify(
            refreshToken,
            process.env.REFRESH_TOKEN_SECRET,
            (err, decoded) => {
                if (err || foundUser.username !== decoded.username || !foundUser._id.toString() === ((decoded.userId)) ) return res.sendStatus(403);
            }
        )

        const { userId, postId } = req.query

        if (!userId || !postId ) return res.status(400).json({ 'message': 'Missing required fields!' });

        try {

            const foundPost = await Post.findOne({_id: postId})
            const updatedShare = await Sharedpost.findOneAndUpdate({ _userId: userId }, { $pull: { sharedposts: { _postId: postId }}})

            var donePost = false;
            var doneDelete = false;

            if(foundPost && updatedShare){

                if(!Object.values(foundUser?.roles).includes(3780)){
                    
                    const deletedUserPosts = await UserProfile.updateOne({_userId: userId},{$pull: {userPosts: {_postId: postId}}})

                    if(deletedUserPosts){
                        doneDelete = true;
                    }
                
                } else {

                    const deletedStorePosts = await StoreProfile.updateOne({_userId: userId},{$pull: {storePosts: {_postId: postId}}})

                    if(deletedStorePosts){
                        doneDelete = true;
                    }
                }

                if(foundPost.sharesCount > 0){
                    foundPost.sharesCount = foundPost.sharesCount - 1
                    foundPost.score = foundPost.score - 200
                }

                const savedPost = await foundPost.save()

                if(savedPost){
                    donePost = true;
                }
            
            } else {

                return res.status(401).json({ message: 'Failed' })
            }
                
            if(updatedShare && donePost && doneDelete){

                return res.status(201).json({ message: 'Success' })                               
            
            } else {

                return res.status(400).json({ message:'Operation Failed' });
            }

        } catch (err) {

            return res.status(401).json({ message: 'Failed' })
        }
    })
}



module.exports = { getSharedposts, addSharedpost, removeSharedpost }