const multer = require("multer");

/*
|--------------------------------------------------------------------------
| Education Document Upload Configuration
|--------------------------------------------------------------------------
|
| Education documents can be:
| - PDF
| - JPG / JPEG
| - PNG
| - WEBP
|
| Files are kept in memory temporarily and are then
| uploaded directly to Cloudinary by the service/controller.
|
| No permanent file is stored on the server filesystem.
|
|--------------------------------------------------------------------------
*/

/*
|--------------------------------------------------------------------------
| File Size Limit
|--------------------------------------------------------------------------
|
| Maximum allowed education document size:
| 10 MB
|
*/

const MAX_EDUCATION_DOCUMENT_SIZE =
  10 * 1024 * 1024;

/*
|--------------------------------------------------------------------------
| Allowed MIME Types
|--------------------------------------------------------------------------
*/

const EDUCATION_DOCUMENT_ALLOWED_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
];

/*
|--------------------------------------------------------------------------
| Multer Storage
|--------------------------------------------------------------------------
|
| memoryStorage is intentional.
|
| The uploaded file stays in memory only until
| the request is processed and uploaded to Cloudinary.
|
*/

const storage =
  multer.memoryStorage();

/*
|--------------------------------------------------------------------------
| File Filter
|--------------------------------------------------------------------------
*/

const fileFilter = (
  req,
  file,
  callback
) => {
  if (
    !EDUCATION_DOCUMENT_ALLOWED_TYPES.includes(
      file.mimetype
    )
  ) {
    return callback(
      new Error(
        "Education document must be a PDF, JPG, JPEG, PNG, or WEBP file."
      ),
      false
    );
  }

  return callback(
    null,
    true
  );
};

/*
|--------------------------------------------------------------------------
| Multer Upload Instance
|--------------------------------------------------------------------------
*/

const educationDocumentUpload =
  multer({
    storage,

    limits: {
      fileSize:
        MAX_EDUCATION_DOCUMENT_SIZE,

      files: 1,
    },

    fileFilter,
  });

/*
|--------------------------------------------------------------------------
| Single Education Document
|--------------------------------------------------------------------------
|
| Expected multipart/form-data field name:
|
| document
|
*/

const uploadEducationDocument =
  educationDocumentUpload.single(
    "document"
  );

/*
|--------------------------------------------------------------------------
| Exports
|--------------------------------------------------------------------------
*/

module.exports = {
  MAX_EDUCATION_DOCUMENT_SIZE,

  EDUCATION_DOCUMENT_ALLOWED_TYPES,

  educationDocumentUpload,

  uploadEducationDocument,
};