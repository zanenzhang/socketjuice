const Post = require('../../model/Post');
const User = require('../../model/User');
const UserProfile = require('../../model/UserProfile');
const StoreProfile = require('../../model/StoreProfile');
const Product = require('../../model/Product');
const ProductFollowers = require('../../model/Productfollowers');
const Comment = require('../../model/Comment');
const Bookmark = require('../../model/Bookmark');
const Sharedpost = require('../../model/Sharedpost');
const Flags = require('../../model/Flags');
const OwnedProducts = require('../../model/OwnedProducts');
const UsageLimit = require('../../model/UsageLimit');
const BannedUser = require("../../model/BannedUser");
const BannedProduct = require("../../model/BannedProduct");
const  {deleteFile} = require("../../controllers/media/s3Controller");

const ObjectId  = require('mongodb').ObjectId;
const languageList = require('../languageCheck');
const jwt = require('jsonwebtoken');
const S3 = require("aws-sdk/clients/s3");
const fns = require('date-fns');
var _= require('lodash');
const copyFile = require('../media/s3Controller');

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


const getBookmarks = async (req, res) => {
    
    var { userId, pageNumber } = req.query

    if (!userId || !pageNumber ) {
        return res.status(400).json({ message: 'Missing required information' })
    }

    if(Number(pageNumber) === NaN || Number(pageNumber) < 0 || Number(pageNumber) > 1000){
        return res.status(400).json({ message: 'Content does not meet requirements' })
    }
    pageNumber = Number(pageNumber)

    const userBookmarks = await Bookmark.findOne({ _userId: userId })
    const ownedProductsFound = await OwnedProducts.findOne({_userId: userId})
    const flaggedList = await Flags.findOne({_userId: userId}).select("userFlags postFlags")

    var sharedpostsFound = await Sharedpost.findOne({_userId: userId})

    let foundProducts = null;
    let userData = null;
    let foundPosts = null;

    let donePosts = false;
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

    if(userBookmarks?.bookmarks?.length > 0){

        foundPosts = await Post.find({$and:[{_id: {$in: userBookmarks.bookmarks.map(e=>e._postId)}} ]}).sort({productname: 1}).skip(pageNumber).limit(12)
    
        if(foundPosts){

            if(foundPosts?.length > 0){

                userData = await User.find({_id: {$in: foundPosts.map(e=>e._userId)}}).select("_id profilePicURL roles blockedUsers privacySetting")

                foundProducts = await Product.find({_id: {$in: foundPosts.map(e=>e._productId)}},{brand_fuzzy: 0, productname_fuzzy:0})

                var x = 0;

                while(x<foundPosts.length){

                    var item = foundPosts[x]

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
                    x += 1
                }

                if(foundProducts && userData && x === foundPosts?.length){
                    donePosts = true;
                }
            
            } else {
                stop = 1;
                donePosts = true;
            }

        } else {
        
            stop = 1
            return res.status(201).json({stop})
        }

        if(donePosts && doneFlags && ownedProductsFound && doneSharedposts){
            return res.status(201).json({userBookmarks, foundPosts, userData, foundProducts, sharedpostsFound,
                ownedProductsFound, flaggedPosts, stop})
        }
    
    } else {

        stop = 1
        donePosts = true;

        if(donePosts && doneFlags && ownedProductsFound && doneSharedposts){
            return res.status(201).json({userBookmarks, foundPosts, userData, foundProducts, sharedpostsFound,
                ownedProductsFound, flaggedPosts, stop})
        }
    }
}   


