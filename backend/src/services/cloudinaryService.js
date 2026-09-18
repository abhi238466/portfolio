const cloudinary = require("../config/cloudinary");

/*
|--------------------------------------------------------------------------
| Cloudinary Folders
|--------------------------------------------------------------------------
*/

const PROFILE_PHOTO_FOLDER =
  "portfolio/profile";

const RESUME_FOLDER =
  "portfolio/resume";

const PROJECTS_FOLDER =
  "portfolio/projects";

const EXPERIENCE_FOLDER =
  "portfolio/experience";

const EDUCATION_FOLDER =
  "portfolio/education";

const CERTIFICATION_FOLDER =
  "portfolio/certifications";

/*
|--------------------------------------------------------------------------
| Constants
|--------------------------------------------------------------------------
*/

const PDF_MIME_TYPE =
  "application/pdf";

const ALLOWED_DOCUMENT_MIME_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
];

const ALLOWED_IMAGE_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
];

/*
|--------------------------------------------------------------------------
| Validation Helpers
|--------------------------------------------------------------------------
*/

const validateFile = (
  file,
  errorMessage
) => {
  if (!file || !file.buffer) {
    throw new Error(errorMessage);
  }
};

const validateMimeType = (
  file,
  allowedMimeTypes,
  errorMessage
) => {
  if (!allowedMimeTypes.includes(file.mimetype)) {
    throw new Error(errorMessage);
  }
};

const isPdfFile = (file) => {
  return file.mimetype === PDF_MIME_TYPE;
};

/*
|--------------------------------------------------------------------------
| Signed Cloudinary URL Helper
|--------------------------------------------------------------------------
|
| Generates a signed authenticated URL.
|
| The resource type must match the resource type
| used during the original Cloudinary upload.
|
*/

const createSignedUrl = (
  publicId,
  resourceType = "image",
  type = "upload",
  format = null
) => {
  if (!publicId) {
    throw new Error(
      "Cloudinary public ID is required."
    );
  }

  const options = {
    secure: true,
    resource_type: resourceType,
    type,
    sign_url: true,
  };

  /*
   * Only include format when explicitly provided.
   *
   * Do not force PDF format on image files.
   */
  if (format) {
    options.format = format;
  }

  return cloudinary.url(
    publicId,
    options
  );
};

/*
|--------------------------------------------------------------------------
| Upload Stream Helper
|--------------------------------------------------------------------------
|
| Uploads a file buffer directly to Cloudinary.
|
*/

const uploadBuffer = (
  file,
  options,
  errorMessage
) => {
  return new Promise(
    (resolve, reject) => {
      const uploadStream =
        cloudinary.uploader.upload_stream(
          options,
          (error, result) => {
            if (error) {
              return reject(error);
            }

            if (!result) {
              return reject(
                new Error(errorMessage)
              );
            }

            return resolve(result);
          }
        );

      uploadStream.end(file.buffer);
    }
  );
};

/*
|--------------------------------------------------------------------------
| Common File Response
|--------------------------------------------------------------------------
*/

const buildFileResponse = (
  file,
  result,
  url
) => {
  return {
    url,

    publicId:
      result.public_id,

    resourceType:
      result.resource_type,

    deliveryType:
      result.type || null,

    format:
      result.format || null,

    width:
      result.width || null,

    height:
      result.height || null,

    bytes:
      result.bytes || null,

    originalName:
      file.originalname,

    mimeType:
      file.mimetype,

    size:
      file.size,
  };
};

/*
|--------------------------------------------------------------------------
| Upload Profile Photo
|--------------------------------------------------------------------------
|
| Profile photos are normal public image assets.
|
*/

const uploadProfilePhoto = async (
  file
) => {
  validateFile(
    file,
    "Profile photo file is required."
  );

  validateMimeType(
    file,
    ALLOWED_IMAGE_MIME_TYPES,
    "Profile photo must be JPG, JPEG, PNG, or WEBP."
  );

  const result = await uploadBuffer(
    file,
    {
      folder:
        PROFILE_PHOTO_FOLDER,

      resource_type:
        "image",

      type:
        "upload",

      use_filename:
        true,

      unique_filename:
        true,

      overwrite:
        false,
    },
    "Cloudinary profile photo upload returned no result."
  );

  return buildFileResponse(
    file,
    result,
    result.secure_url
  );
};

/*
|--------------------------------------------------------------------------
| Upload Resume
|--------------------------------------------------------------------------
|
| Resume is stored as a RAW authenticated asset.
|
*/

const uploadResume = async (
  file
) => {
  validateFile(
    file,
    "Resume file is required."
  );

  if (file.mimetype !== PDF_MIME_TYPE) {
    throw new Error(
      "Resume must be a PDF file."
    );
  }

  const result = await uploadBuffer(
    file,
    {
      folder:
        RESUME_FOLDER,

      resource_type:
        "raw",

      type:
        "authenticated",

      use_filename:
        true,

      unique_filename:
        true,

      overwrite:
        false,
    },
    "Cloudinary resume upload returned no result."
  );

  const signedUrl =
    createSignedUrl(
      result.public_id,
      result.resource_type,
      "authenticated"
    );

  return buildFileResponse(
    file,
    result,
    signedUrl
  );
};

