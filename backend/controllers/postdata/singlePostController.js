const User = require('../../model/User');
const Post = require('../../model/Post');
const Product = require('../../model/Product');
const Bookmark = require('../../model/Bookmark');
const Sharedpost = require('../../model/Sharedpost');
const Comment = require('../../model/Comment');
const UserProfile = require('../../model/UserProfile');
const StoreProfile = require('../../model/StoreProfile');
const OwnedProducts = require('../../model/OwnedProducts');
const UsageLimit = require('../../model/UsageLimit');
const ProductFollowers = require('../../model/Productfollowers');
const BannedUser = require('../../model/BannedUser');
const Flags = require('../../model/Flags');
const BannedProduct = require('../../model/BannedProduct');
const  {deleteFile} = require("../../controllers/media/s3Controller");

const languageList = require('../languageCheck');
const jwt = require('jsonwebtoken');
const ObjectId = require('mongodb').ObjectId;
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

const getSinglePost = async (req, res) => {
    
    const { postId, loggedUserId } = req.query

    if (!postId || !loggedUserId) {
        return res.status(400).json({ message: 'User ID Required' })
    }

    try {

        const postData = await Post.findOne({ _id: postId })
        const ownedProductsFound = await OwnedProducts.findOne({_userId: loggedUserId})
        const userBookmarks = await Bookmark.findOne({ _userId: loggedUserId })
        const flaggedList = await Flags.findOne({_userId: loggedUserId}).select("userFlags postFlags")

        var sharedpostsFound = await Sharedpost.findOne({_userId: loggedUserId})

        let doneFlags = false;
        let donePostData = false;
        let doneProducts = false;
        let userData = null;
        let productData = null;
        let flaggedPosts = [];
        let foundProducts = []

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

        
        if(postData){

            userData = await User.findOne({_id: postData._userId}).select("_id blockedUsers profilePicURL privacySetting deactivated")
            productData = await Product.findOne({_id: postData._productId})

            if(postData.mediaCarouselURLs?.length === 0 && postData.mediaCarouselObjectIds?.length > 0){

                var finalMediaURLs = []

                for(let i=0; i<postData?.mediaCarouselObjectIds?.length; i++){
                
                    var signParams = {
                        Bucket: wasabiPrivateBucketUSA, 
                        Key: postData.mediaCarouselObjectIds[i],
                        Expires: 7200
                      };
        
                    var url = s3.getSignedUrl('getObject', signParams);
        
                    finalMediaURLs.push(url)
                }

                var finalVideoURLs = []

                for(let i=0; i<postData.videoCarouselObjectIds?.length; i++){

                    if(postData?.videoCarouselObjectIds[i] !== 'image'){

                        var signParams = {
                            Bucket: wasabiPrivateBucketUSA, 
                            Key: postData.videoCarouselObjectIds[i],
                            Expires: 7200
                          };
            
                        var url = s3.getSignedUrl('getObject', signParams);
            
                        finalVideoURLs.push(url)

                    } else {

                        finalVideoURLs.push('image')
                    }
                }

                postData.mediaCarouselURLs = finalMediaURLs
                postData.videoCarouselURLs = finalVideoURLs
                postData.previewMediaURL = finalMediaURLs[postData.coverIndex]

                postData.markModified('mediaCarouselURLs')
                postData.markModified('videoCarouselURLs')
                postData.markModified('previewMediaURL')

            } else if(postData.mediaCarouselObjectIds?.length > 0) {

                for(let i=0; i<postData.mediaCarouselURLs?.length; i++){
                    
                    var signedUrl = postData.mediaCarouselURLs[i];

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
                            Key: postData.mediaCarouselObjectIds[i],
                            Expires: 7200
                          };
            
                        var url = s3.getSignedUrl('getObject', signParams);
            
                        postData.mediaCarouselURLs[i] = url
                    }

                    if(postData.coverIndex === i){
                        postData.previewMediaURL = postData.mediaCarouselURLs[i]
                    }
                }

                for(let i=0; i<postData.videoCarouselURLs?.length; i++){

                    if(postData.videoCarouselURLs[i] !== 'image'){

                        var signedUrl = postData.videoCarouselURLs[i];

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
                                Key: postData.videoCarouselObjectIds[i],
                                Expires: 7200
                            };
                
                            var url = s3.getSignedUrl('getObject', signParams);
                
                            postData.videoCarouselURLs[i] = url
                        }
                    }
                }

                postData.markModified('mediaCarouselURLs')
                postData.markModified('videoCarouselURLs')
                postData.markModified('previewMediaURL')
            
            } else if(!postData.previewMediaURL && postData.mediaCarouselObjectIds?.length === 0){

                var signParams = {
                    Bucket: wasabiPrivateBucketUSA, 
                    Key: postData.previewMediaObjectId, 
                    Expires: 7200
                };

                var url = s3.getSignedUrl('getObject', signParams);

                postData.previewMediaURL = url
                postData.markModified('previewMediaURL')
            
            } else if(postData.mediaCarouselObjectIds?.length === 0) {

                var signedUrl = postData.previewMediaURL

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
                        Key: postData.previewMediaObjectId,
                        Expires: 7200
                    };
        
                    var url = s3.getSignedUrl('getObject', signParams);
        
                    postData.previewMediaURL = url
                    postData.markModified('previewMediaURL')
                }
            }   

            postData.update()

            donePostData = true;
        
        } else {
            donePostData = false;
        }

        if(productData){
            foundProducts = productData
            doneProducts = true
        } else {
            doneProducts = true
        }

        if(userData && doneProducts && ownedProductsFound && userBookmarks && doneSharedposts && donePostData){

            return res.status(200).json({postData, userData, foundProducts, flaggedPosts, userBookmarks, 
                ownedProductsFound, sharedpostsFound})
        }

    } catch (err) {

        console.log(err)

        return res.status(401).json({ message: 'Operation failed' })
    }
 
}   

const addSingleReviewPost = async (req, res) => {

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

        var { userId, username, productname, storename, primaryCategory, totalPrice, starRating, numberOfItems, 
            previewMediaObjectId, imageObjectArray, videoObjectArray, coverIndex, mediaTypes, previewMediaType,
            caption, link, tesserText, taxChargesIncluded, priceNegotiable, measurement, description, userOrStore, 
            currency, priceRange, openToResell, resellPrice, city, region, country } = req.body
    
        if (!userId || !foundUser._id.toString() === userId || !username 
        || !previewMediaObjectId || !imageObjectArray || !productname || !totalPrice ){
            return res.status(400).json({ 'message': 'Missing required fields!' });
        } 

        if(productname.length > 250 || storename?.length > 50 || primaryCategory?.length > 50 
            || caption?.length > 250 || link?.length > 1000 || measurement?.length > 30 || description?.length > 10000
            || imageObjectArray?.length > 10 || Number(coverIndex) > 10 || Number(coverIndex) > imageObjectArray?.length 
            || Number(numberOfItems) > 1000000
             ){
                return res.status(400).json({ 'message': 'Content does not meet requirements!' });
            }

        var numRatings = 0
        if(starRating && starRating !== 0){
            numRatings = 1
        } else {
            starRating = 0
        }

        var userOrStore = Number(userOrStore)

        var textToCheck = username.concat(" ", productname, " ", storename, " ", primaryCategory, 
            " ", caption, " ", link, " ", priceRange, " ", measurement, " ", currency, " ", 
                description, " ", tesserText).toLowerCase();

        const productBan = await BannedProduct.findOne({admin: "admin"})

        if(productBan){

            if(productBan.products?.some(e=>e.productname === productname)){
                return res.status(403).json({"Message": "This product was marked for review"})
            }

            const foundLimits = await UsageLimit.findOne({_userId: userId})

            if(foundLimits){

                try{

                    for(let i=0; i < languageList.length; i++){
                        
                        if(textToCheck.indexOf(languageList[i]) !== -1){
                            
                            foundLimits.warningsCount = foundLimits.warningsCount + 3
                            
                            if(foundLimits.warningsCount >= 7){
                                
                                foundUser.deactivated = true;
                                
                                const savedLimits = await foundLimits.save();
                                const savedUser = await foundUser.save();

                                if(savedUser && savedLimits){
                                    if(foundUser?.primaryGeoData){
                                        const addIPBan = await BannedUser.updateOne({admin: "admin"},{$push: {ipAddresses: {userIP: foundUser.primaryGeoData.IPv4}}})
                                        if(addIPBan){
                                            return res.status(401).json({"message":"Inappropriate content"})              
                                        }
                                    } else {
                                        return res.status(401).json({"message":"Inappropriate content"})          
                                    }
                                } 
                            } else {

                                const savedLimits = await foundLimits.save()

                                if(savedLimits){

                                    return res.status(401).json({"message":"Inappropriate content"})  
                                }
                            }
                        }
                    }
        
                    var todaysDate = new Date().toLocaleDateString()
                    var doneOperation = false;
                
                    if(foundLimits.numberOfPosts?.length > 0){

                        if(foundLimits.numberOfPosts?.some(e=>e.date === todaysDate)){
        
                            for(let i=0; i< foundLimits.numberOfPosts.length; i++){

                                if(foundLimits.numberOfPosts[i].date === todaysDate){

                                    if(foundLimits.numberOfPosts[i].postsNumber >= 10){
                                        
                                        return res.status(401).json({ message: 'Reached posting limit for today' })
                                    
                                    } else {
            
                                        foundLimits.numberOfPosts[i].postsNumber = foundLimits.numberOfPosts[i].postsNumber + 1
                                        const savedLimits = await foundLimits.save()
                                        
                                        if(savedLimits){
                                            doneOperation = true;
                                        }
                                        
                                        break;
                                    }
                                }
                            }

                        } else {

                            foundLimits.numberOfPosts.push({date: todaysDate, postsNumber: 1 })
                            const savedLimits = await foundLimits.save()
                            if(savedLimits){
                                doneOperation = true;
                            }
                        }

                    } else {
        
                        foundLimits.numberOfPosts = [{date: todaysDate, postsNumber: 1 }]
                        const savedLimits = await foundLimits.save()
                        if(savedLimits){
                            doneOperation = true;
                        }
                    }
        
                    if(doneOperation){
        
                        var doneProductPost = false;
                        var doneStoreUpdate = false;
                
                        const foundOwnedProducts = await OwnedProducts.findOne({_userId: userId})
                
                        var signedMediaURLs = [];

                        for(let i=0; i<imageObjectArray?.length; i++){

                            var signParams = {
                                Bucket: wasabiPrivateBucketUSA, 
                                Key: imageObjectArray[i], 
                                Expires: 7200
                            };

                            var signedURL = s3.getSignedUrl('getObject', signParams);
                            signedMediaURLs.push(signedURL)
                        }

                        var signedVideoURLs = []

                        for(let i=0; i< videoObjectArray?.length; i++){

                            if(videoObjectArray[i] !== 'image'){

                                var signParams = {
                                    Bucket: wasabiPrivateBucketUSA, 
                                    Key: videoObjectArray[i], 
                                    Expires: 7200
                                };
    
                                var signedURL = s3.getSignedUrl('getObject', signParams);
                                signedVideoURLs.push(signedURL)

                            } else {

                                signedVideoURLs.push("image")
                            }
                        }

                        var signedPreviewURL = signedMediaURLs[coverIndex]
                
                        if(!primaryCategory){
                            primaryCategory = "All"
                        }
                
                        taxChargesIncluded == true ? taxChargesIncluded = 1 : taxChargesIncluded = 0
                        priceNegotiable == true ? priceNegotiable = 1 : priceNegotiable = 0
                        openToResell == true ? openToResell = 1 : openToResell = 0
                        
                        var isStorePost = false; 
                        if(userOrStore === 2){
                            isStorePost = true
                        }

                        let marketRanking = 2;
                        const currentDate = new Date();
                        const timeScore = Math.ceil(currentDate.getTime() / 86400);
                        const marketScore = (4 - marketRanking) * 1000
                        const finalScore = timeScore + marketScore

                        var doneLanguage = true;
                        var selectedLanguage = "English";

                        if(doneLanguage){

                            var createPost = new Post({
                                "_userId": userId,
                                "username": username,
                                "language": selectedLanguage,
                                "productname": productname,
                                "storename": storename,
                                "primaryCategory": primaryCategory,
                                "totalPrice": totalPrice,
                                "numberOfItems": numberOfItems,
                                "starRating": starRating,
                                "previewMediaObjectId": previewMediaObjectId,
                                "previewMediaURL": signedPreviewURL,
                                "coverIndex": coverIndex,
                                "previewMediaType": previewMediaType,
                                "mediaCarouselObjectTypes": mediaTypes,
                                "mediaCarouselObjectIds": imageObjectArray,
                                "videoCarouselObjectIds": videoObjectArray,
                                "mediaCarouselURLs": signedMediaURLs,
                                "videoCarouselURLs": signedVideoURLs,
                                "caption": caption,
                                "link": link,
                                "measurement": measurement, 
                                "openToResell": openToResell, 
                                "resellPrice": resellPrice, 
                                "description": description,
                                "taxChargesIncluded": taxChargesIncluded, 
                                "priceNegotiable": priceNegotiable, 
                                "currency": currency,
                                "priceRange": priceRange,
                                "isStorePost": isStorePost,
                                "resellPrice": resellPrice,
                                "city": city,
                                "region": region,
                                "country": country,
                                "privacySetting": foundUser.privacySetting,
                                "postClass": 0,
                                "score": finalScore,
                            })
                    
                            createPost.save( async function(err, newPost){
                    
                                if(err){
                                    return res.status(500).json({ 'Message': err.message });
                                }
                    
                                if(foundOwnedProducts){
                    
                                    const foundProduct = await Product.findOne({productname: productname })
                    
                                    if(foundProduct){
                    
                                        if(foundProduct?.relatedPosts?.length > 0){
                                        
                                            foundProduct.relatedPosts.push({_postId: newPost._id})
                                            
                                            if(foundProduct.ownedBy?.some(e=>e._userId.toString() === userId)){
                                                for(let i=0; i<foundProduct.ownedBy.length;i++){
                                                    if(foundProduct.ownedBy[i]._userId.toString() === userId){
                                                        foundProduct.ownedBy[i].ownedCount = foundProduct.ownedBy[i].ownedCount + 1
                                                    }
                                                }
                                            } else {
                                                foundProduct.ownedBy.push({_userId: userId, ownedCount: 1})    
                                                foundProduct.ownedByCount = foundProduct.ownedByCount + 1
                                            }
                    
                                            if(userOrStore == 1){
                    
                                                if(storename){
                    
                                                    const foundStore = await StoreProfile.findOne({storename: storename})
                                                    
                                                    if(foundStore){
                                                        
                                                        if(foundStore.taggedPosts?.length > 0){
                                    
                                                            foundStore.taggedPosts.push({_postId: newPost._id})
                    
                                                            const savedStore = await foundStore.save()
                                                            
                                                            if(savedStore){
                                                                doneStoreUpdate = true;
                                                            }
                    
                                                        } else {
                                    
                                                            foundStore.taggedPosts = [{_postId: newPost._id}]
                    
                                                            const savedStore = await foundStore.save()
                                                            
                                                            if(savedStore){
                                                                doneStoreUpdate = true;
                                                            }
                                                        }
                                                    
                                                    } else {
                    
                                                        doneStoreUpdate = true;
                                                    }
                                                
                                                } else {
                                                    doneStoreUpdate = true;
                                                }
                                            }
                    
                                            if(! foundOwnedProducts.products.some(e=>e._productId.equals(foundProduct._id))){
                                                foundOwnedProducts.products.push({_productId: foundProduct._id, _postId: newPost._id, productname: productname})
    
                                                if(starRating !== 0){
                                                    foundProduct.totalStars = foundProduct.totalStars + starRating
                                                    foundProduct.numberOfRatings = foundProduct.numberOfRatings + 1
                                                }
                                            }
                    
                                            const updatedPost = await Post.updateOne({_id: newPost._id}, {$set: {_productId: foundProduct._id}})
                                            const savedProduct = await foundProduct.save()
                                            const pushedProducts = await foundOwnedProducts.save()
                    
                                            if(pushedProducts && savedProduct && updatedPost){
                                                doneProductPost = true;
                                            }
                    
                                        } else {
                    
                                            foundProduct.relatedPosts = [{_postId: newPost._id}]
                                            foundProduct.ownedBy = [{_userId: userId, ownedCount: 1}]
                                            foundProduct.ownedByCount = foundProduct.ownedByCount + 1
                                            
                                            if(userOrStore == 1){
                                                
                                                if(storename){
                    
                                                    const foundStore = await StoreProfile.findOne({storename: storename})
                                                    
                                                    if(foundStore){
                                                        
                                                        if(foundStore.taggedPosts?.length > 0){
                                    
                                                            foundStore.taggedPosts.push({_postId: newPost._id})
                    
                                                            const savedStore = await foundStore.save()
                                                            
                                                            if(savedStore){
                                                                doneStoreUpdate = true;
                                                            }
                    
                                                        } else {
                                    
                                                            foundStore.taggedPosts = [{_postId: newPost._id}]
                    
                                                            const savedStore = await foundStore.save()
                                                            
                                                            if(savedStore){
                                                                doneStoreUpdate = true;
                                                            }
                                                        }
                                                    
                                                    } else {
                    
                                                        doneStoreUpdate = true;
                                                    }
                                                
                                                } else {
                                                    doneStoreUpdate = true;
                                                }
                                            }
                    
                                            if(! foundOwnedProducts.products.some(e=>e._productId.equals(foundProduct._id))){
    
                                                if(starRating !== 0){
                                                    foundProduct.totalStars = foundProduct.totalStars + starRating
                                                    foundProduct.numberOfRatings = foundProduct.numberOfRatings + 1
                                                }
                        
                                                foundOwnedProducts.products.push({_productId: foundProduct._id, _postId: newPost._id, productname: productname})
                                            }
                    
                                            const updatedPost = await Post.updateOne({_id: newPost._id}, {$set: {_productId: foundProduct._id}})
                                            const pushedProducts = await foundOwnedProducts.save()
                                            const savedProduct = await foundProduct.save()
                    
                                            if(pushedProducts && savedProduct && updatedPost){
                                                doneProductPost = true;
                                            }
                                        }
                                        
                                    } else {
                    
                                        if(userOrStore == 1){
                    
                                            if(storename){
                    
                                                const foundStore = await StoreProfile.findOne({storename: storename})
                                                
                                                if(foundStore){
                                                    
                                                    if(foundStore.taggedPosts?.length > 0){
                                
                                                        foundStore.taggedPosts.push({_postId: newPost._id})
                    
                                                        const savedStore = foundStore.save()
                                                        
                                                        if(savedStore){
                                                            doneStoreUpdate = true;
                                                        }
                    
                                                    } else {
                                
                                                        foundStore.taggedPosts = [{_postId: newPost._id}]
                    
                                                        const savedStore = foundStore.save()
                                                        
                                                        if(savedStore){
                                                            doneStoreUpdate = true;
                                                        }
                                                    }
                                                
                                                } else {
                    
                                                    doneStoreUpdate = true;
                                                }
                                            
                                            } else {
                                                doneStoreUpdate = true;
                                            }
    
                                            var ownedNum = 1;
    
                                            if(foundUser.email?.includes("@purchies.com")){
                                                ownedNum = Math.ceil(Math.random() * (30 - 5)) + 5;
                                            }
                    
                                            const newProduct = new Product({
                                                "primaryCategory": primaryCategory,
                                                "totalStars": starRating,
                                                "numberOfRatings": numRatings,
                                                "relatedPosts": [{_postId: newPost._id}],
                                                "productname": productname,
                                                "ownedBy": [{_userId: userId, ownedCount: ownedNum}],
                                                "ownedByCount": ownedNum
                                            })
                    
                                            const savedProduct = await newProduct.save()
                    
                                            if(savedProduct){
                                                
                                                let productFollowers = new ProductFollowers({
                                                    "_productId": savedProduct._id,
                                                    });
                                
                                                const savedFollowers = await productFollowers.save()
                    
                                                const updatedPost = await Post.updateOne({_id: newPost._id}, {$set: {_productId: savedProduct._id}})
                    
                                                foundOwnedProducts.products.push({_productId: savedProduct._id, _postId: newPost._id, productname: productname})
                    
                                                const pushedProducts = await foundOwnedProducts.save()
                    
                                                if(pushedProducts && updatedPost && savedFollowers){
                                                    doneProductPost = true;
                                                }
                                            }
                                        } 
                                    }
                                    
                                    if(userOrStore == 1){
                    
                                        const foundUserProfile = await UserProfile.findOne({"_userId":userId})
                                        const updatedUser = await User.updateOne({_id: userId},{$set: {lastPosting: new Date()}})
                    
                                        if(foundUserProfile && updatedUser){
                    
                                            foundUserProfile.userPosts.push({_postId: newPost._id, primaryCategory: primaryCategory})
                    
                                            const savedUser = await foundUserProfile.save()
            
                                            if(savedUser && doneProductPost && doneStoreUpdate){
                    
                                                return res.status(201).json({ message: 'Success' })
                                            }
                                        }
                    
                                    } 
                                }
                            })   
                        }  
                    }
                    
                } catch (err) {
            
                    return res.status(401).json({ message: err })
                }
            }
        }
    })
}