const addBookmark = async (req, res) => {

    const { userId, postId } = req.body

    if (!userId || !postId ) return res.status(400).json({ 'message': 'Missing required fields!' });

    try {

        const foundPost = await Post.findOne({_id: postId})
        const bookmarkList = await Bookmark.findOne({_userId: userId})
        const foundLimits = await UsageLimit.findOne({_userId: userId})

        var todaysDate = new Date().toLocaleDateString()
        
        var doneProduct = false;
        var doneBookmark = false;
        var doneOperation = false;
        

        if (foundPost && foundLimits){

            if(foundLimits.numberOfBookmarks?.length > 0){

                if(foundLimits.numberOfBookmarks?.some(e=>e.date === todaysDate)){

                    for(let i=0; i< foundLimits.numberOfBookmarks.length; i++){

                        if(foundLimits.numberOfBookmarks[i].date === todaysDate){
    
                            if(foundLimits.numberOfBookmarks[i].bookmarksNumber >= 30){
                                
                                return res.status(401).json({ message: 'Reached bookmarks limit for today' })
                            
                            } else {
    
                                foundLimits.numberOfBookmarks[i].bookmarksNumber = foundLimits.numberOfBookmarks[i].bookmarksNumber + 1
                                const savedLimits = await foundLimits.save()
    
                                if(savedLimits){
                                    doneOperation = true;
                                }
                                
                                break;
                            }
                        }
                    }
                
                } else {

                    foundLimits.numberOfBookmarks.push({date: todaysDate, bookmarksNumber: 1 })
                    const savedLimits = await foundLimits.save()
                    if(savedLimits){
                        doneOperation = true;
                    }
                }

            } else {

                foundLimits.numberOfBookmarks.push({date: todaysDate, bookmarksNumber: 1 })
                const savedLimits = await foundLimits.save()
                if(savedLimits){
                    doneOperation = true;
                }
            }

            foundPost.bookmarksCount = foundPost.bookmarksCount + 1

            if(foundPost?.bookmarkedBy.some(e => e._userId.toString() === userId)){

                for(let i=0; i<foundPost.bookmarkedBy.length;i++){
                    if(foundPost.bookmarkedBy[i]._userId.toString() === userId){
                        foundPost.bookmarkedBy[i].bookmarkedCount = foundPost.bookmarkedBy[i].bookmarkedCount + 1
                        break
                    }
                }
            
            } else {

                foundPost.bookmarkedBy.push({_userId:userId, bookmarkedCount: 1})
            }

            const savedPost = await foundPost.save()

            const foundProduct = await Product.findOne({_id: foundPost._productId})

            if(foundProduct){

                if(foundProduct?.bookmarkedBy.some(e => e._userId.toString() === userId)){

                    for(let i=0; i<foundProduct.bookmarkedBy.length;i++){
                        if(foundProduct.bookmarkedBy[i]._userId.toString() === userId){
                            foundProduct.bookmarkedBy[i].bookmarkedCount = foundProduct.bookmarkedBy[i].bookmarkedCount + 1
                            break
                        }
                    }
                
                } else {

                    foundProduct.bookmarkedBy.push({_userId:userId, bookmarkedCount: 1})
                    foundProduct.bookmarkedByCount = foundProduct.bookmarkedByCount + 1
                }

                const productPushDone = await foundProduct.save()

                if(productPushDone){
                    doneProduct = true
                }

            } else {

                doneProduct = true;
            }

            if(bookmarkList){
                bookmarkList?.bookmarks.push({_postId: foundPost._id})
                const listPushDone = await bookmarkList.save()
                if(listPushDone){
                    doneBookmark = true;
                }
            } else {
                doneBookmark = true;
            }

            if(doneProduct && doneBookmark && doneOperation && savedPost){
                
                return res.status(201).json({ message: 'Success' })
            
            } else {

                return res.status(401).json({ message: 'Operation failed' })
            }   
          
        } else {

            return res.status(401).json({ message: 'Operation failed' })
        }
        
    } catch (err) {

        return res.status(400).json({ message: 'Failed' })
    }
}


const removeBookmark = async (req, res) => {

    const { userId, postId } = req.query

    if (!userId || !postId ) return res.status(400).json({ 'message': 'Missing required fields!' });

    try {

        var foundPost = await Post.findOne({_id: postId})
        var foundProduct = await Product.findOne({ _id: foundPost._productId})

        var donePost = false;
        var doneProduct = false;

        if(foundPost){
            
            const updatedBookmark = await Bookmark.updateOne({ _userId: userId }, { $pull: { bookmarks: { _postId: postId }}})

            if(updatedBookmark){

                if(foundPost.bookmarksCount > 0){
                    foundPost.bookmarksCount = foundPost.bookmarksCount - 1
                }

                if(foundPost.bookmarkedBy?.length > 0 && foundPost.bookmarkedBy?.some(e=>e._userId.toString() === userId)){
                    for(let i=0; i<foundPost.bookmarkedBy.length; i++){
                        if(foundPost.bookmarkedBy[i]._userId.toString() === userId){
                            if(foundPost.bookmarkedBy[i].bookmarkedCount > 1){
                                foundPost.bookmarkedBy[i].bookmarkedCount = foundPost.bookmarkedBy[i].bookmarkedCount - 1
                            } else {
                                foundPost.bookmarkedBy.pull({_userId: userId})
                            }
                            break
                        }
                    }
                }

                const savedPost = await foundPost.save()
                if(savedPost){
                    donePost = true;    
                }
            }
        }


        if(foundProduct){

            if(foundProduct.bookmarkedBy?.length > 0){
                for(let i=0; i<foundProduct.bookmarkedBy.length; i++){
                    if(foundProduct.bookmarkedBy[i]._userId.toString() === userId){
                        if(foundProduct.bookmarkedBy[i].bookmarkedCount > 1){
                            foundProduct.bookmarkedBy[i].bookmarkedCount = foundProduct.bookmarkedBy[i].bookmarkedCount - 1
                        } else {
                            foundProduct.bookmarkedBy.pull({_userId: userId})
                            foundProduct.bookmarkedByCount = Math.max(foundProduct.bookmarkedByCount - 1, 0)           
                        }
                        break
                    }
                }
            }

            const savedProduct = await foundProduct.save()

            if(savedProduct){
                doneProduct = true;
            }

        } else {
            doneProduct = true;
        }
            
        if(doneProduct && donePost){

            return res.status(201).json({ message: 'Success' })                               
        
        } else {

            return res.status(400).json({ message:'Operation Failed' });
        }

    } catch (err) {

        return res.status(401).json({ message: 'Failed' })
    }
}


