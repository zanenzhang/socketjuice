const User = require('../../model/User')
const DriverProfile = require('../../model/DriverProfile');
const HostProfile = require('../../model/HostProfile');
const Bookmark = require('../../model/Bookmark');
const ActivateToken = require('../../model/ActivateToken');

const UsageLimit = require('../../model/UsageLimit');
const Flags = require('../../model/Flags');
const BannedUser = require('../../model/BannedUser');
const ForexRate = require('../../model/ForexRate');

const { sendPassResetConfirmation } = require('../../middleware/mailer');
const bcrypt = require('bcrypt');
const ObjectId  = require('mongodb').ObjectId;

const jwt = require('jsonwebtoken');
const fns = require('date-fns')
const S3 = require("aws-sdk/clients/s3");
const { deleteFile } = require("../media/s3Controller");
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
  

const getDriverProfile = async (req, res) => {
    
    const { profileUserId, loggedUserId } = req.query

    if (!profileUserId || !loggedUserId ) {
        return res.status(400).json({ message: 'Missing required info' })
    }

    try {

        const userProfile = await DriverProfile.findOne({_userId: profileUserId})
        const userFound = await User.findOne({_id: profileUserId}).select("_id profilePicURL firstName lastName pushNotifications emailNotifications smsNotifications")
        const flaggedList = await Flags.findOne({_userId: loggedUserId}).select("userFlags")
        const bookmarksFound = await Bookmark.findOne({_userId: loggedUserId})

        let donePostsData = false;
        let doneFlags = false;
        let doneUser = false;
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

            doneUser = true;
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

        if(donePostsData && userProfile && doneUser && bookmarksFound && doneFlags ){

            return res.status(200).json({userProfile, userFound, bookmarksFound, flaggedProfile })
        
        } else {


            return res.status(401).json({ message: 'Cannot get user information' })
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
        
        const {loggedUserId, firstname, lastname, profilePicKey, profilePicURL, pushNotifications, emailNotifications, smsNotifications,
            j1772ACChecked, ccs1DCChecked, mennekesACChecked, ccs2DCChecked, chademoDCChecked, gbtACChecked, gbtDCChecked, teslaChecked } = req.body
    
        if(!loggedUserId || !firstname || !foundUser._id.toString() === ((loggedUserId)) ) {
            return res.status(400).json({ 'message': 'Missing required fields!' });
        }

        if(firstname?.length > 48 || lastname?.length > 48 ){
            return res.status(400).json({ 'message': 'Content does not meet requirements' });
        }

        var textToCheck = firstname.concat(" ", lastname).toLowerCase();

        for(let i=0; i < languageList.length; i++){
            if(textToCheck.indexOf(languageList[i]) !== -1){
                return res.status(403).json({"message":"Inappropriate content"})  
            }
        }
    
        if (!loggedUserId) {
            return res.status(400).json({ message: 'Missing required fields!' })
        }

        const foundDriver = await DriverProfile.findOne({_userId: loggedUserId})
        
        if(foundDriver){

            if(!foundUser.profilePicKey && profilePicKey !== '' && profilePicURL !== ''){

                profilePicKey ? foundUser.profilePicKey = profilePicKey : null;
                profilePicURL ? foundUser.profilePicURL = profilePicURL : null;

                firstname ? foundUser.firstName = firstname : foundUser.firstName = "";
                lastname ? foundUser.lastName = lastname : foundUser.lastName = "";
                smsNotifications ? foundUser.smsNotifications = smsNotifications : foundUser.smsNotifications = false;
                pushNotifications ? foundUser.pushNotifications = pushNotifications : foundUser.pushNotifications = false;
                emailNotifications ? foundUser.emailNotifications = emailNotifications : foundUser.emailNotifications = false;
                
                j1772ACChecked ? foundDriver.j1772ACChecked = j1772ACChecked : foundDriver.j1772ACChecked = false;
                ccs1DCChecked ? foundDriver.ccs1DCChecked = ccs1DCChecked : foundDriver.ccs1DCChecked = false;
                mennekesACChecked ? foundDriver.mennekesACChecked = mennekesACChecked : foundDriver.mennekesACChecked = false;
                ccs2DCChecked ? foundDriver.ccs2DCChecked = ccs2DCChecked : foundDriver.ccs2DCChecked = false;
                chademoDCChecked ? foundDriver.chademoDCChecked = chademoDCChecked : foundDriver.chademoDCChecked = false;
                gbtACChecked ? foundDriver.gbtACChecked = gbtACChecked : foundDriver.gbtACChecked = false;
                gbtDCChecked ? foundDriver.gbtDCChecked = gbtDCChecked : foundDriver.gbtDCChecked = false;
                teslaChecked ? foundDriver.teslaChecked = teslaChecked : foundDriver.teslaChecked = false;
            
                const savedFoundUser = await foundUser.save()
                const savedFoundDriver = await foundDriver.save()

                if(savedFoundUser && savedFoundDriver) {
                    res.status(201).json({ message: "Success!" })
                }

            } else if(profilePicKey !== '' && (foundUser.profilePicKey !== profilePicKey)){

                const deleted = await deleteFile(foundUser.profilePicKey)

                if(deleted){

                    profilePicKey ? foundUser.profilePicKey = profilePicKey : null;
                    profilePicURL ? foundUser.profilePicURL = profilePicURL : null;

                    firstname ? foundUser.firstName = firstname : foundUser.firstName = "";
                    lastname ? foundUser.lastName = lastname : foundUser.lastName = "";
                    smsNotifications ? foundUser.smsNotifications = smsNotifications : foundUser.smsNotifications = false;
                    pushNotifications ? foundUser.pushNotifications = pushNotifications : foundUser.pushNotifications = false;
                    emailNotifications ? foundUser.emailNotifications = emailNotifications : foundUser.emailNotifications = false;

                    j1772ACChecked ? foundDriver.j1772ACChecked = j1772ACChecked : foundDriver.j1772ACChecked = false;
                    ccs1DCChecked ? foundDriver.ccs1DCChecked = ccs1DCChecked : foundDriver.ccs1DCChecked = false;
                    mennekesACChecked ? foundDriver.mennekesACChecked = mennekesACChecked : foundDriver.mennekesACChecked = false;
                    ccs2DCChecked ? foundDriver.ccs2DCChecked = ccs2DCChecked : foundDriver.ccs2DCChecked = false;
                    chademoDCChecked ? foundDriver.chademoDCChecked = chademoDCChecked : foundDriver.chademoDCChecked = false;
                    gbtACChecked ? foundDriver.gbtACChecked = gbtACChecked : foundDriver.gbtACChecked = false;
                    gbtDCChecked ? foundDriver.gbtDChecked = gbtDChecked : foundDriver.gbtDCChecked = false;
                    teslaChecked ? foundDriver.teslaChecked = teslaChecked : foundDriver.teslaChecked = false;
                
                    const savedFoundUser = await foundUser.save()
                    const savedFoundDriver = await foundDriver.save()

                    if(savedFoundUser && savedFoundDriver) {
                        res.status(201).json({ message: "Success!" })
                    }
                }
            
            } else {

                firstname ? foundUser.firstName = firstname : foundUser.firstName = "";
                lastname ? foundUser.lastName = lastname : foundUser.lastName = "";
                smsNotifications ? foundUser.smsNotifications = smsNotifications : foundUser.smsNotifications = false;
                pushNotifications ? foundUser.pushNotifications = pushNotifications : foundUser.pushNotifications = false;
                emailNotifications ? foundUser.emailNotifications = emailNotifications : foundUser.emailNotifications = false;

                j1772ACChecked ? foundDriver.j1772ACChecked = j1772ACChecked : foundDriver.j1772ACChecked = false;
                ccs1DCChecked ? foundDriver.ccs1DCChecked = ccs1DCChecked : foundDriver.ccs1DCChecked = false;
                mennekesACChecked ? foundDriver.mennekesACChecked = mennekesACChecked : foundDriver.mennekesACChecked = false;
                ccs2DCChecked ? foundDriver.ccs2DCChecked = ccs2DCChecked : foundDriver.ccs2DCChecked = false;
                chademoDCChecked ? foundDriver.chademoDCChecked = chademoDCChecked : foundDriver.chademoDCChecked = false;
                gbtACChecked ? foundDriver.gbtACChecked = gbtACChecked : foundDriver.gbtACChecked = false;
                gbtDCChecked ? foundDriver.gbtDCChecked = gbtDCChecked : foundDriver.gbtDCChecked = false;
                teslaChecked ? foundDriver.teslaChecked = teslaChecked : foundDriver.teslaChecked = false;
            
                const savedFoundUser = await foundUser.save()
                const savedFoundDriver = await foundDriver.save()

                if(savedFoundUser && savedFoundDriver) {
                    res.status(201).json({ message: "Success!" })
                }
            }

        } else {
            res.status(401).json({ message: "Operation failed!" })
        }
    })
}