const addSingleSocialPost = async (req, res) => {

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

        var { userId, username, primaryCategory, previewMediaObjectId, imageObjectArray, videoObjectArray, 
            coverIndex, mediaTypes, previewMediaType, caption, link, description, imageText, tesserText, 
            userOrStore, city, region, country } = req.body
    
        if (!userId || !foundUser._id.toString() === userId || !username 
        || !previewMediaObjectId || !imageObjectArray ){
            return res.status(400).json({ 'message': 'Missing required fields!' });
        } 

        if( primaryCategory?.length > 50 || caption?.length > 250 || link?.length > 1000 
            || imageObjectArray?.length > 10 || Number(coverIndex) > 10 || Number(coverIndex) > imageObjectArray?.length ){
            return res.status(400).json({ 'message': 'Content does not meet requirements!' });
        }

        userOrStore = Number(userOrStore)

        var isStorePost = false; 
        if(userOrStore === 2){
            isStorePost = true
        }

        var textToCheck = username.concat(" ", primaryCategory, " ", caption, " ", link, " ", description, " ",
            imageText, " ", tesserText, " ", city, " ", region, " ", country).toLowerCase()

        const productBan = await BannedProduct.findOne({admin: "admin"})

        if(productBan){

            if(productBan.products?.some(e=>e.productname === productname)){
                return res.status(403).json({"Message": "This product was marked for review"})
            }

            const foundLimits = await UsageLimit.findOne({_userId: userId})

            if(foundLimits){

                try{

                    for(let i=0; i < languageList.length; i++){
                        
                        if(textToCheck.indexOf(languageList[i]) !== -1){
                            
                            foundLimits.warningsCount = foundLimits.warningsCount + 3
                            
                            if(foundLimits.warningsCount >= 7){
                                
                                foundUser.deactivated = true;
                                
                                const savedLimits = await foundLimits.save();
                                const savedUser = await foundUser.save();

                                if(savedUser && savedLimits){
                                    if(foundUser?.primaryGeoData){
                                        const addIPBan = await BannedUser.updateOne({admin: "admin"},{$push: {ipAddresses: {userIP: foundUser.primaryGeoData.IPv4}}})
                                        if(addIPBan){
                                            return res.status(401).json({"message":"Inappropriate content"})              
                                        }
                                    } else {
                                        return res.status(401).json({"message":"Inappropriate content"})          
                                    }
                                } 
                            } else {

                                const savedLimits = await foundLimits.save()

                                if(savedLimits){

                                    return res.status(401).json({"message":"Inappropriate content"})  
                                }
                            }
                        }
                    }
        
                    var todaysDate = new Date().toLocaleDateString()
                    var doneOperation = false;
                
                    if(foundLimits.numberOfPosts?.length > 0){

                        if(foundLimits.numberOfPosts?.some(e=>e.date === todaysDate)){
        
                            for(let i=0; i< foundLimits.numberOfPosts.length; i++){

                                if(foundLimits.numberOfPosts[i].date === todaysDate){

                                    if(foundLimits.numberOfPosts[i].postsNumber >= 10){
                                        
                                        return res.status(401).json({ message: 'Reached posting limit for today' })
                                    
                                    } else {
            
                                        foundLimits.numberOfPosts[i].postsNumber = foundLimits.numberOfPosts[i].postsNumber + 1
                                        const savedLimits = await foundLimits.save()
                                        
                                        if(savedLimits){
                                            doneOperation = true;
                                        }
                                        
                                        break;
                                    }
                                }
                            }

                        } else {

                            foundLimits.numberOfPosts.push({date: todaysDate, postsNumber: 1 })
                            const savedLimits = await foundLimits.save()
                            if(savedLimits){
                                doneOperation = true;
                            }
                        }

                    } else {
        
                        foundLimits.numberOfPosts = [{date: todaysDate, postsNumber: 1 }]
                        const savedLimits = await foundLimits.save()
                        if(savedLimits){
                            doneOperation = true;
                        }
                    }
        
                    if(doneOperation){
                
                        var signedMediaURLs = []

                        for(let i=0; i<imageObjectArray?.length; i++){

                            var signParams = {
                                Bucket: wasabiPrivateBucketUSA, 
                                Key: imageObjectArray[i], 
                                Expires: 7200
                            };

                            var signedURL = s3.getSignedUrl('getObject', signParams);
                            signedMediaURLs.push(signedURL)
                        }

                        var signedVideoURLs = []

                        for(let i=0; i< videoObjectArray?.length; i++){

                            if(videoObjectArray[i] !== 'image'){

                                var signParams = {
                                    Bucket: wasabiPrivateBucketUSA, 
                                    Key: videoObjectArray[i], 
                                    Expires: 7200
                                };
    
                                var signedURL = s3.getSignedUrl('getObject', signParams);
                                signedVideoURLs.push(signedURL)

                            } else {

                                signedVideoURLs.push("image")
                            }
                        }

                        var signedPreviewURL = signedMediaURLs[coverIndex]
                
                        if(!primaryCategory){
                            primaryCategory = "All"
                        }

                        let marketRanking = 2;
                        const currentDate = new Date();
                        const timeScore = Math.ceil(currentDate.getTime() / 86400);
                        const marketScore = (4 - marketRanking) * 1000
                        const finalScore = timeScore + marketScore

                        var doneLanguage = true;
                        var selectedLanguage = "English";

                        if(doneLanguage){

                            var createPost = new Post({
                                "_userId": userId,
                                "username": username,
                                "language": selectedLanguage,
                                "primaryCategory": primaryCategory,
                                "previewMediaObjectId": previewMediaObjectId,
                                "previewMediaURL": signedPreviewURL,
                                "coverIndex": coverIndex,
                                "previewMediaType": previewMediaType,
                                "mediaCarouselObjectTypes": mediaTypes,
                                "mediaCarouselObjectIds": imageObjectArray,
                                "videoCarouselObjectIds": videoObjectArray,
                                "mediaCarouselURLs": signedMediaURLs,
                                "videoCarouselURLs": signedVideoURLs,
                                "caption": caption,
                                "link": link,
                                "description": description,
                                "city": city,
                                "region": region,
                                "country": country,
                                "postClass": 2,
                                "isStorePost": isStorePost,
                                "privacySetting": foundUser.privacySetting,
                                "score": finalScore,
                            })
                    
                            createPost.save( async function(err, newPost){
                    
                                if(err){
                                    return res.status(500).json({ 'Message': err.message });
                                }
                                
                                if(!Object.values(foundUser.roles).includes(3780)){
                
                                    const foundUserProfile = await UserProfile.findOne({"_userId":userId})
                
                                    if(foundUserProfile){
                
                                        foundUserProfile.userPosts.push({_postId: newPost._id, primaryCategory: primaryCategory, postClass: 2})
                
                                        const updatedUser = await User.updateOne({_id: userId},{$set: {lastPosting: new Date()}})
    
                                        const savedUser = await foundUserProfile.save()
        
                                        if(savedUser && updatedUser){
                
                                            return res.status(201).json({ message: 'Success' })
                                        }
                                    }
                
                                } else {
                
                                    const foundStore = await StoreProfile.findOne({"_userId":userId})
                
                                    if(foundStore){
                
                                        foundStore.storePosts.push({_postId: newPost._id, primaryCategory: primaryCategory, postClass: 2})
                
                                        const updatedUser = await User.updateOne({_id: userId},{$set: {lastPosting: new Date()}})
    
                                        const savedStore = await foundStore.save()
                
                                        if(savedStore && updatedUser){
                
                                            return res.status(201).json({ message: 'Success' })
                                        }
                                    }
                                }
                            }) 
                        }    
                    }
                    
                } catch (err) {
            
                    return res.status(401).json({ message: err })
                }
            }
        }
    })
}

