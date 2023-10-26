const { logEvents } = require('./logEvents');
const multer = require("multer");

const errorHandler = (err, req, res, next) => {
    logEvents(`${err.name}: ${err.message}`, 'errLog.txt');
    console.error(err.stack)

    if (err instanceof multer.MulterError) {
        if (err.code === "LIMIT_FILE_SIZE") {
          return res.status(400).json({
            message: "file is too large",
          });
        }
    
        if (err.code === "LIMIT_FILE_COUNT") {
          return res.status(400).json({
            message: "File limit reached",
          });
        }
    
        if (err.code === "LIMIT_UNEXPECTED_FILE") {
          return res.status(400).json({
            message: "File must be an image",
          });
        }
      }

    return res.status(500).send(err.message);
}

module.exports = { errorHandler };