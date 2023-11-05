const User = require('../../model/User')
const HostProfile = require('../../model/HostProfile');
const Bookmark = require('../../model/Bookmark');
const Flags = require('../../model/Flags')

const languageList = require('../languageCheck');
const ObjectId  = require('mongodb').ObjectId;
const jwt = require('jsonwebtoken');
const S3 = require("aws-sdk/clients/s3");
const fns = require('date-fns')
const { deleteFile } = require("../media/s3Controller");

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
  
const getHostProfile = async (req, res) => {
    
    const { profileUserId, loggedUserId, ipAddress, language, currency } = req.query

    if (!profileUserId || !loggedUserId ) {
        return res.status(400).json({ message: 'Missing required info' })
    }

    try {

        const foundHostProfile = await HostProfile.findOne({_userId: profileUserId})
        const userFound = await User.findOne({_id: profileUserId})
        const bookmarksFound = await Bookmark.findOne({_userId: loggedUserId})

        let doneProfileData = false;
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

            doneLoggedBlocked = true;
        } 

        if(Object.keys(foundHostProfile)?.length > 0){

            if(foundHostProfile.mediaCarouselURLs?.length === 0 && foundHostProfile.mediaCarouselObjectIds?.length > 0){

                var finalMediaURLs = []

                for(let i=0; i<foundHostProfile.mediaCarouselObjectIds?.length; i++){
                
                    var signParams = {
                        Bucket: wasabiPrivateBucketUSA, 
                        Key: foundHostProfile.mediaCarouselObjectIds[i],
                        Expires: 7200
                        };
        
                    var url = s3.getSignedUrl('getObject', signParams);
        
                    finalMediaURLs.push(url)
                }

                var finalVideoURLs = []

                for(let i=0; i<foundHostProfile.videoCarouselObjectIds?.length; i++){

                    if(foundHostProfile.videoCarouselObjectIds[i] !== 'image'){

                        var signParams = {
                            Bucket: wasabiPrivateBucketUSA, 
                            Key: foundHostProfile.videoCarouselObjectIds[i],
                            Expires: 7200
                        };
            
                        var url = s3.getSignedUrl('getObject', signParams);
            
                        finalVideoURLs.push(url)

                    } else {

                        finalVideoURLs.push('image')
                    }
                }

                foundHostProfile.mediaCarouselURLs = finalMediaURLs
                foundHostProfile.videoCarouselURLs = finalVideoURLs
                foundHostProfile.previewMediaURL = finalMediaURLs[foundHostProfile.coverIndex]

            } else if(foundHostProfile.mediaCarouselObjectIds?.length > 0) {

                for(let i=0; i<foundHostProfile.mediaCarouselURLs?.length; i++){
                    
                    var signedUrl = foundHostProfile.mediaCarouselURLs[i];

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
                            Key: foundHostProfile.mediaCarouselObjectIds[i],
                            Expires: 7200
                            };
            
                        var url = s3.getSignedUrl('getObject', signParams);
            
                        foundHostProfile.mediaCarouselURLs[i] = url
                    }

                    if(foundHostProfile.coverIndex === i){
                        foundHostProfile.previewMediaURL = foundHostProfile.mediaCarouselURLs[i]
                    }
                }

                for(let i=0; i<foundHostProfile.videoCarouselURLs?.length; i++){

                    if(foundHostProfile.videoCarouselURLs[i] !== 'image'){

                        var signedUrl = foundHostProfile.videoCarouselURLs[i];

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
                                Key: foundHostProfile.videoCarouselObjectIds[i],
                                Expires: 7200
                            };
                
                            var url = s3.getSignedUrl('getObject', signParams);
                
                            foundHostProfile.videoCarouselURLs[i] = url
                        }
                    }
                }
            
            } else if(!foundHostProfile.previewMediaURL && foundHostProfile.mediaCarouselObjectIds?.length === 0){

                var signParams = {
                    Bucket: wasabiPrivateBucketUSA, 
                    Key: foundHostProfile.previewMediaObjectId, 
                    Expires: 7200
                };

                var url = s3.getSignedUrl('getObject', signParams);

                foundHostProfile.previewMediaURL = url
            
            } else if(foundHostProfile.mediaCarouselObjectIds?.length === 0) {

                var signedUrl = foundHostProfile.previewMediaURL

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
                        Key: foundHostProfile.previewMediaObjectId,
                        Expires: 7200
                    };
        
                    var url = s3.getSignedUrl('getObject', signParams);
        
                    foundHostProfile.previewMediaURL = url
                }
            }

            const updatedProfile = await foundHostProfile.save()

            if(updatedProfile){
                doneProfileData = true;
            }

        }  else {
            doneProfileData = true;
            foundHostProfile = {};
        }

        if(doneProfileData && profilePicURL && bookmarksFound && doneFlags ){
            
                return res.status(200).json({foundHostProfile, profilePicURL, bookmarksFound, flaggedProfile })
        
        } else {

            return res.status(401).json({ message: 'Cannot get store information' })
        }
        
    } catch(err){

        return res.status(401).json({ message: 'Cannot get user information' })
    }
}


