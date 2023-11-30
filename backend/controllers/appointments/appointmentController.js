const User = require('../../model/User');
const DriverProfile = require('../../model/DriverProfile');
const HostProfile = require('../../model/HostProfile');
const Appointment = require('../../model/Appointment');
const Notification = require('../../model/Notification');

const Flags = require('../../model/Flags');
const UsageLimit = require('../../model/UsageLimit');
const BannedUser = require("../../model/BannedUser");
const  {deleteFile} = require("../../controllers/media/s3Controller");
const { sendNotiEmail, sendReceiptOutgoing, sendReceiptIncoming } = require("../../middleware/mailer")
const { sendSmsNotification } = require("../../controllers/authentication/twilioController")


const ObjectId  = require('mongodb').ObjectId;
const crypto = require('crypto');
const languageList = require('../languageCheck');
const jwt = require('jsonwebtoken');
const S3 = require("aws-sdk/clients/s3");
const fns = require('date-fns');
var _= require('lodash');
const copyFile = require('../media/s3Controller');

const wasabiPrivateBucketUSA = process.env.WASABI_PRIVATE_BUCKET_NAME_USA;
const wasabiPublicBucketUSA = process.env.WASABI_PUBLIC_BUCKET_NAME_USA;

const wasabiEndpoint = process.env.WASABI_US_EAST_ENDPOINT;
const wasabiRegion = process.env.WASABI_US_EAST_REGION;
const wasabiAccessKeyId = process.env.WASABI_ACCESS_KEY;
const wasabiSecretAccessKey = process.env.WASABI_SECRET_KEY;

const s3 = new S3({
    endpoint: wasabiEndpoint,
    region: wasabiRegion,
    accessKeyId: wasabiAccessKeyId,
    secretAccessKey: wasabiSecretAccessKey,
  })


const getHostAppointments = async (req, res) => {
    
    var { userId, currentDate } = req.query

    if (!userId || !currentDate ) {
        return res.status(400).json({ message: 'Missing required information' })
    }

    var dateConv = new Date(currentDate)
    const yesterday = new Date(dateConv.getFullYear(), dateConv.getMonth(), dateConv.getDate()-2);
    const tomorrow = new Date(dateConv.getFullYear(), dateConv.getMonth(), dateConv.getDate()+2);

    const foundHostProfile = await HostProfile.findOne({_userId: userId})

    if(foundHostProfile){        

        console.log("Found host profile for host appointments", foundHostProfile.hostAppointments)

        const hostAppointments = await Appointment.find({ _id: {$in: foundHostProfile?.hostAppointments.map(e => e._appointmentId)}, 
             start: {$gte: yesterday}, end: {$lte: tomorrow}})

        const flaggedList = await Flags.findOne({_userId: userId}).select("userFlags")

        let userData = null;
        let doneFlags = null;
        let foundHostProfiles = null;
        let flaggedUsers = [];
        let stop = 0;

        if(flaggedList){

            if(flaggedList.userFlags){
                flaggedUsers = flaggedList.userFlags
            } else {
                flaggedUsers = []
            }

            doneFlags = true;
        }

        if(hostAppointments && hostAppointments?.length > 0){

            foundHostProfiles = await HostProfile.find({$or:[{_userId: {$in: hostAppointments.map(e=>e._hostUserId)}}, 
                {_userId: {$in: hostAppointments.map(e=>e._requestUserId)}}]})

            if(foundHostProfiles && foundHostProfiles?.length > 0){

                userData = await User.find({_id: {$in: foundHostProfiles.map(e=>e._userId)}}).select("_id profilePicURL phonePrimary firstName lastName")

                if(userData){

                    console.log("User data here", userData)
                
                    doneData = true;
                
                } else {
                
                    return res.status(401).json({ message: 'Operation failed' })
                }

            } else {
            
                stop = 1
                return res.status(201).json({stop})
            }

            if(doneFlags && doneData && userData){

                return res.status(201).json({hostAppointments, foundHostProfiles, userData, flaggedUsers, stop})
            
            } else {

                return res.status(401).json({ message: 'Operation failed' })
            }
        
        } else {

            stop = 1
            donePosts = true;
            userData = []
            foundHostProfiles = []

            if(donePosts && doneFlags){
                
                return res.status(201).json({hostAppointments, foundHostProfiles, userData, flaggedUsers, stop})
            }
        }
    
    } else {

        return res.status(403).json({ message: 'Missing required information' })
    }
}   


const getDriverAppointments = async (req, res) => {
    
    var { userId, currentDate } = req.query

    console.log(userId, currentDate)

    if (!userId || !currentDate ) {
        return res.status(400).json({ message: 'Missing required information' })
    }

    var dateConv = new Date(currentDate)
    const yesterday = new Date(dateConv.getFullYear(), dateConv.getMonth(), dateConv.getDate()-2);
    const tomorrow = new Date(dateConv.getFullYear(), dateConv.getMonth(), dateConv.getDate()+2);

    const foundDriverProfile = await DriverProfile.findOne({_userId: userId})

    if(foundDriverProfile){

        console.log("Found driver profile", foundDriverProfile.userAppointments.length)

        const userAppointments = await Appointment.find({ _id: {$in: foundDriverProfile?.userAppointments.map(e => e._appointmentId)}, 
        start: {$gte: yesterday}, end: {$lte: tomorrow} })

        const flaggedList = await Flags.findOne({_userId: userId}).select("userFlags")

        let userData = null;
        let doneFlags = null;
        let foundHostProfiles = null;
        let flaggedUsers = [];
        let stop = 0;

        if(flaggedList){

            if(flaggedList.userFlags){
                flaggedUsers = flaggedList.userFlags
            } else {
                flaggedUsers = []
            }

            doneFlags = true;
        }

        if(userAppointments && userAppointments?.length > 0){

            console.log("Found appointments", userAppointments.length)

            foundHostProfiles = await HostProfile.find({$or:[{_userId: {$in: userAppointments.map(e=>e._hostUserId)}}, 
                {_userId: {$in: userAppointments.map(e=>e._requestUserId)}}]})

            if(foundHostProfiles && foundHostProfiles?.length > 0){

                userData = await User.find({_id: {$in: foundHostProfiles.map(e=>e._userId)}}).select("_id profilePicURL phonePrimary firstName lastName")

                if(userData){

                    console.log("User data here", userData)
                
                    doneData = true;
                
                } else {

                    return res.status(401).json({ message: 'Operation failed' })
                }

            } else {
            
                stop = 1
                return res.status(201).json({stop})
            }

            if(doneFlags && doneData && userData){

                return res.status(201).json({userAppointments, foundHostProfiles, userData, flaggedUsers, stop})
            
            } else {

                return res.status(401).json({ message: 'Operation failed' })
            }
        
        } else {

            stop = 1
            donePosts = true;
            userData = []
            foundHostProfiles = []

            if(donePosts && doneFlags){
                
                return res.status(201).json({userAppointments, foundHostProfiles, userData, flaggedUsers, stop})
            }
        }
    } else {

        return res.status(403).json({ message: 'Missing required information' })
    }
}   


