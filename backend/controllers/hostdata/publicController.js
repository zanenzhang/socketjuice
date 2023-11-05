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


const getPublicHostProfilesCoord = async (req, res) => {
    
    var { coordinatesInput } = req.query

    if (!coordinatesInput ) {
        return res.status(400).json({ message: 'Missing required info' })
    }

    coordinatesInput = JSON.parse(coordinatesInput)

    consolg.log(coordinatesInput)

    try {

        const foundHostProfiles = await HostProfile.find({
            offeringCharging: true,
            deactivated: false,
            location:
              { $near:
                 {
                   $geometry: { type: "Point",  coordinates: coordinatesInput },
                   $maxDistance: 5000
                 }
              }
          })

        if(foundHostProfiles?.length > 0){

            console.log(foundHostProfiles)

            foundHostProfiles?.forEach(function(item, index){

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
                
                }  
    
                item.update()
            })

            doneProfileData = true;

        }  else {

            doneProfileData = true;
        }

        if(doneProfileData ){
            
                return res.status(200).json({foundHostProfiles })
        
        } else {

            return res.status(401).json({ message: 'Cannot get store information' })
        }
        
    } catch(err){

        return res.status(401).json({ message: 'Cannot get user information' })
    }
}


module.exports = { getPublicHostProfilesCoord }