const addSingleSellingPost = async (req, res) => {

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

        var { userId, username, productname, storename, primaryCategory, supplier, totalPrice, preorderPrice, numberOfItems, 
            itemWeight, longestSide, medianSide, shortestSide, previewMediaObjectId, imageObjectArray, videoObjectArray, coverIndex, mediaTypes,
            previewMediaType, caption, link, tesserText, sizes, colors, colorcodes, models, brand, measurement, style, seasons, inStock, 
            taxChargesIncluded, buyNowSwitch, preorderSwitch, priceNegotiable, promotion, preorderDeadline, promotionStart, 
            promotionEnd, shippingOffered, shippingEarly, shippingLate, remainingInventory, minimumOrderQuantity,
            oldPrice, description, userOrStore, currency, priceRange, city, region, country } = req.body

        if (!userId || !foundUser._id.toString() === userId || !username 
        || !previewMediaObjectId || !imageObjectArray || !productname || !totalPrice  ){
            return res.status(400).json({ 'message': 'Missing required fields!' });
        } 

        if(productname.length > 250 || storename?.length > 50 || primaryCategory?.length > 50 || supplier?.length > 350 
            || imageObjectArray?.length > 10 || Number(coverIndex) > 10 || Number(coverIndex) > imageObjectArray?.length
            || caption?.length > 250 || link?.length > 1000 || measurement?.length > 30 || description?.length > 10000 || mediaTypes?.length === 0
            || (sizes?.length > 0 && sizes?.toString().length > 350) || (colors?.length > 0 && colors.toString().length > 350) 
            || (colorcodes?.length > 0 && colorcodes.toString().length > 350) || (models?.length > 0 && models.toString().length > 350) || style?.length > 50
            || (seasons?.length > 0 && seasons.toString().length > 30) || brand?.length > 50 || promotionStart?.length > 25 
            || preorderDeadline?.length > 25 || promotionEnd?.length > 25 || shippingEarly?.length > 25 || shippingLate?.length > 25 
            || Number(numberOfItems) > 1000000 || Number(itemWeight) > 1000000000 || Number(longestSide) > 1000000000 
            || Number(medianSide) > 1000000000 || Number(shortestSide) > 1000000000 ) {
                return res.status(400).json({ 'message': 'Content does not meet requirements!' });
            }

        coverIndex = Number(coverIndex)
        userOrStore = Number(userOrStore)
        if(remainingInventory && Number(remainingInventory) >= 0 && Number(remainingInventory) < 1000000){
            remainingInventory = Number(remainingInventory)
        } else {
            remainingInventory = 1
        }
        if(minimumOrderQuantity && Number(minimumOrderQuantity) >= 0 && Number(minimumOrderQuantity) < 1000000){
            minimumOrderQuantity = Number(minimumOrderQuantity)
        } else {
            minimumOrderQuantity = 1
        }

        if(sizes?.length === 0){
            sizes = ['Default']
        }

        if(colors?.length === 0){
            colors = ['Default']
        }

        if(models?.length === 0){
            models = ['Default']
        }

        if(!link){
            link = ""
        }

        //->Match against Amazon classes, https://sell.amazon.ca/pricing?ref_=sdca_soa_priov_n#fulfillment-fees
        // 1) Envelope, first 100 grams for CAD$4.04 then CAD$0.32 per 100 grams
        // 2) Standard, first 250 grams for CAD$5.92, $6.38 for 250 to 500 grams, $7.27 for 500 to 100 grams,
            //$8.06 for 1000 grams to 1500 grams, from 1500 grams and above First 1,500 g at CAD $8.72, and each additional 500 g at CAD $0.42
        // 3) Small Oversize
        // 4) Medium Oversize 
        // 5) Large Oversize
        // 6) Special Oversize

        let shippingItemClassCAD = 2

        if (itemWeight <= 500 && longestSide <= 38 && medianSide <= 27 && shortestSide <= 2){

            shippingItemClassCAD = 1
        
        } else if (itemWeight <= 9000 && longestSide <= 45 && medianSide <= 35 && shortestSide <= 20){

            shippingItemClassCAD = 2

        } else if (itemWeight <= 32000 && longestSide <= 152 && medianSide <= 76 && (longestSide + ((medianSide + shortestSide) * 2) <= 330) ) {

            shippingItemClassCAD = 3 
            //smalloversize
        } else if (itemWeight <= 68000 && longestSide <= 270 && (longestSide + ((medianSide + shortestSide) * 2) <= 330) ) {

            shippingItemClassCAD = 4
            //mediumoversize
        
        } else if (itemWeight <= 68000 && longestSide <= 270 && ( longestSide + ((medianSide + shortestSide) * 2) <= 419) ) {

            shippingItemClassCAD = 5
            //largeoversize
        
        } else {

            shippingItemClassCAD = 6
            //specialoversize
        } 

        var isStorePost = false; 
        if(userOrStore === 2){
            isStorePost = true
        }

        var textToCheck = username.concat(" ", productname, " ", storename, " ", primaryCategory, " ", supplier, " ", 
            caption, " ", link, " ", sizes?.toString(), " ", colors?.toString(), " ", colorcodes?.toString(), " ", models?.toString(), " ",
             brand, " ", priceRange, " ", measurement, " ", style, " ", currency, " ", description, " ", seasons.toString(), 
            " ", tesserText).toLowerCase();

        const productBan = await BannedProduct.findOne({admin: "admin"})

        if(productBan){

            if(productBan.products?.some(e=>e.productname === productname)){
                return res.status(403).json({"Message": "This product was marked for review"})
            }

            const foundLimits = await UsageLimit.findOne({_userId: userId})

            if(foundLimits){

                try{

                    for(let i=0; i < languageList.length; i++){
                        
                        if(textToCheck.indexOf(languageList[i]) !== -1){
                            
                            foundLimits.warningsCount = foundLimits.warningsCount + 3
                            
                            if(foundLimits.warningsCount >= 7){
                                
                                foundUser.deactivated = true;
                                
                                const savedLimits = await foundLimits.save();
                                const savedUser = await foundUser.save();

                                if(savedUser && savedLimits){
                                    if(foundUser?.primaryGeoData){
                                        const addIPBan = await BannedUser.updateOne({admin: "admin"},{$push: {ipAddresses: {userIP: foundUser.primaryGeoData.IPv4}}})
                                        if(addIPBan){
                                            return res.status(401).json({"message":"Inappropriate content"})              
                                        }
                                    } else {
                                        return res.status(401).json({"message":"Inappropriate content"})          
                                    }
                                } 
                            } else {

                                const savedLimits = await foundLimits.save()

                                if(savedLimits){

                                    return res.status(401).json({"message":"Inappropriate content"})  
                                }
                            }
                        }
                    }
        
                    var todaysDate = new Date().toLocaleDateString()
                    var doneOperation = false;
                
                    if(foundLimits.numberOfPosts?.length > 0){

                        if(foundLimits.numberOfPosts?.some(e=>e.date === todaysDate)){
        
                            for(let i=0; i< foundLimits.numberOfPosts.length; i++){

                                if(foundLimits.numberOfPosts[i].date === todaysDate){

                                    if(foundLimits.numberOfPosts[i].postsNumber >= 10){
                                        
                                        return res.status(401).json({ message: 'Reached posting limit for today' })
                                    
                                    } else {
            
                                        foundLimits.numberOfPosts[i].postsNumber = foundLimits.numberOfPosts[i].postsNumber + 1
                                        const savedLimits = await foundLimits.save()
                                        
                                        if(savedLimits){
                                            doneOperation = true;
                                        }
                                        
                                        break;
                                    }
                                }
                            }

                        } else {

                            foundLimits.numberOfPosts.push({date: todaysDate, postsNumber: 1 })
                            const savedLimits = await foundLimits.save()
                            if(savedLimits){
                                doneOperation = true;
                            }
                        }

                    } else {
        
                        foundLimits.numberOfPosts = [{date: todaysDate, postsNumber: 1 }]
                        const savedLimits = await foundLimits.save()
                        if(savedLimits){
                            doneOperation = true;
                        }
                    }
        
                    if(doneOperation){
        
                        var doneProductPost = false;
                        var doneStoreUpdate = false;

                        var foundStore = null;

                        if(Object.values(foundUser?.roles).includes(3780)){
                    
                            foundStore = await StoreProfile.findOne({storename: storename})
                        }
                
                        const foundOwnedProducts = await OwnedProducts.findOne({_userId: userId})
                
                        var signedMediaURLs = []

                        for(let i=0; i< imageObjectArray?.length; i++){

                            var signParams = {
                                Bucket: wasabiPrivateBucketUSA, 
                                Key: imageObjectArray[i], 
                                Expires: 7200
                            };

                            var signedURL = s3.getSignedUrl('getObject', signParams);
                            signedMediaURLs.push(signedURL)
                        }

                        var signedVideoURLs = []

                        for(let i=0; i< videoObjectArray?.length; i++){

                            if(videoObjectArray[i] !== 'image'){

                                var signParams = {
                                    Bucket: wasabiPrivateBucketUSA, 
                                    Key: videoObjectArray[i], 
                                    Expires: 7200
                                };
    
                                var signedURL = s3.getSignedUrl('getObject', signParams);
                                signedVideoURLs.push(signedURL)

                            } else {

                                signedVideoURLs.push("image")
                            }
                        }

                        var signedPreviewURL = signedMediaURLs[coverIndex]
                
                        if(!primaryCategory){
                            primaryCategory = "All"
                        }

                        if(!supplier){
                            supplier = "N/A"
                        }
                
                        inStock == true ? inStock = 1 : inStock = 0
                        promotion == true ? promotion = 1 : promotion = 0
                        shippingOffered == true ? shippingOffered = 1 : shippingOffered = 0
                        taxChargesIncluded == true ? taxChargesIncluded = 1 : taxChargesIncluded = 0
                        buyNowSwitch == true ? buyNowSwitch = 1 : buyNowSwitch = 0
                        preorderSwitch == true ? preorderSwitch = 1 : preorderSwitch = 0
                        priceNegotiable == true ? priceNegotiable = 1 : priceNegotiable = 0
                        remainingInventory == '' ? remainingInventory = 1 : remainingInventory = remainingInventory
                        minimumOrderQuantity == '' ? minimumOrderQuantity = 1 : minimumOrderQuantity = minimumOrderQuantity
                
                        let marketRanking = 2;
                        const currentDate = new Date();
                        const timeScore = Math.ceil(currentDate.getTime() / 86400);
                        const marketScore = (4 - marketRanking) * 1000
                        const finalScore = timeScore + marketScore;

                        // var languageDetect = productname.concat(" ", caption);
                        // let selectedLanguage = "";
                        
                        var doneLanguage = true;
                        var selectedLanguage = "English";
                        var retailerId = 0;
                        var retailerRanking = 5;

                        if(foundStore?.retailerId){
                            retailerId = foundStore?.retailerId
                        }

                        if(foundStore?.retailerRanking){
                            retailerRanking = 5
                        }

                        if(doneLanguage){

                            var createPost = new Post({
                                "_userId": userId,
                                "username": username,
                                "language": selectedLanguage,
                                "productname": productname,
                                "storename": storename,
                                "primaryCategory": primaryCategory,
                                "supplier": supplier,
                                "totalPrice": totalPrice,
                                "preorderPrice": preorderPrice,
                                "numberOfItems": numberOfItems,
                                "itemWeightGrams": itemWeight,
                                "itemDimensionLongest": longestSide,
                                "itemDimensionMedian": medianSide,
                                "itemDimensionShortest": shortestSide,
                                "shippingItemClassCAD": shippingItemClassCAD,
                                "canReceivePayments": foundUser.canReceivePayments,
                                "previewMediaObjectId": previewMediaObjectId,
                                "previewMediaURL": signedPreviewURL,
                                "coverIndex": coverIndex,
                                "previewMediaType": previewMediaType,
                                "mediaCarouselObjectTypes": mediaTypes,
                                "mediaCarouselObjectIds": imageObjectArray,
                                "videoCarouselObjectIds": videoObjectArray,
                                "mediaCarouselURLs": signedMediaURLs,
                                "videoCarouselURLs": signedVideoURLs,
                                "caption": caption,
                                "link": link,
                                "sizes": sizes, 
                                "colors": colors, 
                                "colorcodes": colorcodes,
                                "models": models,
                                "brand": brand, 
                                "measurement": measurement, 
                                "style": style, 
                                "seasons": seasons, 
                                "inStock": inStock, 
                                "taxChargesIncluded": taxChargesIncluded, 
                                "buyNowSwitch": buyNowSwitch, 
                                "preorderSwitch": preorderSwitch, 
                                "priceNegotiable": priceNegotiable, 
                                "inventoryCount": remainingInventory,
                                "minimumOrderQuantity": minimumOrderQuantity,
                                "promotion": promotion, 
                                "oldPrice": oldPrice,
                                "retailerId": retailerId,
                                "retailerRanking": retailerRanking,
                                "preorderDeadline": preorderDeadline, 
                                "promotionStart": promotionStart, 
                                "promotionEnd": promotionEnd,
                                "shippingSwitch": shippingOffered, 
                                "shippingDateEarly": shippingEarly, 
                                "shippingDateLate": shippingLate,
                                "openToResell": 0,
                                "description": description,
                                "currency": currency,
                                "priceRange": priceRange,
                                "isStorePost": isStorePost,
                                'city': city,
                                "region": region,
                                "country": country,
                                "privacySetting": foundUser.privacySetting,
                                "postClass": 1,
                                "transcript": tesserText,
                                "score": finalScore,
                            })
                    
                            createPost.save( async function(err, newPost){
                    
                                if(err){
                                    return res.status(500).json({ 'Message': err.message });
                                }
                    
                                if(foundOwnedProducts){
                    
                                    const foundProduct = await Product.findOne({productname: productname })
                    
                                    if(foundProduct){
                    
                                        if(foundProduct?.relatedPosts?.length > 0){
                                        
                                            foundProduct.relatedPosts.push({_postId: newPost._id})
                                            
                                            if(foundProduct.ownedBy?.some(e=>e._userId.toString() === userId)){
                                                for(let i=0; i<foundProduct.ownedBy.length;i++){
                                                    if(foundProduct.ownedBy[i]._userId.toString() === userId){
                                                        foundProduct.ownedBy[i].ownedCount = foundProduct.ownedBy[i].ownedCount + 1
                                                    }
                                                }
                                            } else {
                                                foundProduct.ownedBy.push({_userId: userId, ownedCount: 1})    
                                                foundProduct.ownedByCount = foundProduct.ownedByCount + 1
                                            }
                                                
                                            if(foundStore){
                                                
                                                if(foundStore.taggedPosts?.length > 0){
                            
                                                    foundStore.taggedPosts.push({_postId: newPost._id})
            
                                                    const savedStore = await foundStore.save()
                                                    
                                                    if(savedStore){
                                                        doneStoreUpdate = true;
                                                    }
            
                                                } else {
                            
                                                    foundStore.taggedPosts = [{_postId: newPost._id}]
            
                                                    const savedStore = await foundStore.save()
                                                    
                                                    if(savedStore){
                                                        doneStoreUpdate = true;
                                                    }
                                                }
                                            
                                            } else {
            
                                                doneStoreUpdate = true;
                                            }
                    
                                            foundOwnedProducts.products.push({_productId: foundProduct._id, _postId: newPost._id, productname: productname})
                    
                                            const updatedPost = await Post.updateOne({_id: newPost._id}, {$set: {_productId: foundProduct._id}})
                                            const savedProduct = await foundProduct.save()
                                            const pushedProducts = await foundOwnedProducts.save()
                    
                                            if(pushedProducts && savedProduct && updatedPost){
                                                doneProductPost = true;
                                            }
                    
                                        } else {
                    
                                            foundProduct.relatedPosts = [{_postId: newPost._id}]
                                            foundProduct.ownedBy = [{_userId: userId, ownedCount: 1}]
                                            foundProduct.ownedByCount = foundProduct.ownedByCount + 1
                                            
                                            if(userOrStore === 1){
                                                
                                                if(storename){
                    
                                                    const foundStore = await StoreProfile.findOne({storename: storename})
                                                    
                                                    if(foundStore){
                                                        
                                                        if(foundStore.taggedPosts?.length > 0){
                                    
                                                            foundStore.taggedPosts.push({_postId: newPost._id})
                    
                                                            const savedStore = await foundStore.save()
                                                            
                                                            if(savedStore){
                                                                doneStoreUpdate = true;
                                                            }
                    
                                                        } else {
                                    
                                                            foundStore.taggedPosts = [{_postId: newPost._id}]
                    
                                                            const savedStore = await foundStore.save()
                                                            
                                                            if(savedStore){
                                                                doneStoreUpdate = true;
                                                            }
                                                        }
                                                    
                                                    } else {
                    
                                                        doneStoreUpdate = true;
                                                    }
                                                
                                                } else {
                                                    doneStoreUpdate = true;
                                                }
                                            }                                        
                    
                                            foundOwnedProducts.products.push({_productId: foundProduct._id, _postId: newPost._id, productname: productname})
                    
                                            const updatedPost = await Post.updateOne({_id: newPost._id}, {$set: {_productId: foundProduct._id}})
                                            const pushedProducts = await foundOwnedProducts.save()
                                            const savedProduct = await foundProduct.save()
                    
                                            if(pushedProducts && savedProduct && updatedPost){
                                                doneProductPost = true;
                                            }
                                        }
                                        
                                    } else {
                    
                                        if(userOrStore === 1){
                    
                                            if(storename){
                    
                                                const foundStore = await StoreProfile.findOne({storename: storename})
                                                
                                                if(foundStore){
                                                    
                                                    if(foundStore.taggedPosts?.length > 0){
                                
                                                        foundStore.taggedPosts.push({_postId: newPost._id})
                    
                                                        const savedStore = foundStore.save()
                                                        
                                                        if(savedStore){
                                                            doneStoreUpdate = true;
                                                        }
                    
                                                    } else {
                                
                                                        foundStore.taggedPosts = [{_postId: newPost._id}]
                    
                                                        const savedStore = foundStore.save()
                                                        
                                                        if(savedStore){
                                                            doneStoreUpdate = true;
                                                        }
                                                    }
                                                
                                                } else {
                    
                                                    doneStoreUpdate = true;
                                                }
                                            
                                            } else {
                                                doneStoreUpdate = true;
                                            }
    
                                            var ownedNum = 1;
    
                                            if(foundUser.email?.includes("@purchies.com")){
                                                ownedNum = Math.ceil(Math.random() * (30 - 5)) + 5;
                                            }
                    
                                            const newProduct = new Product({
                                                "sizes": sizes, 
                                                "colors": colors, 
                                                "colorcodes": colorcodes,
                                                "models": models,
                                                "brand": brand, 
                                                "style": style, 
                                                "seasons": seasons, 
                                                "primaryCategory": primaryCategory,
                                                "relatedPosts": [{_postId: newPost._id}],
                                                "productname": productname,
                                                "ownedBy": [{_userId: userId, ownedCount: 1}],
                                                "ownedByCount": ownedNum
                                            })
                    
                                            const savedProduct = await newProduct.save()
                    
                                            if(savedProduct){
                                                
                                                let productFollowers = new ProductFollowers({
                                                    "_productId": savedProduct._id,
                                                    });
                                
                                                const savedFollowers = await productFollowers.save()
                    
                                                const updatedPost = await Post.updateOne({_id: newPost._id}, {$set: {_productId: savedProduct._id}})
                    
                                                foundOwnedProducts.products.push({_productId: savedProduct._id, _postId: newPost._id, productname: productname})
                    
                                                const pushedProducts = await foundOwnedProducts.save()
                    
                                                if(pushedProducts && updatedPost && savedFollowers){
                                                    doneProductPost = true;
                                                }
                                            }
                    
                                        } else {
    
                                            var ownedNum = 1;
    
                                            if(foundUser.email?.includes("@purchies.com")){
                                                ownedNum = Math.ceil(Math.random() * (30 - 5)) + 5;
                                            }
                    
                                            const newProduct = new Product({
                                                "sizes": sizes, 
                                                "colors": colors, 
                                                "colorcodes": colorcodes,
                                                "models": models,
                                                "brand": brand, 
                                                "style": style, 
                                                "seasons": seasons, 
                                                "primaryCategory": primaryCategory,
                                                "relatedPosts": [{_postId: newPost._id}],
                                                "productname": productname,
                                                "ownedBy": [{_userId: userId, ownedCount: 1}],
                                                "ownedByCount": ownedNum
                                            })
                    
                                            const savedProduct = await newProduct.save()
                    
                                            if(savedProduct){
                                                
                                                let productFollowers = new ProductFollowers({
                                                    "_productId": savedProduct._id,
                                                    });
                                
                                                const savedFollowers = await productFollowers.save()
                    
                                                const updatedPost = await Post.updateOne({_id: newPost._id}, {$set: {_productId: savedProduct._id}})
                    
                                                foundOwnedProducts.products.push({_productId: savedProduct._id, _postId: newPost._id, productname: productname})
                    
                                                const pushedProducts = await foundOwnedProducts.save()
                    
                                                if(pushedProducts && updatedPost && savedFollowers){
                                                    doneProductPost = true;
                                                }
                                            }
                                        }
                                    }
                                    
                                    if(userOrStore === 1){
                    
                                        const foundUserProfile = await UserProfile.findOne({"_userId":userId})
                    
                                        if(foundUserProfile){
                    
                                            foundUserProfile.userPosts.push({_postId: newPost._id, primaryCategory: primaryCategory, postClass: 1})
    
                                            const updatedUser = await User.updateOne({_id: userId},{$set: {lastPosting: new Date()}})
                    
                                            const savedUser = await foundUserProfile.save()
            
                                            if(savedUser && doneProductPost && doneStoreUpdate && updatedUser){
                    
                                                return res.status(201).json({ message: 'Success' })
                                            }
                                        }
                    
                                    } else {
                    
                                        const foundStore = await StoreProfile.findOne({"_userId":userId})
                    
                                        if(foundStore){
                    
                                            foundStore.storePosts.push({_postId: newPost._id, primaryCategory: primaryCategory, postClass: 1})
                    
                                            const savedStore = await foundStore.save()
    
                                            const updatedUser = await User.updateOne({_id: userId},{$set: {lastPosting: new Date()}})
                    
                                            if(savedStore && doneProductPost && updatedUser){
                    
                                                return res.status(201).json({ message: 'Success' })
                                            }
                                        }
                                    }
                                
                                } else {
                                    return res.status(401).json({ message: 'No owned products database' })
                                }
                            }) 
                        }    
                    }
                    
                } catch (err) {
            
                    console.log(err)
                    return res.status(401).json({ message: err })
                }
            }
        }
    })
}