const addAppointmentRequest = async (req, res) => {

    const { userId, hostUserId, appointmentStart, appointmentEnd } = req.body

    if (!userId || !hostUserId ) return res.status(400).json({ 'message': 'Missing required fields!' });

    console.log("Adding new appointment request", userId, hostUserId, appointmentStart, appointmentEnd)

    try {

        const foundHostProfile = await HostProfile.findOne({_userId: hostUserId})
        const foundDriverProfile = await DriverProfile.findOne({_userId: userId})
        const foundLimits = await UsageLimit.findOne({_userId: userId})
        const foundUser = await User.findOne({_id: userId})

        var todaysDate = new Date().toLocaleDateString()

        var requestStart = new Date(appointmentStart)
        var requestEnd = new Date(appointmentEnd)
        var requestStartString = requestStart.toISOString().slice(0, 10)
        var requestEndString = requestEnd.toISOString().slice(0, 10)
        
        var doneHostAppointments = false;
        var doneDriverAppointments = false;
        var doneOperation = false;
        
        var doneNoti = false;
        var doneEmail = false;
        var doneSms = false;

        var currencySymbol = "$"

        if (foundDriverProfile && foundHostProfile && foundLimits && foundUser){

            if(foundLimits.numberOfAppointments?.length > 0){

                if(foundLimits.numberOfAppointments?.some(e=>e.date === todaysDate)){

                    for(let i=0; i< foundLimits.numberOfAppointments.length; i++){

                        if(foundLimits.numberOfAppointments[i].date === todaysDate){
    
                            if(foundLimits.numberOfAppointments[i].appointmentsNumber >= 25){
                                //Set found limits to 5 for production
                                
                                return res.status(401).json({ message: 'Reached appointment limit for today' })
                            
                            } else {
    
                                foundLimits.numberOfAppointments[i].appointmentsNumber = foundLimits.numberOfAppointments[i].appointmentsNumber + 1
                                const savedLimits = await foundLimits.save()
    
                                if(savedLimits){
                                    doneOperation = true;
                                }
                                
                                break;
                            }
                        }
                    }
                
                } else {

                    foundLimits.numberOfAppointments.push({date: todaysDate, appointmentsNumber: 1 })
                    const savedLimits = await foundLimits.save()
                    if(savedLimits){
                        doneOperation = true;
                    }
                }

            } else {

                foundLimits.numberOfAppointments.push({date: todaysDate, appointmentsNumber: 1 })
                const savedLimits = await foundLimits.save()
                if(savedLimits){
                    doneOperation = true;
                }
            }

            const newToken = crypto.randomBytes(3).toString('hex')

            const checkAppointments = await Appointment.findOne(
                {$and:[
                    {$or: [{_requestUserId: userId}, {_hostUserId: hostUserId}]}, 
                    {$or: [ 
                        { start : { $lte: requestStart }, end : { $gt: requestStart } },
                        { start : { $lt: requestEnd }, end : { $gte: requestEnd } },
                        { start : { $gte: requestStart }, end : { $lte: requestEnd } }]}, 
                    {$or: [{status: "Approved" }, {status: "Requested" }]}
                ]})

            if(!checkAppointments){

                // In milliseconds
                const timediff = (requestEnd - requestStart) / 1000 / 1800
                const chargeAmount = Math.round(foundHost.chargeRatePerHalfHour * timediff * 100) / 100

                if(chargeAmount && foundUser?.credits?.length > 0){

                    var checked = false
                    for(let i=0; i<foundUser?.credits?.length; i++){
                        if(foundUser.credits[i].amount > chargeAmount && foundUser.credits[i].currency.toLowerCase() === foundHost.currency.toLowerCase()){
                            currencySymbol = foundUser.credits[i].currencySymbol
                            
                            foundUser.credits[i].amount = foundUser.credits[i].amount - chargeAmount
                            checked = true
                            break
                        }
                    }

                    if(!checked){
                        return res.status(403).json({ message: 'Operation failed' })
                    } else {
                        var escrow = false
                        for(let i=0; i<foundUser?.escrow?.length; i++){
                            if(foundUser.escrow[i].currency.toLowerCase() === foundHost.escrow.toLowerCase()){                                
                                currencySymbol = foundUser.escrow[i].currencySymbol
                                foundUser.escrow[i].amount = foundUser.escrow[i].amount + chargeAmount
                                escrow = true
                                break
                            }
                        }   
                        if(!escrow){

                            if(foundHost.currency.toLowerCase() === "cad"){
                                currencySymbol = "$"
                            } else if(foundHost.currency.toLowerCase() === "usd"){
                                currencySymbol = "$"
                            } else if(foundHost.currency.toLowerCase() === "eur"){
                                currencySymbol = "€"
                            } else if(foundHost.currency.toLowerCase() === "gbp"){
                                currencySymbol = "£"
                            } else if(foundHost.currency.toLowerCase() === "inr"){
                                currencySymbol = "₹"
                            } else if(foundHost.currency.toLowerCase() === "jpy"){
                                currencySymbol = "¥"
                            } else if(foundHost.currency.toLowerCase() === "cny"){
                                currencySymbol = "¥"
                            } else if(foundHost.currency.toLowerCase() === "aud"){
                                currencySymbol = "$"
                            } else if(foundHost.currency.toLowerCase() === "nzd"){
                                currencySymbol = "$"
                            }
                            
                            if(foundUser.escrow?.length > 0){
                                foundUser.escrow.push({currency: currency.toLowerCase(), currencySymbol: currencySymbol, amount: chargeAmount})
                            } else {
                                foundUser.escrow = [{currency: currency.toLowerCase(), currencySymbol: currencySymbol, amount: chargeAmount}]
                            }
                        }
                    }
                
                } else {

                    return res.status(403).json({ message: 'Operation failed' })
                }

                const newAppointment = await Appointment.create({_requestUserId: userId, _hostUserId: hostUserId, passcode: newToken,
                    start: requestStart, end: requestEnd, requestDateStart: requestStartString, status: "Requested",
                    requestDateEnd: requestEndString, address: foundHostProfile.address, locationlat: foundHostProfile.location.coordinates[1], 
                    locationlng: foundHostProfile.location.coordinates[0], chargeAmount: chargeAmount, currency: foundHost.currency, 
                    currencySymbol: currencySymbol})
    
                if(newAppointment){

                    const newNoti = await Notification.create({_receivingUserId: hostUserId, _sendingUserId: userId, notificationType: "Requested", 
                        _relatedAppointment: newAppointment._id, start: requestStart, end: requestEnd, address: foundHostProfile.address })

                    if(foundUser?.emailNotifications){
                        const success = await sendNotiEmail({firstName: foundUser.firstName, toUser:foundUser.email, notificationType: "Requested"})
                        if(success){
                            doneEmail = true
                        }
                    } else {
                        doneEmail = true
                    }

                    if(foundUser?.smsNotifications){
                        const success = await sendSmsNotification(hostUserId, "Requested")
                        if(success){
                            doneSms = true
                        }
                    } else {
                        doneSms = true
                    }
    
                    foundHostProfile.numberOfHostAppointments = foundHostProfile.numberOfHostAppointments + 1
                
                    if(foundHostProfile.hostAppointments?.length > 0){
                    
                        foundHostProfile.hostAppointments.push({_appointmentId: newAppointment._id})
    
                        const savedHostProfile = await foundHostProfile.save()
    
                        if(savedHostProfile){
                            doneHostAppointments= true;
                        }
                    
                    } else {
    
                        foundHostProfile.hostAppointments = [{_appointmentId: newAppointment._id}]
                        
                        const savedHostProfile = await foundHostProfile.save()
    
                        if(savedHostProfile){
                            doneHostAppointments= true;
                        }
                    }
    
                    foundDriverProfile.numberOfCustAppointments = foundDriverProfile.numberOfCustAppointments + 1
                
                    if(foundDriverProfile.userAppointments?.length > 0){
                    
                        foundDriverProfile.userAppointments.push({_appointmentId: newAppointment._id})
    
                        const savedDriverProfile = await foundDriverProfile.save()
    
                        if(savedDriverProfile){
                            doneDriverAppointments= true;
                        }
                    
                    } else {
    
                        foundDriverProfile.userAppointments = [{_appointmentId: newAppointment._id}]
                        
                        const savedDriverProfile = await foundDriverProfile.save()
    
                        if(savedDriverProfile){
                            doneDriverAppointments= true;
                        }
                    }

                    if(newNoti){
                        doneNoti = true
                    }
                }
    
                if(doneHostAppointments && doneDriverAppointments && doneOperation 
                    && doneNoti && doneEmail && doneSms ){
                    
                    return res.status(201).json({ message: 'Success' })
                
                } else {
    
                    return res.status(401).json({ message: 'Operation failed' })
                }
            } else {

                console.log("Already have appointment overlapping during this time")
                return res.status(403).json({ message: 'Overlapping slots' })
            }  
          
        } else {

            return res.status(401).json({ message: 'Operation failed' })
        }
        
    } catch (err) {

        console.log(err)
        return res.status(400).json({ message: 'Failed' })
    }
}


