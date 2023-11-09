const User = require('../../model/User');
const DriverProfile = require('../../model/DriverProfile');
const HostProfile = require('../../model/HostProfile');
const Appointment = require('../../model/Appointment');

const Flags = require('../../model/Flags');
const UsageLimit = require('../../model/UsageLimit');
const BannedUser = require("../../model/BannedUser");
const  {deleteFile} = require("../../controllers/media/s3Controller");

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

    console.log(userId, currentDate)

    if (!userId || !currentDate ) {
        return res.status(400).json({ message: 'Missing required information' })
    }

    const foundHostProfile = await HostProfile.findOne({_userId: userId})

    if(foundHostProfile){        

        console.log("Found host profile", foundHostProfile.hostAppointments.length)

        const hostAppointments = await Appointment.find({ _id: {$in: foundHostProfile?.hostAppointments.map(e => e._appointmentId)}, 
            $or: [{requestDateStart: currentDate},{requestDateEnd: currentDate}] })

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

            console.log("Host appointments", hostAppointments.length)

            foundHostProfiles = await HostProfile.find({_userId: {$in: hostAppointments.map(e=>e._hostUserId)}})

            if(foundHostProfiles && foundHostProfiles?.length > 0){

                console.log("Host profiles nested", foundHostProfiles)

                userData = await User.find({_id: {$in: foundHostProfiles.map(e=>e._userId)}}).select("_id profilePicURL roles")

                if(userData){
                
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

    const foundDriverProfile = await DriverProfile.findOne({_userId: userId})

    if(foundDriverProfile){

        console.log("Found driver profile", foundDriverProfile.userAppointments.length)

        const userAppointments = await Appointment.find({ _id: {$in: foundDriverProfile?.userAppointments.map(e => e._appointmentId)}, 
            $or: [{requestDateStart: currentDate},{requestDateEnd: currentDate}]})

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

            foundHostProfiles = await HostProfile.find({_userId: {$in: userAppointments.map(e=>e._hostUserId)}})

            if(foundHostProfiles && foundHostProfiles?.length > 0){

                userData = await User.find({_id: {$in: foundHostProfiles.map(e=>e._userId)}}).select("_id profilePicURL roles")

                if(userData){

                    console.log("USer data here", userData)
                
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

    console.log(userId, hostUserId, appointmentStart, appointmentEnd)

    try {

        const foundHostProfile = await HostProfile.findOne({_userId: hostUserId})
        const foundDriverProfile = await DriverProfile.findOne({_userId: userId})
        const foundLimits = await UsageLimit.findOne({_userId: userId})

        var todaysDate = new Date().toLocaleDateString()

        var requestStart = new Date(appointmentStart)
        var requestEnd = new Date(appointmentEnd)
        var requestStartString = requestStart.toISOString().slice(0, 10)
        var requestEndString = requestEnd.toISOString().slice(0, 10)
        
        var doneHostAppointments = false;
        var doneDriverAppointments = false;
        var doneOperation = false;

        if (foundDriverProfile && foundHostProfile && foundLimits ){

            if(foundLimits.numberOfAppointments?.length > 0){

                if(foundLimits.numberOfAppointments?.some(e=>e.date === todaysDate)){

                    for(let i=0; i< foundLimits.numberOfAppointments.length; i++){

                        if(foundLimits.numberOfAppointments[i].date === todaysDate){
    
                            if(foundLimits.numberOfAppointments[i].appointmentsNumber >= 30){
                                
                                return res.status(401).json({ message: 'Reached bookmarks limit for today' })
                            
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

            const newToken = crypto.randomBytes(16).toString('hex')

            const checkAppointments = await Appointment.findOne(
                {$and:[
                    {$or: [{_requestUserId: userId}, {_hostUserId: hostUserId}]}, 
                    {$or: [ 
                        { start : { $lt: requestStart }, end : { $gt: requestStart } },
                        { start : { $lt: requestEnd }, end : { $gt: requestEnd } },
                        { start : { $gt: requestStart }, end : { $lt: requestEnd } }]}, 
                    {$or: [{status: "Approved" }, {status: "Requested" }]}
                ]})

            if(!checkAppointments){

                const newAppointment = await Appointment.create({_requestUserId: userId, _hostUserId: hostUserId, passcode: newToken,
                    start: appointmentStart, end: appointmentEnd, requestDateStart: requestStartString, 
                    requestDateEnd: requestEndString})
    
                if(newAppointment){
    
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
                }
    
                if(doneHostAppointments && doneDriverAppointments && doneOperation){
                    
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

        const foundAppointment = await Appointment.findOne({_id: appointmentId})

        if(foundAppointment && foundAppointment.status === "Requested"){

            //Check for overlaps
            const requestStart = foundAppointment.start
            const requestEnd = foundAppointment.end

            const checkAppointments = await Appointment.findOne(
                {$and:[
                    {$or: [{_requestUserId: userId}, {_hostUserId: hostUserId}]}, 
                    {$or: [ 
                        { start : { $lt: requestStart }, end : { $gt: requestStart } },
                        { start : { $lt: requestEnd }, end : { $gt: requestEnd } },
                        { start : { $gt: requestStart }, end : { $lt: requestEnd } }]}, 
                    {$or: [{status: "Approved" }, {status: "Requested" }]}
                ]})

            if(!checkAppointments){

                const updatedAppointment = await Appointment.updateOne({_id: appointmentId},{$set:{status: "Approved"}})

                if(updatedAppointment){
                    
                    return res.status(201).json({ message: 'Success' })

                } else {

                    return res.status(401).json({ message: 'Operation failed' })
                }

            } else {

                console.log("Already have appointment overlapping during this time")
                return res.status(403).json({ message: 'Overlapping slots' })
            }
        }

    } catch(err){


    }
}

const driverRequestCancelSubmit = async (req, res) =>{

    const { userId, hostUserId, appointmentId } = req.body    

    if (!userId || !appointmentId || !hostUserId ) return res.status(400).json({ 'message': 'Missing required fields!' });

    try {

        const foundAppointment = await Appointment.updateOne({_id: appointmentId, _requestUserId: userId, _hostUserId: hostUserId}, {$set: {cancelRequestDriverSubmit: true, status: "CancelSubmitted"}})
        const updateDriverProfile = await DriverProfile.updateOne({_id: userId},{$inc: {numberOfAppointmentCancellations: 1}})

        if(foundAppointment && updateDriverProfile){

            return res.status(201).json({ message: 'Success' })
        }

    } catch(err){

        console.log(err)
        return res.status(401).json({ message: 'Failed' })
    }
}

const driverRequestCancelApprove = async (req, res) =>{

    const { userId, hostUserId, appointmentId } = req.body    

    if (!userId || !appointmentId || !hostUserId ) return res.status(400).json({ 'message': 'Missing required fields!' });

    try {

        var foundAppointment = await Appointment.findOne({_id: appointmentId})

        if(foundAppointment && foundAppointment.cancelRequestHostSubmit){
            
            const foundDriverProfile = await DriverProfile.updateOne({_userId: userId},{$inc: {numberOfAppointmentCancellations: 1}})
            const foundHostProfile = await HostProfile.updateOne({_userId: hostUserId},{$inc: {numberOfAppointmentCancellations: 1}})

            if(foundDriverProfile && foundHostProfile){

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

    try {

        const foundAppointment = await Appointment.updateOne({_id: appointmentId, _requestUserId: userId, _hostUserId: hostUserId}, {$set: {cancelRequestHostSubmit: true, status: "CancelSubmitted"}})
        const updateHostProfile = await HostProfile.updateOne({_id: hostUserId},{$inc: {numberOfAppointmentCancellations: 1}})

        if(foundAppointment && updateHostProfile){

            return res.status(201).json({ message: 'Success' })
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

        var foundAppointment = await Appointment.findOne({_id: appointmentId})

        if(foundAppointment && foundAppointment.cancelRequestDriverSubmit){
            
            const foundDriverProfile = await DriverProfile.updateOne({_userId: userId},{$inc: {numberOfAppointmentCancellations: 1}})
            const foundHostProfile = await HostProfile.updateOne({_userId: hostUserId},{$inc: {numberOfAppointmentCancellations: 1}})

            if(foundDriverProfile && foundHostProfile){

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

        return res.status(401).json({ message: 'Failed' })
    }
}

const removeAppointment = async (req, res) => {

    const { userId, hostUserId, appointmentId } = req.body    

    if (!userId || !appointmentId || !hostUserId ) return res.status(400).json({ 'message': 'Missing required fields!' });

    const foundUser = await User.findOne({_id: userId}).select("_id deactivated roles")

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



module.exports = { getHostAppointments, getDriverAppointments, addAppointmentRequest, addAppointmentApproval, 
    driverRequestCancelSubmit, driverRequestCancelApprove, hostRequestCancelSubmit, hostRequestCancelApprove, removeAppointment }