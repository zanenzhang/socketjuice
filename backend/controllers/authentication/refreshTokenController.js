const User = require('../../model/User');
const DriverProfile = require('../../model/DriverProfile');
const HostProfile = require('../../model/HostProfile');
const ForexRate = require('../../model/ForexRate');
const jwt = require('jsonwebtoken');

const handleRefreshToken = async (req, res) => {
    const cookies = req.cookies;
    if (!cookies?.socketjuicejwt) return res.sendStatus(401);
    const refreshToken = cookies.socketjuicejwt;

    const foundUser = await User.findOne({ refreshToken: refreshToken });
    if (!foundUser){ 
        return res.sendStatus(403); //Forbidden 
        // evaluate jwt 

    } else {

        jwt.verify(
            refreshToken,
            process.env.REFRESH_TOKEN_SECRET,

            async (err, decoded) => {
                if (err || foundUser.username !== decoded.username) return res.sendStatus(403);
                
                const roles = Object.values(foundUser.roles);
                const username = foundUser.username
                const userId = foundUser._id;
                const profilePicURL = foundUser.profilePicURL
                const privacySetting = foundUser.privacySetting
                const currency = foundUser.currency
                const currencySymbol = foundUser.currencySymbol

                const blockedUsers = foundUser.blockedUsers
                const credits = foundUser.credits

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

                        if (foundUser.preferredCity !== 'Select All') {
                            city = foundUser.preferredCity
                        } else if(foundHostProfile.city){
                            city = foundHostProfile.city
                        } else {
                            city = ''
                        }

                        if(foundUser.preferredRegion !== 'Select All'){
                            region = foundUser.preferredRegion;
                        } else {
                            region = foundHostProfile.region;
                        }
                        
                        if(foundUser.preferredCountry !== 'Select All'){
                            country = foundUser.preferredCountry;
                        } else {
                            country = foundHostProfile.country;
                        }

                        doneProfile = true;
                    }
                
                } else {

                    const foundUserProfile = await DriverProfile.findOne({_userId: foundUser._id})

                    if(foundUserProfile){
                        lessMotion = foundUserProfile.lessMotion;
                        pushNotifications = foundUserProfile.pushNotifications;
                        userTheme = foundUserProfile.userTheme;
                        birthDate = foundUserProfile.birthDate;

                        if (foundUser.preferredCity !== 'Select All') {
                            city = foundUser.preferredCity
                        } else if(foundUserProfile.city){
                            city = foundUserProfile.city
                        } else {
                            city = ''
                        }

                        if(foundUser.preferredRegion !== 'Select All'){
                            region = foundUser.preferredRegion;
                        } else {
                            region = foundUserProfile.region;
                        }
                        
                        if(foundUser.preferredCountry !== 'Select All'){
                            country = foundUser.preferredCountry;
                        } else {
                            country = foundUserProfile.country;
                        }

                        doneProfile = true;
                    }
                }
    
                if(doneProfile && doneRates){
                 
                    const accessToken = jwt.sign(
                        {
                            "UserInfo": {
                                "username": username,
                                "roles": roles
                            }
                        },
                        process.env.ACCESS_TOKEN_SECRET,
                        { expiresIn: '7d' }
                    );
    
                    if(accessToken){
                        res.status(200).json({ username, roles, userId, accessToken, profilePicURL, privacySetting, 
                            currency, currencySymbol, lessMotion, pushNotifications, birthDate, userTheme, 
                            blockedUsers, FXRates, city, region, country, credits,  })
                    } else {
                        res.status(401)
                    }
                }
            }
        );
    }
}

module.exports = { handleRefreshToken }

