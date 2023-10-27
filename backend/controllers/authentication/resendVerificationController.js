const User = require('../../model/User');
const UsageLimit = require('../../model/UsageLimit');
const ActivateToken = require('../../model/ActivateToken');
const BannedUser = require('../../model/BannedUser');
const crypto = require('crypto');
const { sendConfirmationEmail } = require('../../middleware/mailer')


const handleResendVerification = async (req, res) => {
    const { email, geoData } = req.body;
    
    if (!email ) return res.status(400).json({ 'message': 'Missing required information!' });
    if(!geoData){
        geoData = {"IPv4": ''}
    }

    const foundBan = await BannedUser.findOne({admin: "admin"})
    
    if(foundBan?.ipAddresses?.some(e=>e.userIP === geoData.IPv4)){

        return res.status(403).send({"message":"Operation failed"});
    
    } else {

        User.findOne({ email: email }).then(async function (doc) {
            if (!doc || doc.deactivated === true){
                return res.status(500).send({msg:err.message});
            }
    
            const userLimits = await UsageLimit.findOne({_userId: doc._id})
    
            if(userLimits){
                
                if(userLimits.emailVerifications >= 5){

                    const addBan = BannedUser.updateOne({admin: "admin"},{$push: {ipAddresses: {userIP: geoData.IPv4}}})
                    if(addBan){
                        return res.status(403).send({"message":"Operation failed"});
                    }
                
                } else {

                    const newtoken = crypto.randomBytes(16).toString('hex')
                    const newDate = Date.now() + 7200000 
            
                    ActivateToken.updateOne( {_userId: doc._id},{$set: {
                        "token": newtoken, "expireAt": newDate }
                    },  async function(error){
                        if (error){
                            return res.status(500).send({msg:err.message});
                        } else {
                            userLimits.emailVerifications = userLimits.emailVerifications + 1
                            const savedLimits = await userLimits.save()
                            if(savedLimits){
                                sendConfirmationEmail( {toUser: email, userId:doc._id, hash: newtoken })
                                res.status(201).json({ 'message': 'Please check your email to activate!' });
                            }
                        }
                    })
                }
            }
        })
    }
}

module.exports = { handleResendVerification };