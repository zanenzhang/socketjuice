require('dotenv').config()
const User = require('../../model/User');
const DriverProfile = require('../../model/DriverProfile');
const HostProfile = require('../../model/HostProfile');
const UsageLimit = require('../../model/UsageLimit');

const ActivateToken = require('../../model/ActivateToken');
const ActivityLog = require('../../model/ActivityLog');
const NotificationSettings = require('../../model/NotificationSettings');

const Bookmarks = require('../../model/Bookmark');
const Communications = require('../../model/Communications');
const Flags = require('../../model/Flags');
const BannedUser = require('../../model/BannedUser');
const ForexRate = require('../../model/ForexRate');

const alert = require('alert'); 
const axios = require('axios');
const ObjectId  = require('mongodb').ObjectId;
const crypto = require('crypto');


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
        var checkedAdminForex = false;

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

        if(checkedAdminUser && checkedAdminForex){

          if(Object.values(foundUser.roles).includes(3780)){

            foundUser.active = true;
            const savedUser = await foundUser.save()

            if(savedUser){

              alert("Thank you! Your email has been verified. Please verify your phone number and create a profile."); 

              let bookmarks = new Bookmarks({
                "_userId": foundUser._id,
              });

              const savedBookmarks = await bookmarks.save()

              let activities = new ActivityLog({
                "_userId": foundUser._id,
              });

              const savedActivities = await activities.save()

              let notifications = new NotificationSettings({
                "_userId": foundUser._id,
              });

              const savedNotifications = await notifications.save()

              let userCommunications = new Communications({
                "_userId": foundUser._id,
              });

              const savedCommunications = await userCommunications.save()

              let userFlags = new Flags({
                "_userId": foundUser._id,
              });

              const savedUserFlags = await userFlags.save()

                if(savedBookmarks && savedActivities && savedNotifications && savedCommunications && savedUserFlags ){

                  return res.redirect(`${process.env.MOBILE_VERIFY_PAGE}?id=${foundUser._id}&hash=${token}`);        
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
  