const editSingleReviewPost = async (req, res) => {

    const cookies = req.cookies;

    if (!cookies?.purchiesjwt) return res.sendStatus(401);
    const refreshToken = cookies.purchiesjwt;

    User.findOne({ refreshToken }, async function(err, foundUser){

        if (err || !foundUser) return res.sendStatus(403); 
    
        jwt.verify(
            refreshToken,
            process.env.REFRESH_TOKEN_SECRET,
            (err, decoded) => {

                if (err || foundUser.username !== decoded.username ) return res.sendStatus(403);
            }
        )

        var { productname, storename, postId, productId, totalPrice, numberOfItems, previewMediaObjectId, imageObjectArray, videoObjectArray, 
            coverIndex, mediaTypes, previewMediaType, caption, link, tesserText, description, primaryCategory, starRating, taxChargesIncluded, 
            priceNegotiable, measurement, currency, userId, priceRange, openToResell, resellPrice, city, region, country } = req.body

        if ( !postId || !productname || !totalPrice || !previewMediaObjectId || !imageObjectArray || Number(coverIndex) > 10 || Number(coverIndex) > imageObjectArray?.length
            || ! ((foundUser._id.toString() === userId) || (Object.values(foundUser.roles).includes(5150)) ) ) {            
            return res.status(400).json({ message: 'Missing required fields!' })
        }

        if(productname.length > 250 || storename?.length > 50 || primaryCategory?.length > 50
            || caption?.length > 250 || link?.length > 1000 || measurement.length > 30 || description?.length > 10000
            || Number(numberOfItems) > 1000000 ){
                return res.status(400).json({ 'message': 'Content does not meet requirements!' });
            }

        if(!productname){
            productname = ". ";
        }

        var textToCheck = productname.concat(" ", storename, " ", primaryCategory, " ", caption, " ", tesserText,
            " ", link, " ", priceRange, " ", measurement, " ", currency, " ", description).toLowerCase();

        const productBan = await BannedProduct.findOne({admin: "admin"})

        if(productBan){

            if(productBan.products?.some(e=>e.productname === productname)){
                
                return res.status(401).json({"Message": "This product was marked for review"})
            } 

            const foundLimits = await UsageLimit.findOne({_userId: userId})

            if(foundLimits){

                for(let i=0; i < languageList.length; i++){
                    
                    if(textToCheck.indexOf(languageList[i]) !== -1){
                        
                        foundLimits.warningsCount = foundLimits.warningsCount + 3
                        
                        if(foundLimits.warningsCount >= 7){
                            
                            foundUser.deactivated = true;
                            
                            const savedLimits = await foundLimits.save();
                            const savedUser = await foundUser.save();

                            if(savedUser && savedLimits){
                                if(foundUser?.primaryGeoData){
                                    const addIPBan = await BannedUser.updateOne({admin: "admin"},{$push: {ipAddresses: {userIP: foundUser.primaryGeoData.IPv4}}})
                                    if(addIPBan){
                                        return res.status(401).json({"message":"Inappropriate content"})              
                                    }
                                } else {
                                    return res.status(401).json({"message":"Inappropriate content"})          
                                }
                            } 
                        } else {

                            const savedLimits = await foundLimits.save()

                            if(savedLimits){

                                return res.status(401).json({"message":"Inappropriate content"})  
                            }
                        }
                    }
                }
            }

            const foundPost = await Post.findOne({_id: postId })
        
            var updatedStore = false;
            var updatedOldProduct = false;
            var updatedNewProduct = false;

            if(foundPost){

                if(! ( (foundPost._userId.toString() === userId) ||  (Object.values(foundUser?.roles).includes(5150)) )){

                    return res.status(403).json({"Message": "Unauthorized access"})
                }

                if(! foundPost?.isStorePost){

                    if(foundPost.storename && foundPost.storename !== storename){

                        const foundStore = await StoreProfile.findOne({storename: foundPost.storename})
                        const newStore = await StoreProfile.findOne({storename: storename})
            
                        if(foundStore){

                            if(foundStore.taggedPosts?.length > 0){
                                
                                foundStore.taggedPosts.pull({ _postId: foundPost._id})

                                if(newStore){
                                    newStore.taggedPosts.push({ _postId: foundPost._id})
                                }
                                updatedStore = true;
                            }
                        
                        } else {
                            updatedStore = true;
                        }

                    } else {
                        updatedStore = true;
                    }
                
                } else {
                    
                    updatedStore = true;
                }

                if(foundPost.productname !== productname){

                    const oldProduct = await Product.findOne({_id: productId})
                    const newProduct = await Product.findOne({productname: productname})
                    const ownedProducts = await OwnedProducts.findOne({_userId: userId})

                    if(oldProduct){

                        if(ownedProducts?.products?.length > 0){
                            
                            ownedProducts.products.pull({_postId: postId})
                            
                            const updatedOwned = await ownedProducts.save()

                            if(updatedOwned){
            
                                if(oldProduct?.relatedPosts?.length === 1){
            
                                    const deleted = await Product.deleteOne({_id: productId})
            
                                    if(deleted){
                                        updatedOldProduct = true;
                                    }
                                
                                } else {
            
                                    oldProduct.relatedPosts?.pull({_postId: postId})

                                    for(let i=0; i<oldProduct.ownedBy.length;i++){
                                        if(oldProduct.ownedBy[i]._userId.toString() === userId){
                                            if(oldProduct.ownedBy[i].ownedCount > 1){
                                                oldProduct.ownedBy[i].ownedCount = Math.max(oldProduct.ownedBy[i].ownedCount - 1, 0)
                                            } else {
                                                oldProduct.ownedBy.pull({_userId: userId, ownedCount: 1})
                                                oldProduct.ownedByCount = Math.max(oldProduct.ownedByCount - 1, 0)
                                                break
                                            }
                                        }
                                    }
        
                                    if(starRating !== 0){
                                        oldProduct.totalStars = oldProduct.totalStars - starRating
                                        oldProduct.numberOfRatings = oldProduct.numberOfRatings - 1
                                    }
                                    updatedOldProduct = true;
                                }
                            }
                        }
                    }
                    
                    if(newProduct){

                        if(! foundPost.isStorePost){

                            newProduct.relatedPosts?.push({_postId: postId})

                            if(newProduct.ownedBy?.some(e=>e._userId.toString() === userId)){
                                for(let i=0; i<newProduct.ownedBy.length;i++){
                                    if(newProduct.ownedBy[i]._userId.toString() === userId){
                                        newProduct.ownedBy[i].ownedCount = newProduct.ownedBy[i].ownedCount + 1
                                    }
                                }
                            } else {
                                newProduct.ownedBy.push({_userId: userId, ownedCount: 1})    
                                newProduct.ownedByCount = newProduct.ownedByCount + 1
                            }

                            if(starRating !== 0){
                                newProduct.totalStars = newProduct.totalStars + starRating
                                newProduct.numberOfRatings = newProduct.numberOfRatings + 1
                            }

                            foundPost._productId = newProduct._id;

                            ownedProducts.products?.push({_postId: postId, _productId: newProduct._id, productname: newProduct.productname})

                            const updatedOwned = await ownedProducts.save()

                            const saved = await newProduct.save()

                            if(saved && updatedOwned){    
                                updatedNewProduct = true;
                            }

                        } else {

                            newProduct.relatedPosts?.push({_postId: postId})
                            
                            if(newProduct.ownedBy?.some(e=>e._userId.toString() === userId)){
                                for(let i=0; i<newProduct.ownedBy.length;i++){
                                    if(newProduct.ownedBy[i]._userId.toString() === userId){
                                        newProduct.ownedBy[i].ownedCount = newProduct.ownedBy[i].ownedCount + 1
                                    }
                                }
                            } else {
                                newProduct.ownedBy.push({_userId: userId, ownedCount: 1})    
                                newProduct.ownedByCount = newProduct.ownedByCount + 1
                            }

                            if(starRating !== 0){
                                newProduct.totalStars = newProduct.totalStars + starRating
                                newProduct.numberOfRatings = newProduct.numberOfRatings + 1
                            }

                            foundPost._productId = newProduct._id;

                            ownedProducts.products?.push({_productId: newProduct._id, _postId: postId, productname: productname, brand: brand})

                            const updatedOwned = await ownedProducts.save()

                            const saved = await newProduct.save()

                            if(saved && updatedOwned){    
                                updatedNewProduct = true;
                            }
                        }

                    } else {

                        var ownedNum = 1;

                        if(foundUser.email?.includes("@purchies.com")){
                            ownedNum = Math.ceil(Math.random() * (30 - 5)) + 5;
                        }

                        const createProduct = new Product({
                            "sizes": sizes, 
                            "colors": colors, 
                            "colorcodes": colorcodes,
                            "models": models,
                            "brand": brand, 
                            "style": style, 
                            "seasons": seasons, 
                            "primaryCategory": primaryCategory,
                            "totalStars": starRating,
                            "numberOfRatings": numRatings,
                            "relatedPosts": [{_postId: postId}],
                            "productname": productname,
                            "ownedBy": [{_userId: userId, ownedCount: 1}],
                            "ownedByCount": ownedNum
                        })

                        foundPost._productId = createProduct._id;

                        ownedProducts.products?.push({_productId: createProduct._id, _postId: postId, productname: productname, brand: brand})

                        const updatedOwned = await ownedProducts.save()

                        let productFollowers = new ProductFollowers({
                            "_productId": createProduct._id,
                        });

                        const savedFollowers = await productFollowers.save()

                        const saved = await createProduct.save();

                        if(saved && savedFollowers && updatedOwned){
                            updatedNewProduct = true;
                        }
                    }

                } else {

                    updatedOldProduct = true;
                    updatedNewProduct = true;
                }


                //Check if imageobjectarray has any existing imageobject ids

                var newImageObjectIds = {}
                var newVideoObjectIds = {}

                for(let i=0; i<imageObjectArray?.length; i++){
                    if(newImageObjectIds[imageObjectArray[i]] === undefined){
                        newImageObjectIds[imageObjectArray[i]] = imageObjectArray[i]
                    }
                }

                for(let i=0; i<videoObjectArray?.length; i++){
                    if(newVideoObjectIds[videoObjectArray[i]] === undefined){
                        newVideoObjectIds[videoObjectArray[i]] = videoObjectArray[i]
                    }
                }

                var deleteCountImage = 0
                var deleteEndImage = foundPost?.mediaCarouselObjectIds?.length 
                
                for(let i=0; i< deleteEndImage; i++){

                    if(foundPost?.mediaCarouselObjectIds?.length > 0){

                        if(foundPost?.mediaCarouselObjectIds[i] !== 'image' && 
                            newImageObjectIds[foundPost?.mediaCarouselObjectIds[i]] === undefined){

                            const resultimage = await deleteFile(foundPost?.mediaCarouselObjectIds[i])

                            if(resultimage){

                                console.log("Deleted image")

                            } else {

                                console.log("Failed to delete image")
                            }
                        } 
                    }
                }

                var deleteCountVideo = 0
                var deleteEndVideo = foundPost?.videoCarouselObjectIds?.length 
                
                for(let i=0; i< deleteEndVideo; i++){

                    if(foundPost?.videoCarouselObjectIds?.length > 0){

                        if(foundPost?.videoCarouselObjectIds[i] !== 'image' 
                            && newVideoObjectIds[foundPost?.videoCarouselObjectIds[i]] === undefined){

                            const videoresult = await deleteFile(foundPost?.videoCarouselObjectIds[i])

                            if(videoresult){
                                
                                console.log("Deleted video")

                            } else {

                                console.log("Failed to delete video")
                            }
                        }
                    }
                } 


                var signedMediaURLs = []

                for(let i=0; i<imageObjectArray?.length; i++){

                    var signParams = {
                        Bucket: wasabiPrivateBucketUSA, 
                        Key: imageObjectArray[i], 
                        Expires: 7200
                    };

                    var signedURL = s3.getSignedUrl('getObject', signParams);
                    signedMediaURLs.push(signedURL)
                }

                var signedVideoURLs = []

                for(let i=0; i< videoObjectArray?.length; i++){

                    if(videoObjectArray[i] !== 'image'){

                        var signParams = {
                            Bucket: wasabiPrivateBucketUSA, 
                            Key: videoObjectArray[i], 
                            Expires: 7200
                        };
    
                        var signedURL = s3.getSignedUrl('getObject', signParams);
                        signedVideoURLs.push(signedURL)

                    } else {

                        signedVideoURLs.push("image")
                    }
                }

                var signedPreviewURL = signedMediaURLs[coverIndex]

                var doneLanguage = true;
                var selectedLanguage = "English";

                if(doneLanguage){

                    productname ? foundPost.productname = productname : null;
                    selectedLanguage ? foundPost.language = selectedLanguage : null;
                    storename ? foundPost.storename = storename : null;
                    totalPrice ? foundPost.totalPrice = totalPrice : null;
                    resellPrice ? foundPost.resellPrice = resellPrice : null;
                    numberOfItems ? foundPost.numberOfItems = numberOfItems : null;
                    caption ? foundPost.caption = caption : null;
                    link ? foundPost.link = link : null;
                    description?.length > 0 ? foundPost.description = description : foundPost.description = "";
                    primaryCategory ? foundPost.primaryCategory = primaryCategory : foundPost.primaryCategory = "All Categories";
                    starRating ? foundPost.starRating = starRating : null;

                    previewMediaObjectId ? foundPost.previewMediaObjectId = previewMediaObjectId : null;
                    imageObjectArray ? foundPost.mediaCarouselObjectIds = imageObjectArray : null;
                    videoObjectArray ? foundPost.videoCarouselObjectIds = videoObjectArray : null;
                    coverIndex !== null ? foundPost.coverIndex = coverIndex : null;
                    mediaTypes ? foundPost.mediaCarouselObjectTypes = mediaTypes : null;
                    previewMediaType ? foundPost.previewMediaType = previewMediaType : null;

                    signedPreviewURL ? foundPost.previewMediaURL = signedPreviewURL : null;
                    signedMediaURLs ? foundPost.mediaCarouselURLs = signedMediaURLs : null;
                    signedVideoURLs ? foundPost.videoCarouselURLs = signedVideoURLs : null;

                    resellPrice ? foundPost.resellPrice = resellPrice : null;
                    foundPost.city = city;
                    foundPost.region = region;
                    country ? foundPost.country = country : null;

                    openToResell == true ? openToResell = 1 : openToResell = 0
                    taxChargesIncluded == true ? taxChargesIncluded = 1 : taxChargesIncluded = 0
                    priceNegotiable == true ? priceNegotiable = 1 : priceNegotiable = 0
                    
                    foundPost.openToResell = openToResell;
                    foundPost.taxChargesIncluded = taxChargesIncluded;
                    foundPost.priceNegotiable = priceNegotiable;
                    
                    measurement ? foundPost.measurement = measurement : null;
                    currency ? foundPost.currency = currency : null;
                    priceRange ? foundPost.priceRange = priceRange : null;

                    if(updatedOldProduct && updatedNewProduct && updatedStore){

                        const savedPostUpdate = await foundPost.save()

                        const updatedUser = await User.updateOne({_id: foundPost._userId},{$set: {lastPosting: new Date()}})

                        if(savedPostUpdate && updatedUser){
                            
                            return res.status(200).json({'message': "Success"})
                        
                        } else {

                            return res.status(401).json({ message: 'Operation failed!' })
                        }
                    }
                }

            } else {

                return res.status(402).json({ message: 'Operation failed!' })
            }
        }
    })
}


