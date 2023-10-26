const Post = require('../../model/Post');
const User = require('../../model/User');
const ShoppingCart = require('../../model/ShoppingCart');
const UserProfile = require('../../model/UserProfile');
const StoreProfile = require('../../model/StoreProfile');
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


const getShoppingCart = async (req, res) => {

    const { userId, ipAddress } = req.query

    if( !userId && !ipAddress ){
        return res.status(400).json({ message: 'Missing required fields' })
    }

    if(userId){

        const userShoppingCart = await ShoppingCart.findOne({_userId: userId})

        if(userShoppingCart){

            const foundPosts = await Post.find({_id: {$in: userShoppingCart.cartItems?.map(e=>e._postId)}})

            if(foundPosts){

                foundPosts?.forEach( function(item){

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

                return res.status(200).json({userShoppingCart, foundPosts})    
            }
        }

    } else {

        const userShoppingCart = await ShoppingCart.findOne({ ipAddress: ipAddress})

        if(userShoppingCart){

            const foundPosts = await Post.find({_id: {$in: userShoppingCart.cartItems?.map(e=>e._postId)}})

            if(foundPosts){
    
                foundPosts.forEach(function(item){

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

                return res.status(200).json({userShoppingCart, foundPosts}) 
            }
        }
    }
}  

const addShoppingCartItem = async (req, res) => {

    const { userId, ipAddress, postId, preorder, selectedSize, selectedColor, selectedModel, surcharge } = req.body

    if( (!userId && !ipAddress) || !postId ){
        return res.status(400).json({ message: 'Missing required fields' })
    }

    const foundPost = await Post.findOne( {_id: postId} )
    var shippingCost = null;
    var preorderSwitch = false;
    var checkedItemPrice = 0;
    var remoteFee = 0;

    if(userId && foundPost){

        //For MCF orders
        if(foundPost.shippingItemClassCAD <= 2){

            if(surcharge === 'remote'){
                remoteFee = 7.50
            }

            let weightGrams = foundPost.itemWeightGrams

            if(weightGrams > 10000){

                shippingCost = 3.64 + ((weightGrams - 10000)/500 * 0.45) + (9500/500 * 0.99) + 4.93 + remoteFee
            
            } else if (weightGrams > 500 && weightGrams <= 10000){

                shippingCost = 3.64 + ((weightGrams-500)/500 * 0.99) + 4.93 + remoteFee
            
            } else {

                shippingCost = 3.64 + 4.93 + remoteFee
            }

            shippingCost = shippingCost - 4.00

        } else if(foundPost.shippingItemClassCAD >= 3 && foundPost.shippingItemClassCAD <= 5){
         
            let weightGrams = foundPost.itemWeightGrams

            if(surcharge === 'remote'){
                remoteFee = 50
            }

            if(weightGrams > 500 && weightGrams > 10000){

                shippingCost = 9.99 + ((weightGrams - 10000)/500 * 0.45) + (9500/500 * 0.99) + 4.93 + remoteFee
            
            } else if (weightGrams > 500 && weightGrams <= 10000){

                shippingCost = 9.99 + ((weightGrams-500)/500 * 0.99) + 4.93 + remoteFee
            
            } else {

                shippingCost = 9.99 + 4.93 + remoteFee
            }

            shippingCost = shippingCost - 4.00

        } else if(foundPost.shippingItemClassCAD === 6 ){

            let weightGrams = foundPost.itemWeightGrams

            if(surcharge === 'remote'){
                remoteFee = 50
            }

            if(weightGrams > 500 && weightGrams > 10000){

                shippingCost = 9.99 + 131.25 + ((weightGrams - 10000)/500 * 0.45) + (9500/500 * 0.99) + 4.93 + remoteFee
            
            } else if (weightGrams > 500 && weightGrams <= 10000){

                shippingCost = 9.99 + 131.25 + ((weightGrams-500)/500 * 0.99) + 4.93 + remoteFee
            
            } else {

                shippingCost = 9.99 + 131.25 + 4.93 + remoteFee
            }

            shippingCost = shippingCost - 4.00
        }

        if(preorder || preorder === 'true'){
            preorderSwitch = true;
            checkedItemPrice = foundPost.preorderPrice
        } else {
            checkedItemPrice = foundPost.totalPrice
        }

        const userShoppingCart = await ShoppingCart.findOne({_userId: userId})
        
        if(userShoppingCart){

            if(userShoppingCart.totalItemsCount > 20){
                return res.status(400).json({"Message": "Too many products in checkout"})
            }

            if(userShoppingCart.cartItems?.some(e=>( e._postId.toString() === ((postId)) && e.preorder === preorderSwitch 
                && e.selectedSize === selectedSize && e.selectedColor === selectedColor && e.selectedModel === selectedModel) )){

                for(let i=0;i<userShoppingCart.cartItems.length;i++){

                    if(userShoppingCart.cartItems[i]._postId.toString() === ((postId)) && userShoppingCart.cartItems[i].preorder === preorderSwitch
                        && userShoppingCart.cartItems[i].selectedColor === selectedColor && userShoppingCart.cartItems[i].selectedModel === selectedModel
                        && userShoppingCart.cartItems[i].selectedSize === selectedSize){

                        userShoppingCart.cartItems[i].itemsNumber = userShoppingCart.cartItems[i].itemsNumber + 1
                        userShoppingCart.cartItems[i].totalLinePrice = Math.round(checkedItemPrice * userShoppingCart.cartItems[i].itemsNumber * 100)/100
                        userShoppingCart.cartItems[i].shippingCost = Math.round( (userShoppingCart.cartItems[i].shippingCost + shippingCost) * 100)/100
                        userShoppingCart.cartItems[i].totalCostWithShipping = Math.round( (userShoppingCart.cartItems[i].totalLinePrice + userShoppingCart.cartItems[i].shippingCost) * 100)/100
                        userShoppingCart.cartItems[i].currency = foundPost.currency
                        userShoppingCart.cartItems[i].preorder = preorderSwitch
                        userShoppingCart.cartItems[i].selectedSize = selectedSize
                        userShoppingCart.cartItems[i].selectedColor = selectedColor
                        userShoppingCart.cartItems[i].selectedModel = selectedModel
                        userShoppingCart.totalItemsCount = userShoppingCart.totalItemsCount + 1
                        break
                    }
                }

                const saved = await userShoppingCart.save()

                if(saved){
                    return res.status(200).json({"message": "added new item"}) 
                }
                
            } else {

                userShoppingCart.cartItems.push(
                    {
                        orderItemName: foundPost.productname,
                        _postId: postId,
                        itemPrice: Math.round(checkedItemPrice * 100)/100,
                        totalLinePrice: Math.round(checkedItemPrice * 100)/100,
                        itemsNumber: 1,
                        shippingItemClassCAD: foundPost.shippingItemClassCAD,
                        itemWeightGrams: foundPost.itemWeightGrams,
                        itemDimensionLongest: foundPost.itemDimensionLongest,
                        itemDimensionMedian: foundPost.itemDimensionMedian,
                        itemDimensionShortest: foundPost.itemDimensionShortest,
                        shippingCost: shippingCost,
                        selectedSize: selectedSize,
                        selectedColor: selectedColor,
                        selectedModel: selectedModel,
                        totalCostWithShipping: Math.round( (checkedItemPrice + shippingCost) * 100)/100,
                        currency: foundPost.currency,
                        preorder: preorderSwitch,
                    }
                )

                userShoppingCart.totalItemsCount = userShoppingCart.totalItemsCount + 1

                const saved = await userShoppingCart.save()

                if(saved){
                    return res.status(200).json({"message": "added new item"}) 
                }
            }
        
        } else {

            const newCart = await ShoppingCart.create({
                _userId: userId,
                cartItems: [
                    {
                        orderItemName: foundPost.productname,
                        _postId: postId,
                        itemPrice: checkedItemPrice,
                        totalLinePrice: checkedItemPrice,
                        itemsNumber: 1,
                        shippingItemClassCAD: foundPost.shippingItemClassCAD,
                        itemWeightGrams: foundPost.itemWeightGrams,
                        itemDimensionLongest: foundPost.itemDimensionLongest,
                        itemDimensionMedian: foundPost.itemDimensionMedian,
                        itemDimensionShortest: foundPost.itemDimensionShortest,
                        shippingCost: Math.round(shippingCost *100)/100,
                        totalCostWithShipping: Math.round((checkedItemPrice + shippingCost) * 100)/100,
                        preorder: preorderSwitch,
                        selectedSize: selectedSize,
                        selectedColor: selectedColor,
                        selectedModel: selectedModel,
                        currency: foundPost.currency
                    }
                ],
                totalItemsCount: 1,
            })

            if(newCart){
                return res.status(200).json({"message": "added new item"}) 
            }
        }

    } else if(ipAddress && foundPost) {

        //For MCF orders
        if(foundPost.shippingItemClassCAD <= 2){

            if(surcharge === 'remote'){
                remoteFee = 7.50
            }

            let weightGrams = foundPost.itemWeightGrams

            if(weightGrams > 10000){

                shippingCost = 3.64 + ((weightGrams - 10000)/500 * 0.45) + (9500/500 * 0.99) + 4.93 + remoteFee
            
            } else if (weightGrams > 500 && weightGrams <= 10000){

                shippingCost = 3.64 + ((weightGrams-500)/500 * 0.99) + 4.93 + remoteFee
            
            } else {

                shippingCost = 3.64 + 4.93 + remoteFee
            }

            shippingCost = shippingCost - 4.00

        } else if(foundPost.shippingItemClassCAD >= 3 && foundPost.shippingItemClassCAD <= 5){
         
            let weightGrams = foundPost.itemWeightGrams

            if(surcharge === 'remote'){
                remoteFee = 50
            }

            if(weightGrams > 500 && weightGrams > 10000){

                shippingCost = 9.99 + ((weightGrams - 10000)/500 * 0.45) + (9500/500 * 0.99) + 4.93 + remoteFee
            
            } else if (weightGrams > 500 && weightGrams <= 10000){

                shippingCost = 9.99 + ((weightGrams-500)/500 * 0.99) + 4.93 + remoteFee
            
            } else {

                shippingCost = 9.99 + 4.93 + remoteFee
            }

            shippingCost = shippingCost - 4.00

        } else if(foundPost.shippingItemClassCAD === 6 ){

            let weightGrams = foundPost.itemWeightGrams

            if(surcharge === 'remote'){
                remoteFee = 50
            }

            if(weightGrams > 500 && weightGrams > 10000){

                shippingCost = 9.99 + 131.25 + ((weightGrams - 10000)/500 * 0.45) + (9500/500 * 0.99) + 4.93 + remoteFee
            
            } else if (weightGrams > 500 && weightGrams <= 10000){

                shippingCost = 9.99 + 131.25 + ((weightGrams-500)/500 * 0.99) + 4.93 + remoteFee
            
            } else {

                shippingCost = 9.99 + 131.25 + 4.93 + remoteFee
            }

            shippingCost = shippingCost - 4.00
        }

        if(preorder || preorder === 'true'){
            preorderSwitch = true;
            checkedItemPrice = foundPost.preorderPrice
        } else {
            checkedItemPrice = foundPost.totalPrice
        }

        const userShoppingCart = await ShoppingCart.findOne({ ipAddress: ipAddress})

        if(userShoppingCart){

            if(userShoppingCart.totalItemsCount > 20){
                return res.status(400).json({"Message": "Too many products in checkout"})
            }

            if(userShoppingCart.cartItems?.some(e=> (e._postId.toString() === ((postId)) && e.preorder === preorderSwitch 
            && e.selectedSize === selectedSize && e.selectedColor === selectedColor && e.selectedModel === selectedModel ))){

                for(let i=0;i<userShoppingCart.cartItems.length;i++){

                    if(userShoppingCart.cartItems[i]._postId.toString() === ((postId)) && userShoppingCart.cartItems[i].preorder === preorderSwitch
                    && userShoppingCart.cartItems[i].selectedColor === selectedColor && userShoppingCart.cartItems[i].selectedModel === selectedModel
                    && userShoppingCart.cartItems[i].selectedSize === selectedSize){

                        userShoppingCart.cartItems[i].itemsNumber = userShoppingCart.cartItems[i].itemsNumber + 1
                        userShoppingCart.cartItems[i].totalLinePrice = Math.round(checkedItemPrice * userShoppingCart.cartItems[i].itemsNumber * 100)/100
                        userShoppingCart.cartItems[i].shippingCost = Math.round( (userShoppingCart.cartItems[i].shippingCost + shippingCost) * 100)/100
                        userShoppingCart.cartItems[i].totalCostWithShipping = Math.round( (userShoppingCart.cartItems[i].totalLinePrice + userShoppingCart.cartItems[i].shippingCost) * 100)/100
                        userShoppingCart.cartItems[i].preorder = preorderSwitch
                        userShoppingCart.cartItems[i].currency = foundPost.currency
                        userShoppingCart.cartItems[i].selectedColor = selectedColor
                        userShoppingCart.cartItems[i].selectedSize = selectedSize
                        userShoppingCart.cartItems[i].selectedModel = selectedModel
                        userShoppingCart.totalItemsCount = userShoppingCart.totalItemsCount + 1
                        break
                    }
                }

                const saved = await userShoppingCart.save()

                if(saved){
                    return res.status(200).json({"message": "added new item"}) 
                }
                
            } else {

                userShoppingCart.cartItems.push(
                    {
                        orderItemName: foundPost.productname,
                        _postId: postId,
                        itemPrice: checkedItemPrice,
                        totalLinePrice: checkedItemPrice,
                        itemsNumber: 1,
                        shippingItemClassCAD: foundPost.shippingItemClassCAD,
                        itemWeightGrams: foundPost.itemWeightGrams,
                        itemDimensionLongest: foundPost.itemDimensionLongest,
                        itemDimensionMedian: foundPost.itemDimensionMedian,
                        itemDimensionShortest: foundPost.itemDimensionShortest,
                        shippingCost: Math.round(shippingCost*100)/100,
                        totalCostWithShipping: Math.round((checkedItemPrice + shippingCost)*100)/100,
                        currency: foundPost.currency,
                        preorder: preorderSwitch,
                        selectedSize: selectedSize,
                        selectedColor: selectedColor,
                        selectedModel: selectedModel,
                        preorder: preorderSwitch,
                    }
                )

                userShoppingCart.totalItemsCount = userShoppingCart.totalItemsCount + 1

                const saved = await userShoppingCart.save()

                if(saved){
                    return res.status(200).json({"message": "added new item"}) 
                }
            }
        
        } else {

            const newCart = await ShoppingCart.create({
                ipAddress: ipAddress,
                cartItems: [
                    {
                        orderItemName: foundPost.productname,
                        _postId: postId,
                        itemPrice: checkedItemPrice,
                        totalLinePrice: checkedItemPrice,
                        itemsNumber: 1,
                        shippingItemClassCAD: foundPost.shippingItemClassCAD,
                        itemWeightGrams: foundPost.itemWeightGrams,
                        itemDimensionLongest: foundPost.itemDimensionLongest,
                        itemDimensionMedian: foundPost.itemDimensionMedian,
                        itemDimensionShortest: foundPost.itemDimensionShortest,
                        shippingCost: Math.round(shippingCost*100)/100,
                        totalCostWithShipping: Math.round( (checkedItemPrice + shippingCost) * 100)/100,
                        preorder: preorderSwitch,
                        selectedSize: selectedSize,
                        selectedColor: selectedColor,
                        selectedModel: selectedModel,
                        currency: foundPost.currency
                    }
                ],
                totalItemsCount: 1,
            })

            if(newCart){
                return res.status(200).json({"message": "added new item"}) 
            }
        }
    }   
}

const clearShoppingCart = async (req, res) => {

    const { userId, ipAddress  } = req.query

    if( (!userId && !ipAddress) ){
        return res.status(400).json({ message: 'Missing required fields' })
    }

    if(userId){

        const deleted = await ShoppingCart.updateOne({_userId: userId},{$set: {cartItems: []}})
        
        if(deleted){
            return res.status(200).json({"message": "removed"}) 
        } 

    } else if(ipAddress) {

        const userShoppingCart = await ShoppingCart.updateOne({ ipAddress: ipAddress},{$set:{cartItems: []}})

        if(userShoppingCart){

            return res.status(200).json({"message": "removed"})             
        } 
    }   
}

const increaseCartItemNumber = async (req, res) => {

    const { userId, ipAddress, postId, preorder, selectedSize, selectedColor, selectedModel, surcharge } = req.body

    if( (!userId && !ipAddress) || !postId ){
        return res.status(400).json({ message: 'Missing required fields' })
    }

    var shippingCost = null
    var preorderSwitch = false
    var remoteFee = 0;

    const foundPost = await Post.findOne( {_id: postId} )

    if(userId && foundPost){

        //For MCF orders
        if(foundPost.shippingItemClassCAD <= 2){

            if(surcharge === 'remote'){
                remoteFee = 7.50
            }

            let weightGrams = foundPost.itemWeightGrams

            if(weightGrams > 10000){

                shippingCost = 3.64 + ((weightGrams - 10000)/500 * 0.45) + (9500/500 * 0.99) + 4.93 + remoteFee
            
            } else if (weightGrams > 500 && weightGrams <= 10000){

                shippingCost = 3.64 + ((weightGrams-500)/500 * 0.99) + 4.93 + remoteFee
            
            } else {

                shippingCost = 3.64 + 4.93 + remoteFee
            }

            shippingCost = shippingCost - 4.00

        } else if(foundPost.shippingItemClassCAD >= 3 && foundPost.shippingItemClassCAD <= 5){
         
            let weightGrams = foundPost.itemWeightGrams

            if(surcharge === 'remote'){
                remoteFee = 50
            }

            if(weightGrams > 500 && weightGrams > 10000){

                shippingCost = 9.99 + ((weightGrams - 10000)/500 * 0.45) + (9500/500 * 0.99) + 4.93 + remoteFee
            
            } else if (weightGrams > 500 && weightGrams <= 10000){

                shippingCost = 9.99 + ((weightGrams-500)/500 * 0.99) + 4.93 + remoteFee
            
            } else {

                shippingCost = 9.99 + 4.93 + remoteFee
            }

            shippingCost = shippingCost - 4.00

        } else if(foundPost.shippingItemClassCAD === 6 ){

            let weightGrams = foundPost.itemWeightGrams

            if(surcharge === 'remote'){
                remoteFee = 50
            }

            if(weightGrams > 500 && weightGrams > 10000){

                shippingCost = 9.99 + 131.25 + ((weightGrams - 10000)/500 * 0.45) + (9500/500 * 0.99) + 4.93 + remoteFee
            
            } else if (weightGrams > 500 && weightGrams <= 10000){

                shippingCost = 9.99 + 131.25 + ((weightGrams-500)/500 * 0.99) + 4.93 + remoteFee
            
            } else {

                shippingCost = 9.99 + 131.25 + 4.93 + remoteFee
            }

            shippingCost = shippingCost - 4.00
        }

        if(preorder || preorder === 'true'){
            preorderSwitch = true;
        }

        const userShoppingCart = await ShoppingCart.findOne({_userId: userId})
        
        if(userShoppingCart){
            
            if(userShoppingCart.totalItemsCount > 20){
                return res.status(400).json({"Message": "Too many products in checkout"})
            }

            if(userShoppingCart.cartItems?.some(e=>(e._postId.toString() === ((postId)) && e.preorder === preorderSwitch 
            && e.selectedSize === selectedSize && e.selectedColor === selectedColor && e.selectedModel === selectedModel))){

                for(let i=0;i<userShoppingCart.cartItems.length;i++){

                    if(userShoppingCart.cartItems[i]._postId.toString() === ((postId)) && userShoppingCart.cartItems[i].preorder === preorderSwitch
                    && userShoppingCart.cartItems[i].selectedColor === selectedColor && userShoppingCart.cartItems[i].selectedModel === selectedModel
                    && userShoppingCart.cartItems[i].selectedSize === selectedSize){
                        
                        userShoppingCart.cartItems[i].itemsNumber = userShoppingCart.cartItems[i].itemsNumber + 1
                        userShoppingCart.cartItems[i].totalLinePrice = Math.round(userShoppingCart.cartItems[i].itemPrice * userShoppingCart.cartItems[i].itemsNumber * 100)/100
                        userShoppingCart.cartItems[i].shippingCost = Math.round( (userShoppingCart.cartItems[i].shippingCost + shippingCost) * 100)/100
                        userShoppingCart.cartItems[i].totalCostWithShipping = Math.round( (userShoppingCart.cartItems[i].totalLinePrice + userShoppingCart.cartItems[i].shippingCost) * 100)/100
                        userShoppingCart.cartItems[i].preorder = preorderSwitch
                        userShoppingCart.cartItems[i].currency = foundPost.currency
                        userShoppingCart.totalItemsCount = userShoppingCart.totalItemsCount + 1
                        break
                    }
                }

                const saved = await userShoppingCart.save()

                if(saved){
                    return res.status(200).json({"message": "increased item number"}) 
                }  
            } 
        } 

    } else if(ipAddress && foundPost) {

        //For MCF orders
        if(foundPost.shippingItemClassCAD <= 2){

            if(surcharge === 'remote'){
                remoteFee = 7.50
            }

            let weightGrams = foundPost.itemWeightGrams

            if(weightGrams > 10000){

                shippingCost = 3.64 + ((weightGrams - 10000)/500 * 0.45) + (9500/500 * 0.99) + 4.93 + remoteFee
            
            } else if (weightGrams > 500 && weightGrams <= 10000){

                shippingCost = 3.64 + ((weightGrams-500)/500 * 0.99) + 4.93 + remoteFee
            
            } else {

                shippingCost = 3.64 + 4.93 + remoteFee
            }

            shippingCost = shippingCost - 4.00

        } else if(foundPost.shippingItemClassCAD >= 3 && foundPost.shippingItemClassCAD <= 5){
         
            let weightGrams = foundPost.itemWeightGrams

            if(surcharge === 'remote'){
                remoteFee = 50
            }

            if(weightGrams > 500 && weightGrams > 10000){

                shippingCost = 9.99 + ((weightGrams - 10000)/500 * 0.45) + (9500/500 * 0.99) + 4.93 + remoteFee
            
            } else if (weightGrams > 500 && weightGrams <= 10000){

                shippingCost = 9.99 + ((weightGrams-500)/500 * 0.99) + 4.93 + remoteFee
            
            } else {

                shippingCost = 9.99 + 4.93 + remoteFee
            }

            shippingCost = shippingCost - 4.00

        } else if(foundPost.shippingItemClassCAD === 6 ){

            let weightGrams = foundPost.itemWeightGrams

            if(surcharge === 'remote'){
                remoteFee = 50
            }

            if(weightGrams > 500 && weightGrams > 10000){

                shippingCost = 9.99 + 131.25 + ((weightGrams - 10000)/500 * 0.45) + (9500/500 * 0.99) + 4.93 + remoteFee
            
            } else if (weightGrams > 500 && weightGrams <= 10000){

                shippingCost = 9.99 + 131.25 + ((weightGrams-500)/500 * 0.99) + 4.93 + remoteFee
            
            } else {

                shippingCost = 9.99 + 131.25 + 4.93 + remoteFee
            }

            shippingCost = shippingCost - 4.00
        }

        if(preorder || preorder === 'true'){
            preorderSwitch = true;
        }

        const userShoppingCart = await ShoppingCart.findOne({ ipAddress: ipAddress})

        if(userShoppingCart){

            if(userShoppingCart.totalItemsCount > 20){
                return res.status(400).json({"Message": "Too many products in checkout"})
            }

            if(userShoppingCart.cartItems?.some(e=> (e._postId.toString() === ((postId)) && e.preorder === preorderSwitch 
                && e.selectedSize === selectedSize && e.selectedColor === selectedColor && e.selectedModel === selectedModel))){

                for(let i=0;i<userShoppingCart.cartItems.length;i++){

                    if(userShoppingCart.cartItems[i]._postId.toString() === ((postId)) && userShoppingCart.cartItems[i].preorder === preorderSwitch
                    && userShoppingCart.cartItems[i].selectedColor === selectedColor && userShoppingCart.cartItems[i].selectedModel === selectedModel
                    && userShoppingCart.cartItems[i].selectedSize === selectedSize){
                        
                        userShoppingCart.cartItems[i].itemsNumber = userShoppingCart.cartItems[i].itemsNumber + 1
                        userShoppingCart.cartItems[i].totalLinePrice = Math.round(userShoppingCart.cartItems[i].itemPrice * userShoppingCart.cartItems[i].itemsNumber * 100)/100
                        userShoppingCart.cartItems[i].shippingCost = Math.round( (userShoppingCart.cartItems[i].shippingCost + shippingCost) * 100)/100
                        userShoppingCart.cartItems[i].totalCostWithShipping = Math.round( (userShoppingCart.cartItems[i].totalLinePrice + userShoppingCart.cartItems[i].shippingCost) * 100)/100
                        userShoppingCart.cartItems[i].preorder = preorderSwitch
                        userShoppingCart.cartItems[i].currency = foundPost.currency
                        userShoppingCart.totalItemsCount = userShoppingCart.totalItemsCount + 1
                        break
                    }
                }

                const saved = await userShoppingCart.save()

                if(saved){
                    return res.status(200).json({"message": "increased item number"}) 
                }
            } 
        } 
    }  
}

const decreaseCartItemNumber = async (req, res) => {

    const { userId, ipAddress, postId, preorder, selectedSize, selectedColor, selectedModel, surcharge } = req.body

    if( (!userId && !ipAddress) || !postId ){
        return res.status(400).json({ message: 'Missing required fields' })
    }

    //calculate shipping costs here
    var shippingCost = null
    var preorderSwitch = false;
    var checkedItemPrice = 0;
    var remoteFee = 0;

    const foundPost = await Post.findOne( {_id: postId} )

    if(userId && foundPost){

        //For MCF orders
        if(foundPost.shippingItemClassCAD <= 2){

            if(surcharge === 'remote'){
                remoteFee = 7.50
            }

            let weightGrams = foundPost.itemWeightGrams

            if(weightGrams > 10000){

                shippingCost = 3.64 + ((weightGrams - 10000)/500 * 0.45) + (9500/500 * 0.99) + 4.93 + remoteFee
            
            } else if (weightGrams > 500 && weightGrams <= 10000){

                shippingCost = 3.64 + ((weightGrams-500)/500 * 0.99) + 4.93 + remoteFee
            
            } else {

                shippingCost = 3.64 + 4.93 + remoteFee
            }

            shippingCost = shippingCost - 4.00

        } else if(foundPost.shippingItemClassCAD >= 3 && foundPost.shippingItemClassCAD <= 5){
         
            let weightGrams = foundPost.itemWeightGrams

            if(surcharge === 'remote'){
                remoteFee = 50
            }

            if(weightGrams > 500 && weightGrams > 10000){

                shippingCost = 9.99 + ((weightGrams - 10000)/500 * 0.45) + (9500/500 * 0.99) + 4.93 + remoteFee
            
            } else if (weightGrams > 500 && weightGrams <= 10000){

                shippingCost = 9.99 + ((weightGrams-500)/500 * 0.99) + 4.93 + remoteFee
            
            } else {

                shippingCost = 9.99 + 4.93 + remoteFee
            }

            shippingCost = shippingCost - 4.00

        } else if(foundPost.shippingItemClassCAD === 6 ){

            let weightGrams = foundPost.itemWeightGrams

            if(surcharge === 'remote'){
                remoteFee = 50
            }

            if(weightGrams > 500 && weightGrams > 10000){

                shippingCost = 9.99 + 131.25 + ((weightGrams - 10000)/500 * 0.45) + (9500/500 * 0.99) + 4.93 + remoteFee
            
            } else if (weightGrams > 500 && weightGrams <= 10000){

                shippingCost = 9.99 + 131.25 + ((weightGrams-500)/500 * 0.99) + 4.93 + remoteFee
            
            } else {

                shippingCost = 9.99 + 131.25 + 4.93 + remoteFee
            }

            shippingCost = shippingCost - 4.00
        }

        if(preorder || preorder === 'true'){
            preorderSwitch = true;
            checkedItemPrice = foundPost.preorderPrice
        } else {
            checkedItemPrice = foundPost.totalPrice
        }

        const userShoppingCart = await ShoppingCart.findOne({_userId: userId})
        
        if(userShoppingCart){

            if(userShoppingCart.cartItems?.some(e=>(e._postId.toString() === ((postId)) && e.preorder === preorderSwitch 
            && e.selectedSize === selectedSize && e.selectedColor === selectedColor && e.selectedModel === selectedModel))){

                for(let i=0;i<userShoppingCart.cartItems?.length;i++){

                    if(userShoppingCart.cartItems[i]._postId.equals(postId) && userShoppingCart.cartItems[i].preorder === preorderSwitch
                    && userShoppingCart.cartItems[i].selectedColor === selectedColor && userShoppingCart.cartItems[i].selectedModel === selectedModel
                    && userShoppingCart.cartItems[i].selectedSize === selectedSize){

                        if(userShoppingCart.cartItems[i].itemsNumber > 1){

                            userShoppingCart.cartItems[i].itemsNumber = userShoppingCart.cartItems[i].itemsNumber - 1
                            userShoppingCart.cartItems[i].totalLinePrice = Math.round(checkedItemPrice * userShoppingCart.cartItems[i].itemsNumber * 100)/100
                            userShoppingCart.cartItems[i].shippingCost = Math.round( (userShoppingCart.cartItems[i].shippingCost - shippingCost) * 100)/100                    
                            userShoppingCart.cartItems[i].totalCostWithShipping = Math.round( (userShoppingCart.cartItems[i].totalLinePrice + userShoppingCart.cartItems[i].shippingCost) * 100)/100
                            userShoppingCart.totalItemsCount = userShoppingCart.totalItemsCount - 1
                            
                            const saved = await userShoppingCart.save()
        
                            if(saved){
                                return res.status(200).json({"message": "removed"}) 
                            }
        
                        } else if (userShoppingCart.cartItems[i].itemsNumber <= 1) {
        
                            const deleted = await ShoppingCart.updateOne({_userId: userId},{$pull:{cartItems: {_postId: postId, preorder: preorderSwitch}},$inc: {totalItemsCount: -1}})
        
                            if(deleted){
                                console.log("Here 55")
                                return res.status(200).json({"message": "removed"}) 
                            }
                        }
                    }
                }
            } 
        } 

    } else if(ipAddress && foundPost) {

        //For MCF orders
        if(foundPost.shippingItemClassCAD <= 2){

            if(surcharge === 'remote'){
                remoteFee = 7.50
            }

            let weightGrams = foundPost.itemWeightGrams

            if(weightGrams > 10000){

                shippingCost = 3.64 + ((weightGrams - 10000)/500 * 0.45) + (9500/500 * 0.99) + 4.93 + remoteFee
            
            } else if (weightGrams > 500 && weightGrams <= 10000){

                shippingCost = 3.64 + ((weightGrams-500)/500 * 0.99) + 4.93 + remoteFee
            
            } else {

                shippingCost = 3.64 + 4.93 + remoteFee
            }

            shippingCost = shippingCost - 4.00

        } else if(foundPost.shippingItemClassCAD >= 3 && foundPost.shippingItemClassCAD <= 5){
         
            let weightGrams = foundPost.itemWeightGrams

            if(surcharge === 'remote'){
                remoteFee = 50
            }

            if(weightGrams > 500 && weightGrams > 10000){

                shippingCost = 9.99 + ((weightGrams - 10000)/500 * 0.45) + (9500/500 * 0.99) + 4.93 + remoteFee
            
            } else if (weightGrams > 500 && weightGrams <= 10000){

                shippingCost = 9.99 + ((weightGrams-500)/500 * 0.99) + 4.93 + remoteFee
            
            } else {

                shippingCost = 9.99 + 4.93 + remoteFee
            }

            shippingCost = shippingCost - 4.00

        } else if(foundPost.shippingItemClassCAD === 6 ){

            let weightGrams = foundPost.itemWeightGrams

            if(surcharge === 'remote'){
                remoteFee = 50
            }

            if(weightGrams > 500 && weightGrams > 10000){

                shippingCost = 9.99 + 131.25 + ((weightGrams - 10000)/500 * 0.45) + (9500/500 * 0.99) + 4.93 + remoteFee
            
            } else if (weightGrams > 500 && weightGrams <= 10000){

                shippingCost = 9.99 + 131.25 + ((weightGrams-500)/500 * 0.99) + 4.93 + remoteFee
            
            } else {

                shippingCost = 9.99 + 131.25 + 4.93 + remoteFee
            }

            shippingCost = shippingCost - 4.00
        }

        if(preorder || preorder === 'true'){
            preorderSwitch = true;
            checkedItemPrice = foundPost.preorderPrice
        } else {
            checkedItemPrice = foundPost.totalPrice
        }

        const userShoppingCart = await ShoppingCart.findOne({ ipAddress: ipAddress})

        if(userShoppingCart){

            if(userShoppingCart.cartItems?.some(e=> (e._postId.toString() === ((postId)) && e.preorder === preorderSwitch 
            && e.selectedSize === selectedSize && e.selectedColor === selectedColor && e.selectedModel === selectedModel))){

                for(let i=0;i<userShoppingCart.cartItems?.length;i++){

                    if(userShoppingCart.cartItems[i]._postId.equals(postId) && userShoppingCart.cartItems[i].preorder === preorderSwitch
                    && userShoppingCart.cartItems[i].selectedColor === selectedColor && userShoppingCart.cartItems[i].selectedModel === selectedModel
                    && userShoppingCart.cartItems[i].selectedSize === selectedSize){

                        if(userShoppingCart.cartItems[i].itemsNumber > 1){

                            userShoppingCart.cartItems[i].itemsNumber = userShoppingCart.cartItems[i].itemsNumber - 1
                            userShoppingCart.cartItems[i].totalLinePrice = Math.round(checkedItemPrice * userShoppingCart.cartItems[i].itemsNumber * 100)/100
                            userShoppingCart.cartItems[i].shippingCost = Math.round( (userShoppingCart.cartItems[i].shippingCost - shippingCost) * 100)/100                    
                            userShoppingCart.cartItems[i].totalCostWithShipping = Math.round( (userShoppingCart.cartItems[i].totalLinePrice + userShoppingCart.cartItems[i].shippingCost) * 100)/100
                            userShoppingCart.totalItemsCount = userShoppingCart.totalItemsCount - 1
                            
                            const saved = await userShoppingCart.save()
        
                            if(saved){
                                return res.status(200).json({"message": "removed"}) 
                            }
        
                        } else if (userShoppingCart.cartItems[i].itemsNumber <= 1) {
        
                            const deleted = await ShoppingCart.updateOne({ipAddress: ipAddress},{$pull:{cartItems: {_postId: postId, preorder: preorderSwitch}}, $inc:{totalItemsCount: -1}})
        
                            if(deleted){
                                return res.status(200).json({"message": "removed"}) 
                            }
                        }
                    }
                }
            } 
        } 
    } 
}


module.exports = { getShoppingCart, addShoppingCartItem, clearShoppingCart,
    increaseCartItemNumber, decreaseCartItemNumber }