/*
|--------------------------------------------------------------------------
| Upload Project Image
|--------------------------------------------------------------------------
|
| Project images are public image assets.
|
| Original aspect ratio is preserved.
| No crop or forced dimensions are applied.
|
*/

const uploadProjectImage = async (
  file
) => {
  validateFile(
    file,
    "Project image file is required."
  );

  validateMimeType(
    file,
    ALLOWED_IMAGE_MIME_TYPES,
    "Project image must be JPG, JPEG, PNG, or WEBP."
  );

  const result = await uploadBuffer(
    file,
    {
      folder:
        PROJECTS_FOLDER,

      resource_type:
        "image",

      type:
        "upload",

      use_filename:
        true,

      unique_filename:
        true,

      overwrite:
        false,
    },
    "Cloudinary project image upload returned no result."
  );

  return buildFileResponse(
    file,
    result,
    result.secure_url
  );
};

/*
|--------------------------------------------------------------------------
| Upload Experience Document
|--------------------------------------------------------------------------
|
| PDF files:
|   raw + authenticated
|
| Image files:
|   image + authenticated
|
*/

const uploadExperienceDocument = async (
  file
) => {
  validateFile(
    file,
    "Experience document file is required."
  );

  validateMimeType(
    file,
    ALLOWED_DOCUMENT_MIME_TYPES,
    "Experience document must be a PDF, JPG, JPEG, PNG, or WEBP file."
  );

  const resourceType =
    isPdfFile(file)
      ? "raw"
      : "image";

  const result = await uploadBuffer(
    file,
    {
      folder:
        EXPERIENCE_FOLDER,

      resource_type:
        resourceType,

      type:
        "authenticated",

      use_filename:
        true,

      unique_filename:
        true,

      overwrite:
        false,
    },
    "Cloudinary experience document upload returned no result."
  );

  const signedUrl =
    createSignedUrl(
      result.public_id,
      result.resource_type,
      "authenticated"
    );

  return buildFileResponse(
    file,
    result,
    signedUrl
  );
};

/*
|--------------------------------------------------------------------------
| Upload Education Document
|--------------------------------------------------------------------------
|
| Education documents include:
|
| - Class 10 marksheet
| - Class 12 marksheet
| - Graduation marksheet / degree
| - MCA marksheet / degree
| - Certificates
| - Transcripts
| - Other academic documents
|
| PDF:
|   raw + authenticated
|
| Image:
|   image + authenticated
|
*/

const uploadEducationDocument = async (
  file
) => {
  validateFile(
    file,
    "Education document file is required."
  );

  validateMimeType(
    file,
    ALLOWED_DOCUMENT_MIME_TYPES,
    "Education document must be a PDF, JPG, JPEG, PNG, or WEBP file."
  );

  const resourceType =
    isPdfFile(file)
      ? "raw"
      : "image";

  const result = await uploadBuffer(
    file,
    {
      folder:
        EDUCATION_FOLDER,

      resource_type:
        resourceType,

      type:
        "authenticated",

      use_filename:
        true,

      unique_filename:
        true,

      overwrite:
        false,
    },
    "Cloudinary education document upload returned no result."
  );

  const signedUrl =
    createSignedUrl(
      result.public_id,
      result.resource_type,
      "authenticated"
    );

  return buildFileResponse(
    file,
    result,
    signedUrl
  );
};

/*
|--------------------------------------------------------------------------
| Upload Certification Document
|--------------------------------------------------------------------------
|
| PDF:
|   raw + authenticated
|
| Image:
|   image + authenticated
|
*/

const uploadCertificationDocument = async (
  file
) => {
  validateFile(
    file,
    "Certification document file is required."
  );

  validateMimeType(
    file,
    ALLOWED_DOCUMENT_MIME_TYPES,
    "Certification document must be a PDF, JPG, JPEG, PNG, or WEBP file."
  );

  const resourceType =
    isPdfFile(file)
      ? "raw"
      : "image";

  const result = await uploadBuffer(
    file,
    {
      folder:
        CERTIFICATION_FOLDER,

      resource_type:
        resourceType,

      type:
        "authenticated",

      use_filename:
        true,

      unique_filename:
        true,

      overwrite:
        false,
    },
    "Cloudinary certification document upload returned no result."
  );

  const signedUrl =
    createSignedUrl(
      result.public_id,
      result.resource_type,
      "authenticated"
    );

  return buildFileResponse(
    file,
    result,
    signedUrl
  );
};

/*
|--------------------------------------------------------------------------
| Generate Signed Cloudinary URL
|--------------------------------------------------------------------------
*/

const generateSignedUrl = (
  publicId,
  resourceType = "image",
  type = "upload",
  format = null
) => {
  return createSignedUrl(
    publicId,
    resourceType,
    type,
    format
  );
};

