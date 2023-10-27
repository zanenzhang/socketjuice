const User = require('../../model/User')
const DriverProfile = require('../../model/DriverProfile');
const HostProfile = require('../../model/HostProfile');
const RecentlyViewed = require('../../model/RecentlyViewed');
const Bookmark = require('../../model/Bookmark');

const UsageLimit = require('../../model/UsageLimit');
const Post = require('../../model/Post')
const Flags = require('../../model/Flags')
const BannedUser = require('../../model/BannedUser')

const { sendPassResetConfirmation } = require('../../middleware/mailer');
const bcrypt = require('bcrypt');
const ObjectId  = require('mongodb').ObjectId;

const jwt = require('jsonwebtoken');
const fns = require('date-fns')
const S3 = require("aws-sdk/clients/s3");
const { deleteFile } = require("../../controllers/media/s3Controller");
const fs = require("fs");
const languageList = require('../languageCheck');

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
  

const getUserProfile = async (req, res) => {
    
    const { profileUserId, loggedUserId, driverOrHost, ipAddress, language, currency } = req.query

    if (!profileUserId || !loggedUserId || !driverOrHost) {
        return res.status(400).json({ message: 'Missing required info' })
    }

    try {

        if(driverOrHost == 1){

            const userProfile = await DriverProfile.findOne({_userId: profileUserId})
            const userFound = await User.findOne({_id: profileUserId})
            const flaggedList = await Flags.findOne({_userId: loggedUserId}).select("userFlags")
            const bookmarksFound = await Bookmark.findOne({_userId: loggedUserId})

            let donePostsData = false;
            let doneFlags = false;

            let profilePicURL = null;
            let flaggedProfile = null;

            if(flaggedList){

                if(flaggedList.userFlags?.some(e=>e._userId.toString() === ((profileUserId)))){
                    flaggedProfile = 1
                } else {
                    flaggedProfile = 0
                }

                doneFlags = true;
            }

            if(userFound){

                if(userFound.deactivated === true){
                    return res.status(403).json({"message":"Operation failed"})
                }

                profilePicURL = userFound.profilePicURL;
            } 

            if(userProfile?.length > 0){

                userProfile?.forEach(async function(item, index){

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

                            if(item.mediaCarouselURLs[i] !== 'image'){

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

                    item.save()

                    donePostsData = true;
                })

            } else {
                donePostsData = true;
            }

            if(donePostsData && userProfile && profilePicURL && ownedProductsFound && bookmarksFound
                && donePeopleFollowers && doneStoreFollowers && donePeopleFollowing && doneSharedposts
                && doneStoreFollowing && doneLoggedBlocked && doneProfileBlocked && doneFlags ){

                return res.status(200).json({userPosts, userProfile, isFollowing, isRequested, notFollowing, 
                    privacySetting, totalGems, loggedBlocked, profileBlocked, profilePicURL, peopleFollowingCount, peopleFollowersCount,
                    storeFollowersCount, storeFollowingCount, ownedProductsFound, bookmarksFound, sharedpostsFound,
                    foundProducts, followingLogged, flaggedProfile, flaggedPosts })
            
            } else {


                return res.status(401).json({ message: 'Cannot get user information' })
            }
        
        } else {

            const userProfile = await DriverProfile.findOne({_userId: profileUserId})
            const userFound = await User.findOne({_id: profileUserId})
            const loggedFound = await User.findOne({_id: loggedUserId})
            const flaggedList = await Flags.findOne({_userId: loggedUserId}).select("userFlags")
            
            let flaggedUsers = null;
            let doneUserData = false;
            let doneFlags = false;
            let flaggedProfile = null;
            
            if(flaggedList){

                if(flaggedList.userFlags?.some(e=>e._userId.toString() === ((profileUserId)))){
                    flaggedProfile = 1
                } else {
                    flaggedProfile = 0
                }

                doneFlags = true;
            } 

            if(driverProfile.length > 0){

                driverProfile?.forEach(function(item, index){

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

                    if(foundProducts){
                        donePostsData = true;
                    }
                })

            } else {
                donePostsData = true;
            }

            if(donePostsData && userProfile && profilePicURL && ownedProductsFound && bookmarksFound
                 && donePeopleFollowers && doneStoreFollowers && donePeopleFollowing && doneSharedposts
                && doneStoreFollowing && doneLoggedBlocked && doneProfileBlocked && doneFlags ){

                return res.status(200).json({userPosts, userProfile, isFollowing, isRequested, notFollowing, 
                    privacySetting, totalGems, loggedBlocked, profileBlocked, profilePicURL, peopleFollowingCount, 
                    peopleFollowersCount, storeFollowersCount, storeFollowingCount, ownedProductsFound, bookmarksFound, 
                    sharedpostsFound, foundProducts, followingLogged, flaggedProfile, flaggedPosts})
            
            } else {

                return res.status(401).json({ message: 'Cannot get user information' })
            }

        }

        
    } catch(err){

        console.log(err)
        return res.status(401).json({ message: 'Cannot get user information' })
    }
    
}


const getUserIdByUsername = async (req, res) => {

    const { username } = req.params

    // Confirm data
    if (!username) {
        return res.status(400).json({ message: 'Missing required fields' })
    }

    const foundUser = await User.findOne({"username": username}).select("_id deactivated active")

    if(foundUser){
        return res.status(200).json(foundUser)
    } else {
        return res.status(400).json({"Message": "Failed operation"})
    }
    
}


const editSettingsUserProfile = async (req, res) => {
    
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
        
        const {loggedUserId, fullname, phonePrimary, relationshipStatus, 
            profilePicKey, profilePicURL, birthDate, region, regionCode, country} = req.body
    
        if (!loggedUserId || !birthDate || !foundUser._id.toString() === ((loggedUserId)) ) {
            return res.status(400).json({ 'message': 'Missing required fields!' });
        }

        if(fullname?.length > 48 || phonePrimary?.length > 48 || relationshipStatus?.length > 48
            || birthDate?.length > 48 || region?.length > 48 || regionCode?.length > 48 || country?.length > 48){
            return res.status(400).json({ 'message': 'Content does not meet requirements' });
        }

        var textToCheck = fullname.concat(" ", relationshipStatus, " ", region, " ", regionCode, " ", country).toLowerCase();

        for(let i=0; i < languageList.length; i++){
            if(textToCheck.indexOf(languageList[i]) !== -1){
                return res.status(403).json({"message":"Inappropriate content"})  
            }
        }
    
        if ( !loggedUserId ) {    
            return res.status(400).json({ message: 'Missing required fields!' })
        }

        const foundUserProfile = await DriverProfile.findOne({_userId: loggedUserId })
        
        if(foundUserProfile){

            if(!foundUser.profilePicKey && profilePicKey !== '' && profilePicURL !== ''){

                profilePicKey ? foundUser.profilePicKey = profilePicKey : null;
                profilePicURL ? foundUser.profilePicURL = profilePicURL : null;

                fullname ? foundUserProfile.fullname = fullname : foundUserProfile.fullname = "";
                phonePrimary ? foundUserProfile.phonePrimary = phonePrimary : foundUserProfile.phonePrimary = "";
                relationshipStatus ? foundUserProfile.relationshipStatus = relationshipStatus : foundUserProfile.relationshipStatus = "";
                birthDate ? foundUserProfile.birthDate = birthDate : foundUserProfile.birthDate = "";
                region ? foundUserProfile.region = region : foundUserProfile.region = "";
                regionCode ? foundUserProfile.regionCode = regionCode : foundUserProfile.regionCode = "";
                country ? foundUserProfile.country = country : foundUserProfile.country = "";

                const savedFoundProfile = await foundUserProfile.save()
            
                const savedFoundUser = await foundUser.save()

                if (savedFoundProfile && savedFoundUser) {
                    res.json({ message: "Success!" })
                }

            } else if(profilePicKey !== '' && (foundUser.profilePicKey !== profilePicKey)){

                const deleted = await deleteFile(foundUser.profilePicKey)

                if(deleted){

                    profilePicKey ? foundUser.profilePicKey = profilePicKey : null;
                    profilePicURL ? foundUser.profilePicURL = profilePicURL : null;

                    fullname ? foundUserProfile.fullname = fullname : foundUserProfile.fullname = "";
                    phonePrimary ? foundUserProfile.phonePrimary = phonePrimary : foundUserProfile.phonePrimary = "";
                    relationshipStatus ? foundUserProfile.relationshipStatus = relationshipStatus : foundUserProfile.relationshipStatus = "";
                    birthDate ? foundUserProfile.birthDate = birthDate : foundUserProfile.birthDate = "";
                    region ? foundUserProfile.region = region : foundUserProfile.region = "";
                    regionCode ? foundUserProfile.regionCode = regionCode : foundUserProfile.regionCode = "";
                    country ? foundUserProfile.country = country : foundUserProfile.country = "";

                    const savedFoundProfile = await foundUserProfile.save()
                
                    const savedFoundUser = await foundUser.save()

                    if (savedFoundProfile && savedFoundUser) {
                        res.json({ message: "Success!" })
                    }
                }
            
            } else {

                fullname ? foundUserProfile.fullname = fullname : foundUserProfile.fullname = "";
                phonePrimary ? foundUserProfile.phonePrimary = phonePrimary : foundUserProfile.phonePrimary = "";
                relationshipStatus ? foundUserProfile.relationshipStatus = relationshipStatus : foundUserProfile.relationshipStatus = "";
                birthDate ? foundUserProfile.birthDate = birthDate : foundUserProfile.birthDate = "";
                region ? foundUserProfile.region = region : foundUserProfile.region = "";
                regionCode ? foundUserProfile.regionCode = regionCode : foundUserProfile.regionCode = "";
                country ? foundUserProfile.country = country : foundUserProfile.country = "";

                const savedFoundProfile = await foundUserProfile.save()
            
                const savedFoundUser = await foundUser.save()

                if (savedFoundProfile && savedFoundUser) {
                    res.json({ message: "Success!" })
                }
            }
        }
    })
}

