const Post = require('../../model/Post');
const User = require('../../model/User');
const UserProfile = require('../../model/UserProfile');
const StoreProfile = require('../../model/StoreProfile');
const Product = require('../../model/Product');
const Order = require('../../model/Order');
const OwnedProduct = require('../../model/OwnedProducts');
const Flags = require('../../model/Flags');
const UsageLimit = require('../../model/UsageLimit');
const ForexRate = require('../../model/ForexRate');
const jwt = require('jsonwebtoken');
const ObjectId  = require('mongodb').ObjectId;

const S3 = require("aws-sdk/clients/s3");
const fns = require('date-fns')

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

  const getSingleOrder = async (req, res) => {

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
    
        const { orderId, userId } = req.query

        if (!orderId || ! ((foundUser._id.toString() === userId) || (Object.values(foundUser.roles).includes(5150)) ) ) {
            return res.status(400).json({ message: 'User ID Required' })
        }

        const orderdata = await Order.findOne({ _id: orderId })

        if(orderdata){

            const postData = await Post.find({_id: orderdata._postId})

            if(postData){

                postData?.forEach(function(item, index){

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
                })

                return res.status(200).json({orderData, postData})   
            }
        }
    })
}  

const getOutgoingOrdersByUser = async (req, res) => {

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

        const { userId, dateStart, dateEnd } = req.query

        if (!userId || (dateStart && dateStart > dateEnd) || ! ( (foundUser._id).toString() === userId || (Object.values(foundUser.roles).includes(5150))) ) {
            return res.status(400).json({ message: 'Missing required fields' })
        }

        var foundOrders = null;
        var beginDate = null;
        var finishDate = null;

        if(dateStart){
            beginDate = new Date(dateStart)
            finishDate = new Date(dateEnd)
        }

        if(beginDate){
            foundOrders = await Order.find({ _userId: userId, createdAt: {$gte:beginDate, $lte: finishDate} })
        } else {
            foundOrders = await Order.find({ _userId: userId})
        }

        if(foundOrders){

            const foundPosts = await Post.find({_id: {$in: foundOrders?.map(e=>e._postId)}})
            const ownedProducts = await OwnedProduct.find({_userId: userId})

            if(foundPosts && ownedProducts){

                foundPosts?.forEach(function(item, index){

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
                })

                return res.status(200).json({foundOrders, foundPosts})   
            }
        }

    })
}

const getIncomingOrdersByUser = async (req, res) => {

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

        const { userId, dateStart, dateEnd } = req.query

        if (!userId || (dateStart && dateStart > dateEnd) || !((foundUser._id).toString() === userId || (Object.values(foundUser.roles).includes(5150))) ) {
            return res.status(400).json({ message: 'Missing required fields' })
        }

        var foundOrders = null;
        var beginDate = null;
        var finishDate = null;

        if(dateStart){
            beginDate = new Date(dateStart)
            finishDate = new Date(dateEnd)
        }

        if(beginDate){
            foundOrders = await Order.find({ _postUserId: userId, createdAt: {$gte:beginDate, $lte: finishDate} })
        } else {
            foundOrders = await Order.find({ _postUserId: userId})
        }

        if(foundOrders){

            const foundPosts = await Post.find({_id: {$in: foundOrders?.map(e=>e._postId)}})
            const ownedProducts = await OwnedProduct.find({_userId: userId})

            if(foundPosts && ownedProducts){

                foundPosts?.forEach(function(item, index){

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
                })

                return res.status(200).json({foundOrders, foundPosts})   
            }
        }

    })
}

const getPreordersByUser = async (req, res) => {

    User.findOne({ refreshToken }, async function(err, foundUser){

        if (err || !foundUser) return res.sendStatus(403); 
    
        jwt.verify(
            refreshToken,
            process.env.REFRESH_TOKEN_SECRET,
            (err, decoded) => {

                if (err || foundUser.username !== decoded.username  ) return res.sendStatus(403);
            }
        )
    
        const { userId } = req.query

        if (!userId || ! (( foundUser._id.toString() === userId) || (Object.values(foundUser.roles).includes(5150))) ) {
            return res.status(400).json({ message: 'User ID Required' })
        }

        const preordersbyuser = await Order.find({ _userId: userId, preorder: true })

        if(preordersbyuser){

            const foundPosts = await Post.find({_id: {$in: preordersbyuser?.map(e=>e._postId)}})

            if(foundPosts){

                foundPosts?.forEach(function(item, index){

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
                })

                res.status(200).json({preordersbyuser, foundPosts})   
            }
        }
    })
}   


