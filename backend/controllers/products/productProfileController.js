const Product = require('../../model/Product')
const BannedProduct = require('../../model/BannedProduct')
const Post = require('../../model/Post')
const User = require('../../model/User')
const Flags = require('../../model/Flags')
const OwnedProducts = require('../../model/OwnedProducts')
const Bookmark = require('../../model/Bookmark')
const Sharedpost = require('../../model/Sharedpost')
const Peoplefollowing = require('../../model/Peoplefollowing');

const Peoplefollowers = require('../../model/Peoplefollowers');
const Storefollowers = require('../../model/Storefollowers');
const Productfollowing = require('../../model/Productfollowing');
const Productfollowers = require('../../model/Productfollowers');

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


const getProductProfile = async (req, res) => {
    
    var { productId, loggedUserId, pageNumber, language, currency } = req.query

    if (!productId || !loggedUserId || !pageNumber ) {
        return res.status(400).json({ message: 'Missing required info' })
    }

    if(Number(pageNumber) === NaN || Number(pageNumber) < 0 || Number(pageNumber) > 1000){
        return res.status(400).json({ message: 'Content does not meet requirements' })
    }

    pageNumber = Number(pageNumber)

    try {

        const productPosts = await Post.find({ _productId: productId },{"caption_fuzzy": 0, "postViews": 0, "postViews": 0, "additionalProperty": 0}).sort({totalPrice: 1}).skip(pageNumber).limit(12)        
        const productProfile = await Product.findOne({_id: productId})
        const peopleFollowing = await Peoplefollowing.findOne({_userId: loggedUserId})
        const productFollowers = await Productfollowers.findOne({ _productId: productId }).select("allProductFollowers productFollowersCount")
        
        const productFollowing = await Productfollowing.findOne({ _userId: loggedUserId }).select("productFollowingCount")
        const ownedProductsFound = await OwnedProducts.findOne({_userId: loggedUserId})
        const bookmarksFound = await Bookmark.findOne({_userId: loggedUserId})
        const flaggedList = await Flags.findOne({_userId: loggedUserId}).select("productFlags postFlags")
        const loggedBlocks = await User.findOne({_id: loggedUserId}).select("blockedUsers")

        var sharedpostsFound = await Sharedpost.findOne({_userId: loggedUserId})

        let isFollowing = null;
        let notFollowing = null;
        let userData = null;
        
        let productFollowersCount = null;
        let productFollowingCount = null;
        let flaggedProduct = null;
        let flaggedPosts = [];

        let checkedProduct = null;
        let doneProductFollowers = false;
        let doneProductFollowing = false;
        let donePosts = false;
        let doneFlags = false;

        var doneSharedposts = false;

        if(productProfile){

            if(productProfile.deactivated == true){
                
                return res.status(403).json({"message":"Product is banned!"})
            
            } else {
            
                checkedProduct = true;
            }
        } else {
            console.log("No product profile")
        }

        if(flaggedList){

            if(flaggedList.productFlags?.some(e=>e._productId.toString() === ((productId)))){
                flaggedProduct = 1
            } else {
                flaggedProduct = 0;
            }

            if(flaggedList.postFlags){
                flaggedPosts = flaggedList.postFlags
            } else {
                flaggedPosts = []
            }

            doneFlags = true;
        
        } else {

            let newFlags = new Flags({"_userId": loggedUserId});

            flaggedProduct = 0;
            flaggedPosts = [];

            const savedFlags = await newFlags.save()

            if(savedFlags){
                doneFlags = true;
            }
        }

        if(sharedpostsFound){

            doneSharedposts = true;

        } else {

            const newsharedposts = await Sharedpost.create({
                _userId: loggedUserId,
                sharedposts:[]
            })
            if(newsharedposts){
                sharedpostsFound = {
                    _userId: loggedUserId,
                    sharedposts:[]
                }
                doneSharedposts = true;
            }
        }

        if(productFollowers){

            productFollowersCount = productFollowers.productFollowersCount
            
            if(productFollowersCount > 0){
                if(productFollowers.allProductFollowers?.some(e => e._followerId.toString() === ((loggedUserId)))){
                    isFollowing = 1;
                    notFollowing = 0;
                } else {
                    isFollowing = 0;    
                    notFollowing = 1;
                }    
            } else {
                isFollowing = 0;
                notFollowing = 1;
            }
            
            doneProductFollowers = true;
        
        } else {

            let productFollowers = new Productfollowers({
                "_productId": productId,
                });

            productFollowers.save()

            doneProductFollowers = true;
        }
        
        if(productFollowing){

            productFollowingCount = productFollowing.productFollowingCount
            doneProductFollowing = true;
        }

        if(productPosts){

            userData = await User.find({_id: {$in: productPosts.map(e=>e._userId)}}).
                select("_id profilePicURL roles username privacySetting blockedUsers deactivated")

            productPosts?.forEach(function(item, index){

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

            if(userData){
                
                donePosts = true;
            } else {
                donePosts = true;
            }
        } else {
            donePosts = true;
        }

        if(checkedProduct && userData && peopleFollowing && ownedProductsFound && doneSharedposts
             && bookmarksFound && doneProductFollowers && doneProductFollowing
             && donePosts && doneFlags && loggedBlocks){
                
            return res.status(200).json({productPosts, productProfile, isFollowing, notFollowing, 
                productFollowingCount, productFollowersCount, userData, peopleFollowing, ownedProductsFound, 
                sharedpostsFound, bookmarksFound, flaggedProduct, flaggedPosts, loggedBlocks})
        
        }     
        
    } catch(err){

        console.log(err)

        return res.status(401).json({ message: 'Cannot get user information' })
    }
}


const getProductPosts = async (req, res) => {
    
    var { productId, loggedUserId, pageNumber } = req.query

    if (!productId || !loggedUserId || !pageNumber ) {
        return res.status(400).json({ message: 'Missing required info' })
    }

    if(Number(pageNumber) === NaN || Number(pageNumber) < 0 || Number(pageNumber) > 1000){
        return res.status(400).json({ message: 'Content does not meet requirements' })
    }

    pageNumber = Number(pageNumber)

    try {

        const productPosts = await Post.find({ _productId: productId },{"caption_fuzzy": 0, "postViews": 0, "postViews": 0, "additionalProperty": 0}).sort({totalPrice: 1}).skip(pageNumber).limit(12)
        const productProfile = await Product.findOne({ _id: productId})
        const ownedProductsFound = await OwnedProducts.findOne({_userId: loggedUserId})
        const bookmarksFound = await Bookmark.findOne({_userId: loggedUserId})
        const flaggedList = await Flags.findOne({_userId: loggedUserId}).select("productFlags postFlags")
        const loggedBlocks = await User.findOne({_userId: loggedUserId}).select("blockedUsers")

        var sharedpostsFound = await Sharedpost.findOne({_userId: loggedUserId})

        let userData = null;
        
        let flaggedProduct = null;
        let flaggedPosts = [];

        let checkedProduct = null;
        let donePosts = false;
        let doneFlags = false;

        var doneSharedposts = false;
        var stop = 0;

        if(productProfile){

            if(productProfile.deactivated === true){
                
                return res.status(403).json({"message":"Product is banned!"})
            
            } else {
            
                checkedProduct = true;
            }
        }

        if(flaggedList){

            if(flaggedList.productFlags?.some(e=>e._productId.toString() === ((productId)))){
                flaggedProduct = 1
            } else {
                flaggedProduct = 0;
            }

            if(flaggedList.postFlags){
                flaggedPosts = flaggedList.postFlags
            } else {
                flaggedPosts = []
            }

            doneFlags = true;
        
        } else {

            let newFlags = new Flags({"_userId": loggedUserId});

            flaggedProduct = 0;
            flaggedPosts = [];

            const savedFlags = await newFlags.save()

            if(savedFlags){
                doneFlags = true;
            }
        }
        
        if(sharedpostsFound){

            doneSharedposts = true;

        } else {

            const newsharedposts = await Sharedpost.create({
                _userId: loggedUserId,
                sharedposts:[]
            })
            if(newsharedposts){
                sharedpostsFound = {
                    _userId: loggedUserId,
                    sharedposts:[]
                }
                doneSharedposts = true;
            }
        }
        
        if(productPosts?.length > 0){

            userData = await User.find({_id: {$in: productPosts.map(e=>e._userId)}}).
            select("_id profilePicURL roles username privacySetting blockedUsers deactivated")

            productPosts?.forEach(function(item, index){

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

            if(userData){
                donePosts = true;
            }

        } else {

            stop = 1;
            donePosts = true;

            if(checkedProduct && userData && ownedProductsFound && loggedBlocks
                && bookmarksFound && doneSharedposts && donePosts && doneFlags){
                return res.status(200).json({productPosts, productProfile, userData, loggedBlocks,
                    ownedProductsFound, bookmarksFound, sharedpostsFound, flaggedProduct, 
                    flaggedPosts, stop})
            }
        }
    
        if(checkedProduct && userData && ownedProductsFound && loggedBlocks
             && bookmarksFound && doneSharedposts && donePosts && doneFlags){
                
            return res.status(200).json({productPosts, productProfile, userData, loggedBlocks,
                ownedProductsFound, bookmarksFound, sharedpostsFound, flaggedProduct, flaggedPosts, stop})
        
        } else {

            return res.status(401).json({ message: 'Cannot get product information' })
        }        
        
    } catch(err){

        return res.status(401).json({ message: 'Cannot get product information' })
    }
}


const editSettingsStoreProfile = async (req, res) => {
    
    const cookies = req.cookies;
    
    const { loggedUserId, phonePrimary, profilePicKey, profilePicURL, 
        displayname, website, announcements, regularHoursOfOperation, 
        holidayHoursOfOperation, address, city, region, country, manager,
        chain, chainId 
        } = req.body


    if (!cookies?.purchiesjwt) return res.sendStatus(401);
    const refreshToken = cookies.purchiesjwt;

    const foundUser = await User.findOne({ refreshToken }).exec();
    if (!foundUser) return res.sendStatus(403); //Forbidden 
    // evaluate jwt 
    jwt.verify(
        refreshToken,
        process.env.REFRESH_TOKEN_SECRET,
        (err, decoded) => {
            if (err || foundUser.username !== decoded.username || foundUser.userId !== decoded.userId ) return res.sendStatus(403);
        }
    )

    // Confirm data 
    if ( !loggedUserId ) {    
        return res.status(400).json({ message: 'Missing required fields!' })
    }

    // Does the user exist to update?
    UserProfile.findOne({"_userId": loggedUserId }, async function(err, foundUserProfile){
        if(err){
            return res.status(400).json({ message: 'User not found' })
        }

        profilePicKey ? foundUser.profilePicKey = profilePicKey : null;
        profilePicURL ? foundUser.profilePicURL = profilePicURL : null;

        phonePrimary ? foundUserProfile.phonePrimary = phonePrimary : null;
        displayname ? foundUserProfile.displayname = displayname : null;
        website ? foundUserProfile.website = website : null;
        announcements ? foundUserProfile.announcements = announcements : null;
        regularHoursOfOperation ? foundUserProfile.regularHoursOfOperation = regularHoursOfOperation : null;
        holidayHoursOfOperation ? foundUserProfile.holidayHoursOfOperation = holidayHoursOfOperation : null;
        address ? foundUserProfile.address = address : null;
        city ? foundUserProfile.city = city : null;
        region ? foundUserProfile.region = region : null;
        country ? foundUserProfile.country = country : null;
        manager ? foundUserProfile.manager = manager : null;
        chain ? foundUserProfile.chain = chain : null;
        chainId ? foundUserProfile.chainId = chainId : null;

        const savedFoundProfile = await foundUserProfile.save()
       
        const savedFoundUser = await foundUser.save()

        if (savedFoundProfile && savedFoundUser) {
            res.json({ message: "Success!" })
        }

    })
}



const editSettingsStoreGeneral = async (req, res) => {

    const cookies = req.cookies;
    
    const { loggedUserId, lessMotion, privacySetting, pushNotifications, 
        userTheme, chain, chainId } = req.body

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

    if ( !loggedUserId || typeof lessMotion !== 'boolean' || !privacySetting 
    || typeof pushNotifications !== 'boolean' || !userTheme || !chain || !chainId  ) {

        return res.status(400).json({ message: 'Missing required fields!' })
    }

    StoreProfile.findOne({"_userId": loggedUserId }, async function(err, foundUserProfile){
        if(err){
            return res.status(400).json({ message: 'User not found' })
        }

        privacySetting ? foundUser.privacySetting = privacySetting : null;

        lessMotion ? foundUserProfile.lessMotion = lessMotion : null;
        pushNotifications ? foundUserProfile.pushNotifications = pushNotifications : null;
        userTheme ? foundUserProfile.userTheme = userTheme : null;
        chain ? foundUserProfile.chain = chain : null;
        chainId ? foundUserProfile.chainId = chainId : null;

        const savedFoundProfile = await foundUserProfile.save()
       
        const savedFoundUser = await foundUser.save()

        if (savedFoundProfile && savedFoundUser) {
            res.json({ message: "Success!" })
        }

    })
}

const getProductOwners = async (req, res) => {
    
    const { productId, loggedUserId } = req.query

    if (!productId || !loggedUserId ) {
        return res.status(400).json({ message: 'Missing required info' })
    }

    try {

        const productOwners = await Product.findOne({_id: productId}).select("ownedBy")
        const peopleFollowers = await Peoplefollowers.findOne({_userId: loggedUserId}).select("allPeopleFollowers")
        const storeFollowers = await Storefollowers.findOne({_userId: loggedUserId}).select("allStoreFollowers")

        if(productOwners){

            if(productOwners.ownedBy?.length > 0){

                const userData = await User.find({_id: {$in: productOwners.ownedBy?.map(e=>e._userId)}}).limit(200)
                .select("_id profilePicURL username roles privacySetting blockedUsers")

                if(userData && peopleFollowers && storeFollowers){

                    return res.status(200).json({ userData, peopleFollowers, storeFollowers })

                } else {

                    return res.status(401).json({ message: 'Operation failed' })
                }

            } else {

                return res.status(201).json({})
            }
        }

    } catch (err){

        return res.status(400).json({ message: err})
    }
}

const addProductBan = async (req, res) => {
    
    const { userId, bannedProductId } = req.body

    if (!userId || !bannedProductId) {
        return res.status(400).json({ message: 'User ID Required' })
    }

    const checkUserRoles = await User.findOne({_id: userId}).select("_id deactivated roles")

    if(!checkUserRoles){

        return res.status(403).json({ message: 'User ID Required' })
    
    } else {

        if(! Object.values(checkUserRoles.roles).includes(5150)){

            return res.status(403).json({ message: 'User ID Required' })
        
        } else {

            const foundProduct = await Product.findOne({_id: bannedProductId})

            if(foundProduct){

                if(foundProduct.deactivated === false){

                    foundProduct.deactivated = true;
                    
                    const updateBan = await BannedProduct.updateOne({admin: "admin"},{$push: {products: {_productId: bannedProductId, productname: foundProduct.productname}}})

                    const savedUpdate = await foundProduct.save()

                    if(savedUpdate && updateBan){

                        return res.status(200).json({'message': 'Added new ban'})
                    }
                
                } else {

                    return res.status(403).json({'message': 'Already banned this product'})
                }
            }
        }
    }
}

const removeProductBan = async (req, res) => {
    
    const { userId, bannedProductId } = req.query

    if (!userId || !bannedProductId) {
        return res.status(400).json({ message: 'User ID Required' })
    }

    const checkUserRoles = User.findOne({_id: userId}).select("_id deactivated roles")

    if(!checkUserRoles){

        return res.status(403).json({ message: 'User ID Required' })
    
    } else {

        if(! Object.values(checkUserRoles.roles).includes(5150)){

            return res.status(403).json({ message: 'User ID Required' })
        
        } else {

            const foundProduct = await Product.findOne({_id: bannedProductId})

            if(foundProduct){

                if(foundProduct.deactivated == true){

                    foundProduct.deactivated = false;

                    const savedUpdate = await foundProduct.save()

                    const updateBan = await BannedProduct.updateOne({admin: "admin"}, {$pull: {products: {_productId: bannedProductId}}})

                    if(savedUpdate && updateBan){

                        return res.status(200).json({'message': 'Added new ban'})
                    }
                
                } else {

                    return res.status(403).json({'message': 'Operation failed'})
                }
            }
        }
    }
}

module.exports = { getProductProfile, getProductPosts, getProductOwners, addProductBan, removeProductBan }