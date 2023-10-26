require("dotenv").config();
const fs = require("fs");
const ffmpeg = require("fluent-ffmpeg");
const { Readable } = require('stream');
var path = require("path");
const ffmpegPath = require("@ffmpeg-installer/ffmpeg").path;
ffmpeg.setFfmpegPath(ffmpegPath);

const {Leopard} = require("@picovoice/leopard-node");
const leopardmodel = new Leopard(process.env.VOICE_TO_TEXT_KEY);

// const { Configuration, OpenAIApi } = require("openai");
// const configuration = new Configuration({
//   apiKey: process.env.OPEN_AI_WHISPER_KEY,
// });
// const openai = new OpenAIApi(configuration);

// // Transcribe audio
// async function transcribeAudio(filename) {
//   const transcript = await openai.createTranscription(
//     fs.createReadStream(filename),
//     "whisper-1"
//   );
//   return transcript.data.text;
// }

const convertToAudio = async (req, res) => {

    var { input, output } = req.query

    ffmpeg(input)
        .output(output)
        .on('end', function() {                    
            console.log('conversion ended');
            return res.status(200).json({"message": "success"})
        }).on('error', function(err){
            console.log('error: ', e.code, e.msg);
            return res.status(401).json({"message": err})
        }).run();
}


const checkfile = async (req, res) => {

    console.log("Starting transcript check")
    console.log(req.file)

    if(req.file?.mimetype.split("/")[0] !== 'video'){
        return res.status(401).json({"message": "Not a video"})
    }

    const webmReadable = new Readable();
    webmReadable.push(req.file.buffer);
    webmReadable.push(null);

    const newpath = `./public/media/${req.file.originalname}`;
    const outputWebmStream = fs.createWriteStream(newpath);
    webmReadable.pipe(outputWebmStream);
    
    // fs.writeFileSync(newpath, req.file.buffer);

    let absolutePath = path.resolve(newpath)

    try{

        const checkTime = 1000;
        const timerId = setInterval(() => {

            const isExists = fs.existsSync(absolutePath)

            if(isExists) {

                clearInterval(timerId)

                var output = "./output.mp3";

                ffmpeg(absolutePath)
                    .output(output)
                    .on('end', async function() {                    
                        console.log('conversion ended');
                        var finalPath = path.resolve(output)

                        response = leopardmodel.processFile(finalPath);

                        if(response){

                            fs.unlinkSync(absolutePath);
                            fs.unlinkSync(finalPath);
                            // leopard.delete()
                            
                            return res.status(200).json({"text": response.transcript});
                        
                        } else {
                            fs.unlinkSync(newpath);
                            return res.status(401).json({"Message": "Failed operation"})
                        }
                        
                    }).on('error', function(err){
                        console.log('error: ', err);
                        return res.status(401).json({"message": err})
                    }).run();
                
            }
        }, checkTime)
    
    } catch(err){
        console.log(err)
        return res.status(401).json({"message":"Failed operation"})
    }
    
}


module.exports = { checkfile };