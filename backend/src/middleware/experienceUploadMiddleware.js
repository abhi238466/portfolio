const multer = require("multer");

/*
|--------------------------------------------------------------------------
| EXPERIENCE DOCUMENT CONFIGURATION
|--------------------------------------------------------------------------
|
| Experience documents/certificates can be:
|
| - JPG
| - JPEG
| - PNG
| - WEBP
| - PDF
|
| Documents are uploaded directly to Cloudinary.
| They are NOT stored on the local/server filesystem.
|
*/

const MAX_EXPERIENCE_DOCUMENT_SIZE =
  10 * 1024 * 1024; // 10 MB

const EXPERIENCE_DOCUMENT_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
];

/*
|--------------------------------------------------------------------------
| MEMORY STORAGE
|--------------------------------------------------------------------------
|
| Browser
|   ↓
| Multer memoryStorage
|   ↓
| Cloudinary
|
| No temporary file is created on the
| Render/server filesystem.
|
*/

const storage =
  multer.memoryStorage();

/*
|--------------------------------------------------------------------------
| EXPERIENCE DOCUMENT FILE FILTER
|--------------------------------------------------------------------------
*/

const experienceDocumentFileFilter = (
  req,
  file,
  callback
) => {
  if (
    !EXPERIENCE_DOCUMENT_MIME_TYPES.includes(
      file.mimetype
    )
  ) {
    return callback(
      new Error(
        "Only JPG, JPEG, PNG, WEBP, and PDF experience documents are allowed."
      )
    );
  }

  callback(null, true);
};

/*
|--------------------------------------------------------------------------
| SINGLE EXPERIENCE DOCUMENT UPLOAD
|--------------------------------------------------------------------------
|
| Expected form-data field:
|
| document
|
| One document is uploaded per request.
|
*/

const uploadExperienceDocument =
  multer({
    storage,

    limits: {
      fileSize:
        MAX_EXPERIENCE_DOCUMENT_SIZE,

      files: 1,
    },

    fileFilter:
      experienceDocumentFileFilter,
  }).single("document");

/*
|--------------------------------------------------------------------------
| MULTIPLE EXPERIENCE DOCUMENT UPLOAD
|--------------------------------------------------------------------------
|
| Maximum 10 documents can be uploaded
| in one request.
|
| Expected form-data field:
|
| documents
|
| Single document upload remains available
| above for normal add/replace flows.
|
*/

const MAX_EXPERIENCE_DOCUMENTS_PER_REQUEST =
  10;

const uploadExperienceDocuments =
  multer({
    storage,

    limits: {
      fileSize:
        MAX_EXPERIENCE_DOCUMENT_SIZE,

      files:
        MAX_EXPERIENCE_DOCUMENTS_PER_REQUEST,
    },

    fileFilter:
      experienceDocumentFileFilter,
  }).array(
    "documents",
    MAX_EXPERIENCE_DOCUMENTS_PER_REQUEST
  );

/*
|--------------------------------------------------------------------------
| EXPORTS
|--------------------------------------------------------------------------
*/

module.exports = {
  uploadExperienceDocument,

  uploadExperienceDocuments,

  MAX_EXPERIENCE_DOCUMENT_SIZE,

  MAX_EXPERIENCE_DOCUMENTS_PER_REQUEST,

  EXPERIENCE_DOCUMENT_MIME_TYPES,
};