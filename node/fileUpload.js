const multer = require('multer');

// Set up storage for uploaded files
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const fullPath = process.cwd() + '/uploads';
    cb(null, fullPath);
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  },
});

// Create the multer instance
const upload = multer({ storage: storage });

module.exports = upload;
