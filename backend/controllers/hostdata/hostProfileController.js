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
        }

        if(doneProfileData && foundHostProfile && profilePicURL && bookmarksFound && doneFlags ){
            
                return res.status(200).json({foundHostProfile, profilePicURL, bookmarksFound, flaggedProfile })
        
        } else {

            return res.status(401).json({ message: 'Cannot get store information' })
        }
        
    } catch(err){

        return res.status(401).json({ message: 'Cannot get user information' })
    }
}


const editSettingsHostProfile = async (req, res) => {
    
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

        const { loggedUserId, phonePrimary, profilePicKey, profilePicURL, displayname, announcements, 
            regularHoursMondayStart, regularHoursMondayFinish, regularHoursTuesdayStart, regularHoursTuesdayFinish, regularHoursWednesdayStart, regularHoursWednesdayFinish, regularHoursThursdayStart, regularHoursThursdayFinish,
            regularHoursFridayStart, regularHoursFridayFinish, regularHoursSaturdayStart, regularHoursSaturdayFinish, regularHoursSundayStart, regularHoursSundayFinish,
            holidayHoursStart, holidayHoursFinish, closedOnMonday, closedOnTuesday, closedOnWednesday, closedOnThursday, closedOnFriday, closedOnSaturday, closedOnSunday, closedOnHolidays,
            address, city, region, regionCode, country, manager, chain, chainId } = req.body
        
        if ( !loggedUserId || !phonePrimary || !displayname || !address 
            || !city || !region || !regionCode || !country ) {    
            return res.status(400).json({ message: 'Missing required fields!' })
        }

        if( phonePrimary?.length > 48 || displayname?.length > 48 || address?.length > 48 || city?.length > 48
            || region?.length > 48 || regionCode?.length > 48 || country?.length > 48
            || manager?.length > 48 || chain?.length > 4 || chainId?.length > 48
            || announcements?.length > 450 || regularHoursMondayStart?.length > 100 
            || holidayHoursStart?.length > 100){
            return res.status(400).json({ 'message': 'Content does not meet requirements' });
        }
    
        var textToCheck = displayname.concat(" ", announcements, 
             " ", address, " ", city, " ", region, " ", regionCode, " ", 
            country, " ", manager, " ", chainId).toLowerCase();

        for(let i=0; i < languageList.length; i++){
            if(textToCheck.indexOf(languageList[i]) !== -1){
                return res.status(403).json({"message":"Inappropriate content"})  
            }
        }

        const foundUserProfile = await HostProfile.findOne({"_userId": loggedUserId })
        
        if(foundUserProfile){

            if(!foundUser.profilePicKey && profilePicKey !== '' && profilePicURL !== ''){

                profilePicKey ? foundUser.profilePicKey = profilePicKey : null;
                profilePicURL ? foundUser.profilePicURL = profilePicURL : null;

                phonePrimary ? foundUserProfile.phonePrimary = phonePrimary : foundUserProfile.phonePrimary = "";
                displayname ? foundUserProfile.displayname = displayname : foundUserProfile.displayname = "";
                announcements ? foundUserProfile.announcements = announcements : foundUserProfile.announcements = "";
                
                regularHoursMondayStart ? foundUserProfile.regularHoursMondayStart = regularHoursMondayStart : foundUserProfile.regularHoursMondayStart = "";
                regularHoursTuesdayStart ? foundUserProfile.regularHoursTuesdayStart = regularHoursTuesdayStart : foundUserProfile.regularHoursTuesdayStart = "";
                regularHoursWednesdayStart ? foundUserProfile.regularHoursWednesdayStart = regularHoursWednesdayStart : foundUserProfile.regularHoursWednesdayStart = "";
                regularHoursThursdayStart ? foundUserProfile.regularHoursThursdayStart = regularHoursThursdayStart : foundUserProfile.regularHoursThursdayStart = "";
                regularHoursFridayStart ? foundUserProfile.regularHoursFridayStart = regularHoursFridayStart : foundUserProfile.regularHoursFridayStart = "";
                regularHoursSaturdayStart ? foundUserProfile.regularHoursSaturdayStart = regularHoursSaturdayStart : foundUserProfile.regularHoursSaturdayStart = "";
                regularHoursSundayStart ? foundUserProfile.regularHoursSundayStart = regularHoursSundayStart : foundUserProfile.regularHoursSundayStart = "";
                holidayHoursStart ? foundUserProfile.holidayHoursStart = holidayHoursStart : foundUserProfile.holidayHoursStart = "";
                
                closedOnMonday ?  foundUserProfile.closedOnMonday = closedOnMonday : foundUserProfile.closedOnMonday = false;
                closedOnTuesday ?  foundUserProfile.closedOnTuesday = closedOnTuesday : foundUserProfile.closedOnTuesday = false;
                closedOnWednesday ?  foundUserProfile.closedOnWednesday = closedOnWednesday : foundUserProfile.closedOnWednesday = false;
                closedOnThursday ?  foundUserProfile.closedOnThursday = closedOnThursday : foundUserProfile.closedOnThursday = false;
                closedOnFriday ?  foundUserProfile.closedOnFriday = closedOnFriday : foundUserProfile.closedOnFriday = false;
                closedOnSaturday ?  foundUserProfile.closedOnSaturday = closedOnSaturday : foundUserProfile.closedOnSaturday = false;
                closedOnSunday ?  foundUserProfile.closedOnSunday = closedOnSunday : foundUserProfile.closedOnSunday = false;
                closedOnHolidays ?  foundUserProfile.closedOnHolidays = closedOnHolidays : foundUserProfile.closedOnHolidays = false;

                regularHoursMondayFinish ? foundUserProfile.regularHoursMondayFinish = regularHoursMondayFinish : foundUserProfile.regularHoursMondayFinish = "";
                regularHoursTuesdayFinish ? foundUserProfile.regularHoursTuesdayFinish = regularHoursTuesdayFinish : foundUserProfile.regularHoursTuesdayFinish = "";
                regularHoursWednesdayFinish ? foundUserProfile.regularHoursWednesdayFinish = regularHoursWednesdayFinish : foundUserProfile.regularHoursWednesdayFinish = "";
                regularHoursThursdayFinish ? foundUserProfile.regularHoursThursdayFinish = regularHoursThursdayFinish : foundUserProfile.regularHoursThursdayFinish = "";
                regularHoursFridayFinish ? foundUserProfile.regularHoursFridayFinish = regularHoursFridayFinish : foundUserProfile.regularHoursFridayFinish = "";
                regularHoursSaturdayFinish ? foundUserProfile.regularHoursSaturdayFinish = regularHoursSaturdayFinish : foundUserProfile.regularHoursSaturdayFinish = "";
                regularHoursSundayFinish ? foundUserProfile.regularHoursSundayFinish = regularHoursSundayFinish : foundUserProfile.regularHoursSundayFinish = "";
                holidayHoursFinish ? foundUserProfile.holidayHoursFinish = holidayHoursFinish : foundUserProfile.holidayHoursFinish = "";
                
                address ? foundUserProfile.address = address : foundUserProfile.address = "";
                city ? foundUserProfile.city = city : foundUserProfile.city = "";
                region ? foundUserProfile.region = region : foundUserProfile.region = "";
                regionCode ? foundUserProfile.regionCode = regionCode : foundUserProfile.regionCode = "";
                country ? foundUserProfile.country = country : foundUserProfile.country = "";
                manager ? foundUserProfile.manager = manager : foundUserProfile.manager = "";
                chain ? foundUserProfile.chain = chain : foundUserProfile.chain = "";
                chainId ? foundUserProfile.chainId = chainId : foundUserProfile.chainId = "";

                const savedFoundProfile = await foundUserProfile.save()
            
                const savedFoundUser = await foundUser.save()

                if (savedFoundProfile && savedFoundUser) {
                    res.json({ message: "Success!" })
                }
            
            }else if(profilePicKey !== '' && (foundUser.profilePicKey !== profilePicKey)){

                const deleted = await deleteFile(foundUser.profilePicKey)

                if(deleted){

                    profilePicKey ? foundUser.profilePicKey = profilePicKey : null;
                    profilePicURL ? foundUser.profilePicURL = profilePicURL : null;

                    phonePrimary ? foundUserProfile.phonePrimary = phonePrimary : foundUserProfile.phonePrimary = "";
                    displayname ? foundUserProfile.displayname = displayname : foundUserProfile.displayname = "";
                    announcements ? foundUserProfile.announcements = announcements : foundUserProfile.announcements = "";

                    regularHoursMondayStart ? foundUserProfile.regularHoursMondayStart = regularHoursMondayStart : foundUserProfile.regularHoursMondayStart = "";
                    regularHoursTuesdayStart ? foundUserProfile.regularHoursTuesdayStart = regularHoursTuesdayStart : foundUserProfile.regularHoursTuesdayStart = "";
                    regularHoursWednesdayStart ? foundUserProfile.regularHoursWednesdayStart = regularHoursWednesdayStart : foundUserProfile.regularHoursWednesdayStart = "";
                    regularHoursThursdayStart ? foundUserProfile.regularHoursThursdayStart = regularHoursThursdayStart : foundUserProfile.regularHoursThursdayStart = "";
                    regularHoursFridayStart ? foundUserProfile.regularHoursFridayStart = regularHoursFridayStart : foundUserProfile.regularHoursFridayStart = "";
                    regularHoursSaturdayStart ? foundUserProfile.regularHoursSaturdayStart = regularHoursSaturdayStart : foundUserProfile.regularHoursSaturdayStart = "";
                    regularHoursSundayStart ? foundUserProfile.regularHoursSundayStart = regularHoursSundayStart : foundUserProfile.regularHoursSundayStart = "";
                    holidayHoursStart ? foundUserProfile.holidayHoursStart = holidayHoursStart : foundUserProfile.holidayHoursStart = "";

                    regularHoursMondayFinish ? foundUserProfile.regularHoursMondayFinish = regularHoursMondayFinish : foundUserProfile.regularHoursMondayFinish = "";
                    regularHoursTuesdayFinish ? foundUserProfile.regularHoursTuesdayFinish = regularHoursTuesdayFinish : foundUserProfile.regularHoursTuesdayFinish = "";
                    regularHoursWednesdayFinish ? foundUserProfile.regularHoursWednesdayFinish = regularHoursWednesdayFinish : foundUserProfile.regularHoursWednesdayFinish = "";
                    regularHoursThursdayFinish ? foundUserProfile.regularHoursThursdayFinish = regularHoursThursdayFinish : foundUserProfile.regularHoursThursdayFinish = "";
                    regularHoursFridayFinish ? foundUserProfile.regularHoursFridayFinish = regularHoursFridayFinish : foundUserProfile.regularHoursFridayFinish = "";
                    regularHoursSaturdayFinish ? foundUserProfile.regularHoursSaturdayFinish = regularHoursSaturdayFinish : foundUserProfile.regularHoursSaturdayFinish = "";
                    regularHoursSundayFinish ? foundUserProfile.regularHoursSundayFinish = regularHoursSundayFinish : foundUserProfile.regularHoursSundayFinish = "";
                    holidayHoursFinish ? foundUserProfile.holidayHoursFinish = holidayHoursFinish : foundUserProfile.holidayHoursFinish = "";
                    
                    closedOnMonday ?  foundUserProfile.closedOnMonday = closedOnMonday : foundUserProfile.closedOnMonday = false;
                    closedOnTuesday ?  foundUserProfile.closedOnTuesday = closedOnTuesday : foundUserProfile.closedOnTuesday = false;
                    closedOnWednesday ?  foundUserProfile.closedOnWednesday = closedOnWednesday : foundUserProfile.closedOnWednesday = false;
                    closedOnThursday ?  foundUserProfile.closedOnThursday = closedOnThursday : foundUserProfile.closedOnThursday = false;
                    closedOnFriday ?  foundUserProfile.closedOnFriday = closedOnFriday : foundUserProfile.closedOnFriday = false;
                    closedOnSaturday ?  foundUserProfile.closedOnSaturday = closedOnSaturday : foundUserProfile.closedOnSaturday = false;
                    closedOnSunday ?  foundUserProfile.closedOnSunday = closedOnSunday : foundUserProfile.closedOnSunday = false;
                    closedOnHolidays ?  foundUserProfile.closedOnHolidays = closedOnHolidays : foundUserProfile.closedOnHolidays = false;

                    address ? foundUserProfile.address = address : foundUserProfile.address = "";
                    city ? foundUserProfile.city = city : foundUserProfile.city = "";
                    region ? foundUserProfile.region = region : foundUserProfile.region = "";
                    regionCode ? foundUserProfile.regionCode = regionCode : foundUserProfile.regionCode = "";
                    country ? foundUserProfile.country = country : foundUserProfile.country = "";
                    manager ? foundUserProfile.manager = manager : foundUserProfile.manager = "";
                    chain ? foundUserProfile.chain = chain : foundUserProfile.chain = "";
                    chainId ? foundUserProfile.chainId = chainId : foundUserProfile.chainId = "";

                    const savedFoundProfile = await foundUserProfile.save()
                
                    const savedFoundUser = await foundUser.save()

                    if (savedFoundProfile && savedFoundUser) {
                        res.json({ message: "Success!" })
                    }
                }
            
            } else {

                phonePrimary ? foundUserProfile.phonePrimary = phonePrimary : foundUserProfile.phonePrimary = "";
                displayname ? foundUserProfile.displayname = displayname : foundUserProfile.displayname = "";
                announcements ? foundUserProfile.announcements = announcements : foundUserProfile.announcements = "";
                
                regularHoursMondayStart ? foundUserProfile.regularHoursMondayStart = regularHoursMondayStart : foundUserProfile.regularHoursMondayStart = "";
                regularHoursTuesdayStart ? foundUserProfile.regularHoursTuesdayStart = regularHoursTuesdayStart : foundUserProfile.regularHoursTuesdayStart = "";
                regularHoursWednesdayStart ? foundUserProfile.regularHoursWednesdayStart = regularHoursWednesdayStart : foundUserProfile.regularHoursWednesdayStart = "";
                regularHoursThursdayStart ? foundUserProfile.regularHoursThursdayStart = regularHoursThursdayStart : foundUserProfile.regularHoursThursdayStart = "";
                regularHoursFridayStart ? foundUserProfile.regularHoursFridayStart = regularHoursFridayStart : foundUserProfile.regularHoursFridayStart = "";
                regularHoursSaturdayStart ? foundUserProfile.regularHoursSaturdayStart = regularHoursSaturdayStart : foundUserProfile.regularHoursSaturdayStart = "";
                regularHoursSundayStart ? foundUserProfile.regularHoursSundayStart = regularHoursSundayStart : foundUserProfile.regularHoursSundayStart = "";
                holidayHoursStart ? foundUserProfile.holidayHoursStart = holidayHoursStart : foundUserProfile.holidayHoursStart = "";

                closedOnMonday ?  foundUserProfile.closedOnMonday = closedOnMonday : foundUserProfile.closedOnMonday = false;
                closedOnTuesday ?  foundUserProfile.closedOnTuesday = closedOnTuesday : foundUserProfile.closedOnTuesday = false;
                closedOnWednesday ?  foundUserProfile.closedOnWednesday = closedOnWednesday : foundUserProfile.closedOnWednesday = false;
                closedOnThursday ?  foundUserProfile.closedOnThursday = closedOnThursday : foundUserProfile.closedOnThursday = false;
                closedOnFriday ?  foundUserProfile.closedOnFriday = closedOnFriday : foundUserProfile.closedOnFriday = false;
                closedOnSaturday ?  foundUserProfile.closedOnSaturday = closedOnSaturday : foundUserProfile.closedOnSaturday = false;
                closedOnSunday ?  foundUserProfile.closedOnSunday = closedOnSunday : foundUserProfile.closedOnSunday = false;
                closedOnHolidays ?  foundUserProfile.closedOnHolidays = closedOnHolidays : foundUserProfile.closedOnHolidays = false;

                regularHoursMondayFinish ? foundUserProfile.regularHoursMondayFinish = regularHoursMondayFinish : foundUserProfile.regularHoursMondayFinish = "";
                regularHoursTuesdayFinish ? foundUserProfile.regularHoursTuesdayFinish = regularHoursTuesdayFinish : foundUserProfile.regularHoursTuesdayFinish = "";
                regularHoursWednesdayFinish ? foundUserProfile.regularHoursWednesdayFinish = regularHoursWednesdayFinish : foundUserProfile.regularHoursWednesdayFinish = "";
                regularHoursThursdayFinish ? foundUserProfile.regularHoursThursdayFinish = regularHoursThursdayFinish : foundUserProfile.regularHoursThursdayFinish = "";
                regularHoursFridayFinish ? foundUserProfile.regularHoursFridayFinish = regularHoursFridayFinish : foundUserProfile.regularHoursFridayFinish = "";
                regularHoursSaturdayFinish ? foundUserProfile.regularHoursSaturdayFinish = regularHoursSaturdayFinish : foundUserProfile.regularHoursSaturdayFinish = "";
                regularHoursSundayFinish ? foundUserProfile.regularHoursSundayFinish = regularHoursSundayFinish : foundUserProfile.regularHoursSundayFinish = "";
                holidayHoursFinish ? foundUserProfile.holidayHoursFinish = holidayHoursFinish : foundUserProfile.holidayHoursFinish = "";

                address ? foundUserProfile.address = address : foundUserProfile.address = "";
                city ? foundUserProfile.city = city : foundUserProfile.city = "";
                region ? foundUserProfile.region = region : foundUserProfile.region = "";
                regionCode ? foundUserProfile.regionCode = regionCode : foundUserProfile.regionCode = "";
                country ? foundUserProfile.country = country : foundUserProfile.country = "";
                manager ? foundUserProfile.manager = manager : foundUserProfile.manager = "";
                chain ? foundUserProfile.chain = chain : foundUserProfile.chain = "";
                chainId ? foundUserProfile.chainId = chainId : foundUserProfile.chainId = "";

                const savedFoundProfile = await foundUserProfile.save()
            
                const savedFoundUser = await foundUser.save()

                if (savedFoundProfile && savedFoundUser) {
                    res.json({ message: "Success!" })
                }
            }
        }
    })
}



