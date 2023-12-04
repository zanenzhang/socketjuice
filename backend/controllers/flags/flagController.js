const User = require('../../model/User');
const Appointment = require('../../model/Appointment');
const Flags = require('../../model/Flags');
const UsageLimit = require('../../model/UsageLimit');
const ObjectId  = require('mongodb').ObjectId;

const S3 = require("aws-sdk/clients/s3");
const fns = require('date-fns')

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

const { sendHelpMessage } = require("../../middleware/mailer")


const getAllFlags = async (req, res) => {
    
    const { userId } = req.params

    if (!userId) {
        return res.status(400).json({ message: 'User ID Required' })
    }

    const checkUserRoles = await User.findOne({_id: userId}).select("roles")

    if(!checkUserRoles){

        return res.status(403).json({ message: 'User ID Required' })
    
    } else {

        if(! Object.values(checkUserRoles.roles).includes(5150)){

            return res.status(403).json({ message: 'User ID Required' })
        
        } else {

            const flaggedUsers = await User.find({flagged:true}).select("flagged username deactivated roles flagsCount profilePicURL")
            var usersDone = null;

            if(flaggedUsers){
                usersDone = true;
            } else {
                usersDone = true;
            }

            if(usersDone){

                return res.status(200).json({ flaggedUsers })
            }
        }
    }
}


const getAppointmentFlags = async (req, res) => {
    
    const { userId } = req.params

    if (!userId) {
        return res.status(400).json({ message: 'User ID Required' })
    }

    const checkUserRoles = await User.findOne({_id: userId}).select("roles")

    if(!checkUserRoles){

        return res.status(403).json({ message: 'User ID Required' })
    
    } else {

        if(! Object.values(checkUserRoles.roles).includes(5150)){

            return res.status(403).json({ message: 'User ID Required' })
        
        } else {

            const foundAppointments = await Appointment.find({flagged: true})
            const userData = await User.find({$or:[{_id: {$in: foundAppointments.map(e => e._requestUserId)}},
                {_id: {$in: foundAppointments.map(e => e._hostUserId)}}]}).select(" _id firstName lastName phonePrimary email ")

            if(foundAppointments && userData){
                return res.status(201).json({ foundAppointments, userData })
            }
        }
    }
}


const addUserFlag = async (req, res) => {

    const { loggedUserId, profileUserId } = req.body

    if (!loggedUserId || !profileUserId || loggedUserId === profileUserId ) return res.status(400).json({ 'message': 'Missing required fields!' });

    try {

        const userFlags = await Flags.findOne({_userId: loggedUserId})
        const foundLimits = await UsageLimit.findOne({_userId: loggedUserId})

        var todaysDate = new Date().toLocaleDateString()
        var doneOperation = false;

        if(foundLimits.numberOfFlagsGiven?.length > 0){

            if(foundLimits.numberOfFlagsGiven.some(e=>e.date === todaysDate)){

                for(let i=0; i< foundLimits.numberOfFlagsGiven.length; i++){

                    if(foundLimits.numberOfFlagsGiven[i].date === todaysDate){
    
                        if(foundLimits.numberOfFlagsGiven[i].flagsNumber >= 10){
                            
                            return res.status(401).json({ message: 'Reached flag limit for today' })
                        
                        } else {
    
                            foundLimits.numberOfFlagsGiven[i].flagsNumber = foundLimits.numberOfFlagsGiven[i].flagsNumber + 1
                            const savedLimits = await foundLimits.save()
    
                            if(savedLimits){
                                doneOperation = true;
                            }
                            
                            break;
                        }
                    }
                }
            
            } else {

                foundLimits.numberOfFlagsGiven.push({date: todaysDate, flagsNumber: 1 })
                const savedLimits = await foundLimits.save()
                if(savedLimits){
                    doneOperation = true;
                }
            }

        } else {

            foundLimits.numberOfFlagsGiven = [{date: todaysDate, flagsNumber: 1}]
            const savedLimits = await foundLimits.save()
            if(savedLimits){
                doneOperation = true;
            }
        }

        if(doneOperation){
        
            if (userFlags){

                if(userFlags.userFlags?.some(e=>e._userId.toString() === ((profileUserId)))){
    
                    return res.status(403).json({ message: 'Already flagged this comment' })
                
                } else {
    
                    if(userFlags.userFlags?.length > 0){
    
                        userFlags.userFlags?.push({_userId: profileUserId})
    
                    } else {
    
                        userFlags.userFlags = [{_userId: profileUserId}]
                    }
    
                    const savedUserFlags = await userFlags.save()
    
                    const foundUser = await User.findOne({_id: profileUserId})
                    
                    if(foundUser){
    
                        if(foundUser.flaggedBy?.length > 0){
    
                            if(foundUser.flaggedBy?.some(e=>e._userId.toString() === ((loggedUserId)))){
                                
                                return res.status(403).json({ message: 'Already flagged this comment' })
                            
                            } else {
    
                                foundUser.flaggedBy?.push({_userId: loggedUserId})
                            }
                        } else {
    
                            foundUser.flaggedBy = [{_userId: loggedUserId}]
    
                        }
    
                        foundUser.flagged = true;
                        foundUser.flagsCount = foundUser.flagsCount + 1
    
                        const savedPostFlag = await foundUser.save()
    
                        if(savedPostFlag && savedUserFlags){
    
                            return res.status(201).json({ message: 'Added comment flag' })    
                        }
                    
                    } else {
    
                        return res.status(401).json({ message: 'Operation failed' })
                    }
                }
                   
            } else {
    
                return res.status(401).json({ message: 'Operation failed' })
            }
        }
        
    } catch (err) {

        return res.status(400).json({ message: 'Failed' })
    }
}



