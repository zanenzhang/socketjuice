const Post = require('../../model/Post');
const User = require('../../model/User');
const UserProfile = require('../../model/UserProfile');
const StoreProfile = require('../../model/StoreProfile');
const Product = require('../../model/Product');
const Bookmark = require('../../model/Bookmark');
const Sharedpost = require('../../model/Sharedpost');
const Flags = require('../../model/Flags');
const OwnedProducts = require('../../model/OwnedProducts');
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


const getAllPostsByUser = async (req, res) => {
    
    const { userId } = req.params

    if (!userId) {
        return res.status(400).json({ message: 'User ID Required' })
    }

    const postsbyuser = await Post.find({ _userId: userId },{"caption_fuzzy": 0, "postViews": 0, "postViews": 0, "additionalProperty": 0})

    if(postsbyuser){

        postsbyuser?.forEach(function(item, index){

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
    }

    res.json(postsbyuser)
}   


const getBoughtPostsUser = async (req, res) => {
    
    var { userId, pageNumber, language, currency } = req.query

    if (!userId || !pageNumber ) {
        return res.status(400).json({ message: 'Missing required information' })
    }

    if(Number(pageNumber) === NaN || Number(pageNumber) < 0 || Number(pageNumber) > 1000){
        return res.status(400).json({ message: 'Content does not meet requirements' })
    }
    pageNumber = Number(pageNumber)

    try {
        const boughtList = await UserProfile.findOne({ _userId: userId }).select("userPosts")
        const ownedProductsFound = await OwnedProducts.findOne({_userId: userId})
        const userBookmarks = await Bookmark.findOne({ _userId: userId })
        const flaggedList = await Flags.findOne({_userId: userId}).select("userFlags postFlags")

        var sharedpostsFound = await Sharedpost.findOne({_userId: userId})

        var stop = 0;
        let foundProducts = null;
        let userData = null;
        let foundPosts = null;
        let doneSharedposts = false;

        let donePosts = false
        let doneFlags = false;
        let flaggedPosts = [];

        if(flaggedList){

            if(flaggedList.postFlags){
                flaggedPosts = flaggedList.postFlags
            } else {
                flaggedPosts = []
            }

            doneFlags = true;
        }

        if(sharedpostsFound){

            doneSharedposts = true;

        } else {

            const newsharedposts = await Sharedpost.create({
                _userId: userId,
                sharedposts:[]
            })
            if(newsharedposts){
                sharedpostsFound = {
                    _userId: userId,
                    sharedposts:[]
                }
                doneSharedposts = true;
            }
        }

        if(boughtList?.userPosts?.length > 0){

            foundPosts = await Post.find({$and:[{_id: {$in: boughtList.userPosts?.map(e=>e._postId)}},{postClass: 0}]},{"caption_fuzzy": 0, "postViews": 0, "postViews": 0, "additionalProperty": 0}).sort({score: -1, createdAt: -1}).skip(pageNumber).limit(8)
        
            if(foundPosts){

                if(foundPosts?.length > 0){

                    userData = await User.find({_id: {$in: foundPosts.map(e=>e._userId)}}).select("_id profilePicURL roles blockedUsers privacySetting")

                    foundProducts = await Product.find({_id: {$in: foundPosts.map(e=>e._productId)}},{brand_fuzzy: 0, productname_fuzzy:0})

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

                    if(foundProducts && userData){
                        donePosts = true;
                    }
                
                } else {

                    stop = 1
                    donePosts = true;
                }

            } else {
            
                stop = 1
                donePosts = true;
            }

            if(donePosts && doneFlags && ownedProductsFound && userBookmarks && doneSharedposts){
                return res.status(201).json({userBookmarks, foundPosts, userData, foundProducts, 
                    ownedProductsFound, flaggedPosts, sharedpostsFound, stop})
            }
        
        } else {

            donePosts = true;

            stop = 1;

            if(donePosts && doneFlags && ownedProductsFound && userBookmarks && doneSharedposts){
                return res.status(201).json({userBookmarks, foundPosts, userData, foundProducts, 
                    ownedProductsFound, flaggedPosts, sharedpostsFound, stop})
            }
        }
    
    } catch (err){

        console.log(err)
        return res.status(401).json({ 'message': 'Operation failed' })   
    }
}   

const getSocialPostsStore = async (req, res) => {
    
    var { userId, pageNumber, language, currency } = req.query

    if (!userId || !pageNumber ) {
        return res.status(400).json({ message: 'Missing required information' })
    }

    if(Number(pageNumber) === NaN || Number(pageNumber) < 0 || Number(pageNumber) > 1000){
        return res.status(400).json({ message: 'Content does not meet requirements' })
    }
    pageNumber = Number(pageNumber)

    try {
        const sellingList = await StoreProfile.findOne({ _userId: userId }).select("storePosts")
        const ownedProductsFound = await OwnedProducts.findOne({_userId: userId})
        const userBookmarks = await Bookmark.findOne({ _userId: userId })
        const flaggedList = await Flags.findOne({_userId: userId}).select("userFlags postFlags")

        var sharedpostsFound = await Sharedpost.findOne({_userId: userId})

        var stop = 0;
        let foundProducts = null;
        let userData = null;
        let foundPosts = null;
        var doneSharedposts = false;

        let donePosts = false
        let doneFlags = false;
        let flaggedPosts = [];

        if(flaggedList){

            if(flaggedList.postFlags){
                flaggedPosts = flaggedList.postFlags
            } else {
                flaggedPosts = []
            }

            doneFlags = true;
        }

        if(sharedpostsFound){

            doneSharedposts = true;

        } else {

            const newsharedposts = await Sharedpost.create({
                _userId: userId,
                sharedposts:[]
            })
            if(newsharedposts){
                sharedpostsFound = {
                    _userId: userId,
                    sharedposts:[]
                }
                doneSharedposts = true;
            }
        }

        if(sellingList?.storePosts?.length > 0){

            foundPosts = await Post.find({$and:[{_id: {$in: sellingList.storePosts.map(e=>e._postId) }},{postClass:2}]},{"caption_fuzzy": 0, "postViews": 0, "postViews": 0, "additionalProperty": 0}).sort({score: -1, createdAt: -1}).skip(pageNumber).limit(8)
        
            if(foundPosts){

                if(foundPosts?.length > 0){

                    userData = await User.find({_id: {$in: foundPosts.map(e=>e._userId)}}).select("_id profilePicURL roles blockedUsers privacySetting")

                    foundProducts = await Product.find({_id: {$in: foundPosts.map(e=>e._productId)}},{brand_fuzzy: 0, productname_fuzzy:0})

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

                    if(foundProducts && userData){
                        donePosts = true;
                    }
                
                } else {

                    stop = 1
                    donePosts = true;
                }

            } else {
            
                stop = 1
                donePosts = true;
            }

            if(donePosts && doneFlags && ownedProductsFound && userBookmarks && doneSharedposts){
                return res.status(201).json({userBookmarks, foundPosts, userData, foundProducts, ownedProductsFound, 
                    flaggedPosts, sharedpostsFound, stop})
            }
        
        } else {

            donePosts = true;

            stop = 1;

            if(donePosts && userBookmarks && userData && foundProducts && ownedProductsFound && 
                flaggedPosts && doneSharedposts){

                return res.status(201).json({userBookmarks, foundPosts, userData, foundProducts, 
                    ownedProductsFound, flaggedPosts, sharedpostsFound, stop})
            }
        }
    
    } catch (err){

        console.log(err)
        return res.status(401).json({ 'message': 'Operation failed' })   
    }
}

const getSocialPostsUser = async (req, res) => {
    
    var { userId, pageNumber } = req.query

    if (!userId || !pageNumber ) {
        return res.status(400).json({ message: 'Missing required information' })
    }

    if(Number(pageNumber) === NaN || Number(pageNumber) < 0 || Number(pageNumber) > 1000){
        return res.status(400).json({ message: 'Content does not meet requirements' })
    }
    pageNumber = Number(pageNumber)

    try {
        const boughtList = await UserProfile.findOne({ _userId: userId }).select("userPosts")
        const ownedProductsFound = await OwnedProducts.findOne({_userId: userId})
        const userBookmarks = await Bookmark.findOne({ _userId: userId })
        const flaggedList = await Flags.findOne({_userId: userId}).select("userFlags postFlags")

        var sharedpostsFound = await Sharedpost.findOne({_userId: userId})

        var stop = 0;
        let foundProducts = null;
        let userData = null;
        let foundPosts = null;
        var doneSharedposts = false;

        let donePosts = false
        let doneFlags = false;
        let flaggedPosts = [];

        if(flaggedList){

            if(flaggedList.postFlags){
                flaggedPosts = flaggedList.postFlags
            } else {
                flaggedPosts = []
            }

            doneFlags = true;
        }

        if(sharedpostsFound){

            doneSharedposts = true;

        } else {

            const newsharedposts = await Sharedpost.create({
                _userId: userId,
                sharedposts:[]
            })
            if(newsharedposts){
                sharedpostsFound = {
                    _userId: userId,
                    sharedposts:[]
                }
                doneSharedposts = true;
            }
        }

        if(boughtList?.userPosts?.length > 0){

            foundPosts = await Post.find({$and:[{_id: {$in: boughtList.userPosts.map(e=>e._postId) }},{postClass:2}]},{"caption_fuzzy": 0, "postViews": 0, "postViews": 0, "additionalProperty": 0}).sort({score: -1, createdAt: -1}).skip(pageNumber).limit(8)
        
            if(foundPosts){

                if(foundPosts?.length > 0){

                    userData = await User.find({_id: {$in: foundPosts.map(e=>e._userId)}}).select("_id profilePicURL roles blockedUsers privacySetting")

                    foundProducts = await Product.find({_id: {$in: foundPosts.map(e=>e._productId)}},{brand_fuzzy: 0, productname_fuzzy:0})

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

                    if(foundProducts && userData){
                        donePosts = true;
                    }
                
                } else {

                    stop = 1
                    donePosts = true;
                }

            } else {
            
                stop = 1
                donePosts = true;
            }

            if(donePosts && doneFlags && ownedProductsFound && userBookmarks && doneSharedposts){
                return res.status(201).json({userBookmarks, foundPosts, userData, foundProducts, ownedProductsFound, 
                    flaggedPosts, sharedpostsFound, stop})
            }
        
        } else {

            donePosts = true;

            stop = 1;

            if(donePosts && doneFlags && ownedProductsFound && userBookmarks && doneSharedposts){
                return res.status(201).json({userBookmarks, foundPosts, userData, foundProducts, ownedProductsFound, 
                    flaggedPosts, sharedpostsFound, stop})
            }
        }
    
    } catch (err){

        console.log(err)
        return res.status(401).json({ 'message': 'Operation failed' })   
    }
}

const getSellingPostsUser = async (req, res) => {
    
    var { userId, pageNumber, language, currency } = req.query

    if (!userId || !pageNumber ) {
        return res.status(400).json({ message: 'User ID Required' })
    }

    if(Number(pageNumber) === NaN || Number(pageNumber) < 0 || Number(pageNumber) > 2500){
        return res.status(400).json({ message: 'Content does not meet requirements' })
    }
    pageNumber = Number(pageNumber)

    const boughtList = await UserProfile.findOne({ _userId: userId }).select("userPosts")
    const ownedProductsFound = await OwnedProducts.findOne({_userId: userId})
    const userBookmarks = await Bookmark.findOne({ _userId: userId })
    const flaggedList = await Flags.findOne({_userId: userId}).select("userFlags postFlags")

    var sharedpostsFound = await Sharedpost.findOne({_userId: userId})

    let foundProducts = null;
    let userData = null;
    let foundPosts = null;

    let donePosts = false
    let doneFlags = false;
    let flaggedPosts = [];
    let stop = 0;

    var doneSharedposts = false;

    if(flaggedList){

        if(flaggedList.postFlags){
            flaggedPosts = flaggedList.postFlags
        } else {
            flaggedPosts = []
        }

        doneFlags = true;
    }

    if(sharedpostsFound){

        doneSharedposts = true;

    } else {

        const newsharedposts = await Sharedpost.create({
            _userId: userId,
            sharedposts:[]
        })
        if(newsharedposts){
            sharedpostsFound = {
                _userId: userId,
                sharedposts:[]
            }
            doneSharedposts = true;
        }
    }

    if(boughtList?.storePosts?.length > 0){

        foundPosts = await Post.find({$and:[{_id: {$in: boughtList.storePosts.map(e=>e._postId) }},{postClass: 1},
            {promotion: 0}]},{"caption_fuzzy": 0, "postViews": 0, "postViews": 0, "additionalProperty": 0}).sort({productname: 1}).skip(pageNumber).limit(8)
    
        if(foundPosts){

            if(foundPosts?.length > 0){

                userData = await User.find({_id: {$in: foundPosts.map(e=>e._userId)}}).select("_id profilePicURL roles blockedUsers privacySetting")

                foundProducts = await Product.find({_id: {$in: foundPosts.map(e=>e._productId)}},{brand_fuzzy: 0, productname_fuzzy:0})

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

                if(foundProducts && userData){
                    donePosts = true;
                }
            
            } else {
                stop = 1;
                donePosts = true;
            }

        } else {
        
            stop = 1;
            donePosts = true;
        }

        if(donePosts && doneFlags && ownedProductsFound && userBookmarks && doneSharedposts){
            return res.status(201).json({userBookmarks, foundPosts, userData, foundProducts, 
                ownedProductsFound, flaggedPosts, sharedpostsFound, stop})
        }
    
    } else {

        donePosts = true;
        stop = 1;

        if(donePosts && doneFlags && ownedProductsFound && userBookmarks && doneSharedposts){
            return res.status(201).json({userBookmarks, foundPosts, userData, foundProducts, 
                ownedProductsFound, flaggedPosts, sharedpostsFound, stop})
        }
    }
}   

const getSellingPostsStore = async (req, res) => {
    
    var { userId, pageNumber, filterCategory, sortingDirection } = req.query

    if (!userId || !pageNumber ) {
        return res.status(400).json({ message: 'User ID Required' })
    }

    if(Number(pageNumber) === NaN || Number(pageNumber) < 0 ){
        return res.status(400).json({ message: 'Content does not meet requirements' })
    }
    pageNumber = Number(pageNumber)

    const sellingList = await StoreProfile.findOne({ _userId: userId }).select("storePosts")
    const ownedProductsFound = await OwnedProducts.findOne({_userId: userId})
    const userBookmarks = await Bookmark.findOne({ _userId: userId })
    const flaggedList = await Flags.findOne({_userId: userId}).select("userFlags postFlags")

    var sharedpostsFound = await Sharedpost.findOne({_userId: userId})

    let foundProducts = null;
    let userData = null;
    let foundPosts = null;

    let donePosts = false
    let doneFlags = false;
    let flaggedPosts = [];
    let stop = 0;

    var doneSharedposts = false;

    if(flaggedList){

        if(flaggedList.postFlags){
            flaggedPosts = flaggedList.postFlags
        } else {
            flaggedPosts = []
        }

        doneFlags = true;
    }

    if(sharedpostsFound){

        doneSharedposts = true;

    } else {

        const newsharedposts = await Sharedpost.create({
            _userId: userId,
            sharedposts:[]
        })
        if(newsharedposts){
            sharedpostsFound = {
                _userId: userId,
                sharedposts:[]
            }
            doneSharedposts = true;
        }
    }

    var sortQuery = {"productname": 1}

    if(sortingDirection === "LowestPrice"){

        sortQuery = {"totalPrice": 1}

    } else if (sortingDirection === "HighestPrice"){

        sortQuery = {"totalPrice": -1}
    }

    if(sellingList?.storePosts?.length > 0){

        if(filterCategory && filterCategory !== 'All' && filterCategory !== 'All Categories'){

            foundPosts = await Post.find({$and:[{_id: {$in: sellingList.storePosts.map(e=>e._postId) }},
                {postClass:1},{promotion: 0}, {primaryCategory: filterCategory}]},{"caption_fuzzy": 0, "postViews": 0, "postViews": 0, "additionalProperty": 0}).sort(sortQuery).skip(pageNumber).limit(8)

        } else {

            foundPosts = await Post.find({$and:[{_id: {$in: sellingList.storePosts.map(e=>e._postId) }},
                {postClass:1},{promotion: 0}]},{"caption_fuzzy": 0, "postViews": 0, "postViews": 0, "additionalProperty": 0}).sort(sortQuery).skip(pageNumber).limit(8)

        }
    
        if(foundPosts && foundPosts?.length > 0){

            userData = await User.find({_id: {$in: foundPosts.map(e=>e._userId)}}).select("_id profilePicURL roles blockedUsers privacySetting")

            foundProducts = await Product.find({_id: {$in: foundPosts.map(e=>e._productId)}},{brand_fuzzy: 0, productname_fuzzy:0})

            foundPosts?.forEach(function(item, index){

                if(item.mediaCarouselURLs?.length === 0 && item.mediaCarouselObjectIds?.length > 0){

                    var finalMediaURLs = []
    
                    for(let i=0; i<item?.mediaCarouselObjectIds?.length; i++){
                    
                        var signParams = {
                            Bucket: wasabiPrivateBucketUSA, 
                            Key: item.mediaCarouselObjectIds[i],
                            Expires: 7200
                            };
            
                        var url = s3.getSignedUrl('getObject', signParams);
            
                        finalMediaURLs.push(url)
                    }
    
                    var finalVideoURLs = []
    
                    for(let i=0; i<item?.videoCarouselObjectIds?.length; i++){

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

            if(foundProducts && userData){
                donePosts = true;
            }
        
        } else {
            stop = 1;
            donePosts = true;
        }

        if(donePosts && doneFlags && ownedProductsFound && userBookmarks && doneSharedposts){
            return res.status(201).json({userBookmarks, foundPosts, userData, foundProducts, 
                ownedProductsFound, flaggedPosts, sharedpostsFound, stop})
        }
    
    } else {

        donePosts = true;
        stop = 1;
        if(donePosts && doneFlags && ownedProductsFound && userBookmarks && doneSharedposts){
            return res.status(201).json({userBookmarks, foundPosts, userData, foundProducts, 
                ownedProductsFound, flaggedPosts, sharedpostsFound, stop})
        }
    }
}   

const getPromotionPostsStore = async (req, res) => {
    
    var { userId, pageNumber, filterCategory, sortingDirection, language, currency } = req.query

    if (!userId || !pageNumber ) {
        return res.status(400).json({ message: 'User ID Required' })
    }

    if(Number(pageNumber) === NaN || Number(pageNumber) < 0 || Number(pageNumber) > 2500){
        return res.status(400).json({ message: 'Content does not meet requirements' })
    }
    pageNumber = Number(pageNumber)

    const sellingList = await StoreProfile.findOne({ _userId: userId }).select("storePosts")
    const ownedProductsFound = await OwnedProducts.findOne({_userId: userId})
    const userBookmarks = await Bookmark.findOne({ _userId: userId })
    const flaggedList = await Flags.findOne({_userId: userId}).select("userFlags postFlags")

    var sharedpostsFound = await Sharedpost.findOne({_userId: userId})

    let foundProducts = null;
    let userData = null;
    let foundPosts = null;

    let donePosts = false
    let doneFlags = false;
    let flaggedPosts = [];
    let stop = 0;
    var doneSharedposts = false;

    if(flaggedList){

        if(flaggedList.postFlags){
            flaggedPosts = flaggedList.postFlags
        } else {
            flaggedPosts = []
        }

        doneFlags = true;
    }

    if(sharedpostsFound){

        doneSharedposts = true;

    } else {

        const newsharedposts = await Sharedpost.create({
            _userId: userId,
            sharedposts:[]
        })
        if(newsharedposts){
            sharedpostsFound = {
                _userId: userId,
                sharedposts:[]
            }
            doneSharedposts = true;
        }
    }

    var sortQuery = {"productname": 1}

    if(sortingDirection === "LowestPrice"){

        sortQuery = {"totalPrice": 1}

    } else if (sortingDirection === "HighestPrice"){

        sortQuery = {"totalPrice": -1}
    }

    if(sellingList?.storePosts?.length > 0){

        //Add checks for promotionStart and promotionEnd
        let todaysDate = new Date().toISOString()

        if(filterCategory !== 'All' && filterCategory !== 'All Categories' && filterCategory){

            foundPosts = await Post.find({$and: [{_id: {$in: sellingList.storePosts.map(e=>e._postId) }}, {"promotion": 1}, {"postClass": 1},
            {primaryCategory: filterCategory}]},{"caption_fuzzy": 0, "postViews": 0, "postViews": 0, "additionalProperty": 0}).sort(sortQuery).skip(pageNumber).limit(8)
        
        } else {

            foundPosts = await Post.find({$and: [{_id: {$in: sellingList.storePosts.map(e=>e._postId) }}, {"promotion": 1}, {"postClass": 1}]},{"caption_fuzzy": 0, "postViews": 0, "postViews": 0, "additionalProperty": 0}).sort(sortQuery).skip(pageNumber).limit(8)
        }
    
        if(foundPosts){

            if(foundPosts?.length > 0){

                userData = await User.find({_id: {$in: foundPosts.map(e=>e._userId)}}).select("_id profilePicURL roles blockedUsers privacySetting")

                foundProducts = await Product.find({_id: {$in: foundPosts.map(e=>e._productId)}},{brand_fuzzy: 0, productname_fuzzy:0})

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

                if(foundProducts && userData){
                    donePosts = true;
                }
            
            } else {
                stop = 1;
                donePosts = true;
            }

        } else {

            stop = 1;
            return res.status(201).json({stop})
        }

        if(donePosts && doneFlags && ownedProductsFound && userBookmarks && doneSharedposts){
            return res.status(201).json({userBookmarks, foundPosts, userData, foundProducts, 
                ownedProductsFound, flaggedPosts, sharedpostsFound, stop})
        }
    
    } else {

        donePosts = true;
        stop = 1;
        if(donePosts && doneFlags && ownedProductsFound && userBookmarks && doneSharedposts){
            return res.status(201).json({userBookmarks, foundPosts, userData, foundProducts, 
                ownedProductsFound, flaggedPosts, sharedpostsFound, stop})
        }
    }
}   



module.exports = { getAllPostsByUser, getBoughtPostsUser, getSellingPostsUser, getSocialPostsUser, getSocialPostsStore, getSellingPostsStore, getPromotionPostsStore }