const addAppointmentApproval = async (req, res) => {

    const { userId, hostUserId, appointmentId } = req.body

    if (!userId || !hostUserId ) return res.status(400).json({ 'message': 'Missing required fields!' });

    try {

        console.log("Approving appointment", appointmentId)

        const foundAppointment = await Appointment.findOne({_id: appointmentId})
        const foundUser = await User.findOne({_id: userId})
        const foundHost = await User.findOne({_id: hostUserId})

        var doneEmail = false;
        var doneSms = false;

        if(foundAppointment && foundAppointment.status === "Requested" && foundUser && foundHost){

            const requestStart = foundAppointment.start
            const requestEnd = foundAppointment.end

            const checkAppointments = await Appointment.findOne(
                {$and:[
                    {$or: [{_requestUserId: userId}, {_hostUserId: hostUserId}]}, 
                    {$or: [ 
                        { start : { $lte: requestStart }, end : { $gt: requestStart } },
                        { start : { $lt: requestEnd }, end : { $gte: requestEnd } },
                        { start : { $gte: requestStart }, end : { $lte: requestEnd } }]}, 
                    {$or: [{status: "Approved" }]}
                ]})

            if(!checkAppointments){

                const updatedAppointment = await Appointment.updateOne({_id: appointmentId},{$set:{status: "Approved"}})
                
                const newPayment = await Payment.create({_sendingUserId: userId, _receivingUserId: hostUserId, amount: foundAppointment.chargeAmount,
                    currency: foundAppointment.currency, currencySymbol: foundAppointment.currencySymbol})

                if (foundUser.escrow?.length > 0){

                    var escrow = false;
                    for(let i=0; i<foundUser.escrow?.length; i++){
                        if(foundUser.escrow[i].currency.toLowerCase() === foundAppointment?.currency.toLowerCase() 
                            && foundUser.escrow[i].amount > foundAppointment?.chargeAmount){
                            
                            foundUser.escrow[i].amount = foundUser.escrow[i].amount - foundAppointment.chargeAmount
                            escrow = true;
                            break
                        }
                    }

                    if(!escrow){
                        return res.status(401).json({ message: 'Operation failed' })    
                    } else {
                        if(foundHost?.escrow?.length > 0){
                            var credited = false
                            for(let i=0; i<foundHost?.escrow?.length > 0; i++){
                                if(foundHost.escrow[i].currency.toLowerCase() === foundAppointment.currency.toLowerCase()){
                                    foundHost.escrow[i].amount = foundHost?.escrow[i].amount + foundAppointment.chargeAmount
                                    credited = true;
                                    break
                                }
                            }
                            if(!credited){
                                foundHost.escrow.push({amount: foundAppointment.chargeAmount, currency: foundAppointment.currency, 
                                    currencySymbol: foundAppointment.currencySymbol})
                            }
                        } else {
                            foundHost.escrow = [{amount: foundAppointment.chargeAmount, currency: foundAppointment.currency, 
                                currencySymbol: foundAppointment.currencySymbol}]
                        }
                    }

                } else {

                    return res.status(401).json({ message: 'Operation failed' })
                }

                const savedUser = await foundUser.save()
                const savedHost = await foundHost.save()

                const conflictingAppointments = await Appointment.find(
                    {$and:[
                        {$or: [{_requestUserId: userId}, {_hostUserId: hostUserId}]}, 
                        {$or: [ 
                            { start : { $lt: requestStart }, end : { $gt: requestStart } },
                            { start : { $lt: requestEnd }, end : { $gt: requestEnd } },
                            { start : { $gt: requestStart }, end : { $lt: requestEnd } }]}, 
                        {$or: [{status: {$ne: "Approved" }}]}
                    ]})

                const newNoti = await Notification.create({_receivingUserId: userId, _sendingUserId: hostUserId, notificationType: "Approved", 
                        _relatedAppointment: foundAppointment._id, start: foundAppointment.start, end: foundAppointment.end, address: foundAppointment.address })

                if(foundUser.emailNotifications){
                    const success = await sendNotiEmail({firstName: foundUser.firstName, toUser:foundUser.email, notificationType: "Approved"})
                    if(success){
                        doneEmail = true
                    }
                } else {
                    doneEmail = true
                }

                if(foundUser.smsNotifications){
                    const success = await sendSmsNotification(hostUserId, "Approved")
                    if(success){
                        doneSms = true
                    }
                } else {
                    doneSms = true
                }

                if(updatedAppointment && newPayment && newNoti && doneEmail && doneSms && savedUser && savedHost){

                    const driverPayment = await DriverProfile.updateOne({_userId: userId}, {$push: {outgoingPayments: {
                        _paymentId: newPayment._id, amount: foundAppointment.chargeAmount, currency: foundAppointment.currency,
                        currencySymbol: foundAppointment.currencySymbol
                    }}})
    
                    const hostPayment = await HostProfile.updateOne({_userId: hostUserId}, {$push: {incomingPayments: {
                        _paymentId: newPayment._id, amount: foundAppointment.chargeAmount, currency: foundAppointment.currency,
                        currencySymbol: foundAppointment.currencySymbol
                    }}})

                    if(conflictingAppointments && conflictingAppointments?.length > 0){
                        
                        var count = 0;
                        for(let i=0; i<conflictingAppointments?.length; i++){
                            
                            const newNoti = await Notification.create(
                                {_receivingUserId: conflictingAppointments[i]._requestUserId, 
                                _sendingUserId: conflictingAppointments[i]._hostUserId, 
                                notificationType: "Cancelled", _relatedAppointment: conflictingAppointments[i]._id,
                                start: conflictingAppointments[i].start, end: conflictingAppointments[i].end, 
                                address: conflictingAppointments[i].address})

                            if(newNoti){
                                count += 1
                            }
                        }

                        if(count === conflictingAppointments?.length){

                            const pullappointments = await Appointment.updateMany(
                                {$and:[
                                    {$or: [{_requestUserId: userId}, {_hostUserId: hostUserId}]}, 
                                    {$or: [ 
                                        { start : { $lt: requestStart }, end : { $gt: requestStart } },
                                        { start : { $lt: requestEnd }, end : { $gt: requestEnd } },
                                        { start : { $gt: requestStart }, end : { $lt: requestEnd } }]}, 
                                    {status: {$ne: "Approved"}}
                                ]}, {$set: {status: "Cancelled"}})
        
                            if(pullappointments && driverPayment && hostPayment){
                                return res.status(201).json({ message: 'Success' })
                            }
                        }

                    } else {

                        if(driverPayment && hostPayment){

                            return res.status(201).json({ message: 'Success' })
                        
                        } else {
                
                            return res.status(400).json({ message:'Operation Failed' });
                        }
                    }

                } else {
                    return res.status(401).json({ message: 'Operation failed' })
                }

            } else {

                console.log("Already have appointment overlapping during this time")
                return res.status(403).json({ message: 'Overlapping slots' })
            }
        
        } else {

            console.log("Data not found or appointment status already changed")
            return res.status(401).json({ message: 'Data not found or appointment status already changed' })
        }

    } catch(err){

        console.log(err)
        return res.status(400).json({ message: 'Failed' })
    }
}

