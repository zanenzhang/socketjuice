require('dotenv').config()
const User = require('../../model/User');
const UserProfile = require('../../model/CustomerProfile');
const StoreProfile = require('../../model/HostProfile');
const UsageLimit = require('../../model/UsageLimit');
const PeopleFollowers = require('../../model/Peoplefollowers');
const PeopleFollowing = require('../../model/Peoplefollowing');
const ProductFollowing = require('../../model/Productfollowing');
const StoreFollowers = require('../../model/Storefollowers');
const StoreFollowing = require('../../model/Storefollowing');
const ActivateToken = require('../../model/ActivateToken');
const Contacts = require('../../model/Contacts');
const ActivityLog = require('../../model/ActivityLog');
const NotificationSettings = require('../../model/NotificationSettings');
const Preference = require('../../model/Preference');
const RecentlyViewed = require('../../model/RecentlyViewed');
const RecentlyVisited = require('../../model/RecentlyVisited');
const LastVisited = require('../../model/LastVisited');
const StoreVisitors = require('../../model/StoreVisitors');
const Bookmarks = require('../../model/Bookmark');
const Sharedposts = require('../../model/Sharedpost');
const BoughtProducts = require('../../model/OwnedProducts');
const TaggedProducts = require('../../model/TaggedProducts');
const TogglePost = require('../../model/TogglePost');
const ToggleComment = require('../../model/ToggleComment');
const Communications = require('../../model/Communications');
const Flags = require('../../model/Flags');
const BannedUser = require('../../model/BannedUser');
const BannedProduct = require('../../model/BannedProduct');
const ForexRate = require('../../model/ForexRate');

const { sendVerifiedEmail } = require('../../middleware/mailer')
const alert = require('alert'); 
const axios = require('axios');
const ObjectId  = require('mongodb').ObjectId;