const editProfilePic = async (req, res) => {
    
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
    
        const { loggedUserId, profilePicKey, profilePicURL } = req.body

        if ( !loggedUserId ||  !profilePicKey ||!profilePicURL ) {    
            return res.status(400).json({ message: 'Missing required fields!' })
        }

        if(profilePicKey !== '' && foundUser.profilePicKey !== profilePicKey && foundUser.profilePicURL !== '/images/avatars/defaultUserPic.svg'){

            const deleted = await deleteFile(foundUser.profilePicKey)

            if(deleted){

                profilePicKey ? foundUser.profilePicKey = profilePicKey : null;
                profilePicURL ? foundUser.profilePicURL = profilePicURL : null;
            
                const savedFoundUser = await foundUser.save()

                if (savedFoundUser) {
                    res.json({ message: "Success!" })
                }
            }

        } else {
            
            profilePicKey ? foundUser.profilePicKey = profilePicKey : null;
            profilePicURL ? foundUser.profilePicURL = profilePicURL : null;
        
            const savedFoundUser = await foundUser.save()

            if (savedFoundUser) {
                res.json({ message: "Success!" })
            }
        }
    })
}

const editSettingsUserPass = async (req, res) => {

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

        const { loggedUserId, oldPwd, newPwd } = req.body
    
        if ( !loggedUserId || ! foundUser._id.toString() === ((loggedUserId)) || !oldPwd || !newPwd){
            return res.status(400).json({ message: 'Missing required fields!' })
        }

        if ( oldPwd?.length > 48 || newPwd?.length > 48 || oldPwd?.length < 8 || newPwd?.length < 8 ){
            return res.status(400).json({ message: 'Content does not meet requirements!' })
        }


        const foundLimits = await UsageLimit.findOne({_userId: foundUser._id})

        if(foundLimits){

            if(foundLimits.passwordResetRequests >= 3){

                foundUser.lockedOut = true;

                const savedLimits = await foundLimits.save()
                const savedUser = await foundUser.save()

                if(savedLimits && savedUser){
                    return res.status(403).message({"message": "Password reset failed, account is now locked."})
                }

            } else {

                foundLimits.passwordResetRequests = foundLimits.passwordResetRequests + 1
                const savedLimits = await foundLimits.save();

                if(savedLimits){

                    const saltRounds = 10;

                    const match = await bcrypt.compare(oldPwd, foundUser.password);

                    if (match) {

                        bcrypt.genSalt(saltRounds, function(err, salt) {

                            bcrypt.hash(newPwd, salt, function(err, hashedPwd) {

                                foundUser.password = hashedPwd

                                foundUser.save( function(error) {
                                    if (error){
                                        return res.status(500).send({msg:err.message});
                                    } 

                                    sendPassResetConfirmation({toUser: foundUser.email})

                                    return res.status(200).send({msg:'Your password has been reset!'});
                                })
                                
                            })
                        })

                    } else {

                        return res.status(400).json({ 'message': 'Unsuccessful! Please try again!' });
                    }
                }
            }
        }
    })
}

