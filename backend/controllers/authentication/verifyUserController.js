const client = require('twilio')(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

const getCode = async (req, res) => {
    client
        .verify
        .services(process.env.VERIFY_SERVICE_SID)
        .verifications
        .create({
            to: `+${req.query.phonenumber}`,
            channel: req.query.channel
        })
        .then(data => {
            res.status(200).send(data);
        })
};

const verifyCode = async (req, res) => {
    client
        .verify
        .services(process.env.VERIFY_SERVICE_SID)
        .verificationChecks
        .create({
            to: `+${req.query.phonenumber}`,
            code: req.query.code
        })
        .then(data => {
            res.status(200).send(data);
        });
};

const createService = async(req, res) => {
    client.verify.v2.services.create({ friendlyName: 'phoneVerification' })
        .then(service => console.log(service.sid))
}

const sendVerification = async(req, res, number) => {

    client.verify.v2.services(process.env.TWILIO_VERIFICATION_SID)
        .verifications
        .create({to: `${number}`, channel: 'sms'})
        .then( verification => 
            console.log(verification.status)
        ); 
}

//check verification token
const checkVerification = async(req, res, number, code) => {
    return new Promise((resolve, reject) => {
        client.verify.v2.services(process.env.TWILIO_VERIFICATION_SID)
            .verificationChecks
            .create({to: `${number}`, code: `${code}`})
            .then(verification_check => {
                resolve(verification_check.status)
            });
    })
}


const verifyUserProfilePhone = async (req, res) => {

    const { userId, phoneNumber } = req.body;

    if(!userId || !phoneNumber ){
        return res.status(400).json({ 'message': 'Missing required fields!' });
    }

    const foundUser = await User.findOne({_id: userId})

    if(foundUser){

        foundUser.phonePrimary = phoneNumber
        foundUser.checkedMobile = true

        const savedUser = await foundUser.save()

        if(savedUser){
            return res.status(200).json({"message": "Success"})
        }
    
    } else {
        return res.status(400).json({"message": "Operation failed"})
    }
}

const verifyUserIdPhotos = async (req, res) => {

    const cookies = req.cookies;

    if (!cookies?.purchiesjwt) return res.sendStatus(401);
    const refreshToken = cookies.purchiesjwt;

    User.findOne({ refreshToken }, async function(err, foundUser){

        if (err || !foundUser) return res.sendStatus(403); 
    
        jwt.verify(
            refreshToken,
            process.env.REFRESH_TOKEN_SECRET,
            (err, decoded) => {

                if (err || foundUser.username !== decoded.username || !foundUser._id.toString() === ((decoded.userId)) ) return res.sendStatus(403);
            }
        )

        //Route for admins to approve users

        const { userId } = req.body

        if (!userId || !(Object.values(foundUser.roles).includes(5150)) ){

            return res.status(400).json({ 'message': 'Missing required fields!' });
        }

        const checkUser = await User.findOne({_id: userId})

        if(checkUser){

            checkUser.waitingIdApproval = true

            const savedUser = await checkUser.save()

            if(savedUser){

                return res.status(200).json({"message": "Success"})
            }
        }

    })
}

const rejectUserUploads = async (req, res) => {

    

}

module.exports = { createService, sendVerification, checkVerification, verifyUserProfilePhone, verifyUserIdPhotos, rejectUserUploads }