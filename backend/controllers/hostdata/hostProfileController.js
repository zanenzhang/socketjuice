const User = require('../../model/User')
const HostProfile = require('../../model/HostProfile');
const Bookmark = require('../../model/Bookmark');
const Flags = require('../../model/Flags')
const Appointment = require('../../model/Appointment')

const languageList = require('../languageCheck');
const ObjectId  = require('mongodb').ObjectId;
const jwt = require('jsonwebtoken');
const S3 = require("aws-sdk/clients/s3");
const fns = require('date-fns')
const { deleteFile } = require("../media/s3Controller");

// var Holidays = require('date-holidays')

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

// var hd = new Holidays()
  
const getHostProfile = async (req, res) => {
    
    const { loggedUserId } = req.query

    if (!loggedUserId ) {
        return res.status(400).json({ message: 'Missing required info' })
    }

    try {

        const foundHostProfile = await HostProfile.findOne({_userId: loggedUserId})

        if(foundHostProfile ){
            
                return res.status(200).json({foundHostProfile })
        
        } else {

            return res.status(401).json({ message: 'Cannot get host information' })
        }
        
    } catch(err){

        return res.status(401).json({ message: 'Cannot get user information' })
    }
}


const getHostProfilesCoord = async (req, res) => {
    
    var { coordinatesInput, loggedUserId, dayofweek, localtime } = req.query

    if (!coordinatesInput || !loggedUserId || !dayofweek ) {
        return res.status(400).json({ message: 'Missing required info' })
    }

    coordinatesInput = JSON.parse(coordinatesInput)

    try {
        
        var searchobj = {
            "$or": [],
            _userId: {"$ne": loggedUserId},
            deactivated: false,
            verifiedHostCharging: true,
            location:
            { "$near":
                {
                    "$geometry": { type: "Point",  coordinates: coordinatesInput },
                    "$maxDistance": 20000
                }
            }
        }

        var allDayString = ""

        if(dayofweek === "Monday"){

            searchobj["closedOnMonday"] = false
            
            allDayString = "allDayMonday";
            var array = [{"allDayMonday": true},{"hoursMondayStart": {"$lte": localtime}}];
            searchobj["$or"] = array

        } else if (dayofweek === "Tuesday"){

            searchobj["closedOnTuesday"] = false
            
            allDayString = "allDayTuesday";
            var array = [{"allDayTuesday": true},{"hoursTuesdayStart": {"$lte": localtime}}];
            searchobj["$or"] = array

        } else if (dayofweek === "Wednesday"){

            searchobj["closedOnWednesday"] = false
            
            allDayString = "allDayWednesday";
            var array = [{"allDayWednesday": true},{"hoursWednesdayStart": {"$lte": localtime}}];
            searchobj["$or"] = array

        } else if (dayofweek === "Thursday"){

            searchobj["closedOnThursday"] = false
            
            allDayString = "allDayThursday";
            var array = [{"allDayThursday": true},{"hoursThursdayStart": {"$lte": localtime}}];
            searchobj["$or"] = array

        } else if (dayofweek === "Friday"){

            searchobj["closedOnFriday"] = false
            
            allDayString = "allDayFriday";
            var array = [{"allDayFriday": true},{"hoursFridayStart": {"$lte": localtime}}];
            searchobj["$or"] = array

        } else if (dayofweek === "Saturday"){

            searchobj["closedOnSaturday"] = false
            
            allDayString = "allDaySaturday";
            var array = [{"allDaySaturday": true},{"hoursSaturdayStart": {"$lte": localtime}}];
            searchobj["$or"] = array
            
        } else if (dayofweek === "Sunday"){

            searchobj["closedOnSunday"] = false
            
            allDayString = "allDaySunday";
            var array = [{"allDaySunday": true},{"hoursSundayStart": {"$lte": localtime}}];
            searchobj["$or"] = array
        }

        const preFoundHostProfiles = await HostProfile.find(searchobj).limit(10)

        const bookmarksFound = await Bookmark.findOne({_userId: loggedUserId})
        const flaggedList = await Flags.findOne({_userId: loggedUserId})

        let doneProfileData = false;

        if(preFoundHostProfiles?.length > 0){

            var foundHostProfiles = []
            var startstr = ""
            var endstr = ""

            if(dayofweek === "Monday"){

                startstr = "hoursMondayStart"
                endstr = "hoursMondayFinish"
    
            } else if (dayofweek === "Tuesday"){
    
                startstr = "hoursTuesdayStart"
                endstr = "hoursTuesdayFinish"
    
            } else if (dayofweek === "Wednesday"){
    
                startstr = "hoursWednesdayStart"
                endstr = "hoursWednesdayFinish"
    
            } else if (dayofweek === "Thursday"){
    
                startstr = "hoursThursdayStart"
                endstr = "hoursThursdayFinish"
    
            } else if (dayofweek === "Friday"){
    
                startstr = "hoursFridayStart"
                endstr = "hoursFridayFinish"
    
            } else if (dayofweek === "Saturday"){
    
                startstr = "hoursSaturdayStart"
                endstr = "hoursSaturdayFinish"
                
            } else if (dayofweek === "Sunday"){
    
                startstr = "hoursSundayStart"
                endstr = "hoursSundayFinish"
            }

            var current = new Date()

            const checkAppointments = await Appointment.find(
            {$and:[
                {_hostUserId: {$in: preFoundHostProfiles.map(e => e._userId)}}, 
                {$or: [ 
                    { start : { $lte: current }, end : { $gt: current } },
                    { start : { $lt: current }, end : { $gte: current } },
                    { start : { $gte: current }, end : { $lte: current } }]}, 
                {$or: [{status: "Approved" }, {status: "Requested" }]}
            ]})


            var appointmentCheck = {}
            var doneAppointmentChecks = null;

            if(checkAppointments){

                for(let i=0; i<checkAppointments?.length; i++){
                    if(appointmentCheck[checkAppointments[i]._hostUserId] === undefined){
                        appointmentCheck[checkAppointments[i]._hostUserId] = checkAppointments[i]._hostUserId
                    }
                }

                doneAppointmentChecks = true

            } else {

                doneAppointmentChecks = true
            }

            if(doneAppointmentChecks){

                for(let i=0; i<preFoundHostProfiles?.length; i++){
    
                    if(preFoundHostProfiles[i][allDayString]){
                    
                        foundHostProfiles.push(preFoundHostProfiles[i])
                    
                    } else if(preFoundHostProfiles[i][endstr] < preFoundHostProfiles[i][startstr]){
                        
                        if(localtime > preFoundHostProfiles[i][endstr] && localtime < preFoundHostProfiles[i][startstr]){
                            continue
                        } else {
                            foundHostProfiles.push(preFoundHostProfiles[i])
                        }
                        
                    } else if (preFoundHostProfiles[i][endstr] > preFoundHostProfiles[i][startstr]){
                    
                        if(localtime > preFoundHostProfiles[i][endstr]){
                            continue
                        } else {
                            foundHostProfiles.push(preFoundHostProfiles[i])
                        }
                    }
                }
    
                foundHostProfiles?.forEach(function(item, index){

                    if(appointmentCheck[item._userId] !== undefined){
                        item.availableNow = false;
                    } else {
                        item.availableNow = true;
                    }
    
                    if(item.mediaCarouselURLs?.length === 0 && item.mediaCarouselObjectIds?.length > 0){
        
                        var finalMediaURLs = []
        
                        for(let i=0; i<item.mediaCarouselObjectIds?.length; i++){
                        
                            var signParams = {
                                Bucket: wasabiPrivateBucketUSA, 
                                Key: item.mediaCarouselObjectIds[i],
                                Expires: 7200
                              };
                
                            var url = s3.getSignedUrl('getObject', signParams);
                
                            finalMediaURLs.push(url)
                        }
        
                        var finalVideoURLs = []
        
                        for(let i=0; i<item.videoCarouselObjectIds?.length; i++){
        
                            if(item.videoCarouselObjectIds[i] !== 'image'){
        
                                var signParams = {
                                    Bucket: wasabiPrivateBucketUSA, 
                                    Key: item.videoCarouselObjectIds[i],
                                    Expires: 7200
                                };
                    
                                var url = s3.getSignedUrl('getObject', signParams);
                    
                                finalVideoURLs.push(url)
        
                            } else {
        
                                finalVideoURLs.push("image")
                            }
                        }
        
                        item.mediaCarouselURLs = finalMediaURLs
                        item.videoCarouselURLs = finalVideoURLs
                        item.previewMediaURL = finalMediaURLs[item.coverIndex]
                        item.markModified('mediaCarouselURLs')
                        item.markModified('videoCarouselURLs')
                        item.markModified('previewMediaURL')
        
                    } else if(item.mediaCarouselObjectIds?.length > 0) {
        
                        for(let i=0; i<item.mediaCarouselURLs?.length; i++){
                            
                            var signedUrl = item.mediaCarouselURLs[i];
        
                            const params = new URLSearchParams(signedUrl)
                            const expiry = Number(params.get("Expires")) * 1000
                            // const creationDate = fns.parseISO(params['X-Amz-Date']);
                            // const expiresInSecs = Number(params['X-Amz-Expires']);
                            
                            // const expiryDate = fns.addSeconds(creationDate, expiresInSecs);
                            // const expiry = Number(params['Expires']);
                            const expiryTime = new Date(expiry)
                            const isExpired = expiryTime < new Date();
                
                            if (isExpired){
                
                                var signParams = {
                                    Bucket: wasabiPrivateBucketUSA, 
                                    Key: item.mediaCarouselObjectIds[i],
                                    Expires: 7200
                                  };
                    
                                var url = s3.getSignedUrl('getObject', signParams);
                    
                                item.mediaCarouselURLs[i] = url
                            }
        
                            if(item.coverIndex === i){
                                item.previewMediaURL = item.mediaCarouselURLs[i]
                            }
                        }
        
                        for(let i=0; i<item.videoCarouselURLs?.length; i++){
        
                            if(item.videoCarouselURLs[i] !== 'image'){
        
                                var signedUrl = item.videoCarouselURLs[i];
        
                                const params = new URLSearchParams(signedUrl)
                                const expiry = Number(params.get("Expires")) * 1000
                                // const creationDate = fns.parseISO(params['X-Amz-Date']);
                                // const expiresInSecs = Number(params['X-Amz-Expires']);
                                
                                // const expiryDate = fns.addSeconds(creationDate, expiresInSecs);
                                // const expiry = Number(params['Expires']);
                                const expiryTime = new Date(expiry)
                                const isExpired = expiryTime < new Date();
                    
                                if (isExpired){
                    
                                    var signParams = {
                                        Bucket: wasabiPrivateBucketUSA, 
                                        Key: item.videoCarouselObjectIds[i],
                                        Expires: 7200
                                    };
                        
                                    var url = s3.getSignedUrl('getObject', signParams);
                        
                                    item.videoCarouselURLs[i] = url
                                }
        
                            }
                        }
        
                        item.markModified('mediaCarouselURLs')
                        item.markModified('videoCarouselURLs')
                        item.markModified('previewMediaURL')
                    
                    }  
        
                    item.update()
                })
    
                doneProfileData = true;   
            }

        }  else {

            doneProfileData = true;
        }

        if(doneProfileData && flaggedList && bookmarksFound ){
            
                return res.status(200).json({foundHostProfiles, bookmarksFound, flaggedList })
        
        } else {

            return res.status(401).json({ message: 'Cannot get store information' })
        }
        
    } catch(err){

        return res.status(401).json({ message: 'Cannot get user information' })
    }
}


