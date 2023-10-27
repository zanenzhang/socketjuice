const User = require('../../model/User');
const DriverProfile = require('../../model/DriverProfile');
const BannedUser = require('../../model/BannedUser');
const ActivateToken = require('../../model/ActivateToken');
const ExternalWall = require('../../model/ExternalWall');
const UsageLimit = require('../../model/UsageLimit');

const bcrypt = require('bcrypt');
const crypto = require('crypto');
const { sendConfirmationEmail } = require('../../middleware/mailer')
const axios = require('axios');
const dotenv = require('dotenv').config()
const languageList = require('../languageCheck');


const handleNewUser = async (req, res) => {
    
    const { email, pwd, username, geoData, region, regionCode, country, birthdate, recapToken } = req.body;
    
    if (!email || !pwd || !username || !recapToken || !birthdate || !geoData || !region || !regionCode || !country){
        return res.status(400).json({ 'message': 'Missing required fields!' });
    } 

    if(email?.length > 48 || username?.length > 48 || pwd?.length < 8 || pwd?.length > 48 || region?.length > 48
    || regionCode?.length > 48 || country?.length > 48 || birthdate?.length > 48 ){
        return res.status(400).json({ 'message': 'Content does not meet requirements' });
    }

    var textToCheck = email.concat(" ", username, " ", region, " ", regionCode, " ", country, " ", birthdate).toLowerCase();

    for(let i=0; i < languageList.length; i++){
        if(textToCheck.indexOf(languageList[i]) !== -1){
            return res.status(403).json({"message":"Inappropriate content"})  
        }
    }
    
    const checkUser = await BannedUser.findOne({admin: "admin"})
    
    if(checkUser?.ipAddresses?.some(e=>e.userIP === geoData?.IPv4)){

        return res.status(403).json({"message":"Operation failed"})          

    } else {

        var ipSafeList = ['209.141.138.201']
        var safeIP = false;

        if(ipSafeList.includes(geoData?.IPv4)){
            safeIP = true;
        }

        const foundWall = await ExternalWall.findOne({userIP: geoData?.IPv4})

        const checkHuman = await axios.post(
            `https://www.google.com/recaptcha/api/siteverify?secret=${process.env.GOOGLE_RECAPTCHA_SECRET_KEY}&response=${recapToken}`
            );
      
        if(!safeIP && checkHuman?.status !== 200){
            
            if(foundWall){

                foundWall.Total_GoogleRecaptcha = foundWall.Total_GoogleRecaptcha + 1
                foundWall.Total_Registrations = foundWall.Total_Registrations + 1
                
                if(foundWall.Total_GoogleRecaptcha >= 3 || foundWall.Total_Registrations >= 10){
                    const addIPBan = await BannedUser.updateOne({admin: "admin"},{$push: {ipAddresses: {userIP: geoData.IPv4}}})
                    if(addIPBan){
                        return res.status(403).json({"message":"Failed recaptcha"})  
                    }
                }

            } else {

                const newWall = await ExternalWall.create({userIP: geoData.IPv4, Total_GoogleRecaptcha: 1, 
                    Total_LoginAttempts: 0, Total_LockedLoginAttempts:0, Total_Registrations: 1})

                if(newWall){
                    return res.status(403).json({"message":"Failed recaptcha"})          
                }
            }
        
        } else {

            if(!safeIP && foundWall?.Total_Registrations >= 10){

                const addIPBan = await BannedUser.updateOne({admin: "admin"},{$push: {ipAddresses: {userIP: geoData.IPv4}}})
                if(addIPBan){
                    return res.status(403).json({"message":"Failed recaptcha"})  
                }

            } else {

                try {

                    const duplicate = await User.findOne({ email: email }).exec();
                    if (duplicate) return res.status(409).json({ 'message': 'Email address already in use!' }); //Conflict 
            
                    const duplicateUsername = await User.findOne({username: username }).exec();
                    if (duplicateUsername) return res.status(406).json({ 'message': 'Username already taken!' });
    
                    //encrypt the password
                    const saltRounds = 10;
                    const token = crypto.randomBytes(16).toString('hex')
        
                    bcrypt.genSalt(saltRounds, function(err, salt) {
                        bcrypt.hash(pwd, salt, function(err, hashedPwd) {

                            var currency = 'CAD';

                            if(country === 'Australia'){

                                currency = 'AUD'

                            } else if (country === 'Japan'){
                                
                                currency = 'JPY'
                            
                            } else if (country === 'United States'){
                                
                                currency = 'USD'
                            
                            } else if (country === 'United Kingdom'){
                                
                                currency = 'GBP'
                            } 
                            
                            //create and store the new user
                            var newUser = new User({
                                "email": email,
                                "password": hashedPwd,
                                "username": username,
                                "roles": {User: 2001},
                                "privacySetting": 1,
                                "primaryGeoData": geoData,
                                "currency": currency
                            });
        
                            newUser.save( async function(err, savedUser){
        
                                if(err){
                                    return res.status(401).json({'Message:': 'Account creation failed!'})
                                }
                                    
                                var dateObject = new Date(birthdate)
        
                                const actToken = await ActivateToken.create({
                                    "_userId": savedUser._id,
                                    "token": token
                                })
        
                                const newDriverProfile = await DriverProfile.create({
                                    "_userId": savedUser._id,
                                    "username": username,
                                    "region": region,
                                    "regionCode": regionCode,
                                    "country": country,
                                    "birthDate": dateObject
                                })
    
                                var updatedWall = null
                                if(!foundWall){
                                    var newWall = await ExternalWall.create({
                                        "userIP": geoData.IPv4,
                                        "Total_Registrations": 1
                                    })
                                    if(newWall){
                                        updatedWall = true;
                                    }
                                } else {
                                    foundWall.Total_Registrations = foundWall.Total_Registrations + 1
                                    const savedWall = await foundWall.save()
                                    if(savedWall){
                                        updatedWall = true;
                                    }
                                }

                                const newLimits = await UsageLimit.create({
                                    "_userId": savedUser._id
                                })
                                
                                if(actToken && newDriverProfile && updatedWall && newLimits){
                                    //spinning wheel here
                                    const success = await sendConfirmationEmail( {toUser: email, userId: savedUser._id , hash: token })
                                    if(success){
                                        res.status(201).json({ 'Success': `New account created! Please check your email to activate! ` });
                                    } else {
                                        res.status(401).json({'Message:': 'Account creation failed!'})
                                    }
                                }
                            })
                        });
                    });
        
                } catch (err) {
        
                    res.status(500).json({ 'Message': err.message });
                }
            }
        }
    }
}

module.exports = { handleNewUser };