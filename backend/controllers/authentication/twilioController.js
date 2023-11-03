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

    const {number, code, userId, phonePrefix, 
        phoneCountry, phoneCountryCode} = req.body

    console.log(number, code, userId, phonePrefix, 
        phoneCountry, phoneCountryCode)

    if (!number || !code ) {
        return res.status(400).json({ message: 'Missing required info' })
    }

    const foundUser = await User.findOne({_id: userId})

    if(foundUser && !foundUser.checkedMobile){

        try {

            console.log("Checking verification code")

            const verification = await client.verify.v2.services(process.env.TWILIO_SOCKETJUICE_SID)
            .verificationChecks
            .create({to: `${number}`, code: `${code}`})

            if(verification?.status === 'approved'){
                
                console.log(verification.status)

                var currency = "cad"
                if(phoneCountry == "CA"){
                    currency = "cad"
                } else if(phoneCountry == "US"){
                    currency = "usd"
                } else if(phoneCountry == "AU"){
                    currency = "aud"
                } else if(phoneCountry == "NZ"){
                    currency = "nzd"
                } else if(phoneCountry == "GB"){
                    currency = "gbp"
                } else if(phoneCountry == "IN"){
                    currency = "inr"
                } else if(phoneCountry == "JP"){
                    currency = "jpy"
                } else if(phoneCountry == "CN"){
                    currency = "cny"
                } else {
                    currency = "eur"
                }

                const updatedUser = await User.updateOne({_id: userId},
                    {$set:{checkedMobile: true, phonePrimary: number, phonePrefix: phonePrefix, currentStage: 2,
                    currency: currency, phoneCountry: phoneCountry, phoneCountryCode: phoneCountryCode}})

                if(updatedUser){
                    console.log("Success")
                    res.status(200).send({result: verification.status})
                }
                
            } else {
                res.status(400);    
            }

        } catch(err){

            res.status(400);    
            console.log(err)
        }

    } else {

        return res.status(401).json({ message: 'Already approved' })
    } 
}


module.exports = { sendVerification, checkVerification }