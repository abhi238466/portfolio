const multer = require("multer");

/*
|--------------------------------------------------------------------------
| Storage Configuration
|--------------------------------------------------------------------------
*/

const storage = multer.memoryStorage();

/*
|--------------------------------------------------------------------------
| Allowed File Types
|--------------------------------------------------------------------------
*/

const allowedMimeTypes = [
  "application/pdf",

  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
];

/*
|--------------------------------------------------------------------------
| File Filter
|--------------------------------------------------------------------------
*/

const fileFilter = (req, file, cb) => {
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        "Invalid file type. Only PDF, JPG, JPEG, PNG and WEBP files are allowed."
      ),
      false
    );
  }
};

/*
|--------------------------------------------------------------------------
| Certification Document Upload
|--------------------------------------------------------------------------
*/

const certificationDocumentUpload = multer({
  storage,

  limits: {
    fileSize: 10 * 1024 * 1024,
  },

  fileFilter,
});

/*
|--------------------------------------------------------------------------
| Export
|--------------------------------------------------------------------------
*/

module.exports = {
  certificationDocumentUpload,
};