const editProfilePic = async (req, res) => {
    
    const { userId, tempProfilePicKey, tempProfilePicURL } = req.body

    if ( !userId ||  !tempProfilePicKey ||!tempProfilePicURL ) {    
        return res.status(400).json({ message: 'Missing required fields!' })
    }

    const foundUser = await User.findOne({_id: userId})

    if(foundUser){

        if(tempProfilePicKey !== '' && foundUser.profilePicKey !== tempProfilePicKey && foundUser.profilePicKey !== ""
            && foundUser.profilePicURL !== '/images/avatars/defaultUserPic.svg'){

            const deleted = await deleteFile(foundUser.profilePicKey)

            if(deleted){

                tempProfilePicKey ? foundUser.profilePicKey = tempProfilePicKey : null;
                tempProfilePicURL ? foundUser.profilePicURL = tempProfilePicURL : null;
            
                const savedFoundUser = await foundUser.save()

                if (savedFoundUser) {
                    res.status(200).json({ message: "Success!" })
                }
            }

        } else {
            
            tempProfilePicKey ? foundUser.profilePicKey = tempProfilePicKey : null;
            tempProfilePicURL ? foundUser.profilePicURL = tempProfilePicURL : null;
        
            const savedFoundUser = await foundUser.save()

            if (savedFoundUser) {
                res.status(200).json({ message: "Success!" })
            }
        }

    } else {

        res.status(401).json({ message: 'Failed operation' })
    }   
}


