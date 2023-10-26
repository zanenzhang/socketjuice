const Post = require('../../model/Post');
const IPPreference = require('../../model/IPPreference');
const User = require('../../model/User');
const Flags = require('../../model/Flags');
const RecentlyViewed = require('../../model/RecentlyViewed');
const Bookmark = require('../../model/Bookmark');
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


  const addPostView = async (req, res) => {

    const { ipAddress, postId } = req.body

    if (!ipAddress || !postId ) return res.status(400).json({ 'message': 'Missing required fields!' });

    try {

        var donePrefs = false;
        const foundPost = await Post.findOne({_id: postId})

        if(foundPost){

          const foundPreferences = await IPPreference.findOne({userIP: ipAddress})

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
                    foundPreferences.brands[i].dateTime = new Date()
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
                    break;
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
                    break;
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
                    break;
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
                    break;
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

                foundPreferences.recentcolors.push({colorname: foundPost.primaryCategory})
              
              } else {

                foundPreferences.recentcolors = [{colorname: foundPost.primaryCategory}]
              }
            }

            if(foundPost.retailer){

              if(foundPreferences.retailers?.some(e=> (e.retailername === foundPost.retailer)) ){

                for(let i=0; i<foundPreferences.retailers?.length; i++){
                
                  if(foundPreferences.retailers[i].retailername === foundPost.retailer){
                    foundPreferences.retailers[i].hits = foundPreferences.retailers[i].hits + 1
                    foundPreferences.retailers[i].dateTime = new Date();
                    break;
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
                    break;
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
  
            newUser.userIP = ipAddress

            if(foundPost.brand){
              
              if(foundPost.size){
                
                  newUser.brands = [{brandname: foundPost.brand, size: foundPost.size}]
                  newUser.recentbrands = [{brandname: foundPost.brand, size: foundPost.size}]

              } else {

                  newUser.brands = [{brandname: foundPost.brand}]
                  newUser.recentbrands = [{brandname: foundPost.brand}]
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

            const newPrefs = await IPPreference.create(newUser)

            if(newPrefs){
              donePrefs = true;
            }
        }

        var todaysDate = new Date().toLocaleDateString()

        if(foundPost.postViews?.length > 0){

          if(foundPost.postViews?.some(e=>(e.ipAddress === ipAddress && e.date === todaysDate ))){

              for(let i=0; i< foundPost.postViews.length; i++){

                  if(foundPost.postViews[i].ipAddress === ipAddress && foundPost.postViews[i].date === todaysDate){

                    foundPost.postViews[i].count = foundPost.postViews[i].count + 1
                    foundPost.totalPostViews = foundPost.totalPostViews + 1
                      break;                      
                  }
              }

              const savedLimits = await foundPost.save()

              if(savedLimits && donePrefs){
                return res.status(201).json({ message: 'Success' })
              }
          
          } else {

            foundPost.postViews.push({date: todaysDate, count: 1, ipAddress: ipAddress });
            foundPost.totalPostViews = foundPost.totalPostViews + 1;

              const savedLimits = await foundPost.save()
              if(savedLimits && donePrefs){
                return res.status(201).json({ message: 'Success' })
              }
          }

        } else {

            foundPost.postViews = [{date: todaysDate, count: 1, ipAddress: ipAddress }]
            foundPost.totalPostViews = 1;
            
            const savedLimits = await foundPost.save()
            if(savedLimits && donePrefs){
              return res.status(201).json({ message: 'Success' })
            }
        }
      }

    } catch (err) {

        console.log(err)

        return res.status(401).json({ message: 'Failed' })
    }
  }

  module.exports = { addPostView }
