const Post = require('../../model/Post');
const User = require('../../model/User');
const Flags = require('../../model/Flags');
const RecentlyViewed = require('../../model/RecentlyViewed');
const Bookmark = require('../../model/Bookmark');
const Sharedpost = require('../../model/Sharedpost');
const OwnedProducts = require('../../model/OwnedProducts');
const Product = require('../../model/Product');
const Peoplefollowing = require('../../model/Peoplefollowing');
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


  const addLinkClick = async (req, res) => {

    const { loggedUserId, postId } = req.body

    if (!loggedUserId || !postId ) return res.status(400).json({ 'message': 'Missing required fields!' });

    try {

        const foundPost = await Post.findOne({_id: postId})
        const foundUser = await User.findOne({_id: loggedUserId})

        if(foundPost && foundUser){

          var todaysDate = new Date().toLocaleDateString()
          var doneOperation = false;

            if(foundPost.postLinkClicks?.length > 0){

              if(foundPost.postLinkClicks.some(e=> (e.ipAddress === foundUser.primaryGeoData?.IPv4 && e.date === todaysDate ))){

                  for(let i=0; i< foundPost.postLinkClicks.length; i++){

                      if(foundPost.postLinkClicks[i].date === todaysDate && foundPost.postLinkClicks[i]._userId.toString() === ((loggedUserId))
                        && foundPost.postLinkClicks[i].ipAddress === foundUser.primaryGeoData.IPv4){

                        foundPost.postLinkClicks[i].count = foundPost.postLinkClicks[i].count + 1
                        foundPost.totalPostClicks = foundPost.totalPostClicks + 1
                        foundPost.score = foundPost.score + 1
                        
                        const savedLimits = await foundPost.save()

                          if(savedLimits){
                              doneOperation = true;
                          }
                          
                          break;                      
                      }
                  }
              
              } else {

                foundPost.postLinkClicks.push({date: todaysDate, count: 1, 
                    ipAddress: foundUser.primaryGeoData?.IPv4, _userId: loggedUserId })
                foundPost.totalPostClicks = foundPost.totalPostClicks + 1
                foundPost.score = foundPost.score + 1
                
                  const savedLimits = await foundPost.save()
                  if(savedLimits){
                    doneOperation = true;
                  }
              }

            } else {

                foundPost.postLinkClicks = [{date: todaysDate, count: 1, 
                    ipAddress: foundUser.primaryGeoData?.IPv4, _userId: loggedUserId }]
                foundPost.totalPostClicks = 1
                const savedLimits = await foundPost.save()
                if(savedLimits){
                    doneOperation = true;
                }
            }

          if(doneOperation){
            
              return res.status(200)
          }
          
        }

    } catch (err) {

        return res.status(401).json({ message: 'Failed' })
    }
  }


  const addPublicLinkClick = async (req, res) => {

    const { ipAddress, postId } = req.body

    if (!ipAddress || !postId ) return res.status(400).json({ 'message': 'Missing required fields!' });

    try {

        const foundPost = await Post.findOne({_id: postId})

        if(foundPost){

          var todaysDate = new Date().toLocaleDateString()

          if(foundPost.postLinkClicks?.length > 0){

            if(foundPost.postLinkClicks.some(e=>(e.ipAddress === ipAddress && e.date === todaysDate ))){

                for(let i=0; i< foundPost.postLinkClicks.length; i++){

                    if(foundPost.postLinkClicks[i].ipAddress === ipAddress && foundPost.postLinkClicks[i].date === todaysDate){

                      foundPost.postLinkClicks[i].count = foundPost.postLinkClicks[i].count + 1
                      foundPost.totalPostClicks = foundPost.totalPostClicks + 1  
                      foundPost.score = foundPost.score + 1  
                      
                      const savedLimits = await foundPost.save()

                        if(savedLimits){
                          return res.status(201).json({ message: 'Success' })
                        }
                        
                        break;                      
                    }
                }
            
            } else {

              foundPost.postLinkClicks.push({date: todaysDate, count: 1, ipAddress: ipAddress })
              foundPost.totalPostClicks = foundPost.totalPostClicks + 1  
              foundPost.score = foundPost.score + 1  
                const savedLimits = await foundPost.save()
                if(savedLimits){
                  return res.status(201).json({ message: 'Success' })
                }
            }

          } else {

              foundPost.postLinkClicks = [{date: todaysDate, count: 1, ipAddress: ipAddress }]
              foundPost.totalPostClicks = 1  
              foundPost.score = 1  

              const savedLimits = await foundPost.save()
              if(savedLimits){
                return res.status(201).json({ message: 'Success' })
              }
          }
        }

    } catch (err) {

        return res.status(401).json({ message: 'Failed' })
    }
  }

  module.exports = { addLinkClick, addPublicLinkClick }
