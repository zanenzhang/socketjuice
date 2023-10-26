const User = require('../../model/User');
const Storefollowing = require('../../model/Storefollowing');
const Peoplefollowing = require('../../model/Peoplefollowing');
const Post = require('../../model/Post');
const Flags = require('../../model/Flags');
const StoreProfile = require('../../model/StoreProfile');
const Bookmark = require('../../model/Bookmark');
const Sharedpost = require('../../model/Sharedpost');
const OwnedProducts = require('../../model/OwnedProducts');
const Product = require('../../model/Product');
const Productfollowing = require('../../model/Productfollowing');
const Preference = require('../../model/Preference');

const S3 = require("aws-sdk/clients/s3");
const fns = require('date-fns');
const ObjectId  = require('mongodb').ObjectId;

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


function shuffleArray(array) {
    for (var i = array.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var temp = array[i];
        array[i] = array[j];
        array[j] = temp;
    }
}


const getStoreTimeline = async (req, res) => {
    
    var { userId, pageNumber, city, region, country, category, proximity, sortDirection, 
            language, retailerIds, currency, randomnum, gender } = req.query

    if (!userId || !pageNumber || !city || !region || !country || !category || !sortDirection || !language) {
        return res.status(400).json({ message: 'Missing required information' })
    }

    if(Number(pageNumber) === NaN || Number(pageNumber) < 0 || Number(pageNumber) > 400){
        return res.status(400).json({ message: 'Content does not meet requirements' })
    }
    var skipPageNumber = Number(pageNumber) + Number(randomnum)
    pageNumber = Number(pageNumber)
    retailerIds = JSON.parse(retailerIds)

    const blockedProfiles = await User.findOne({_id: userId}).select("blockedUsers")
    // const influencers = await User.find({influencerRating: {$gte: 0}, deactivated: false, active: true}).sort({lastPosting: -1, influencerRating: -1}).limit(20)
    const storeFollowing = await Storefollowing.findOne({ _userId: userId })
    const peopleFollowing = await Peoplefollowing.findOne({ _userId: userId })
    const ownedProductsFound = await OwnedProducts.findOne({_userId: userId})
    const bookmarksFound = await Bookmark.findOne({_userId: userId})
    const flaggedPosts = await Flags.findOne({_userId: userId}).select("postFlags")
    const productFollowing = await Productfollowing.findOne({ _userId: userId })
    const preferences = await Preference.findOne({_userId: userId})

    var sharedpostsFound = await Sharedpost.findOne({_userId: userId})
    
    let doneStorePosts = false;
    var doneSharedposts = false;
    var stop = 0;

    if(peopleFollowing && productFollowing && storeFollowing && blockedProfiles && preferences){

        const today = new Date();
        const threeMonthsAgo = new Date(today.getFullYear(), today.getMonth(), today.getDate()-90);
        const oneWeekAgo = new Date(today.getFullYear(), today.getMonth(), today.getDate()-7);

        let donePreStore = false;
        let donePreProducts = false;
        let updatedUserPrefs = false;
        let doneMorePublicPosts = false;

        let preFollowPeoplePosts = [];
        let prePublicPeoplePosts = [];
        let preFollowStorePosts = [];
        let prePublicStorePosts = [];
        let productPosts = [];
        let storePosts = [];

        var genderArray = []

        if(gender){

            if(gender === 'female' || gender === 'Female'){
                genderArray.push({"gender": "female"})
                genderArray.push({"gender": "Female"})
            } else if(gender === 'male' || gender === 'Male') {
                genderArray.push({"gender": "male"})
                genderArray.push({"gender": "Male"})
            } else {
                genderArray.push({"gender": "female"})
                genderArray.push({"gender": "male"})
                genderArray.push({"gender": "Female"})
                genderArray.push({"gender": "Male"})
                genderArray.push({"gender": "unisex"})
                genderArray.push({"gender": "Unisex"})
            }

        } else if(preferences?.gender){
            
            var usergender = preferences?.gender
            
            if(usergender === 'female' || usergender === 'Female'){
                genderArray.push({"gender": "female"})
                genderArray.push({"gender": "Female"})
            } else if(usergender === 'male' || usergender === 'Male') {
                genderArray.push({"gender": "male"})
                genderArray.push({"gender": "Male"})
            } else {
                genderArray.push({"gender": "female"})
                genderArray.push({"gender": "male"})
                genderArray.push({"gender": "Female"})
                genderArray.push({"gender": "Male"})
                genderArray.push({"gender": "unisex"})
                genderArray.push({"gender": "Unisex"})
            }

        } else {
            
            genderArray.push({"gender": "female"})
            genderArray.push({"gender": "male"})
            genderArray.push({"gender": "Female"})
            genderArray.push({"gender": "Male"})
            genderArray.push({"gender": "unisex"})
            genderArray.push({"gender": "Unisex"})
        }

        updatedUserPrefs = await User.updateOne({_id:userId, $or: [ 
            { preferredCity: { $ne: city }},
            { preferredRegion: { $ne: region }},
            { preferredCountry: { $ne: country }},
            { preferredCategory: { $ne: category }},
            { language: { $ne: language }},
            { initialRetailers: { $ne: retailerIds }},
            ]},
            {$set:{preferredCity: city, preferredRegion: region,
            preferredCountry: country, preferredCategory: category,
            language: language, initialRetailers: retailerIds}})

        let sortQuery = {};
        if (sortDirection === 'MostRecent'){
            sortQuery = {"createdAt": -1, "score": -1}
        } else if(sortDirection === 'Distance'){
            sortQuery = {"score": -1, "createdAt": -1} //Replace in future with distance
        } else if(sortDirection === 'Trending'){
            sortQuery = {"totalPostViews": -1, "score": -1} 
        } else if(sortDirection === 'LowestPrice'){
            sortQuery = {"totalPrice": 1} 
        } else if(sortDirection === 'HighestPrice'){
            sortQuery = {"totalPrice": -1} 
        } else {
            sortQuery = {"score": -1, "createdAt": -1} //For explore posts
        }
        
        let preFollowPeopleQuery = {
            "$and": [{"$or":[
                {_userId: {"$in": peopleFollowing.allPeopleFollowing?.map(e=>e._followingId)}}, 
                {"_userId": userId} ]}, {isStorePost: false}, {postClass: 1}] 
        }

        let prePublicPeopleQuery = {
            "$and": [ {_userId: {"$nin": peopleFollowing.allPeopleFollowing?.map(e=>e._followingId)}},
            {_userId: {"$nin": blockedProfiles.blockedUsers.map(e=>e._userId)}}, 
            {isStorePost: false}, {privacySetting: 1}, {postClass: 1}, 
            {"$expr": { "$lt": [0.05, {"$rand": {} } ] }}]
        }

        let preFollowStoreQuery = {
            "$and": [{"$or":[{_userId: {$in: storeFollowing.allStoreFollowing?.map(e=>e._followingId)}}, 
                {_userId: userId} ]}, {postClass: 1}, {isStorePost: true}, 
                {$or: genderArray}]
        }

        let prePublicStoreQuery = {
            "$and": [{_userId: {$nin: storeFollowing.allStoreFollowing?.map(e=>e._followingId)}},
                {_userId: {"$nin": blockedProfiles.blockedUsers.map(e=>e._userId)}}, 
                {isStorePost: true}, {privacySetting: 1}, {postClass: 1}, {$or: genderArray},
                {"$expr": { "$lt": [0.05, {"$rand": {} } ] }}]
        }

        if(language !== 'All' && language !== 'Select All'){
            preFollowPeopleQuery['$and'].push({"$or":[{"language": language},{"language": ""}, {"language": {"$exists": false}}]});
            preFollowStoreQuery['$and'].push({"$or":[{"language": language},{"language": ""}, {"language": {"$exists": false}}]});
            prePublicPeopleQuery['$and'].push({"$or":[{"language": language},{"language": ""}, {"language": {"$exists": false}}]});
            prePublicStoreQuery['$and'].push({"$or":[{"language": language},{"language": ""}, {"language": {"$exists": false}}]});
        }

        if(city !== "Select All" && city !== "All") {
            preFollowPeopleQuery['$and'].push({"$or":[{"city": "All"},{"city": "Select All"},{"city": city}]})
            preFollowStoreQuery['$and'].push({"$or":[{"city": "All"},{"city": "Select All"},{"city": city}]})
            prePublicPeopleQuery['$and'].push({"$or":[{"city": "All"},{"city": "Select All"},{"city": city}]})
            prePublicStoreQuery['$and'].push({"$or":[{"city": "All"},{"city": "Select All"},{"city": city}]})
        }

        if(region !== "Select All" && region !== "All"){
            preFollowPeopleQuery['$and'].push({"$or":[{"region": "All"},{"region": "Select All"},{"region": region}]})
            preFollowStoreQuery['$and'].push({"$or":[{"region": "All"},{"region": "Select All"},{"region": region}]})
            prePublicPeopleQuery['$and'].push({"$or":[{"region": "All"},{"region": "Select All"},{"region": region}]})
            prePublicStoreQuery['$and'].push({"$or":[{"region": "All"},{"region": "Select All"},{"region": region}]})
        }

        if((country !== "Select All" && country !== "All")){
            preFollowPeopleQuery['$and'].push({"$or":[{"country": "All"},{"country": "Select All"},{"country": country}]})
            preFollowStoreQuery['$and'].push({"$or":[{"country": "All"},{"country": "Select All"},{"country": country}]})
            prePublicPeopleQuery['$and'].push({"$or":[{"country": "All"},{"country": "Select All"},{"country": country}]})
            prePublicStoreQuery['$and'].push({"$or":[{"country": "All"},{"country": "Select All"},{"country": country}]})
        }

        if((category !== "All" && category !== "All Categories" && category !== "N/A")){
            preFollowPeopleQuery['$and'].push({"$or":[{"primaryCategory": "All"},{"primaryCategory": "All Categories"},{"primaryCategory": category}]})
            preFollowStoreQuery['$and'].push({"$or":[{"primaryCategory": "All"},{"primaryCategory": "All Categories"},{"primaryCategory": category}]})
            prePublicPeopleQuery['$and'].push({"$or":[{"primaryCategory": "All"},{"primaryCategory": "All Categories"},{"primaryCategory": category}]})
            prePublicStoreQuery['$and'].push({"$or":[{"primaryCategory": "All"},{"primaryCategory": "All Categories"},{"primaryCategory": category}]})
        }

        if((!retailerIds.includes("All") && !retailerIds.includes("All Retailers") && !retailerIds.includes("N/A"))){
            preFollowPeopleQuery['$and'].push({"$or":[{"retailerId": {"$in": retailerIds.map(e=>Number(e))}} ]})
            preFollowStoreQuery['$and'].push({"$or":[{"retailerId": {"$in": retailerIds.map(e=>Number(e))}} ]})
            prePublicPeopleQuery['$and'].push({"$or":[{"retailerId": {"$in": retailerIds.map(e=>Number(e))}} ]})
            prePublicStoreQuery['$and'].push({"$or":[{"retailerId": {"$in": retailerIds.map(e=>Number(e))}} ]})
        }

        preFollowPeoplePosts = await Post.find(preFollowPeopleQuery,{"caption_fuzzy": 0, "postViews": 0, "postViews": 0, "additionalProperty": 0}).sort(sortQuery).skip(pageNumber).limit(12)
        prePublicPeoplePosts = await Post.find(prePublicPeopleQuery,{"caption_fuzzy": 0, "postViews": 0, "postViews": 0, "additionalProperty": 0}).sort(sortQuery).skip(pageNumber).limit(12)
        preFollowStorePosts = await Post.find(preFollowStoreQuery,{"caption_fuzzy": 0, "postViews": 0, "postViews": 0, "additionalProperty": 0}).sort(sortQuery).skip(pageNumber).limit(12)
        prePublicStorePosts = await Post.find(prePublicStoreQuery,{"caption_fuzzy": 0, "postViews": 0, "postViews": 0, "additionalProperty": 0}).sort(sortQuery).skip(skipPageNumber).limit(12)
    
        if(preFollowPeoplePosts && prePublicPeoplePosts && preFollowStorePosts && prePublicStorePosts 
            && updatedUserPrefs){
            donePreStore = true
        }

        if(productFollowing?.allProductFollowing?.length > 0){

            let productPostsQuery = {
                "$and": [{_productId: {"$in": productFollowing.allProductFollowing?.map(e=>e._followingId)}},
                    {createdAt: {"$gte": threeMonthsAgo}}, {postClass: 1}]
            }

            productPosts = await Post.find(productPostsQuery,{"caption_fuzzy": 0, "postViews": 0, "postViews": 0, "additionalProperty": 0}).sort({score: -1, createdAt: -1}).skip(pageNumber).limit(12)

            if(productPosts){
                donePreProducts = true
            }

        } else {
            donePreProducts = true
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

        if (donePreStore && donePreProducts){

            const storePostsPre = [...preFollowPeoplePosts, ...prePublicPeoplePosts,
                ...preFollowStorePosts, ...prePublicStorePosts, ...productPosts];

            if(storePostsPre?.length < 12){

                let morePostsQuery = {
                    "$and": [ {_userId: {$nin: storeFollowing.allStoreFollowing?.map(e=>e._followingId)}},
                        {_userId: {"$nin": blockedProfiles.blockedUsers.map(e=>e._userId)}}, 
                        {isStorePost: true}, {privacySetting: 1}, {postClass: 1}, {$or: genderArray}]
                }

                if(language !== 'All' && language !== 'Select All'){
                    morePostsQuery['$and'].push({$or:[{"language": language},{"language": ""}, {"language": {"$exists": false}}]});
                }
        
                if(city !== "Select All" && city !== "All") {
                    morePostsQuery['$and'].push({$or:[{"region": "All"},{"region": "Select All"},{"region": region}]})
                }
        
                if(region !== "Select All" && region !== "All"){
                    morePostsQuery['$and'].push({$or:[{"country": "All"},{"country": "Select All"},{"country": country}]})
                }
        
                if((category !== "All" && category !== "All Categories" && category !== "N/A")){
                    morePostsQuery['$and'].push({$or:[{"primaryCategory": "All"},{"primaryCategory": "All Categories"},{"primaryCategory": "N/A"},{"primaryCategory": category}]})
                }

                if((!retailerIds.includes("All") && !retailerIds.includes("All Retailers") && !retailerIds.includes("N/A"))){
                    morePostsQuery['$and'].push({$or:[{"retailerId": {"$in": retailerIds.map(e=>Number(e))}} ]})
                }

                let morePublicPosts = await Post.find(morePostsQuery,{"caption_fuzzy": 0, "postViews": 0, "postViews": 0, "additionalProperty": 0})
                    .sort(sortQuery).skip(pageNumber).limit(12)

                if(morePublicPosts){

                    storePosts = [...storePostsPre, ...morePublicPosts]

                    const ids = storePosts.map(({ _id }) => _id);
                    storePosts = storePosts.filter(({ _id }, index) => !ids.includes(_id, index + 1));

                    doneMorePublicPosts = true;
                }
                
            } else {

                const ids = storePostsPre.map(({ _id }) => _id);
                storePosts = storePostsPre.filter(({ _id }, index) => !ids.includes(_id, index + 1));

                doneMorePublicPosts = true;
            }
        
            if(doneMorePublicPosts && storePosts?.length > 0){

                storePosts.forEach(function(item, index){

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

                doneStorePosts = true;
            }

            if(storePosts?.length > 0 && doneStorePosts){

                const foundProducts = await Product.find({_id: {"$in": storePosts.map(e=>e._productId)}},{brand_fuzzy: 0, productname_fuzzy:0})

                const storeData = await User.find({_id: {"$in": storePosts.map(e=>e._userId)}}).select("_id profilePicURL deactivated")
                
                const displayData = await StoreProfile.find({_userId: {"$in": storePosts.map(e=>e._userId)}}).select("_userId displayname address city region")
                
                if(storeData && displayData && ownedProductsFound && bookmarksFound && doneSharedposts
                    && doneStorePosts && foundProducts && flaggedPosts){

                    return res.json({storePosts, storeData, displayData, ownedProductsFound, 
                        foundProducts, bookmarksFound, sharedpostsFound, flaggedPosts, stop})
                
                } else {

                    return res.status(400).json({ message: 'Operation failed!' })
                }

            } else {

                stop = 1
                return res.status(201).json({stop})
            }

        } else {

            stop = 1;

            if(ownedProductsFound && bookmarksFound && flaggedPosts && doneSharedposts){

                return res.status(201).json({ ownedProductsFound, bookmarksFound, sharedpostsFound, 
                    flaggedPosts, stop})
            
            } else {

                return res.status(400).json({ message: 'Operation failed!' })
            }
        }

    } else {

        stop = 1

        return res.status(201).json({stop})
    }
}


const getStoreTimelineUpdate = async (req, res) => {
    
    var { userId, pageNumber, city, region, country, category, proximity, sortDirection, 
            language, retailerIds, currency, randomnum, gender } = req.query

    if (!userId || !pageNumber || !city || !region || !country || !category || !sortDirection || !language) {
        return res.status(400).json({ message: 'Missing required information' })
    }

    if(Number(pageNumber) === NaN || Number(pageNumber) < 0 || Number(pageNumber) > 400){
        return res.status(400).json({ message: 'Content does not meet requirements' })
    }
    var skipPageNumber = Number(pageNumber) + Number(randomnum)
    pageNumber = Number(pageNumber)
    retailerIds = JSON.parse(retailerIds)

    const blockedProfiles = await User.findOne({_id: userId}).select("blockedUsers")
    // const influencers = await User.find({influencerRating: {$gte: 0}, deactivated: false, active: true}).sort({lastPosting: -1, influencerRating: -1}).limit(20)
    const storeFollowing = await Storefollowing.findOne({ _userId: userId })
    const peopleFollowing = await Peoplefollowing.findOne({ _userId: userId })
    const ownedProductsFound = []
    const bookmarksFound = []
    const flaggedPosts = []
    const productFollowing = await Productfollowing.findOne({ _userId: userId })
    const preferences = await Preference.findOne({_userId: userId})

    var sharedpostsFound = [];
    
    let doneStorePosts = false;
    var doneSharedposts = true;
    var stop = 0;

    if(peopleFollowing && productFollowing && storeFollowing && blockedProfiles && preferences){

        const today = new Date();
        const threeMonthsAgo = new Date(today.getFullYear(), today.getMonth(), today.getDate()-90);
        const oneWeekAgo = new Date(today.getFullYear(), today.getMonth(), today.getDate()-7);

        let donePreStore = false;
        let donePreProducts = false;
        let updatedUserPrefs = false;
        let doneMorePublicPosts = false;

        let productPosts = [];
        let storePosts = [];

        var genderArray = []
        
        if(gender){

            if(gender === 'female' || gender === 'Female'){
                genderArray.push({"gender": "female"})
                genderArray.push({"gender": "Female"})
            } else if(gender === 'male' || gender === 'Male') {
                genderArray.push({"gender": "male"})
                genderArray.push({"gender": "Male"})
            } else {
                genderArray.push({"gender": "female"})
                genderArray.push({"gender": "male"})
                genderArray.push({"gender": "Female"})
                genderArray.push({"gender": "Male"})
                genderArray.push({"gender": "unisex"})
                genderArray.push({"gender": "Unisex"})
            }

        } else if(preferences?.gender){
            
            var usergender = preferences?.gender
            
            if(usergender === 'female' || usergender === 'Female'){
                genderArray.push({"gender": "female"})
                genderArray.push({"gender": "Female"})
            } else if(usergender === 'male' || usergender === 'Male') {
                genderArray.push({"gender": "male"})
                genderArray.push({"gender": "Male"})
            } else {
                genderArray.push({"gender": "female"})
                genderArray.push({"gender": "male"})
                genderArray.push({"gender": "Female"})
                genderArray.push({"gender": "Male"})
                genderArray.push({"gender": "unisex"})
                genderArray.push({"gender": "Unisex"})
            }

        } else {
            
            genderArray.push({"gender": "female"})
            genderArray.push({"gender": "male"})
            genderArray.push({"gender": "Female"})
            genderArray.push({"gender": "Male"})
            genderArray.push({"gender": "unisex"})
            genderArray.push({"gender": "Unisex"})
        }

        updatedUserPrefs = await User.updateOne({_id:userId, $or: [ 
            { preferredCity: { $ne: city }},
            { preferredRegion: { $ne: region }},
            { preferredCountry: { $ne: country }},
            { preferredCategory: { $ne: category }},
            { language: { $ne: language }},
            { initialRetailers: { $ne: retailerIds }}
            ]},
            {$set:{preferredCity: city, preferredRegion: region,
            preferredCountry: country, preferredCategory: category,
            language: language, initialRetailers: retailerIds}})

        let sortQuery = {};
        if (sortDirection === 'MostRecent'){
            sortQuery = {"createdAt": -1, "score": -1}
        } else if(sortDirection === 'Distance'){
            sortQuery = {"score": -1, "createdAt": -1} //Replace in future with distance
        } else if(sortDirection === 'Trending'){
            sortQuery = {"totalPostViews": -1, "score": -1} 
        } else if(sortDirection === 'LowestPrice'){
            sortQuery = {"totalPrice": 1} 
        } else if(sortDirection === 'HighestPrice'){
            sortQuery = {"totalPrice": -1} 
        } else {
            sortQuery = {"score": -1, "createdAt": -1} //For explore posts
        }

        var searchobjfull = {} //brand, category, retailer
        var searchobjpartial = {} // retailer, category
        
        var doneBrands = false;
        var doneCategories = false;
        var doneRetailers = false;

        if(preferences?.recentbrands?.length > 0){

            var highesthits = 0;
            var index = 0;

            for(let i=0; i<preferences?.recentbrands?.length; i++){
                if(preferences.recentbrands[i].hits > highesthits && preferences.recentbrands[i].dateTime > oneWeekAgo){
                    highesthits = preferences.recentbrands[i].hits
                    index = i
                }
            }
            
            if(preferences.recentbrands[index].brandname){
                searchobjfull.brand = preferences.recentbrands[index].brandname
            }

            if(preferences.recentbrands[index].hits <= 1){

                const updatedBrands = await Preference.updateOne({_userId: userId}, {$pull: {brandname: searchobjfull.brand}})

                if(updatedBrands){
                    doneBrands = true;
                }
                
            } else {
                const updatedBrands = await Preference.updateOne({_userId: userId, "recentbrands.brandname": searchobjfull.brand},{$inc: {"recentbrands.$.hits": -1}})

                if(updatedBrands){
                    doneBrands = true;
                }
            }
        } else {
            doneBrands = true;
        }


        if(preferences?.recentcategories?.length > 0){

            if((category === "All" || category === "All Categories" || category === "N/A")){

                var highesthits = 0;
                var index = 0;

                for(let i=0; i<preferences?.recentcategories?.length; i++){
                    if(preferences.recentcategories[i].hits > highesthits && preferences.recentcategories[i].dateTime > oneWeekAgo){
                        highesthits = preferences.recentcategories[i].hits
                        index = i
                    }
                }

                if(preferences.recentcategories[index].categoryname){
                    searchobjfull.primaryCategory = preferences.recentcategories[index].categoryname
                    searchobjpartial.primaryCategory = preferences.recentcategories[index].categoryname
                }

                if(preferences.recentcategories[index].hits <= 1){

                    const updatedCategories = await Preference.updateOne({_userId: userId}, {$pull: {categoryname: searchobjfull.primaryCategory}})
    
                    if(updatedCategories){
                        doneCategories = true;
                    }
                    
                } else {

                    const updatedCategories = await Preference.updateOne({_userId: userId, "recentcategories.categoryname": searchobjfull.primaryCategory},{$inc: {"recentcategories.$.hits": -1}})
    
                    if(updatedCategories){
                        doneCategories = true;
                    }
                }
            }
        } else {
            doneCategories = true;
        }


        if(preferences?.recentretailers?.length > 0){

            if( (retailerIds.includes("All") || retailerIds.includes("All Retailers") || retailerIds.includes("N/A")) ){

                var highesthits = 0;
                var index = 0;

                for(let i=0; i<preferences?.recentretailers?.length; i++){
                    if(preferences.recentretailers[i].hits > highesthits && preferences.recentretailers[i].dateTime > oneWeekAgo){
                        highesthits = preferences.recentretailers[i].hits
                        index = i
                    }
                }
                
                if(preferences.recentretailers[index].retailername){
                    searchobjfull.retailer = preferences.recentretailers[index].retailername
                    searchobjpartial.retailer = preferences.recentretailers[index].retailername
                }

                if(preferences.recentretailers[index].hits <= 1){

                    const updatedRetailers = await Preference.updateOne({_userId: userId}, {$pull: {retailername: searchobjfull.retailer}})
    
                    if(updatedRetailers){
                        doneRetailers = true;
                    }
                    
                } else {
                    const updatedRetailers = await Preference.updateOne({_userId: userId, "recentretailers.retailername": searchobjfull.retailer},{$inc: {"recentretailers.$.hits": -1}})
    
                    if(updatedRetailers){
                        doneRetailers = true;
                    }
                }
            }
        } else {
            doneRetailers = true;
        }


        if(doneBrands && doneCategories && doneRetailers){
        
            let preFollowPeopleQuery = {
                "$and": [{"$or":[
                    {_userId: {"$in": peopleFollowing.allPeopleFollowing?.map(e=>e._followingId)}}, 
                    {"_userId": userId} ]}, {isStorePost: false}, {postClass: 1}] 
            }

            let prePublicPeopleQuery = {
                "$and": [ {_userId: {"$nin": peopleFollowing.allPeopleFollowing?.map(e=>e._followingId)}},
                {_userId: {"$nin": blockedProfiles.blockedUsers.map(e=>e._userId)}}, 
                {isStorePost: false}, {privacySetting: 1}, {postClass: 1}, 
                {"$expr": { "$lt": [0.05, {"$rand": {} } ] }}]
            }

            let preFollowStoreQuery = {
                "$and": [{"$or":[{_userId: {$in: storeFollowing.allStoreFollowing?.map(e=>e._followingId)}}, 
                    {_userId: userId} ]}, {postClass: 1}, {isStorePost: true}, {$or: genderArray}]
            }

            let prePublicStoreQuery = {
                "$and": [{_userId: {$nin: storeFollowing.allStoreFollowing?.map(e=>e._followingId)}},
                    {_userId: {"$nin": blockedProfiles.blockedUsers.map(e=>e._userId)}}, 
                    {isStorePost: true}, {privacySetting: 1}, {postClass: 1}, {$or: genderArray},
                    {"$expr": { "$lt": [0.05, {"$rand": {} } ] }}]
            }

            let fullQuery = {
                "$and": [{_userId: {$nin: storeFollowing.allStoreFollowing?.map(e=>e._followingId)}},
                    {_userId: {"$nin": blockedProfiles.blockedUsers.map(e=>e._userId)}}, 
                    {isStorePost: true}, {privacySetting: 1}, {postClass: 1}, searchobjfull, 
                    {$or: genderArray}]
            }
    
            let partialQuery = {
                "$and": [{_userId: {$nin: storeFollowing.allStoreFollowing?.map(e=>e._followingId)}},
                    {_userId: {"$nin": blockedProfiles.blockedUsers.map(e=>e._userId)}}, 
                    {isStorePost: true}, {privacySetting: 1}, {postClass: 1}, searchobjpartial,
                    {$or: genderArray}]
            }

            if(language !== 'All' && language !== 'Select All'){
                preFollowPeopleQuery['$and'].push({"$or":[{"language": language},{"language": ""}, {"language": {"$exists": false}}]});
                preFollowStoreQuery['$and'].push({"$or":[{"language": language},{"language": ""}, {"language": {"$exists": false}}]});
                prePublicPeopleQuery['$and'].push({"$or":[{"language": language},{"language": ""}, {"language": {"$exists": false}}]});
                prePublicStoreQuery['$and'].push({"$or":[{"language": language},{"language": ""}, {"language": {"$exists": false}}]});

                fullQuery['$and'].push({"$or":[{"language": language},{"language": ""}, {"language": {"$exists": false}}]});
                partialQuery['$and'].push({"$or":[{"language": language},{"language": ""}, {"language": {"$exists": false}}]});
            }

            if(city !== "Select All" && city !== "All") {
                preFollowPeopleQuery['$and'].push({"$or":[{"city": "All"},{"city": "Select All"},{"city": city}]})
                preFollowStoreQuery['$and'].push({"$or":[{"city": "All"},{"city": "Select All"},{"city": city}]})
                prePublicPeopleQuery['$and'].push({"$or":[{"city": "All"},{"city": "Select All"},{"city": city}]})
                prePublicStoreQuery['$and'].push({"$or":[{"city": "All"},{"city": "Select All"},{"city": city}]})

                fullQuery['$and'].push({"$or":[{"city": "All"},{"city": "Select All"},{"city": city}]})
                partialQuery['$and'].push({"$or":[{"city": "All"},{"city": "Select All"},{"city": city}]})
            }

            if(region !== "Select All" && region !== "All"){
                preFollowPeopleQuery['$and'].push({"$or":[{"region": "All"},{"region": "Select All"},{"region": region}]})
                preFollowStoreQuery['$and'].push({"$or":[{"region": "All"},{"region": "Select All"},{"region": region}]})
                prePublicPeopleQuery['$and'].push({"$or":[{"region": "All"},{"region": "Select All"},{"region": region}]})
                prePublicStoreQuery['$and'].push({"$or":[{"region": "All"},{"region": "Select All"},{"region": region}]})

                fullQuery['$and'].push({"$or":[{"region": "All"},{"region": "Select All"},{"region": region}]})
                partialQuery['$and'].push({"$or":[{"region": "All"},{"region": "Select All"},{"region": region}]})
            }

            if((country !== "Select All" && country !== "All")){
                preFollowPeopleQuery['$and'].push({"$or":[{"country": "All"},{"country": "Select All"},{"country": country}]})
                preFollowStoreQuery['$and'].push({"$or":[{"country": "All"},{"country": "Select All"},{"country": country}]})
                prePublicPeopleQuery['$and'].push({"$or":[{"country": "All"},{"country": "Select All"},{"country": country}]})
                prePublicStoreQuery['$and'].push({"$or":[{"country": "All"},{"country": "Select All"},{"country": country}]})

                fullQuery['$and'].push({"$or":[{"country": "All"},{"country": "Select All"},{"country": country}]})
                partialQuery['$and'].push({"$or":[{"country": "All"},{"country": "Select All"},{"country": country}]})
            }

            if((category !== "All" && category !== "All Categories" && category !== "N/A")){
                preFollowPeopleQuery['$and'].push({"$or":[{"primaryCategory": "All"},{"primaryCategory": "All Categories"},{"primaryCategory": category}]})
                preFollowStoreQuery['$and'].push({"$or":[{"primaryCategory": "All"},{"primaryCategory": "All Categories"},{"primaryCategory": category}]})
                prePublicPeopleQuery['$and'].push({"$or":[{"primaryCategory": "All"},{"primaryCategory": "All Categories"},{"primaryCategory": category}]})
                prePublicStoreQuery['$and'].push({"$or":[{"primaryCategory": "All"},{"primaryCategory": "All Categories"},{"primaryCategory": category}]})
            }

            if((!retailerIds.includes("All") && !retailerIds.includes("All Retailers") && !retailerIds.includes("N/A"))){
                preFollowPeopleQuery['$and'].push({"$or":[{"retailerId": {"$in": retailerIds.map(e=>Number(e))}}]})
                preFollowStoreQuery['$and'].push({"$or":[{"retailerId": {"$in": retailerIds.map(e=>Number(e))}}]})
                prePublicPeopleQuery['$and'].push({"$or":[{"retailerId": {"$in": retailerIds.map(e=>Number(e))}}]})
                prePublicStoreQuery['$and'].push({"$or":[{"retailerId": {"$in": retailerIds.map(e=>Number(e))}}]})
            }

            var preFollowPeoplePosts = await Post.find(preFollowPeopleQuery,{"caption_fuzzy": 0, "postViews": 0, "postViews": 0, "additionalProperty": 0}).sort(sortQuery).skip(pageNumber).limit(12)
            var prePublicPeoplePosts = await Post.find(prePublicPeopleQuery,{"caption_fuzzy": 0, "postViews": 0, "postViews": 0, "additionalProperty": 0}).sort(sortQuery).skip(pageNumber).limit(12)
            var preFollowStorePosts = await Post.find(preFollowStoreQuery,{"caption_fuzzy": 0, "postViews": 0, "postViews": 0, "additionalProperty": 0}).sort(sortQuery).skip(pageNumber).limit(12)
            var prePublicStorePosts = await Post.find(prePublicStoreQuery,{"caption_fuzzy": 0, "postViews": 0, "postViews": 0, "additionalProperty": 0}).sort(sortQuery).skip(skipPageNumber).limit(12)

            var fullRefreshPosts = await Post.find(fullQuery,{"caption_fuzzy": 0, "postViews": 0, "postViews": 0, "additionalProperty": 0}).sort(sortQuery).skip(pageNumber).limit(3)
            var partialRefreshPosts = await Post.find(partialQuery,{"caption_fuzzy": 0, "postViews": 0, "postViews": 0, "additionalProperty": 0}).sort(sortQuery).skip(pageNumber).limit(3)
        
            if(preFollowPeoplePosts && prePublicPeoplePosts && preFollowStorePosts && prePublicStorePosts 
                && updatedUserPrefs && fullRefreshPosts && partialRefreshPosts){

                donePreStore = true
            }

            if(productFollowing?.allProductFollowing?.length > 0){

                let productPostsQuery = {
                    "$and": [{_productId: {"$in": productFollowing.allProductFollowing?.map(e=>e._followingId)}},
                        {createdAt: {"$gte": threeMonthsAgo}}, {postClass: 1}]
                }

                productPosts = await Post.find(productPostsQuery,{"caption_fuzzy": 0, "postViews": 0, "postViews": 0, "additionalProperty": 0}).sort({score: -1, createdAt: -1}).skip(pageNumber).limit(12)

                if(productPosts){
                    donePreProducts = true
                }

            } else {
                donePreProducts = true
            }

            if(donePreStore && donePreProducts){

                var storePostsPre = []

                if ((fullRefreshPosts?.length + partialRefreshPosts?.length) >= 0){

                    var combinedposts = [...fullRefreshPosts, ...partialRefreshPosts, ...prePublicStorePosts.slice(0, 12 - (fullRefreshPosts.length + partialRefreshPosts?.length))]
                    
                    storePostsPre = [...preFollowPeoplePosts, ...prePublicPeoplePosts,
                        ...preFollowStorePosts, ...combinedposts, ...productPosts]

                } else {

                    storePostsPre = [...preFollowPeoplePosts, ...prePublicPeoplePosts,
                        ...preFollowStorePosts, ...prePublicStorePosts, ...productPosts];
                }

                if(storePostsPre?.length < 12){

                    let morePostsQuery = {
                        "$and": [ {_userId: {"$nin": storeFollowing.allStoreFollowing?.map(e=>e._followingId)}},
                            {_userId: {"$nin": blockedProfiles.blockedUsers.map(e=>e._userId)}}, 
                            {isStorePost: true}, {privacySetting: 1}, {postClass: 1}]
                    }

                    if(language !== 'All' && language !== 'Select All'){
                        morePostsQuery['$and'].push({$or:[{"language": language},{"language": ""}, {"language": {"$exists": false}}]});
                    }
            
                    if(city !== "Select All" && city !== "All") {
                        morePostsQuery['$and'].push({$or:[{"region": "All"},{"region": "Select All"},{"region": region}]})
                    }
            
                    if(region !== "Select All" && region !== "All"){
                        morePostsQuery['$and'].push({$or:[{"country": "All"},{"country": "Select All"},{"country": country}]})
                    }
            
                    if((category !== "All" && category !== "All Categories" && category !== "N/A")){
                        morePostsQuery['$and'].push({$or:[{"primaryCategory": "All"},{"primaryCategory": "All Categories"},{"primaryCategory": "N/A"},{"primaryCategory": category}]})
                    }

                    if((!retailerIds.includes("All") && !retailerIds.includes("All Retailers") && !retailerIds.includes("N/A"))){
                        morePostsQuery['$and'].push({$or:[{"retailerId": {"$in": retailerIds.map(e=>Number(e))}} ]})
                    }

                    let morePublicPosts = await Post.find(morePostsQuery,{"caption_fuzzy": 0, "postViews": 0, "postViews": 0, "additionalProperty": 0})
                        .sort(sortQuery).skip(pageNumber).limit(12)

                    if(morePublicPosts){

                        storePostsPre = [...storePostsPre, ...morePublicPosts]

                        const ids = storePostsPre.map(({ _id }) => _id);
                        storePosts = storePostsPre.filter(({ _id }, index) => !ids.includes(_id, index + 1));

                        doneMorePublicPosts = true;
                    
                    } else {
                        doneMorePublicPosts = true;
                    }
                    
                } else {

                    const ids = storePostsPre.map(({ _id }) => _id);
                    storePosts = storePostsPre.filter(({ _id }, index) => !ids.includes(_id, index + 1));

                    doneMorePublicPosts = true;
                }
            
                if(doneMorePublicPosts && storePosts?.length > 0){

                    storePosts.forEach(function(item, index){

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

                    doneStorePosts = true;
                }

                if(storePosts?.length > 0 && doneStorePosts){

                    const foundProducts = await Product.find({_id: {"$in": storePosts.map(e=>e._productId)}},{brand_fuzzy: 0, productname_fuzzy:0})

                    const storeData = await User.find({_id: {"$in": storePosts.map(e=>e._userId)}}).select("_id profilePicURL deactivated")
                    
                    const displayData = await StoreProfile.find({_userId: {"$in": storePosts.map(e=>e._userId)}}).select("_userId displayname address city region")
                    
                    if(storeData && displayData && ownedProductsFound && bookmarksFound && doneSharedposts
                        && doneStorePosts && foundProducts && flaggedPosts){

                        return res.json({storePosts, storeData, displayData, ownedProductsFound, 
                            foundProducts, bookmarksFound, sharedpostsFound, flaggedPosts, stop})
                    
                    } else {

                        return res.status(400).json({ message: 'Operation failed!' })
                    }

                } else {

                    stop = 1
                    return res.status(201).json({stop})
                }

            } else {

                stop = 1;

                if(ownedProductsFound && bookmarksFound && flaggedPosts && doneSharedposts){

                    return res.status(201).json({ ownedProductsFound, bookmarksFound, sharedpostsFound, 
                        flaggedPosts, stop})
                
                } else {

                    return res.status(400).json({ message: 'Operation failed!' })
                }
            }
        }

    } else {

        stop = 1

        return res.status(201).json({stop})
    }
}


const getStoreTimelineRefresh = async (req, res) => {
    
    var { userId, city, region, country, category, proximity, sortDirection, 
            language, retailerIds, currency, gender } = req.query

    if (!userId || !city || !region || !country || !category || !sortDirection || !language) {
        return res.status(400).json({ message: 'Missing required information' })
    }

    const blockedProfiles = await User.findOne({_id: userId}).select("blockedUsers")
    // const influencers = await User.find({influencerRating: {$gte: 0}, deactivated: false, active: true}).sort({lastPosting: -1, influencerRating: -1}).limit(20)
    const storeFollowing = await Storefollowing.findOne({ _userId: userId })
    const peopleFollowing = await Peoplefollowing.findOne({ _userId: userId })
    const ownedProductsFound = []
    const bookmarksFound = []
    const flaggedPosts = []
    const productFollowing = await Productfollowing.findOne({ _userId: userId })
    const preferences = await Preference.findOne({_userId: userId})
    
    var sharedpostsFound = []
    
    let doneStorePosts = false;
    var doneSharedposts = true;
    var stop = 0;
    retailerIds = JSON.parse(retailerIds)

    if(peopleFollowing && productFollowing && storeFollowing && blockedProfiles && preferences){

        const today = new Date();
        const oneWeekAgo = new Date(today.getFullYear(), today.getMonth(), today.getDate()-7);

        let donePreStore = false;
        let updatedUserPrefs = false;

        let prePublicStorePosts = [];
        let storePosts = [];

        var genderArray = []

        if(gender){

            if(gender === 'female' || gender === 'Female'){
                genderArray.push({"gender": "female"})
                genderArray.push({"gender": "Female"})
            } else if(gender === 'male' || gender === 'Male') {
                genderArray.push({"gender": "male"})
                genderArray.push({"gender": "Male"})
            } else {
                genderArray.push({"gender": "female"})
                genderArray.push({"gender": "male"})
                genderArray.push({"gender": "Female"})
                genderArray.push({"gender": "Male"})
                genderArray.push({"gender": "unisex"})
                genderArray.push({"gender": "Unisex"})
            }

        } else if(preferences?.gender){
            
            var usergender = preferences?.gender
            
            if(usergender === 'female' || usergender === 'Female'){
                genderArray.push({"gender": "female"})
                genderArray.push({"gender": "Female"})
            } else if(usergender === 'male' || usergender === 'Male') {
                genderArray.push({"gender": "male"})
                genderArray.push({"gender": "Male"})
            } else {
                genderArray.push({"gender": "female"})
                genderArray.push({"gender": "male"})
                genderArray.push({"gender": "Female"})
                genderArray.push({"gender": "Male"})
                genderArray.push({"gender": "unisex"})
                genderArray.push({"gender": "Unisex"})
            }

        } else {
            
            genderArray.push({"gender": "female"})
            genderArray.push({"gender": "male"})
            genderArray.push({"gender": "Female"})
            genderArray.push({"gender": "Male"})
            genderArray.push({"gender": "unisex"})
            genderArray.push({"gender": "Unisex"})
        }

        updatedUserPrefs = await User.updateOne({_id:userId, $or: [ 
            { preferredCity: { $ne: city }},
            { preferredRegion: { $ne: region }},
            { preferredCountry: { $ne: country }},
            { preferredCategory: { $ne: category }},
            { language: { $ne: language }},
            { initialRetailers: { $ne: retailerIds }},
            ]},
            {$set:{preferredCity: city, preferredRegion: region,
            preferredCountry: country, preferredCategory: category,
            language: language, initialRetailers: retailerIds}})

        let sortQuery = {};
        if (sortDirection === 'MostRecent'){
            sortQuery = {"createdAt": -1, "score": -1}
        } else if(sortDirection === 'Distance'){
            sortQuery = {"score": -1, "createdAt": -1} //Replace in future with distance
        } else if(sortDirection === 'Trending'){
            sortQuery = {"totalPostViews": -1, "score": -1} 
        } else if(sortDirection === 'LowestPrice'){
            sortQuery = {"totalPrice": 1} 
        } else if(sortDirection === 'HighestPrice'){
            sortQuery = {"totalPrice": -1} 
        } else {
            sortQuery = {"score": -1, "createdAt": -1} //For explore posts
        }

        var searchobjfull = {} //brand, category, retailer
        var searchobjpartial = {} // retailer, category
        var searchobjshallow = {} // category
        
        var doneBrands = false;
        var doneCategories = false;
        var doneRetailers = false;

        if(preferences?.recentbrands?.length > 0){

            var highesthits = 0;
            var index = 0;

            for(let i=0; i<preferences?.recentbrands?.length; i++){
                if(preferences.recentbrands[i].hits > highesthits && preferences.recentbrands[i].dateTime > oneWeekAgo){
                    highesthits = preferences.recentbrands[i].hits
                    index = i
                }
            }
            
            if(preferences.recentbrands[index].brandname){
                searchobjfull.brand = preferences.recentbrands[index].brandname
            }

            if(preferences.recentbrands[index].hits <= 1){

                const updatedBrands = await Preference.updateOne({_userId: userId}, {$pull: {brandname: searchobjfull.brand}})

                if(updatedBrands){
                    doneBrands = true;
                }
                
            } else {
                const updatedBrands = await Preference.updateOne({_userId: userId, "recentbrands.brandname": searchobjfull.brand},{$inc: {"recentbrands.$.hits": -1}})

                if(updatedBrands){
                    doneBrands = true;
                }
            }
        } else {
            doneBrands = true;
        }


        if(preferences?.recentcategories?.length > 0){

            if((category === "All" || category === "All Categories" || category === "N/A")){

                var highesthits = 0;
                var index = 0;

                for(let i=0; i<preferences?.recentcategories?.length; i++){
                    if(preferences.recentcategories[i].hits > highesthits && preferences.recentcategories[i].dateTime > oneWeekAgo){
                        highesthits = preferences.recentcategories[i].hits
                        index = i
                    }
                }

                if(preferences.recentcategories[index].categoryname){
                    searchobjfull.primaryCategory = preferences.recentcategories[index].categoryname
                    searchobjpartial.primaryCategory = preferences.recentcategories[index].categoryname
                }

                if(preferences.recentcategories[index].hits <= 1){

                    const updatedCategories = await Preference.updateOne({_userId: userId}, {$pull: {categoryname: searchobjfull.primaryCategory}})
    
                    if(updatedCategories){
                        doneCategories = true;
                    }
                    
                } else {

                    const updatedCategories = await Preference.updateOne({_userId: userId, "recentcategories.categoryname": searchobjfull.primaryCategory},{$inc: {"recentcategories.$.hits": -1}})
    
                    if(updatedCategories){
                        doneCategories = true;
                    }
                }
            }
        } else {
            doneCategories = true;
        }


        if(preferences?.recentretailers?.length > 0){

            if( (retailerIds.includes("All") || retailerIds.includes("All Retailers") || retailerIds.includes("N/A")) ){

                var highesthits = 0;
                var index = 0;

                for(let i=0; i<preferences?.recentretailers?.length; i++){
                    if(preferences.recentretailers[i].hits > highesthits && preferences.recentretailers[i].dateTime > oneWeekAgo){
                        highesthits = preferences.recentretailers[i].hits
                        index = i
                    }
                }
                
                if(preferences.recentretailers[index].retailername){
                    searchobjfull.retailer = preferences.recentretailers[index].retailername
                    searchobjpartial.retailer = preferences.recentretailers[index].retailername
                }

                if(preferences.recentretailers[index].hits <= 1){

                    const updatedRetailers = await Preference.updateOne({_userId: userId}, {$pull: {retailername: searchobjfull.retailer}})
    
                    if(updatedRetailers){
                        doneRetailers = true;
                    }
                    
                } else {
                    const updatedRetailers = await Preference.updateOne({_userId: userId, "recentretailers.retailername": searchobjfull.retailer},{$inc: {"recentretailers.$.hits": -1}})
    
                    if(updatedRetailers){
                        doneRetailers = true;
                    }
                }
            }
        } else {
            doneRetailers = true;
        }
        

        if(doneBrands && doneCategories && doneRetailers){

            let fullQuery = {
                "$and": [{_userId: {$nin: storeFollowing.allStoreFollowing?.map(e=>e._followingId)}},
                    {_userId: {"$nin": blockedProfiles.blockedUsers.map(e=>e._userId)}}, 
                    {isStorePost: true}, {privacySetting: 1}, {postClass: 1}, searchobjfull, 
                    {$or: genderArray}]
            }
    
            let partialQuery = {
                "$and": [{_userId: {$nin: storeFollowing.allStoreFollowing?.map(e=>e._followingId)}},
                    {_userId: {"$nin": blockedProfiles.blockedUsers.map(e=>e._userId)}}, 
                    {isStorePost: true}, {privacySetting: 1}, {postClass: 1}, searchobjpartial,
                    {$or: genderArray}]
            }
    
            let shallowQuery = {
                "$and": [{_userId: {$nin: storeFollowing.allStoreFollowing?.map(e=>e._followingId)}},
                    {_userId: {"$nin": blockedProfiles.blockedUsers.map(e=>e._userId)}}, 
                    {isStorePost: true}, {privacySetting: 1}, {postClass: 1}, searchobjshallow,
                    {$or: genderArray}]
            }
    
            if(language !== 'All' && language !== 'Select All'){
                fullQuery['$and'].push({"$or":[{"language": language},{"language": ""}, {"language": {"$exists": false}}]});
                partialQuery['$and'].push({"$or":[{"language": language},{"language": ""}, {"language": {"$exists": false}}]});
                shallowQuery['$and'].push({"$or":[{"language": language},{"language": ""}, {"language": {"$exists": false}}]});
            }
    
            if(city !== "Select All" && city !== "All") {
                fullQuery['$and'].push({"$or":[{"city": "All"},{"city": "Select All"},{"city": city}]})
                partialQuery['$and'].push({"$or":[{"city": "All"},{"city": "Select All"},{"city": city}]})
                shallowQuery['$and'].push({"$or":[{"city": "All"},{"city": "Select All"},{"city": city}]})
            }
    
            if(region !== "Select All" && region !== "All"){
                fullQuery['$and'].push({"$or":[{"region": "All"},{"region": "Select All"},{"region": region}]})
                partialQuery['$and'].push({"$or":[{"region": "All"},{"region": "Select All"},{"region": region}]})
                shallowQuery['$and'].push({"$or":[{"region": "All"},{"region": "Select All"},{"region": region}]})
            }
    
            if((country !== "Select All" && country !== "All")){
                fullQuery['$and'].push({"$or":[{"country": "All"},{"country": "Select All"},{"country": country}]})
                partialQuery['$and'].push({"$or":[{"country": "All"},{"country": "Select All"},{"country": country}]})
                shallowQuery['$and'].push({"$or":[{"country": "All"},{"country": "Select All"},{"country": country}]})
            }
    
            var fullRefreshPosts = await Post.find(fullQuery,{"caption_fuzzy": 0, "postViews": 0, "postViews": 0, "additionalProperty": 0}).sort(sortQuery).limit(12)
            var partialRefreshPosts = await Post.find(partialQuery,{"caption_fuzzy": 0, "postViews": 0, "postViews": 0, "additionalProperty": 0}).sort(sortQuery).limit(12)
            var shallowRefreshPosts = await Post.find(shallowQuery,{"caption_fuzzy": 0, "postViews": 0, "postViews": 0, "additionalProperty": 0}).sort(sortQuery).limit(12)
        
            if(fullRefreshPosts && partialRefreshPosts && shallowRefreshPosts && updatedUserPrefs){
                donePreStore = true
            }
    
            if (donePreStore){
    
                var storePostsPre = []
    
                if(fullRefreshPosts?.length >= 12){
    
                    shuffleArray(fullRefreshPosts)
                    storePostsPre = fullRefreshPosts.slice(0, 12)
    
                } else if( (fullRefreshPosts?.length + partialRefreshPosts?.length) >= 12){
    
                    var combinedposts = [...fullRefreshPosts, ...partialRefreshPosts.slice(0,12-fullRefreshPosts?.length)]
                    shuffleArray(combinedposts)
                    storePostsPre = combinedposts.slice(0, 12)
    
                } else if ( (fullRefreshPosts?.length + partialRefreshPosts?.length + shallowRefreshPosts?.length) >= 12 ){
    
                    var combinedposts = [...fullRefreshPosts, ...partialRefreshPosts, ...shallowRefreshPosts.slice(0,12 - fullRefreshPosts?.length - partialRefreshPosts?.length)]
                    shuffleArray(combinedposts)
                    storePostsPre = combinedposts.slice(0, 12)
                }
    
                const ids = storePostsPre.map(({ _id }) => _id);
                storePosts = storePostsPre.filter(({ _id }, index) => !ids.includes(_id, index + 1));
            
                if(storePosts?.length > 0){
    
                    storePosts.forEach(function(item, index){
    
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
    
                    doneStorePosts = true;
                }
    
                if(storePosts?.length > 0 && doneStorePosts){
    
                    const foundProducts = await Product.find({_id: {"$in": storePosts.map(e=>e._productId)}},{brand_fuzzy: 0, productname_fuzzy:0})
    
                    const storeData = await User.find({_id: {"$in": storePosts.map(e=>e._userId)}}).select("_id profilePicURL deactivated")
                    
                    const displayData = await StoreProfile.find({_userId: {"$in": storePosts.map(e=>e._userId)}}).select("_userId displayname address city region")
                    
                    if(storeData && displayData && ownedProductsFound && bookmarksFound && doneSharedposts
                        && doneStorePosts && foundProducts && flaggedPosts){
    
                        return res.json({storePosts, storeData, displayData, ownedProductsFound, 
                            foundProducts, bookmarksFound, sharedpostsFound, flaggedPosts, stop})
                    
                    } else {
    
                        return res.status(400).json({ message: 'Operation failed!' })
                    }
    
                } else {
    
                    stop = 1
                    return res.status(201).json({stop})
                }
    
            } else {
    
                stop = 1;
    
                if(ownedProductsFound && bookmarksFound && flaggedPosts && doneSharedposts){
    
                    return res.status(201).json({ ownedProductsFound, bookmarksFound, sharedpostsFound, 
                        flaggedPosts, stop})
                
                } else {
    
                    return res.status(400).json({ message: 'Operation failed!' })
                }
            }
        }

    } else {

        stop = 1

        return res.status(201).json({stop})
    }
}

module.exports = { getStoreTimeline, getStoreTimelineRefresh, getStoreTimelineUpdate }