const addAppointmentCompletion = async (req, res) => {

    const { userId, hostUserId, appointmentId } = req.body

    if (!userId || !hostUserId ) return res.status(400).json({ 'message': 'Missing required fields!' });

    try {

        const foundAppointment = await Appointment.findOne({_id: appointmentId})
        const foundUser = await User.findOne({_id: userId})
        const foundHost = await User.findOne({_id: hostUserId})

        var doneEmail = false;
        var doneSms = false;

        if(foundAppointment && foundAppointment.status === "Approved" && foundAppointment.status !== "Completed" 
            && foundUser && foundHost){

            const current = new Date()

            if(current < foundAppointment?.end){
                return res.status(401).json({ message: 'Operation failed' })
            }

            const updatedAppointment = await Appointment.updateOne({_id: appointmentId},{$set:{status: "Completed"}})

            const newNoti = await Notification.create({_receivingUserId: userId, _sendingUserId: hostUserId, notificationType: "Completed", 
                    _relatedAppointment: foundAppointment._id, start: foundAppointment?.start, end: foundAppointment?.end, 
                    address: foundAppointment?.address})

            if(foundHost?.escrow?.length > 0){

                var checked = false
                for(let i=0; i<foundHost?.escrow?.length; i++){
                    if(foundHost.escrow[i].amount > foundAppointment?.chargeAmount 
                        && foundHost.escrow[i].currency.toLowerCase() === foundAppointment.currency.toLowerCase()){
                        
                        foundHost.escrow[i].amount = foundHost.escrow[i].amount - foundAppointment.chargeAmount
                        checked = true
                        break
                    }
                }

                if(!checked){
                    return res.status(403).json({ message: 'Operation failed' })
                } else {
                    if(foundHost?.credits?.length > 0){
                        var credited = false
                        for(let i=0; i<foundHost?.credits?.length > 0; i++){
                            if(foundHost.credits[i].currency.toLowerCase() === foundAppointment.currency.toLowerCase()){
                                
                                foundHost.credits[i].amount = foundHost?.credits[i].amount + foundAppointment.chargeAmount
                                credited = true;
                                break
                            }
                        }
                        if(!credited){
                            foundHost.credits.push({amount: foundAppointment.chargeAmount, currency: foundAppointment.currency, 
                                currencySymbol: foundAppointment.currencySymbol})
                        }
                    } else {
                        foundHost.credits = [{amount: foundAppointment.chargeAmount, currency: foundAppointment.currency, 
                            currencySymbol: foundAppointment.currencySymbol}]
                    }
                }
            
            } else {

                return res.status(403).json({ message: 'Operation failed' })
            }

            if(foundUser.emailNotifications){
                const success = await sendNotiEmail({firstName: foundUser.firstName, toUser:foundUser.email, notificationType: "Completed"})
                if(success){
                    doneEmail = true
                }
            } else {
                doneEmail = true
            }

            const sentOutReceipt = await sendReceiptOutgoing({toUser: foundHost.email, firstName: foundHost.firstName, amount: foundAppointment.chargeAmount, 
                currency: foundAppointment.currency, currencySymbol: foundAppointment.currencySymbol })

            const sentInReceipt = await sendReceiptIncoming({toUser: foundUser.email, firstName: foundUser.firstName, amount: foundAppointment.chargeAmount, 
                currency: foundAppointment.currency, currencySymbol: foundAppointment.currencySymbol })

            if(foundUser.smsNotifications){
                const success = await sendSmsNotification(hostUserId, "Completed")
                if(success){
                    doneSms = true
                }
            } else {
                doneSms = true
            }

            if(updatedAppointment && newNoti && doneEmail && doneSms && sentOutReceipt && sentInReceipt){
                
                return res.status(201).json({ message: 'Success' })

            } else {

                return res.status(401).json({ message: 'Operation failed' })
            }
        }

    } catch(err){

        console.log(err)
        return res.status(400).json({ message: 'Failed' })
    }
}