const getHostProfilesCoord = async (req, res) => {
    
    var { coordinatesInput, loggedUserId } = req.query

    if (!coordinatesInput || !loggedUserId ) {
        return res.status(400).json({ message: 'Missing required info' })
    }

    coordinatesInput = JSON.parse(coordinatesInput)

    try {

        const foundHostProfiles = await HostProfile.find({
            offeringCharging: true,
            deactivated: false,
            location:
              { $near:
                 {
                   $geometry: { type: "Point",  coordinates: coordinatesInput },
                   $maxDistance: 10000
                 }
              }
          })

        const bookmarksFound = await Bookmark.findOne({_userId: loggedUserId})
        const flaggedList = await Flags.findOne({_userId: loggedUserId})

        let doneProfileData = false;

        if(foundHostProfiles?.length > 0){

            console.log(foundHostProfiles)

            foundHostProfiles?.forEach(function(item, index){

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
    
                            finalVideoURLs.push("image")
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
                
                }  
    
                item.update()
            })

            doneProfileData = true;

        }  else {

            doneProfileData = true;
        }

        if(doneProfileData && flaggedList && bookmarksFound ){
            
                return res.status(200).json({foundHostProfiles, bookmarksFound, flaggedList })
        
        } else {

            return res.status(401).json({ message: 'Cannot get store information' })
        }
        
    } catch(err){

        return res.status(401).json({ message: 'Cannot get user information' })
    }
}


