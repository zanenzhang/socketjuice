require("dotenv").config();
var express = require("express");
var router = express.Router();
const User = require('../model/User');
const jwt = require('jsonwebtoken');
const ObjectId  = require('mongodb').ObjectId;
const fs = require("fs");
const upload = require("../common");
const { uploadFilePic, uploadFileVideo, getFileURL, deleteFile, uploadProfilePic, copyFile } = require("../controllers/media/s3Controller");

const verifyJWT = require('../middleware/verifyJWT')

router.use(verifyJWT)


/* GET home page. */
router.get("/", function (req, res, next) {
  res.render("S3Route", { title: "Express" });
});

router.get("/images/:key", (req, res) => {
  const key = req.params.key;
  const fileURL = getFileURL(key);
  
  return res.status(200).json(fileURL)
});

router.get("/profilepic/:key", (req, res) => {

    const key = req.params.key
    const readStream = getProfilePic(key)

    readStream.pipe(res)
});


// upload.single("image"), 
router.post("/singleimage", upload.single("image"), async (req, res) => {
    console.log("SINGLE PRINT")

    console.log(req.file)

  // uploading to AWS S3
    try {

        const uploaded = await uploadFilePic(req.file, res, function(err){

            if(req.fileValidationError){
                return res.end(req.fileValidationError)
            }

            if(err){
                console.log(err)
                return res.status(400).json({ message: 'Failed' })
            }

        });
    
        if(uploaded){

            console.log("Successfully uploaded!")

            fs.unlinkSync(req.file.path);

            console.log("S3 response", uploaded);
            
            return res.status(200).json( uploaded );
        
        }

    } catch (err) {
        console.error(err);
    }  
});

// upload.single("image"), 
router.post("/singlevideo", upload.single("video"), async (req, res) => {
    console.log("SINGLE VIDEO")

    console.log(req.file);
    console.log("Type: ", typeof(req.file));

    // const newpath = `./temp/${req.file.originalname}`;

    //Compress video file here
    // ffmpeg(req.file.path)
    // .fps(25)
    // .addOptions(["-crf 28"])
    // .on("end", () => { 
    //     endProcess({ statusCode: 200, text: "Success" });
    // })
    // .on("error", (err) => {
    //     endProcess({ statusCode: 500, text: err.message });
    // }).save(`./temp/${req.file.originalname}`);

    // let absolutePath = path.resolve(newpath)
    // const isExists = fs.existsSync(absolutePath)
    // fs.unlinkSync(absolutePath);

  // uploading to AWS S3
    try {

        const uploaded = await uploadFileVideo(req.file, res, function(err){

            if(req.fileValidationError){
                return res.end(req.fileValidationError)
            }

            if(err){
                console.log(err)
                return res.status(400).json({ message: 'Failed' })
            }

        });
    
        if(uploaded){

            console.log("Successfully uploaded!")

            fs.unlinkSync(req.file.path);

            console.log("S3 response", uploaded);
            
            return res.status(200).json( uploaded );
        
        }

    } catch (err) {
        console.error(err);
    }  
});

// upload.single-profilepic("image"), 
router.post("/single-profilepic", upload.single("image"), async (req, res) => {

    console.log(req.file)

  // uploading to AWS S3
    try {
        const uploaded = await uploadProfilePic(req.file, res, async function(err){

            if(req.fileValidationError){
                return res.end(req.fileValidationError)
            }

            if(err){
                console.log(err)
                return res.status(400).json({ message: 'Failed' })
            }

        });

        if(uploaded){

            fs.unlinkSync(req.file.path);

            console.log("S3 response", uploaded);
            
            return res.status(200).json( uploaded );
            
        }

    } catch (err) {
        console.error(err);
    }
  
});


router.post("/multiple", upload.array("images"), (req, res) => {
  console.log(req.files);
  res.send({
    status: "success",
    message: "Files uploaded successfully",
    data: req.files,
  });
});

router.delete("/deletemany", async (req, res) => {

    const cookies = req.cookies;

    if (!cookies?.socketjuicejwt) return res.sendStatus(401);
    const refreshToken = cookies.socketjuicejwt;
    
    User.findOne({ refreshToken }, async function(err, foundUser){

        if (err || !foundUser) return res.sendStatus(403); 
    
        jwt.verify(
            refreshToken,
            process.env.REFRESH_TOKEN_SECRET,
            (err, decoded) => {
                if (err || foundUser.username !== decoded.username || !foundUser._id.toString() === ((decoded.userId)) ) return res.sendStatus(403);
            }
        )

        const {ObjectIdArray, userId} = req.body;

        if(!userId || !foundUser._id.toString() === userId || !ObjectIdArray || ObjectIdArray?.length === 0 || ObjectIdArray?.length > 10){

            return res.sendStatus(403);
        }
        
        var deleteCount = 0
        var deleteEnd = ObjectIdArray?.length 

        async function deleteSingleFile(){

            if(ObjectIdArray[deleteCount] !== 'image'){

                const result = await deleteFile(ObjectIdArray[deleteCount])

                if(result){

                    deleteCount += 1

                    if(deleteCount < deleteEnd){
                        deleteSingleFile()

                    }else {
                        return res.status(200).json({"Mesage:": "Successfully deleted all ObjectIds"})
                    };

                } else {
                    return res.status(400).json({ message: 'Failed' })
                }
            }
        }

        deleteSingleFile()
    })
  });


  router.delete("/delete", async (req, res) => {

    const cookies = req.cookies;

    if (!cookies?.socketjuicejwt) return res.sendStatus(401);
    const refreshToken = cookies.socketjuicejwt;
    
    User.findOne({ refreshToken }, async function(err, foundUser){

        if (err || !foundUser) return res.sendStatus(403); 
    
        jwt.verify(
            refreshToken,
            process.env.REFRESH_TOKEN_SECRET,
            (err, decoded) => {
                if (err || foundUser.username !== decoded.username || !foundUser._id.toString() === ((decoded.userId)) ) return res.sendStatus(403);
            }
        )

        const {ObjectId, userId} = req.query;

        if(!userId || !ObjectId || !foundUser._id.toString() === userId){
                            
            return res.sendStatus(403);
        }

        const result = await deleteFile(ObjectId, function(err){
            if(err){
                console.log(err)
                return res.status(400).json({ message: 'Failed' })
            };
        });
    
        if(result){
            console.log("S3 response", result);
            return res.status(200).json( result )
        };
    })
  });


module.exports = router;