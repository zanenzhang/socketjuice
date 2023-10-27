const User = require('../../model/User');
const DriverProfile = require('../../model/DriverProfile');
const HostProfile = require('../../model/HostProfile');
const Appointment = require('../../model/Appointment');

const Flags = require('../../model/Flags');
const UsageLimit = require('../../model/UsageLimit');
const BannedUser = require("../../model/BannedUser");
const BannedProduct = require("../../model/BannedProduct");
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
    
    var { userId, pageNumber } = req.query

    if (!userId || !pageNumber ) {
        return res.status(400).json({ message: 'Missing required information' })
    }

    if(Number(pageNumber) === NaN || Number(pageNumber) < 0 || Number(pageNumber) > 1000){
        return res.status(400).json({ message: 'Content does not meet requirements' })
    }
    pageNumber = Number(pageNumber)

    const foundHostProfile = await HostProfile.findOne({_userId: userId})

    if(foundHostProfile){

        const userAppointments = await Appointment.findOne({ _id: {$in: foundHostProfile?.hostAppointments.map(e => e._appointmentId)} })
        const flaggedList = await Flags.findOne({_userId: userId}).select("userFlags")

        let foundHostProfiles = null;

        let userData = false;
        let doneFlags = false;
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

        if(userAppointments.length > 0){

            foundHostProfiles = await HostProfile.find({_id: {$in: userAppointments.map(e=>e._hostUserId)}})

            if(foundHostProfiles?.length > 0){

                userData = await User.find({_id: {$in: foundHostProfiles.map(e=>e._userId)}}).select("_id profilePicURL roles")

                doneData = true;

            } else {
            
                stop = 1
                return res.status(201).json({stop})
            }

            if(doneFlags && doneData && userData){

                return res.status(201).json({userAppointments, foundHostProfiles, userData, flaggedUsers, stop})
            }
        
        } else {

            stop = 1
            donePosts = true;
            userData = []
            foundHostProfiles = []
            userAppointments = []

            if(donePosts && doneFlags){
                
                return res.status(201).json({userAppointments, foundHostProfiles, userData, flaggedUsers, stop})
            }
        }
    }
}   


const getDriverAppointments = async (req, res) => {
    
    var { userId, pageNumber } = req.query

    if (!userId || !pageNumber ) {
        return res.status(400).json({ message: 'Missing required information' })
    }

    if(Number(pageNumber) === NaN || Number(pageNumber) < 0 || Number(pageNumber) > 1000){
        return res.status(400).json({ message: 'Content does not meet requirements' })
    }
    pageNumber = Number(pageNumber)

    const foundDriverProfile = await DriverProfile.findOne({_userId: userId})

    if(foundDriverProfile){

        const userAppointments = await Appointment.findOne({ _id: {$in: foundDriverProfile?.userAppointments.map(e => e._appointmentId)} })
        const flaggedList = await Flags.findOne({_userId: userId}).select("userFlags")

        let foundHostProfiles = null;

        let userData = false;
        let doneFlags = false;
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

        if(userAppointments?.length > 0){

            foundHostProfiles = await HostProfile.find({_id: {$in: userAppointments.map(e=>e._hostUserId)}})

            if(foundHostProfiles?.length > 0){

                userData = await User.find({_id: {$in: foundHostProfiles.map(e=>e._userId)}}).select("_id profilePicURL roles")

                doneData = true;

            } else {
            
                stop = 1
                return res.status(201).json({stop})
            }

            if(doneFlags && doneData && userData){

                return res.status(201).json({userAppointments, foundHostProfiles, userData, flaggedUsers, stop})
            }
        
        } else {

            stop = 1
            donePosts = true;
            userData = []
            foundHostProfiles = []
            userAppointments = []

            if(donePosts && doneFlags){
                
                return res.status(201).json({userAppointments, foundHostProfiles, userData, flaggedUsers, stop})
            }
        }
    }
}   