const handleUserActivation = async (req, res) => {

    const userId = req.params.userId;
    const hash = req.params.hash;

    if (!hash || !userId) {
      return res.status(401).json({message: 'The user cannot be validated!'})
    }

    const token = await ActivateToken.findOne({ token: hash })
    // token is not found into database i.e. token may have expired 
    if (!token){

      return res.status(400).send({msg:'Your verification link may have expired. Please click resend to get a new verification link!'});
    
    } else {

      const foundUser = await User.findOne({ _id: userId })

      if(!foundUser || !foundUser._id.toString() === ((token._userId))){

        return res.status(401).send({msg:'We were unable to find a user for this verification. Please register!'});

      } else if (foundUser?.active){

        return res.status(200).send('User has been already verified. Please Login');
      
      } else {

        var checkedAdminUser = false;
        var checkedAdminProduct = false;
        var checkedAdminForex = false;

        if(Object.values(foundUser?.roles).includes(5150)){

          const checkedUser = await BannedUser.findOne({admin: "admin"})
          if(checkedUser){
            checkedAdminUser = true;
          } else {
            let newBannedUsers = new BannedUser({
              admin: "admin",
            });

            const savedBannerUsers = await newBannedUsers.save()
            if(savedBannerUsers){
              checkedAdminUser = true
            }
          }

          const checkedProduct = await BannedProduct.findOne({admin: "admin"})
          if(checkedProduct){
            checkedAdminProduct = true;
          } else {
            let newBannedProducts = new BannedProduct({
              admin: "admin",
            });

            const savedBannedProducts = await newBannedProducts.save()
            if(savedBannedProducts){
              checkedAdminProduct = true
            }
          }

          const checkedForex = await ForexRate.findOne({admin: "admin"})
          if(checkedForex){
            checkedAdminForex = true;
          } else {
            let newAdminForex = new ForexRate({
              admin: "admin",
            });

            const savedAdminForex = await newAdminForex.save()
            if(savedAdminForex){
              checkedAdminForex = true
            }
          }
          
        } else {
          checkedAdminUser = true;
          checkedAdminProduct = true;
          checkedAdminForex = true;
        }

        if(checkedAdminUser && checkedAdminProduct && checkedAdminForex){

          if(Object.values(foundUser.roles).includes(3780)){

            foundUser.active = true;
            const savedUser = await foundUser.save()

            if(savedUser){

              alert("Verified! Your account is now active!"); 

              let peopleFollowing = new PeopleFollowing({
                "_userId": foundUser._id,
              });

              const savedPeopleFollowing = await peopleFollowing.save()

              let productFollowing = new ProductFollowing({
                "_userId": foundUser._id,
              });

              const savedProductFollowing = await productFollowing.save()

              let peopleFollowers = new PeopleFollowers({
                "_userId": foundUser._id,
              });

              const savedPeopleFollowers = await peopleFollowers.save()

              let storeFollowing = new StoreFollowing({
                "_userId": foundUser._id,
              });

              const savedStoreFollowing = await storeFollowing.save()

              let storeFollowers = new StoreFollowers({
                "_userId": foundUser._id,
              });

              const savedStoreFollowers = await storeFollowers.save()

              let bookmarks = new Bookmarks({
                "_userId": foundUser._id,
              });

              const savedBookmarks = await bookmarks.save()

              let sharedposts = new Sharedposts({
                "_userId": foundUser._id,
              });

              const savedSharedposts = await sharedposts.save()

              let boughtProducts = new BoughtProducts({
                "_userId": foundUser._id,
              });

              const savedBoughtProducts = await boughtProducts.save()

              let taggedProducts = new TaggedProducts({
                "_userId": foundUser._id,
              });

              const savedTaggedProducts = await taggedProducts.save()

              let contacts = new Contacts({
                "_userId": foundUser._id,
              });

              const savedContacts = await contacts.save()

              let activities = new ActivityLog({
                "_userId": foundUser._id,
              });

              const savedActivities = await activities.save()

              let preferences = new Preference({
                "_userId": foundUser._id,
              });

              const savedPreferences = await preferences.save()

              let notifications = new NotificationSettings({
                "_userId": foundUser._id,
              });

              const savedNotifications = await notifications.save()

              let storeVisitors = new StoreVisitors({
                "_userId": foundUser._id,
              });

              const savedStoreVisitors = await storeVisitors.save()

              let toggledPosts = new TogglePost({
                "_userId": foundUser._id,
              });

              const savedToggledPosts = await toggledPosts.save()

              let toggledComments = new ToggleComment({
                "_userId": foundUser._id,
              });

              const savedToggledComments = await toggledComments.save()

              let userCommunications = new Communications({
                "_userId": foundUser._id,
              });

              const savedCommunications = await userCommunications.save()

              let userFlags = new Flags({
                "_userId": foundUser._id,
              });

              const savedUserFlags = await userFlags.save()

              // const foundStoreProfile = await StoreProfile.findOne({_userId: foundUser._id})
              // const foundPeopleFollowing = await PeopleFollowing.findOne({_userId: foundUser._id})
              // const foundStoreFollowing = await StoreFollowing.findOne({_userId: foundUser._id})

                // var donePeople = false;
                // var doneStores = false

                // if(foundStoreProfile?.regionCode){

                //   let country = foundStoreProfile?.country.replace(/ /g,"_").toLowerCase();

                //     const regionUser = await User.findOne({'email': `${country}_user@plazamigo.com`})
                    
                //     if(regionUser && foundPeopleFollowing){
                      
                //         foundPeopleFollowing.allPeopleFollowing.push({_followingId: regionUser._id})
                        
                //         const foundStoreFollowers = await StoreFollowers.updateOne({_userId: regionUser._id},{$push:{allStoreFollowers:{_followerId:regionUser._id}}})

                //         const savedPeople = await foundPeopleFollowing.save()

                //         if(savedPeople && foundStoreFollowers){
                //           donePeople = true
                //         }

                //     } else {
                //       donePeople = true
                //     }

                //     let regionCode = foundStoreProfile.regionCode.toLowerCase()
                    
                //     const regionStore = await User.findOne({'email': `${regionCode}_store@plazamigo.com`})
                    
                //     if(regionStore && foundStoreFollowing){
                      
                //         foundStoreFollowing.allStoreFollowing.push({_followingId: regionStore._id})

                //         const foundStoreFollowers = await StoreFollowers.updateOne({_userId: regionStore._id},{$push:{allStoreFollowers:{_followerId:regionStore._id}}})

                //         const savedStores = await foundStoreFollowing.save()

                //         if(savedStores && foundStoreFollowers){
                //           doneStores = true
                //         }

                //     } else {
                //       doneStores = true
                //     }

                // } else {

                //   donePeople = true;
                //   doneStores = true;
                // }

                //donePeople && doneStores

                if(savedPeopleFollowing && savedProductFollowing &&
                    savedPeopleFollowers && savedStoreFollowing && savedStoreFollowers && savedBookmarks && savedSharedposts
                    && savedBoughtProducts && savedTaggedProducts && savedContacts && savedActivities
                    && savedPreferences && savedNotifications && savedStoreVisitors && savedToggledPosts
                    && savedToggledComments && savedCommunications && savedUserFlags ){
                  
                  const deletedTokens = await ActivateToken.deleteMany( { _userId : foundUser._id} )

                  if(deletedTokens){
                    sendVerifiedEmail({ toUser: foundUser.email })

                    return res.redirect(process.env.LOGIN_PAGE);
                }
              }
            }

        } else if (Object.values(foundUser?.roles).includes(2001)){

          foundUser.active = true;
          const savedUser = await foundUser.save() 
          
          if(savedUser){

              let peopleFollowing = new PeopleFollowing({
                "_userId": foundUser._id,
              });

              const savedPeopleFollowing = await peopleFollowing.save()

              let productFollowing = new ProductFollowing({
                "_userId": foundUser._id,
              });

              const savedProductFollowing = await productFollowing.save()

              let peopleFollowers = new PeopleFollowers({
                "_userId": foundUser._id,
              });

              const savedPeopleFollowers = await peopleFollowers.save()

              let storeFollowing = new StoreFollowing({
                "_userId": foundUser._id,
              });

              const savedStoreFollowing = await storeFollowing.save()

              let storeFollowers = new StoreFollowers({
                "_userId": foundUser._id,
              });

              const savedStoreFollowers = await storeFollowers.save()

              let sharedposts = new Sharedposts({
                "_userId": foundUser._id,
              });

              const savedSharedposts = await sharedposts.save()

              let bookmarks = new Bookmarks({
                "_userId": foundUser._id,
              });

              const savedBookmarks = await bookmarks.save()

              let boughtProducts = new BoughtProducts({
                "_userId": foundUser._id,
              });

              const savedBoughtProducts = await boughtProducts.save()

              let taggedProducts = new TaggedProducts({
                "_userId": foundUser._id,
              });

              const savedTaggedProducts = await taggedProducts.save()

              let contacts = new Contacts({
                "_userId": foundUser._id,
              });

              const savedContacts = await contacts.save()

              let activities = new ActivityLog({
                "_userId": foundUser._id,
              });

              const savedActivities = await activities.save()

              let preferences = new Preference({
                "_userId": foundUser._id,
              });

              const savedPreferences = await preferences.save()

              let notifications = new NotificationSettings({
                "_userId": foundUser._id,
              });

              const savedNotifications = await notifications.save()

              let recentlyViewed = new RecentlyViewed({
                "_userId": foundUser._id,
              });

              const savedRecentlyViewed = await recentlyViewed.save()

              let recentlyVisited = new RecentlyVisited({
                "_userId": foundUser._id,
              });

              const savedRecentlyVisited = await recentlyVisited.save()

              let lastVisited = new LastVisited({
                "_userId": foundUser._id,
              });

              const savedLastVisited = await lastVisited.save()

              let toggledPosts = new TogglePost({
                "_userId": foundUser._id,
              });

              const savedToggledPosts = await toggledPosts.save()

              let toggledComments = new ToggleComment({
                "_userId": foundUser._id,
              });

              const savedToggledComments = await toggledComments.save()

              let userFlags = new Flags({
                "_userId": foundUser._id,
              });

              const savedUserFlags = await userFlags.save()

              let userCommunications = new Communications({
                "_userId": foundUser._id,
              });

              const savedCommunications = await userCommunications.save()

                // const foundUserProfile = await UserProfile.findOne({_userId: foundUser._id})
                // const foundPeopleFollowing = await PeopleFollowing.findOne({_userId: foundUser._id})
                // const foundStoreFollowing = await StoreFollowing.findOne({_userId: foundUser._id})

                // var donePeople = false;
                // var doneStores = false;

                // if(foundUserProfile?.regionCode){

                //   let country = foundUserProfile?.country.replace(/ /g,"_").toLowerCase();

                //   const regionUser = await User.findOne({'email': `${country}_user@plazamigo.com`})
                  
                //   if(regionUser && foundPeopleFollowing){
                    
                //     foundPeopleFollowing.allPeopleFollowing.push({_followingId: regionUser._id})
                    
                //     const foundPeopleFollowers = await PeopleFollowers.updateOne({_userId: regionUser._id},{$push:{allPeopleFollowers:{_followerId:regionUser._id}}})

                //     const savedPeople = await foundPeopleFollowing.save()

                //     if(savedPeople && foundPeopleFollowers){
                //       donePeople = true
                //     }
                //   } else {
                //     donePeople = true
                //   }

                //   let regionCode = foundUserProfile.regionCode.toLowerCase()

                //   const regionStore = await User.findOne({'email': `${regionCode}_store@plazamigo.com`})
                  
                //   if(regionStore && foundStoreFollowing){
                    
                //     foundStoreFollowing.allStoreFollowing?.push({_followingId: regionStore._id})

                //     const foundPeopleFollowers = await PeopleFollowers.updateOne({_userId: regionStore._id},{$push:{allPeopleFollowers:{_followerId:regionStore._id}}})

                //     const savedStores = await foundStoreFollowing.save()

                //     if(savedStores && foundPeopleFollowers){
                //       doneStores = true
                //     }
                //   } else {
                //     doneStores = true
                //   }
                
                // } else {

                //   donePeople = true;
                //   doneStores = true;
                // } 

                //donePeople && doneStores

                if(savedPeopleFollowing && savedProductFollowing
                    && savedPeopleFollowers && savedStoreFollowing && savedStoreFollowers && savedBookmarks 
                    && savedSharedposts && savedBoughtProducts && savedTaggedProducts && savedContacts
                    && savedActivities && savedPreferences && savedNotifications && savedRecentlyViewed
                    && savedRecentlyVisited && savedLastVisited && savedToggledPosts && savedToggledComments
                    && savedUserFlags && savedCommunications ){

                  const deletedTokens = await ActivateToken.deleteMany( { _userId : foundUser._id})
              
                  if(deletedTokens){

                    sendVerifiedEmail({ toUser: foundUser.email })
                    alert("Verified! Your account is now active!"); 

                    return res.redirect(process.env.LOGIN_PAGE);
                  }
              }
            }
          }

        }
      }   
    };
  }

  const verifyRecaptcha = async (req, res) => {

    const {recaptchaToken} = req.body;
    const checkHuman = await axios.post(
      `https://www.google.com/recaptcha/api/siteverify?secret=${process.env.GOOGLE_RECAPTCHA_SECRET_KEY}&response=${recaptchaToken}`
      );

    if(checkHuman.status === 200){
      return res.send("human")
    } else {
      return res.send("robot")
    }
  }


module.exports = { handleUserActivation, verifyRecaptcha };
  