const editSingleSocialPost = async (req, res) => {

    const cookies = req.cookies;

    if (!cookies?.purchiesjwt) return res.sendStatus(401);
    const refreshToken = cookies.purchiesjwt;

    User.findOne({ refreshToken }, async function(err, foundUser){

        if (err || !foundUser) return res.sendStatus(403); 
    
        jwt.verify(
            refreshToken,
            process.env.REFRESH_TOKEN_SECRET,
            (err, decoded) => {

                if (err || foundUser.username !== decoded.username ) return res.sendStatus(403);
            }
        )

        var { userId, postId, previewMediaObjectId, imageObjectArray, videoObjectArray, coverIndex, mediaTypes, 
            previewMediaType, caption, link, tesserText, description, primaryCategory, userOrStore, city, region, country } = req.body

        if ( !userId  || ! ((foundUser._id.toString() === userId) || (Object.values(foundUser.roles).includes(5150))
            || !previewMediaObjectId || !imageObjectArray || Number(coverIndex) > 10 || Number(coverIndex) > imageObjectArray?.length ) ) {            
            return res.status(400).json({ message: 'Missing required fields!' })
        }

        if( primaryCategory?.length > 50 || caption?.length > 250 || link?.length > 1000 || description?.length > 10000 ){
            return res.status(400).json({ 'message': 'Content does not meet requirements!' });
        }

        userOrStore = Number(userOrStore)

        var textToCheck = primaryCategory.concat( " ", caption, " ", link, " ", description, 
            " ", city, " ", region, " ", country, " ", tesserText).toLowerCase();

        const foundLimits = await UsageLimit.findOne({_userId: userId})

        if(foundLimits){

            for(let i=0; i < languageList.length; i++){
                
                if(textToCheck.indexOf(languageList[i]) !== -1){
                    
                    foundLimits.warningsCount = foundLimits.warningsCount + 3
                    
                    if(foundLimits.warningsCount >= 7){
                        
                        foundUser.deactivated = true;
                        
                        const savedLimits = await foundLimits.save();
                        const savedUser = await foundUser.save();

                        if(savedUser && savedLimits){
                            if(foundUser?.primaryGeoData){
                                const addIPBan = await BannedUser.updateOne({admin: "admin"},{$push: {ipAddresses: {userIP: foundUser.primaryGeoData.IPv4}}})
                                if(addIPBan){
                                    return res.status(401).json({"message":"Inappropriate content"})              
                                }
                            } else {
                                return res.status(401).json({"message":"Inappropriate content"})          
                            }
                        } 
                    } else {

                        const savedLimits = await foundLimits.save()

                        if(savedLimits){

                            return res.status(401).json({"message":"Inappropriate content"})  
                        }
                    }
                }
            }
        }

        const foundPost = await Post.findOne({_id: postId })

        if(foundPost){

            if(! ( (foundPost._userId.toString() === userId) ||  (Object.values(foundUser?.roles).includes(5150)) )){

                return res.status(403).json({"Message": "Unauthorized access"})
            }

            var newImageObjectIds = {}
            var newVideoObjectIds = {}

            for(let i=0; i<imageObjectArray?.length; i++){
                if(newImageObjectIds[imageObjectArray[i]] === undefined){
                    newImageObjectIds[imageObjectArray[i]] = imageObjectArray[i]
                }
            }

            for(let i=0; i<videoObjectArray?.length; i++){
                if(newVideoObjectIds[videoObjectArray[i]] === undefined){
                    newVideoObjectIds[videoObjectArray[i]] = videoObjectArray[i]
                }
            }

            var deleteCountImage = 0
            var deleteEndImage = foundPost?.mediaCarouselObjectIds?.length 
            
            for(let i=0; i< deleteEndImage; i++){

                if(foundPost?.mediaCarouselObjectIds?.length > 0){

                    if(foundPost?.mediaCarouselObjectIds[i] !== 'image' && 
                        newImageObjectIds[foundPost?.mediaCarouselObjectIds[i]] === undefined){

                        const resultimage = await deleteFile(foundPost?.mediaCarouselObjectIds[i])

                        if(resultimage){

                            console.log("Deleted image")

                        } else {

                            console.log("Failed to delete image")
                        }
                    } 
                }
            }

            var deleteCountVideo = 0
            var deleteEndVideo = foundPost?.videoCarouselObjectIds?.length 
            
            for(let i=0; i< deleteEndVideo; i++){

                if(foundPost?.videoCarouselObjectIds?.length > 0){

                    if(foundPost?.videoCarouselObjectIds[i] !== 'image' 
                        && newVideoObjectIds[foundPost?.videoCarouselObjectIds[i]] === undefined){

                        const videoresult = await deleteFile(foundPost?.videoCarouselObjectIds[i])

                        if(videoresult){
                            
                            console.log("Deleted video")

                        } else {

                            console.log("Failed to delete video")
                        }
                    }
                }
            } 

            var signedMediaURLs = []

            for(let i=0; i<imageObjectArray?.length; i++){

                var signParams = {
                    Bucket: wasabiPrivateBucketUSA, 
                    Key: imageObjectArray[i], 
                    Expires: 7200
                };

                var signedURL = s3.getSignedUrl('getObject', signParams);
                signedMediaURLs.push(signedURL)
            }

            var signedVideoURLs = []

            for(let i=0; i< videoObjectArray?.length; i++){

                if(videoObjectArray[i] && videoObjectArray[i] !== 'image'){
                    
                    var signParams = {
                        Bucket: wasabiPrivateBucketUSA, 
                        Key: videoObjectArray[i], 
                        Expires: 7200
                    };

                    var signedURL = s3.getSignedUrl('getObject', signParams);
                    signedVideoURLs.push(signedURL)

                } else {

                    signedVideoURLs.push("image")
                }
            }

            var signedPreviewURL = signedMediaURLs[coverIndex]

            var doneLanguage = true;
            var selectedLanguage = "English";

            if(doneLanguage){

                caption ? foundPost.caption = caption : null;
                selectedLanguage ? foundPost.language = selectedLanguage : null;
                link ? foundPost.link = link : null;
                description?.length > 0 ? foundPost.description = description : foundPost.description = "";
                primaryCategory ? foundPost.primaryCategory = primaryCategory : foundPost.primaryCategory = "All Categories";
                
                foundPost.city = city;
                foundPost.region = region;
                country ? foundPost.country = country : null;

                previewMediaObjectId ? foundPost.previewMediaObjectId = previewMediaObjectId : null;
                imageObjectArray ? foundPost.mediaCarouselObjectIds = imageObjectArray : null;
                videoObjectArray ? foundPost.videoCarouselObjectIds = videoObjectArray : null;
                coverIndex !== null ? foundPost.coverIndex = coverIndex : null;
                mediaTypes ? foundPost.mediaCarouselObjectTypes = mediaTypes : null;
                previewMediaType ? foundPost.previewMediaType = previewMediaType : null;

                signedPreviewURL ? foundPost.previewMediaURL = signedPreviewURL : null;
                signedMediaURLs ? foundPost.mediaCarouselURLs = signedMediaURLs : null;
                signedVideoURLs ? foundPost.videoCarouselURLs = signedVideoURLs : null;

                const savedPostUpdate = await foundPost.save()

                const updatedUser = await User.updateOne({_id: foundPost._userId},{$set: {lastPosting: new Date()}})

                if(savedPostUpdate && updatedUser){
                    
                    return res.status(200).json({'message': "Success"})
                
                } else {

                    return res.status(401).json({ message: 'Operation failed!' })
                }
            }

        } else {

            return res.status(402).json({ message: 'Operation failed!' })
        }
    })
}


