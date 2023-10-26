const Post = require('../../model/Post');

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


const getAllPostsByProduct = async (req, res) => {
    
    const { productId } = req.params

    if (!productId) {
        return res.status(400).json({ message: 'Product ID Required' })
    }

    const postsbyproduct = await Post.find({ _productId: productId })

    if(postsbyproduct){

        postsbyproduct?.forEach(function(item, index){

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
                
                    var signParams = {
                        Bucket: wasabiPrivateBucketUSA, 
                        Key: item.videoCarouselObjectIds[i],
                        Expires: 7200
                      };
        
                    var url = s3.getSignedUrl('getObject', signParams);
        
                    finalVideoURLs.push(url)
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
    }

    res.json(postsbyproduct)
}   

module.exports = { getAllPostsByProduct }