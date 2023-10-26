const User = require('../../model/User');
const UsageLimit = require('../../model/UsageLimit');
const BannedUser = require('../../model/BannedUser');
const ObjectId  = require('mongodb').ObjectId;
const jwt = require('jsonwebtoken');


const addWarnings = async (req, res) => {

    const cookies = req.cookies;

    if (!cookies?.purchiesjwt) return res.sendStatus(403);
    const refreshToken = cookies.purchiesjwt;
    const { loggedUserId } = req.body

    User.findOne({ refreshToken }, async function(err, foundUser){

        if (err || !foundUser) return res.sendStatus(403); 
    
        jwt.verify(
            refreshToken,
            process.env.REFRESH_TOKEN_SECRET,
            (err, decoded) => {

                if (err || foundUser.username !== decoded.username || !foundUser._id.toString() === ((loggedUserId))  || !foundUser._id.toString() === ((decoded.userId)) ) return res.sendStatus(403);
            }
        )

        if (!loggedUserId) {
            return res.status(202).json({ message: 'User ID Required' })
        }

        try {

            if( !foundUser?.email.includes("@purchies.com")){

                const foundLimits = await UsageLimit.findOne({_userId: loggedUserId})

                if(foundLimits){
                    
                    foundLimits.warningsCount = foundLimits.warningsCount + 3
                    
                    if(foundLimits.warningsCount >= 7){
                        
                        const foundUser = await User.findOne({_id: loggedUserId})
                        
                        if(foundUser && foundUser.primaryGeoData){
                            
                            const addIPBan = await BannedUser.updateOne({admin: "admin"},{$push: {ipAddresses: {userIP: foundUser.primaryGeoData?.IPv4}}})
                            
                            foundUser.deactivated = true

                            const savedUser = await foundUser.save()
                            const savedLimits = await foundLimits.save()

                            if(savedUser && addIPBan && savedLimits){
                                return res.status(202).json({"message": "Added user ban"})
                            }
                        
                        } else {
                            return res.status(202).json({"message": "Inappropriate usage"})
                        }
                    
                    } else {
                        const savedLimits = await foundLimits.save()
                        if(savedLimits){
                            return res.status(201).json({"message": "Added user warnings"})
                        }
                    }
                }

            } else {

                return res.status(201).json({"message": "Added user warnings"})
            }

        } catch(err){

            console.log(err)
        }
    })
}   
   

module.exports = { addWarnings }