const editSingleSellingPost = async (req, res) => {

    const cookies = req.cookies;

    if (!cookies?.purchiesjwt) return res.sendStatus(401);
    const refreshToken = cookies.purchiesjwt;

    User.findOne({ refreshToken }, async function(err, foundUser){

        if (err || !foundUser) return res.sendStatus(403); 
    
        jwt.verify(
            refreshToken,
            process.env.REFRESH_TOKEN_SECRET,
            (err, decoded) => {

                if (err || foundUser.username !== decoded.username ) return res.sendStatus(403);
            }
        )

        var { productname, storename, postId, productId, totalPrice, preorderPrice, numberOfItems, itemWeight, longestSide, medianSide, shortestSide, previewMediaObjectId, imageObjectArray, 
            videoObjectArray, coverIndex, mediaTypes, previewMediaType, caption, link, tesserText, description, primaryCategory, supplier, starRating, sizes, colors, colorcodes, models, brand, style, 
            seasons, inStock, taxChargesIncluded, buyNowSwitch, preorderSwitch, priceNegotiable, promotion, oldPrice, preorderDeadline, promotionStart, promotionEnd, shippingOffered, shippingEarly, 
            shippingLate, inventoryCount, minimumOrderQuantity, measurement, currency, userId, priceRange, city, region, country, gender } = req.body

        if ( !postId || !productname || !totalPrice || !previewMediaObjectId || !imageObjectArray || Number(coverIndex) > 10 || Number(coverIndex) > imageObjectArray?.length
            || ! ((foundUser._id.toString() === userId) || (Object.values(foundUser.roles).includes(5150)) ) ) {            
            return res.status(400).json({ message: 'Missing required fields!' })
        }

        if(productname?.length > 250 || storename?.length > 50 || primaryCategory?.length > 50 || supplier?.length > 350
            || caption?.length > 250 || link?.length > 1000 || measurement?.length > 30 || description?.length > 10000
            || (sizes?.length > 0 && sizes.toString().length > 350) || (colors?.length > 0 && colors.toString().length > 350) 
            || style?.length > 50 || (colorcodes?.length > 0 && colorcodes.toString().length > 350) || (models?.length > 0 && models.toString().length > 350) 
            || (seasons?.length > 0 && seasons.toString().length > 30) || brand?.length > 50 || promotionStart?.length > 25 
            || preorderDeadline?.length > 25 || promotionEnd?.length > 25 || shippingEarly?.length > 25 || shippingLate?.length > 25 
            || Number(numberOfItems) > 1000000 || Number(itemWeight) > 1000000000 || Number(longestSide) > 1000000000 
            || Number(medianSide) > 1000000000 || Number(shortestSide) > 1000000000){
                return res.status(400).json({ 'message': 'Content does not meet requirements!' });
        }

        if(inventoryCount && Number(inventoryCount) >= 0 && Number(inventoryCount) < 1000000){
            inventoryCount = Number(inventoryCount)
        } else {
            inventoryCount = 1
        }
        if(minimumOrderQuantity && Number(minimumOrderQuantity) >= 0 && Number(minimumOrderQuantity) < 1000000){
            minimumOrderQuantity = Number(minimumOrderQuantity)
        } else {
            minimumOrderQuantity = 1
        }

        if(sizes?.length === 0){
            sizes = ['Default']
        }

        if(colors?.length === 0){
            colors = ['Default']
        }

        if(models?.length === 0){
            models = ['Default']
        }

        //->Match against Amazon classes, https://sell.amazon.ca/pricing?ref_=sdca_soa_priov_n#fulfillment-fees
        // 1) Envelope, first 100 grams for CAD$4.04 then CAD$0.32 per 100 grams
        // 2) Standard, first 250 grams for CAD$5.92, $6.38 for 250 to 500 grams, $7.27 for 500 to 100 grams,
            //$8.06 for 1000 grams to 1500 grams, from 1500 grams and above First 1,500 g at CAD $8.72, and each additional 500 g at CAD $0.42
        // 3) Small Oversize
        // 4) Medium Oversize 
        // 5) Large Oversize
        // 6) Special Oversize

        let shippingItemClassCAD = 2

        if (itemWeight <= 500 && longestSide <= 38 && medianSide <= 27 && shortestSide <= 2){

            shippingItemClassCAD = 1
        
        } else if (itemWeight <= 9000 && longestSide <= 45 && medianSide <= 35 && shortestSide <= 20){

            shippingItemClassCAD = 2

        } else if (itemWeight <= 32000 && longestSide <= 152 && medianSide <= 76 && (longestSide + ((medianSide + shortestSide) * 2) <= 330) ) {

            shippingItemClassCAD = 3 
            //smalloversize
        } else if (itemWeight <= 68000 && longestSide <= 270 && (longestSide + ((medianSide + shortestSide) * 2) <= 330) ) {

            shippingItemClassCAD = 4
            //mediumoversize
        
        } else if (itemWeight <= 68000 && longestSide <= 270 && ( longestSide + ((medianSide + shortestSide) * 2) <= 419) ) {

            shippingItemClassCAD = 5
            //largeoversize
        
        } else {

            shippingItemClassCAD = 6
            //specialoversize
        } 

        if(!storename){
            storename = foundUser.username
        }

        var textToCheck = storename.concat(" ", productname, " ", primaryCategory, " ", supplier, " ", tesserText,
        " ", caption, " ", link, " ", sizes?.toString(), " ", colors?.toString(), " ", colorcodes?.toString(), " ", models?.toString(), " ",
         brand, " ", priceRange, " ", measurement, " ", style, " ", currency, " ", description, " ", seasons?.toString()).toLowerCase();

        const productBan = await BannedProduct.findOne({admin: "admin"})

        if(productBan){

            if(productBan.products?.some(e=>e.productname === productname)){
                
                return res.status(401).json({"Message": "This product was marked for review"})
            } 

            const foundLimits = await UsageLimit.findOne({_userId: userId})

            if(foundLimits){

                for(let i=0; i < languageList.length; i++){
                    
                    if(textToCheck.indexOf(languageList[i]) !== -1){
                        
                        foundLimits.warningsCount = foundLimits.warningsCount + 3
                        
                        if(foundLimits.warningsCount >= 7){
                            
                            foundUser.deactivated = true;
                            
                            const savedLimits = await foundLimits.save();
                            const savedUser = await foundUser.save();

                            if(savedUser && savedLimits){
                                if(foundUser?.primaryGeoData){
                                    const addIPBan = await BannedUser.updateOne({admin: "admin"},{$push: {ipAddresses: {userIP: foundUser.primaryGeoData.IPv4}}})
                                    if(addIPBan){
                                        return res.status(401).json({"message":"Inappropriate content"})              
                                    }
                                } else {
                                    return res.status(401).json({"message":"Inappropriate content"})          
                                }
                            } 
                        } else {

                            const savedLimits = await foundLimits.save()

                            if(savedLimits){

                                return res.status(401).json({"message":"Inappropriate content"})  
                            }
                        }   
                    }
                }
            }

            try{

                const foundPost = await Post.findOne({_id: postId })
        
                var updatedStore = false;
                var updatedOldProduct = false;
                var updatedNewProduct = false;

                if(foundPost){

                    if(! ( (foundPost._userId.toString() === userId) ||  (Object.values(foundUser?.roles).includes(5150)) )){

                        return res.status(403).json({"Message": "Unauthorized access"})
                    }

                    if(! foundPost?.isStorePost){

                        if(foundPost.storename !== storename){

                            const foundStore = await StoreProfile.findOne({storename: foundPost.storename})
                            const newStore = await StoreProfile.findOne({storename: storename})
                
                            if(foundStore){

                                if(foundStore.taggedPosts?.length > 0){
                                    
                                    foundStore.taggedPosts.pull({ _postId: foundPost._id})

                                    if(newStore){
                                        newStore.taggedPosts.push({ _postId: foundPost._id})
                                    }
                                    updatedStore = true;
                                }
                            
                            } else {
                                updatedStore = true;
                            }

                        } else {
                            updatedStore = true;
                        }
                    
                    } else {
                        
                        updatedStore = true;
                    }

                    if(foundPost.productname !== productname){

                        const oldProduct = await Product.findOne({_id: productId})
                        const newProduct = await Product.findOne({productname: productname})
                        const ownedProducts = await OwnedProducts.findOne({_userId: userId})

                        if(oldProduct){

                            if(ownedProducts?.products?.length > 0){
                                
                                ownedProducts.products.pull({_postId: postId})
                                
                                const updatedOwned = await ownedProducts.save()

                                if(updatedOwned){
                
                                    if(oldProduct?.relatedPosts?.length === 1){
                
                                        const deleted = await Product.deleteOne({_id: productId})
                
                                        if(deleted){
                                            updatedOldProduct = true;
                                        }
                                    
                                    } else {
                
                                        oldProduct.relatedPosts?.pull({_postId: postId})

                                        for(let i=0; i<oldProduct.ownedBy.length;i++){
                                            if(oldProduct.ownedBy[i]._userId.toString() === userId){
                                                if(oldProduct.ownedBy[i].ownedCount > 1){
                                                    oldProduct.ownedBy[i].ownedCount = Math.max(oldProduct.ownedBy[i].ownedCount - 1, 0)
                                                } else {
                                                    oldProduct.ownedBy.pull({_userId: userId, ownedCount: 1})
                                                    oldProduct.ownedByCount = Math.max(oldProduct.ownedByCount - 1, 0)
                                                    break
                                                }
                                            }
                                        }

                                        updatedOldProduct = true;
                                    }
                                }
                            }
                        }
                        
                        if(newProduct){

                            if(! foundPost.isStorePost){

                                newProduct.relatedPosts?.push({_postId: postId})

                                if(newProduct.ownedBy?.some(e=>e._userId.toString() === userId)){
                                    for(let i=0; i<newProduct.ownedBy.length;i++){
                                        if(newProduct.ownedBy[i]._userId.toString() === userId){
                                            newProduct.ownedBy[i].ownedCount = newProduct.ownedBy[i].ownedCount + 1
                                        }
                                    }
                                } else {
                                    newProduct.ownedBy.push({_userId: userId, ownedCount: 1})    
                                    newProduct.ownedByCount = newProduct.ownedByCount + 1
                                }

                                foundPost._productId = newProduct._id;

                                ownedProducts.products?.push({_postId: postId, _productId: newProduct._id, productname: newProduct.productname})

                                const updatedOwned = await ownedProducts.save()

                                const saved = await newProduct.save()

                                if(saved && updatedOwned){    
                                    updatedNewProduct = true;
                                }

                            } else {

                                newProduct.relatedPosts?.push({_postId: postId})
                                
                                if(newProduct.ownedBy?.some(e=>e._userId.toString() === userId)){
                                    for(let i=0; i<newProduct.ownedBy.length;i++){
                                        if(newProduct.ownedBy[i]._userId.toString() === userId){
                                            newProduct.ownedBy[i].ownedCount = newProduct.ownedBy[i].ownedCount + 1
                                        }
                                    }
                                } else {
                                    newProduct.ownedBy.push({_userId: userId, ownedCount: 1})    
                                    newProduct.ownedByCount = newProduct.ownedByCount + 1
                                }

                                foundPost._productId = newProduct._id;

                                ownedProducts.products?.push({_productId: newProduct._id, _postId: postId, productname: productname, brand: brand})

                                const updatedOwned = await ownedProducts.save()

                                const saved = await newProduct.save()

                                if(saved && updatedOwned){    
                                    updatedNewProduct = true;
                                }
                            }

                        } else {

                            var ownedNum = 1;

                            if(foundUser.email?.includes("@purchies.com")){
                                ownedNum = Math.ceil(Math.random() * (30 - 5)) + 5;
                            }

                            var ownedNum = 1;

                            if(foundUser.email?.includes("@purchies.com")){
                                ownedNum = Math.ceil(Math.random() * (30 - 5)) + 5;
                            }

                            const createProduct = new Product({
                                "sizes": sizes, 
                                "colors": colors, 
                                "colorcodes": colorcodes,
                                "models": models,
                                "brand": brand, 
                                "style": style, 
                                "seasons": seasons, 
                                "primaryCategory": primaryCategory,
                                "relatedPosts": [{_postId: postId}],
                                "productname": productname,
                                "ownedBy": [{_userId: userId, ownedCount: 1}],
                                "ownedByCount": ownedNum
                            })

                            foundPost._productId = createProduct._id;

                            ownedProducts.products?.push({_productId: createProduct._id, _postId: postId, productname: productname, brand: brand})

                            const updatedOwned = await ownedProducts.save()

                            let productFollowers = new ProductFollowers({
                                "_productId": createProduct._id,
                            });

                            const savedFollowers = await productFollowers.save()

                            const saved = await createProduct.save();

                            if(saved && savedFollowers && updatedOwned){
                                updatedNewProduct = true;
                            }
                        }

                    } else {

                        updatedOldProduct = true;
                        updatedNewProduct = true;
                    }
                    
                    var newImageObjectIds = {}
                    var newVideoObjectIds = {}

                    for(let i=0; i<imageObjectArray?.length; i++){
                        if(newImageObjectIds[imageObjectArray[i]] === undefined){
                            newImageObjectIds[imageObjectArray[i]] = imageObjectArray[i]
                        }
                    }

                    for(let i=0; i<videoObjectArray?.length; i++){
                        if(newVideoObjectIds[videoObjectArray[i]] === undefined){
                            newVideoObjectIds[videoObjectArray[i]] = videoObjectArray[i]
                        }
                    }

                    var deleteCountImage = 0
                    var deleteEndImage = foundPost?.mediaCarouselObjectIds?.length 
                    
                    for(let i=0; i< deleteEndImage; i++){

                        if(foundPost?.mediaCarouselObjectIds?.length > 0){

                            if(foundPost?.mediaCarouselObjectIds[i] !== 'image' && 
                                newImageObjectIds[foundPost?.mediaCarouselObjectIds[i]] === undefined){

                                const resultimage = await deleteFile(foundPost?.mediaCarouselObjectIds[i])

                                if(resultimage){

                                    console.log("Deleted image")

                                } else {

                                    console.log("Failed to delete image")
                                }
                            } 
                        }
                    }

                    var deleteCountVideo = 0
                    var deleteEndVideo = foundPost?.videoCarouselObjectIds?.length 
                    
                    for(let i=0; i< deleteEndVideo; i++){

                        if(foundPost?.videoCarouselObjectIds?.length > 0){

                            if(foundPost?.videoCarouselObjectIds[i] !== 'image' 
                                && newVideoObjectIds[foundPost?.videoCarouselObjectIds[i]] === undefined){

                                const videoresult = await deleteFile(foundPost?.videoCarouselObjectIds[i])

                                if(videoresult){
                                    
                                    console.log("Deleted video")

                                } else {

                                    console.log("Failed to delete video")
                                }
                            }
                        }
                    } 

                    var signedMediaURLs = []

                    for(let i=0; i<imageObjectArray?.length; i++){

                        var signParams = {
                            Bucket: wasabiPrivateBucketUSA, 
                            Key: imageObjectArray[i], 
                            Expires: 7200
                        };

                        var signedURL = s3.getSignedUrl('getObject', signParams);
                        signedMediaURLs.push(signedURL)
                    }

                    var signedVideoURLs = []

                    for(let i=0; i< videoObjectArray?.length; i++){

                        if(videoObjectArray[i] && videoObjectArray[i] !== 'image'){
                            
                            var signParams = {
                                Bucket: wasabiPrivateBucketUSA, 
                                Key: videoObjectArray[i], 
                                Expires: 7200
                            };
    
                            var signedURL = s3.getSignedUrl('getObject', signParams);
                            signedVideoURLs.push(signedURL)

                        } else {

                            signedVideoURLs.push("image")
                        }
                    }

                    var signedPreviewURL = signedMediaURLs[coverIndex]

                    var doneLanguage = true;
                    var selectedLanguage = "English";

                    if(doneLanguage){

                        productname ? foundPost.productname = productname : null;
                        storename ? foundPost.storename = storename : null;
                        selectedLanguage ? foundPost.language = selectedLanguage : null;
                        totalPrice ? foundPost.totalPrice = totalPrice : null;
                        preorderPrice ? foundPost.preorderPrice = preorderPrice : null;
                        numberOfItems ? foundPost.numberOfItems = numberOfItems : null;
                        itemWeight ? foundPost.itemWeightGrams = itemWeight : null;
                        longestSide ? foundPost.itemDimensionLongest = longestSide : null;
                        medianSide ? foundPost.itemDimensionMedian = medianSide : null;
                        shortestSide ? foundPost.itemDimensionShortest = shortestSide : null;
                        caption ? foundPost.caption = caption : null;
                        gender ? foundPost.gender = gender : null;
                        link ? foundPost.link = link : null;
                        description?.length > 0 ? foundPost.description = description : foundPost.description = "";
                        primaryCategory ? foundPost.primaryCategory = primaryCategory : foundPost.primaryCategory = "All Categories";
                        supplier ? foundPost.supplier = supplier : foundPost.supplier = "N/A";
                        shippingItemClassCAD ? foundPost.shippingItemClassCAD = shippingItemClassCAD : null ;

                        previewMediaObjectId ? foundPost.previewMediaObjectId = previewMediaObjectId : null;
                        imageObjectArray ? foundPost.mediaCarouselObjectIds = imageObjectArray : null;
                        videoObjectArray ? foundPost.videoCarouselObjectIds = videoObjectArray : null;
                        coverIndex !== null ? foundPost.coverIndex = coverIndex : null;
                        mediaTypes ? foundPost.mediaCarouselObjectTypes = mediaTypes : null;
                        previewMediaType ? foundPost.previewMediaType = previewMediaType : null;
        
                        signedPreviewURL ? foundPost.previewMediaURL = signedPreviewURL : null;
                        signedMediaURLs ? foundPost.mediaCarouselURLs = signedMediaURLs : null;
                        signedVideoURLs ? foundPost.videoCarouselURLs = signedVideoURLs : null;
                        
                        sizes ? foundPost.sizes = sizes : null;
                        colors ? foundPost.colors = colors : null;
                        colorcodes ? foundPost.colorcodes = colorcodes : null;
                        models ? foundPost.models = models : null;
                        brand ? foundPost.brand = brand : null;
                        style ? foundPost.style = style : null;
                        seasons ? foundPost.seasons = seasons : null;
                        
                        foundPost.city = city;
                        foundPost.region = region;
                        country ? foundPost.country = country : null;

                        inStock == true ? inStock = 1 : inStock = 0
                        taxChargesIncluded == true ? taxChargesIncluded = 1 : taxChargesIncluded = 0
                        buyNowSwitch == true ? buyNowSwitch = 1 : buyNowSwitch = 0
                        preorderSwitch == true ? preorderSwitch = 1 : preorderSwitch = 0
                        priceNegotiable == true ? priceNegotiable = 1 : priceNegotiable = 0
                        promotion == true ? promotion = 1 : promotion = 0
                        shippingOffered == true ? shippingOffered = 1 : shippingOffered = 0
                        
                        foundPost.inStock = inStock;
                        foundPost.taxChargesIncluded = taxChargesIncluded;
                        foundPost.buyNowSwitch = buyNowSwitch;
                        foundPost.preorderSwitch = preorderSwitch;
                        foundPost.priceNegotiable = priceNegotiable;
                        foundPost.promotion = promotion;
                        
                        if(promotion){
                            foundPost.oldPrice = oldPrice;
                            foundPost.promotionStart = promotionStart;
                            foundPost.promotionEnd = promotionEnd;
                        } else {
                            foundPost.oldPrice = 0;
                            foundPost.promotionStart = "";
                            foundPost.promotionEnd = "";
                        }

                        foundPost.shippingSwitch = shippingOffered;
                        
                        if(shippingOffered){
                            foundPost.shippingDateEarly = shippingEarly;
                            foundPost.shippingDateLate = shippingLate;
                        } else {
                            foundPost.shippingDateEarly = "";
                            foundPost.shippingDateLate = "";
                        }

                        inventoryCount ? foundPost.inventoryCount = inventoryCount : null;
                        minimumOrderQuantity ? foundPost.minimumOrderQuantity = minimumOrderQuantity : null;
                        preorderDeadline ? foundPost.preorderDeadline = preorderDeadline : null;
                        measurement ? foundPost.measurement = measurement : null;
                        currency ? foundPost.currency = currency : null;
                        priceRange ? foundPost.priceRange = priceRange : null;

                        if(updatedOldProduct && updatedNewProduct && updatedStore){

                            const savedPostUpdate = await foundPost.save()

                            const updatedUser = await User.updateOne({_id: foundPost._userId},{$set: {lastPosting: new Date()}})

                            if(savedPostUpdate && updatedUser){
                                
                                return res.status(200).json({'message': "Success"})
                            
                            } else {

                                return res.status(401).json({ message: 'Operation failed!' })
                            }
                        }
                    }

                } else {

                    return res.status(402).json({ message: 'Operation failed!' })
                }

            } catch (err){

                console.log(err)

                return res.status(401).json({"Message": "Operation failed"})
            }
        }
    })
}