const editSettingsUserGeneral = async (req, res) => {

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

        var { loggedUserId, lessMotion, privacySetting, currency, language, 
            showFXPriceSetting, pushNotifications, userTheme, driverOrHost, gender } = req.body


        if ( !loggedUserId || ! foundUser._id.toString() === ((loggedUserId)) || lessMotion === null
        || privacySetting === null || pushNotifications === null || !currency || currency?.length > 10  || language?.length > 50
        || !userTheme || userTheme?.length > 12 || privacySetting > 2 || privacySetting < 0 || !driverOrHost ) {
            return res.status(400).json({ message: 'Missing required fields!' })
        }

        if(driverOrHost === 1){

            const foundUserProfile = await DriverProfile.findOne({"_userId": loggedUserId })
        
            if(foundUserProfile){

                privacySetting === 1 ? foundUser.privacySetting = 1 : foundUser.privacySetting = 2;
                currency !== '' ? foundUser.currency = currency : foundUser.currency = "USD";
                language !== '' ? foundUser.language = language : foundUser.language = "English";
                showFXPriceSetting === 1 ? foundUser.showFXPriceSetting = 1 : foundUser.showFXPriceSetting = 2;
                gender !== '' ? foundUser.gender = gender : foundUser.gender = "female";

                foundUser.genderSet = true;

                lessMotion ? foundUserProfile.lessMotion = true : foundUserProfile.lessMotion = false;
                pushNotifications ? foundUserProfile.pushNotifications = true : foundUserProfile.pushNotifications = false;
                userTheme !== '' ? foundUserProfile.userTheme = userTheme : foundUserProfile.userTheme = "light";

                const savedFoundProfile = await foundUserProfile.save()
                const savedFoundUser = await foundUser.save()

                if (savedFoundProfile && savedFoundUser) {
                    res.json({ message: "Success!" })
                }
            
            } else {

                return res.status(401).json({ message: 'Operation failed' })
            }
        
        } else {

            const foundHostProfile = await HostProfile.findOne({"_userId": loggedUserId })
        
            if(foundHostProfile){

                privacySetting === 1 ? foundUser.privacySetting = 1 : foundUser.privacySetting = 2;
                currency !== '' ? foundUser.currency = currency : foundUser.currency = "USD";
                language !== '' ? foundUser.language = language : foundUser.language = "English";
                showFXPriceSetting === 1 ? foundUser.showFXPriceSetting = 1 : foundUser.showFXPriceSetting = 2;
                gender !== '' ? foundUser.gender = gender : foundUser.gender = "female";
                foundUser.genderSet = true;

                lessMotion ? foundHostProfile.lessMotion = true : foundHostProfile.lessMotion = false;
                pushNotifications ? foundHostProfile.pushNotifications = true : foundHostProfile.pushNotifications = false;
                userTheme !== '' ? foundHostProfile.userTheme = userTheme : foundHostProfile.userTheme = "light";

                const savedFoundProfile = await foundHostProfile.save()
                const savedFoundUser = await foundUser.save()

                if (savedFoundProfile && savedFoundUser) {
                    res.json({ message: "Success!" })
                }
            
            } else {

                return res.status(401).json({ message: 'Operation failed' })
            }
        }
        
    })
}

