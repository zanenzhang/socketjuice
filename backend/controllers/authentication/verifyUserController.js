const User = require("../../model/User")
const DriverProfile = require("../../model/DriverProfile");
const HostProfile = require("../../model/HostProfile");
const ActivateToken = require("../../model/ActivateToken");
const jwt = require('jsonwebtoken');
const S3 = require("aws-sdk/clients/s3");
const { deleteFile } = require("../media/s3Controller");
const { sendReverifyEmail } = require("../../middleware/mailer")
const crypto = require('crypto');

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



const approveUserProfilePhone = async (req, res) => {

    const { userId, phoneNumber } = req.body;

    if(!userId || !phoneNumber ){
        return res.status(400).json({ 'message': 'Missing required fields!' });
    }

    const foundUser = await User.findOne({_id: userId})

    if(foundUser){

        foundUser.phonePrimary = phoneNumber
        foundUser.checkedMobile = true

        const savedUser = await foundUser.save()

        if(savedUser){
            return res.status(200).json({"message": "Success"})
        }
    
    } else {
        return res.status(400).json({"message": "Operation failed"})
    }
}

const approveUserIdPhotos = async (req, res) => {

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

        const { userId } = req.body

        if (!userId || !(Object.values(foundUser.roles).includes(5150)) ){

            return res.status(400).json({ 'message': 'Missing required fields!' });
        }

        const checkUser = await User.findOne({_id: userId})

        if(checkUser){

            checkUser.receivedIdApproval = true
            checkUser.deactivated = false;

            const savedUser = await checkUser.save()

            if(savedUser){

                return res.status(200).json({"message": "Success"})
            }
        }
    })
}

const rejectUserUploads = async (req, res) => {

    const cookies = req.cookies;

    if (!cookies?.socketjuicejwt) return res.sendStatus(401);
    const refreshToken = cookies.socketjuicejwt;

    User.findOne({ refreshToken }, async function(err, foundUser){

        if (err || !foundUser) return res.sendStatus(403); 
    
        jwt.verify(
            refreshToken,
            process.env.REFRESH_TOKEN_SECRET,
            (err, decoded) => {

                if (err || foundUser.username !== decoded.username || !foundUser._id.toString() === ((decoded.userId)) || !(Object.values(foundUser.roles).includes(5150)) ) {
                    return res.sendStatus(403);
                }
            }
        )

        const { userId } = req.body;

        if( !userId ){
            return res.status(400).json({ 'message': 'Missing required fields!' });
        }

        const checkUser = await User.findOne({_id: userId})

        const token = crypto.randomBytes(16).toString('hex')

        const actToken = await ActivateToken.create({
            "_userId": userId,
            "token": token
        })

        if(checkUser && actToken){

            checkUser.frontObjectId = ""
            checkUser.frontMediaURL = ""
            checkUser.backObjectId = ""
            checkUser.backMediaURL = ""
            checkUser.profilePicKey = ""
            checkUser.profilePicURL = ""

            checkUser.receivedIdApproval = false
            checkUser.currentStage = 2;

            const sentMail = await sendReverifyEmail( {toUser: checkUser.email, userId, hash: token, firstName: checkUser.firstName })
            const savedUser = await checkUser.save()


            if(savedUser && sentMail){
                return res.status(200).json({"message": "Success"})
            }
        
        } else {
            return res.status(400).json({"message": "Failed"})
        }

    })
}


const getUserStatusPhotos = async (req, res) => {

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

        const usersToCheck = await User.find({checkedMobile: true, 
            receivedIdApproval: false, currentStage: 3})

        var doneDrivers = false;
        var doneHosts = false;

        if(usersToCheck){
            
            usersToCheck?.forEach(function(item, index){

                if(item.frontObjectId && item.backObjectId){
    
                    var signParamsFront = {
                        Bucket: wasabiPrivateBucketUSA, 
                        Key: item.frontObjectId,
                        Expires: 7200
                    };
        
                    var frontUrl = s3.getSignedUrl('getObject', signParamsFront);

                    var signParamsBack = {
                        Bucket: wasabiPrivateBucketUSA, 
                        Key: item.backObjectId,
                        Expires: 7200
                    };
        
                    var backUrl = s3.getSignedUrl('getObject', signParamsBack);
                
                    item.frontMediaURL = frontUrl
                    item.backMediaURL = backUrl
    
                    item.update()
    
                }  
            })
            
            const foundDrivers = await DriverProfile.find({_userId: {$in: usersToCheck.map(e => e._id)}})
            const foundHosts = await HostProfile.find({_userId: {$in: usersToCheck.map(e => e._id)}})

            if(foundDrivers){

                foundDrivers?.forEach(function(item, index){

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

                doneDrivers = true;
            
            } else {

                doneDrivers = true;
            }

            if(foundHosts){

                foundHosts?.forEach(function(item, index){

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
                
                doneHosts = true;
            
            } else {

                doneHosts = true;
            }

            if(doneDrivers && doneHosts){
                return res.status(200).json({users: usersToCheck, foundDrivers, foundHosts })
            }
        
        } else {

            return res.status(400).json({"message": "Failed"})
        }
    })
}

module.exports = { approveUserProfilePhone, approveUserIdPhotos, rejectUserUploads, getUserStatusPhotos }