const addWishlistPost = async (req, res) => {

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

        var { userId, username, productname, primaryCategory, previewMediaObjectId, imageObjectArray, videoObjectArray, 
            coverIndex, mediaTypes, previewMediaType, caption, link, tesserText, size, colors, brand, description, userOrStore, 
            city, region, country } = req.body
    
        if (!userId || !foundUser._id.toString() === userId || !username 
            || !previewMediaObjectId || !productname || !imageObjectArray  ){
            return res.status(400).json({ 'message': 'Missing required fields!' });
        } 

        if(productname.length > 50  || primaryCategory?.length > 50 || imageObjectArray?.length > 10 || Number(coverIndex) > 10 || Number(coverIndex) > imageObjectArray?.length
            || caption?.length > 70 || link?.length > 1000  || description?.length > 10000 ){
                return res.status(400).json({ 'message': 'Content does not meet requirements!' });
            }

        userOrStore = Number(userOrStore)

        var isStorePost = false; 
        if(userOrStore === 2){
            isStorePost = true
        }

        var textToCheck = productname.concat( " ", primaryCategory, " ", tesserText, " ",
            caption, " ", link, " ", size, " ", colors.toString(), " ", brand, " ", description ).toLowerCase();

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
                    var doneProductPost = false;
                
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
                        const finalScore = timeScore + marketScore;

                        var doneLanguage = true;
                        var selectedLanguage = "English";

                        if(doneLanguage){

                            var createPost = new Post({
                                "_userId": userId,
                                "username": username,
                                "language": selectedLanguage,
                                "productname": productname,
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
                                "size": size, 
                                "colors": colors, 
                                "brand": brand, 
                                "city": city,
                                "region": region,
                                "country": country,
                                "bookmarksCount": 1,
                                "description": description,
                                "isStorePost": isStorePost,
                                "postClass": 3,
                                "score": finalScore,
                            })
                    
                            createPost.save( async function(err, newPost){
                    
                                if(err){
                                    return res.status(500).json({ 'Message': err.message });
                                }
                    
                                const foundProduct = await Product.findOne({productname: productname })
                    
                                if(foundProduct){
                
                                    if(foundProduct?.relatedPosts?.length > 0){
                                    
                                        foundProduct.relatedPosts.push({_postId: newPost._id})
                
                                    } else {
                
                                        foundProduct.relatedPosts = [{_postId: newPost._id}]   
                                    }
    
                                    if(foundProduct?.bookmarkedBy.some(e => e._userId.toString() === userId)){
    
                                        for(let i=0; i<foundProduct.bookmarkedBy.length;i++){
                                            if(foundProduct.bookmarkedBy[i]._userId.toString() === userId){
                                                foundProduct.bookmarkedBy[i].bookmarkedCount = foundProduct.bookmarkedBy[i].bookmarkedCount + 1
                                                break
                                            }
                                        }
                                    
                                    } else {
                    
                                        foundProduct.bookmarkedBy.push({_userId:userId, bookmarkedCount: 1})
                                        foundProduct.bookmarkedByCount = foundProduct.bookmarkedByCount + 1
                                    }
    
                                    const updatedPost = await Post.updateOne({_id: newPost._id}, {$set: {_productId: foundProduct._id}})
                                    const savedProduct = await foundProduct.save()
            
                                    if(savedProduct && updatedPost){
                                        doneProductPost = true;
                                    }
                                    
                                } else {
                    
                                    if(userOrStore === 1){
    
                                        var ownedNum = 1;
    
                                        if(foundUser.email?.includes("@purchies.com")){
                                            ownedNum = MATH.ceil(Math.random() * (30 - 5)) + 5;
                                        }
                
                                        const newProduct = new Product({
                                            "size": size, 
                                            "colors": colors, 
                                            "brand": brand, 
                                            "primaryCategory": primaryCategory,
                                            "relatedPosts": [{_postId: newPost._id}],
                                            "productname": productname,
                                            "ownedByCount": ownedNum
                                        })
                
                                        const savedProduct = await newProduct.save()
                
                                        if(savedProduct){
                                            
                                            let productFollowers = new ProductFollowers({
                                                "_productId": savedProduct._id,
                                            });
                            
                                            const savedFollowers = await productFollowers.save()
                
                                            const updatedPost = await Post.updateOne({_id: newPost._id}, {$set: {_productId: savedProduct._id}})
                
                                            if(updatedPost && savedFollowers){
                                                doneProductPost = true;
                                            }
                                        }
                
                                    } else {
    
                                        var ownedNum = 1;
    
                                        if(foundUser.email?.includes("@purchies.com")){
                                            ownedNum = MATH.ceil(Math.random() * (30 - 5)) + 5;
                                        }
                
                                        const newProduct = new Product({
                                            "size": size, 
                                            "colors": colors, 
                                            "brand": brand, 
                                            "primaryCategory": primaryCategory,
                                            "relatedPosts": [{_postId: newPost._id}],
                                            "productname": productname,
                                            "ownedByCount": ownedNum
                                        })
                
                                        const savedProduct = await newProduct.save()
                
                                        if(savedProduct){
                                            
                                            let productFollowers = new ProductFollowers({
                                                "_productId": savedProduct._id,
                                            });
                            
                                            const savedFollowers = await productFollowers.save()
                
                                            const updatedPost = await Post.updateOne({_id: newPost._id}, {$set: {_productId: savedProduct._id}})
                
                                            if(updatedPost && savedFollowers){
                                                doneProductPost = true;
                                            }
                                        }
                                    }
                                }
                
                                const foundBookmarks = await Bookmark.findOne({"_userId":userId})
            
                                if(foundBookmarks){
            
                                    foundBookmarks.bookmarks.push({_postId: newPost._id})
            
                                    const savedBookmarks = await foundBookmarks.save()
    
                                    if(savedBookmarks){
            
                                        return res.status(201).json({ message: 'Success' })
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

const editWishlistPost = async (req, res) => {

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

        var { productname, postId, productId, previewMediaObjectId, imageObjectArray, videoObjectArray, 
            coverIndex, mediaTypes, previewMediaType, caption, link, tesserText, description, 
            primaryCategory, size, colors, brand, city, region, country, userId } = req.body

        if ( !postId || !productname || ! ((foundUser._id.toString() === userId) || (Object.values(foundUser.roles).includes(5150)))
            || !previewMediaObjectId || !imageObjectArray || Number(coverIndex) > 10 || Number(coverIndex) > imageObjectArray?.length  )  {            
            return res.status(400).json({ message: 'Missing required fields!' })
        }

        if(productname.length > 50  || primaryCategory?.length > 50 || caption?.length > 70 || link?.length > 1000
            ||  description?.length > 10000 ||  size?.length > 30 || (colors?.length > 0 && colors.toString().length > 100) 
            || brand?.length > 50 ){
                return res.status(400).json({ 'message': 'Content does not meet requirements!' });
            }

        var textToCheck = productname.concat(" ", primaryCategory, " ", tesserText, " ",
        caption, " ", link, " ", size, " ", colors.toString(), " ", brand, " ", description ).toLowerCase();

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

                const foundPost = await Post.findOne({_id: postId })
        
                var updatedOldProduct = false;
                var updatedNewProduct = false;

                if(foundPost){

                    if(! ( (foundPost._userId.toString() === userId) ||  (Object.values(foundUser?.roles).includes(5150)) )){

                        return res.status(403).json({"Message": "Unauthorized access"})
                    }

                    if(foundPost.productname !== productname){

                        const oldProduct = await Product.findOne({_id: productId})
                        const newProduct = await Product.findOne({productname: productname})

                        if(oldProduct){
            
                            if(oldProduct?.relatedPosts?.length === 1){
        
                                const deleted = await Product.deleteOne({_id: productId})
        
                                if(deleted){
                                    updatedOldProduct = true;
                                }
                            
                            } else {
        
                                oldProduct.relatedPosts?.pull({_postId: postId})

                                updatedOldProduct = true;
                            }
                        }
                        
                        if(newProduct){

                            newProduct.relatedPosts?.push({_postId: postId})

                            foundPost._productId = newProduct._id;

                            const saved = await newProduct.save()

                            if(saved){    
                                updatedNewProduct = true;
                            }

                        } else {

                            var ownedNum = 1;

                            if(foundUser.email?.includes("@purchies.com")){
                                ownedNum = MATH.ceil(Math.random() * (30 - 5)) + 5;
                            }

                            const createProduct = new Product({
                                "size": size, 
                                "colors": colors, 
                                "brand": brand, 
                                "style": style, 
                                "seasons": seasons, 
                                "primaryCategory": primaryCategory,
                                "relatedPosts": [{_postId: postId}],
                                "productname": productname,
                                "ownedByCount": ownedNum
                            })

                            foundPost._productId = createProduct._id;

                            let productFollowers = new ProductFollowers({
                                "_productId": createProduct._id,
                            });

                            const savedFollowers = await productFollowers.save()

                            const saved = await createProduct.save();

                            if(saved && savedFollowers){
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

                        if(videoObjectArray[i] !== 'image'){

                            var signParams = {
                                Bucket: wasabiPrivateBucketUSA, 
                                Key: videoObjectArray[i], 
                                Expires: 7200
                            };
    
                            var signedURL = s3.getSignedUrl('getObject', signParams);
                            signedVideoURLs.push(signedURL)

                        } else {

                            signedVideoURLs.push('image')
                        }
                    }

                    var signedPreviewURL = signedMediaURLs[coverIndex]

                    var doneLanguage = true;
                    var selectedLanguage = "English";

                    if(doneLanguage){

                        productname ? foundPost.productname = productname : null;
                        selectedLanguage ? foundPost.language = selectedLanguage : null;
                        caption ? foundPost.caption = caption : null;
                        link ? foundPost.link = link : null;
                        description ? foundPost.description = description : null;
                        primaryCategory ? foundPost.primaryCategory = primaryCategory : null;
                        
                        size ? foundPost.size = size : null;
                        colors ? foundPost.colors = colors : null;
                        brand ? foundPost.brand = brand : null;
                        city ? foundPost.city = city : null;
                        region ? foundPost.region = region : null;
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

                        if(updatedOldProduct && updatedNewProduct){

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
            
            } else {

                return res.status(402).json({ message: 'Operation failed!' })
            }
        }
    })
}

const removeWishlistPost = async (req, res) => {

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

        if ( !postId ) {
                
            return res.status(400).json({ message: 'Missing required fields!' })
        }

        try {

            const foundPost = await Post.findOne({_id: postId})
            var updatedProduct = false;

            if(foundPost){

                const foundProduct = await Product.findOne({_id: productId})
                const deletedComments = await Comment.deleteMany({_postId: postId})
                const pulledBookmarks = await Bookmark.updateMany({_userId: foundPost?.bookmarkedBy?.map(e => e._userId)},{$pull:{ bookmarks: {_postId: postId}} })
                const foundUserFlags = await Flags.updateMany({_userId: {$in: foundPost.flaggedBy.map(e=>e._userId)}},{$pull: {postFlags: {_postId: postId}}})

                if(foundProduct){

                    if(foundProduct.relatedPosts?.length > 1){

                        foundProduct.relatedPosts?.pull({_postId: postId})
                    }

                    if(foundProduct.bookmarkedBy?.length > 0){
                        for(let i=0; i<foundProduct.bookmarkedBy.length; i++){
                            if(foundProduct.bookmarkedBy[i]._userId.toString() === userId){
                                if(foundProduct.bookmarkedBy[i].bookmarkedCount > 1){
                                    foundProduct.bookmarkedBy[i].bookmarkedCount = foundProduct.bookmarkedBy[i].bookmarkedCount - 1
                                } else {
                                    foundProduct.bookmarkedBy.pull({_userId: userId, bookmarkedByCount: 1})
                                    foundProduct.bookmarkedByCount = Math.max(foundProduct.bookmarkedByCount - 1, 0)           
                                }
                                break
                            }
                        }
                    }

                    const savedProduct = await foundProduct.save()
                    
                    if(savedProduct){
                        updatedProduct = true;
                    }

                } else {
                    updatedProduct = true;
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

                if(updatedProduct && deletedComments && pulledBookmarks 
                     && foundUserFlags){

                    const deletedPost = await Post.deleteOne({_id: postId })

                    if(deletedPost){
                        return res.status(200).json({ message: "Deleted post!" })
                    }

                } else {

                    return res.status(401).json({ message: 'Failed' })
                } 
                
            } else {

                return res.status(403).json({ message: 'Failed' })
            }

        } catch(err){

            console.log(err)
        }  
    }) 
}


module.exports = { getBookmarks, addBookmark, removeBookmark, addWishlistPost, editWishlistPost, removeWishlistPost }