const getSuggestedProfiles = async (req, res) => {

    const { loggedUserId } = req.params

    if (!loggedUserId) {
        return res.status(400).json({ message: 'Missing required fields' })
    }

    const blockedProfiles = await User.findOne({_id: loggedUserId}).select("blockedUsers")

    const peopleFollowing = await Peoplefollowing.findOne({"_userId": loggedUserId})

    const peopleSubmitted = await Peoplefollowing.aggregate([
        {$match: { _userId: loggedUserId }},
        {"$unwind" : "$submittedFollowRequests"},
        {"$match": {"submittedFollowRequests.isActiveRequest": true} },
        {"$group": {"_id": "$_id", "submittedFollowRequests":{"$push":"$submittedFollowRequests"}}},
        {"$project":{"submittedFollowRequests._submittedToUser":1}}
    ])

    const peopleReceived = await Peoplefollowers.aggregate([
        {$match: { _userId: loggedUserId }},
        {"$unwind" : "$receivedFollowRequests"},
        {"$match": {"receivedFollowRequests.isActiveRequest": true} },
        {"$limit": 10},
        {"$group": {"_id": "$_id", "receivedFollowRequests":{"$push":"$receivedFollowRequests"}}},
        {"$project":{"receivedFollowRequests._fromRequestedUser":1}}
    ])

    const storeFollowing = await Storefollowing.findOne({"_userId": loggedUserId})

    const storeSubmitted = await Storefollowing.aggregate([
        {$match: { _userId: loggedUserId }},
        {"$unwind" : "$submittedFollowRequests"},
        {"$match": {"submittedFollowRequests.isActiveRequest": true} },
        {"$group": {"_id": "$_id", "submittedFollowRequests":{"$push":"$submittedFollowRequests"}}},
        {"$project":{"submittedFollowRequests._submittedToUser":1}}
    ])

    const storeReceived = await Storefollowers.aggregate([
        {$match: { _userId: loggedUserId }},
        {"$unwind" : "$receivedFollowRequests"},
        {"$match": {"receivedFollowRequests.isActiveRequest": true} },
        {"$limit": 10},
        {"$group": {"_id": "$_id", "receivedFollowRequests":{"$push":"$receivedFollowRequests"}}},
        {"$project":{"receivedFollowRequests._fromRequestedUser":1}}
    ])

    if(!peopleFollowing && !storeFollowing){
        res.json({})
    } 

    var requestedPeopleProfiles=[];
    var requestedHostProfiles=[];
    var receivedPeopleProfiles=[];
    var receivedHostProfiles=[];
    var peopleData = null;
    var storeData = null;
    var suggestedPeopleProfiles = null;
    var suggestedHostProfiles = null;

    if (peopleSubmitted) {
        
        if(peopleSubmitted[0]?.submittedFollowRequests !== undefined){
            for(let item of (peopleSubmitted[0].submittedFollowRequests)){
                requestedPeopleProfiles.push(item._submittedToUser)
            }
        }

        if(peopleFollowing && blockedProfiles && peopleReceived){

            if(peopleReceived[0]?.receivedFollowRequests !== undefined){
                for(let item of (peopleReceived[0].receivedFollowRequests)){
                    receivedPeopleProfiles.push(item._fromRequestedUser)
                }
            }

            suggestedPeopleProfiles = await DriverProfile.find({$and:[{_userId: {"$ne": loggedUserId}},{_userId:{"$nin": peopleFollowing.allPeopleFollowing.map(c => c._followingId)}},
            {_userId:{"$nin": requestedPeopleProfiles}},{_userId: {"$nin": blockedProfiles.blockedUsers.map(e=>e._userId)}}]}).select("_userId").limit(8)

            if(suggestedPeopleProfiles){
                
                peopleData = await User.find({$or:[{_id: {$in: suggestedPeopleProfiles.map(e=>e._userId)}},{_id: {$in: receivedPeopleProfiles}} ]} ).select("_id username profilePicURL privacySetting roles")
            }
        }
    }

    if (storeSubmitted) {
        
        if(storeSubmitted[0]?.submittedFollowRequests !== undefined){
            for(let item of (storeSubmitted[0].submittedFollowRequests)){
                requestedHostProfiles.push(item._submittedToUser)
            }
        }

        if(storeFollowing && blockedProfiles && storeReceived){

            if(storeReceived[0]?.receivedFollowRequests !== undefined){
                for(let item of (storeReceived[0].receivedFollowRequests)){
                    receivedHostProfiles.push(item._fromRequestedUser)
                }
            }

            suggestedHostProfiles = await HostProfile.find({$and:[{_userId: {"$ne": loggedUserId}},{_userId:{"$nin": storeFollowing.allStoreFollowing.map(c => c._followingId)}},
            {_userId:{"$nin": requestedHostProfiles}},{_userId: {"$nin": blockedProfiles.blockedUsers.map(e=>e._userId)}}]}).select("_userId").limit(8)

            if(suggestedHostProfiles){
                storeData = await User.find({$or:[{_id: {$in: suggestedHostProfiles.map(e=>e._userId)}},{_id: {$in: receivedHostProfiles}} ]} ).select("_id username profilePicURL privacySetting roles")
            }
        }
    }
    
    if(peopleData && storeData){
        
        res.json({suggestedPeopleProfiles, suggestedHostProfiles, receivedPeopleProfiles, receivedHostProfiles, peopleData, storeData})
    }
}


