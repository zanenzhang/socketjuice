


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

            checkUser.waitingIdApproval = true

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

        if(checkUser){

            checkUser.identificationFrontObjectId = ""
            checkUser.identificationFrontMediaURL = ""
            checkUser.identificationBackObjectId = ""
            checkUser.identificationBackMediaURL = ""

            checkUser.waitingIdApproval = false

            const savedUser = await checkUser.save()

            if(savedUser){
                return res.status(200).json({"message": "Sucess"})
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

        const usersToCheck = await User.find({checkedMobile: true, waitingIdApproval: false})
        var doneDrivers = false;
        var doneHosts = false;

        if(usersToCheck && usersToCheck?.length > 0){
            
            usersToCheck?.forEach(function(item, index){

                if(item.identificationFrontObjectId && item.identificationBackObjectId){
    
                    var signParamsFront = {
                        Bucket: wasabiPrivateBucketUSA, 
                        Key: item.identificationFrontObjectId,
                        Expires: 7200
                    };
        
                    var frontUrl = s3.getSignedUrl('getObject', signParamsFront);

                    var signParamsBack = {
                        Bucket: wasabiPrivateBucketUSA, 
                        Key: item.identificationBackObjectId,
                        Expires: 7200
                    };
        
                    var backUrl = s3.getSignedUrl('getObject', signParamsBack);
                
                    item.identificationFrontMediaURL = frontUrl
                    item.identificationBackMediaURL = backUrl
    
                    item.update()
    
                }  
            })
            
            const foundDrivers = await DriverProfile.find({_userId: {$in: usersToCheck.map(e => e._id)}})
            const foundHosts = await HostProfile.find({_userId: {$in: usersToCheck.map(e => e._id)}})

            if(foundDrivers && foundDrivers?.length > 0){

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