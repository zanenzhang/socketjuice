const express = require('express');
const router = express.Router();
const multer = require('multer');
const jpeg = require('jpeg-js');
const User = require('../model/User');
const ObjectId  = require('mongodb').ObjectId;

const tf = require('@tensorflow/tfjs-node')
const nsfw = require('nsfwjs')

const verifyJWT = require('../middleware/verifyJWT')
router.use(verifyJWT)


const upload = multer()

let _model

const convert = async (img) => {
  // Decoded image in UInt8 Byte array
  const image = jpeg.decode(img, true)

  const numChannels = 3
  const numPixels = image.width * image.height
  const values = new Int32Array(numPixels * numChannels)

  for (let i = 0; i < numPixels; i++)
    for (let c = 0; c < numChannels; ++c)
      values[i * numChannels + c] = image.data[i * 4 + c]

  return tf.tensor3d(values, [image.height, image.width, numChannels], 'int32')
}

router.post('/check', upload.single('image'), async (req, res) => {



  if (!req.file) res.status(400).send('Missing image multipart/form-data')
  else {

    var name = (req.file.originalname).substring(0, (req.file.originalname).lastIndexOf('.'));

    const foundUser = await User.findOne({_id: name})

    if(foundUser){

      if(foundUser.email.includes("@purchies.com")){

        var passResult = [
          { className: 'Neutral', probability: 0.0 },
          { className: 'Porn', probability: 0.0 },
          { className: 'Sexy', probability: 0.0 },
          { className: 'Drawing', probability: 0.0 },
          { className: 'Hentai', probability: 0.00 }
        ]

        return res.status(200).json(passResult)

      } else {

        const image = await convert(req.file.buffer)
        if(image){
          console.log("Starting prediction!")
          const predictions = await _model.classify(image)
          if(predictions){
            console.log(predictions)
            image.dispose()
            return res.status(200).json(predictions)
          }
        }
      }
    }
    
  }
})

const load_model = async () => {
  _model = await nsfw.load()
}

load_model();

module.exports = router;