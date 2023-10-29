const User = require('../../model/User');
const DriverProfile = require('../../model/DriverProfile');
const HostProfile = require('../../model/HostProfile');
const Bookmark = require('../../model/Bookmark');

const Flags = require('../../model/Flags');
const UsageLimit = require('../../model/UsageLimit');
const BannedUser = require("../../model/BannedUser");
const  {deleteFile} = require("../../controllers/media/s3Controller");

const ObjectId  = require('mongodb').ObjectId;
const languageList = require('../languageCheck');
const jwt = require('jsonwebtoken');
const S3 = require("aws-sdk/clients/s3");
const fns = require('date-fns');
var _= require('lodash');
const copyFile = require('../media/s3Controller');

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


const getBookmarks = async (req, res) => {
    
    var { userId, pageNumber } = req.query

    if (!userId || !pageNumber ) {
        return res.status(400).json({ message: 'Missing required information' })
    }

    if(Number(pageNumber) === NaN || Number(pageNumber) < 0 || Number(pageNumber) > 1000){
        return res.status(400).json({ message: 'Content does not meet requirements' })
    }
    pageNumber = Number(pageNumber)

    const userBookmarks = await Bookmark.findOne({ _userId: userId })
    const flaggedList = await Flags.findOne({_userId: userId}).select("userFlags")

    let foundHostProfiles = null;

    let userData = false;
    let doneFlags = false;
    let flaggedUsers = [];
    let stop = 0;

    var doneSharedposts = false;

    if(flaggedList){

        if(flaggedList.userFlags){
            flaggedUsers = flaggedList.userFlags
        } else {
            flaggedUsers = []
        }

        doneFlags = true;
    }

    if(userBookmarks?.bookmarks?.length > 0){

        foundHostProfiles = await HostProfile.find({_id: {$in: userBookmarks?.bookmarks.map(e=>e._hostProfileId)}})

        if(foundHostProfiles?.length > 0){

            userData = await User.find({_id: {$in: foundHostProfiles.map(e=>e._userId)}}).select("_id profilePicURL roles blockedUsers privacySetting")

            foundPosts.forEach(function(item, index){

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

                        if(item.videoCarouselObjectIds[i] !== 'image'){

                            var signParams = {
                                Bucket: wasabiPrivateBucketUSA, 
                                Key: item.videoCarouselObjectIds[i],
                                Expires: 7200
                                };
                
                            var url = s3.getSignedUrl('getObject', signParams);
                
                            finalVideoURLs.push(url)
                        
                        } else {

                            finalVideoURLs.push('image')
                        }
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

                        if(item.videoCarouselURLs[i] !== 'image'){

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
            })

            doneData = true;

        } else {
        
            stop = 1
            return res.status(201).json({stop})
        }

        if(doneFlags && doneData && userData){

            return res.status(201).json({userBookmarks, foundHostProfiles, userData, flaggedUsers, stop})
        }
    
    } else {

        stop = 1
        donePosts = true;
        userData = []
        foundHostProfiles = []

        if(donePosts && doneFlags){
            
            return res.status(201).json({userBookmarks, foundHostProfiles, userData, flaggedUsers, stop})
        }
    }
}   


const addBookmark = async (req, res) => {

    const { userId, hostUserId } = req.body

    if (!userId || !hostUserId ) return res.status(400).json({ 'message': 'Missing required fields!' });

    try {

        const foundHostProfile = await HostProfile.findOne({_id: hostUserId})
        const bookmarkList = await Bookmark.findOne({_userId: userId})
        const foundLimits = await UsageLimit.findOne({_userId: userId})

        var todaysDate = new Date().toLocaleDateString()
        
        var doneProduct = false;
        var doneBookmark = false;
        var doneOperation = false;
        

        if (foundHostProfile && foundLimits){

            if(foundLimits.numberOfBookmarks?.length > 0){

                if(foundLimits.numberOfBookmarks?.some(e=>e.date === todaysDate)){

                    for(let i=0; i< foundLimits.numberOfBookmarks.length; i++){

                        if(foundLimits.numberOfBookmarks[i].date === todaysDate){
    
                            if(foundLimits.numberOfBookmarks[i].bookmarksNumber >= 30){
                                
                                return res.status(401).json({ message: 'Reached bookmarks limit for today' })
                            
                            } else {
    
                                foundLimits.numberOfBookmarks[i].bookmarksNumber = foundLimits.numberOfBookmarks[i].bookmarksNumber + 1
                                const savedLimits = await foundLimits.save()
    
                                if(savedLimits){
                                    doneOperation = true;
                                }
                                
                                break;
                            }
                        }
                    }
                
                } else {

                    foundLimits.numberOfBookmarks.push({date: todaysDate, bookmarksNumber: 1 })
                    const savedLimits = await foundLimits.save()
                    if(savedLimits){
                        doneOperation = true;
                    }
                }

            } else {

                foundLimits.numberOfBookmarks.push({date: todaysDate, bookmarksNumber: 1 })
                const savedLimits = await foundLimits.save()
                if(savedLimits){
                    doneOperation = true;
                }
            }

            foundHostProfile.bookmarksCount = foundHostProfile.bookmarksCount + 1

            if(foundHostProfile?.bookmarkedBy.some(e => e._userId.toString() === userId)){

                for(let i=0; i < foundHostProfile.bookmarkedBy.length;i++){

                    if(foundHostProfile.bookmarkedBy[i]._userId.toString() === userId){

                        foundHostProfile.bookmarkedBy[i].bookmarkedCount = foundHostProfile.bookmarkedBy[i].bookmarkedCount + 1
                        break
                    }
                }
            
            } else {

                foundHostProfile.bookmarkedBy.push({_userId:userId, bookmarkedCount: 1})
            }

            const savedProfile = await foundHostProfile.save()

            if(bookmarkList){

                bookmarkList?.bookmarks.push({_postId: foundPost._id})

                const listPushDone = await bookmarkList.save()
                if(listPushDone){
                    doneBookmark = true;
                }
            } else {
                doneBookmark = true;
            }

            if(doneBookmark && doneOperation && savedProfile){
                
                return res.status(201).json({ message: 'Success' })
            
            } else {

                return res.status(401).json({ message: 'Operation failed' })
            }   
          
        } else {

            return res.status(401).json({ message: 'Operation failed' })
        }
        
    } catch (err) {

        return res.status(400).json({ message: 'Failed' })
    }
}


const removeBookmark = async (req, res) => {

    const { userId, hostUserId } = req.query

    if (!userId || !hostUserId ) return res.status(400).json({ 'message': 'Missing required fields!' });

    try {

        var foundHostProfile = await HostProfile.findOne({_id: hostUserId})

        var donePost = false;

        if(foundHostProfile){
            
            const updatedBookmark = await Bookmark.updateOne({ _userId: hostUserId }, { $pull: { bookmarks: { _hostProfileId: hostUserId }}})

            if(updatedBookmark){

                if(foundHostProfile.bookmarksCount > 0){
                    foundHostProfile.bookmarksCount = foundHostProfile.bookmarksCount - 1
                }

                if(foundHostProfile.bookmarkedBy?.length > 0 && foundHostProfile.bookmarkedBy?.some(e=>e._userId.toString() === userId)){

                    for(let i=0; i<foundHostProfile.bookmarkedBy.length; i++){

                        if(foundHostProfile.bookmarkedBy[i]._userId.toString() === userId){
                            
                            if(foundHostProfile.bookmarkedBy[i].bookmarkedCount > 1){
                                
                                foundHostProfile.bookmarkedBy[i].bookmarkedCount = foundHostProfile.bookmarkedBy[i].bookmarkedCount - 1
                            
                            } else {

                                foundHostProfile.bookmarkedBy.pull({_userId: userId})
                            }
                            break
                        }
                    }
                }

                const savedPost = await foundHostProfile.save()

                if(savedPost){
                    donePost = true;    
                }
            }
        }
            
        if(donePost){

            return res.status(201).json({ message: 'Success' })                               
        
        } else {

            return res.status(400).json({ message:'Operation Failed' });
        }

    } catch (err) {

        return res.status(401).json({ message: 'Failed' })
    }
}



module.exports = { getBookmarks, addBookmark, removeBookmark }