const getAllOrdersAdmin = async (req, res) => {

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
    
        var { dateStart, dateEnd, creditsRequestedFilter, refundRequestedFilter, orderStatusFilter, moqPreorderFilter } = req.query

        if(!dateStart || !dateEnd || !creditsRequestedFilter || !refundRequestedFilter || !orderStatusFilter || !moqPreorderFilter){
            return res.status(400).json({ message: 'Missing required fields' })
        }

        if(! (Object.values(foundUser.roles).includes(5150))){
            return res.status(401).json({ message: 'Missing required fields' })
        }

        const beginDate = new Date(dateStart)
        const finishDate = new Date(dateEnd)
        
        var orderStatusSearch = 'All'

        if(orderStatusFilter === "Unfulfilled"){
            orderStatusSearch = 1
        } else if(orderStatusFilter === "Forwarded"){
            orderStatusSearch = 2
        } else if(orderStatusFilter === "Shipping"){
            orderStatusSearch = 3
        } else if(orderStatusFilter === "Delivered"){
            orderStatusSearch = 4
        } else if(orderStatusFilter === "Cancelled"){
            orderStatusSearch = 5
        } 

        if(creditsRequestedFilter !== 'All'){
            (creditsRequestedFilter  === 'Yes') ? creditsRequestedFilter = 1 : creditsRequestedFilter = 0;
        }
        
        if(refundRequestedFilter !== 'All'){
            (refundRequestedFilter === 'Yes') ? refundRequestedFilter = 1 : refundRequestedFilter = 0;
        }
        
        var foundOrders = null;

        if(moqPreorderFilter !== 'All'){

            if(orderStatusSearch === 'All' && creditsRequestedFilter === 'All' && refundRequestedFilter === 'All'){
                console.log("Calculating here")
                foundOrders = await Order.find({$and:[{createdAt: {$gte: beginDate, $lte: finishDate}}, {$expr: {$gte:["$preordersCount","$minimumOrderQuantity"]}} ]})
            
            } else if(orderStatusSearch === 'All'){
    
                if(creditsRequestedFilter === 'All' && refundRequestedFilter === 'All'){
                    foundOrders = await Order.find({$and:[{createdAt: {$gte: beginDate, $lte: finishDate}},{$expr: {$gte:["$preordersCount","$minimumOrderQuantity"]}}]})    
                } else if (refundRequestedFilter === 'All'){
                    foundOrders = await Order.find({$and:[{createdAt: {$gte: beginDate, $lte: finishDate}}, {creditsRequested: creditsRequestedFilter}, {$expr: {$gte:["$preordersCount","$minimumOrderQuantity"]}}]})
                } else if (creditsRequestedFilter === 'All') {
                    foundOrders = await Order.find({$and:[{createdAt: {$gte: beginDate, $lte: finishDate}}, {refundRequested: refundRequestedFilter}, {$expr: {$gte:["$preordersCount","$minimumOrderQuantity"]}}]})
                } else {
                    foundOrders = await Order.find({$and:[{createdAt: {$gte: beginDate, $lte: finishDate}}, {creditsRequested: creditsRequestedFilter}, {refundRequested: refundRequestedFilter}, {$expr: {$gte:["$preordersCount","$minimumOrderQuantity"]}}]})
                }
    
            } else {
    
                if(creditsRequestedFilter === 'All' && refundRequestedFilter === 'All'){
                    foundOrders = await Order.find({$and:[{createdAt: {$gte: beginDate, $lte: finishDate}}, {orderStatus: orderStatusSearch},{$expr: {$gte:["$preordersCount","$minimumOrderQuantity"]}}]})
                }else if(refundRequestedFilter === 'All'){
                    foundOrders = await Order.find({$and:[{createdAt: {$gte: beginDate, $lte: finishDate}}, {creditsRequested: creditsRequestedFilter}, {orderStatus: orderStatusSearch}, {$expr: {$gte:["$preordersCount","$minimumOrderQuantity"]}}]})
                } else if(creditsRequestedFilter === 'All') {
                    foundOrders = await Order.find({$and:[{createdAt: {$gte: beginDate, $lte: finishDate}}, {creditsRequested: creditsRequestedFilter}, {orderStatus: orderStatusSearch}, {$expr: {$gte:["$preordersCount","$minimumOrderQuantity"]}} ]})
                } else {
                    foundOrders = await Order.find({$and:[{createdAt: {$gte: beginDate, $lte: finishDate}}, {refundRequested: refundRequestedFilter}, {creditsRequested: creditsRequestedFilter}, {orderStatus: orderStatusSearch}, {$expr: {$gte:["$preordersCount","$minimumOrderQuantity"]}}] })
                }
            }

        
        } else {

            if(orderStatusSearch === 'All' && creditsRequestedFilter === 'All' && refundRequestedFilter === 'All'){
                foundOrders = await Order.find({createdAt: {$gte: beginDate, $lte: finishDate}})
            
            } else if(orderStatusSearch === 'All'){
    
                if(creditsRequestedFilter === 'All' && refundRequestedFilter === 'All'){
                    foundOrders = await Order.find({createdAt: {$gte: beginDate, $lte: finishDate}})    
                } else if (refundRequestedFilter === 'All'){
                    foundOrders = await Order.find({createdAt: {$gte: beginDate, $lte: finishDate}, creditsRequested: creditsRequestedFilter})
                } else if (creditsRequestedFilter === 'All') {
                    foundOrders = await Order.find({createdAt: {$gte: beginDate, $lte: finishDate}, refundRequested: refundRequestedFilter})
                } else {
                    foundOrders = await Order.find({createdAt: {$gte: beginDate, $lte: finishDate}, creditsRequested: creditsRequestedFilter, refundRequested: refundRequestedFilter})
                }
    
            } else {
    
                if(creditsRequestedFilter === 'All' && refundRequestedFilter === 'All'){
                    foundOrders = await Order.find({createdAt: {$gte: beginDate, $lte: finishDate}, orderStatus: orderStatusSearch})
                }else if(refundRequestedFilter === 'All'){
                    foundOrders = await Order.find({createdAt: {$gte: beginDate, $lte: finishDate}, creditsRequested: creditsRequestedFilter, orderStatus: orderStatusSearch})
                } else if(creditsRequestedFilter === 'All') {
                    foundOrders = await Order.find({createdAt: {$gte: beginDate, $lte: finishDate}, creditsRequested: creditsRequestedFilter, orderStatus: orderStatusSearch})
                } else {
                    foundOrders = await Order.find({createdAt: {$gte: beginDate, $lte: finishDate}, refundRequested: refundRequestedFilter, creditsRequested: creditsRequestedFilter, orderStatus: orderStatusSearch})
                }
            }
        }


        if(foundOrders){

            const foundPosts = await Post.find({_id: {$in: foundOrders?.map(e=>e._postId)}})

            if(foundPosts){

                foundPosts?.forEach(function(item, index){

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
                })

                res.status(200).json({foundOrders, foundPosts})   
            }
        }
    })
}   


