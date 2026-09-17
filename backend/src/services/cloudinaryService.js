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
| Upload Profile Photo
|--------------------------------------------------------------------------
|
| Receives a Multer file buffer and uploads it
| directly to Cloudinary.
|
| No permanent file is stored on the
| local/server filesystem.
|
*/

const uploadProfilePhoto = async (
  file
) => {
  if (!file || !file.buffer) {
    throw new Error(
      "Profile photo file is required."
    );
  }

  return new Promise(
    (resolve, reject) => {
      const uploadStream =
        cloudinary.uploader.upload_stream(
          {
            folder:
              PROFILE_PHOTO_FOLDER,

            resource_type: "image",

            use_filename: true,

            unique_filename: true,

            overwrite: false,
          },

          (error, result) => {
            if (error) {
              return reject(error);
            }

            if (!result) {
              return reject(
                new Error(
                  "Cloudinary upload returned no result."
                )
              );
            }

            return resolve({
              url: result.secure_url,

              publicId:
                result.public_id,

              resourceType:
                result.resource_type,

              format:
                result.format,

              width:
                result.width,

              height:
                result.height,

              bytes:
                result.bytes,

              originalName:
                file.originalname,

              mimeType:
                file.mimetype,

              size:
                file.size,
            });
          }
        );

      uploadStream.end(
        file.buffer
      );
    }
  );
};

/*
|--------------------------------------------------------------------------
| Upload Resume
|--------------------------------------------------------------------------
|
| Resume is uploaded as a RAW authenticated asset.
|
*/

const uploadResume = async (
  file
) => {
  if (!file || !file.buffer) {
    throw new Error(
      "Resume file is required."
    );
  }

  if (
    file.mimetype !==
    "application/pdf"
  ) {
    throw new Error(
      "Resume must be a PDF file."
    );
  }

  return new Promise(
    (resolve, reject) => {
      const uploadStream =
        cloudinary.uploader.upload_stream(
          {
            folder:
              RESUME_FOLDER,

            resource_type:
              "raw",

            type:
              "authenticated",

            use_filename: true,

            unique_filename: true,

            overwrite: false,
          },

          (error, result) => {
            if (error) {
              return reject(error);
            }

            if (!result) {
              return reject(
                new Error(
                  "Cloudinary resume upload returned no result."
                )
              );
            }

            const signedUrl =
              cloudinary.url(
                result.public_id,
                {
                  secure: true,

                  resource_type:
                    "raw",

                  type:
                    "authenticated",

                  sign_url:
                    true,
                }
              );

            return resolve({
              url:
                signedUrl,

              publicId:
                result.public_id,

              resourceType:
                result.resource_type,

              format:
                result.format,

              originalName:
                file.originalname,

              mimeType:
                file.mimetype,

              size:
                file.size,

              bytes:
                result.bytes,
            });
          }
        );

      uploadStream.end(
        file.buffer
      );
    }
  );
};

/*
|--------------------------------------------------------------------------
| Upload Project Image
|--------------------------------------------------------------------------
|
| Project images are uploaded as normal Cloudinary
| image assets.
|
| IMPORTANT:
| - Original aspect ratio is preserved.
| - No crop transformation is applied.
| - No forced width/height is applied.
| - Original width and height are returned.
| - Original file metadata is returned.
|
| This means:
|
| Portrait  → remains portrait
| Landscape → remains landscape
| Square    → remains square
|
*/

const uploadProjectImage = async (
  file
) => {
  if (!file || !file.buffer) {
    throw new Error(
      "Project image file is required."
    );
  }

  const allowedMimeTypes = [
    "image/jpeg",
    "image/png",
    "image/webp",
  ];

  if (
    !allowedMimeTypes.includes(
      file.mimetype
    )
  ) {
    throw new Error(
      "Project image must be JPG, JPEG, PNG, or WEBP."
    );
  }

  return new Promise(
    (resolve, reject) => {
      const uploadStream =
        cloudinary.uploader.upload_stream(
          {
            folder:
              PROJECTS_FOLDER,

            resource_type: "image",

            /*
             * Keep the uploaded image itself
             * untouched.
             */
            use_filename: true,

            unique_filename: true,

            overwrite: false,
          },

          (error, result) => {
            if (error) {
              return reject(error);
            }

            if (!result) {
              return reject(
                new Error(
                  "Cloudinary project image upload returned no result."
                )
              );
            }

            /*
             * IMPORTANT:
             *
             * No transformation is applied here.
             *
             * secure_url is the original Cloudinary
             * asset URL.
             */

            return resolve({
              url:
                result.secure_url,

              publicId:
                result.public_id,

              resourceType:
                result.resource_type,

              format:
                result.format,

              width:
                result.width,

              height:
                result.height,

              bytes:
                result.bytes,

              originalName:
                file.originalname,

              mimeType:
                file.mimetype,

              size:
                file.size,
            });
          }
        );

      uploadStream.end(
        file.buffer
      );
    }
  );
};