const removeUserFlag = async (req, res) => {

    const { loggedUserId, profileUserId } = req.query

    if (!loggedUserId || !profileUserId ) return res.status(400).json({ 'message': 'Missing required fields!' });

    try {

        const foundUserFlags = await Flags.findOne({_userId: loggedUserId})

        if(foundUserFlags){

            if(foundUserFlags.userFlags?.some(e=>e._userId.toString() === profileUserId )){

                foundUserFlags.userFlags.pull({_userId: profileUserId})
            
                const savedFlags = await foundUserFlags.save()

                const foundUser = await User.findOne({_id: profileUserId})

                if(foundUser){

                    if(foundUser.flaggedBy?.some(e=>e._userId.toString() === loggedUserId)){
                            
                        foundUser.flaggedBy?.pull({_userId: loggedUserId})
                    
                    } else {

                        return res.status(403).json({ message: 'User did not flag this comment' })
                    }

                    foundUser.flagsCount = Math.max(foundUser.flagsCount - 1, 0)

                    if(foundUser.flagsCount === 0){

                        foundUser.flagged = false
                    }

                    const savedUserFlag = await foundUser.save()

                    if(savedUserFlag && savedFlags){

                        return res.status(200).json({ message:'Success, removed comment flag' });
                    }

                } else {

                    return res.status(400).json({ message:'Operation Failed' });
                }
            
            } else {

                return res.status(400).json({ message:'Operation Failed' });
            }

        } else {

            return res.status(400).json({ message: 'Failed' })
        }

    } catch (err) {

        return res.status(401).json({ message: 'Failed' })
    }
}


const removeAppointmentFlag = async (req, res) => {

    const { appointmentId } = req.query

    if ( !appointmentId ) return res.status(400).json({ 'message': 'Missing required fields!' });

    try {

        const foundAppointment = await Appointment.findOne({_id: appointmentId})

        if(foundAppointment){

            foundAppointment.flaggedBy = []
            foundAppointment.flagsCount = 0
            foundAppointment.flagged = false

            const userFlags = await Flags.updateMany({_userId: {$in: foundAppointment.flaggedBy.map(e => e._flaggedByUserId)}},
                {$pull: {appointmentFlags: {_appointmentId: appointmentId}}})

            const savedFlags = await foundAppointment.save()

            if( savedFlags && userFlags){

                return res.status(200).json({ message:'Success, removed comment flag' });

            } else {

                return res.status(400).json({ message:'Operation Failed' });
            }

        } else {

            return res.status(400).json({ message: 'Failed' })
        }

    } catch (err) {

        return res.status(401).json({ message: 'Failed' })
    }
}


