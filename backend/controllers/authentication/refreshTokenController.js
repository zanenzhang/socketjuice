const User = require('../../model/User');
const Flags = require('../../model/Flags');
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
                if (err ) return res.sendStatus(403);
                
                const foundDriver = await DriverProfile.findOne({_userId: foundUser._id})
                const foundFlags = await Flags.findOne({_userId: foundUser._id})

                if(foundDriver && foundFlags){

                    const roles = Object.values(foundUser?.roles).filter(Boolean);
                    
                    const userId = foundUser._id;
                    const firstName = foundUser?.firstName;
                    const lastName = foundUser?.lastName;
                    const profilePicURL = foundUser?.profilePicURL;
                    const currency = foundUser?.currency;
                    const currencySymbol = foundUser?.currencySymbol;
                    const credits = foundUser?.credits;
                    const phoneNumber = foundUser?.phonePrimary;
                    const appointmentFlags = foundFlags.appointmentFlags;

                    const pushNotifications = foundUser?.pushNotifications;
                    const smsNotifications = foundUser?.smsNotifications;
                    const emailNotifications = foundUser?.emailNotifications;

                    const requestedPayout = foundUser?.requestedPayout;
                    const requestedPayoutCurrency = foundUser?.requestedPayoutCurrency;
                    const requestedPayoutOption = foundUser?.requestedPayoutOption;

                    const j1772ACChecked = foundDriver?.j1772ACChecked
                    const ccs1DCChecked = foundDriver?.ccs1DCChecked
                    const mennekesACChecked = foundDriver?.mennekesACChecked
                    const gbtACChecked = foundDriver?.gbtACChecked
                    const ccs2DCChecked = foundDriver?.ccs2DCChecked
                    const chademoDCChecked = foundDriver?.chademoDCChecked
                    const gbtDCChecked = foundDriver?.gbtDCChecked
                    const teslaChecked = foundDriver?.teslaChecked

                    var FXRates = null;
                    var doneProfile = true;
                    var doneRates = false;

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
        
                        if(accessToken){
                            
                            res.status(200).json({ firstName, lastName, userId, roles, accessToken, profilePicURL, phoneNumber,
                                currency, currencySymbol, pushNotifications, smsNotifications, emailNotifications, credits,
                                j1772ACChecked, ccs1DCChecked, mennekesACChecked, ccs2DCChecked, chademoDCChecked, gbtACChecked, 
                                gbtDCChecked, teslaChecked, requestedPayout, requestedPayoutCurrency, requestedPayoutOption,
                                appointmentFlags })

                        } else {
                            res.status(401)
                        }
                    }
                
                } else {
                    res.status(402).json({"message": "Operation failed"})
                }
            }
        );
    }
}

module.exports = { handleRefreshToken }