/*
|--------------------------------------------------------------------------
| Upload Experience Document
|--------------------------------------------------------------------------
|
| Experience certificates/documents are stored as RAW authenticated
| Cloudinary assets so sensitive document URLs are not publicly exposed.
|
*/

const uploadExperienceDocument = async (
  file
) => {
  if (!file || !file.buffer) {
    throw new Error(
      "Experience document file is required."
    );
  }

  const allowedMimeTypes = [
    "application/pdf",
    "image/jpeg",
    "image/png",
    "image/webp",
  ];

  if (
    !allowedMimeTypes.includes(
      file.mimetype
    )
  ) {
    throw new Error(
      "Experience document must be a PDF, JPG, JPEG, PNG, or WEBP file."
    );
  }

  return new Promise(
    (resolve, reject) => {
      const uploadStream =
        cloudinary.uploader.upload_stream(
          {
            folder:
              EXPERIENCE_FOLDER,

            resource_type:
              file.mimetype ===
              "application/pdf"
                ? "raw"
                : "image",

            type:
              "authenticated",

            use_filename: true,

            unique_filename: true,

            overwrite: false,
          },

          (error, result) => {
            if (error) {
              return reject(error);
            }

            if (!result) {
              return reject(
                new Error(
                  "Cloudinary experience document upload returned no result."
                )
              );
            }

            return resolve({
              url:
                cloudinary.url(
                  result.public_id,
                  {
                    secure: true,

                    resource_type:
                      result.resource_type,

                    type:
                      "authenticated",

                    sign_url:
                      true,
                  }
                ),

              publicId:
                result.public_id,

              resourceType:
                result.resource_type,

              deliveryType:
                "authenticated",

              format:
                result.format,

              width:
                result.width || null,

              height:
                result.height || null,

              bytes:
                result.bytes,

              originalName:
                file.originalname,

              mimeType:
                file.mimetype,

              size:
                file.size,
            });
          }
        );

      uploadStream.end(
        file.buffer
      );
    }
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
| - Post Graduation / MCA marksheet / degree
| - Certificates
| - Transcripts
| - Other academic documents
|
| Each education record keeps its own document metadata
| inside the Education MongoDB document.
|
| Files are stored in the dedicated:
|
| portfolio/education/
|
| Cloudinary folder.
|
| IMPORTANT:
| - PDF files are stored as RAW authenticated assets.
| - Image files are stored as IMAGE authenticated assets.
| - No permanent public storage URL is exposed as the
|   public education API response.
| - A signed URL is returned for protected admin preview.
| - Original image dimensions are preserved.
|
*/

const uploadEducationDocument = async (
  file
) => {
  if (!file || !file.buffer) {
    throw new Error(
      "Education document file is required."
    );
  }

  const allowedMimeTypes = [
    "application/pdf",
    "image/jpeg",
    "image/png",
    "image/webp",
  ];

  if (
    !allowedMimeTypes.includes(
      file.mimetype
    )
  ) {
    throw new Error(
      "Education document must be a PDF, JPG, JPEG, PNG, or WEBP file."
    );
  }

  const isPdf =
    file.mimetype ===
    "application/pdf";

  return new Promise(
    (resolve, reject) => {
      const uploadStream =
        cloudinary.uploader.upload_stream(
          {
            folder:
              EDUCATION_FOLDER,

            /*
             * IMPORTANT:
             *
             * Cloudinary supports PDF delivery as an IMAGE asset.
             * Keeping Education PDFs as image/authenticated assets
             * allows the browser PDF viewer / iframe to render them
             * instead of treating the raw file as a download.
             *
             * Other modules are intentionally untouched.
             */
            resource_type:
              "image",

            type:
              "authenticated",

            /*
             * Preserve the original file.
             *
             * No crop.
             * No resize.
             * No forced aspect ratio.
             */
            use_filename: true,

            unique_filename: true,

            overwrite: false,
          },

          (error, result) => {
            if (error) {
              return reject(error);
            }

            if (!result) {
              return reject(
                new Error(
                  "Cloudinary education document upload returned no result."
                )
              );
            }

            /*
             * Generate a signed authenticated URL.
             *
             * This URL can later be used by the protected
             * admin preview endpoint without exposing the
             * permanent Cloudinary publicId through the
             * public portfolio API.
             */

            const signedUrl =
              cloudinary.url(
                result.public_id,
                {
                  secure: true,

                  resource_type:
                    result.resource_type,

                  type:
                    "authenticated",

                  /*
                   * IMPORTANT:
                   *
                   * Education PDFs are uploaded as
                   * authenticated IMAGE assets.
                   *
                   * The PDF format must be included in
                   * the signed delivery URL so the browser
                   * receives a real .pdf URL.
                   *
                   * Images keep their original format.
                   */
                  format:
                    isPdf
                      ? "pdf"
                      : result.format,

                  sign_url:
                    true,
                }
              );

            return resolve({
              url:
                signedUrl,

              publicId:
                result.public_id,

              resourceType:
                result.resource_type,

              deliveryType:
                "authenticated",

              format:
                result.format,

              width:
                result.width ||
                null,

              height:
                result.height ||
                null,

              bytes:
                result.bytes,

              originalName:
                file.originalname,

              mimeType:
                file.mimetype,

              size:
                file.size,
            });
          }
        );

      uploadStream.end(
        file.buffer
      );
    }
  );
};

/*
|--------------------------------------------------------------------------
| Generate Signed Cloudinary URL
|--------------------------------------------------------------------------
|
| Used by the backend when a protected/public
| endpoint needs to deliver a stored Cloudinary
| asset without exposing the permanent asset
| reference in the profile API response.
|
*/

const generateSignedUrl = (
  publicId,
  resourceType = "image",
  type = "upload"
) => {
  if (!publicId) {
    throw new Error(
      "Cloudinary public ID is required."
    );
  }

  return cloudinary.url(
    publicId,
    {
      secure: true,

      resource_type:
        resourceType,

      type,

      sign_url: true,
    }
  );
};

/*
|--------------------------------------------------------------------------
| Generate Signed Experience Document URL
|--------------------------------------------------------------------------
*/

const generateSignedExperienceDocumentUrl = (
  publicId,
  resourceType = "raw"
) => {
  return generateSignedUrl(
    publicId,
    resourceType,
    "authenticated"
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

  const options = {
    secure: true,

    resource_type:
      resourceType,

    type:
      "authenticated",

    sign_url:
      true,
  };

  /*
   * IMPORTANT:
   *
   * Education PDFs are stored as authenticated IMAGE
   * assets so the browser can render them as PDFs.
   *
   * Cloudinary needs the PDF format in the signed
   * delivery URL when the publicId itself has no
   * extension.
   *
   * Other document modules are intentionally untouched.
   */
  if (
    resourceType === "image" &&
    format === "pdf"
  ) {
    options.format =
      "pdf";
  }

  return cloudinary.url(
    publicId,
    options
  );
};

/*
|--------------------------------------------------------------------------
| Generate Signed Resume URL
|--------------------------------------------------------------------------
*/

const generateSignedResumeUrl = (
  publicId
) => {
  return generateSignedUrl(
    publicId,
    "raw",
    "authenticated"
  );
};

/*
|--------------------------------------------------------------------------
| Delete Cloudinary Asset
|--------------------------------------------------------------------------
|
| Used when:
| - Profile photo is replaced
| - Profile photo is deleted
| - Resume is replaced
| - Resume is deleted
| - Project image is replaced/deleted
| - Experience document is replaced/deleted
| - Education document is replaced/deleted
|
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

const deleteProfilePhoto =
  async (
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

const deleteResume =
  async (
    publicId
  ) => {
    return deleteCloudinaryAsset(
      publicId,
      "raw",
      "authenticated"
    );
  };

/*
|--------------------------------------------------------------------------
| Delete Experience Document
|--------------------------------------------------------------------------
|
| Experience documents are authenticated Cloudinary assets.
|
*/

const deleteExperienceDocument =
  async (
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
|
| Education documents are authenticated Cloudinary assets.
|
*/

const deleteEducationDocument =
  async (
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
|
| Project images are normal Cloudinary image assets.
|
*/

const deleteProjectImage =
  async (
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
| Exports
|--------------------------------------------------------------------------
*/

/*
 *|--------------------------------------------------------------------------
 *| Upload Certification Document
 *|--------------------------------------------------------------------------
 */

const uploadCertificationDocument = async (file) => {
  if (!file || !file.buffer) {
    throw new Error("Certification document file is required.");
  }

  const allowedMimeTypes = [
    "application/pdf",
    "image/jpeg",
    "image/png",
    "image/webp",
  ];

  if (!allowedMimeTypes.includes(file.mimetype)) {
    throw new Error(
      "Certification document must be a PDF, JPG, JPEG, PNG, or WEBP file."
    );
  }

  const isPdf = file.mimetype === "application/pdf";

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: CERTIFICATION_FOLDER,
        resource_type: isPdf ? "raw" : "image",
        type: "authenticated",
        use_filename: true,
        unique_filename: true,
        overwrite: false,
      },
      (error, result) => {
        if (error) return reject(error);
        if (!result) {
          return reject(
            new Error(
              "Cloudinary certification document upload returned no result."
            )
          );
        }

        return resolve({
          url: cloudinary.url(result.public_id, {
            secure: true,
            resource_type: result.resource_type,
            type: "authenticated",
            sign_url: true,
          }),
          publicId: result.public_id,
          resourceType: result.resource_type,
          deliveryType: "authenticated",
          format: result.format,
          width: result.width || null,
          height: result.height || null,
          bytes: result.bytes,
          originalName: file.originalname,
          mimeType: file.mimetype,
          size: file.size,
        });
      }
    );

    uploadStream.end(file.buffer);
  });
};

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

  const options = {
    secure: true,
    resource_type: resourceType,
    type: "authenticated",
    sign_url: true,
  };

  if (resourceType === "raw" && format === "pdf") {
    options.format = "pdf";
  }

  return cloudinary.url(publicId, options);
};

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