const editSettingsUserPass = async (req, res) => {

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

        const { loggedUserId, oldPwd, newPwd } = req.body
    
        if ( !loggedUserId || ! foundUser._id.toString() === ((loggedUserId)) || !oldPwd || !newPwd){
            return res.status(400).json({ message: 'Missing required fields!' })
        }

        if ( oldPwd?.length > 48 || newPwd?.length > 48 || oldPwd?.length < 8 || newPwd?.length < 8 ){
            return res.status(400).json({ message: 'Content does not meet requirements!' })
        }

        const foundLimits = await UsageLimit.findOne({_userId: foundUser._id})

        if(foundLimits){

            if(foundLimits.passwordResetRequests >= 5){

                foundUser.lockedOut = true;

                const savedLimits = await foundLimits.save()
                const savedUser = await foundUser.save()

                if(savedLimits && savedUser){
                    return res.status(403).message({"message": "Password reset failed, account is now locked."})
                }

            } else {

                const match = await bcrypt.compare(oldPwd, foundUser.password);

                if(match){

                    const saltRounds = 10;

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

                    foundLimits.passwordResetRequests = foundLimits.passwordResetRequests + 1
                    const savedLimits = await foundLimits.save();

                    if(savedLimits){

                        return res.status(400).json({ 'message': 'Unsuccessful! Please try again!' });
                    }
                }
            }
        
        } else {

            return res.status(400).json({ 'message': 'Operation failed!' });
        }
    })
}

const editSettingsUserGeneral = async (req, res) => {

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

    const {email} = req.query

    if (!email || email.length > 48 || email.length < 4 ) {
        return res.status(400).json({ message: 'Missing required fields' })
    }

    try {

        const foundEmail = await User.findOne({email: email}) 

        if(foundEmail ){

            return res.status(200).json({email: 1})
        
        } else if (!foundEmail){

            return res.status(200).json({email: 0})
        }

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


const getUserData = async (req, res) => {

    const {userId} = req.query

    if (!userId) {
        return res.status(400).json({ message: 'Missing required info' })
    }

    console.log("Getting user data")
    console.log(userId)

    try {

        const foundUser = await User.findOne({_id: userId}).select("_id checkedMobile receivedIdApproval currency currencySymbol")
        const foundHost = await HostProfile.findOne({_userId: userId}).select("_id verifiedHostCharging submittedChargingForReview deactivated currency currencySymbol")

        if(foundUser && foundHost){

            return res.status(200).json({foundUser, foundHost}) 

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
            const foundHost = await HostProfile.findOne({_userId: bannedUserId})

            if(foundUser && foundHost){

                if(foundUser.deactivated === false){

                    foundUser.deactivated = true;
                    foundUser.active = false;
                    foundUser.refreshToken = "";
                    
                    foundHost.deactivated = true;
                    foundHost.verifiedHost = false;

                    const updateBan = await BannedUser.updateOne({admin: "admin"}, {$push: {ipAddresses: {userIP: foundUser.primaryGeoData.IPv4}}} )

                    const savedUpdate = await foundUser.save()
                    const savedHost = await foundHost.save()

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
            const foundHost = await HostProfile.findOne({_userId: bannedUserId})

            if(foundUser && foundHost){

                foundUser.deactivated = false;
                foundUser.active = true;

                foundHost.deactivated = false;
                foundHost.verifiedHost = true;

                const updateBan = await BannedUser.updateOne({admin: "admin"},{$pull: {ipAddresses: {"userIP": foundUser.primaryGeoData.IPv4}}})
                const savedUpdate = await foundUser.save()
                const savedHost = await foundHost.save()

                if(savedUpdate && updateBan && savedHost){
                    return res.status(200).json({'message': 'Added new ban'})
                }
            }
        }
    }
}


const makePrivate = async (req, res) => {

    const cookies = req.cookies;

    if (!cookies?.socketjuicejwt) return res.sendStatus(202);
    const refreshToken = cookies.socketjuicejwt;

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

        if(profileUser){

            profileUser.privacySetting = 2;

            const updatedUser = await profileUser.save();

            if(updatedUser){

                return res.status(200).json({'message': 'Added new ban'})
            
            } else {

                return res.status(403).json({ message: 'User ID Required' })
            }
        }    
    })
}

const makePublic = async (req, res) => {

    const cookies = req.cookies;

    if (!cookies?.socketjuicejwt) return res.sendStatus(202);
    const refreshToken = cookies.socketjuicejwt;

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

        if(profileUser){

            profileUser.privacySetting = 1

            const updatedUser = await profileUser.save();

            if(updatedUser){

                return res.status(200).json({'message': 'Added new ban'})
            
            } else {

                return res.status(403).json({ message: 'User ID Required' })
            }
        }    
    })
}


