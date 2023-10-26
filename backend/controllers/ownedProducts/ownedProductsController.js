const Post = require('../../model/Post');
const User = require('../../model/User');
const UserProfile = require('../../model/UserProfile');
const StoreProfile = require('../../model/StoreProfile');
const Product = require('../../model/Product');
const OwnedProducts = require('../../model/OwnedProducts');
const UsageLimit = require('../../model/UsageLimit');
const languageList = require('../languageCheck');
const { copyFile}  = require('../media/s3Controller');
const ObjectId  = require('mongodb').ObjectId;

const getOwnedProducts = async (req, res) => {
    
    const { userId } = req.params

    // Confirm data
    if (!userId) {
        return res.status(400).json({ message: 'User ID Required' })
    }

    const ownedProducts = await OwnedProducts.find({ _userId: userId })

    if(ownedProducts){

        const foundPosts = await Post.find({_id: {$in: ownedProducts.products?.map(e=>e._postId) }})
        
        if(foundPosts){

            return res.status(201).json({boughtProducts, foundPosts})
        
        } else {

            return res.status(401).json({ 'message': 'Operation failed' })
        }
    }
}   


const addUserOwnedProduct = async (req, res) => {

    var { userId, postId, starRating, caption } = req.body

    if (!userId || !postId || !starRating || !caption ) return res.status(400).json({ 'message': 'Missing required fields!' });

    if(caption?.length > 70 || Number(starRating) === NaN){
        return res.status(400).json({ 'message': 'Missing required fields!' });
    }

    starRating = Number(starRating)

    try {

        var doneOperation = null;
        const foundLimits = await UsageLimit.findOne({_userId: userId})
        const foundUser = await User.findOne({_id: userId})
        var checkCaption = caption.toLowerCase();
        
        if(foundLimits && foundUser){

            for(let i=0; i < languageList.length; i++){
                        
                if(checkCaption.indexOf(languageList[i]) !== -1){
                    
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
            var doneOperation = null;
        
            if(foundLimits.numberOfPosts?.length > 0){
    
                if(foundLimits.numberOfPosts?.some(e=>e.date === todaysDate)){
    
                    for(let i=0; i< foundLimits.numberOfPosts.length; i++){
    
                        if(foundLimits.numberOfPosts[i].date === todaysDate){
    
                            if(foundLimits.numberOfPosts[i].postsNumber >= 24){
                                
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
    
                const foundPost = await Post.findOne({_id: postId})
                const ownedList = await OwnedProducts.findOne({_userId: userId})
    
                if (foundPost){
    
                    const foundProduct = await Product.findOne({_id: foundPost._productId})
    
                    if(foundProduct && ownedList){
    
                        if(foundProduct?.ownedBy.some(e => e._userId.toString() === userId)){
    
                            for(let i=0; i<foundProduct.ownedBy.length;i++){
                                if(foundProduct.ownedBy[i]._userId.toString() === userId){
                                    foundProduct.ownedBy[i].ownedCount = foundProduct.ownedBy[i].ownedCount + 1
                                }
                            }
    
                            ownedList.products.push({_productId: foundProduct._id, _postId: foundPost._id, productname: foundProduct.productname})
    
                        } else {

                            foundProduct.ownedBy.push({_userId:userId, ownedCount: 1})
                            foundProduct.ownedByCount = foundProduct.ownedByCount + 1
                            ownedList.products.push({_productId: foundProduct._id, _postId: foundPost._id, productname: foundProduct.productname})
                        }
    
                        const foundProfile = await UserProfile.findOne({_userId: userId})
    
                        if(foundProfile){

                            //Create new post with copied objects here

                            var imageCount = 0;
                            var imageCountEnd = foundPost?.mediaCarouselObjectIds?.length;

                            var videoCount = 0;
                            var videoCountEnd = foundPost?.videoCarouselObjectIds?.length;

                            var newmediaCarouselObjectIds = []
                            var newVideoCarouselObjectIds = []

                            async function performCopyImages(){

                                if(foundPost?.mediaCarouselObjectIds?.length > 0 && foundPost?.mediaCarouselObjectIds?.length > imageCount){

                                    if(foundPost?.mediaCarouselObjectIds[imageCount] !== 'image'){

                                        const currentkey = foundPost?.mediaCarouselObjectIds[imageCount]
                                        const newobject = currentkey.slice(5) 
                                        const newkey = `copy_${newobject}`

                                        console.log(currentkey)
                                        console.log(newkey)

                                        const copiedMediaObject = await copyFile(currentkey, newkey)

                                        if(copiedMediaObject){

                                            newmediaCarouselObjectIds.push(newkey)

                                            imageCount += 1
                                            if(imageCount < imageCountEnd){
                                                performCopyImages()
                                            } 

                                        } else {

                                            imageCount += 1
                                            if(imageCount < imageCountEnd){
                                                performCopyImages()
                                            } 
                                        }

                                    } else {

                                        imageCount += 1
                                        if(imageCount < imageCountEnd){
                                            performCopyImages()
                                        } 
                                    }
                                } 
                            }

                            performCopyImages()

                            async function performCopyVideos(){

                                if(foundPost?.videoCarouselObjectIds?.length > 0 && foundPost?.videoCarouselObjectIds?.length > videoCount){

                                    if(foundPost?.videoCarouselObjectIds[videoCount] !== 'image'){

                                        const currentkey = foundPost?.videoCarouselObjectIds[videoCount]
                                        const newobject = currentkey.slice(5) 
                                        const newkey = `copy_${newobject}`

                                        const copiedVideoObject = await copyFile(currentkey, newkey)

                                        if(copiedVideoObject){

                                            newVideoCarouselObjectIds.push(newkey)

                                            videoCount += 1
                                            if(videoCount < videoCountEnd){
                                                performCopyVideos()
                                            } 
                                        
                                        } else {

                                            videoCount += 1
                                            if(videoCount < videoCountEnd){
                                                performCopyVideos()
                                            } 
                                        }
                                    } else {

                                        videoCount += 1
                                        if(videoCount < videoCountEnd){
                                            performCopyVideos()
                                        } 
                                    }
                                }
                            }

                            performCopyVideos()

                            // var copiedPost = _.cloneDeep(foundPost)

                            // if(copiedImageFiles && copiedVideoFiles && newmediaCarouselObjectIds?.length > 0){

                            //     copiedPost.mediaCarouselObjectIds = newmediaCarouselObjectIds
                            //     copiedPost.videoCarouselObjectIds = newVideoCarouselObjectIds
                            //     copiedPost.privacySetting = foundUser.privacySetting
                            //     copiedPost.valuedBy = []
                            //     copiedPost.orderedBy = []
                            //     copiedPost.bookmarkedBy = [{_userId:userId, bookmarkedCount: 1}]
                            //     copiedPost.flaggedBy = []
                            //     copiedPost.postComments = []
                            //     copiedPost.postSubjectTags = []
                            //     copiedPost.postUserTags = []
                                
                            //     copiedPost.bookmarksCount = 1
                            //     copiedPost.commentsCount = 0
                            //     copiedPost.preordersCount = 0
                            //     copiedPost.valuesCount = 0
                            //     copiedPost.flagsCount = 0
                            //     copiedPost.totalPostViews = 0
                            //     copiedPost.totalPostClicks = 0
                            //     copiedPost.postViews = []
                            //     copiedPost.postLinkClicks = []
                            //     copiedPost.previewMediaObjectId = newmediaCarouselObjectIds[foundPost.coverIndex]
                                
                            //     if(newVideoCarouselObjectIds && newVideoCarouselObjectIds?.length > foundPost.coverIndex
                            //         && foundPost.mediaTypes[foundPost.coverIndex] !== 'image'){
                            //             copiedPost.primaryMediaObjectId = newVideoCarouselObjectIds[foundPost.coverIndex]
                            //         }
                                    
                            //     copiedPost.previewMediaURL = ""
                            //     copiedPost.primaryMediaURL = ""
                            //     copiedPost.mediaCarouselURLs = []
                            //     copiedPost.videoCarouselURLs = []
                                
                            //     copiedPost.postClass = 3
                            // }

                            // const newPost = await Post.create(
                            //     copiedPost
                            // )

                            if(newmediaCarouselObjectIds?.length === 0){
                                newmediaCarouselObjectIds = foundPost?.mediaCarouselObjectIds
                            }

                            if(newVideoCarouselObjectIds?.length === 0){
                                newVideoCarouselObjectIds = foundPost?.videoCarouselObjectIds
                            }
    
                            const newProductname = foundPost.productname ? foundPost.productname : "";
                            const newStorename = foundPost.storename ? foundPost.storename : "";
                            const newCategory = foundPost.primaryCategory ? foundPost.primaryCategory : "";
                            const newTotalPrice = foundPost.totalPrice ? foundPost.totalPrice : "";
                            const newNumberOfItems = foundPost.numberOfItems ? foundPost.numberOfItems : "";
                            const newCurrency = foundPost.currency ? foundPost.currency : "";
                            
                            const newPreviewMediaObject = newmediaCarouselObjectIds?.length > foundPost?.coverIndex ? newmediaCarouselObjectIds[foundPost?.coverIndex] : "";
                            const newPreviewMediaType = foundPost.previewMediaType ? foundPost.previewMediaType : "";
                            const newMediaCarouselObjectTypes = foundPost.mediaCarouselObjectTypes ? foundPost.mediaCarouselObjectTypes : "";

                            const newPreviewMediaURL = "";
                            const newMediaCarouselURLs = [];
                            const newVideoCarouselURLs = [];

                            const newArticleText = foundPost.articleText ? foundPost.articleText : "";
                            const newSizes = foundPost.sizes ? foundPost.sizes : "";
                            const newColors = foundPost.colors ? foundPost.colors : "";
                            const newPrimaryColor = foundPost.primaryColor ? foundPost.primaryColor : "";
                            const newColorcodes = foundPost.colorcodes ? foundPost.colorcodes : "";
                            
                            const newMeasurement = foundPost.measurement ? foundPost.measurement : "";
                            const promoPrice = foundPost.oldPrice ? foundPost.oldPrice : "";
                            const newSize = foundPost.size ? foundPost.size : "";
                            const newBrand = foundPost.brand ? foundPost.brand : "";
                            const newStyle = foundPost.style ? foundPost.style : "";
                            const newSeasons = foundPost.seasons ? foundPost.seasons : "";
                            const newInStock = foundPost.inStock ? foundPost.inStock : "";
                            const newPromotion = foundPost.promotion ? foundPost.promotion : "";
                            const newPromotionStart = foundPost.promotionStart ? foundPost.promotionStart : "";
                            const newPromotionEnd = foundPost.promotionEnd ? foundPost.promotionEnd : "";
                            const newDescription = foundPost.description ? foundPost.description : "";
                            const newLink = foundPost.link ? foundPost.link : "";
    
                            let marketRanking = 2;
                            const currentDate = new Date();
                            const timeScore = Math.ceil(currentDate.getTime() / 86400);
                            const marketScore = (4 - marketRanking) * 1000
                            const finalScore = timeScore + marketScore

                            var newPost = new Post({
                                "_userId": userId,
                                "username": foundProfile.username,
                                "_productId": foundProduct._id,
                                "productname": newProductname,
                                "storename": newStorename,
                                "primaryCategory": newCategory,
                                "totalPrice": newTotalPrice,
                                "currency": newCurrency,
                                "numberOfItems": newNumberOfItems,
                                "starRating": starRating,
                                "previewMediaObjectId": newPreviewMediaObject,
                                "previewMediaURL": newPreviewMediaURL,
                                "previewMediaType": newPreviewMediaType,
                                "mediaCarouselObjectIds": newmediaCarouselObjectIds,
                                "videoCarouselObjectIds": newVideoCarouselObjectIds,
                                "mediaCarouselObjectTypes": newMediaCarouselObjectTypes,
                                "mediaCarouselURLs": newMediaCarouselURLs,
                                "videoCarouselURLs": newVideoCarouselURLs,
                                "articleText": newArticleText,
                                "caption": caption,
                                "measurement": newMeasurement, 
                                "oldPrice": promoPrice, 
                                "size": newSize, 
                                "sizes": newSizes, 
                                "primaryColor": newPrimaryColor, 
                                "colors": newColors, 
                                "colorcodes": newColorcodes, 
                                "brand": newBrand, 
                                "style": newStyle, 
                                "seasons": newSeasons, 
                                "inStock": newInStock, 
                                "promotion": newPromotion, 
                                "promotionStart": newPromotionStart, 
                                "promotionEnd": newPromotionEnd,
                                "description": newDescription,
                                "postClass": 0,
                                "link": newLink,
                                "score": finalScore,
                            })
                            
                            const listPushDone = await ownedList.save()
                            const savedNewPost = await newPost.save()
            
                            if(listPushDone && savedNewPost){
    
                                foundProfile.userPosts.push({_postId: savedNewPost._id, primaryCategory: newCategory})
    
                                if(foundProduct?.relatedPosts?.length > 0){
                        
                                    foundProduct.relatedPosts.push({_postId: savedNewPost._id})
    
                                    if(savedNewPost.starRating){
                                        foundProduct.totalStars = foundProduct.totalStars + savedNewPost.starRating
                                        foundProduct.numberOfRatings = foundProduct.numberOfRatings + 1
                                    }
                                }
    
                                const productPushDone = await foundProduct.save()
                                const savedProfile = await foundProfile.save()
    
                                if(savedProfile && productPushDone ){
                                
                                    return res.status(201).json({ message: 'Success' })
                                
                                } else {
    
                                    return res.status(401).json({ message: 'Operation failed' })
                                }
    
                            } else {
    
                                return res.status(401).json({ message: 'Operation failed' })
                            }
                        }
                    }
                    
                } else {
    
                    return res.status(401).json({ message: 'Operation failed' })
                }
            }
        }
        
    } catch (err) {

        return res.status(400).json({ message: 'Failed' })
    }
}

const addStoreOwnedProduct = async (req, res) => {

    const { userId, postId, starRating, caption } = req.body

    if (!userId || !postId ||!starRating ||!caption ) return res.status(400).json({ 'message': 'Missing required fields!' });

    if(caption?.length > 70 || Number(starRating) === NaN){
        return res.status(400).json({ 'message': 'Missing required fields!' });
    }

    starRating = Number(starRating)

    try {

        var doneOperation = null;
        const foundLimits = await UsageLimit.findOne({_userId: userId})

        var checkCaption = caption.toLowerCase();

        if(foundLimits){

            for(let i=0; i < languageList.length; i++){
                        
                if(checkCaption.indexOf(languageList[i]) !== -1){
                    
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
            var doneOperation = null;
        
            if(foundLimits.numberOfPosts?.length > 0){

                if(foundLimits.numberOfPosts?.some(e=>e.date === todaysDate)){

                    for(let i=0; i< foundLimits.numberOfPosts.length; i++){

                        if(foundLimits.numberOfPosts[i].date === todaysDate){

                            if(foundLimits.numberOfPosts[i].postsNumber >= 24){
                                
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

                const foundPost = await Post.findOne({_id: postId})
                const ownedList = await OwnedProducts.findOne({_id: userId})
    
                if (foundPost){
    
                    const foundProduct = await Product.findOne({_id: foundPost._productId})
    
                    if(foundProduct && ownedList){
    
                        if(foundProduct?.ownedBy.some(e => e._userId.toString() === userId)){
    
                            for(let i=0; i<foundProduct.ownedBy.length;i++){
                                if(foundProduct.ownedBy[i]._userId.toString() === userId){
                                    foundProduct.ownedBy[i].ownedCount = foundProduct.ownedBy[i].ownedCount + 1
                                }
                            }
    
                            ownedList.products.push({_productId: foundProduct._id, _postId: foundPost._id, productname: foundProduct.productname})
                        
                        } else {
    
                            foundProduct.ownedBy.push({_userId:userId, ownedCount: 1})
                            foundProduct.ownedByCount = foundProduct.ownedByCount + 1
                            ownedList.products.push({_productId: foundProduct._id, _postId: foundPost._id, productname: foundProduct.productname})
                        }
    
                        const foundProfile = await StoreProfile.findOne({_userId: userId});
    
                        if(foundProfile){

                            var imageCount = 0;
                            var imageCountEnd = foundPost?.mediaCarouselObjectIds?.length;

                            var videoCount = 0;
                            var videoCountEnd = foundPost?.videoCarouselObjectIds?.length;

                            var newmediaCarouselObjectIds = []
                            var newVideoCarouselObjectIds = []

                            async function performCopyImages(){

                                if(foundPost?.mediaCarouselObjectIds?.length > 0 && foundPost?.mediaCarouselObjectIds?.length > imageCount){

                                    if(foundPost?.mediaCarouselObjectIds[imageCount] !== 'image'){

                                        const currentkey = foundPost?.mediaCarouselObjectIds[imageCount]
                                        const newobject = currentkey.slice(5) 
                                        const newkey = `copy_${newobject}`

                                        const copiedMediaObject = await copyFile(currentkey, newkey)

                                        if(copiedMediaObject){

                                            newmediaCarouselObjectIds.push(newkey)

                                            imageCount += 1
                                            if(imageCount < imageCountEnd){
                                                performCopyImages()
                                            } 

                                        } else {

                                            imageCount += 1
                                            if(imageCount < imageCountEnd){
                                                performCopyImages()
                                            } 
                                        }

                                    } else {

                                        imageCount += 1
                                        if(imageCount < imageCountEnd){
                                            performCopyImages()
                                        } 
                                    }
                                } 
                            }

                            async function performCopyVideos(){

                                if(foundPost?.videoCarouselObjectIds?.length > 0 && foundPost?.videoCarouselObjectIds?.length > videoCount){

                                    if(foundPost?.videoCarouselObjectIds[videoCount] !== 'image'){

                                        const currentkey = foundPost?.videoCarouselObjectIds[videoCount]
                                        const newobject = currentkey.slice(5) 
                                        const newkey = `copy_${newobject}`

                                        const copiedVideoObject = await copyFile(currentkey, newkey)

                                        if(copiedVideoObject){

                                            newVideoCarouselObjectIds.push(newkey)

                                            videoCount += 1
                                            if(videoCount < videoCountEnd){
                                                performCopyVideos()
                                            } 
                                        
                                        } else {

                                            videoCount += 1
                                            if(videoCount < videoCountEnd){
                                                performCopyVideos()
                                            } 
                                        }
                                    } else {

                                        videoCount += 1
                                        if(videoCount < videoCountEnd){
                                            performCopyVideos()
                                        } 
                                    }
                                }
                            }

                            performCopyImages()
                            performCopyVideos()

                            if(newmediaCarouselObjectIds?.length === 0){
                                newmediaCarouselObjectIds = foundPost?.mediaCarouselObjectIds
                            }

                            if(newVideoCarouselObjectIds?.length === 0){
                                newVideoCarouselObjectIds = foundPost?.videoCarouselObjectIds
                            }
    
                            const newProductname = foundPost.productname ? foundPost.productname : null;
                            const newStorename = foundPost.storename ? foundPost.storename : null;
                            const newCategory = foundPost.primaryCategory ? foundPost.primaryCategory : null;
                            const newTotalPrice = foundPost.totalPrice ? foundPost.totalPrice : null;
                            const newNumberOfItems = foundPost.numberOfItems ? foundPost.numberOfItems : null;
                            const newCurrency = foundPost.currency ? foundPost.currency : "";
                            
                            const newPreviewMediaObject = newmediaCarouselObjectIds?.length > foundPost?.coverIndex ? newmediaCarouselObjectIds[foundPost?.coverIndex] : "";
                            const newPreviewMediaType = foundPost.previewMediaType ? foundPost.previewMediaType : "";
                            const newMediaCarouselObjectTypes = foundPost.mediaCarouselObjectTypes ? foundPost.mediaCarouselObjectTypes : "";

                            const newPreviewMediaURL = "";
                            const newMediaCarouselURLs = [];
                            const newVideoCarouselURLs = [];

                            const newArticleText = foundPost.articleText ? foundPost.articleText : "";
                            const newSizes = foundPost.sizes ? foundPost.sizes : "";
                            const newColors = foundPost.colors ? foundPost.colors : "";
                            const newPrimaryColor = foundPost.primaryColor ? foundPost.primaryColor : "";
                            const newColorcodes = foundPost.colorcodes ? foundPost.colorcodes : "";

                            const newMeasurement = foundPost.measurement ? foundPost.measurement : "";
                            const promoPrice = foundPost.oldPrice ? foundPost.oldPrice : "";
                            const newSize = foundPost.size ? foundPost.size : "";

                            const newBrand = foundPost.brand ? foundPost.brand : null;
                            const newStyle = foundPost.style ? foundPost.style : null;
                            const newSeasons = foundPost.seasons ? foundPost.seasons : null;
                            const newInStock = foundPost.inStock ? foundPost.inStock : null;
                            const newPromotion = foundPost.promotion ? foundPost.promotion : null;
                            const newPromotionStart = foundPost.promotionStart ? foundPost.promotionStart : null;
                            const newPromotionEnd = foundPost.promotionEnd ? foundPost.promotionEnd : null;
                            const newDescription = foundPost.description ? foundPost.description : null;
    
                            let marketRanking = 2;
                            const currentDate = new Date();
                            const timeScore = Math.ceil(currentDate.getTime() / 86400);
                            const marketScore = (4 - marketRanking) * 1000
                            const finalScore = timeScore + marketScore

                            var newPost = new Post({
                                "_userId": userId,
                                "username": newStorename,
                                "productname": newProductname,
                                "currency": newCurrency,
                                "storename": newStorename,
                                "primaryCategory": newCategory,
                                "totalPrice": newTotalPrice,
                                "numberOfItems": newNumberOfItems,
                                "starRating": starRating,
                                "previewMediaObjectId": newPreviewMediaObject,
                                "previewMediaURL": newPreviewMediaURL,
                                "previewMediaType": newPreviewMediaType,
                                "mediaCarouselObjectIds": newmediaCarouselObjectIds,
                                "videoCarouselObjectIds": newVideoCarouselObjectIds,
                                "mediaCarouselObjectTypes": newMediaCarouselObjectTypes,
                                "mediaCarouselURLs": newMediaCarouselURLs,
                                "videoCarouselURLs": newVideoCarouselURLs,
                                "articleText": newArticleText,
                                "caption": caption,
                                "measurement": newMeasurement, 
                                "oldPrice": promoPrice, 
                                "size": newSize, 
                                "sizes": newSizes, 
                                "primaryColor": newPrimaryColor, 
                                "colors": newColors, 
                                "colorcodes": newColorcodes, 
                                "brand": newBrand, 
                                "style": newStyle, 
                                "seasons": newSeasons, 
                                "inStock": newInStock, 
                                "promotion": newPromotion, 
                                "promotionStart": newPromotionStart, 
                                "promotionEnd": newPromotionEnd,
                                "description": newDescription,
                                "postClass" : 0,
                                "link": newLink,
                                "score": finalScore,
                            })
                            
                            const listPushDone = await ownedList.save()
                            const savedNewPost = await newPost.save()
            
                            if(listPushDone && savedNewPost){
    
                                foundProfile.storePosts.push({_postId: savedNewPost._id, primaryCategory: newCategory})
    
                                if(foundProduct?.relatedPosts?.length > 0){
                        
                                    foundProduct.relatedPosts.push({_postId: savedNewPost._id})
    
                                    if(savedNewPost.starRating){
                                        foundProduct.totalStars = foundProduct.totalStars + savedNewPost.starRating
                                        foundProduct.numberOfRatings = foundProduct.numberOfRatings + 1
                                    }
                                }
    
                                const productPushDone = await foundProduct.save()
                                const savedProfile = await foundProfile.save()
    
                                if(savedProfile && productPushDone ){
                                
                                    return res.status(201).json({ message: 'Success' })
                                
                                } else {
    
                                    return res.status(401).json({ message: 'Operation failed' })
                                }
    
                            } else {
    
                                return res.status(401).json({ message: 'Operation failed' })
                            }
                        }
                    }
                    
                } else {
    
                    return res.status(401).json({ message: 'Operation failed' })
                }
            }
        }
        
    } catch (err) {

        return res.status(400).json({ message: 'Failed' })
    }
}


module.exports = { getOwnedProducts, addUserOwnedProduct, addStoreOwnedProduct }