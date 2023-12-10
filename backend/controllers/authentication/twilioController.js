const User = require('../../model/User');
const Appointment = require('../../model/Appointment');
const DriverProfile = require("../../model/DriverProfile");

const client = require('twilio')(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
const phoneUtil = require('google-libphonenumber').PhoneNumberUtil.getInstance();


async function sendVerification (req, res) {

    const {number, phoneCountryCode, userId} = req.body

    if (!number ) {
        return res.status(400).json({ message: 'Missing required info' })
    }

    console.log(number)

    const foundUser = await User.findOne({_id: userId})

    if(foundUser && !foundUser.checkedMobile){

        if(foundUser.verifications >= 5){
            return res.status(402).json({ message: 'Operation failed' })
        } 
        
        foundUser.verifications = foundUser.verifications + 1

        const savedUser = await foundUser.save()

        const checkedNumber = phoneUtil.parseAndKeepRawInput(number, phoneCountryCode?.toUpperCase());

        if(savedUser && phoneUtil.isValidNumber(checkedNumber)){

            if(number === '+1 (647) 507-8183'){

                client.verify.v2.services(process.env.TWILIO_SOCKETJUICE_SID)
                .verifications
                .create({
                    to: `${number}`, 
                    channel: 'sms',
                })
                .then( verification => {
                    console.log(verification.status)
                    res.status(200).send({result: verification.status})
                })
                .catch(e => {
                    console.log(e)
                    res.status(500).send(e);
                })

            } else {

                const checkNumber = await User.findOne({phonePrimary: number})

                if(!checkNumber){
    
                    client.verify.v2.services(process.env.TWILIO_SOCKETJUICE_SID)
                    .verifications
                    .create({
                        to: `${number}`, 
                        channel: 'sms',
                    })
                    .then( verification => {
                        console.log(verification.status)
                        res.status(200).send({result: verification.status})
                    })
                    .catch(e => {
                        console.log(e)
                        res.status(500).send(e);
                    })
                } else {
    
                    return res.status(403).json({ message: 'Number already in use!' })
                }
            }
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

        if(foundUser.smsChecks >= 4){
            return res.status(402).json({ message: 'Operation failed' })
        } 
        
        foundUser.smsChecks = foundUser.smsChecks + 1

        const savedUser = await foundUser.save()

        if(savedUser){

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
                        searchObj["chademoDCChecked"] = true
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
                        phoneCountryCode: phoneCountryCode, credits: [{currency: currency, currencySymbol: currencySymbol, amount: 0}], 
                        escrow: [{currency: currency, currencySymbol: currencySymbol, amount: 0}], active: true}})
    
                    const updatedDriver = await DriverProfile.updateOne({_userId: userId},
                        {$set: searchObj})
    
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
        }

    } else {

        return res.status(401).json({ message: 'Already approved' })
    } 
}


async function sendSmsNotification (receivingUserId, notificationType) {

    if (!receivingUserId || !notificationType ) {
        return ({result: "Operation failed"})
    }

    console.log("Starting sms notification")

    const foundReceiver = await User.findOne({_id: receivingUserId})

    if(foundReceiver && foundReceiver.checkedMobile ){

        try {

            var message = "";

            if(notificationType === "Approved"){
            
                message = `Hi ${foundReceiver.firstName}, your booking request was approved. You can review the booking and get map directions at www.socketjuice.com/bookings`
            
            } else if (notificationType === "Rejected"){

                message = `Hi ${foundReceiver.firstName}, your booking request was rejected. Please open the app to make a new booking at www.socketjuice.com`
            
            } else if (notificationType === "Requested"){
            
                message = `Hi ${foundReceiver.firstName}, a booking request was made. Please open the app to approve or reject the request, at www.socketjuice.com/bookings`
            
            } else if (notificationType === "CancelSubmitted"){
            
                message = `Hi ${foundReceiver.firstName}, a cancellation and refund request was made. Please open the app to review the request at www.socketjuice.com/bookings`
            
            } else if (notificationType === "Cancelled"){
            
                message = `Hi ${foundReceiver.firstName}, sorry, a booking was cancelled prior to approval and refunded. Accounts tied to high volumes of cancellations will be reviewed. `
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


async function sendChatMessageSMS (receivingUserId, sendingUserFirstName) {

    if (!receivingUserId || !sendingUserFirstName ) {
        return ({result: "Operation failed"})
    }

    console.log("Starting chat message sms notification")

    const foundReceiver = await User.findOne({_id: receivingUserId})

    if(foundReceiver && foundReceiver.checkedMobile ){

        try {

            var message = `Hi ${foundReceiver.firstName}, you have received a message from ${sendingUserFirstName}. This will be the only text update for this conversation. Please open the app at www.socketjuice.com to see the message.`

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

async function sendDirectionsSMS (receivingUserId, addressurl) {

    if (!receivingUserId || !addressurl ) {
        return ({result: "Operation failed"})
    }

    console.log("Sending maps direction url")

    const foundReceiver = await User.findOne({_id: receivingUserId})

    if(foundReceiver && foundReceiver.checkedMobile ){

        try {

            var message = `Directions link: ${addressurl} `

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


async function sendFlagSMS (submitterName, submitterPhone, appointmentId, comment) {

    if ( !submitterName || !submitterPhone || !appointmentId || !comment ) {
        return ({ result: "Operation failed" })
    }

    try {

        var message = `Help app-${appointmentId} From ${submitterName} ${submitterPhone} ${comment}`

        const sent = await client.messages
        .create({
            body: `${message}`,
            from: `${process.env.TWILIO_PHONE_NUM}`,
            to: `${process.env.PERSONAL_PHONE}`
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
}


module.exports = { sendVerification, checkVerification, sendSmsNotification, 
    sendChatMessageSMS, sendFlagSMS, sendDirectionsSMS }