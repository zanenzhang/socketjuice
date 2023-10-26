const Post = require('../../model/Post');
const User = require('../../model/User');
const Flags = require('../../model/Flags');
const RecentlyViewed = require('../../model/RecentlyViewed');
const Bookmark = require('../../model/Bookmark');
const Sharedpost = require('../../model/Sharedpost');
const OwnedProducts = require('../../model/OwnedProducts');
const Product = require('../../model/Product');
const Peoplefollowing = require('../../model/Peoplefollowing');
const Preference = require('../../model/Preference');
const ObjectId  = require('mongodb').ObjectId;

const S3 = require("aws-sdk/clients/s3");
const fns = require('date-fns');

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


  const getViewed = async (req, res) => {

    const { userId, loggedUserId } = req.query

    if (!userId) {
        return res.status(400).json({ message: 'User ID Required' })
    }

    let foundProducts = null;
    let donePosts = null;
    var doneSharedposts = false;

    const userViewed = await RecentlyViewed.findOne({ _userId: userId }).select("_viewedPosts").sort({ "_viewedPosts.timestamp": -1}).limit(10)
    const ownedProductsFound = await OwnedProducts.findOne({_userId: loggedUserId})
    const bookmarksFound = await Bookmark.findOne({_userId: loggedUserId})
    const peopleFollowing = await Peoplefollowing.findOne({_userId: loggedUserId})
    const flaggedPosts = await Flags.findOne({_userId: loggedUserId}).select("postFlags")
    const loggedBlocks = await User.findOne({_id: loggedUserId}).select("blockedUsers")

    var sharedpostsFound = await Sharedpost.findOne({_userId: loggedUserId})

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

    if(userViewed){

      if(userViewed._viewedPosts?.length > 0){

        const userPosts = await Post.find({$and:[{_userId: {$ne: userId}},
          {_id: {$in: userViewed._viewedPosts.map(e=>e._postId)}}]},{"caption_fuzzy": 0, "postViews": 0, "postViews": 0, "additionalProperty": 0}).sort({ createdAt: -1})

        if(userPosts){

            foundProducts = await Product.find({_id: {$in: userPosts.map(e=>e._productId)}},{brand_fuzzy: 0, productname_fuzzy:0})

            const userData = await User.find({_id: {$in: userPosts.map(e=>e._userId)}}).
            select("_id profilePicURL roles username blockedUsers privacySetting roles deactivated")

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

            donePosts = true

            if(donePosts && userData && ownedProductsFound && peopleFollowing && doneSharedposts &&
              bookmarksFound && foundProducts && flaggedPosts && loggedBlocks){

              res.status(200).json({userPosts, userData, ownedProductsFound, peopleFollowing,
                foundProducts, bookmarksFound, sharedpostsFound, flaggedPosts, loggedBlocks })
            }
          }
        } 

    } else {

        const userPosts = []
        const userData = []
        const ownedProductsFound = []
        foundProducts = []
        
        res.status(200).json({userPosts, userData, ownedProductsFound, peopleFollowing,
            foundProducts, bookmarksFound, sharedpostsFound, flaggedPosts, loggedBlocks })
    }
  }


  const addViewed = async (req, res) => {

    const { loggedUserId, postId, ipAddress } = req.body

    if (!loggedUserId || !postId ) return res.status(400).json({ 'message': 'Missing required fields!' });

    try {

      var donePrefs = false;
      const foundPost = await Post.findOne({_id: postId})
      const foundUser = await User.findOne({_id: loggedUserId})
      
      if(foundPost && foundUser){

        var todaysDate = new Date().toLocaleDateString()
        var doneOperation = false;
        var ipAddressStr = ""

        const foundPreferences = await Preference.findOne({_userId: loggedUserId})

        if(foundPreferences){

          if(foundPost.gender){
            foundPreferences.genderScore = Math.ceil((foundPreferences.genderScore + Number(foundPost.genderScore)) / 2)
            if(foundPreferences.genderScore < 0){
              foundPreferences.gender = "female"
            } else if(foundPreferences.genderScore > 0){
              foundPreferences.gender = "male"
            }
          }

          if(foundPost.brand !== "N/A" && foundPost.size !== 'N/A'){
              
            if(foundPreferences.brands?.some(e=> (e.brandname === foundPost.brand && e.size === foundPost.size)) ){

              for(let i=0; i<foundPreferences.brands?.length; i++){
              
                if(foundPreferences.brands[i].brandname === foundPost.brand && foundPreferences.brands[i].size === foundPost.size){
                  foundPreferences.brands[i].hits = foundPreferences.brands[i].hits + 1
                  foundPreferences.brands[i].dateTime = new Date();
                  break
                }    
              }

            } else if(foundPreferences.brands?.length > 0) {

              foundPreferences.brands.push({brandname: foundPost.brand, size: foundPost.size})
            
            } else {

              foundPreferences.brands = [{brandname: foundPost.brand, size: foundPost.size}]
            }

            if(foundPreferences.recentbrands?.some(e=> (e.brandname === foundPost.brand && e.size === foundPost.size)) ){

              for(let i=0; i<foundPreferences.recentbrands?.length; i++){
              
                if(foundPreferences.recentbrands[i].brandname === foundPost.brand && foundPreferences.recentbrands[i].size === foundPost.size){
                  foundPreferences.recentbrands[i].hits = foundPreferences.recentbrands[i].hits + 1
                  foundPreferences.recentbrands[i].dateTime = new Date();
                  break
                }    
              }

            } else if(foundPreferences.recentbrands?.length > 0) {

              foundPreferences.recentbrands.push({brandname: foundPost.brand, size: foundPost.size})
            
            } else {

              foundPreferences.recentbrands = [{brandname: foundPost.brand, size: foundPost.size}]
            }

          } else if(foundPost.brand !== "N/A") {

            if(foundPreferences.brands?.some(e=> (e.brandname === foundPost.brand)) ){

              for(let i=0; i<foundPreferences.brands?.length; i++){
              
                if(foundPreferences.brands[i].brandname === foundPost.brand){
                  foundPreferences.brands[i].hits = foundPreferences.brands[i].hits + 1
                  foundPreferences.brands[i].dateTime = new Date();
                  break
                }    
              }

            } else if (foundPreferences.brands?.length > 0) {

              foundPreferences.brands.push({brandname: foundPost.brand})
            
            } else {

              foundPreferences.brands = [{brandname: foundPost.brand}]
            }

            if(foundPreferences.recentbrands?.some(e=> (e.brandname === foundPost.brand)) ){

              for(let i=0; i<foundPreferences.recentbrands?.length; i++){
              
                if(foundPreferences.recentbrands[i].brandname === foundPost.brand){
                  foundPreferences.recentbrands[i].hits = foundPreferences.recentbrands[i].hits + 1
                  foundPreferences.recentbrands[i].dateTime = new Date();
                  break
                }    
              }

            } else if(foundPreferences.recentbrands?.length > 0) {

              foundPreferences.recentbrands.push({brandname: foundPost.brand})
            
            } else {

              foundPreferences.recentbrands = [{brandname: foundPost.brand}]
            }
          }

          if(foundPost.primaryCategory){

            if(foundPreferences.categories?.some(e=> (e.categoryname === foundPost.primaryCategory)) ){

              for(let i=0; i<foundPreferences.categories?.length; i++){
              
                if(foundPreferences.categories[i].categoryname === foundPost.primaryCategory){
                  foundPreferences.categories[i].hits = foundPreferences.categories[i].hits + 1
                  foundPreferences.categories[i].dateTime = new Date();
                  break
                }    
              }

            } else if(foundPreferences.categories?.length > 0) {

              foundPreferences.categories.push({categoryname: foundPost.primaryCategory})
            
            } else {

              foundPreferences.categories = [{categoryname: foundPost.primaryCategory}]
            }

            if(foundPreferences.recentcategories?.some(e=> (e.categoryname === foundPost.primaryCategory)) ){

              for(let i=0; i<foundPreferences.recentcategories?.length; i++){
              
                if(foundPreferences.recentcategories[i].categoryname === foundPost.primaryCategory){
                  foundPreferences.recentcategories[i].hits = foundPreferences.recentcategories[i].hits + 1
                  foundPreferences.recentcategories[i].dateTime = new Date();
                  break
                }    
              }

            } else if(foundPreferences.recentcategories?.length > 0) {

              foundPreferences.recentcategories.push({categoryname: foundPost.primaryCategory})
            
            } else {

              foundPreferences.recentcategories = [{categoryname: foundPost.primaryCategory}]
            }
          }

          if(foundPost.primaryColor){

            if(foundPreferences.colors?.some(e=> (e.colorname === foundPost.primaryColor)) ){

              for(let i=0; i<foundPreferences.colors?.length; i++){
              
                if(foundPreferences.colors[i].colorname === foundPost.primaryColor){
                  foundPreferences.colors[i].hits = foundPreferences.colors[i].hits + 1
                  foundPreferences.colors[i].dateTime = new Date();
                  break
                }    
              }

            } else if(foundPreferences.colors?.length > 0) {

              foundPreferences.colors.push({colorname: foundPost.primaryColor})
            
            } else {

              foundPreferences.colors = [{colorname: foundPost.primaryColor}]
            }

            if(foundPreferences.recentcolors?.some(e=> (e.colorname === foundPost.primaryColor)) ){

              for(let i=0; i<foundPreferences.recentcolors?.length; i++){
              
                if(foundPreferences.recentcolors[i].colorname === foundPost.primaryColor){
                  foundPreferences.recentcolors[i].hits = foundPreferences.recentcolors[i].hits + 1
                  foundPreferences.recentcolors[i].dateTime = new Date();
                  break
                }    
              }

            } else if(foundPreferences.recentcolors?.length > 0) {

              foundPreferences.recentcolors.push({colorname: foundPost.primaryColor})
            
            } else {

              foundPreferences.recentcolors = [{colorname: foundPost.primaryColor}]
            }
          }

          if(foundPost.retailer){

            if(foundPreferences.retailers?.some(e=> (e.retailername === foundPost.retailer)) ){

              for(let i=0; i<foundPreferences.retailers?.length; i++){
              
                if(foundPreferences.retailers[i].retailername === foundPost.retailer){
                  foundPreferences.retailers[i].hits = foundPreferences.retailers[i].hits + 1
                  foundPreferences.retailers[i].dateTime = new Date();
                  break
                }    
              }

            } else if(foundPreferences.retailers?.length > 0) {

              foundPreferences.retailers.push({retailername: foundPost.retailer})
            
            } else {

              foundPreferences.retailers = [{retailername: foundPost.retailer}]
            }

            if(foundPreferences.recentretailers?.some(e=> (e.retailername === foundPost.retailer)) ){

              for(let i=0; i<foundPreferences.recentretailers?.length; i++){
              
                if(foundPreferences.recentretailers[i].retailername === foundPost.retailer){
                  foundPreferences.recentretailers[i].hits = foundPreferences.recentretailers[i].hits + 1
                  foundPreferences.recentretailers[i].dateTime = new Date();
                  break
                }    
              }

            } else if(foundPreferences.recentretailers?.length > 0) {

              foundPreferences.recentretailers.push({retailername: foundPost.retailer})
            
            } else {

              foundPreferences.recentretailers = [{retailername: foundPost.retailer}]
            }
          }

          const savedPrefs = await foundPreferences.save()

          if(savedPrefs){
            donePrefs = true;
          }

        } else {

          var newUser = {}

          newUser._userId = loggedUserId
          newUser.userIP = ipAddress

          if(foundPost.brand){
            
            if(foundPost.size){
              
                newUser.brands = [{brandname: foundPost.brand, size: foundPost.size}]

            } else {

                newUser.brands = [{brandname: foundPost.brand}]
            }
          }

          if(foundPost.primaryCategory){
            
            newUser.recentcategories = [{categoryname: foundPost.primaryCategory}]
            newUser.categories = [{categoryname: foundPost.primaryCategory}]
          }

          if(foundPost.primaryColor){

            newUser.recentcolors = [{colorname: foundPost.primaryColor}]
            newUser.colors = [{colorname: foundPost.primaryColor}]
          }

          if(foundPost.retailer){

            newUser.recentretailers = [{retailername: foundPost.retailer}]
            newUser.retailers = [{retailername: foundPost.retailer}]
          }

          const newPrefs = await Preference.create(newUser)

          if(newPrefs){
            donePrefs = true;
          }
        }

        if(foundUser.primaryGeoData?.IPv4){
          ipAddressStr = foundUser.primaryGeoData?.IPv4
        }

        if(foundPost.postViews?.length > 0){

          if(foundPost.postViews.some(e=> (e.ipAddress === ipAddressStr && e.date === todaysDate ))){

            for(let i=0; i< foundPost.postViews.length; i++){

                if(foundPost.postViews[i].date === todaysDate && foundPost.postViews[i].ipAddress === ipAddressStr
                  && foundPost.postViews[i]._userId.toString() === ((loggedUserId))){

                  foundPost.postViews[i].count = foundPost.postViews[i].count + 1
                  foundPost.score = foundPost.score + 1
                  foundPost.totalPostViews = foundPost.totalPostViews + 1

                  break;                      
                }
            }

            const savedLimits = await foundPost.save()

            if(savedLimits){
              doneOperation = true;
            }
          
          } else {

            foundPost.postViews.push({date: todaysDate, count: 1, ipAddress: ipAddressStr, _userId: loggedUserId })

            foundPost.score = foundPost.score + 1
            foundPost.totalPostViews = foundPost.totalPostViews + 1
            
              const savedLimits = await foundPost.save()
              if(savedLimits){
                doneOperation = true;
              }
          }

        } else {

            foundPost.postViews = [{date: todaysDate, count: 1, ipAddress: ipAddressStr, _userId: loggedUserId }]
            foundPost.totalPostViews = 1;

            const savedLimits = await foundPost.save()
            if(savedLimits){
                doneOperation = true;
            }
        }

        if(doneOperation && donePrefs){

          if(foundPost._userId.toString() === ((loggedUserId)) || (foundPost.postClass !== 1 && foundPost.postClass !== 2 )){
          
            return res.status(200)
          
          } else {

            const viewed = await RecentlyViewed.findOne({ _userId: loggedUserId})

            if(viewed){

              if( viewed._viewedPosts?.some(e=>e._postId.toString() === ((postId)))){

                const updated = await RecentlyViewed.updateOne({ _userId: loggedUserId, '_viewedPosts._postId':postId },{$set:{ '_viewedPosts.$.timestamp': Date.now(), 'lastViewedTime': Date.now()}})

                if(updated){
                  return res.status(201).json({ message: 'Success' })
                }

              } else {

                if(viewed._viewedPosts?.length < 100){
                  viewed.lastViewedTime = Date.now()
                  viewed._viewedPosts.push({_postId: postId})

                  const done = await viewed.save()

                  if(done){
                    return res.status(201).json({ message: 'Success' })
                  }
                
                } else {

                  viewed.lastViewedTime = Date.now()

                  var markedPost = null;
                  varOldestDate = new Date();
                  for (let i=0; i<viewed._viewedPosts?.length; i++){
                    if(viewed._viewedPosts[i] < varOldestDate){
                      varOldestDate = viewed._viewedPosts[i].timestamp
                      markedPost = viewed._viewedPosts[i]._postId
                    }
                  }
                  viewed._viewedPosts.pull({_postId: markedPost}) 

                  const done = await viewed.save()

                  if(done){

                    const pushNewView = await RecentlyViewed.updateOne({ _userId: loggedUserId},{$push:{_viewedPosts:{_postId: postId}}})

                    if(pushNewView){
                      return res.status(201).json({ message: 'Success' })
                    }
                  }

                }
              }
            }
          }
        } 
      }

    } catch (err) {

        return res.status(401).json({ message: 'Failed' })
    }
  }

  module.exports = { getViewed, addViewed }