const getProfilePicByUserId = async (req, res) => {

    const {userId} = req.params

    if (!userId) {
        return res.status(400).json({ message: 'Missing required fields' })
    }

    const profilePicURL = await User.findOne({"_id": userId}).select("profilePicURL")

    if(profilePicURL){

        return res.json(profilePicURL)

    } else {

        return res.status(400).json({ message: 'Failed to retrieve profile pic URL' })
    }
}


const checkUser = async (req, res) => {

    const {username, email} = req.query

    if (!username || !email || username.length > 48 || email.length > 48
        || username.length < 4 || email.length < 4 ) {
        return res.status(400).json({ message: 'Missing required fields' })
    }

    try {

        const foundUsername = await User.findOne({username: username})
        const foundEmail = await User.findOne({email: email}) 

        if(foundUsername && foundEmail ){

            return res.status(200).json({username: 1, email: 1})
        
        } else if (!foundUsername && foundEmail){

            return res.status(200).json({username: 0, email: 1})

        } else if (foundUsername && !foundEmail){

            return res.status(200).json({username: 1, email: 0})
        }
        
        return res.status(200).json({username: 0, email: 0})

    } catch (err) {

        return res.status(400).json({ message: 'Failed' })
    }
}


const getProfileData = async (req, res) => {

    const {userId, driverOrHost} = req.query

    if (!userId || !driverOrHost) {
        return res.status(400).json({ message: 'Missing required info' })
    }

    try {

        if(driverOrHost == 1){

            const userProfile = await DriverProfile.findOne({_userId: userId})
            const userData = await User.findOne({_id: userId}).select("profilePicKey profilePicURL")

            if(userProfile && userData){
                return res.status(200).json({userProfile, userData})
            }
        
        } else if (driverOrHost == 2) {

            const HostProfile = await HostProfile.findOne({_userId: userId})
            const userData = await User.findOne({_id: userId}).select("profilePicKey profilePicURL")

            if(HostProfile && userData){
                return res.status(200).json({HostProfile, userData})
            }

        } else {

            return res.status(401).json({ message: 'Failed' })
        }
    
    } catch (err) {

        return res.status(400).json({ message: 'Failed' })
    }

}