const getCreditRefundOrdersAdmin = async (req, res) => {

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
    
        const { dateStart, dateEnd } = req.query

        if(!dateStart || !dateEnd){
            return res.status(400).json({ message: 'Missing required fields' })
        }

        if(! (Object.values(foundUser.roles).includes(5150))){
            return res.status(401).json({ message: 'Missing required fields' })
        }

        const beginDate = new Date(dateStart)
        const finishDate = new Date(dateEnd)

        const foundCreditRequested = await Order.find({createdAt: {$gte: beginDate, $lte: finishDate}, creditsRequested: true})
        const foundRefundRequested = await Order.find({createdAt: {$gte: beginDate, $lte: finishDate}, refundRequested: true})

        if(foundCreditRequested && foundRefundRequested){

            const foundPosts = await Post.find({$or:[{_id: {$in: foundCreditRequested?.map(e=>e._postId)}}, {_id: {$in: foundRefundRequested?.map(e=>e._postId)}}]})

            if(foundPosts){

                foundPosts?.forEach(function(item, index){

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
                })

                res.status(200).json({foundCreditRequested, foundRefundRequested, foundPosts})   
            }
        }
    })
}   


const addUserOrder = async (req, res) => {

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
    
        const { userId, username, postId, address, region, country, phoneNumber, numberOfItems, zipCode, preorder, stripeId } = req.query

        if (!userId || !postId || !address || !region || !country || !phoneNumber || (!numberOfItems || Number(numberOfItems) < 1)
            || !zipCode || ! ((foundUser._id.toString() === userId) || (Object.values(foundUser.roles).includes(5150)) )
            || address?.length > 300 || region?.length > 300 || country?.length > 300 || zipCode?.length > 300
            ) {
            return res.status(400).json({ message: 'User ID Required' })
        }

        numberOfItems = Number(numberOfItems)

        const foundLimits = await UsageLimit.findOne({_userId: userId})

        var todaysDate = new Date().toLocaleDateString()
        var doneOperation = null;
    
        if(foundLimits.numberOfOrders?.length > 0){

            if(foundLimits.numberOfOrders?.some(e=>e.date === todaysDate)){

                for(let i=0; i< foundLimits.numberOfOrders.length; i++){

                    if(foundLimits.numberOfOrders[i].date === todaysDate){

                        if(foundLimits.numberOfOrders[i].ordersNumber >= 24){
                            
                            return res.status(401).json({ message: 'Reached posting limit for today' })
                        
                        } else {

                            foundLimits.numberOfOrders[i].ordersNumber = foundLimits.numberOfOrders[i].ordersNumber + 1
                            const savedLimits = await foundLimits.save()
                            
                            if(savedLimits){
                                doneOperation = true;
                            }
                            
                            break;
                        }
                    }
                }

            } else {

                foundLimits.numberOfOrders.push({date: todaysDate, ordersNumber: 1 })
                const savedLimits = await foundLimits.save()
                if(savedLimits){
                    doneOperation = true;
                }
            }

        } else {

            foundLimits.numberOfOrders = [{date: todaysDate, ordersNumber: 1 }]
            const savedLimits = await foundLimits.save()
            if(savedLimits){
                doneOperation = true;
            }
        }

        if(doneOperation){
        
            const foundPost = await Post.findOneAndUpdate({ _id: postId },{$push:{orderedBy:{_userId: userId, username: username}},$inc:{ordersCount: 1}},{new:true})

            if(foundPost){

                preorder == true ? preorder = 1 : preorder = 0
                
                const newOrder = new Order({
                    "StripeId": StripeId,
                    "_userId": userId,
                    "username": username,
                    "email": foundUser.email,
                    "_postId": foundPost._id,
                    "productname": foundPost.productname,
                    "_productId": foundPost._productId,
                    "currency": foundPost.currency,
                    "storename": foundPost.storename,
                    "previewMediaURL": foundPost.previewMediaURL,
                    "finalPrice": foundPost.totalPrice,
                    "originalPrice": foundPost.oldPrice,
                    "address": address,
                    "region": region,
                    "country": country,
                    "phoneNumber": phoneNumber,
                    "zipCode": zipCode,
                    "active": 1,
                    "preorder": preorder,
                    "numberOfItems": numberOfItems,
                    "minimumOrderQuantity": foundPost.minimumOrderQuantity,
                })

                const savedOrder = await newOrder.save()

                if(savedOrder){

                    const foundUserProfile = await UserProfile.updateOne({ _id: userId },{$push:{userOrders:{_orderId: savedOrder._id}}})

                    if(foundUserProfile){
                        return res.status(200).json({"message": "Successfully added order"})
                    }
                }
            }
        }
    })
}   