const editUserReceivePayments = async (req, res) => {

    const cookies = req.cookies;

    if (!cookies?.socketjuicejwt) return res.sendStatus(202);
    const refreshToken = cookies.socketjuicejwt;

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
        
        const profileUser = await User.findOne({_id: profileUserId})

        if(profileUser){

            if(Object.values(profileUser.roles).includes(3780)){

                const foundHostProfile = await HostProfile.findOne({_userId: profileUserId})

                if(foundHostProfile){

                    if(profileUser.canReceivePayments){
        
                        profileUser.canReceivePayments = 0
        
                        const updatedUser = await profileUser.save();
        
                        if(updatedUser){
        
                            return res.status(200).json({'message': 'Added new ban'})
                        
                        } else {
        
                            return res.status(403).json({ message: 'User ID Required' })
                        }
        
                    } else {
        
                        profileUser.canReceivePayments = 1
        
                        const updatedUser = await profileUser.save();
        
                        if(updatedUser){
        
                            return res.status(200).json({'message': 'Added new ban'})
                        
                        } else {
        
                            return res.status(403).json({ message: 'User ID Required' })
                        }
                    }
                }    

            } else {

                const foundUserProfile = await DriverProfile.findOne({_userId:profileUserId})

                if(foundUserProfile ){

                    if(profileUser.canReceivePayments){
        
                        profileUser.canReceivePayments = 0
        
                        const updatedUser = await profileUser.save();
        
                        if(updatedUser){
        
                            return res.status(200).json({'message': 'Added new ban'})
                        
                        } else {
        
                            return res.status(403).json({ message: 'User ID Required' })
                        }
        
                    } else {
        
                        profileUser.canReceivePayments = 1
        
                        const updatedUser = await profileUser.save();
        
                        if(updatedUser){
        
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


const uploadUserPhotos = async (req, res) => {

    var { userId, frontObjectId, backObjectId } = req.body

    if (!userId || !frontObjectId || !backObjectId ) {

        return res.status(400).json({ message: 'User ID Required' })
    }

    const foundUser = await User.findOne({_id: userId})
    const foundDriver = await DriverProfile.findOne({_userId: userId})

    if(foundUser && foundDriver){

        if(!foundUser.checkedMobile || foundUser.receivedIdApproval){
        
            return res.status(400).json({"message": "Operation failed"})
        
        } else {

            foundUser.frontObjectId = frontObjectId
            foundUser.backObjectId = backObjectId

            try{

                var signParamsFront = {
                    Bucket: wasabiPrivateBucketUSA, 
                    Key: frontObjectId, 
                    Expires: 7200
                };
    
                var signedURLFrontPhoto = s3.getSignedUrl('getObject', signParamsFront);
    

                var signParamsBack = {
                    Bucket: wasabiPrivateBucketUSA, 
                    Key: backObjectId, 
                    Expires: 7200
                };
    
                var signedURLBackPhoto = s3.getSignedUrl('getObject', signParamsBack);


                foundUser.frontMediaURL = signedURLFrontPhoto
                foundUser.backMediaURL = signedURLBackPhoto
                foundUser.currentStage = 3

                const userId = foundUser._id;
                const firstName = foundUser.firstName;
                const lastName = foundUser.lastName;
                const phoneNumber = foundUser.phonePrimary;
                const profilePicURL = foundUser.profilePicURL;
                const currency = foundUser.currency;
                const currencySymbol = foundUser.currencySymbol;
                const credits = foundUser.credits;

                const lessMotion = foundUser.lessMotion;
                const pushNotifications = foundUser.pushNotifications;
                const smsNotifications = foundUser.smsNotifications;
                const emailNotifications = foundUser.emailNotifications;
                const userTheme = foundUser.userTheme;

                const j1772ACChecked = foundDriver?.j1772ACChecked
                const ccs1DCChecked = foundDriver?.ccs1DCChecked
                const mennekesACChecked = foundDriver?.mennekesACChecked
                const gbtACChecked = foundDriver?.gbtACChecked
                const ccs2DCChecked = foundDriver?.ccs2DCChecked
                const chademoDCChecked = foundDriver?.chademoDCChecked
                const gbtDCChecked = foundDriver?.gbtDCChecked
                const teslaChecked = foundDriver?.teslaChecked

                const roles = Object.values(foundUser.roles).filter(Boolean);

                var FXRates = null;

                if(currency){

                    const rates = await ForexRate.findOne({admin: "admin"}).select(`${currency}`)
                    if(rates){
                        FXRates = rates;
                    }
                }

                const accessToken = jwt.sign(
                    {
                        "UserInfo": {
                            "userId": userId,
                            "roles": roles
                        }
                    },
                    process.env.ACCESS_TOKEN_SECRET,
                    { expiresIn: '7d' }
                );
    
                const refreshToken = jwt.sign(
                    { "userId": userId },
                    process.env.REFRESH_TOKEN_SECRET,
                    { expiresIn: '30d' }
                );

                if(refreshToken && accessToken){

                    foundUser.refreshToken = refreshToken;

                    const savedUser = await foundUser.save()
                    const removedToken = await ActivateToken.deleteMany({_userId: foundUser._id})

                    if(savedUser && removedToken){
                    
                        res.cookie('socketjuicejwt', refreshToken, { 
                            httpOnly: true, 
                            secure: true, 
                            sameSite: 'None', 
                            maxAge: 30 * 24 * 60 * 60 * 1000 
                        });

                        res.status(200).json({ firstName, lastName, userId, roles, accessToken, phoneNumber, profilePicURL, 
                            currency, currencySymbol, lessMotion, pushNotifications, smsNotifications, emailNotifications, 
                            userTheme, FXRates, credits, j1772ACChecked, ccs1DCChecked, mennekesACChecked, ccs2DCChecked, 
                            chademoDCChecked, gbtACChecked, gbtDCChecked, teslaChecked })
                    }
                }

            } catch(err){

                console.log(err)
                return res.status(400).json({"message": ""})
            }
        }

    } else {

        return res.status(400).json({"message": "Operation failed"})
    }

    // if(foundDriver && driverMediaObjectIds?.length > 0){

    //     var signedMediaURLs = []

    //     for(let i=0; i<driverMediaObjectIds?.length; i++){

    //         var signParams = {
    //             Bucket: wasabiPrivateBucketUSA, 
    //             Key: driverMediaObjectIds[i], 
    //             Expires: 7200
    //         };

    //         var signedURL = s3.getSignedUrl('getObject', signParams);
    //         signedMediaURLs.push(signedURL)
    //     }

    //     var signedVideoURLs = []

    //     for(let i=0; i< driverVideoObjectIds?.length; i++){

    //         if(driverVideoObjectIds[i] && driverVideoObjectIds[i] !== 'image'){
                
    //             var signParams = {
    //                 Bucket: wasabiPrivateBucketUSA, 
    //                 Key: driverVideoObjectIds[i], 
    //                 Expires: 7200
    //             };

    //             var signedURL = s3.getSignedUrl('getObject', signParams);
    //             signedVideoURLs.push(signedURL)

    //         } else {

    //             signedVideoURLs.push("image")
    //         }
    //     }

    //     var signedPreviewURL = signedMediaURLs[coverIndex]

    //     driverPreviewMediaObjectId ? foundDriver.previewMediaObjectId = driverPreviewMediaObjectId : null;
    //     driverMediaObjectIds ? foundDriver.mediaCarouselObjectIds = driverMediaObjectIds : null;
    //     driverVideoObjectIds ? foundDriver.videoCarouselObjectIds = driverVideoObjectIds : null;
    //     driverCoverIndex !== null ? foundDriver.coverIndex = driverCoverIndex : null;
    //     driverObjectTypes ? foundDriver.mediaCarouselObjectTypes = driverObjectTypes : null;
    //     driverPreviewObjectType ? foundDriver.previewMediaType = driverPreviewObjectType : null;

    //     signedPreviewURL ? foundDriver.previewMediaURL = signedPreviewURL : null;
    //     signedMediaURLs ? foundDriver.mediaCarouselURLs = signedMediaURLs : null;
    //     signedVideoURLs ? foundDriver.videoCarouselURLs = signedVideoURLs : null;

    //     const savedDriver = await foundDriver.save()

    //     if(savedDriver){
    //         doneDriver = true
    //     }   
    // } else {
    //     doneDriver = true
    // }

    // if(foundHost && hostMediaObjectIds?.length > 0) {

    //     var signedMediaURLs = []

    //     for(let i=0; i<hostMediaObjectIds?.length; i++){

    //         var signParams = {
    //             Bucket: wasabiPrivateBucketUSA, 
    //             Key: hostMediaObjectIds[i], 
    //             Expires: 7200
    //         };

    //         var signedURL = s3.getSignedUrl('getObject', signParams);
    //         signedMediaURLs.push(signedURL)
    //     }

    //     var signedVideoURLs = []

    //     for(let i=0; i< hostVideoObjectIds?.length; i++){

    //         if(hostVideoObjectIds[i] && hostVideoObjectIds[i] !== 'image'){
                
    //             var signParams = {
    //                 Bucket: wasabiPrivateBucketUSA, 
    //                 Key: hostVideoObjectIds[i], 
    //                 Expires: 7200
    //             };

    //             var signedURL = s3.getSignedUrl('getObject', signParams);
    //             signedVideoURLs.push(signedURL)

    //         } else {

    //             signedVideoURLs.push("image")
    //         }
    //     }

    //     var signedPreviewURL = signedMediaURLs[coverIndex]

    //     hostPreviewMediaObjectId ? foundHost.previewMediaObjectId = hostPreviewMediaObjectId : null;
    //     hostMediaObjectIds ? foundHost.mediaCarouselObjectIds = hostMediaObjectIds : null;
    //     hostVideoObjectIds ? foundHost.videoCarouselObjectIds = hostVideoObjectIds : null;
    //     hostCoverIndex !== null ? foundHost.coverIndex = hostCoverIndex : null;
    //     hostObjectTypes ? foundHost.mediaCarouselObjectTypes = hostObjectTypes : null;
    //     hostPreviewObjectType ? foundHost.previewMediaType = hostPreviewObjectType : null;

    //     signedPreviewURL ? foundHost.previewMediaURL = signedPreviewURL : null;
    //     signedMediaURLs ? foundHost.mediaCarouselURLs = signedMediaURLs : null;
    //     signedVideoURLs ? foundHost.videoCarouselURLs = signedVideoURLs : null;

    //     const savedHost = await foundHost.save()

    //     if(savedHost){
    //         doneHost = true
    //     }  
    
    // } else {

    //     doneHost = true
    // }

    // if(doneUser && doneHost && doneDriver){

    //     return res.status(200).json({"message": "Operation success"})
    
    // } else {

    //     return res.status(400).json({ message: 'Operation failed' })
    // }
}



const updateDriverProfile = async (req, res) => {

    const { userId, driverPreviewMediaObjectId, driverMediaObjectIds, driverVideoObjectIds, driverObjectTypes, 
        driverPreviewObjectType, driverCoverIndex } = req.body

    if (!userId || !driverMediaObjectIds ) {
        return res.status(400).json({ message: 'User ID Required' })
    }

    const foundDriver = await DriverProfile.findOne({_id: userId})

    var doneDriver = false;

    if(foundDriver && driverMediaObjectIds?.length > 0){

        var signedMediaURLs = []

        for(let i=0; i<driverMediaObjectIds?.length; i++){

            var signParams = {
                Bucket: wasabiPrivateBucketUSA, 
                Key: driverMediaObjectIds[i], 
                Expires: 7200
            };

            var signedURL = s3.getSignedUrl('getObject', signParams);
            signedMediaURLs.push(signedURL)
        }

        var signedVideoURLs = []

        for(let i=0; i< driverVideoObjectIds?.length; i++){

            if(driverVideoObjectIds[i] && driverVideoObjectIds[i] !== 'image'){
                
                var signParams = {
                    Bucket: wasabiPrivateBucketUSA, 
                    Key: driverVideoObjectIds[i], 
                    Expires: 7200
                };

                var signedURL = s3.getSignedUrl('getObject', signParams);
                signedVideoURLs.push(signedURL)

            } else {

                signedVideoURLs.push("image")
            }
        }

        var signedPreviewURL = signedMediaURLs[coverIndex]

        driverPreviewMediaObjectId ? foundDriver.previewMediaObjectId = driverPreviewMediaObjectId : null;
        driverMediaObjectIds ? foundDriver.mediaCarouselObjectIds = driverMediaObjectIds : null;
        driverVideoObjectIds ? foundDriver.videoCarouselObjectIds = driverVideoObjectIds : null;
        driverCoverIndex !== null ? foundDriver.coverIndex = driverCoverIndex : null;
        driverObjectTypes ? foundDriver.mediaCarouselObjectTypes = driverObjectTypes : null;
        driverPreviewObjectType ? foundDriver.previewMediaType = driverPreviewObjectType : null;

        signedPreviewURL ? foundDriver.previewMediaURL = signedPreviewURL : null;
        signedMediaURLs ? foundDriver.mediaCarouselURLs = signedMediaURLs : null;
        signedVideoURLs ? foundDriver.videoCarouselURLs = signedVideoURLs : null;

        const savedDriver = await foundDriver.save()

        if(savedDriver){
            doneDriver = true
        }   
    } else {
        doneDriver = true
    }

    if(doneDriver){

        return res.status(200).json({"message": "Operation success"})
    
    } else {

        return res.status(400).json({ message: 'Operation failed' })
    }
}


const addHostProfile = async (req, res) => {

    var { userId, hostPreviewMediaObjectId, hostMediaObjectIds, hostVideoObjectIds, hostObjectTypes, 
        hostPreviewObjectType, hostCoverIndex, chargeRate, currency, connectorType, secondaryConnectorType, chargingLevel,
        hoursMondayStart, hoursMondayFinish, hoursTuesdayStart, hoursTuesdayFinish, hoursWednesdayStart, hoursWednesdayFinish, hoursThursdayStart, hoursThursdayFinish,
        hoursFridayStart, hoursFridayFinish, hoursSaturdayStart, hoursSaturdayFinish, hoursSundayStart, hoursSundayFinish,
        holidayHoursStart, holidayHoursFinish, 
        closedOnMonday, closedOnTuesday, closedOnWednesday, closedOnThursday, closedOnFriday, closedOnSaturday, closedOnSunday, closedOnHolidays,
        allDayMonday, allDayTuesday, allDayWednesday, allDayThursday, allDayFriday, allDaySaturday, allDaySunday, allDayHolidays,
        hostComments,
         } = req.body

    console.log("Adding new host profile")

    console.log(userId, hostPreviewMediaObjectId, hostMediaObjectIds, hostVideoObjectIds, hostObjectTypes, 
        hostPreviewObjectType, hostCoverIndex, chargeRate, currency, connectorType, secondaryConnectorType, chargingLevel,
        hoursMondayStart, hoursMondayFinish, hoursTuesdayStart, hoursTuesdayFinish, hoursWednesdayStart, hoursWednesdayFinish, hoursThursdayStart, hoursThursdayFinish,
        hoursFridayStart, hoursFridayFinish, hoursSaturdayStart, hoursSaturdayFinish, hoursSundayStart, hoursSundayFinish,
        holidayHoursStart, holidayHoursFinish, 
        closedOnMonday, closedOnTuesday, closedOnWednesday, closedOnThursday, closedOnFriday, closedOnSaturday, closedOnSunday, closedOnHolidays,
        allDayMonday, allDayTuesday, allDayWednesday, allDayThursday, allDayFriday, allDaySaturday, allDaySunday, allDayHolidays,
        hostComments)

    if (!userId || !hostMediaObjectIds || hostMediaObjectIds?.length < 2 ) {
        return res.status(400).json({ message: 'User ID Required' })
    }

    const foundUser = await User.findOne({_id: userId})
    const foundDriver = await DriverProfile.findOne({_userId: userId})
    const foundHost = await HostProfile.findOne({_userId: userId})

    if(foundUser && foundDriver && foundHost){

        currency = currency.toLowerCase()

        chargeRate = Number(chargeRate)

        var currencySymbol = "$"

        if(currency === 'usd'){
            currencySymbol = '$'
        } else if (currency === 'cad') {
            currencySymbol = '$'
        } else if (currency === 'eur'){
            currencySymbol = '€'
        } else if (currency === 'gbp'){
            currencySymbol = '£'
        } else if (currency === 'inr'){
            currencySymbol = '₹'
        } else if (currency === 'jpy'){
            currencySymbol = '¥'
        } else if (currency === 'cny'){
            currencySymbol = '¥'
        } else if (currency === 'aud'){
            currencySymbol = '$'
        } else if (currency === 'nzd'){
            currencySymbol =  '$'
        }

        foundHost.connectionType = connectorType
        foundHost.secondaryConnectionType = secondaryConnectorType
        foundHost.chargingLevel = chargingLevel
        hostComments ? foundHost.hostComments = hostComments : ""

        if(connectorType === 'AC-J1772-Type1' || secondaryConnectorType === 'AC-J1772-Type1'){
            foundDriver.j1772ACChecked = true
        
        } else if(connectorType === 'AC-Mennekes-Type2' || secondaryConnectorType === 'AC-Mennekes-Type2'){
            foundDriver.mennekesACChecked = true

        } else if(connectorType === 'AC-GB/T' || secondaryConnectorType === 'AC-GB/T'){
            foundDriver.gbtACChecked = true
        
        } else if(connectorType === 'DC-CCS1' || secondaryConnectorType === 'DC-CCS1'){
            foundDriver.ccs1DCChecked = true
        
        } else if(connectorType === 'DC-CCS2' || secondaryConnectorType === 'DC-CCS2'){
            foundDriver.ccs2DCChecked = true
        
        } else if(connectorType === 'DC-CHAdeMO' || secondaryConnectorType === 'DC-CHAdeMO'){
            foundDriver.chademoDCChecked = true
        
        } else if(connectorType === 'DC-GB/T' || secondaryConnectorType === 'DC-GB/T'){
            foundDriver.gbtDCChecked = true
        
        } else if(connectorType === 'Tesla' || secondaryConnectorType === 'Tesla'){
            foundDriver.teslaChecked = true
        }    

        foundHost.chargeRatePerHalfHour = chargeRate
        foundHost.currency = currency
        foundHost.currencySymbol = currencySymbol

        foundHost.submittedChargingForReview = true;

        var signedMediaURLs = []

        for(let i=0; i<hostMediaObjectIds?.length; i++){

            var signParams = {
                Bucket: wasabiPrivateBucketUSA, 
                Key: hostMediaObjectIds[i], 
                Expires: 7200
            };

            var signedURL = s3.getSignedUrl('getObject', signParams);
            signedMediaURLs.push(signedURL)
        }

        var signedVideoURLs = []

        for(let i=0; i< hostVideoObjectIds?.length; i++){

            if(hostVideoObjectIds[i] && hostVideoObjectIds[i] !== 'image'){
                
                var signParams = {
                    Bucket: wasabiPrivateBucketUSA, 
                    Key: hostVideoObjectIds[i], 
                    Expires: 7200
                };

                var signedURL = s3.getSignedUrl('getObject', signParams);
                signedVideoURLs.push(signedURL)

            } else {

                signedVideoURLs.push("image")
            }
        }

        var signedPreviewURL = signedMediaURLs[hostCoverIndex]

        hostPreviewMediaObjectId ? foundHost.previewMediaObjectId = hostPreviewMediaObjectId : null;
        hostMediaObjectIds ? foundHost.mediaCarouselObjectIds = hostMediaObjectIds : null;
        hostVideoObjectIds ? foundHost.videoCarouselObjectIds = hostVideoObjectIds : null;
        hostCoverIndex !== null ? foundHost.coverIndex = hostCoverIndex : null;
        hostObjectTypes ? foundHost.mediaCarouselObjectTypes = hostObjectTypes : null;
        hostPreviewObjectType ? foundHost.previewMediaType = hostPreviewObjectType : null;

        signedPreviewURL ? foundHost.previewMediaURL = signedPreviewURL : null;
        signedMediaURLs ? foundHost.mediaCarouselURLs = signedMediaURLs : null;
        signedVideoURLs ? foundHost.videoCarouselURLs = signedVideoURLs : null;
        
        closedOnMonday ?  foundHost.closedOnMonday = closedOnMonday : foundHost.closedOnMonday = false;
        closedOnTuesday ?  foundHost.closedOnTuesday = closedOnTuesday : foundHost.closedOnTuesday = false;
        closedOnWednesday ?  foundHost.closedOnWednesday = closedOnWednesday : foundHost.closedOnWednesday = false;
        closedOnThursday ?  foundHost.closedOnThursday = closedOnThursday : foundHost.closedOnThursday = false;
        closedOnFriday ?  foundHost.closedOnFriday = closedOnFriday : foundHost.closedOnFriday = false;
        closedOnSaturday ?  foundHost.closedOnSaturday = closedOnSaturday : foundHost.closedOnSaturday = false;
        closedOnSunday ?  foundHost.closedOnSunday = closedOnSunday : foundHost.closedOnSunday = false;
        closedOnHolidays ?  foundHost.closedOnHolidays = closedOnHolidays : foundHost.closedOnHolidays = false;

        allDayMonday ?  foundHost.allDayMonday = allDayMonday : foundHost.allDayMonday = false;
        allDayTuesday ?  foundHost.allDayTuesday = allDayTuesday : foundHost.allDayTuesday = false;
        allDayWednesday ?  foundHost.allDayWednesday = allDayWednesday : foundHost.allDayWednesday = false;
        allDayThursday ?  foundHost.allDayThursday = allDayThursday : foundHost.allDayThursday = false;
        allDayFriday ?  foundHost.allDayFriday = allDayFriday : foundHost.allDayFriday = false;
        allDaySaturday ?  foundHost.allDaySaturday = allDaySaturday : foundHost.closedOnSaturday = false;
        allDaySunday ?  foundHost.allDaySunday = allDaySunday : foundHost.closedOnSunday = false;
        allDayHolidays ?  foundHost.allDayHolidays = allDayHolidays : foundHost.closedOnHolidays = false;

        hoursMondayStart ? foundHost.hoursMondayStart = hoursMondayStart : foundHost.hoursMondayStart = "";
        hoursTuesdayStart ? foundHost.hoursTuesdayStart = hoursTuesdayStart : foundHost.hoursTuesdayStart = "";
        hoursWednesdayStart ? foundHost.hoursWednesdayStart = hoursWednesdayStart : foundHost.hoursWednesdayStart = "";
        hoursThursdayStart ? foundHost.hoursThursdayStart = hoursThursdayStart : foundHost.hoursThursdayStart = "";
        hoursFridayStart ? foundHost.hoursFridayStart = hoursFridayStart : foundHost.hoursFridayStart = "";
        hoursSaturdayStart ? foundHost.hoursSaturdayStart = hoursSaturdayStart : foundHost.hoursSaturdayStart = "";
        hoursSundayStart ? foundHost.hoursSundayStart = hoursSundayStart : foundHost.hoursSundayStart = "";
        holidayHoursStart ? foundHost.holidayHoursStart = holidayHoursStart : foundHost.holidayHoursStart = "";

        hoursMondayFinish ? foundHost.hoursMondayFinish = hoursMondayFinish : foundHost.hoursMondayFinish = "";
        hoursTuesdayFinish ? foundHost.hoursTuesdayFinish = hoursTuesdayFinish : foundHost.hoursTuesdayFinish = "";
        hoursWednesdayFinish ? foundHost.hoursWednesdayFinish = hoursWednesdayFinish : foundHost.hoursWednesdayFinish = "";
        hoursThursdayFinish ? foundHost.hoursThursdayFinish = hoursThursdayFinish : foundHost.hoursThursdayFinish = "";
        hoursFridayFinish ? foundHost.hoursFridayFinish = hoursFridayFinish : foundHost.hoursFridayFinish = "";
        hoursSaturdayFinish ? foundHost.hoursSaturdayFinish = hoursSaturdayFinish : foundHost.hoursSaturdayFinish = "";
        hoursSundayFinish ? foundHost.hoursSundayFinish = hoursSundayFinish : foundHost.hoursSundayFinish = "";
        holidayHoursFinish ? foundHost.holidayHoursFinish = holidayHoursFinish : foundHost.holidayHoursFinish = "";

        const savedHost = await foundHost.save()

        if(savedHost){
            console.log("Saved new host profile")
            return res.status(200).json({"message": "Operation success"})
        }
    
    } else {
        
        return res.status(400).json({ message: 'Operation failed' })
    }   
}

const checkStage = async (req, res) => {
    
    const { userId } = req.query

    if (!userId ) {
        return res.status(400).json({ message: 'Missing required info' })
    }

    try {

        const foundUser = await User.findOne({_id: userId})

        if(foundUser){
            return res.status(200).json({currentStage: foundUser.currentStage, currency: foundUser.currency})
        }

    } catch(err){

        console.log(err)

    }
}


module.exports = { getDriverProfile, editSettingsUserProfile, editSettingsUserPass, editSettingsUserGeneral, 
    editProfilePic, getUserIdByUsername, getProfilePicByUserId, checkUser, getProfileData, 
    deleteOldProfilePic, addUserBan, removeUserBan, makePrivate, makePublic, checkStage, getUserData,
    editUserReceivePayments, uploadUserPhotos, updateDriverProfile, 
    addHostProfile }