const deleteOldProfilePic = async (req, res) => {

    const { loggedUserId } = req.query

    if (!loggedUserId ) {
        return res.status(400).json({ message: 'Missing required info' })
    }

    try {
        
        const userData = await User.findOne({_id: loggedUserId}).select("profilePicKey profilePicURL")

        if(userData){

            const deleted = await deleteFile(userData.profilePicKey)

            if(deleted){

                userData.profilePicKey = "";
                userData.profilePicURL = "";

                const doneDeleted = await userData.save();

                if(doneDeleted){
                
                    return res.status(200).json({'message': 'Successfully deleted old profile pic'})
                
                } else {

                    return res.status(401).json({ message: 'Failed' })
                }
            }

        } else {

            return res.status(401).json({ message: 'Failed' })
        }
    
    } catch (err) {

        return res.status(400).json({ message: 'Failed' })
    }

}


const addUserBan = async (req, res) => {
    
    const { userId, bannedUserId } = req.body

    if (!userId || !bannedUserId) {
        return res.status(400).json({ message: 'User ID Required' })
    }

    const checkUserRoles = await User.findOne({_id: userId}).select("_id deactivated roles")

    if(!checkUserRoles){

        return res.status(403).json({ message: 'User ID Required' })
    
    } else {

        if(! Object.values(checkUserRoles.roles).includes(5150)){

            return res.status(403).json({ message: 'User ID Required' })
        
        } else {

            const foundUser = await User.findOne({_id: bannedUserId})

            if(foundUser){

                if(foundUser.deactivated === false){

                    foundUser.deactivated = true;

                    const updateBan = await BannedUser.updateOne({admin: "admin"}, {$push: {ipAddresses: {userIP: foundUser.primaryGeoData.IPv4}}} )

                    const savedUpdate = await foundUser.save()

                    if(savedUpdate && updateBan){
                        return res.status(200).json({'message': 'Added new ban'})
                    }

                } else {
                    return res.status(400).json({'message': 'Already banned!'})
                }
            }
        }
    }
}