const editSettingsHostProfile = async (req, res) => {
    
    const cookies = req.cookies;

    if (!cookies?.socketjuicejwt) return res.sendStatus(401);
    const refreshToken = cookies.socketjuicejwt;

    User.findOne({ refreshToken }, async function(err, foundUser){

        if (err || !foundUser) return res.sendStatus(403); 
    
        jwt.verify(
            refreshToken,
            process.env.REFRESH_TOKEN_SECRET,
            (err, decoded) => {

                if (err || foundUser.username !== decoded.username || !foundUser._id.toString() === ((decoded.userId)) ) return res.sendStatus(403);
            }
        )

        const { loggedUserId, phonePrimary, profilePicKey, profilePicURL, 
            regularHoursMondayStart, regularHoursMondayFinish, regularHoursTuesdayStart, regularHoursTuesdayFinish, regularHoursWednesdayStart, regularHoursWednesdayFinish, 
            regularHoursThursdayStart, regularHoursThursdayFinish, regularHoursFridayStart, regularHoursFridayFinish, regularHoursSaturdayStart, regularHoursSaturdayFinish, 
            regularHoursSundayStart, regularHoursSundayFinish, closedOnMonday, closedOnTuesday, closedOnWednesday, closedOnThursday, closedOnFriday, closedOnSaturday, closedOnSunday, 
            address, city, region, regionCode, country } = req.body
        
        if ( !loggedUserId || !phonePrimary  || !address 
            || !city || !region || !regionCode || !country ) {    
            return res.status(400).json({ message: 'Missing required fields!' })
        }

        if( phonePrimary?.length > 48  || address?.length > 48 || city?.length > 48
            || region?.length > 48 || regionCode?.length > 48 || country?.length > 48
            || regularHoursMondayStart?.length > 100 ){
            return res.status(400).json({ 'message': 'Content does not meet requirements' });
        }
    
        var textToCheck = address.concat(" ", city, " ", region, " ", regionCode, " ", country).toLowerCase();

        for(let i=0; i < languageList.length; i++){
            if(textToCheck.indexOf(languageList[i]) !== -1){
                return res.status(403).json({"message":"Inappropriate content"})  
            }
        }

        const foundHostProfile = await HostProfile.findOne({"_userId": loggedUserId })
        
        if(foundHostProfile){

            if(!foundUser.profilePicKey && profilePicKey !== '' && profilePicURL !== ''){

                profilePicKey ? foundUser.profilePicKey = profilePicKey : null;
                profilePicURL ? foundUser.profilePicURL = profilePicURL : null;

                phonePrimary ? foundHostProfile.phonePrimary = phonePrimary : foundHostProfile.phonePrimary = "";
                
                regularHoursMondayStart ? foundHostProfile.regularHoursMondayStart = regularHoursMondayStart : foundHostProfile.regularHoursMondayStart = "";
                regularHoursTuesdayStart ? foundHostProfile.regularHoursTuesdayStart = regularHoursTuesdayStart : foundHostProfile.regularHoursTuesdayStart = "";
                regularHoursWednesdayStart ? foundHostProfile.regularHoursWednesdayStart = regularHoursWednesdayStart : foundHostProfile.regularHoursWednesdayStart = "";
                regularHoursThursdayStart ? foundHostProfile.regularHoursThursdayStart = regularHoursThursdayStart : foundHostProfile.regularHoursThursdayStart = "";
                regularHoursFridayStart ? foundHostProfile.regularHoursFridayStart = regularHoursFridayStart : foundHostProfile.regularHoursFridayStart = "";
                regularHoursSaturdayStart ? foundHostProfile.regularHoursSaturdayStart = regularHoursSaturdayStart : foundHostProfile.regularHoursSaturdayStart = "";
                regularHoursSundayStart ? foundHostProfile.regularHoursSundayStart = regularHoursSundayStart : foundHostProfile.regularHoursSundayStart = "";
                
                closedOnMonday ?  foundHostProfile.closedOnMonday = closedOnMonday : foundHostProfile.closedOnMonday = false;
                closedOnTuesday ?  foundHostProfile.closedOnTuesday = closedOnTuesday : foundHostProfile.closedOnTuesday = false;
                closedOnWednesday ?  foundHostProfile.closedOnWednesday = closedOnWednesday : foundHostProfile.closedOnWednesday = false;
                closedOnThursday ?  foundHostProfile.closedOnThursday = closedOnThursday : foundHostProfile.closedOnThursday = false;
                closedOnFriday ?  foundHostProfile.closedOnFriday = closedOnFriday : foundHostProfile.closedOnFriday = false;
                closedOnSaturday ?  foundHostProfile.closedOnSaturday = closedOnSaturday : foundHostProfile.closedOnSaturday = false;
                closedOnSunday ?  foundHostProfile.closedOnSunday = closedOnSunday : foundHostProfile.closedOnSunday = false;
                closedOnHolidays ?  foundHostProfile.closedOnHolidays = closedOnHolidays : foundHostProfile.closedOnHolidays = false;

                regularHoursMondayFinish ? foundHostProfile.regularHoursMondayFinish = regularHoursMondayFinish : foundHostProfile.regularHoursMondayFinish = "";
                regularHoursTuesdayFinish ? foundHostProfile.regularHoursTuesdayFinish = regularHoursTuesdayFinish : foundHostProfile.regularHoursTuesdayFinish = "";
                regularHoursWednesdayFinish ? foundHostProfile.regularHoursWednesdayFinish = regularHoursWednesdayFinish : foundHostProfile.regularHoursWednesdayFinish = "";
                regularHoursThursdayFinish ? foundHostProfile.regularHoursThursdayFinish = regularHoursThursdayFinish : foundHostProfile.regularHoursThursdayFinish = "";
                regularHoursFridayFinish ? foundHostProfile.regularHoursFridayFinish = regularHoursFridayFinish : foundHostProfile.regularHoursFridayFinish = "";
                regularHoursSaturdayFinish ? foundHostProfile.regularHoursSaturdayFinish = regularHoursSaturdayFinish : foundHostProfile.regularHoursSaturdayFinish = "";
                regularHoursSundayFinish ? foundHostProfile.regularHoursSundayFinish = regularHoursSundayFinish : foundHostProfile.regularHoursSundayFinish = "";
                
                address ? foundHostProfile.address = address : foundHostProfile.address = "";
                city ? foundHostProfile.city = city : foundHostProfile.city = "";
                region ? foundHostProfile.region = region : foundHostProfile.region = "";
                regionCode ? foundHostProfile.regionCode = regionCode : foundHostProfile.regionCode = "";
                country ? foundHostProfile.country = country : foundHostProfile.country = "";

                const savedFoundProfile = await foundHostProfile.save()
            
                const savedFoundUser = await foundUser.save()

                if (savedFoundProfile && savedFoundUser) {
                    res.json({ message: "Success!" })
                }
            
            }else if(profilePicKey !== '' && (foundUser.profilePicKey !== profilePicKey)){

                const deleted = await deleteFile(foundUser.profilePicKey)

                if(deleted){

                    profilePicKey ? foundUser.profilePicKey = profilePicKey : null;
                    profilePicURL ? foundUser.profilePicURL = profilePicURL : null;

                    phonePrimary ? foundHostProfile.phonePrimary = phonePrimary : foundHostProfile.phonePrimary = "";

                    regularHoursMondayStart ? foundHostProfile.regularHoursMondayStart = regularHoursMondayStart : foundHostProfile.regularHoursMondayStart = "";
                    regularHoursTuesdayStart ? foundHostProfile.regularHoursTuesdayStart = regularHoursTuesdayStart : foundHostProfile.regularHoursTuesdayStart = "";
                    regularHoursWednesdayStart ? foundHostProfile.regularHoursWednesdayStart = regularHoursWednesdayStart : foundHostProfile.regularHoursWednesdayStart = "";
                    regularHoursThursdayStart ? foundHostProfile.regularHoursThursdayStart = regularHoursThursdayStart : foundHostProfile.regularHoursThursdayStart = "";
                    regularHoursFridayStart ? foundHostProfile.regularHoursFridayStart = regularHoursFridayStart : foundHostProfile.regularHoursFridayStart = "";
                    regularHoursSaturdayStart ? foundHostProfile.regularHoursSaturdayStart = regularHoursSaturdayStart : foundHostProfile.regularHoursSaturdayStart = "";
                    regularHoursSundayStart ? foundHostProfile.regularHoursSundayStart = regularHoursSundayStart : foundHostProfile.regularHoursSundayStart = "";
                    holidayHoursStart ? foundHostProfile.holidayHoursStart = holidayHoursStart : foundHostProfile.holidayHoursStart = "";

                    regularHoursMondayFinish ? foundHostProfile.regularHoursMondayFinish = regularHoursMondayFinish : foundHostProfile.regularHoursMondayFinish = "";
                    regularHoursTuesdayFinish ? foundHostProfile.regularHoursTuesdayFinish = regularHoursTuesdayFinish : foundHostProfile.regularHoursTuesdayFinish = "";
                    regularHoursWednesdayFinish ? foundHostProfile.regularHoursWednesdayFinish = regularHoursWednesdayFinish : foundHostProfile.regularHoursWednesdayFinish = "";
                    regularHoursThursdayFinish ? foundHostProfile.regularHoursThursdayFinish = regularHoursThursdayFinish : foundHostProfile.regularHoursThursdayFinish = "";
                    regularHoursFridayFinish ? foundHostProfile.regularHoursFridayFinish = regularHoursFridayFinish : foundHostProfile.regularHoursFridayFinish = "";
                    regularHoursSaturdayFinish ? foundHostProfile.regularHoursSaturdayFinish = regularHoursSaturdayFinish : foundHostProfile.regularHoursSaturdayFinish = "";
                    regularHoursSundayFinish ? foundHostProfile.regularHoursSundayFinish = regularHoursSundayFinish : foundHostProfile.regularHoursSundayFinish = "";
                    holidayHoursFinish ? foundHostProfile.holidayHoursFinish = holidayHoursFinish : foundHostProfile.holidayHoursFinish = "";
                    
                    closedOnMonday ?  foundHostProfile.closedOnMonday = closedOnMonday : foundHostProfile.closedOnMonday = false;
                    closedOnTuesday ?  foundHostProfile.closedOnTuesday = closedOnTuesday : foundHostProfile.closedOnTuesday = false;
                    closedOnWednesday ?  foundHostProfile.closedOnWednesday = closedOnWednesday : foundHostProfile.closedOnWednesday = false;
                    closedOnThursday ?  foundHostProfile.closedOnThursday = closedOnThursday : foundHostProfile.closedOnThursday = false;
                    closedOnFriday ?  foundHostProfile.closedOnFriday = closedOnFriday : foundHostProfile.closedOnFriday = false;
                    closedOnSaturday ?  foundHostProfile.closedOnSaturday = closedOnSaturday : foundHostProfile.closedOnSaturday = false;
                    closedOnSunday ?  foundHostProfile.closedOnSunday = closedOnSunday : foundHostProfile.closedOnSunday = false;
                    closedOnHolidays ?  foundHostProfile.closedOnHolidays = closedOnHolidays : foundHostProfile.closedOnHolidays = false;

                    address ? foundHostProfile.address = address : foundHostProfile.address = "";
                    city ? foundHostProfile.city = city : foundHostProfile.city = "";
                    region ? foundHostProfile.region = region : foundHostProfile.region = "";
                    regionCode ? foundHostProfile.regionCode = regionCode : foundHostProfile.regionCode = "";
                    country ? foundHostProfile.country = country : foundHostProfile.country = "";

                    const savedFoundProfile = await foundHostProfile.save()
                
                    const savedFoundUser = await foundUser.save()

                    if (savedFoundProfile && savedFoundUser) {
                        res.json({ message: "Success!" })
                    }
                }
            
            } else {

                phonePrimary ? foundHostProfile.phonePrimary = phonePrimary : foundHostProfile.phonePrimary = "";
                
                regularHoursMondayStart ? foundHostProfile.regularHoursMondayStart = regularHoursMondayStart : foundHostProfile.regularHoursMondayStart = "";
                regularHoursTuesdayStart ? foundHostProfile.regularHoursTuesdayStart = regularHoursTuesdayStart : foundHostProfile.regularHoursTuesdayStart = "";
                regularHoursWednesdayStart ? foundHostProfile.regularHoursWednesdayStart = regularHoursWednesdayStart : foundHostProfile.regularHoursWednesdayStart = "";
                regularHoursThursdayStart ? foundHostProfile.regularHoursThursdayStart = regularHoursThursdayStart : foundHostProfile.regularHoursThursdayStart = "";
                regularHoursFridayStart ? foundHostProfile.regularHoursFridayStart = regularHoursFridayStart : foundHostProfile.regularHoursFridayStart = "";
                regularHoursSaturdayStart ? foundHostProfile.regularHoursSaturdayStart = regularHoursSaturdayStart : foundHostProfile.regularHoursSaturdayStart = "";
                regularHoursSundayStart ? foundHostProfile.regularHoursSundayStart = regularHoursSundayStart : foundHostProfile.regularHoursSundayStart = "";
                holidayHoursStart ? foundHostProfile.holidayHoursStart = holidayHoursStart : foundHostProfile.holidayHoursStart = "";

                closedOnMonday ?  foundHostProfile.closedOnMonday = closedOnMonday : foundHostProfile.closedOnMonday = false;
                closedOnTuesday ?  foundHostProfile.closedOnTuesday = closedOnTuesday : foundHostProfile.closedOnTuesday = false;
                closedOnWednesday ?  foundHostProfile.closedOnWednesday = closedOnWednesday : foundHostProfile.closedOnWednesday = false;
                closedOnThursday ?  foundHostProfile.closedOnThursday = closedOnThursday : foundHostProfile.closedOnThursday = false;
                closedOnFriday ?  foundHostProfile.closedOnFriday = closedOnFriday : foundHostProfile.closedOnFriday = false;
                closedOnSaturday ?  foundHostProfile.closedOnSaturday = closedOnSaturday : foundHostProfile.closedOnSaturday = false;
                closedOnSunday ?  foundHostProfile.closedOnSunday = closedOnSunday : foundHostProfile.closedOnSunday = false;
                closedOnHolidays ?  foundHostProfile.closedOnHolidays = closedOnHolidays : foundHostProfile.closedOnHolidays = false;

                regularHoursMondayFinish ? foundHostProfile.regularHoursMondayFinish = regularHoursMondayFinish : foundHostProfile.regularHoursMondayFinish = "";
                regularHoursTuesdayFinish ? foundHostProfile.regularHoursTuesdayFinish = regularHoursTuesdayFinish : foundHostProfile.regularHoursTuesdayFinish = "";
                regularHoursWednesdayFinish ? foundHostProfile.regularHoursWednesdayFinish = regularHoursWednesdayFinish : foundHostProfile.regularHoursWednesdayFinish = "";
                regularHoursThursdayFinish ? foundHostProfile.regularHoursThursdayFinish = regularHoursThursdayFinish : foundHostProfile.regularHoursThursdayFinish = "";
                regularHoursFridayFinish ? foundHostProfile.regularHoursFridayFinish = regularHoursFridayFinish : foundHostProfile.regularHoursFridayFinish = "";
                regularHoursSaturdayFinish ? foundHostProfile.regularHoursSaturdayFinish = regularHoursSaturdayFinish : foundHostProfile.regularHoursSaturdayFinish = "";
                regularHoursSundayFinish ? foundHostProfile.regularHoursSundayFinish = regularHoursSundayFinish : foundHostProfile.regularHoursSundayFinish = "";
                holidayHoursFinish ? foundHostProfile.holidayHoursFinish = holidayHoursFinish : foundHostProfile.holidayHoursFinish = "";

                address ? foundHostProfile.address = address : foundHostProfile.address = "";
                city ? foundHostProfile.city = city : foundHostProfile.city = "";
                region ? foundHostProfile.region = region : foundHostProfile.region = "";
                regionCode ? foundHostProfile.regionCode = regionCode : foundHostProfile.regionCode = "";
                country ? foundHostProfile.country = country : foundHostProfile.country = "";

                const savedFoundProfile = await foundHostProfile.save()
            
                const savedFoundUser = await foundUser.save()

                if (savedFoundProfile && savedFoundUser) {
                    res.json({ message: "Success!" })
                }
            }
        }
    })
}



