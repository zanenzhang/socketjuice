const User = require('../../model/User');
const ResetPassToken = require('../../model/ResetPassToken');
const BannedUser = require('../../model/BannedUser');
const ExternalWall = require('../../model/ExternalWall');
const UsageLimit = require('../../model/UsageLimit');

const crypto = require('crypto');
const alert = require('alert'); 
const { sendResetPasswordEmail } = require('../../middleware/mailer')
const axios = require('axios');
const dotenv = require('dotenv').config()


const handleResetPassword = async (req, res) => {

    var { email, recapToken, geoData } = req.body;

    if (!email || !recapToken ) return res.status(400).json({ 'message': 'Missing required information!' });
    if (email?.length > 48  ) return res.status(400).json({ 'message': 'Content does not meet requirements' });
    
    const bannedIP = await BannedUser.findOne({admin: "admin"})

    // if(!geoData){
    //     geoData = {"IPv4": ""}
    // }

    if(bannedIP){

        foundWall = ""

        if(geoData?.IPv4){

            if(bannedIP?.ipAddresses?.some(e=>e.userIP === geoData.IPv4)){
                return res.status(403).json({ 'message': 'Operation failed' });
            }

            foundWall = await ExternalWall.findOne({userIP:geoData.IPv4})
        
        } 
    
        const checkHuman = await axios.post(
            `https://www.google.com/recaptcha/api/siteverify?secret=${process.env.GOOGLE_RECAPTCHA_SECRET_KEY}&response=${recapToken}`
            );

        if(checkHuman?.status !== 200 && geoData?.IPv4){

            if(foundWall){

                foundWall.Total_GoogleRecaptcha = foundWall.Total_GoogleRecaptcha + 1
                
                if(foundWall.Total_GoogleRecaptcha >= 3){
                    const addIPBan = await BannedUser.updateOne({admin: "admin"}, {$push: {ipAddresses: {userIP: geoData.IPv4}}})
                    if(addIPBan){
                        return res.status(403).json({"message":"Failed recaptcha"})  
                    }
                }

            } else if (geoData?.IPv4) {
                const newWall = await ExternalWall.create({userIP: geoData.IPv4, Total_GoogleRecaptcha: 1, 
                    Total_LoginAttempts: 1, Total_LockedLoginAttempts:0})

                if(newWall){
                    return res.status(403).json({"message":"Failed recaptcha"})          
                }
            }
        
        } else {

            var updatedWall = false;
            
            if(foundWall){

                if(foundWall.Total_PassResets >= 5){
                    const addIPBan = await BannedUser.updateOne({admin: "admin"},{$push: {ipAddresses: {userIP: geoData.IPv4}}})
                    if(addIPBan){
                        return res.status(403).json({"message":"Failed recaptcha"})  
                    }
                } else {
                    foundWall.Total_PassResets = foundWall.Total_PassResets + 1    
                    const savedWall = await foundWall.save()
                    if(savedWall){
                        updatedWall = true;   
                    }
                }
            } else if(geoData.IPv4) {
                var newWall = await ExternalWall.create({
                    "userIP": geoData.IPv4,
                    "Total_PassResets": 1
                })
                if(newWall){
                    updatedWall = true;
                }
            } else {
                updatedWall = true;
            }

            if(updatedWall){

                User.findOne({ email: email }).then(function (foundUser) {

                    if (!foundUser){
                        return res.status(400).send({msg:err.message});
                    }
            
                    if (!foundUser.active){
                        return res.status(401).json({ 'message': 'Please activate your account!' });
                    }
            
                    if(foundUser.deactivated){
                        return res.status(403).json({ 'message': 'Please check your inbox!' });
                    }
                    
                    ResetPassToken.findOne({ _userId: foundUser._id }).then(function (resetTok){
            
                        const newToken = crypto.randomBytes(16).toString('hex')
                        const newDate = Date.now() + 600000
            
                        if (resetTok){
            
                            ResetPassToken.updateOne( 
                                {_userId: foundUser._id},
                                {$set: {
                                "token": newToken, 
                                "expireAt": newDate }
                                },  async function(error){
                                    if (error){
                                        return res.status(500).send({msg:err.message});
                                    } else {
                                        const updatedLimits = await UsageLimit.updateOne({_userId: foundUser._id},{$inc: {passwordResetRequests: 1}})
                                        if(updatedLimits){
                                            sendResetPasswordEmail( {toUser: email, firstName: foundUser.firstName, userId:foundUser._id, hash: newToken })
                                            return res.status(201).json({ 'message': 'Please check your email to reset your password!' });    
                                        }
                                    }
                                })
            
                        } else {
            
                            const resetToken = new ResetPassToken({"_userId": foundUser.id, "token": newToken})
                            resetToken.save(async function(err){
                                if (err) { 
                                    return res.status(500).send({msg:err.message});
                                }

                                const sentemail = await sendResetPasswordEmail( {toUser: email, firstName: foundUser.firstName, userId:foundUser._id, hash: newToken })

                                if(sentemail){
                                    return res.status(201).json({ 'message': 'Please check your email to reset your password!' });
                                }
                            })
                        }
                    }) 
                })
            }
        }
    }
};

module.exports = { handleResetPassword };