const addAppointment = async (req, res) => {

    const { userId, hostUserId, appointmentStart, appointmentEnd } = req.body

    if (!userId || !hostUserId ) return res.status(400).json({ 'message': 'Missing required fields!' });

    try {

        const foundHostProfile = await HostProfile.findOne({_userId: hostUserId})
        const foundDriverProfile = await DriverProfile.findOne({_userId: userId})
        const foundLimits = await UsageLimit.findOne({_userId: userId})

        var todaysDate = new Date().toLocaleDateString()
        
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

            const newAppointment = await Appointment.create({_requestUserId: userId, _hostUserId: hostUserId, passcode: newToken,
                appointmentStart: appointmentStart, appointmentEnd: appointmentEnd})

            if(newAppointment){

                foundHostProfile.numberOfHostAppointments = foundHostProfile.numberOfHostAppointments + 1
            
                if(foundHostProfile.hostAppointments?.length > 0){
                
                    foundHostProfile.push({_appointmentId: newAppointment._id})

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

                foundDriverProfile.numberOfHostAppointments = foundDriverProfile.numberOfHostAppointments + 1
            
                if(foundDriverProfile.hostAppointments?.length > 0){
                
                    foundDriverProfile.push({_appointmentId: newAppointment._id})

                    const savedDriverProfile = await foundDriverProfile.save()

                    if(savedDriverProfile){
                        doneDriverAppointments= true;
                    }
                
                } else {

                    foundDriverProfile.hostAppointments = [{_appointmentId: newAppointment._id}]
                    
                    const savedDriverProfile = await foundDriverProfile.save()

                    if(savedDriverProfile){
                        doneDriverAppointments= true;
                    }
                }
            }

            if(doneHostAppointments && doneDriverAppointments && doneOperation && savedProfile){
                
                return res.status(201).json({ message: 'Success' })
            
            } else {

                return res.status(401).json({ message: 'Operation failed' })
            }   
          
        } else {

            return res.status(401).json({ message: 'Operation failed' })
        }
        
    } catch (err) {

        return res.status(400).json({ message: 'Failed' })
    }
}


const removeAppointment = async (req, res) => {

    //Can only be removed if not approved by both parties, otherwise subject to a cancellation fee

    const { userId, hostUserId } = req.query

    if (!userId || !hostUserId ) return res.status(400).json({ 'message': 'Missing required fields!' });

    try {

        var foundHostProfile = await HostProfile.findOne({_id: hostUserId})

        var donePost = false;

        if(foundHostProfile){
            
            const updatedBookmark = await Bookmark.updateOne({ _userId: hostUserId }, { $pull: { bookmarks: { _hostProfileId: hostUserId }}})

            if(updatedBookmark){

                if(foundHostProfile.bookmarksCount > 0){
                    foundHostProfile.bookmarksCount = foundHostProfile.bookmarksCount - 1
                }

                if(foundHostProfile.bookmarkedBy?.length > 0 && foundHostProfile.bookmarkedBy?.some(e=>e._userId.toString() === userId)){

                    for(let i=0; i<foundHostProfile.bookmarkedBy.length; i++){

                        if(foundHostProfile.bookmarkedBy[i]._userId.toString() === userId){
                            
                            if(foundHostProfile.bookmarkedBy[i].bookmarkedCount > 1){
                                
                                foundHostProfile.bookmarkedBy[i].bookmarkedCount = foundHostProfile.bookmarkedBy[i].bookmarkedCount - 1
                            
                            } else {

                                foundHostProfile.bookmarkedBy.pull({_userId: userId})
                            }
                            break
                        }
                    }
                }

                const savedPost = await foundHostProfile.save()

                if(savedPost){
                    donePost = true;    
                }
            }
        }
            
        if(donePost){

            return res.status(201).json({ message: 'Success' })                               
        
        } else {

            return res.status(400).json({ message:'Operation Failed' });
        }

    } catch (err) {

        return res.status(401).json({ message: 'Failed' })
    }
}



module.exports = { getHostAppointments, getDriverAppointments, addAppointment, removeAppointment }