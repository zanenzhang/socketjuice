const User = require('../../model/User')
const HostProfile = require('../../model/HostProfile');
const Bookmark = require('../../model/Bookmark');
const Flags = require('../../model/Flags')

const languageList = require('../languageCheck');
const ObjectId  = require('mongodb').ObjectId;
const jwt = require('jsonwebtoken');
const S3 = require("aws-sdk/clients/s3");
const fns = require('date-fns')
const { deleteFile } = require("../media/s3Controller");

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
  
const getHostProfile = async (req, res) => {
    
    const { profileUserId, loggedUserId, driverOrHost, ipAddress, language, currency } = req.query

    if (!profileUserId || !loggedUserId || !driverOrHost) {
        return res.status(400).json({ message: 'Missing required info' })
    }

    try {

        if(driverOrHost == 1){

            var postsSort = {"productname": 1}

            const storePosts = await Post.find({ _userId: profileUserId, "postClass": 1, "promotion": 0 },{"caption_fuzzy": 0, "postViews": 0, "postViews": 0, "additionalProperty": 0}).sort({productname: 1}).limit(8)
            const HostProfile = await HostProfile.findOne({_userId: profileUserId})
            const userFound = await User.findOne({_id: profileUserId})
            const loggedFound = await User.findOne({_id: loggedUserId})
            const flaggedList = await Flags.findOne({_userId: loggedUserId}).select("userFlags postFlags")
            const ownedProductsFound = await OwnedProducts.findOne({_userId: loggedUserId})
            const bookmarksFound = await Bookmark.findOne({_userId: loggedUserId})
            const peopleFollowers = await Peoplefollowers.findOne({ _userId: profileUserId }).select("allPeopleFollowers peopleFollowersCount receivedFollowRequests")
            const peopleFollowing = await Peoplefollowing.findOne({ _userId: profileUserId }).select("allPeopleFollowing peopleFollowingCount submittedFollowRequests")
            const storeFollowers = await Storefollowers.findOne({ _userId: profileUserId }).select("allStoreFollowers storeFollowersCount receivedFollowRequests")
            const storeFollowing = await Storefollowing.findOne({ _userId: profileUserId }).select("allStoreFollowing storeFollowingCount submittedFollowRequests")

            var sharedpostsFound = await Sharedpost.findOne({_userId: loggedUserId})

            let isFollowing = null;
            let isRequested = null;
            let notFollowing = null;
            let foundProducts = null;
            let followingLogged = null;
            let flaggedPosts = null;

            let donePostsData = false;
            let donePeopleFollowers = false;
            let doneStoreFollowers = false;
            let donePeopleFollowing = false;
            let doneStoreFollowing = false;
            let doneLoggedBlocked = false;
            let doneProfileBlocked = false;
            let doneFlags = false;

            let privacySetting = null;
            let loggedBlocked = null;
            let profileBlocked = null;
            let profilePicURL = null;
            let flaggedProfile = null;
            
            let peopleFollowersCount = null;
            let peopleFollowingCount = null;
            let storeFollowersCount = null;
            let storeFollowingCount = null;
            let totalGems = null;

            var doneSharedposts = false;

            if(flaggedList){

                if(flaggedList.userFlags?.some(e=>e._userId.toString() === ((profileUserId)))){
                    flaggedProfile = 1
                } else {
                    flaggedProfile = 0
                }

                if(flaggedList.postFlags){
                    flaggedPosts = flaggedList.postFlags
                } else {
                    flaggedPosts = []
                }

                doneFlags = true;
            
            } else {

                let newFlags = new Flag({"_userId": loggedUserId});

                flaggedProfile = 0;
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

            if(peopleFollowers) {

                peopleFollowersCount = peopleFollowers.peopleFollowersCount
                
                if(peopleFollowersCount > 0){
                    if(peopleFollowers.allPeopleFollowers.some(e => e._followerId.toString() === ((loggedUserId)))){
                        isFollowing = 1;
                    } else {
                        isFollowing = 0;    
                    }    
                } else {
                    isFollowing = 0;
                }

                if(!isFollowing && peopleFollowers.receivedFollowRequests){
                    if(peopleFollowers.receivedFollowRequests.some(e => (e._fromRequestedUser.toString() === ((loggedUserId)) && e.isActiveRequest === true))){
                        isRequested = 1;    
                    } else {
                        isRequested = 0;
                    }
                } else {
                    isRequested = 0;
                }

                if(!isFollowing && !isRequested){
                    notFollowing = 1;
                } else {
                    notFollowing = 0;
                }
                donePeopleFollowers = true;
            }

            if(storeFollowers) {
                storeFollowersCount = storeFollowers.storeFollowersCount
                doneStoreFollowers = true;            
            }

            if(userFound){

                if(userFound.deactivated === true){
                    return res.status(403).json({"message":"Operation failed"})
                }

                privacySetting = userFound.privacySetting;
                profilePicURL = userFound.profilePicURL;
                totalGems = userFound.totalGems;

                if(userFound?.blockedUsers){

                    if(userFound.blockedUsers.some(e=>e._userId.toString() === ((loggedUserId)))){
                        loggedBlocked = 1;        
                    } else {
                        loggedBlocked = 0;
                    }

                } else {
                    loggedBlocked = 0;
                }

                doneLoggedBlocked = true;
            } 

            if(loggedFound){

                if(loggedFound?.blockedUsers){

                    if(loggedFound.blockedUsers.some(e=>e._userId.toString() === ((profileUserId)))){
                        profileBlocked = 1;        
                    } else {
                        profileBlocked = 0;
                    }

                } else {
                    profileBlocked = 0;
                }

                doneProfileBlocked = true;
            } 

            if(peopleFollowing){
                peopleFollowingCount = peopleFollowing.peopleFollowingCount
                if(peopleFollowing.allPeopleFollowing?.some(e=>e._followingId.toString() === ((loggedUserId)))){
                    followingLogged = 1
                } else {
                    followingLogged = 0
                }
                donePeopleFollowing = true;
            }

            if(storeFollowing){
                storeFollowingCount = storeFollowing.storeFollowingCount
                doneStoreFollowing = true;
            }

            if(storePosts?.length > 0){

                foundProducts = await Product.find({_id: {$in: storePosts.map(e=>e._productId)}},{brand_fuzzy: 0, productname_fuzzy:0})

                storePosts?.forEach(function(item, index){

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

                    if(foundProducts){
                        donePostsData = true;
                    }
                })
            }  else {
                donePostsData = true;
            }

            if(donePostsData && HostProfile && profilePicURL && ownedProductsFound && bookmarksFound
                && donePeopleFollowers && doneStoreFollowers && donePeopleFollowing && doneSharedposts
                && doneStoreFollowing && doneLoggedBlocked && doneProfileBlocked && doneFlags ){
                
                    return res.status(200).json({storePosts, HostProfile, isFollowing, isRequested, notFollowing, 
                        privacySetting, totalGems, loggedBlocked, profileBlocked, profilePicURL, peopleFollowingCount, 
                        peopleFollowersCount, storeFollowersCount, storeFollowingCount, ownedProductsFound, bookmarksFound, 
                        sharedpostsFound, foundProducts, followingLogged, flaggedProfile, flaggedPosts })
            
            } else {

                return res.status(401).json({ message: 'Cannot get store information' })
            }
        
        } else {

            const storePosts = await Post.find({ _userId: profileUserId, "postClass": 1, "promotion": 0 },{"caption_fuzzy": 0, "postViews": 0, "postViews": 0, "additionalProperty": 0}).sort({productname: 1}).limit(8)
            const HostProfile = await HostProfile.findOne({_userId: profileUserId}).sort({category: 1})
            const userFound = await User.findOne({_id: profileUserId})
            const loggedFound = await User.findOne({_id: loggedUserId})
            const flaggedList = await Flags.findOne({_userId: loggedUserId}).select("userFlags postFlags")
            const ownedProductsFound = await OwnedProducts.findOne({_userId: loggedUserId})
            const bookmarksFound = await Bookmark.findOne({_userId: loggedUserId})
            const peopleFollowers = await Peoplefollowers.findOne({ _userId: profileUserId }).select("allPeopleFollowers peopleFollowersCount receivedFollowRequests")
            const peopleFollowing = await Peoplefollowing.findOne({ _userId: profileUserId }).select("allPeopleFollowing peopleFollowingCount submittedFollowRequests")
            const storeFollowers = await Storefollowers.findOne({ _userId: profileUserId }).select("allStoreFollowers storeFollowersCount receivedFollowRequests")
            const storeFollowing = await Storefollowing.findOne({ _userId: profileUserId }).select("allStoreFollowing storeFollowingCount submittedFollowRequests")

            var sharedpostsFound = await Sharedpost.findOne({_userId: loggedUserId})

            let isFollowing = null;
            let isRequested = null;
            let notFollowing = null;
            let foundProducts = null;
            let followingLogged = null;
            let flaggedPosts = null;

            let donePostsData = false;
            let donePeopleFollowers = false;
            let doneStoreFollowers = false;
            let donePeopleFollowing = false;
            let doneStoreFollowing = false;
            let doneLoggedBlocked = false;
            let doneProfileBlocked = false;
            let doneFlags = false;

            let privacySetting = null;
            let loggedBlocked = null;
            let profileBlocked = null;
            let profilePicURL = null;
            let flaggedProfile = null;
            
            let peopleFollowersCount = null;
            let peopleFollowingCount = null;
            let storeFollowersCount = null;
            let storeFollowingCount = null;
            let totalGems = null;

            var doneSharedposts = false;

            if(flaggedList){

                if(flaggedList.userFlags?.some(e=>e._userId.toString() === ((profileUserId)))){
                    flaggedProfile = 1
                } else {
                    flaggedProfile = 0
                }

                if(flaggedList.postFlags){
                    flaggedPosts = flaggedList.postFlags
                } else {
                    flaggedPosts = []
                }

                doneFlags = true;
            
            } else {

                let newFlags = new Flag({"_userId": loggedUserId});

                flaggedProfile = 0;
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

            if(peopleFollowers) {

                peopleFollowersCount = peopleFollowers.peopleFollowersCount
                donePeopleFollowers = true;
            }

            if(storeFollowers) {

                storeFollowersCount = storeFollowers.storeFollowersCount;
                
                if(storeFollowersCount > 0){
                    if(storeFollowers.allStoreFollowers.some(e => e._followerId.toString() === ((loggedUserId)))){
                        isFollowing = 1;
                    } else {
                        isFollowing = 0;
                    }   
                } else {
                    isFollowing = 0;
                }

                if(!isFollowing && storeFollowers.receivedFollowRequests){
                    if(storeFollowers.receivedFollowRequests.some(e => (e._fromRequestedUser.toString() === ((loggedUserId)) && e.isActiveRequest === true))){
                        isRequested = 1;
                    } else {
                        isRequested = 0;
                    }
                } else {
                    isRequested = 0;
                }

                if(!isFollowing && !isRequested){
                    notFollowing = 1;
                } else {
                    notFollowing = 0;
                }

                doneStoreFollowers = true;
            }

            if(userFound){

                if(userFound.deactivated === true){
                    return res.status(403).json({"message":"Operation failed"})
                }

                privacySetting = userFound.privacySetting;
                profilePicURL = userFound.profilePicURL;
                totalGems = userFound.totalGems;

                if(userFound?.blockedUsers){
                    if(userFound.blockedUsers.some(e=>e._userId.toString() === ((loggedUserId)))){
                        loggedBlocked = 1;        
                    } else {
                        loggedBlocked = 0;
                    }
                } else {
                    loggedBlocked = 0;
                }

                doneLoggedBlocked = true;
            } 

            if(loggedFound){

                if(loggedFound?.blockedUsers){
                    if(loggedFound.blockedUsers.some(e=>e._userId.toString() === ((profileUserId)))){
                        profileBlocked = 1;        
                    } else {
                        profileBlocked = 0;
                    }
                } else {
                    profileBlocked = 0;
                }

                doneProfileBlocked = true;
            }

            if(peopleFollowing){
                peopleFollowingCount = peopleFollowing.peopleFollowingCount
                donePeopleFollowing = true;
            }

            if(storeFollowing){
                storeFollowingCount = storeFollowing.storeFollowingCount
                if(storeFollowing.allStoreFollowing?.some(e=>e._followingId.toString() === ((loggedUserId)))){
                    followingLogged = 1    
                } else {
                    followingLogged = 0
                }
                doneStoreFollowing = true;
            }

            if(storePosts.length > 0){

                foundProducts = await Product.find({_id: {$in: storePosts.map(e=>e._productId)}},{brand_fuzzy: 0, productname_fuzzy:0})

                storePosts?.forEach(function(item, index){

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
                    
                    if(foundProducts){
                        donePostsData = true;
                    }
                })
            
            } else {
                donePostsData = true;
            }

            if(donePostsData && HostProfile && profilePicURL && ownedProductsFound && bookmarksFound
                && donePeopleFollowers && doneStoreFollowers && donePeopleFollowing && doneSharedposts
                && doneStoreFollowing && doneLoggedBlocked && doneProfileBlocked && doneFlags){
                
                return res.status(200).json({storePosts, HostProfile, isFollowing, isRequested, notFollowing, 
                    privacySetting, totalGems, loggedBlocked, profileBlocked, profilePicURL, peopleFollowingCount, 
                    peopleFollowersCount, storeFollowersCount, storeFollowingCount, ownedProductsFound, bookmarksFound, 
                    sharedpostsFound, foundProducts, followingLogged, flaggedProfile, flaggedPosts})
            
            } else {

                return res.status(401).json({ message: 'Cannot get user information' })
            }

        }
        
    } catch(err){

        return res.status(401).json({ message: 'Cannot get user information' })
    }
}


const editSettingsHostProfile = async (req, res) => {
    
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

        const { loggedUserId, phonePrimary, 
            profilePicKey, profilePicURL, displayname, announcements, 
            regularHoursMondayStart, regularHoursMondayFinish, regularHoursTuesdayStart, regularHoursTuesdayFinish, regularHoursWednesdayStart, regularHoursWednesdayFinish, regularHoursThursdayStart, regularHoursThursdayFinish,
            regularHoursFridayStart, regularHoursFridayFinish, regularHoursSaturdayStart, regularHoursSaturdayFinish, regularHoursSundayStart, regularHoursSundayFinish,
            holidayHoursStart, holidayHoursFinish, closedOnMonday, closedOnTuesday, closedOnWednesday, closedOnThursday, closedOnFriday, closedOnSaturday, closedOnSunday, closedOnHolidays,
            address, city, region, regionCode, country,  
            manager, chain, chainId
            } = req.body
        
        if ( !loggedUserId || !phonePrimary || !displayname || !address 
            || !city || !region || !regionCode || !country ) {    
            return res.status(400).json({ message: 'Missing required fields!' })
        }

        if( phonePrimary?.length > 48 || displayname?.length > 48 || address?.length > 48 || city?.length > 48
            || region?.length > 48 || regionCode?.length > 48 || country?.length > 48
            || manager?.length > 48 || chain?.length > 4 || chainId?.length > 48
            || announcements?.length > 450 || regularHoursMondayStart?.length > 100 
            || holidayHoursStart?.length > 100){
            return res.status(400).json({ 'message': 'Content does not meet requirements' });
        }
    
        var textToCheck = displayname.concat(" ", announcements, 
             " ", address, " ", city, " ", region, " ", regionCode, " ", 
            country, " ", manager, " ", chainId).toLowerCase();

        for(let i=0; i < languageList.length; i++){
            if(textToCheck.indexOf(languageList[i]) !== -1){
                return res.status(403).json({"message":"Inappropriate content"})  
            }
        }

        const foundUserProfile = await HostProfile.findOne({"_userId": loggedUserId })
        
        if(foundUserProfile){

            if(!foundUser.profilePicKey && profilePicKey !== '' && profilePicURL !== ''){

                profilePicKey ? foundUser.profilePicKey = profilePicKey : null;
                profilePicURL ? foundUser.profilePicURL = profilePicURL : null;

                phonePrimary ? foundUserProfile.phonePrimary = phonePrimary : foundUserProfile.phonePrimary = "";
                displayname ? foundUserProfile.displayname = displayname : foundUserProfile.displayname = "";
                announcements ? foundUserProfile.announcements = announcements : foundUserProfile.announcements = "";
                
                regularHoursMondayStart ? foundUserProfile.regularHoursMondayStart = regularHoursMondayStart : foundUserProfile.regularHoursMondayStart = "";
                regularHoursTuesdayStart ? foundUserProfile.regularHoursTuesdayStart = regularHoursTuesdayStart : foundUserProfile.regularHoursTuesdayStart = "";
                regularHoursWednesdayStart ? foundUserProfile.regularHoursWednesdayStart = regularHoursWednesdayStart : foundUserProfile.regularHoursWednesdayStart = "";
                regularHoursThursdayStart ? foundUserProfile.regularHoursThursdayStart = regularHoursThursdayStart : foundUserProfile.regularHoursThursdayStart = "";
                regularHoursFridayStart ? foundUserProfile.regularHoursFridayStart = regularHoursFridayStart : foundUserProfile.regularHoursFridayStart = "";
                regularHoursSaturdayStart ? foundUserProfile.regularHoursSaturdayStart = regularHoursSaturdayStart : foundUserProfile.regularHoursSaturdayStart = "";
                regularHoursSundayStart ? foundUserProfile.regularHoursSundayStart = regularHoursSundayStart : foundUserProfile.regularHoursSundayStart = "";
                holidayHoursStart ? foundUserProfile.holidayHoursStart = holidayHoursStart : foundUserProfile.holidayHoursStart = "";
                
                closedOnMonday ?  foundUserProfile.closedOnMonday = closedOnMonday : foundUserProfile.closedOnMonday = false;
                closedOnTuesday ?  foundUserProfile.closedOnTuesday = closedOnTuesday : foundUserProfile.closedOnTuesday = false;
                closedOnWednesday ?  foundUserProfile.closedOnWednesday = closedOnWednesday : foundUserProfile.closedOnWednesday = false;
                closedOnThursday ?  foundUserProfile.closedOnThursday = closedOnThursday : foundUserProfile.closedOnThursday = false;
                closedOnFriday ?  foundUserProfile.closedOnFriday = closedOnFriday : foundUserProfile.closedOnFriday = false;
                closedOnSaturday ?  foundUserProfile.closedOnSaturday = closedOnSaturday : foundUserProfile.closedOnSaturday = false;
                closedOnSunday ?  foundUserProfile.closedOnSunday = closedOnSunday : foundUserProfile.closedOnSunday = false;
                closedOnHolidays ?  foundUserProfile.closedOnHolidays = closedOnHolidays : foundUserProfile.closedOnHolidays = false;

                regularHoursMondayFinish ? foundUserProfile.regularHoursMondayFinish = regularHoursMondayFinish : foundUserProfile.regularHoursMondayFinish = "";
                regularHoursTuesdayFinish ? foundUserProfile.regularHoursTuesdayFinish = regularHoursTuesdayFinish : foundUserProfile.regularHoursTuesdayFinish = "";
                regularHoursWednesdayFinish ? foundUserProfile.regularHoursWednesdayFinish = regularHoursWednesdayFinish : foundUserProfile.regularHoursWednesdayFinish = "";
                regularHoursThursdayFinish ? foundUserProfile.regularHoursThursdayFinish = regularHoursThursdayFinish : foundUserProfile.regularHoursThursdayFinish = "";
                regularHoursFridayFinish ? foundUserProfile.regularHoursFridayFinish = regularHoursFridayFinish : foundUserProfile.regularHoursFridayFinish = "";
                regularHoursSaturdayFinish ? foundUserProfile.regularHoursSaturdayFinish = regularHoursSaturdayFinish : foundUserProfile.regularHoursSaturdayFinish = "";
                regularHoursSundayFinish ? foundUserProfile.regularHoursSundayFinish = regularHoursSundayFinish : foundUserProfile.regularHoursSundayFinish = "";
                holidayHoursFinish ? foundUserProfile.holidayHoursFinish = holidayHoursFinish : foundUserProfile.holidayHoursFinish = "";
                
                address ? foundUserProfile.address = address : foundUserProfile.address = "";
                city ? foundUserProfile.city = city : foundUserProfile.city = "";
                region ? foundUserProfile.region = region : foundUserProfile.region = "";
                regionCode ? foundUserProfile.regionCode = regionCode : foundUserProfile.regionCode = "";
                country ? foundUserProfile.country = country : foundUserProfile.country = "";
                manager ? foundUserProfile.manager = manager : foundUserProfile.manager = "";
                chain ? foundUserProfile.chain = chain : foundUserProfile.chain = "";
                chainId ? foundUserProfile.chainId = chainId : foundUserProfile.chainId = "";

                const savedFoundProfile = await foundUserProfile.save()
            
                const savedFoundUser = await foundUser.save()

                if (savedFoundProfile && savedFoundUser) {
                    res.json({ message: "Success!" })
                }
            
            }else if(profilePicKey !== '' && (foundUser.profilePicKey !== profilePicKey)){

                const deleted = await deleteFile(foundUser.profilePicKey)

                if(deleted){

                    profilePicKey ? foundUser.profilePicKey = profilePicKey : null;
                    profilePicURL ? foundUser.profilePicURL = profilePicURL : null;

                    phonePrimary ? foundUserProfile.phonePrimary = phonePrimary : foundUserProfile.phonePrimary = "";
                    displayname ? foundUserProfile.displayname = displayname : foundUserProfile.displayname = "";
                    announcements ? foundUserProfile.announcements = announcements : foundUserProfile.announcements = "";

                    regularHoursMondayStart ? foundUserProfile.regularHoursMondayStart = regularHoursMondayStart : foundUserProfile.regularHoursMondayStart = "";
                    regularHoursTuesdayStart ? foundUserProfile.regularHoursTuesdayStart = regularHoursTuesdayStart : foundUserProfile.regularHoursTuesdayStart = "";
                    regularHoursWednesdayStart ? foundUserProfile.regularHoursWednesdayStart = regularHoursWednesdayStart : foundUserProfile.regularHoursWednesdayStart = "";
                    regularHoursThursdayStart ? foundUserProfile.regularHoursThursdayStart = regularHoursThursdayStart : foundUserProfile.regularHoursThursdayStart = "";
                    regularHoursFridayStart ? foundUserProfile.regularHoursFridayStart = regularHoursFridayStart : foundUserProfile.regularHoursFridayStart = "";
                    regularHoursSaturdayStart ? foundUserProfile.regularHoursSaturdayStart = regularHoursSaturdayStart : foundUserProfile.regularHoursSaturdayStart = "";
                    regularHoursSundayStart ? foundUserProfile.regularHoursSundayStart = regularHoursSundayStart : foundUserProfile.regularHoursSundayStart = "";
                    holidayHoursStart ? foundUserProfile.holidayHoursStart = holidayHoursStart : foundUserProfile.holidayHoursStart = "";

                    regularHoursMondayFinish ? foundUserProfile.regularHoursMondayFinish = regularHoursMondayFinish : foundUserProfile.regularHoursMondayFinish = "";
                    regularHoursTuesdayFinish ? foundUserProfile.regularHoursTuesdayFinish = regularHoursTuesdayFinish : foundUserProfile.regularHoursTuesdayFinish = "";
                    regularHoursWednesdayFinish ? foundUserProfile.regularHoursWednesdayFinish = regularHoursWednesdayFinish : foundUserProfile.regularHoursWednesdayFinish = "";
                    regularHoursThursdayFinish ? foundUserProfile.regularHoursThursdayFinish = regularHoursThursdayFinish : foundUserProfile.regularHoursThursdayFinish = "";
                    regularHoursFridayFinish ? foundUserProfile.regularHoursFridayFinish = regularHoursFridayFinish : foundUserProfile.regularHoursFridayFinish = "";
                    regularHoursSaturdayFinish ? foundUserProfile.regularHoursSaturdayFinish = regularHoursSaturdayFinish : foundUserProfile.regularHoursSaturdayFinish = "";
                    regularHoursSundayFinish ? foundUserProfile.regularHoursSundayFinish = regularHoursSundayFinish : foundUserProfile.regularHoursSundayFinish = "";
                    holidayHoursFinish ? foundUserProfile.holidayHoursFinish = holidayHoursFinish : foundUserProfile.holidayHoursFinish = "";
                    
                    closedOnMonday ?  foundUserProfile.closedOnMonday = closedOnMonday : foundUserProfile.closedOnMonday = false;
                    closedOnTuesday ?  foundUserProfile.closedOnTuesday = closedOnTuesday : foundUserProfile.closedOnTuesday = false;
                    closedOnWednesday ?  foundUserProfile.closedOnWednesday = closedOnWednesday : foundUserProfile.closedOnWednesday = false;
                    closedOnThursday ?  foundUserProfile.closedOnThursday = closedOnThursday : foundUserProfile.closedOnThursday = false;
                    closedOnFriday ?  foundUserProfile.closedOnFriday = closedOnFriday : foundUserProfile.closedOnFriday = false;
                    closedOnSaturday ?  foundUserProfile.closedOnSaturday = closedOnSaturday : foundUserProfile.closedOnSaturday = false;
                    closedOnSunday ?  foundUserProfile.closedOnSunday = closedOnSunday : foundUserProfile.closedOnSunday = false;
                    closedOnHolidays ?  foundUserProfile.closedOnHolidays = closedOnHolidays : foundUserProfile.closedOnHolidays = false;

                    address ? foundUserProfile.address = address : foundUserProfile.address = "";
                    city ? foundUserProfile.city = city : foundUserProfile.city = "";
                    region ? foundUserProfile.region = region : foundUserProfile.region = "";
                    regionCode ? foundUserProfile.regionCode = regionCode : foundUserProfile.regionCode = "";
                    country ? foundUserProfile.country = country : foundUserProfile.country = "";
                    manager ? foundUserProfile.manager = manager : foundUserProfile.manager = "";
                    chain ? foundUserProfile.chain = chain : foundUserProfile.chain = "";
                    chainId ? foundUserProfile.chainId = chainId : foundUserProfile.chainId = "";

                    const savedFoundProfile = await foundUserProfile.save()
                
                    const savedFoundUser = await foundUser.save()

                    if (savedFoundProfile && savedFoundUser) {
                        res.json({ message: "Success!" })
                    }
                }
            
            } else {

                phonePrimary ? foundUserProfile.phonePrimary = phonePrimary : foundUserProfile.phonePrimary = "";
                displayname ? foundUserProfile.displayname = displayname : foundUserProfile.displayname = "";
                announcements ? foundUserProfile.announcements = announcements : foundUserProfile.announcements = "";
                
                regularHoursMondayStart ? foundUserProfile.regularHoursMondayStart = regularHoursMondayStart : foundUserProfile.regularHoursMondayStart = "";
                regularHoursTuesdayStart ? foundUserProfile.regularHoursTuesdayStart = regularHoursTuesdayStart : foundUserProfile.regularHoursTuesdayStart = "";
                regularHoursWednesdayStart ? foundUserProfile.regularHoursWednesdayStart = regularHoursWednesdayStart : foundUserProfile.regularHoursWednesdayStart = "";
                regularHoursThursdayStart ? foundUserProfile.regularHoursThursdayStart = regularHoursThursdayStart : foundUserProfile.regularHoursThursdayStart = "";
                regularHoursFridayStart ? foundUserProfile.regularHoursFridayStart = regularHoursFridayStart : foundUserProfile.regularHoursFridayStart = "";
                regularHoursSaturdayStart ? foundUserProfile.regularHoursSaturdayStart = regularHoursSaturdayStart : foundUserProfile.regularHoursSaturdayStart = "";
                regularHoursSundayStart ? foundUserProfile.regularHoursSundayStart = regularHoursSundayStart : foundUserProfile.regularHoursSundayStart = "";
                holidayHoursStart ? foundUserProfile.holidayHoursStart = holidayHoursStart : foundUserProfile.holidayHoursStart = "";

                closedOnMonday ?  foundUserProfile.closedOnMonday = closedOnMonday : foundUserProfile.closedOnMonday = false;
                closedOnTuesday ?  foundUserProfile.closedOnTuesday = closedOnTuesday : foundUserProfile.closedOnTuesday = false;
                closedOnWednesday ?  foundUserProfile.closedOnWednesday = closedOnWednesday : foundUserProfile.closedOnWednesday = false;
                closedOnThursday ?  foundUserProfile.closedOnThursday = closedOnThursday : foundUserProfile.closedOnThursday = false;
                closedOnFriday ?  foundUserProfile.closedOnFriday = closedOnFriday : foundUserProfile.closedOnFriday = false;
                closedOnSaturday ?  foundUserProfile.closedOnSaturday = closedOnSaturday : foundUserProfile.closedOnSaturday = false;
                closedOnSunday ?  foundUserProfile.closedOnSunday = closedOnSunday : foundUserProfile.closedOnSunday = false;
                closedOnHolidays ?  foundUserProfile.closedOnHolidays = closedOnHolidays : foundUserProfile.closedOnHolidays = false;

                regularHoursMondayFinish ? foundUserProfile.regularHoursMondayFinish = regularHoursMondayFinish : foundUserProfile.regularHoursMondayFinish = "";
                regularHoursTuesdayFinish ? foundUserProfile.regularHoursTuesdayFinish = regularHoursTuesdayFinish : foundUserProfile.regularHoursTuesdayFinish = "";
                regularHoursWednesdayFinish ? foundUserProfile.regularHoursWednesdayFinish = regularHoursWednesdayFinish : foundUserProfile.regularHoursWednesdayFinish = "";
                regularHoursThursdayFinish ? foundUserProfile.regularHoursThursdayFinish = regularHoursThursdayFinish : foundUserProfile.regularHoursThursdayFinish = "";
                regularHoursFridayFinish ? foundUserProfile.regularHoursFridayFinish = regularHoursFridayFinish : foundUserProfile.regularHoursFridayFinish = "";
                regularHoursSaturdayFinish ? foundUserProfile.regularHoursSaturdayFinish = regularHoursSaturdayFinish : foundUserProfile.regularHoursSaturdayFinish = "";
                regularHoursSundayFinish ? foundUserProfile.regularHoursSundayFinish = regularHoursSundayFinish : foundUserProfile.regularHoursSundayFinish = "";
                holidayHoursFinish ? foundUserProfile.holidayHoursFinish = holidayHoursFinish : foundUserProfile.holidayHoursFinish = "";

                address ? foundUserProfile.address = address : foundUserProfile.address = "";
                city ? foundUserProfile.city = city : foundUserProfile.city = "";
                region ? foundUserProfile.region = region : foundUserProfile.region = "";
                regionCode ? foundUserProfile.regionCode = regionCode : foundUserProfile.regionCode = "";
                country ? foundUserProfile.country = country : foundUserProfile.country = "";
                manager ? foundUserProfile.manager = manager : foundUserProfile.manager = "";
                chain ? foundUserProfile.chain = chain : foundUserProfile.chain = "";
                chainId ? foundUserProfile.chainId = chainId : foundUserProfile.chainId = "";

                const savedFoundProfile = await foundUserProfile.save()
            
                const savedFoundUser = await foundUser.save()

                if (savedFoundProfile && savedFoundUser) {
                    res.json({ message: "Success!" })
                }
            }
        }
    })
}



