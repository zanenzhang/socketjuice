const multer = require("multer");
var fs = require("fs");

var dir = "./public/media/";
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true });
}

const fileStorageEngine = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const fileFilter = (req, file, cb) => {

    if (file.mimetype.split("/")[0] === "image" || file.mimetype.split("/")[0] === 'video') {
      cb(null, true);
    } else {
      req.fileValidationError = 'goes wrong on the mimetype';
      cb(new multer.MulterError("LIMIT_UNEXPECTED_FILE"), false);
    }
  };
  

const upload = multer({ storage: fileStorageEngine, fileFilter, limits:{fileSize: 40048000, files: 10} });

module.exports = upload;