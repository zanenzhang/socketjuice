const client = require('twilio')(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
const phoneUtil = require('google-libphonenumber').PhoneNumberUtil.getInstance();
const User = require('../../model/User');

async function sendVerification (req, res) {

    const {number, phoneCountry, userId} = req.body

    if (!number ) {
        return res.status(400).json({ message: 'Missing required info' })
    }

    const foundUser = await User.findOne({_id: userId})

    if(foundUser && !foundUser.checkedMobile){

        const checkedNumber = phoneUtil.parseAndKeepRawInput(number, phoneCountry);

        if(phoneUtil.isValidNumber(checkedNumber)){

            client.verify.v2.services(process.env.TWILIO_SOCKETJUICE_SID)
            .verifications
            .create({to: `${number}`, channel: 'sms'})
            .then( verification => {
                console.log(verification.status)
                res.status(200).send({result: verification.status})
            })
            .catch(e => {
                console.log(e)
                res.status(500).send(e);
            })
        }

    } else {

        return res.status(401).json({ message: 'Already approved' })
    }
}

//check verification token
async function checkVerification (req, res) {

    const {number, code, userId, phonePrimary, phonePrefix, 
        phoneCountry, phoneCountryCode} = req.body

    if (!number || !code ) {
        return res.status(400).json({ message: 'Missing required info' })
    }

    const foundUser = await User.findOne({_id: userId})

    if(foundUser && !foundUser.checkedMobile){

        client.verify.v2.services(process.env.TWILIO_SOCKETJUICE_SID)
        .verificationChecks
        .create({to: `${number}`, code: `${code}`})
        .then( verification => async function() {
            console.log(verification.status)
            if(verification.status === 'approved'){
                
                const updatedUser = await User.updateOne({_id: userId},
                    {$set:{checkedMobile: true, phonePrimary: phonePrimary, phonePrefix: phonePrefix,
                    phoneCountry: phoneCountry, phoneCountryCode: phoneCountryCode}})

                if(updatedUser){
                    res.status(200).send({result: verification.status})
                }
                
            } else {
                res.status(400);    
            }
            
        })
        .catch(e => {
            console.log(e)
            res.status(500).send(e);
        })

    } else {

        return res.status(401).json({ message: 'Already approved' })
    } 
}


module.exports = { sendVerification, checkVerification }