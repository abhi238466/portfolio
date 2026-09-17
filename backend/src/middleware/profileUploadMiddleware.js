const multer = require("multer");

/*
|--------------------------------------------------------------------------
| Upload Limits
|--------------------------------------------------------------------------
*/

const MAX_PROFILE_PHOTO_SIZE =
  10 * 1024 * 1024; // 10 MB

const MAX_RESUME_SIZE =
  10 * 1024 * 1024; // 10 MB

/*
|--------------------------------------------------------------------------
| Allowed MIME Types
|--------------------------------------------------------------------------
*/

const PROFILE_PHOTO_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
];

const RESUME_MIME_TYPES = [
  "application/pdf",
];

/*
|--------------------------------------------------------------------------
| Memory Storage
|--------------------------------------------------------------------------
|
| Files remain in memory as buffers.
| They are NOT permanently stored on the
| Render/server filesystem.
|
*/

const storage =
  multer.memoryStorage();

/*
|--------------------------------------------------------------------------
| Profile Photo File Filter
|--------------------------------------------------------------------------
*/

const profilePhotoFileFilter = (
  req,
  file,
  callback
) => {
  if (
    !PROFILE_PHOTO_MIME_TYPES.includes(
      file.mimetype
    )
  ) {
    return callback(
      new Error(
        "Only JPG, JPEG, PNG, and WEBP profile photos are allowed."
      )
    );
  }

  callback(null, true);
};

/*
|--------------------------------------------------------------------------
| Resume File Filter
|--------------------------------------------------------------------------
*/

const resumeFileFilter = (
  req,
  file,
  callback
) => {
  if (
    !RESUME_MIME_TYPES.includes(
      file.mimetype
    )
  ) {
    return callback(
      new Error(
        "Only PDF resume files are allowed."
      )
    );
  }

  callback(null, true);
};

/*
|--------------------------------------------------------------------------
| Profile Photo Upload
|--------------------------------------------------------------------------
*/

const uploadProfilePhoto =
  multer({
    storage,

    limits: {
      fileSize:
        MAX_PROFILE_PHOTO_SIZE,

      files: 1,
    },

    fileFilter:
      profilePhotoFileFilter,
  }).single(
    "profilePhoto"
  );

/*
|--------------------------------------------------------------------------
| Resume Upload
|--------------------------------------------------------------------------
*/

const uploadResume =
  multer({
    storage,

    limits: {
      fileSize:
        MAX_RESUME_SIZE,

      files: 1,
    },

    fileFilter:
      resumeFileFilter,
  }).single(
    "resume"
  );

/*
|--------------------------------------------------------------------------
| Exports
|--------------------------------------------------------------------------
*/

module.exports = {
  uploadProfilePhoto,

  uploadResume,

  MAX_PROFILE_PHOTO_SIZE,

  MAX_RESUME_SIZE,

  PROFILE_PHOTO_MIME_TYPES,

  RESUME_MIME_TYPES,
};