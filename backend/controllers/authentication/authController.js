const User = require('../../model/User');
const DriverProfile = require('../../model/DriverProfile');
const HostProfile = require('../../model/HostProfile');
const ForexRate = require('../../model/ForexRate');
const BannedUser = require('../../model/BannedUser');
const ExternalWall = require('../../model/ExternalWall');

const UsageLimit = require('../../model/UsageLimit');
const Flags = require('../../model/Flags')

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
        
        if(geoData?.IPv4 && checkUser?.ipAddresses?.some(e=>e.userIP === geoData?.IPv4)){

            return res.status(403).json({ 'message': 'Unauthorized access' });
            
        } else {

            const foundUser = await User.findOne({ email: email })

            if (!foundUser) {

                return res.sendStatus(401); //Unauthorized
            
            } else {

                if(foundUser?.deactivated === true){
                    return res.status(403).json({'message': 'Please check your inbox.' });
                }

                if(foundUser?.checkedMobile === false || foundUser?.currentStage < 3){
                    return res.status(202).json({'message': "Please check your email to verify your phone number and submit a profile. "})
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
                    const foundDriver = await DriverProfile.findOne({_userId: foundUser._id})
                    const foundFlags = await Flags.findOne({_userId: foundUser._id})
            
                    if(match && foundDriver && foundFlags){

                        const roles = Object.values(foundUser.roles).filter(Boolean);
                        
                        const userId = foundUser._id;
                        const firstName = foundUser.firstName;
                        const lastName = foundUser.lastName;
                        const profilePicURL = foundUser.profilePicURL;
                        const currency = foundUser.currency;
                        const currencySymbol = foundUser.currencySymbol;
                        const credits = foundUser.credits;
                        const escrow = foundUser.escrow;
                        const phoneNumber = foundUser.phonePrimary;
                        const appointmentFlags = foundFlags.appointmentFlags;

                        const pushNotifications = foundUser.pushNotifications;
                        const smsNotifications = foundUser.smsNotifications;
                        const emailNotifications = foundUser.emailNotifications;

                        const requestedPayout = foundUser.requestedPayout;
                        const requestedPayoutCurrency = foundUser.requestedPayoutCurrency;
                        const requestedPayoutOption = foundUser.requestedPayoutOption;

                        const j1772ACChecked = foundDriver.j1772ACChecked
                        const ccs1DCChecked = foundDriver.ccs1DCChecked
                        const mennekesACChecked = foundDriver.mennekesACChecked
                        const gbtACChecked = foundDriver.gbtACChecked
                        const ccs2DCChecked = foundDriver.ccs2DCChecked
                        const chademoDCChecked = foundDriver.chademoDCChecked
                        const gbtDCChecked = foundDriver.gbtDCChecked
                        const teslaChecked = foundDriver.teslaChecked

                        foundUser.loginAttempts = 0;

                        var doneProfile = true;
                        var doneRates = false;
                        var FXRates = false;

                        if(currency){

                            const rates = await ForexRate.findOne({admin: "admin"}).select(`${currency}`)
                            if(rates){
                                FXRates = rates;
                                doneRates = true;
                            }
                        } else {
                            doneRates = true;
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
                                        "userId": userId,
                                        "roles": roles
                                    }
                                },
                                process.env.ACCESS_TOKEN_SECRET,
                                { expiresIn: '7d' }
                            );
                
                            const refreshToken = jwt.sign(
                                { "userId": userId },
                                process.env.REFRESH_TOKEN_SECRET,
                                { expiresIn: '30d' }
                            );
                
                            if(refreshToken && accessToken && updatedWall){
                                // Saving refreshToken with current user
                                foundUser.refreshToken = refreshToken;
                                const result = await foundUser.save();
                
                                if(result){
                                    
                                    res.cookie('socketjuicejwt', refreshToken, { 
                                        httpOnly: true, 
                                        secure: true, 
                                        sameSite: 'None', 
                                        maxAge: 30 * 24 * 60 * 60 * 1000 
                                    });
                
                                    // Send authorization role and access token to user
                                    res.status(200).json({ firstName, lastName, userId, roles, accessToken, profilePicURL, phoneNumber,
                                        currency, currencySymbol, pushNotifications, smsNotifications, emailNotifications, credits, escrow,
                                        j1772ACChecked, ccs1DCChecked, mennekesACChecked, ccs2DCChecked, chademoDCChecked, gbtACChecked, 
                                        gbtDCChecked, teslaChecked, requestedPayout, requestedPayoutCurrency, requestedPayoutOption,
                                        appointmentFlags });
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