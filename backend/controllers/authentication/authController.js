const User = require('../../model/User');
const UserProfile = require('../../model/DriverProfile');
const HostProfile = require('../../model/HostProfile');
const ForexRate = require('../../model/ForexRate');
const BannedUser = require('../../model/BannedUser');
const ExternalWall = require('../../model/ExternalWall');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const handleLogin = async (req, res) => {

    var { email, pwd, geoData } = req.body;

    if (!email || !pwd ) {
        return res.status(400).json({ 'message': 'Missing required input.' });
    }

    try {

        const checkUser = await BannedUser.findOne({admin:"admin"})

        if(!geoData){
            geoData = {"IPv4": ""}
        }
        
        if(geoData.IPv4 && checkUser?.ipAddresses?.some(e=>e.userIP === geoData.IPv4)){

            return res.status(403).json({ 'message': 'Unauthorized access' });
            
        } else {

            const foundUser = await User.findOne({ email: email })

            if (!foundUser) {

                return res.sendStatus(401); //Unauthorized
            
            } else {

                if(foundUser?.deactivated === true){
                    return res.status(403).json({ 'message': 'Please check your inbox.' });
                }

                if(foundUser?.checkedMobile === false){
                    return res.status(202).json({'message': "Please provide a mobile number for verification", userId: foundUser._id})
                }
        
                if(geoData?.IPv4 !== ""){
        
                    const foundWall = await ExternalWall.findOne({userIP: geoData.IPv4})
        
                    if(foundUser?.lockedOut === true){
        
                        if(foundWall){
                            foundWall.Total_LockedLoginAttempts = foundWall.Total_LockedLoginAttempts + 1
        
                            if(foundWall.Total_LockedLoginAttempts >=3){
                                const addIPBan = await BannedUser.updateOne({admin:"admin"},{$push: {ipAddresses: {userIP: geoData.IPv4}}})
                                if(addIPBan){
                                    return res.status(403).json({ 'message': 'Please check your inbox.' });
                                }
                            } else {
                                return res.status(401).json({'message': 'You have been locked out of your account, please reset your password'})
                            }
                        
                        } else {
                            return res.status(401).json({'message': 'You have been locked out of your account, please reset your password'})
                        }
                    }
                
                } else {

                    if (!foundUser.active) return res.status(400).json({ 'message': 'Please activate your account! The activation email has been sent, please visit your inbox.' });
        
                    const match = await bcrypt.compare(pwd, foundUser.password);
            
                    if (match) {

                        const roles = Object.values(foundUser.roles).filter(Boolean);
                        const userId = foundUser._id;
                        const username = foundUser.username;
                        const profilePicURL = foundUser.profilePicURL;
                        const privacySetting = foundUser.privacySetting;
                        const currency = foundUser.currency;
                        const showFXPriceSetting = foundUser.showFXPriceSetting;
                        const blockedUsers = foundUser.blockedUsers;
                        const credits = foundUser.credits;
                        const gender = foundUser.gender;
                        const retailerIds = foundUser.initialRetailers
                        const genderSet = foundUser.genderSet;

                        foundUser.loginAttempts = 0;

                        var lessMotion = null;
                        var pushNotifications = null;
                        var userTheme = null;
                        var FXRates = null;

                        var birthDate = null;
                        var city = null;
                        var region = null;
                        var country = null;

                        var doneProfile = false;
                        var doneRates = false;

                        if(currency){

                            const rates = await ForexRate.findOne({admin: "admin"}).select(`${currency}`)
                            if(rates){
                                FXRates = rates;
                                doneRates = true;
                            }
                        }

                        if(Object.values(foundUser?.roles).includes(3780)){

                            const foundHostProfile = await HostProfile.findOne({_userId: foundUser._id})

                            if(foundHostProfile){
                                lessMotion = foundHostProfile.lessMotion;
                                pushNotifications = foundHostProfile.pushNotifications;
                                userTheme = foundHostProfile.userTheme;

                                city = foundHostProfile.city;                            
                                region = foundHostProfile.region;
                                country = foundHostProfile.country;

                                doneProfile = true;
                            }
                        
                        } else {

                            const foundUserProfile = await DriverProfile.findOne({_userId: foundUser._id})

                            if(foundUserProfile){
                                lessMotion = foundUserProfile.lessMotion;
                                pushNotifications = foundUserProfile.pushNotifications;
                                userTheme = foundUserProfile.userTheme;
                                birthDate = foundUserProfile.birthDate;

                                if(foundUser.preferredCity !== 'Select All' && foundUser.preferredRegion !== 'Select All' && foundUser.preferredCountry !== 'Select All'){
                                    
                                    city = foundUser.preferredCity
                                    region = foundUser.preferredRegion;
                                    country = foundUser.preferredCountry;

                                } else {
                                    
                                    city= "Select All"
                                    region = foundUserProfile.region;
                                    country = foundUserProfile.country;
                                }
                                
                                doneProfile = true;
                            }
                        }
            
                        if(doneProfile && doneRates){

                            var updatedWall = false;
            
                            if(geoData?.IPv4){
                
                                const foundWall = await ExternalWall.findOne({userIP: geoData.IPv4})
                
                                if(foundWall){
                                    foundWall.Total_LoginAttempts = 0;
                                    foundWall.Total_LockedLoginAttempts = 0;
                                    foundWall.Total_PassResets = 0;
                                    
                                    const savedWall = await foundWall.save()
                                    
                                    if(savedWall){
                                        updatedWall = true;
                                    }
                
                                } else {
                                    updatedWall = true;
                                }
                                
                            } else {
                                updatedWall = true;
                            }
                            
                            const accessToken = jwt.sign(
                                {
                                    "UserInfo": {
                                        "username": username,
                                        "userId": userId,
                                        "roles": roles
                                    }
                                },
                                process.env.ACCESS_TOKEN_SECRET,
                                { expiresIn: '7d' }
                            );
                
                            const refreshToken = jwt.sign(
                                { "username": username, "userId": userId },
                                process.env.REFRESH_TOKEN_SECRET,
                                { expiresIn: '30d' }
                            );
                
                            if(refreshToken && accessToken && updatedWall){
                                // Saving refreshToken with current user
                                foundUser.refreshToken = refreshToken;
                                const result = await foundUser.save();
                
                                if(result){
                                    
                                    res.cookie('purchiesjwt', refreshToken, { 
                                        httpOnly: true, 
                                        secure: true, 
                                        sameSite: 'None', 
                                        maxAge: 30 * 24 * 60 * 60 * 1000 
                                    });
                
                                    // Send authorization role and access token to user
                                    res.status(200).json({ username, roles, userId, accessToken, profilePicURL, privacySetting,
                                        currency, showFXPriceSetting, lessMotion, pushNotifications, birthDate,
                                        userTheme, blockedUsers, FXRates, city, region, country, credits, 
                                        gender, retailerIds, genderSet });
                                }
                            }
                        }
                        
                    } else {
            
                        if(geoData?.IPv4 !== ''){
            
                            const foundWall = await ExternalWall.findOneAndUpdate({userIP: geoData?.IPv4},{$inc: {Total_LoginAttempts: 1}})
                        
                            if(foundWall){
            
                                if(foundWall.Total_LoginAttempts >= 10){
                                    
                                    const addUserBan = await BannedUser.updateOne({admin: "admin"},{$push: {ipAddresses: {userIP: geoData.IPv4}}})
            
                                    if(addUserBan){
            
                                        if(foundUser.loginAttempts >= 5){
                                            foundUser.lockedOut = true;
                                        } else {
                                            foundUser.loginAttempts = foundUser.loginAttempts + 1
                                        }
                        
                                        const savedUser = await foundUser.save()
                                        const savedWall = await foundWall.save()
                        
                                        if(savedUser && savedWall){
                                            res.sendStatus(401);        
                                        }
                                    }
                                    
                                } else {
            
                                    if(foundUser.loginAttempts >= 5){
                                        foundUser.lockedOut = true;
                                    } else {
                                        foundUser.loginAttempts = foundUser.loginAttempts + 1
                                    }
                    
                                    const savedUser = await foundUser.save()
                                    const savedWall = await foundWall.save()
                    
                                    if(savedUser && savedWall){
                                        res.sendStatus(401);        
                                    }
                                }             
                            } else {
                                res.sendStatus(401);        
                            }
            
                        } else {
            
                            if(foundUser.loginAttempts >= 5){
                                foundUser.lockedOut = true;
                            } else {
                                foundUser.loginAttempts = foundUser.loginAttempts + 1
                            }
            
                            const savedUser = await foundUser.save()
            
                            if(savedUser){
                                res.sendStatus(401);        
                            }
                        }
                    }
                }
            }
        }

    } catch (err){

        console.log(err)
        return res.status(402)
    }
}

module.exports = { handleLogin };