const editSettingsHostProfile = async (req, res) => {
    
    const cookies = req.cookies;

    if (!cookies?.socketjuicejwt) return res.sendStatus(401);
    const refreshToken = cookies.socketjuicejwt;

    User.findOne({ refreshToken }, async function(err, foundUser){

        if (err || !foundUser) return res.sendStatus(403); 
    
        jwt.verify(
            refreshToken,
            process.env.REFRESH_TOKEN_SECRET,
            (err, decoded) => {

                if (err  || !foundUser._id.toString() === ((decoded.userId)) ) return res.sendStatus(403);
            }
        )

        var { loggedUserId, hoursMondayStart, hoursMondayFinish, hoursTuesdayStart, hoursTuesdayFinish, hoursWednesdayStart, hoursWednesdayFinish, hoursThursdayStart, hoursThursdayFinish,
            hoursFridayStart, hoursFridayFinish, hoursSaturdayStart, hoursSaturdayFinish, hoursSundayStart, hoursSundayFinish,
            holidayHoursStart, holidayHoursFinish, 
            closedOnMonday, closedOnTuesday, closedOnWednesday, closedOnThursday, closedOnFriday, closedOnSaturday, closedOnSunday, closedOnHolidays,
            allDayMonday, allDayTuesday, allDayWednesday, allDayThursday, allDayFriday, allDaySaturday, allDaySunday, allDayHolidays,
            chargeRate, chargeRateFee, hostComments, offeringCharging } = req.body
        
        if ( !loggedUserId ) {    
            return res.status(400).json({ message: 'Missing required fields!' })
        }

        if ( hoursMondayStart?.length > 100 ){
            return res.status(400).json({ 'message': 'Content does not meet requirements' });
        }
    
        chargeRate = Number(chargeRate)
        var textToCheck = hostComments.toLowerCase();

        for(let i=0; i < languageList.length; i++){
            if(textToCheck.indexOf(languageList[i]) !== -1){
                return res.status(403).json({"message":"Inappropriate content"})  
            }
        }

        const foundHostProfile = await HostProfile.findOne({"_userId": loggedUserId })
        
        if(foundHostProfile){
            
            hoursMondayStart ? foundHostProfile.hoursMondayStart = hoursMondayStart : foundHostProfile.hoursMondayStart = "";
            hoursTuesdayStart ? foundHostProfile.hoursTuesdayStart = hoursTuesdayStart : foundHostProfile.hoursTuesdayStart = "";
            hoursWednesdayStart ? foundHostProfile.hoursWednesdayStart = hoursWednesdayStart : foundHostProfile.hoursWednesdayStart = "";
            hoursThursdayStart ? foundHostProfile.hoursThursdayStart = hoursThursdayStart : foundHostProfile.hoursThursdayStart = "";
            hoursFridayStart ? foundHostProfile.hoursFridayStart = hoursFridayStart : foundHostProfile.hoursFridayStart = "";
            hoursSaturdayStart ? foundHostProfile.hoursSaturdayStart = hoursSaturdayStart : foundHostProfile.hoursSaturdayStart = "";
            hoursSundayStart ? foundHostProfile.hoursSundayStart = hoursSundayStart : foundHostProfile.hoursSundayStart = "";
            
            holidayHoursStart ? foundHostProfile.holidayHoursStart = holidayHoursStart : foundHostProfile.holidayHoursStart = "";
            holidayHoursFinish ? foundHostProfile.holidayHoursFinish = holidayHoursFinish : foundHostProfile.holidayHoursFinish = "";
            
            chargeRate ? foundHostProfile.chargeRatePerHalfHour = chargeRate : foundHostProfile.chargeRatePerHalfHour = "";
            chargeRateFee ? foundHostProfile.chargeRatePerHalfHourFee = chargeRateFee : foundHostProfile.chargeRatePerHalfHourFee = "";
            
            closedOnMonday ?  foundHostProfile.closedOnMonday = closedOnMonday : foundHostProfile.closedOnMonday = false;
            closedOnTuesday ?  foundHostProfile.closedOnTuesday = closedOnTuesday : foundHostProfile.closedOnTuesday = false;
            closedOnWednesday ?  foundHostProfile.closedOnWednesday = closedOnWednesday : foundHostProfile.closedOnWednesday = false;
            closedOnThursday ?  foundHostProfile.closedOnThursday = closedOnThursday : foundHostProfile.closedOnThursday = false;
            closedOnFriday ?  foundHostProfile.closedOnFriday = closedOnFriday : foundHostProfile.closedOnFriday = false;
            closedOnSaturday ?  foundHostProfile.closedOnSaturday = closedOnSaturday : foundHostProfile.closedOnSaturday = false;
            closedOnSunday ?  foundHostProfile.closedOnSunday = closedOnSunday : foundHostProfile.closedOnSunday = false;
            closedOnHolidays ?  foundHostProfile.closedOnHolidays = closedOnHolidays : foundHostProfile.closedOnHolidays = false;

            allDayMonday ?  foundHostProfile.allDayMonday = allDayMonday : foundHostProfile.allDayMonday = false;
            allDayTuesday ?  foundHostProfile.allDayTuesday = allDayTuesday : foundHostProfile.allDayTuesday = false;
            allDayWednesday ?  foundHostProfile.allDayWednesday = allDayWednesday : foundHostProfile.allDayWednesday = false;
            allDayThursday ?  foundHostProfile.allDayThursday = allDayThursday : foundHostProfile.allDayThursday = false;
            allDayFriday ?  foundHostProfile.allDayFriday = allDayFriday : foundHostProfile.allDayFriday = false;
            allDaySaturday ?  foundHostProfile.allDaySaturday = allDaySaturday : foundHostProfile.allDaySaturday = false;
            allDaySunday ?  foundHostProfile.allDaySunday = allDaySunday : foundHostProfile.allDaySunday = false;
            allDayHolidays ?  foundHostProfile.allDayHolidays = allDayHolidays : foundHostProfile.allDayHolidays = false;

            hoursMondayFinish ? foundHostProfile.hoursMondayFinish = hoursMondayFinish : foundHostProfile.hoursMondayFinish = "";
            hoursTuesdayFinish ? foundHostProfile.hoursTuesdayFinish = hoursTuesdayFinish : foundHostProfile.hoursTuesdayFinish = "";
            hoursWednesdayFinish ? foundHostProfile.hoursWednesdayFinish = hoursWednesdayFinish : foundHostProfile.hoursWednesdayFinish = "";
            hoursThursdayFinish ? foundHostProfile.hoursThursdayFinish = hoursThursdayFinish : foundHostProfile.hoursThursdayFinish = "";
            hoursFridayFinish ? foundHostProfile.hoursFridayFinish = hoursFridayFinish : foundHostProfile.hoursFridayFinish = "";
            hoursSaturdayFinish ? foundHostProfile.hoursSaturdayFinish = hoursSaturdayFinish : foundHostProfile.hoursSaturdayFinish = "";
            hoursSundayFinish ? foundHostProfile.hoursSundayFinish = hoursSundayFinish : foundHostProfile.hoursSundayFinish = "";
            
            hostComments ? foundHostProfile.hostComments = hostComments : foundHostProfile.hostComments = "";
            offeringCharging ? foundHostProfile.deactivated = false : foundHostProfile.deactivated = true;
            
            const savedFoundProfile = await foundHostProfile.save()

            if (savedFoundProfile) {
                res.status(200).json({ message: "Success!" })
            }
        
        } else {
            res.status(401).json({ message: "Operation failed" })
        }
    })
}