const editSettingsHostGeneral = async (req, res) => {

    const cookies = req.cookies;

    if (!cookies?.socketjuicejwt) return res.sendStatus(401);
    const refreshToken = cookies.socketjuicejwt;

    const foundUser = await User.findOne({ refreshToken: refreshToken, _id: loggedUserId }).exec();
    if (!foundUser) return res.sendStatus(403); //Forbidden 
    // evaluate jwt 
    jwt.verify(
        refreshToken,
        process.env.REFRESH_TOKEN_SECRET,
        (err, decoded) => {
            if (err || foundUser.username !== decoded.username ) return res.sendStatus(403);
        }
    )

    const { loggedUserId, lessMotion, privacySetting, pushNotifications, userTheme } = req.body

    // Confirm data 
    if ( !loggedUserId || typeof lessMotion !== 'boolean' || !privacySetting || typeof pushNotifications !== 'boolean' || !userTheme ) {

        return res.status(400).json({ message: 'Missing required fields!' })
    }

    // Does the user exist to update?
    HostProfile.findOne({"_userId": loggedUserId }, async function(err, foundHostProfile){
        
        if(err){
            return res.status(400).json({ message: 'User not found' })
        }

        privacySetting ? foundUser.privacySetting = privacySetting : foundUser.privacySetting = "";

        lessMotion ? foundHostProfile.lessMotion = lessMotion : foundHostProfile.lessMotion = "";
        pushNotifications ? foundHostProfile.pushNotifications = pushNotifications : foundHostProfile.pushNotifications = "";
        userTheme ? foundHostProfile.userTheme = userTheme : foundHostProfile.userTheme = "";

        const savedFoundProfile = await foundHostProfile.save()
       
        const savedFoundUser = await foundUser.save()

        if (savedFoundProfile && savedFoundUser) {
            res.json({ message: "Success!" })
        }

    })
}

module.exports = { getHostProfile, getHostProfilesCoord, editSettingsHostProfile }