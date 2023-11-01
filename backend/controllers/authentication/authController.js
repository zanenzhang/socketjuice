const User = require('../../model/User');
const DriverProfile = require('../../model/DriverProfile');
const HostProfile = require('../../model/HostProfile');
const ForexRate = require('../../model/ForexRate');
const BannedUser = require('../../model/BannedUser');
const ExternalWall = require('../../model/ExternalWall');

const UsageLimit = require('../../model/UsageLimit');
const Flags = require('../../model/Flags')

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const handleLogin = async (req, res) => {

    var { email, pwd, geoData } = req.body;

    if (!email || !pwd ) {
        return res.status(400).json({ 'message': 'Missing required input.' });
    }

    try {

        const checkUser = await BannedUser.findOne({admin:"admin"})

        if(!geoData){
            geoData = {"IPv4": ""}
        }
        
        if(geoData?.IPv4 && checkUser?.ipAddresses?.some(e=>e.userIP === geoData?.IPv4)){

            return res.status(403).json({ 'message': 'Unauthorized access' });
            
        } else {

            const foundUser = await User.findOne({ email: email })

            if (!foundUser) {

                return res.sendStatus(401); //Unauthorized
            
            } else {

                if(foundUser?.deactivated === true){
                    return res.status(403).json({'message': 'Please check your inbox.' });
                }

                if(foundUser?.checkedMobile === false){
                    return res.status(202).json({'message': "Please check your email to activate and verify your phone number"})
                }
        
                if(geoData?.IPv4 !== ""){
        
                    const foundWall = await ExternalWall.findOne({userIP: geoData.IPv4})
        
                    if(foundUser?.lockedOut === true){
        
                        if(foundWall){
                            foundWall.Total_LockedLoginAttempts = foundWall.Total_LockedLoginAttempts + 1
        
                            if(foundWall.Total_LockedLoginAttempts >=3){
                                const addIPBan = await BannedUser.updateOne({admin:"admin"},{$push: {ipAddresses: {userIP: geoData.IPv4}}})
                                if(addIPBan){
                                    return res.status(403).json({ 'message': 'Please check your inbox.' });
                                }
                            } else {
                                return res.status(401).json({'message': 'You have been locked out of your account, please reset your password'})
                            }
                        
                        } else {
                            return res.status(401).json({'message': 'You have been locked out of your account, please reset your password'})
                        }
                    }
                
                } else {

                    if (!foundUser.active) return res.status(400).json({ 'message': 'Please activate your account! The activation email has been sent, please visit your inbox.' });
        
                    const match = await bcrypt.compare(pwd, foundUser.password);
            
                    if(match){

                        const roles = Object.values(foundUser.roles).filter(Boolean);
                        
                        const userId = foundUser._id;
                        const firstName = foundUser.firstName;
                        const lastName = foundUser.lastName;
                        const profilePicURL = foundUser.profilePicURL;
                        const currency = foundUser.currency;
                        const credits = foundUser.credits;

                        const lessMotion = foundUser.lessMotion;
                        const pushNotifications = foundUser.pushNotifications;
                        const userTheme = foundUser.userTheme;

                        foundUser.loginAttempts = 0;

                        var doneProfile = true;
                        var doneRates = false;
                        var FXRates = false;

                        if(currency){

                            const rates = await ForexRate.findOne({admin: "admin"}).select(`${currency}`)
                            if(rates){
                                FXRates = rates;
                                doneRates = true;
                            }
                        }
            
                        if(doneProfile && doneRates){

                            var updatedWall = false;
            
                            if(geoData?.IPv4){
                
                                const foundWall = await ExternalWall.findOne({userIP: geoData.IPv4})
                
                                if(foundWall){
                                    foundWall.Total_LoginAttempts = 0;
                                    foundWall.Total_LockedLoginAttempts = 0;
                                    foundWall.Total_PassResets = 0;
                                    
                                    const savedWall = await foundWall.save()
                                    
                                    if(savedWall){
                                        updatedWall = true;
                                    }
                
                                } else {
                                    updatedWall = true;
                                }
                                
                            } else {
                                updatedWall = true;
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
                
                            if(refreshToken && accessToken && updatedWall){
                                // Saving refreshToken with current user
                                foundUser.refreshToken = refreshToken;
                                const result = await foundUser.save();
                
                                if(result){
                                    
                                    res.cookie('socketjuicejwt', refreshToken, { 
                                        httpOnly: true, 
                                        secure: true, 
                                        sameSite: 'None', 
                                        maxAge: 30 * 24 * 60 * 60 * 1000 
                                    });
                
                                    // Send authorization role and access token to user
                                    res.status(200).json({ firstName, lastName, userId, roles, accessToken, profilePicURL, 
                                        currency, lessMotion, pushNotifications, userTheme, FXRates, credits });
                                }
                            }
                        }
                        
                    } else {
            
                        if(geoData?.IPv4 !== ''){
            
                            const foundWall = await ExternalWall.findOneAndUpdate({userIP: geoData?.IPv4},{$inc: {Total_LoginAttempts: 1}})
                        
                            if(foundWall){
            
                                if(foundWall.Total_LoginAttempts >= 10){
                                    
                                    const addUserBan = await BannedUser.updateOne({admin: "admin"},{$push: {ipAddresses: {userIP: geoData.IPv4}}})
            
                                    if(addUserBan){
            
                                        if(foundUser.loginAttempts >= 5){
                                            foundUser.lockedOut = true;
                                        } else {
                                            foundUser.loginAttempts = foundUser.loginAttempts + 1
                                        }
                        
                                        const savedUser = await foundUser.save()
                                        const savedWall = await foundWall.save()
                        
                                        if(savedUser && savedWall){
                                            res.sendStatus(401);        
                                        }
                                    }
                                    
                                } else {
            
                                    if(foundUser.loginAttempts >= 5){
                                        foundUser.lockedOut = true;
                                    } else {
                                        foundUser.loginAttempts = foundUser.loginAttempts + 1
                                    }
                    
                                    const savedUser = await foundUser.save()
                                    const savedWall = await foundWall.save()
                    
                                    if(savedUser && savedWall){
                                        res.sendStatus(401);        
                                    }
                                }             
                            } else {
                                res.sendStatus(401);        
                            }
            
                        } else {
            
                            if(foundUser.loginAttempts >= 5){
                                foundUser.lockedOut = true;
                            } else {
                                foundUser.loginAttempts = foundUser.loginAttempts + 1
                            }
            
                            const savedUser = await foundUser.save()
            
                            if(savedUser){
                                res.sendStatus(401);        
                            }
                        }
                    }
                }
            }
        }

    } catch (err){

        console.log(err)
        return res.status(402)
    }
}



const uploadUserIdPhotos = async (res, req) => {

    const { userId, identificationFrontObjectId, identificationBackObjectId,
        driverPreviewMediaObjectId, driverMediaObjectIds, driverVideoObjectIds, driverObjectTypes, driverPreviewObjectType, driverCoverIndex,
        hostPreviewMediaObjectId, hostMediaObjectIds, hostVideoObjectIds, hostObjectTypes, hostPreviewObjectType, hostCoverIndex,
         } = req.body

    if (!userId || !identificationFrontObjectId || !identificationBackObjectId) {
        return res.status(400).json({ message: 'User ID Required' })
    }

    const foundUser = await User.findOne({_id: userId})
    const foundDriver = await DriverProfile.findOne({_id: userId})
    const foundHost = await HostProfile.findOne({_id: userId})

    var doneUser = false;
    var doneDriver = false;
    var doneHost = false;

    if(foundUser ){

        if(!foundUser.checkedMobile || !foundUser.receivedIdApproval){
        
            return res.status(400).json({"message": "Operation failed"})
        
        } else {

            foundUser.identificationFrontObjectId = identificationFrontObjectId
            foundUser.identificationBackObjectId = identificationBackObjectId

            try{

                var signParams = {
                    Bucket: wasabiPrivateBucketUSA, 
                    Key: identificationFrontObjectId, 
                    Expires: 7200
                };
    
                var signedURLFrontPhoto = s3.getSignedUrl('getObject', signParams);
    
                var signParams = {
                    Bucket: wasabiPrivateBucketUSA, 
                    Key: identificationBackObjectId, 
                    Expires: 7200
                };
    
                var signedURLBackPhoto = s3.getSignedUrl('getObject', signParams);

                foundUser.identificationFrontMediaURL = signedURLFrontPhoto
                foundUser.identificationBackMediaURL = signedURLBackPhoto

            } catch(err){

                console.log(err)
                return res.status(400).json({"message": ""})
            }

            const savedUser = await foundUser.save()

            if(savedUser){
                doneUser = true
            }
        }

    } else {

        return res.status(400).json({"message": "Operation failed"})
    }

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

    if(foundHost && hostMediaObjectIds?.length > 0) {

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

        var signedPreviewURL = signedMediaURLs[coverIndex]

        hostPreviewMediaObjectId ? foundHost.previewMediaObjectId = hostPreviewMediaObjectId : null;
        hostMediaObjectIds ? foundHost.mediaCarouselObjectIds = hostMediaObjectIds : null;
        hostVideoObjectIds ? foundHost.videoCarouselObjectIds = hostVideoObjectIds : null;
        hostCoverIndex !== null ? foundHost.coverIndex = hostCoverIndex : null;
        hostObjectTypes ? foundHost.mediaCarouselObjectTypes = hostObjectTypes : null;
        hostPreviewObjectType ? foundHost.previewMediaType = hostPreviewObjectType : null;

        signedPreviewURL ? foundHost.previewMediaURL = signedPreviewURL : null;
        signedMediaURLs ? foundHost.mediaCarouselURLs = signedMediaURLs : null;
        signedVideoURLs ? foundHost.videoCarouselURLs = signedVideoURLs : null;

        const savedHost = await foundHost.save()

        if(savedHost){
            doneHost = true
        }  
    
    } else {

        doneHost = true
    }

    if(doneUser && doneHost && doneDriver){

        return res.status(200).json({"message": "Operation success"})
    
    } else {

        return res.status(400).json({ message: 'Operation failed' })
    }
}



const uploadDriverPhotos = async (req, res) => {

    const { userId, driverPreviewMediaObjectId, driverMediaObjectIds, driverVideoObjectIds, driverObjectTypes, driverPreviewObjectType, driverCoverIndex } = req.body

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


const uploadHostPhotos = async (req, res) => {

    const { userId, hostPreviewMediaObjectId, hostMediaObjectIds, hostVideoObjectIds, hostObjectTypes, hostPreviewObjectType, hostCoverIndex } = req.body

    if (!userId || !hostMediaObjectIds ) {
        return res.status(400).json({ message: 'User ID Required' })
    }

    const foundHost = await HostProfile.findOne({_id: userId})

    var doneHost = false;

    if(foundHost && hostMediaObjectIds?.length > 0) {

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

        var signedPreviewURL = signedMediaURLs[coverIndex]

        hostPreviewMediaObjectId ? foundHost.previewMediaObjectId = hostPreviewMediaObjectId : null;
        hostMediaObjectIds ? foundHost.mediaCarouselObjectIds = hostMediaObjectIds : null;
        hostVideoObjectIds ? foundHost.videoCarouselObjectIds = hostVideoObjectIds : null;
        hostCoverIndex !== null ? foundHost.coverIndex = hostCoverIndex : null;
        hostObjectTypes ? foundHost.mediaCarouselObjectTypes = hostObjectTypes : null;
        hostPreviewObjectType ? foundHost.previewMediaType = hostPreviewObjectType : null;

        signedPreviewURL ? foundHost.previewMediaURL = signedPreviewURL : null;
        signedMediaURLs ? foundHost.mediaCarouselURLs = signedMediaURLs : null;
        signedVideoURLs ? foundHost.videoCarouselURLs = signedVideoURLs : null;

        const savedHost = await foundHost.save()

        if(savedHost){
            doneHost = true
        }
    
    } else {

        doneHost = true
    }

    if(doneHost){

        return res.status(200).json({"message": "Operation success"})
    
    } else {

        return res.status(400).json({ message: 'Operation failed' })
    }
}


// const deletedTokens = await ActivateToken.deleteMany( { _userId : foundUser._id} )

//                   if(deletedTokens){

module.exports = { handleLogin, uploadUserIdPhotos, uploadDriverPhotos, uploadHostPhotos };