const getSinglePostLikes = async (req, res) => {

    const { postId } = req.params

    if (!postId) {
        return res.status(400).json({ message: 'User ID Required' })
    }

    const postData = await Post.findOne({ _id: postId })

    if(postData){
        res.json(postData.likesCount)
    }
}

const editSinglePostLikes = async (req, res) => {

    const { postId, likesCount } = req.body

    if ( !postId ) {
        return res.status(400).json({ message: 'Missing required fields!' })
    }

    Post.findOne({"_id": postId }, function(err, foundPost){
        if(err){
            return res.status(400).json({ message: 'Post not found' })
        }

        foundPost.likesCount = likesCount;

        foundPost.save( function(err){
            if (err){
                return res.status(400).json({ message: 'Failed' })
            }
            res.json({ message: "Success!" })
        })
    })
}


const getSinglePostValues = async (req, res) => {

    const { postId } = req.params

    if (!postId) {
        return res.status(400).json({ message: 'User ID Required' })
    }

    const postData = await Post.findOne({ _id: postId })

    if(postData){
        res.json(postData.valuesCount)
    }
}

const editSinglePostValues = async (req, res) => {

    const { postId, valuesCount } = req.body

    if ( !postId ) {
            
        return res.status(400).json({ message: 'Missing required fields!' })
    }

    Post.findOne({"_id": postId }, function(err, foundPost){
        if(err){
            return res.status(400).json({ message: 'Post not found' })
        }

        foundPost.valuesCount = valuesCount;

        foundPost.save( function(err){
            if (err){
                return res.status(400).json({ message: 'Failed' })
            }
            res.json({ message: "Success!" })
        })
    })
}