const editSettingsStoreGeneral = async (req, res) => {

    const cookies = req.cookies;

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

    const { loggedUserId, lessMotion, privacySetting, pushNotifications, 
        userTheme, chain, chainId } = req.body

    // Confirm data 
    if ( !loggedUserId || typeof lessMotion !== 'boolean' || !privacySetting 
    || typeof pushNotifications !== 'boolean' || !userTheme || !chain || !chainId  ) {

        return res.status(400).json({ message: 'Missing required fields!' })
    }

    // Does the user exist to update?
    HostProfile.findOne({"_userId": loggedUserId }, async function(err, foundUserProfile){
        if(err){
            return res.status(400).json({ message: 'User not found' })
        }

        privacySetting ? foundUser.privacySetting = privacySetting : foundUser.privacySetting = "";

        lessMotion ? foundUserProfile.lessMotion = lessMotion : foundUserProfile.lessMotion = "";
        pushNotifications ? foundUserProfile.pushNotifications = pushNotifications : foundUserProfile.pushNotifications = "";
        userTheme ? foundUserProfile.userTheme = userTheme : foundUserProfile.userTheme = "";
        chain ? foundUserProfile.chain = chain : foundUserProfile.chain = "";
        chainId ? foundUserProfile.chainId = chainId : foundUserProfile.chainId = "";

        const savedFoundProfile = await foundUserProfile.save()
       
        const savedFoundUser = await foundUser.save()

        if (savedFoundProfile && savedFoundUser) {
            res.json({ message: "Success!" })
        }

    })
}

module.exports = { getHostProfile, editSettingsHostProfile }