const driverRequestCancelSubmit = async (req, res) =>{

    const { userId, hostUserId, appointmentId } = req.body    

    if (!userId || !appointmentId || !hostUserId ) return res.status(400).json({ 'message': 'Missing required fields!' });

    try {

        const foundUser = await User.findOne({_id: userId})
        const foundAppointment = await Appointment.findOne({_id: appointmentId})

        var doneEmail = false;
        var doneSms = false;

        if(foundUser && foundAppointment){

            const updateAppointment = await Appointment.updateOne({_id: appointmentId, _requestUserId: userId, _hostUserId: hostUserId}, {$set: {cancelRequestDriverSubmit: true, status: "CancelSubmitted"}})
            const updateDriverProfile = await DriverProfile.updateOne({_id: userId},{$inc: {numberOfAppointmentCancellations: 1}})

            const newNoti = await Notification.create({_receivingUserId: hostUserId, _sendingUserId: userId, notificationType: "CancelSubmitted", 
                _relatedAppointment: foundAppointment._id, start: foundAppointment.start, end: foundAppointment.end, address: foundAppointment.address})

            if(foundUser.emailNotifications){
                const success = await sendNotiEmail({firstName: foundUser.firstName, toUser:foundUser.email, notificationType: "CancelSubmitted"})
                if(success){
                    doneEmail = true
                }
            } else {
                doneEmail = true
            }

            if(foundUser.smsNotifications){
                const success = await sendSmsNotification(hostUserId, "CancelSubmitted")
                if(success){
                    doneSms = true
                }
            } else {
                doneSms = true
            }

            if(updateAppointment && updateDriverProfile && newNoti && doneEmail && doneSms){

                return res.status(201).json({ message: 'Success' })
            }
        
        } else {
            return res.status(401).json({ message: 'Failed' })
        }

    } catch(err){

        console.log(err)
        return res.status(401).json({ message: 'Failed' })
    }
}