/*
|--------------------------------------------------------------------------
| Generate Signed Resume URL
|--------------------------------------------------------------------------
*/

const generateSignedResumeUrl = (
  publicId,
  resourceType = "raw",
  format = null
) => {
  if (!publicId) {
    throw new Error(
      "Cloudinary resume public ID is required."
    );
  }

  return createSignedUrl(
    publicId,
    resourceType,
    "authenticated",
    format
  );
};

/*
|--------------------------------------------------------------------------
| Generate Signed Experience Document URL
|--------------------------------------------------------------------------
*/

const generateSignedExperienceDocumentUrl = (
  publicId,
  resourceType = "raw",
  format = null
) => {
  if (!publicId) {
    throw new Error(
      "Cloudinary experience document public ID is required."
    );
  }

  return createSignedUrl(
    publicId,
    resourceType,
    "authenticated",
    format
  );
};

/*
|--------------------------------------------------------------------------
| Generate Signed Education Document URL
|--------------------------------------------------------------------------
*/

const generateSignedEducationDocumentUrl = (
  publicId,
  resourceType = "raw",
  format = null
) => {
  if (!publicId) {
    throw new Error(
      "Cloudinary education document public ID is required."
    );
  }

  return createSignedUrl(
    publicId,
    resourceType,
    "authenticated",
    format
  );
};

/*
|--------------------------------------------------------------------------
| Generate Signed Certification Document URL
|--------------------------------------------------------------------------
*/

const generateSignedCertificationDocumentUrl = (
  publicId,
  resourceType = "raw",
  format = null
) => {
  if (!publicId) {
    throw new Error(
      "Cloudinary certification document public ID is required."
    );
  }

  return createSignedUrl(
    publicId,
    resourceType,
    "authenticated",
    format
  );
};

/*
|--------------------------------------------------------------------------
| Delete Cloudinary Asset
|--------------------------------------------------------------------------
*/

const deleteCloudinaryAsset = async (
  publicId,
  resourceType = "image",
  type = "upload"
) => {
  if (!publicId) {
    return null;
  }

  const result =
    await cloudinary.uploader.destroy(
      publicId,
      {
        resource_type:
          resourceType,

        type,
      }
    );

  return result;
};

/*
|--------------------------------------------------------------------------
| Delete Profile Photo
|--------------------------------------------------------------------------
*/

const deleteProfilePhoto = async (
  publicId
) => {
  return deleteCloudinaryAsset(
    publicId,
    "image",
    "upload"
  );
};

/*
|--------------------------------------------------------------------------
| Delete Resume
|--------------------------------------------------------------------------
*/

const deleteResume = async (
  publicId,
  resourceType = "raw"
) => {
  return deleteCloudinaryAsset(
    publicId,
    resourceType,
    "authenticated"
  );
};

/*
|--------------------------------------------------------------------------
| Delete Project Image
|--------------------------------------------------------------------------
*/

const deleteProjectImage = async (
  publicId
) => {
  return deleteCloudinaryAsset(
    publicId,
    "image",
    "upload"
  );
};

/*
|--------------------------------------------------------------------------
| Delete Experience Document
|--------------------------------------------------------------------------
*/

const deleteExperienceDocument = async (
  publicId,
  resourceType = "raw"
) => {
  return deleteCloudinaryAsset(
    publicId,
    resourceType,
    "authenticated"
  );
};

/*
|--------------------------------------------------------------------------
| Delete Education Document
|--------------------------------------------------------------------------
*/

const deleteEducationDocument = async (
  publicId,
  resourceType = "raw"
) => {
  return deleteCloudinaryAsset(
    publicId,
    resourceType,
    "authenticated"
  );
};

/*
|--------------------------------------------------------------------------
| Delete Certification Document
|--------------------------------------------------------------------------
*/

const deleteCertificationDocument = async (
  publicId,
  resourceType = "raw"
) => {
  return deleteCloudinaryAsset(
    publicId,
    resourceType,
    "authenticated"
  );
};

/*
|--------------------------------------------------------------------------
| Module Exports
|--------------------------------------------------------------------------
*/

module.exports = {
  PROFILE_PHOTO_FOLDER,

  RESUME_FOLDER,

  PROJECTS_FOLDER,

  EXPERIENCE_FOLDER,

  EDUCATION_FOLDER,

  CERTIFICATION_FOLDER,

  uploadProfilePhoto,

  uploadResume,

  uploadProjectImage,

  uploadExperienceDocument,

  uploadEducationDocument,

  uploadCertificationDocument,

  generateSignedUrl,

  generateSignedResumeUrl,

  generateSignedExperienceDocumentUrl,

  generateSignedEducationDocumentUrl,

  generateSignedCertificationDocumentUrl,

  deleteCloudinaryAsset,

  deleteProfilePhoto,

  deleteResume,

  deleteProjectImage,

  deleteExperienceDocument,

  deleteEducationDocument,

  deleteCertificationDocument,
};