const addStoreOrder = async (req, res) => {
    
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
    
        const { userId, name, postId, address, region, country, phoneNumber, numberOfItems, zipCode, preorder, StripeId } = req.query

        if (!userId || !postId || !address || !region || !country || !phoneNumber || (!numberOfItems || Number(numberOfItems) < 1)
            || !zipCode || ! ((foundUser._id.toString() === userId) || (Object.values(foundUser.roles).includes(5150)) )
            || name?.length > 300 || address?.length > 300 || region?.length > 300 || country?.length > 300 || zipCode?.length > 300
            ) {
            return res.status(400).json({ message: 'User ID Required' })
        }

        numberOfItems = Number(numberOfItems)

        const foundLimits = await UsageLimit.findOne({_userId: userId})

        var todaysDate = new Date().toLocaleDateString()
        var doneOperation = null;
    
        if(foundLimits.numberOfOrders?.length > 0){

            if(foundLimits.numberOfOrders?.some(e=>e.date === todaysDate)){

                for(let i=0; i< foundLimits.numberOfOrders.length; i++){

                    if(foundLimits.numberOfOrders[i].date === todaysDate){

                        if(foundLimits.numberOfOrders[i].ordersNumber >= 24){
                            
                            return res.status(401).json({ message: 'Reached posting limit for today' })
                        
                        } else {

                            foundLimits.numberOfOrders[i].ordersNumber = foundLimits.numberOfOrders[i].ordersNumber + 1
                            const savedLimits = await foundLimits.save()
                            
                            if(savedLimits){
                                doneOperation = true;
                            }
                            
                            break;
                        }
                    }
                }

            } else {

                foundLimits.numberOfOrders.push({date: todaysDate, ordersNumber: 1 })
                const savedLimits = await foundLimits.save()
                if(savedLimits){
                    doneOperation = true;
                }
            }

        } else {

            foundLimits.numberOfOrders = [{date: todaysDate, ordersNumber: 1 }]
            const savedLimits = await foundLimits.save()
            if(savedLimits){
                doneOperation = true;
            }
        }

        if(doneOperation){

            const foundPost = await Post.findOneAndUpdate({ _id: postId },{$push:{orderedBy:{_userId: userId, username: foundUser.username}},$inc:{ordersCount: 1}},{new:true})

            if(foundPost){

                preorder == true ? preorder = 1 : preorder = 0

                const newOrder = new Order({
                    "StripeId": StripeId,
                    "_userId": userId,
                    "username": foundUser.username,
                    "name": name,
                    "email": foundUser.email,
                    "_postId": foundPost._id,
                    "productname": foundPost.productname,
                    "_productId": foundPost._productId,
                    "currency": foundPost.currency,
                    "storename": foundPost.storename,
                    "previewMediaURL": foundPost.previewMediaURL,
                    "finalPrice": foundPost.totalPrice,
                    "originalPrice": foundPost.oldPrice,
                    "address": address,
                    "region": region,
                    "country": country,
                    "phoneNumber": phoneNumber,
                    "zipCode": zipCode,
                    "active": 1,
                    "preorder": preorder,
                    "numberOfItems": numberOfItems,
                    "minimumOrderQuantity": foundPost.minimumOrderQuantity,
                })

                const savedOrder = await newOrder.save()

                if(savedOrder){

                    const foundStoreProfile = await StoreProfile.updateOne({ _id: userId },{$push:{userOrders:{_orderId: savedOrder._id}}})

                    if(foundStoreProfile){
                        return res.status(200).json({"message": "Successfully added order"})
                    }
                }
            }
        }
    })
}   