const addDriverReject = async (req, res) =>{

    const { userId, hostUserId, appointmentId } = req.body

    if (!userId || !appointmentId || !hostUserId ) return res.status(400).json({ 'message': 'Missing required fields!' });

    try {

        const foundUser = await User.findOne({_id: userId})
        const foundAppointment = await Appointment.findOne({_id: appointmentId, status: "Requested"})

        var doneEmail = false;
        var doneSms = false;

        if(foundUser && foundAppointment){

            const updateAppointment = await Appointment.updateOne({_id: appointmentId, _requestUserId: userId, _hostUserId: hostUserId}, {$set: {status: "Cancelled"}})
            const updateDriverProfile = await DriverProfile.updateOne({_id: userId},{$inc: {numberOfAppointmentCancellations: 1}})

            const newNoti = await Notification.create({_receivingUserId: hostUserId, _sendingUserId: userId, notificationType: "Cancelled", 
                    _relatedAppointment: foundAppointment._id, start: foundAppointment?.start, end: foundAppointment?.end, address: foundAppointment?.address})

            if (foundUser.escrow?.length > 0){

                var escrow = false;
                for(let i=0; i<foundUser.escrow?.length; i++){
                    if(foundUser.escrow[i].amount > foundAppointment.chargeAmount && foundUser.escrow[i].currency.toLowerCase() === foundAppointment?.currency.toLowerCase() ){
                        
                        foundUser.escrow[i].amount = foundUser.escrow[i].amount - foundAppointment.chargeAmount
                        escrow = true;
                        break
                    }
                }

                if(!escrow){
                    return res.status(401).json({ message: 'Operation failed' })    
                
                } else {

                    if(foundUser?.credits?.length > 0){
                        var credited = false
                        for(let i=0; i<foundUser?.credits?.length > 0; i++){
                            if(foundUser.credits[i].currency.toLowerCase() === foundAppointment.currency.toLowerCase()){
                                foundUser.credits[i].amount = foundUser?.credits[i].amount + foundAppointment.chargeAmount
                                credited = true;
                                break
                            }
                        }
                        if(!credited){
                            foundUser.credits.push({amount: foundAppointment.chargeAmount, currency: foundAppointment.currency, 
                                currencySymbol: foundAppointment.currencySymbol})
                        }
                    } else {
                        foundUser.credits = [{amount: foundAppointment.chargeAmount, currency: foundAppointment.currency, 
                            currencySymbol: foundAppointment.currencySymbol}]
                    }
                }

            } else {

                return res.status(401).json({ message: 'Operation failed' })
            }

            if(foundUser.emailNotifications){
                const success = await sendNotiEmail({firstName: foundUser.firstName, toUser:foundUser.email, notificationType: "Cancelled"})
                if(success){
                    doneEmail = true
                }
            } else {
                doneEmail = true
            }

            if(foundUser.smsNotifications){
                const success = await sendSmsNotification(hostUserId, "Cancelled")
                if(success){
                    doneSms = true
                }
            } else {
                doneSms = true
            }

            const savedUser = await foundUser.save()

            if(updateAppointment && updateDriverProfile && newNoti 
                && doneEmail && doneSms && savedUser){

                return res.status(201).json({ message: 'Success' })
            }
        
        } else {
            return res.status(401).json({ message: 'Failed' })
        }

    } catch(err) {

        console.log(err)
        return res.status(401).json({ message: 'Failed' })
    }
}

const driverRequestCancelApprove = async (req, res) =>{

    const { userId, hostUserId, appointmentId } = req.body    

    if (!userId || !appointmentId || !hostUserId ) return res.status(400).json({ 'message': 'Missing required fields!' });

    try {

        const foundUser = await User.findOne({_id: userId})
        const foundAppointment = await Appointment.findOne({_id: appointmentId})

        var doneEmail = false;
        var doneSms = false;

        if(foundUser && foundAppointment?.cancelRequestHostSubmit){
                
            const foundDriverProfile = await DriverProfile.updateOne({_userId: userId},{$inc: {numberOfAppointmentCancellations: 1}})
            const foundHostProfile = await HostProfile.updateOne({_userId: hostUserId},{$inc: {numberOfAppointmentCancellations: 1}})

            const newNoti = await Notification.create({_receivingUserId: hostUserId, _sendingUserId: userId, notificationType: "Cancelled", 
                    _relatedAppointment: foundAppointment._id, start: foundAppointment?.start, end: foundAppointment?.end, address: foundAppointment?.address })    

            if(foundUser.emailNotifications){
                const success = await sendNotiEmail({firstName: foundUser.firstName, toUser:foundUser.email, notificationType: "Cancelled"})
                if(success){
                    doneEmail = true
                }
            } else {
                doneEmail = true
            }

            if(foundUser.smsNotifications){
                const success = await sendSmsNotification(hostUserId, "Cancelled")
                if(success){
                    doneSms = true
                }
            } else {
                doneSms = true
            }

            if(foundDriverProfile && foundHostProfile && newNoti && doneEmail && doneSms){

                const updatedAppointment = await Appointment.updateOne({_id: appointmentId},{$set:{status: "Cancelled"}})

                if(updatedAppointment){

                    return res.status(201).json({ message: 'Success' })
                
                } else {
        
                    return res.status(400).json({ message:'Operation Failed' });
                }
            }

        } else {

            return res.status(401).json({ message: 'Failed' })
        }

    } catch(err){

        console.log(err)
        return res.status(401).json({ message: 'Failed' })
    }
}

