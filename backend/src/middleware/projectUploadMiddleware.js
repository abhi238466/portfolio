const multer = require("multer");

/*
|--------------------------------------------------------------------------
| PROJECT IMAGE CONFIGURATION
|--------------------------------------------------------------------------
*/

const MAX_PROJECT_IMAGE_SIZE =
  10 * 1024 * 1024; // 10 MB

const PROJECT_IMAGE_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
];

/*
|--------------------------------------------------------------------------
| MEMORY STORAGE
|--------------------------------------------------------------------------
|
| Project images server ke filesystem par store nahi hongi.
|
| File browser se:
|
| Browser
|   ↓
| Multer memoryStorage
|   ↓
| Cloudinary
|
*/

const storage =
  multer.memoryStorage();

/*
|--------------------------------------------------------------------------
| PROJECT IMAGE FILE FILTER
|--------------------------------------------------------------------------
*/

const projectImageFileFilter = (
  req,
  file,
  callback
) => {
  if (
    !PROJECT_IMAGE_MIME_TYPES.includes(
      file.mimetype
    )
  ) {
    return callback(
      new Error(
        "Only JPG, JPEG, PNG, and WEBP project images are allowed."
      )
    );
  }

  callback(null, true);
};

/*
|--------------------------------------------------------------------------
| SINGLE PROJECT IMAGE UPLOAD
|--------------------------------------------------------------------------
|
| Expected form-data field:
|
| image
|
*/

const uploadProjectImage =
  multer({
    storage,

    limits: {
      fileSize:
        MAX_PROJECT_IMAGE_SIZE,

      files: 1,
    },

    fileFilter:
      projectImageFileFilter,
  }).single("image");

/*
|--------------------------------------------------------------------------
| MULTIPLE PROJECT IMAGE UPLOAD
|--------------------------------------------------------------------------
|
| Maximum 20 images can be uploaded in one request.
|
| Expected form-data field:
|
| images
|
| NOTE:
| This is provided for the future gallery/bulk-upload flow.
| Single image upload remains available above.
|
*/

const MAX_PROJECT_IMAGES_PER_REQUEST = 20;

const uploadProjectImages =
  multer({
    storage,

    limits: {
      fileSize:
        MAX_PROJECT_IMAGE_SIZE,

      files:
        MAX_PROJECT_IMAGES_PER_REQUEST,
    },

    fileFilter:
      projectImageFileFilter,
  }).array(
    "images",
    MAX_PROJECT_IMAGES_PER_REQUEST
  );

/*
|--------------------------------------------------------------------------
| EXPORTS
|--------------------------------------------------------------------------
*/

module.exports = {
  uploadProjectImage,
  uploadProjectImages,

  MAX_PROJECT_IMAGE_SIZE,
  MAX_PROJECT_IMAGES_PER_REQUEST,

  PROJECT_IMAGE_MIME_TYPES,
};