const removeUserBan = async (req, res) => {
    
    const { userId, bannedUserId } = req.query

    if (!userId || !bannedUserId) {
        return res.status(400).json({ message: 'User ID Required' })
    }

    const checkUserRoles = await User.findOne({_id: userId}).select("_id deactivated roles")

    if(!checkUserRoles){

        return res.status(403).json({ message: 'User ID Required' })
    
    } else {

        if(! Object.values(checkUserRoles.roles).includes(5150)){

            return res.status(403).json({ message: 'User ID Required' })
        
        } else {

            const foundUser = await User.findOne({_id: bannedUserId})

            if(foundUser){

                foundUser.deactivated = false;

                const updateBan = await BannedUser.updateOne({admin: "admin"},{$pull: {ipAddresses: {"userIP": foundUser.primaryGeoData.IPv4}}})

                const savedUpdate = await foundUser.save()

                if(savedUpdate && updateBan){
                    return res.status(200).json({'message': 'Added new ban'})
                }
            }
        }
    }
}


const makePrivate = async (req, res) => {

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
        
        const { profileUserId } = req.body

        if (!profileUserId || (!foundUser._id.toString() === ((profileUserId)) && !Object.values(foundUser.roles).includes(5150) ) ) {
            return res.status(400).json({ message: 'User ID Required' })
        }

        const profileUser = await User.findOne({_id: profileUserId})
        const foundProfile = await DriverProfile.findOne({_userId:profileUserId})
        const foundWishlist = await Bookmark.findOne({_userId:profileUserId})
        const recentViews = await RecentlyViewed.findOne({_id: profileUserId})

        if(foundProfile && foundWishlist && profileUser && recentViews){

            profileUser.privacySetting = 2
            recentViews.privacySetting = 2

            const updatedPosts = await Post.updateMany({$or:[{_id: {$in: foundProfile.userPosts?.map(e=>e._postId)}},
                {_id: {$in: foundWishlist.bookmarks?.map(e=>e._postId)}}]},{$set:{privacySetting: 2}} )

            const updatedUser = await profileUser.save();
            const updatedRecentViews = await recentViews.save();

            if(updatedUser && updatedPosts && updatedRecentViews){

                return res.status(200).json({'message': 'Added new ban'})
            
            } else {

                return res.status(403).json({ message: 'User ID Required' })
            }
        }    
    })
}

const makePublic = async (req, res) => {

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
        
        const { profileUserId } = req.body

        if (!profileUserId || (!foundUser._id.toString() === ((profileUserId)) && !Object.values(foundUser.roles).includes(5150) ) ) {
            return res.status(400).json({ message: 'User ID Required' })
        }

        const profileUser = await User.findOne({_id: profileUserId})
        const foundProfile = await DriverProfile.findOne({_userId:profileUserId})
        const foundWishlist = await Bookmark.findOne({_userId:profileUserId})
        const recentViews = await RecentlyViewed.findOne({_id: profileUserId})

        if(foundProfile && foundWishlist && profileUser && recentViews){

            profileUser.privacySetting = 1
            recentViews.privacySetting = 1

            const updatedPosts = await Post.updateMany({$or:[{_id: {$in: foundProfile.userPosts.map(e=>e._postId)}},
                {_id: {$in: foundWishlist.bookmarks.map(e=>e._postId)}}]},{$set:{privacySetting: 1}} )

            const updatedUser = await profileUser.save();
            const updatedRecentViews = await recentViews.save();

            if(updatedUser && updatedPosts && updatedRecentViews){

                return res.status(200).json({'message': 'Added new ban'})
            
            } else {

                return res.status(403).json({ message: 'User ID Required' })
            }
        }    
    })
}

