const User = require('../../model/User')
const S3 = require("aws-sdk/clients/s3");
const fs = require("fs");

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


const deleteUserData = async (req, res) => {
    
    const { userId } = req.query

    if (!userId ) {
        return res.status(400).json({ message: 'User ID required for data deletion request' })
    }

    const foundUser = await User.findOne({_id: userId})

    if(foundUser){

        if(foundUser.deactivated === false){

            foundUser.deactivated = true;

            const savedUpdate = await foundUser.save()

            if(savedUpdate){
                return res.status(200).json({'message': 'Marked user data for deletion.'})
            }

        } else {
            return res.status(400).json({'message': 'User data already deleted!'})
        }
    }
}


module.exports = { deleteUserData }