const hostRequestCancelSubmit = async (req, res) =>{

    const { userId, hostUserId, appointmentId } = req.body 

    if (!userId || !appointmentId || !hostUserId ) return res.status(400).json({ 'message': 'Missing required fields!' });

    var doneEmail = false;
    var doneSms = false;

    try {

        const foundUser = await User.findOne({_id: userId})
        const foundHost = await User.findOne({_id: hostUserId})
        const foundAppointment = await Appointment.findOne({_id: appointmentId})

        if(foundUser && foundHost && foundAppointment.status === "Approved"){

            const updateAppointment = await Appointment.updateOne({_id: appointmentId, _requestUserId: userId, _hostUserId: hostUserId}, {$set: {cancelRequestHostSubmit: true, status: "Cancelled"}})
            const updateHostProfile = await HostProfile.updateOne({_id: hostUserId},{$inc: {numberOfAppointmentCancellations: 1}})

            const newPayment = await Payment.create({_sendingUserId: hostUserId, _receivingUserId: userId, amount: foundAppointment.chargeAmount,
                currency: foundAppointment.currency, currencySymbol: foundAppointment.currencySymbol})

            if (foundHost.escrow?.length > 0){

                var balance = false;
                for(let i=0; i<foundHost.escrow?.length; i++){
                    
                    if(foundHost.escrow[i].currency.toLowerCase() === foundAppointment?.currency.toLowerCase() 
                        && foundHost.escrow[i].amount > foundAppointment?.chargeAmount){
                        
                        foundHost.escrow[i].amount = foundHost.escrow[i].amount - foundAppointment.chargeAmount
                        balance = true;
                        break
                    }
                }

                if(!balance){
                    return res.status(401).json({ message: 'Operation failed' })    
                } else {
                    if(foundUser?.credits?.length > 0){
                        var credited = false
                        for(let i=0; i<foundUser?.credits?.length > 0; i++){
                            if(foundUser.credits[i].currency.toLowerCase() === foundAppointment.currency.toLowerCase()){
                                foundUser.credits[i].amount = foundUser?.credits[i].amount + foundAppointment.chargeAmount
                                credited = true;
                                break
                            }
                        }
                        if(!credited){
                            foundUser.credits.push({amount: foundAppointment.chargeAmount, currency: foundAppointment.currency, 
                                currencySymbol: foundAppointment.currencySymbol})
                        }
                    } else {
                        foundUser.credits = [{amount: foundAppointment.chargeAmount, currency: foundAppointment.currency, 
                            currencySymbol: foundAppointment.currencySymbol}]
                    }
                }

            } else {

                return res.status(401).json({ message: 'Operation failed' })
            }

            const newNoti = await Notification.create({_receivingUserId: userId, _sendingUserId: hostUserId, notificationType: "Cancelled", 
                    _relatedAppointment: foundAppointment._id, start: foundAppointment?.start, end: foundAppointment?.end, address: foundAppointment?.address})    

            if(foundUser.emailNotifications){
                const success = await sendNotiEmail({firstName: foundUser.firstName, toUser:foundUser.email, notificationType: "Cancelled"})
                if(success){
                    doneEmail = true
                }
            } else {
                doneEmail = true
            }

            const savedUser = await foundUser.save()
            const savedHost = await foundHost.save()

            if(foundUser.smsNotifications){
                const success = await sendSmsNotification(hostUserId, "Cancelled")
                if(success){
                    doneSms = true
                }
            } else {
                doneSms = true
            }

            if(newPayment && updateAppointment && updateHostProfile && newNoti && doneEmail 
                && doneSms && savedUser && savedHost){

                const driverPayment = await DriverProfile.updateOne({_userId: userId}, {$push: {outgoingPayments: {
                    _paymentId: newPayment._id, amount: foundAppointment.chargeAmount, currency: foundAppointment.currency,
                    currencySymbol: foundAppointment.currencySymbol
                }}})

                const hostPayment = await HostProfile.updateOne({_userId: hostUserId}, {$push: {incomingPayments: {
                    _paymentId: newPayment._id, amount: foundAppointment.chargeAmount, currency: foundAppointment.currency,
                    currencySymbol: foundAppointment.currencySymbol
                }}})

                if(driverPayment && hostPayment){

                    return res.status(201).json({ message: 'Success' })
                
                } else {
        
                    return res.status(400).json({ message:'Operation Failed' });
                }
            }

        } else {

            return res.status(401).json({ message: 'Failed' })
        }

    } catch(err){

        console.log(err)
        return res.status(401).json({ message: 'Failed' })
    }
}

const addHostReject = async (req, res) =>{

    const { userId, hostUserId, appointmentId } = req.body 

    if (!userId || !appointmentId || !hostUserId ) return res.status(400).json({ 'message': 'Missing required fields!' });

    var doneEmail = false;
    var doneSms = false;

    try {

        const foundUser = await User.findOne({_id: userId})
        const foundAppointment = await Appointment.findOne({_id: appointmentId})

        if(foundUser && foundAppointment){

            const updateAppointment = await Appointment.updateOne({_id: appointmentId, _requestUserId: userId, _hostUserId: hostUserId}, {$set: {status: "Cancelled"}})
            const updateHostProfile = await HostProfile.updateOne({_id: hostUserId},{$inc: {numberOfAppointmentCancellations: 1}})

            if (foundUser.escrow?.length > 0){

                var escrow = false;
                for(let i=0; i<foundUser.escrow?.length; i++){
                    if(foundUser.escrow[i].amount > foundAppointment.chargeAmount && foundUser.escrow[i].currency.toLowerCase() === foundAppointment?.currency.toLowerCase() ){
                        
                        foundUser.escrow[i].amount = foundUser.escrow[i].amount - foundAppointment.chargeAmount
                        escrow = true;
                        break
                    }
                }

                if(!escrow){
                    return res.status(401).json({ message: 'Operation failed' })    
                
                } else {

                    if(foundUser?.credits?.length > 0){
                        var credited = false
                        for(let i=0; i<foundUser?.credits?.length > 0; i++){
                            if(foundUser.credits[i].currency.toLowerCase() === foundAppointment.currency.toLowerCase()){
                                foundUser.credits[i].amount = foundUser?.credits[i].amount + foundAppointment.chargeAmount
                                credited = true;
                                break
                            }
                        }
                        if(!credited){
                            foundUser.credits.push({amount: foundAppointment.chargeAmount, currency: foundAppointment.currency, 
                                currencySymbol: foundAppointment.currencySymbol})
                        }
                    } else {
                        foundUser.credits = [{amount: foundAppointment.chargeAmount, currency: foundAppointment.currency, 
                            currencySymbol: foundAppointment.currencySymbol}]
                    }
                }

            } else {

                return res.status(401).json({ message: 'Operation failed' })
            }

            const savedUser = await foundUser.save()

            const newNoti = await Notification.create({_receivingUserId: userId, _sendingUserId: hostUserId, notificationType: "Cancelled", 
                    _relatedAppointment: foundAppointment._id, start: foundAppointment?.start, end: foundAppointment?.end, address: foundAppointment?.address})    

            if(foundUser.emailNotifications){
                const success = await sendNotiEmail({firstName: foundUser.firstName, toUser:foundUser.email, notificationType: "CancelSubmitted"})
                if(success){
                    doneEmail = true
                }
            } else {
                doneEmail = true
            }

            if(foundUser.smsNotifications){
                const success = await sendSmsNotification(hostUserId, "CancelSubmitted")
                if(success){
                    doneSms = true
                }
            } else {
                doneSms = true
            }

            if(updateAppointment && updateHostProfile && newNoti 
                && doneEmail && doneSms && savedUser){

                return res.status(201).json({ message: 'Success' })
            }

        } else {

            return res.status(401).json({ message: 'Failed' })
        }

    } catch(err){

        console.log(err)
        return res.status(401).json({ message: 'Failed' })
    }
}