const adjustInfluencerRating = async (req, res) => {
    
    const { userId, changeUserId, influencerRating } = req.body

    if (!userId || !changeUserId ) {
        return res.status(400).json({ message: 'User ID Required' })
    }

    const checkUserRoles = await User.findOne({_id: userId}).select("_id deactivated roles")

    if(!checkUserRoles){

        return res.status(403).json({ message: 'User ID Required' })
    
    } else {

        if(! Object.values(checkUserRoles.roles).includes(5150)){

            return res.status(403).json({ message: 'User ID Required' })
        
        } else {

            const foundUser = await User.findOne({_id: changeUserId})

            if(foundUser){

                foundUser.influencerRating = influencerRating;

                const savedUpdate = await foundUser.save()

                if(savedUpdate){
                    return res.status(200).json({'message': 'Added new ban'})
                }
            
            } else {
                return res.status(400).json({'message': 'Already banned!'})
            }
        }
    }
}


const editUserReceivePayments = async (req, res) => {

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
        
        const { profileUserId } = req.body

        if (!profileUserId || (!Object.values(foundUser.roles).includes(5150) ) ) {
            return res.status(400).json({ message: 'User ID Required' })
        }

        var foundProfile = null;
        
        const profileUser = await User.findOne({_id: profileUserId})
        const foundWishlist = await Bookmark.findOne({_userId:profileUserId})

        if(profileUser){

            if(Object.values(profileUser.roles).includes(3780)){

                const foundHostProfile = await HostProfile.findOne({_userId:profileUserId})

                if(foundHostProfile && foundWishlist){

                    if(profileUser.canReceivePayments){
        
                        profileUser.canReceivePayments = 0
        
                        const updatedPosts = await Post.updateMany({$or:[{_id: {$in: foundHostProfile.storePosts?.map(e=>e._postId)}},
                            {_id: {$in: foundWishlist.bookmarks?.map(e=>e._postId)}}]},{$set:{canReceivePayments: 0}} )
        
                        const updatedUser = await profileUser.save();
        
                        if(updatedUser && updatedPosts){
        
                            return res.status(200).json({'message': 'Added new ban'})
                        
                        } else {
        
                            return res.status(403).json({ message: 'User ID Required' })
                        }
        
                    } else {
        
                        profileUser.canReceivePayments = 1
        
                        const updatedPosts = await Post.updateMany({$or:[{_id: {$in: foundHostProfile.storePosts?.map(e=>e._postId)}},
                            {_id: {$in: foundWishlist.bookmarks?.map(e=>e._postId)}}]},{$set:{canReceivePayments: 1}} )
        
                        const updatedUser = await profileUser.save();
        
                        if(updatedUser && updatedPosts){
        
                            return res.status(200).json({'message': 'Added new ban'})
                        
                        } else {
        
                            return res.status(403).json({ message: 'User ID Required' })
                        }
                    }
                }    

            } else {

                const foundUserProfile = await DriverProfile.findOne({_userId:profileUserId})

                if(foundUserProfile && foundWishlist){

                    if(profileUser.canReceivePayments){
        
                        profileUser.canReceivePayments = 0
        
                        const updatedPosts = await Post.updateMany({$or:[{_id: {$in: foundUserProfile.userPosts?.map(e=>e._postId)}},
                            {_id: {$in: foundWishlist.bookmarks?.map(e=>e._postId)}}]},{$set:{canReceivePayments: 0}} )
        
                        const updatedUser = await profileUser.save();
        
                        if(updatedUser && updatedPosts){
        
                            return res.status(200).json({'message': 'Added new ban'})
                        
                        } else {
        
                            return res.status(403).json({ message: 'User ID Required' })
                        }
        
                    } else {
        
                        profileUser.canReceivePayments = 1
        
                        const updatedPosts = await Post.updateMany({$or:[{_id: {$in: foundUserProfile.userPosts?.map(e=>e._postId)}},
                            {_id: {$in: foundWishlist.bookmarks?.map(e=>e._postId)}}]},{$set:{canReceivePayments: 1}} )
        
                        const updatedUser = await profileUser.save();
        
                        if(updatedUser && updatedPosts){
        
                            return res.status(200).json({'message': 'Added new ban'})
                        
                        } else {
        
                            return res.status(403).json({ message: 'User ID Required' })
                        }
                    }
                }    
            }
        }
    })
}


module.exports = { getUserProfile, editSettingsUserProfile, editSettingsUserPass, editSettingsUserGeneral, editProfilePic,
    getUserIdByUsername, getSuggestedProfiles, getProfilePicByUserId, checkUser, getProfileData, 
    deleteOldProfilePic, addUserBan, removeUserBan, makePrivate, makePublic, adjustInfluencerRating,
    editUserReceivePayments }