const editOrderContactAdmin = async (req, res) => {
    
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
    
        const { orderId, name, address, region, country, phoneNumber, zipCode } = req.body

        if (!orderId || !(Object.values(foundUser.roles).includes(5150))
            || name?.length > 300 
            ) {
            return res.status(400).json({ message: 'User ID Required' })
        }
        
        const foundOrder = await Order.findOne({ _id: orderId })

        if(foundOrder){
            
            name ? foundOrder.name = name : null;
            address ? foundOrder.address = address : null;
            region ?  foundOrder.region = region : null;
            country ? foundOrder.country = country : null;
            phoneNumber ? foundOrder.phoneNumber = phoneNumber : null;
            zipCode ? foundOrder.zipCode = zipCode : null;

            const savedOrder = await foundOrder.save()

            if(savedOrder){
                return res.status(200).json({"message": "Successfully edited order contact"})
            }
        }
    })
}   


const updateOrderStatusAdmin = async (req, res) => {
    
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
    
        var { orderId, orderStatus, shippingStatus, trackingNumber, preorder, shippingDateEarly, shippingDateLate, preorderDeadline } = req.body

        if (!orderId || ! ((Object.values(foundUser.roles).includes(5150)) )) {
            return res.status(400).json({ message: 'User ID Required' })
        }
        
        const foundOrder = await Order.findOne({ _id: orderId })

        orderStatus = Number(orderStatus)
        shippingDateEarly = new Date(shippingDateEarly)
        shippingDateLate = new Date(shippingDateLate)
        preorderDeadline = new Date(preorderDeadline)

        if(foundOrder){

            preorder == true ? preorder = 1 : preorder = 0
            
            foundOrder.orderStatus = orderStatus;
            if(orderStatus >= 4){
                foundOrder.active = 0;
            }
            foundOrder.preorder = preorder;
            foundOrder.shippingStatus = shippingStatus;
            foundOrder.shippingDateEarly = shippingDateEarly;
            foundOrder.shippingDateLate = shippingDateLate;
            foundOrder.trackingNumber = trackingNumber;
            foundOrder.preorderDeadline = preorderDeadline;

            const savedOrder = await foundOrder.save()

            if(savedOrder){
                return res.status(200).json({"message": "Successfully edited order status"})
            }
        }
    })
}   