const hostRequestCancelApprove = async (req, res) =>{

    const { userId, hostUserId, appointmentId } = req.body    

    if (!userId || !appointmentId || !hostUserId ) return res.status(400).json({ 'message': 'Missing required fields!' });

    try {

        const foundUser = await User.findOne({_id: userId})
        const foundHost = await User.findOne({_id: hostUserId})
        const foundAppointment = await Appointment.findOne({_id: appointmentId})

        var doneEmail = false;
        var doneSms = false;

        if(foundUser && foundHost && foundAppointment?.cancelRequestDriverSubmit){
                
            const updatedAppointment = await Appointment.updateOne({_id: appointmentId},{$set:{status: "Cancelled"}})
            const foundDriverProfile = await DriverProfile.updateOne({_userId: userId},{$inc: {numberOfAppointmentCancellations: 1}})
            const foundHostProfile = await HostProfile.updateOne({_userId: hostUserId},{$inc: {numberOfAppointmentCancellations: 1}})

            const newNoti = await Notification.create({_receivingUserId: userId, _sendingUserId: hostUserId, notificationType: "Cancelled", 
                    _relatedAppointment: foundAppointment._id, start: foundAppointment?.start, end: foundAppointment?.end, address: foundAppointment?.address})

            const newPayment = await Payment.create({_sendingUserId: hostUserId, _receivingUserId: userId, amount: foundAppointment.chargeAmount,
                currency: foundAppointment.currency, currencySymbol: foundAppointment.currencySymbol})

            if (foundHost.escrow?.length > 0){

                var escrow = false;
                for(let i=0; i<foundHost.escrow?.length; i++){
                    
                    if(foundHost.escrow[i].currency.toLowerCase() === foundAppointment?.currency.toLowerCase() 
                        && foundHost.escrow[i].amount > foundAppointment?.chargeAmount){
                        
                        foundHost.escrow[i].amount = foundHost.escrow[i].amount - foundAppointment.chargeAmount
                        escrow = true;
                        break
                    }
                }

                if(!escrow){
                    return res.status(401).json({ message: 'Operation failed' })    
                } else {
                    if(foundUser?.credits?.length > 0){
                        var credited = false
                        for(let i=0; i<foundUser?.credits?.length > 0; i++){
                            if(foundUser.credits[i].currency.toLowerCase() === foundAppointment.currency.toLowerCase()){
                                foundUser.credits[i].amount = foundUser?.credits[i].amount + foundAppointment.chargeAmount
                                credited = true;
                                break
                            }
                        }
                        if(!credited){
                            foundUser.credits.push({amount: foundAppointment.chargeAmount, currency: foundAppointment.currency, 
                                currencySymbol: foundAppointment.currencySymbol})
                        }
                    } else {
                        foundUser.credits = [{amount: foundAppointment.chargeAmount, currency: foundAppointment.currency, 
                            currencySymbol: foundAppointment.currencySymbol}]
                    }
                }

            } else {

                return res.status(401).json({ message: 'Operation failed' })
            }

            const savedUser = await foundUser.save()
            const savedHost = await foundHost.save()

            if(foundUser.emailNotifications){
                const success = await sendNotiEmail({firstName: foundUser.firstName, toUser:foundUser.email, notificationType: "Cancelled"})
                if(success){
                    doneEmail = true
                }
            } else {
                doneEmail = true
            }

            if(foundUser.smsNotifications){
                const success = await sendSmsNotification(hostUserId, "Cancelled")
                if(success){
                    doneSms = true
                }
            } else {
                doneSms = true
            }

            if(newPayment && foundDriverProfile && foundHostProfile && newNoti && doneEmail 
                && doneSms && savedUser && savedHost && updatedAppointment){

                const driverPayment = await DriverProfile.updateOne({_userId: userId}, {$push: {outgoingPayments: {
                    _paymentId: newPayment._id, amount: foundAppointment.chargeAmount, currency: foundAppointment.currency,
                    currencySymbol: foundAppointment.currencySymbol
                }}})

                const hostPayment = await HostProfile.updateOne({_userId: hostUserId}, {$push: {incomingPayments: {
                    _paymentId: newPayment._id, amount: foundAppointment.chargeAmount, currency: foundAppointment.currency,
                    currencySymbol: foundAppointment.currencySymbol
                }}})

                if(driverPayment && hostPayment){

                    return res.status(201).json({ message: 'Success' })
                
                } else {
        
                    return res.status(400).json({ message:'Operation Failed' });
                }
            }

        } else {

            return res.status(401).json({ message: 'Failed' })
        }

    } catch(err){

        return res.status(401).json({ message: 'Failed' })
    }
}


const removeAppointment = async (req, res) => {

    const { userId, hostUserId, appointmentId } = req.body    

    if (!userId || !appointmentId || !hostUserId ) return res.status(400).json({ 'message': 'Missing required fields!' });

    const foundUser = await User.findOne({_id: userId}).select("_id deactivated")

    if(!foundUser){

        return res.status(403).json({ message: 'User ID Required' })
    
    } else {

        if(! Object.values(foundUser.roles).includes(5150)){

            return res.status(403).json({ message: 'User ID Required' })
        
        } else {

            var foundAppointment = await Appointment.findOne({_id: appointmentId})

            if(foundAppointment){
                
                const foundDriverProfile = await DriverProfile.findOne({_userId: userId})
                const foundHostProfile = await HostProfile.findOne({_userId: hostUserId})

                if(foundDriverProfile && foundHostProfile){

                    foundDriverProfile?.userAppointments.pull({_appointmentId: appointmentId})
                    foundHostProfile?.hostAppointments.pull({_appointmentId: appointmentId})

                    const savedDriver = await foundDriverProfile.save()
                    const savedHost = await foundHostProfile.save()

                    if(savedDriver && savedHost){

                        return res.status(201).json({ message: 'Success' })
                    
                    } else {
            
                        return res.status(400).json({ message:'Operation Failed' });
                    }
                }
            
            } else {
            
                return res.status(401).json({ message: 'Failed' })
            }
        }
    }
}



module.exports = { getHostAppointments, getDriverAppointments, addAppointmentRequest, addAppointmentApproval, addAppointmentCompletion, 
    driverRequestCancelSubmit, driverRequestCancelApprove, hostRequestCancelSubmit, hostRequestCancelApprove, removeAppointment,
    addDriverReject, addHostReject }