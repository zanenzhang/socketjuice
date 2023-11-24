const User = require('../../model/User');
const ExternalWall = require('../../model/ExternalWall');
const BannedUser = require('../../model/BannedUser');
const ResetPassToken = require('../../model/ResetPassToken');
const UsageLimit = require('../../model/UsageLimit');
const { sendPassResetConfirmation } = require('../../middleware/mailer');
const bcrypt = require('bcrypt');
const axios = require('axios');
const dotenv = require('dotenv').config()


const handleInputNewPassword = async (req, res) => {
    
    const { userId, hash, pwd, geoData } = req.body

    if(pwd?.length > 48 || pwd?.length < 8){
        return res.status(401).json({message: 'Content does not meet requirements'})
    }

    var updatedWall = false;

    if (hash && userId && pwd) {

        if(geoData){

            const foundWall = await ExternalWall.findOne({userIP:geoData.IPv4})
            if(foundWall){
                if(foundWall.Total_PassResets >= 5){
                    const addIPBan = await BannedUser.updateOne({admin: "admin"},{$push: {ipAddresses: {userIP: geoData.IPv4}}})
                    if(addIPBan){
                        return res.status(403).json({"message":"Operation failed"})  
                    }
                } else {
                    foundWall.Total_PassResets = foundWall.Total_PassResets + 1    
                    const savedWall = await foundWall.save()
                    if(savedWall){
                        updatedWall = true;   
                    }
                }
            } else {
                var newWall = await ExternalWall.create({
                    "userIP": geoData.IPv4,
                    "Total_PassResets": 1
                })
                if(newWall){
                    updatedWall = true;
                }
            }
        } else {
            updatedWall = true;
        }
    } else {

        return res.status(403).json({ 'message': 'Operation failed' });
    }

    checkBan = false;
    
    if(updatedWall && geoData){
        
        const bannedIP = await BannedUser.findOne({admin: "admin", "ipAddresses.userIP": geoData.IPv4})

        if(bannedIP){
        
            return res.status(403).json({ 'message': 'Operation failed' });

        } else {
            checkBan = true;
        }
    } else {
        checkBan = true;
    }

    if(checkBan){

        const saltRounds = 10;

        const foundUser = await User.findOne({_id: userId})
        
        if(foundUser){

            if (!foundUser.active){
                return res.status(400).send({msg:'Please activate your account!'});
            }

            if (foundUser.deactivated){
                return res.status(403).send({msg:'Please check your inbox!'});
            }

            ResetPassToken.findOne({ token: hash, _userId: userId }, function (err, foundToken) {
                // token is not found into database i.e. token may have expired 
                if (!foundToken){
                    return res.status(400).send({msg:'Your reset password link may have expired. Please reclick to get a new reset link!'});
                }
                // if token is found then check valid user 
                else{

                    bcrypt.genSalt(saltRounds, function(err, salt) {

                        bcrypt.hash(pwd, salt, function(err, hashedPwd) {

                            foundUser.password = hashedPwd
                            foundUser.lockedOut = false;

                            foundUser.save( async function(error) {
                                
                                if (error){
                                    return res.status(500).send({msg:err.message});
                                } 

                                const sentemail = await sendPassResetConfirmation({toUser: foundUser.email, firstName: foundUser.firstName})
                                
                                const deletedTokens = await ResetPassToken.deleteMany({ _userId : foundUser._id})
                                
                                if (deletedTokens && sentemail){
                                    return res.status(200).send({msg:'Your password has been reset!'});
                                } else {
                                    return res.status(500).send({msg:err.message});
                                }
                            })
                            
                        })
                    })
                }
            })
        } else {
            return res.status(401).send({msg:'The user cannot be validated!'});
        }
    }
}
     
module.exports = { handleInputNewPassword };
  

