const User = require('../../model/User');
const Peoplefollowing = require('../../model/Peoplefollowing');
const Storefollowing = require('../../model/Storefollowing');
const Productfollowing = require('../../model/Productfollowing');
const Post = require('../../model/Post');
const UserProfile = require('../../model/UserProfile');
const Bookmark = require('../../model/Bookmark');
const Sharedpost = require('../../model/Sharedpost');
const OwnedProducts = require('../../model/OwnedProducts');
const Product = require('../../model/Product');
const Flags = require('../../model/Flags');

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


const getUserTimeline = async (req, res) => {
    
    var { userId, pageNumber, city, region, country, category, proximity, sortDirection, language, currency } = req.query

    if (!userId || !pageNumber || !city || !region || !country || !category || !sortDirection || !language) {
        return res.status(400).json({ message: 'Missing required information' })
    }

    if(Number(pageNumber) === NaN || Number(pageNumber) < 0 || Number(pageNumber) > 400){
        return res.status(400).json({ message: 'Content does not meet requirements' })
    }
    pageNumber = Number(pageNumber)

    const blockedProfiles = await User.findOne({_id: userId}).select("blockedUsers")
    // const influencers = await User.find({influencerRating: {$gte: 0}, deactivated: false, active: true}).sort({lastPosting: -1, influencerRating: -1}).limit(20)
    const peopleFollowing = await Peoplefollowing.findOne({ _userId: userId })
    const storeFollowing = await Storefollowing.findOne({ _userId: userId })
    const ownedProductsFound = await OwnedProducts.findOne({_userId: userId})
    const bookmarksFound = await Bookmark.findOne({_userId: userId})
    const flaggedPosts = await Flags.findOne({_userId: userId}).select("postFlags")
    const productFollowing = await Productfollowing.findOne({ _userId: userId })

    var sharedpostsFound = await Sharedpost.findOne({_userId: userId})
    
    var doneUserPosts = false;
    var doneSharedposts = false;
    var stop = 0;

    if(storeFollowing && peopleFollowing && productFollowing && blockedProfiles){

        try {

            const today = new Date()
            const twoMonthsAgo = new Date(today.getFullYear(), today.getMonth(), today.getDate()-60);

            let preUserPosts = [];
            let prePublicPosts = [];
            let productPosts = [];
            let userPosts = [];

            let donePreUserPosts = false;
            let donePreProductPosts = false;
            let doneMorePublicPosts = false;
            let updatedUserPrefs = false;

            updatedUserPrefs = await User.updateOne({_id:userId, $or: [ 
                { preferredCity: { $ne: city }},
                { preferredRegion: { $ne: region }},
                { preferredCountry: { $ne: country }},
                { preferredCategory: { $ne: category }},
                { language: { $ne: language }}]},
                {$set:{preferredCity: city, preferredRegion: region,
                preferredCountry: country, preferredCategory: category,
                language: language}})

            let sortQuery = {};
            if (sortDirection === 'MostRecent'){
                sortQuery = {"createdAt": -1}
            } else if(sortDirection === 'Distance'){
                sortQuery = {"score": -1, "createdAt": -1} //Replace in future with distance
            } else if(sortDirection === 'Trending'){
                sortQuery = {"totalPostViews": -1, "score": -1} 
            } else {
                sortQuery = {"score": -1, "createdAt": -1} //For explore posts
            }

            let preUserPostsQuery = {
                "$and": [{"$or": [
                    {_userId: {"$in": peopleFollowing.allPeopleFollowing?.map(e=>e._followingId)}},
                    {_userId: {"$in": storeFollowing.allStoreFollowing?.map(e=>e._followingId)}}, {_userId: userId} ]},
                    {createdAt: {"$gte": twoMonthsAgo}}, {postClass: {"$ne": 1}}]
            }

            let prePublicPostsQuery = {
                "$and": [{_userId: {$nin: peopleFollowing.allPeopleFollowing?.map(e=>e._followingId)}},
                    {_userId: {$nin: storeFollowing.allStoreFollowing?.map(e=>e._followingId)}},
                    {_userId:{$nin: blockedProfiles.blockedUsers.map(e=>e._userId)}}, 
                    {privacySetting: 1}, {createdAt: {"$gte": twoMonthsAgo}}, 
                    {postClass: {"$ne": 1}},{"$expr": { "$lt": [0.35, {"$rand": {} } ] }}]
            }

            if(language !== 'All' && language !== 'Select All'){
                preUserPostsQuery['$and'].push({$or:[{"language": language},{"language": ""}, {"language": {"$exists": false}}]});
                prePublicPostsQuery['$and'].push({$or:[{"language": language},{"language": ""}, {"language": {"$exists": false}}]});
            }
    
            if(city !== "Select All" && city !== "All" && city !== 'All Cities') {
                preUserPostsQuery['$and'].push({$or:[{"city": "All"},{"city": "Select All"},{"city": city}]});
                prePublicPostsQuery['$and'].push({$or:[{"city": "All"},{"city": "Select All"},{"city": city}]});
            } 
    
            if(region !== "Select All" && region !== "All" && region !== 'All Regions'){
                preUserPostsQuery['$and'].push({$or:[{"region": "All"},{"region": "Select All"},{"region": region}]})
                prePublicPostsQuery['$and'].push({$or:[{"region": "All"},{"region": "Select All"},{"region": region}]})
            }
    
            if((country !== "Select All" && country !== "All")){
                preUserPostsQuery['$and'].push({$or:[{"country": "All"},{"country": "Select All"},{"country": country}]})
                prePublicPostsQuery['$and'].push({$or:[{"country": "All"},{"country": "Select All"},{"country": country}]})
            }
    
            if((category !== "All" && category !== "All Categories" && category !== "N/A")){
                preUserPostsQuery['$and'].push({$or:[{"primaryCategory": "All"},{"primaryCategory": "All Categories"},{"primaryCategory": "N/A"},{"primaryCategory": category}]})
                prePublicPostsQuery['$and'].push({$or:[{"primaryCategory": "All"},{"primaryCategory": "All Categories"},{"primaryCategory": "N/A"},{"primaryCategory": category}]})
            }

            preUserPosts = await Post.find(preUserPostsQuery,{"caption_fuzzy": 0, "postViews": 0, "postViews": 0, "additionalProperty": 0})
                .sort(sortQuery).skip(pageNumber).limit(12)

            prePublicPosts = await Post.find(prePublicPostsQuery,{"caption_fuzzy": 0, "postViews": 0, "postViews": 0, "additionalProperty": 0})
                .sort(sortQuery).skip(pageNumber).limit(12)
        
            if(preUserPosts && prePublicPosts){
                donePreUserPosts = true;
            
            } else if(preUserPosts && !prePublicPosts) {

                prePublicPosts=[]
                donePreUserPosts = true;
            
            } else if (prePublicPosts && !preUserPosts){

                preUserPosts=[]
                donePreUserPosts = true;
            
            } else if (!prePublicPosts && !preUserPosts) {

                prePublicPosts=[]
                preUserPosts=[]
                donePreUserPosts = true;
            }

            if(productFollowing?.allProductFollowing?.length > 0){

                let productPostsQuery = {
                    "$and": [{_productId: {"$in": productFollowing.allProductFollowing?.map(e=>e._followingId)}},
                        {createdAt: {"$gte": twoMonthsAgo}}, {postClass: {"$ne": 1}} ]
                }

                productPosts = await Post.find(productPostsQuery, {"caption_fuzzy": 0, "postViews": 0, "postViews": 0, "additionalProperty": 0})
                    .sort(sortQuery).skip(pageNumber).limit(12)
                
                if(productPosts){
                    donePreProductPosts = true
                } else {
                    productPosts = []
                    donePreProductPosts = true
                }

            } else {
                donePreProductPosts = true
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

            if(donePreUserPosts && donePreProductPosts){

                const userPostsPre = [...preUserPosts, ...prePublicPosts, ...productPosts];

                const ids = userPostsPre.map(({ _id }) => _id);
                userPosts = userPostsPre.filter(({ _id }, index) => !ids.includes(_id, index + 1));

                //if userposts is under 6, go up one level to region or country
                if (userPosts?.length < 6){

                    let morePostsQuery = {"$and": [
                        {_userId: {"$nin": peopleFollowing.allPeopleFollowing?.map(e=>e._followingId)}},
                        {_userId: {"$nin": storeFollowing.allStoreFollowing?.map(e=>e._followingId)}},
                        {_userId:{"$nin": blockedProfiles.blockedUsers.map(e=>e._userId)}}, 
                        {privacySetting: 1}, {createdAt: {"$gte": twoMonthsAgo}}, 
                        {postClass: {"$ne": 1}}]
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

                    let morePublicPosts = await Post.find(morePostsQuery, {"caption_fuzzy": 0, "postViews": 0, "postViews": 0, "additionalProperty": 0})
                        .sort(sortQuery).skip(pageNumber).limit(12)

                    if(morePublicPosts){

                        userPosts = [...userPosts, ...morePublicPosts]

                        doneMorePublicPosts = true;
                    }
                    
                } else {

                    doneMorePublicPosts = true;
                }

                if (doneMorePublicPosts && userPosts?.length > 0){

                    userPosts?.forEach(function(item, index){

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
        
                    doneUserPosts = true;  
                }

                if(doneUserPosts && userPosts?.length > 0){

                    const foundProducts = await Product.find({_id: {"$in": userPosts?.map(e=>e._productId)}},{brand_fuzzy: 0, productname_fuzzy:0})

                    const userData = await User.find({_id: {"$in": userPosts?.map(e=>e._userId)}}).select("_id blockedUsers roles profilePicURL")

                    if(userData && ownedProductsFound && bookmarksFound && doneSharedposts
                        && doneUserPosts && foundProducts && flaggedPosts && updatedUserPrefs){
            
                        return res.status(200).json({userPosts, userData, ownedProductsFound, 
                            foundProducts, bookmarksFound, sharedpostsFound, flaggedPosts, stop})
                    
                    } else {

                        stop = 1
                        return res.status(201).json({stop})
                    } 
                    
                } else {
                    
                    stop = 1
                    return res.status(201).json({stop})
                }
            
            } else {

                stop = 1;

                if(ownedProductsFound && bookmarksFound && flaggedPosts && doneSharedposts && updatedUserPrefs){
        
                    res.status(201).json({ownedProductsFound, bookmarksFound, sharedpostsFound, 
                        flaggedPosts, stop})
                
                } else {

                    res.status(401).json({ message: 'Operation failed!' })
                }  
            }

        } catch(err){

            console.log(err)
        }

    } else {

        stop = 1
        return res.status(201).json({stop})
    }
}

module.exports = { getUserTimeline }