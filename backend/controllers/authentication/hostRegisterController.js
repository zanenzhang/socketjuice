const User = require('../../model/User');
const HostProfile = require('../../model/HostProfile');
const DriverProfile = require('../../model/DriverProfile');
const BannedUser = require('../../model/BannedUser');
const ActivateToken = require('../../model/ActivateToken');
const ExternalWall = require('../../model/ExternalWall');
const UsageLimit = require('../../model/UsageLimit');

const bcrypt = require('bcrypt');
const crypto = require('crypto');
const { sendConfirmationEmail, sendHostRecordEmail } = require('../../middleware/mailer')
const axios = require('axios');
const dotenv = require('dotenv').config()
const languageList = require('../languageCheck')


const handleNewHost = async (req, res) => {
    
    var { email, pwd, firstName, lastName, address, city, region, long, lat,
        regionCode, country, birthdate, recapToken, geoData } = req.body;

    if (!email || !pwd || !firstName || !lastName || !recapToken || !address || !birthdate
         || !city || !region || !regionCode || !country ){
        return res.status(400).json({ 'message': 'Missing required fields!' });
    } 

    if(email?.length > 48 || firstName?.length > 48 || lastName?.length > 48 || pwd?.length < 8 || pwd?.length > 48 
        || address?.length > 48  || city?.length > 48  || region?.length > 48 || regionCode?.length > 48 || country?.length > 48 ){
            return res.status(400).json({ 'message': 'Content does not meet requirements' });
        }

    long = Number(long)
    lat = Number(lat)

    var textToCheck = email.concat(" ", firstName," ", lastName, " ", address, " ", city, " ", region, " ", regionCode, " ", country).toLowerCase();

    for(let i=0; i < languageList.length; i++){
        if(textToCheck.indexOf(languageList[i]) !== -1){
            return res.status(403).json({"message":"Inappropriate content"})  
        }
    }

    const checkBan = await BannedUser.findOne({admin: "admin"})

    if(geoData?.IPv4 && checkBan?.ipAddresses?.some(e=>e.userIP === geoData?.IPv4)){

        return res.status(403).json({"message":"Please check your inbox"})  
    
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
    
        if(!safeIP && checkHuman.status !== 200){
    
            if(foundWall){

                foundWall.Total_GoogleRecaptcha = foundWall.Total_GoogleRecaptcha + 1
                foundWall.Total_Registrations = foundWall.Total_Registrations + 1

                if(foundWall.Total_GoogleRecaptcha >= 3 || foundWall.Total_Registrations >= 10){
                    const addIPBan = await BannedUser.updateOne({admin: "admin"}, {$push: {ipAddresses: {userIP: geoData.IPv4}}})
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

                return res.status(403).json({"message":"Please check your inbox"})  

            } else {

                try {

                    const duplicate = await User.findOne({ email: email }).exec();
                    if (duplicate) return res.status(409).json({ 'message': 'Email address already in use!' }); //Conflict 
            
                    //encrypt the password
                    const saltRounds = 10;
                    const token = crypto.randomBytes(16).toString('hex')
        
                    bcrypt.genSalt(saltRounds, function(err, salt) {
                        bcrypt.hash(pwd, salt, function(err, hashedPwd) {
                            
                            //create and store the new user
                            var newUser = new User({
                                "email": email,
                                "password": hashedPwd,
                                "firstName": firstName,
                                "lastName": lastName,
                                "roles": {User: 2001, Manager: 3780},
                                "privacySetting": 1,
                                "primaryGeoData": geoData,
                            });
        
                            newUser.save( async function(err, savedUser){

                                var dateObject = new Date(birthdate)
        
                                const actToken = await ActivateToken.create({
                                    "_userId": savedUser._id,
                                    "token": token
                                })

                                const newDriverProfile = await DriverProfile.create({
                                    "_userId": savedUser._id,
                                    "city": city,
                                    "region": region,
                                    "regionCode": regionCode,
                                    "country": country,
                                    "birthDate": dateObject
                                })
                                
                                const newHostProfile = await HostProfile.create({
                                    "_userId": savedUser._id,
                                    "address": address,
                                    "city": city,
                                    "region": region,
                                    "regionCode": regionCode,
                                    "country": country,
                                    "location": {type: "Point", coordinates: [long, lat]}
                                })
        
                                var updatedWall = null
                                if(!foundWall){
                                    var newWall = await ExternalWall.create({
                                        "userIP": geoData?.IPv4,
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
        
                                if(actToken && newHostProfile && newDriverProfile && updatedWall && newLimits){
                                    
                                    const success1 = await sendConfirmationEmail( {toUser: email, userId: savedUser._id , hash: token, firstName: firstName })
                                    const success2 = await sendHostRecordEmail( { userId: savedUser._id, firstName, lastName, address, city, region: regionCode, country} )
        
                                    if(success1 && success2){
                                        res.status(201).json({'Success': `New account created! Please check your email to activate! ` });
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

module.exports = { handleNewHost };