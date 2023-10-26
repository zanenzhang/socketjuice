const User = require('../../model/User');
const StoreProfile = require('../../model/StoreProfile');
const Post = require('../../model/Post');
const RecentlyViewed = require('../../model/RecentlyViewed');
const RecentlyVisited = require('../../model/RecentlyVisited');

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


  const getUserReels = async (req, res) => {

    const { userId } = req.params

    if (!userId) {
        return res.status(400).json({ message: 'User ID Required' })
    }

    const userViewed = await RecentlyViewed.findOne({ _userId: userId }).select("_viewedPosts").sort({ "_viewedPosts.timestamp": -1}).limit(10)
    // const userVisited = await RecentlyVisited.findOne({ _userId: userId }).select("_visitedStores").sort({ "_visitedStores.timestamp": -1}).limit(5)
    var userPosts = null;

    var userVisited = [];
    var visitedStores = [];
    var storeDetails = []

    if(userViewed){

      userPosts = await Post.find({_id: {$in: userViewed._viewedPosts.map(e=>e._postId)}})

      if (userPosts){

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

          return res.status(200).json({visitedStores, storeDetails, userPosts})
      }
    }

    // if(userVisited){
  
    //     const visitedStores = await User.find().
    //     where("_id").
    //     in(userVisited._visitedStores.map(e=>e._userId)).
    //     select("_id roles profilePicURL ")

    //     const storeDetails = await StoreProfile.find().
    //     where("_userId").
    //     in(userVisited._visitedStores.map(e=>e._userId)).
    //     select("storename displayname address city region country")

  
    //     if (visitedStores && storeDetails && userPosts){
  
    //         return res.status(200).json({visitedStores, storeDetails, userPosts})
    //     }
    //   }
  }


  module.exports = { getUserReels }