const editSettingsStoreGeneral = async (req, res) => {

    const cookies = req.cookies;

    if (!cookies?.purchiesjwt) return res.sendStatus(401);
    const refreshToken = cookies.purchiesjwt;

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

    const { loggedUserId, lessMotion, privacySetting, pushNotifications, 
        userTheme, chain, chainId } = req.body

    // Confirm data 
    if ( !loggedUserId || typeof lessMotion !== 'boolean' || !privacySetting 
    || typeof pushNotifications !== 'boolean' || !userTheme || !chain || !chainId  ) {

        return res.status(400).json({ message: 'Missing required fields!' })
    }

    // Does the user exist to update?
    HostProfile.findOne({"_userId": loggedUserId }, async function(err, foundUserProfile){
        if(err){
            return res.status(400).json({ message: 'User not found' })
        }

        privacySetting ? foundUser.privacySetting = privacySetting : foundUser.privacySetting = "";

        lessMotion ? foundUserProfile.lessMotion = lessMotion : foundUserProfile.lessMotion = "";
        pushNotifications ? foundUserProfile.pushNotifications = pushNotifications : foundUserProfile.pushNotifications = "";
        userTheme ? foundUserProfile.userTheme = userTheme : foundUserProfile.userTheme = "";
        chain ? foundUserProfile.chain = chain : foundUserProfile.chain = "";
        chainId ? foundUserProfile.chainId = chainId : foundUserProfile.chainId = "";

        const savedFoundProfile = await foundUserProfile.save()
       
        const savedFoundUser = await foundUser.save()

        if (savedFoundProfile && savedFoundUser) {
            res.json({ message: "Success!" })
        }

    })
}

module.exports = { getHostProfile, editSettingsHostProfile }