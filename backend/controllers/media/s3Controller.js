require("dotenv").config();
const fs = require("fs");
const Crypto = require("crypto");

const AWS = require('aws-sdk');
const S3 = require("aws-sdk/clients/s3");
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
});

// UPLOAD FILE TO S3
async function uploadFilePic(file) {

  const fileStream = fs.createReadStream(file.path);
  const randomName = Crypto.randomUUID()
  const objectKey = `${randomName}-${file.originalname}`

  const uploadParams = {
    Bucket: wasabiPrivateBucketUSA,
    Body: fileStream,
    Key: objectKey,
    ContentType: 'image/jpeg',
  };

  return s3.upload(uploadParams).promise()
}

async function copyFile(filekey, newkey){

  var copyParams = {
    Bucket: wasabiPrivateBucketUSA, 
    CopySource: encodeURI(`/${wasabiPrivateBucketUSA}/${filekey}`), 
    Key: newkey
   };

   return s3.copyObject(copyParams).promise();

}

async function uploadFileVideo(file) {

  const fileStream = fs.createReadStream(file.path);
  const randomName = Crypto.randomUUID()
  const objectKey = `${randomName}-${file.originalname}`

  const uploadParams = {
    Bucket: wasabiPrivateBucketUSA,
    Body: fileStream,
    Key: objectKey,
    ContentType: 'video/mp4',
  };

  return s3.upload(uploadParams).promise()
}

async function uploadFileScraperPic(filepath) {

  const fileStream = fs.createReadStream(filepath);
  const randomName = Crypto.randomUUID();
  const objectKey = `${randomName}`;

  const uploadParams = {
    Bucket: wasabiPrivateBucketUSA,
    Body: fileStream,
    Key: objectKey,
    ContentType: 'image/jpeg'
  };

  return s3.upload(uploadParams).promise()
}

async function uploadFileScraperVideo(filepath) {

  const fileStream = fs.createReadStream(filepath);
  const randomName = Crypto.randomUUID();
  const objectKey = `${randomName}`;

  const uploadParams = {
    Bucket: wasabiPrivateBucketUSA,
    Body: fileStream,
    Key: objectKey,
    ContentType: 'video/mp4'
  };

  return s3.upload(uploadParams).promise()
}

async function uploadProfilePic(file) {

  const fileStream = fs.createReadStream(file.path);
  const randomName = Crypto.randomUUID();
  const objectKey = `${randomName}-${file.originalname}`;
    
    const uploadParams = {
      Bucket: wasabiPublicBucketUSA,
      Body: fileStream,
      Key: objectKey,
      ContentType: 'image/jpeg'
    };
  
    return s3.upload(uploadParams).promise()

}

// DOWNLOAD FILE FROM S3
function getFileURL(fileKey) {

  var signParams = {
    Bucket: wasabiPrivateBucketUSA, 
    Key: fileKey, 
    Expires: 7200
  };

  var url = s3.getSignedUrl('getObject', signParams);

  return (url)
}

function deleteFile(fileKey){
    const deleteParams = {
        Key: fileKey,
        Bucket: wasabiPrivateBucketUSA
    };

    return s3.deleteObject(deleteParams).promise();
}

module.exports = { uploadFilePic, uploadFileScraperPic, uploadProfilePic, 
  uploadFileVideo, uploadFileScraperVideo, 
  getFileURL, deleteFile, copyFile };