const addAppointmentFlag = async (req, res) => {

    const { loggedUserId, appointmentId, comment } = req.body

    if (!loggedUserId || !appointmentId || !comment ) return res.status(400).json({ 'message': 'Missing required fields!' });

    try {

        const foundUser = await User.findOne({_id: loggedUserId})
        const userFlags = await Flags.findOne({_userId: loggedUserId})
        const foundLimits = await UsageLimit.findOne({_userId: loggedUserId})

        var todaysDate = new Date().toLocaleDateString()
        var doneOperation = false;

        if(foundLimits.numberOfFlagsGiven?.length > 0){

            if(foundLimits.numberOfFlagsGiven.some(e=>e.date === todaysDate)){

                for(let i=0; i< foundLimits.numberOfFlagsGiven.length; i++){

                    if(foundLimits.numberOfFlagsGiven[i].date === todaysDate){
    
                        if(foundLimits.numberOfFlagsGiven[i].flagsNumber >= 10){
                            
                            return res.status(401).json({ message: 'Reached flag limit for today' })
                        
                        } else {
    
                            foundLimits.numberOfFlagsGiven[i].flagsNumber = foundLimits.numberOfFlagsGiven[i].flagsNumber + 1
                            const savedLimits = await foundLimits.save()
    
                            if(savedLimits){
                                doneOperation = true;
                            }
                            
                            break;
                        }
                    }
                }
            
            } else {

                foundLimits.numberOfFlagsGiven.push({date: todaysDate, flagsNumber: 1 })
                const savedLimits = await foundLimits.save()
                if(savedLimits){
                    doneOperation = true;
                }
            }

        } else {

            foundLimits.numberOfFlagsGiven = [{date: todaysDate, flagsNumber: 1}]
            const savedLimits = await foundLimits.save()
            if(savedLimits){
                doneOperation = true;
            }
        }

        if(doneOperation && foundUser){
        
            if (userFlags){

                if(userFlags.appointmentFlags?.some(e=>e._appointmentId.toString() === appointmentId ) ){
    
                    return res.status(403).json({ message: 'Already flagged this comment' })
                
                } else {
    
                    if(userFlags.appointmentFlags?.length > 0){
    
                        userFlags.appointmentFlags?.push({_appointmentId: appointmentId })
    
                    } else {
    
                        userFlags.appointmentFlags = [{_appointmentId: appointmentId}]
                    }
    
                    const savedUserFlags = await userFlags.save()
    
                    const foundAppointment = await Appointment.findOne({_id: appointmentId})
                    
                    if(foundAppointment && savedUserFlags){

                        var violationUserId = ""
                        var whichpartyflagged = 0

                        if(foundAppointment._requestUserId.toString() === loggedUserId){
                            violationUserId = foundAppointment._hostUserId
                            whichpartyflagged = 1
                        } else {
                            violationUserId = foundAppointment._requestUserId 
                            whichpartyflagged = 2
                        }
    
                        if(foundAppointment.flaggedBy?.length > 0){
    
                            if(foundAppointment.flaggedBy?.some(e=>e._flaggedByUserId.toString() === loggedUserId)){
                                
                                return res.status(403).json({ message: 'Already flagged this comment' })
                            
                            } else {
    
                                foundAppointment.flaggedBy?.push({_flaggedByUserId: loggedUserId, _violationUserId: violationUserId, 
                                    flaggedByDriverOrHost: whichpartyflagged, comment: comment })
                            }
                        } else {
    
                            foundAppointment.flaggedBy = [{_flaggedByUserId: loggedUserId, _violationUserId: violationUserId, flaggedByDriverOrHost: whichpartyflagged,
                                comment: comment }]
    
                        }
    
                        foundAppointment.flagged = true;
                        foundAppointment.flagsCount = foundAppointment.flagsCount + 1
    
                        const savedFlag = await foundAppointment.save()
                        const problemUser = await User.findOne({_id: violationUserId})
    
                        if(savedFlag && savedUserFlags && problemUser){

                            problemUser.flagged = true
                            problemUser.flagsCount = problemUser.flagsCount + 1
                            
                            if(problemUser.flaggedBy?.length > 0){
                                problemUser.flaggedBy.push({_userId: loggedUserId})
                            } else {
                                problemUser.flaggedBy = [{_userId: loggedUserId}]
                            }

                            //send flag email and sms message
                            const sentEmail = await sendHelpMessage({submitterName: foundUser.firstName, submitterPhone: foundUser.phonePrimary, submitterUserId: foundUser._id, 
                                appointmentId: foundAppointment._id, problemName: problemUser.firstName, problemUserId: problemUser._id, problemPhone: problemUser.phonePrimary,
                                comment: comment })
                            
                            const sentSMS = await sendFlagSMS({submitterName: foundUser.firstName, submitterPhone: foundUser.phonePrimary, 
                                appointmentId: foundAppointment._id, comment: comment} )

                            const savedUser = await problemUser.save()

                            if(savedUser && sentEmail && sentSMS){
                                return res.status(201).json({ message: 'Added appointment flag' })    
                            } else {
                                return res.status(401).json({ message: 'Operation failed' })
                            }
                        }
                    
                    } else {
    
                        return res.status(401).json({ message: 'Operation failed' })
                    }
                }
                   
            } else {
    
                return res.status(401).json({ message: 'Operation failed' })
            }
        }
        
    } catch (err) {

        return res.status(400).json({ message: 'Failed' })
    }
}


const clearUserFlags = async (req, res) => {

    const { loggedUserId, profileUserId } = req.query

    if (!loggedUserId || !profileUserId ) return res.status(400).json({ 'message': 'Missing required fields!' });

    try {

        const checkUser = await User.findOne({_id: loggedUserId})

        if(checkUser){

            if(! Object.values(checkUser.roles).includes(5150)){

                return res.status(404).json({'message': "Missing required information"})
            }

            const foundUser = await User.findOne({_id: profileUserId})

            if(foundUser){

                const foundUserFlags = await Flags.updateMany({_userId: {$in: foundUser.flaggedBy.map(e=>e._userId)}},{$pull: {userFlags: {_userId: loggedUserId}}})

                if(foundUserFlags){

                    foundUser.flaggedBy = [];
                    foundUser.flagsCount = 0;
                    foundUser.flagged = false;

                    const saved = await foundUser.save()

                    if(saved){
                        return res.status(200).json({'message': 'Cleared flags'})
                    }
                }
            }
        }

    } catch (err) {

        return res.status(401).json({ message: 'Failed' })
    }
}

module.exports = { getAllFlags, getAppointmentFlags, addUserFlag, removeUserFlag, clearUserFlags, 
    addAppointmentFlag, removeAppointmentFlag }