const User = require('../../model/User');
const DriverProfile = require("../../model/DriverProfile");
const { sendVerifiedAccount, sendVerifiedToAdmin } = require("../../middleware/mailer");

const client = require('twilio')(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
const phoneUtil = require('google-libphonenumber').PhoneNumberUtil.getInstance();


async function sendVerification (req, res) {

    const {number, phoneCountryCode, userId} = req.body

    if (!number ) {
        return res.status(400).json({ message: 'Missing required info' })
    }

    const foundUser = await User.findOne({_id: userId})

    if(foundUser && !foundUser.checkedMobile){

        const checkedNumber = phoneUtil.parseAndKeepRawInput(number, phoneCountryCode?.toUpperCase());

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


async function checkVerification (req, res) {

    const {number, code, userId, phonePrefix, 
        phoneCountry, phoneCountryCode} = req.body

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

                var searchObj = {}
                var currency = "cad"
                var currencySymbol = "$"


                if(phoneCountryCode == "ca"){
                    
                    currency = "cad"
                    currencySymbol = "$"
                    searchObj["j1772ACChecked"] = true
                    searchObj["ccs1DCChecked"] = true
                    searchObj["teslaChecked"] = true

                } else if(phoneCountryCode == "us"){
                    
                    currency = "usd"
                    currencySymbol = "$"
                    searchObj["j1772ACChecked"] = true
                    searchObj["ccs1DCChecked"] = true
                    searchObj["teslaChecked"] = true

                } else if(phoneCountryCode == "au"){
                    
                    currency = "aud"
                    currencySymbol = "$"
                    searchObj["mennekesACChecked"] = true
                    searchObj["ccs2DCChecked"] = true
                    searchObj["teslaChecked"] = true

                } else if(phoneCountryCode == "nz"){
                    
                    currency = "nzd"
                    currencySymbol = "$"
                    searchObj["mennekesACChecked"] = true
                    searchObj["ccs2DCChecked"] = true
                    searchObj["teslaChecked"] = true

                } else if(phoneCountryCode == "gb"){
                    
                    currency = "gbp"
                    currencySymbol = "£"
                    searchObj["mennekesACChecked"] = true
                    searchObj["ccs2DCChecked"] = true

                } else if(phoneCountryCode == "in"){
                    
                    currency = "inr"
                    currencySymbol = "₹"
                    searchObj["gbtACChecked"] = true
                    searchObj["gbtDCChecked"] = true
                    searchObj["teslaChecked"] = true

                } else if(phoneCountryCode == "jp"){
                    
                    currency = "jpy"
                    currencySymbol = "¥"
                    searchObj["j1772ACChecked"] = true
                    searchObj["chademoDChecked"] = true
                    searchObj["teslaChecked"] = true

                } else if(phoneCountryCode == "cn"){
                    
                    currency = "cny"
                    currencySymbol = "¥"
                    searchObj["gbtACChecked"] = true
                    searchObj["gbtDCChecked"] = true
                    searchObj["teslaChecked"] = true

                } else {
                    
                    currency = "eur"
                    currencySymbol = "€"
                    searchObj["mennekesACChecked"] = true
                    searchObj["ccs2DCChecked"] = true
                }

                const updatedUser = await User.updateOne({_id: userId},
                    {$set:{checkedMobile: true, phonePrimary: number, phonePrefix: phonePrefix, currentStage: 2,
                    currency: currency, currencySymbol: currencySymbol, phoneCountry: phoneCountry, 
                    phoneCountryCode: phoneCountryCode, active: true}})

                const updatedDriver = await DriverProfile.updateOne({_userId: userId},
                    {$set: searchObj})

                sendVerifiedAccount({ toUser: foundUser.email, firstName: foundUser.firstName })
                
                sendVerifiedToAdmin({verifiedUserId: foundUser._id, verifiedPhone: foundUser.primaryPhone,
                    verifiedFirstName: foundUser.firstName, verifiedLastame: foundUser.lastName})

                if(updatedUser && updatedDriver){
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


async function sendSmsNotification (receivingUserId, notificationType) {

    if (!receivingUserId || !notificationType ) {
        return res.status(400).json({ message: 'Missing required info' })
    }

    console.log("Starting sms notification")

    const foundReceiver = await User.findOne({_id: receivingUserId})

    if(foundReceiver && foundReceiver.checkedMobile ){

        try {

            console.log("Sending sms notification")

            var message = ""

            if(notificationType === "Approved"){
                message = `Hi ${foundReceiver.firstName}, your booking request was approved. Please open the app to get directions at www.socketjuice.com`
            } else if (notificationType === "Rejected"){
                message = `Hi ${foundReceiver.firstName}, your booking request was approved. Please open the app to make a new booking at www.socketjuice.com`
            } else if (notificationType === "Requested"){
                message = `Hi ${foundReceiver.firstName}, a booking request was made. Please open the app to review the request, and approve or reject at www.socketjuice.com`
            } else if (notificationType === "CancelSubmitted"){
                message = `Hi ${foundReceiver.firstName}, a cancellation and refund request was made. Please open the app to review the request, and approve or reject at www.socketjuice.com`
            } else if (notificationType === "Cancelled"){
                message = `Hi ${foundReceiver.firstName}, sorry, a booking request was cancelled prior to approval. Accounts tied to high volumes of cancellations will be reviewed. `
            }

            const sent = await client.messages
            .create({
               body: `${message}`,
               from: `${process.env.TWILIO_PHONE_NUM}`,
               to: `${foundReceiver.phonePrimary}`
             })

            if(sent && sent.status === 'sent'){
                
                console.log("Success")
                return ({result: sent.status})
                
            } else {
                return ({result: "Not sent"})
            }

        } catch(err){

            console.log(err)
            return ({result: "Operation failed"})
        }

    } else {

        return ({ result: "Operation failed", message: 'Mobile number was not verified' })
    } 
}


module.exports = { sendVerification, checkVerification, sendSmsNotification }