const Product = require('../../model/Product')
const StoreProfile = require('../../model/StoreProfile')
const User = require('../../model/User')
const UserProfile = require('../../model/UserProfile')
const Post = require('../../model/Post')
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

  const getSearchResults = async (req, res) => {

    var { searchTerm, loggedUserId, pageNumber } = req.query

    if (!searchTerm || !pageNumber || !loggedUserId ) {
        return res.status(400).json({ message: 'Missing required info' })
    }

    if(searchTerm?.length > 16 || Number(pageNumber) > 1000 || Number(pageNumber) < 0){
        return res.status(400).json({ message: 'Content does not meet requirements' })
    }

    pageNumber = Number(pageNumber)

    try {

        const escapedSearchTerm = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

        const userProfiles = await UserProfile.fuzzySearch(escapedSearchTerm).skip(pageNumber).limit(4)
        const storeProfiles = await StoreProfile.fuzzySearch(escapedSearchTerm).skip(pageNumber).limit(4)
        const productProfiles = await Product.fuzzySearch(escapedSearchTerm).skip(pageNumber).limit(4)
        const postProfiles = await Post.fuzzySearch(escapedSearchTerm).skip(pageNumber).limit(4)

        var userData = null;
        var blockedProfiles = null;
        var foundProducts = null;
        var foundPosts = null;

        if(userProfiles && storeProfiles && productProfiles && postProfiles){

            userData = await User.find({$or: [{_id: {$in: userProfiles.map(e=>e._userId)}}, 
                {_id: {$in: storeProfiles.map(e=>e._userId)}}, {_id: {$in: postProfiles.map(e=>e._userId)}}] }).
            select("_id profilePicURL blockedUsers roles username privacySetting deactivated active")

            blockedProfiles = await User.findOne({_id: loggedUserId}).select("blockedUsers")

            if(postProfiles){

                postProfiles?.forEach(function(item, index){
        
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

                foundPosts = true
            
            } else {

                foundPosts = true
            }

            if(productProfiles){

                var productData = []
    
                for(let i=0; i< Object.keys(productProfiles).length; i++){

                    if(productProfiles[i].deactivated){
                        continue
                    
                    } else {

                        let currentId = productProfiles[i]?.relatedPosts[0]?._postId;
                        let currentProduct = productProfiles[i]?._id;
        
                        const foundPost = await Post.findOne({_id: currentId})
        
                        if(foundPost){

                            if(!foundPost.previewMediaURL){
                        
                                var signParams = {
                                    Bucket: wasabiPrivateBucketUSA, 
                                    Key: foundPost.previewMediaObjectId, 
                                    Expires: 7200
                                };
                        
                                var url = s3.getSignedUrl('getObject', signParams);
                        
                                var obj = {}
                                obj['_productId'] = currentProduct;
                                obj['mediaURL'] = url;
                                productData.push(obj);

                                foundPost.previewMediaURL = url
                                foundPost.markModified('previewMediaURL')
                            
                            } else {
                        
                                var signedUrl = foundPost.previewMediaURL
                        
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
                                        Key: foundPost.previewMediaObjectId,
                                        Expires: 7200
                                    };
                        
                                    var url = s3.getSignedUrl('getObject', signParams);

                                    foundPost.previewMediaURL = url
                                    
                                    var obj = {}
                                    obj['_productId'] = currentProduct;
                                    obj['mediaURL'] = url;
                                    productData.push(obj);

                                    foundPost.markModified('previewMediaURL')
                                
                                } else {
                                    
                                    var obj = {}
                                    obj['_productId'] = currentProduct;
                                    obj['mediaURL'] = signedUrl;
                                    productData.push(obj);
                                }
                            }
                            
                            foundPost.update()
                        }
                    }
                }        

                foundProducts = true;
            
            } else {

                foundProducts = true;
            }

            if(userData && foundProducts && foundPosts && blockedProfiles){

                return res.status(200).json({userProfiles, storeProfiles, productProfiles, postProfiles, userData, productData, blockedProfiles})
            
            } else {

                return res.status(401).json({ message: 'Operation failed' })
            }
        
        } else {

            return res.status(401).json({ message: 'Operation failed' })
        }
            
    } catch(err){

        console.log(err)
        return res.status(401).json({ message: 'Cannot get user information' })
    }

  }


  const getSearchUserProfiles = async (req, res) => {
    
    const { username, pageNumber } = req.query

    if (!username ) {
        return res.status(400).json({ message: 'Missing required info' })
    }

    try {

        const userProfiles = await UserProfile.fuzzySearch(username).skip(pageNumber).select("_userId username fullname").limit(8)

        if(userProfiles){

            const userData = await User.find({_id: {$in: userProfiles.map(e=>e._userId)}}).
                select("_id profilePicURL blockedUsers roles username privacySetting")


            if(userData){
                
                return res.status(200).json({userProfiles, userData})
            
            } else {

                return res.status(401).json({ message: 'Cannot get store information' })
            }        
        
        }

    } catch(err){

        return res.status(401).json({ message: 'Cannot get user information' })
    }
}


const getSearchStoreProfiles = async (req, res) => {
    
    var { storename, pageNumber } = req.query

    if (!storename ) {
        return res.status(400).json({ message: 'Missing required info' })
    }

    if(storename?.length > 16 || Number(pageNumber) > 1000 || Number(pageNumber) < 0){
        return res.status(400).json({ message: 'Content does not meet requirements' })
    }

    pageNumber = Number(pageNumber)

    try {

        const storeProfiles = await StoreProfile.fuzzySearch(storename).skip(pageNumber).limit(8).select("_userId storename displayname")

        if(storeProfiles){

            const storeData = await User.find({_id: {$in: storeProfiles.map(e=>e._userId)}}).
                select("_id profilePicURL blockedUsers roles username privacySetting")

            if(storeData){
                
                return res.status(200).json({storeProfiles, storeData})
            
            } else {

                return res.status(401).json({ message: 'Cannot get store information' })
            }        
        
        }

    } catch(err){

        return res.status(401).json({ message: 'Cannot get user information' })
    }
}



const getSearchProductProfiles = async (req, res) => {
    
    var { productname, pageNumber } = req.query

    if (!productname ) {
        return res.status(400).json({ message: 'Missing required info' })
    }

    if(productname?.length > 16 || Number(pageNumber) > 1000 || Number(pageNumber) < 0){
        return res.status(400).json({ message: 'Content does not meet requirements' })
    }

    pageNumber = Number(pageNumber)

    try {

        const productProfiles = await Product.fuzzySearch(productname).skip(pageNumber).limit(8)

        if(productProfiles){

            var productData = []

            for(let i=0; i< Object.keys(productProfiles).length; i++){

                let currentId = productData[i]._id;

                Post.findOne({_id: currentId}, function(err, foundPost){

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
            }
                
            return res.status(200).json({productProfiles, productData})    
        
        } else {

            return res.status(401).json({ message: 'Operation failed' })
        }

    } catch(err){

        return res.status(401).json({ message: 'Cannot get information' })
    }
}



module.exports = { getSearchUserProfiles, getSearchProductProfiles, getSearchStoreProfiles, getSearchResults }