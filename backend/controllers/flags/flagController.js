const User = require('../../model/User');
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

            if(foundUserFlags.userFlags?.some(e=>e._userId.toString() === ((profileUserId)))){

                foundUserFlags.userFlags.pull({_userId: profileUserId})
            
                const savedFlags = await foundUserFlags.save()

                const foundUser = await User.findOne({_id: profileUserId})

                if(foundUser){

                    if(foundUser.flaggedBy?.some(e=>e._userId.toString() === ((loggedUserId)))){
                            
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

module.exports = { getAllFlags, addUserFlag, removeUserFlag, clearUserFlags }