const creditOrderAdmin = async (req, res) => {
    
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
    
        const { profileUserId, orderId, creditsRequested, approveRequest } = req.body

        if (!profileUserId || !orderId || ! ((Object.values(foundUser.roles).includes(5150)) )
            ) {
            return res.status(400).json({ message: 'User ID Required' })
        }
        
        const foundOrder = await Order.findOne({ _id: orderId })

        if(foundOrder){
            
            if(!foundOrder.creditsCompleted){

                if(creditsRequested){
                    foundOrder.creditsRequested = 1;
                } else {
                    foundOrder.creditsRequested = 0;
                }

                if(approveRequest){
                    
                    foundOrder.creditsCompleted = 1;
                    foundOrder.creditedDate = new Date();
                    foundOrder.active = 0;
                    foundOrder.orderStatus = 6;

                    const foundUser = await User.findOne({_id: profileUserId})

                    if(foundUser){

                        if(foundUser.credits?.some(e => (e.currency === foundOrder.currency))){

                            for(let i=0; i<foundUser.credits?.length; i++){
                                if(foundUser.credits[i].currency === foundOrder.paidCurrency.toUpperCase()){
                                    var newBalance =  Number(Math.round(foundUser.credits[i].amount * 100)/100) +  Number(Math.round(foundOrder.paidTotalPrice * 100)/100)
                                    foundUser.credits[i].amount = newBalance
                                    var currencySymbol = "$"
                                    if(foundUser.credits[i].currency === 'USD'){
                                        currencySymbol = '$'
                                      } else if (foundUser.credits[i].currency === 'CAD') {
                                          currencySymbol ='$'
                                      } else if (foundUser.credits[i].currency === 'EUR'){
                                          currencySymbol = '€'
                                      } else if (foundUser.credits[i].currency === 'GBP'){
                                          currencySymbol = '£'
                                      } else if (foundUser.credits[i].currency === 'INR'){
                                          currencySymbol = '₹'
                                      } else if (foundUser.credits[i].currency === 'JPY'){
                                          currencySymbol = '¥'
                                      } else if (foundUser.credits[i].currency === 'CNY'){
                                          currencySymbol = '¥'
                                      } else if (foundUser.credits[i].currency === 'AUD'){
                                          currencySymbol = '$'
                                      } else if (foundUser.credits[i].currency === 'NZD'){
                                        currencySymbol = '$'
                                      } else if (foundUser.credits[i].currency === 'ETH'){
                                          currencySymbol = 'Ξ'
                                      } else if (foundUser.credits[i].currency === 'ADA'){
                                          currencySymbol = '₳'
                                      } else if (foundUser.credits[i].currency === 'DOGE'){
                                          currencySymbol = 'Ɖ'
                                      } else {
                                          currencySymbol = '$'
                                      }
                                      foundUser.credits[i].currencySymbol = currencySymbol

                                    break
                                }
                            }
                        
                        } else {
                            
                            foundUser.credits.push({currency: foundOrder.paidCurrency.toUpperCase(), 
                                amount: Number(foundOrder.paidTotalPrice), currencySymbol: foundOrder.currencySymbol})
                        }

                        const savedUser = await foundUser.save()
                        const savedOrder = await foundOrder.save()

                        if(savedUser && savedOrder){

                            return res.status(200).json({"message": "Successfully processed credits"})       
                        }
                    }
                } 
            
            } else {
                return res.status(404).json({"message": "Operation failed"})       
            }
        }
    })
}   


const refundOrderAdmin = async (req, res) => {
    
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
    
        const { orderId, refundRequested, approveRequest } = req.body

        if (!orderId || ! ((Object.values(foundUser.roles).includes(5150)) )
            ) {
            return res.status(400).json({ message: 'User ID Required' })
        }
        
        const foundOrder = await Order.findOne({ _id: orderId })

        if(foundOrder){
            
            if(!foundOrder.refundCompleted){

                if(refundRequested){
                    foundOrder.refundRequested = 1;
                } else {
                    foundOrder.refundRequested = 0;
                }

                if(approveRequest){
                    foundOrder.refundCompleted = 1;
                    foundOrder.refundDate = new Date();
                    foundOrder.active = 0;
                }

                const savedOrder = await foundOrder.save()

                if(savedOrder){
                    return res.status(200).json({"message": "Successfully processed refund"})       
                }
            
            } else {
                return res.status(404).json({"message": "Operation failed"})       
            }
        }
    })
}   


module.exports = { getOutgoingOrdersByUser, getIncomingOrdersByUser, getSingleOrder, getPreordersByUser, addUserOrder, addStoreOrder, getCreditRefundOrdersAdmin,
    editOrderContactAdmin, updateOrderStatusAdmin, creditOrderAdmin, refundOrderAdmin, getAllOrdersAdmin }