const removeSingleReviewPost = async (req, res) => {

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

        const { postId, userId, productId } = req.query

        if ( !postId || !((foundUser._id.toString() === userId) || Object.values(foundUser.roles).includes(5150) )) {
                
            return res.status(400).json({ message: 'Missing required fields!' })
        }

        try {

            const foundPost = await Post.findOne({_id: postId})

            var updatedProduct = false;
            var pulledShared = false;

            if(foundPost){

                const foundProduct = await Product.findOne({_id: productId})
                const pulledOwnedProduct = await OwnedProducts.updateOne({_userId: userId}, {$pull: {products: {_postId: postId}}})
                const deletedComments = await Comment.deleteMany({_postId: postId})
                const pulledBookmarks = await Bookmark.updateMany({_userId: foundPost?.bookmarkedBy?.map(e => e._userId)},{$pull:{ bookmarks: {_postId: postId}} })
                const foundUserFlags = await Flags.updateMany({_userId: {$in: foundPost.flaggedBy.map(e=>e._userId)}},{$pull: {postFlags: {_postId: postId}}})

                var pulledSharedposts = await Sharedpost.updateOne({_userId: userId},{$pull:{ sharedposts: {_postId: postId}} })

                if(pulledSharedposts){
                    pulledShared = true;
                } else {
                    pulledShared = true;
                }


                if(foundProduct){

                    if(foundProduct.relatedPosts?.length === 1){

                        const savedProduct = await Product.deleteOne({_id: productId})
                        
                        if(savedProduct){

                            updatedProduct = true;
                        }
                    
                    } else {

                        foundProduct.relatedPosts?.pull({_postId: postId})
                        
                        for(let i=0; i<foundProduct.ownedBy.length;i++){
                            if(foundProduct.ownedBy[i]._userId.toString() === userId){
                                if(foundProduct.ownedBy[i].ownedCount > 1){
                                    foundProduct.ownedBy[i].ownedCount = Math.max(foundProduct.ownedBy[i].ownedCount - 1, 0)
                                } else {
                                    foundProduct.ownedBy.pull({_userId: userId, ownedCount: 1})
                                    foundProduct.ownedByCount = Math.max(foundProduct.ownedByCount - 1, 0)
                                    break
                                }
                            }
                        }
                        
                        if(foundPost.starRating !== 0){
                            foundProduct.totalStars = foundProduct.totalStars - foundPost.starRating
                            foundProduct.numberOfRatings = foundProduct.numberOfRatings - 1
                        }
                        
                        const savedProduct = await foundProduct.save()
                        
                        if(savedProduct){

                            updatedProduct = true;
                        }
                    }
                }

                var deleteCountImage = 0
                var deleteEndImage = foundPost?.mediaCarouselObjectIds?.length 
                
                for(let i=0; i< deleteEndImage; i++){

                    if(foundPost?.mediaCarouselObjectIds?.length > 0){

                        if(foundPost?.mediaCarouselObjectIds[i] !== 'image'){

                            const resultimage = await deleteFile(foundPost?.mediaCarouselObjectIds[i])

                            if(resultimage){

                                console.log("Deleted image")

                            } else {

                                console.log("Failed to delete image")
                            }
                        } 
                    }
                }

                var deleteCountVideo = 0
                var deleteEndVideo = foundPost?.videoCarouselObjectIds?.length 
                
                for(let i=0; i< deleteEndVideo; i++){

                    if(foundPost?.videoCarouselObjectIds?.length > 0){

                        if(foundPost?.videoCarouselObjectIds[i] !== 'image'){

                            const videoresult = await deleteFile(foundPost?.videoCarouselObjectIds[i])

                            if(videoresult){
                                
                                console.log("Deleted video")

                            } else {

                                console.log("Failed to delete video")
                            }
                        }
                    }
                } 


                if(! foundPost.isStorePost){

                    const deletedUserPosts = await UserProfile.updateOne({_userId: userId},{$pull: {userPosts: {_postId: postId}}})
                    const deletedPost = await Post.deleteOne({_id: postId })

                    if(deletedUserPosts && updatedProduct && pulledOwnedProduct && deletedComments && pulledShared
                        && pulledBookmarks && deletedPost && foundUserFlags){

                        return res.status(200).json({ message: "Deleted post!" })

                    } else {

                        return res.status(401).json({ message: 'Failed' })
                    }

                } else if (foundPost.isStorePost ){

                    const deletedPost = await Post.deleteOne({_id: postId })
                    const deletedStorePosts = await StoreProfile.updateOne({_userId: userId},{$pull: {storePosts: {_postId: postId}}})

                    if(deletedStorePosts && updatedProduct && pulledOwnedProduct && deletedComments && pulledShared
                        && pulledBookmarks && deletedPost && foundUserFlags){

                        return res.status(200).json({ message: "Deleted post!" })
                        
                    } else {

                        return res.status(402).json({ message: 'Failed' })
                    }
                }
                
            } else {

                return res.status(403).json({ message: 'Failed' })
            }

        } catch(err){

            console.log(err)
        }  
    }) 
}

const removeSingleSellingPost = async (req, res) => {

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

        const { postId, userId, productId } = req.query

        if ( !postId || !((foundUser._id.toString() === userId) || Object.values(foundUser.roles).includes(5150) )) {
                
            return res.status(400).json({ message: 'Missing required fields!' })
        }

        try {

            const foundPost = await Post.findOne({_id: postId})

            var updatedProduct = false;
            var pulledShared = false;

            if(foundPost){

                const foundProduct = await Product.findOne({_id: productId})
                const pulledOwnedProduct = await OwnedProducts.updateOne({_userId: userId}, {$pull: {products: {_postId: postId}}})
                const deletedComments = await Comment.deleteMany({_postId: postId})
                const pulledBookmarks = await Bookmark.updateMany({_userId: foundPost?.bookmarkedBy?.map(e => e._userId)},{$pull:{ bookmarks: {_postId: postId}} })
                const foundUserFlags = await Flags.updateMany({_userId: {$in: foundPost.flaggedBy.map(e=>e._userId)}},{$pull: {postFlags: {_postId: postId}}})

                var pulledSharedposts = await Sharedpost.updateOne({_userId: userId},{$pull:{ sharedposts: {_postId: postId}} })

                if(pulledSharedposts){
                    pulledShared = true;
                } else {
                    pulledShared = true;
                }

                if(foundProduct){

                    if(foundProduct.relatedPosts?.length === 1){

                        const savedProduct = await Product.deleteOne({_id: productId})
                        
                        if(savedProduct){

                            updatedProduct = true;
                        }
                    
                    } else {

                        foundProduct.relatedPosts?.pull({_postId: postId})
                        
                        for(let i=0; i<foundProduct.ownedBy.length;i++){
                            if(foundProduct.ownedBy[i]._userId.toString() === userId){
                                if(foundProduct.ownedBy[i].ownedCount > 1){
                                    foundProduct.ownedBy[i].ownedCount = Math.max(foundProduct.ownedBy[i].ownedCount - 1, 0)
                                } else {
                                    foundProduct.ownedBy.pull({_userId: userId, ownedCount: 1})
                                    foundProduct.ownedByCount = Math.max(foundProduct.ownedByCount - 1, 0)
                                    break
                                }
                            }
                        }
                        
                        if(foundPost.starRating !== 0){
                            foundProduct.totalStars = foundProduct.totalStars - foundPost.starRating
                            foundProduct.numberOfRatings = foundProduct.numberOfRatings - 1
                        }
                        
                        const savedProduct = await foundProduct.save()
                        
                        if(savedProduct){

                            updatedProduct = true;
                        }
                    }
                }

                var deleteCountImage = 0
                var deleteEndImage = foundPost?.mediaCarouselObjectIds?.length 
                
                for(let i=0; i< deleteEndImage; i++){

                    if(foundPost?.mediaCarouselObjectIds?.length > 0){

                        if(foundPost?.mediaCarouselObjectIds[i] !== 'image'){

                            const resultimage = await deleteFile(foundPost?.mediaCarouselObjectIds[i])

                            if(resultimage){

                                console.log("Deleted image")

                            } else {

                                console.log("Failed to delete image")
                            }
                        } 
                    }
                }

                var deleteCountVideo = 0
                var deleteEndVideo = foundPost?.videoCarouselObjectIds?.length 
                
                for(let i=0; i< deleteEndVideo; i++){

                    if(foundPost?.videoCarouselObjectIds?.length > 0){

                        if(foundPost?.videoCarouselObjectIds[i] !== 'image'){

                            const videoresult = await deleteFile(foundPost?.videoCarouselObjectIds[i])

                            if(videoresult){
                                
                                console.log("Deleted video")

                            } else {

                                console.log("Failed to delete video")
                            }
                        }
                    }
                } 


                if(! foundPost.isStorePost ){

                    const deletedUserPosts = await UserProfile.updateOne({_userId: userId},{$pull: {userPosts: {_postId: postId}}})
                    const deletedPost = await Post.deleteOne({_id: postId })

                    if(deletedUserPosts && updatedProduct && pulledOwnedProduct && deletedComments && pulledShared
                        && pulledBookmarks && deletedPost && foundUserFlags){

                        return res.status(200).json({ message: "Deleted post!" })

                    } else {

                        return res.status(401).json({ message: 'Failed' })
                    }

                } else if (foundPost.isStorePost){

                    const deletedPost = await Post.deleteOne({_id: postId })
                    const deletedStorePosts = await StoreProfile.updateOne({_userId: userId},{$pull: {storePosts: {_postId: postId}}})

                    if(deletedStorePosts && updatedProduct && pulledOwnedProduct && deletedComments && pulledShared
                        && pulledBookmarks && deletedPost && foundUserFlags){

                        return res.status(200).json({ message: "Deleted post!" })
                        
                    } else {

                        return res.status(402).json({ message: 'Failed' })
                    }
                }
                
            } else {

                return res.status(403).json({ message: 'Failed' })
            }

        } catch(err){

            console.log(err)
        }  
    }) 
}

const removeSingleSocialPost = async (req, res) => {

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

        const { postId, userId } = req.query

        if ( !postId || !((foundUser._id.toString() === userId) || Object.values(foundUser.roles).includes(5150) )) {
                
            return res.status(400).json({ message: 'Missing required fields!' })
        }

        try {

            var pulledShared = false;

            const foundPost = await Post.findOne({_id: postId})

            if(foundPost){

                const pulledOwnedProduct = await OwnedProducts.updateOne({_userId: userId}, {$pull: {products: {_postId: postId}}})
                const deletedComments = await Comment.deleteMany({_postId: postId})
                const pulledBookmarks = await Bookmark.updateMany({_userId: foundPost?.bookmarkedBy?.map(e => e._userId)},{$pull:{ bookmarks: {_postId: postId}} })
                const foundUserFlags = await Flags.updateMany({_userId: {$in: foundPost.flaggedBy.map(e=>e._userId)}},{$pull: {postFlags: {_postId: postId}}})

                var pulledSharedposts = await Sharedpost.updateOne({_userId: userId},{$pull:{ sharedposts: {_postId: postId}} })

                if(pulledSharedposts){
                    pulledShared = true;
                } else {
                    pulledShared = true;
                }

                
                var deleteCountImage = 0
                var deleteEndImage = foundPost?.mediaCarouselObjectIds?.length 
                
                for(let i=0; i< deleteEndImage; i++){

                    if(foundPost?.mediaCarouselObjectIds?.length > 0){

                        if(foundPost?.mediaCarouselObjectIds[i] !== 'image'){

                            const resultimage = await deleteFile(foundPost?.mediaCarouselObjectIds[i])

                            if(resultimage){

                                console.log("Deleted image")

                            } else {

                                console.log("Failed to delete image")
                            }
                        } 
                    }
                }

                var deleteCountVideo = 0
                var deleteEndVideo = foundPost?.videoCarouselObjectIds?.length 
                
                for(let i=0; i< deleteEndVideo; i++){

                    if(foundPost?.videoCarouselObjectIds?.length > 0){

                        if(foundPost?.videoCarouselObjectIds[i] !== 'image'){

                            const videoresult = await deleteFile(foundPost?.videoCarouselObjectIds[i])

                            if(videoresult){
                                
                                console.log("Deleted video")

                            } else {

                                console.log("Failed to delete video")
                            }
                        }
                    }
                } 


                if(! foundPost.isStorePost){

                    const deletedUserPosts = await UserProfile.updateOne({_userId: userId},{$pull: {userPosts: {_postId: postId}}})
                    const deletedPost = await Post.deleteOne({_id: postId })

                    if(deletedUserPosts && deletedPost && pulledOwnedProduct && deletedComments && pulledShared
                        && pulledBookmarks && foundUserFlags){

                        return res.status(200).json({ message: "Deleted post!" })

                    } else {

                        return res.status(401).json({ message: 'Failed' })
                    }

                } else if (foundPost.isStorePost){

                    const deletedStorePosts = await StoreProfile.updateOne({_userId: userId},{$pull: {storePosts: {_postId: postId}}})
                    const deletedPost = await Post.deleteOne({_id: postId })

                    if(deletedStorePosts && deletedPost && pulledOwnedProduct && deletedComments && pulledShared
                        && pulledBookmarks && foundUserFlags){

                        return res.status(200).json({ message: "Deleted post!" })
                        
                    } else {

                        return res.status(402).json({ message: 'Failed' })
                    }
                }
                
            } else {

                return res.status(403).json({ message: 'Failed' })
            }

        } catch(err){

            console.log(err)
        }  
    }) 
}

module.exports = { getSinglePost, addSingleReviewPost, editSingleReviewPost, addSingleSellingPost, editSingleSellingPost, addSingleSocialPost, editSingleSocialPost,
     getSinglePostLikes, editSinglePostLikes, getSinglePostValues, editSinglePostValues, removeSingleReviewPost, removeSingleSellingPost, removeSingleSocialPost }