const editSettingsHostGeneral = async (req, res) => {

    const cookies = req.cookies;

    if (!cookies?.socketjuicejwt) return res.sendStatus(401);
    const refreshToken = cookies.socketjuicejwt;

    const foundUser = await User.findOne({ refreshToken: refreshToken, _id: loggedUserId }).exec();
    if (!foundUser) return res.sendStatus(403); //Forbidden 
    // evaluate jwt 
    jwt.verify(
        refreshToken,
        process.env.REFRESH_TOKEN_SECRET,
        (err, decoded) => {
            if (err  ) return res.sendStatus(403);
        }
    )

    const { loggedUserId, lessMotion, privacySetting, pushNotifications, userTheme } = req.body

    // Confirm data 
    if ( !loggedUserId || typeof lessMotion !== 'boolean' || !privacySetting || typeof pushNotifications !== 'boolean' || !userTheme ) {

        return res.status(400).json({ message: 'Missing required fields!' })
    }

    // Does the user exist to update?
    HostProfile.findOne({"_userId": loggedUserId }, async function(err, foundHostProfile){
        
        if(err){
            return res.status(400).json({ message: 'User not found' })
        }

        privacySetting ? foundUser.privacySetting = privacySetting : foundUser.privacySetting = "";

        lessMotion ? foundHostProfile.lessMotion = lessMotion : foundHostProfile.lessMotion = "";
        pushNotifications ? foundHostProfile.pushNotifications = pushNotifications : foundHostProfile.pushNotifications = "";
        userTheme ? foundHostProfile.userTheme = userTheme : foundHostProfile.userTheme = "";

        const savedFoundProfile = await foundHostProfile.save()
       
        const savedFoundUser = await foundUser.save()

        if (savedFoundProfile && savedFoundUser) {
            res.json({ message: "Success!" })
        }

    })
}

module.exports = { getHostProfile, getHostProfilesCoord, editSettingsHostProfile }
