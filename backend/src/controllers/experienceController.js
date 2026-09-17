const {
  getAdminExperiences,
  getPublicExperiences,
  getExperienceById,
  getPublicExperienceById,

  createExperience,
  updateExperience,
  deleteExperience,

  addExperienceDocument,
  deleteExperienceDocument,
  reorderExperienceDocuments,

  updateExperienceVisibility,
  updateExperienceFeatured,
  updateExperienceActiveStatus,
  updateExperienceDisplayOrder,
} = require("../services/experienceService");

const {
  uploadExperienceDocument,
  deleteExperienceDocument:
    deleteCloudinaryExperienceDocument,
  generateSignedExperienceDocumentUrl,
} = require("../services/cloudinaryService");

/*
|--------------------------------------------------------------------------
| HELPER: ASYNC CONTROLLER ERROR HANDLING
|--------------------------------------------------------------------------
*/

const handleControllerError = (
  res,
  error,
  fallbackMessage
) => {
  console.error(
    fallbackMessage,
    error
  );

  return res.status(
    error.statusCode || 500
  ).json({
    success: false,
    message:
      error.message ||
      fallbackMessage,
  });
};

/*
|--------------------------------------------------------------------------
| GET ALL EXPERIENCES - ADMIN
|--------------------------------------------------------------------------
|
| Protected route.
| Returns all experience records including hidden/inactive records.
|
*/

const getAdminExperiencesController =
  async (
    req,
    res
  ) => {
    try {
      const experiences =
        await getAdminExperiences();

      return res.status(200).json({
        success: true,

        message:
          "Experiences fetched successfully. 📋",

        experiences,
      });
    } catch (error) {
      return handleControllerError(
        res,
        error,
        "Unable to fetch experiences."
      );
    }
  };

/*
|--------------------------------------------------------------------------
| GET ALL EXPERIENCES - PUBLIC
|--------------------------------------------------------------------------
|
| Public route.
| Only active + visible experiences are returned.
|
*/

const getPublicExperiencesController =
  async (
    req,
    res
  ) => {
    try {
      const experiences =
        await getPublicExperiences();

      return res.status(200).json({
        success: true,

        message:
          "Experiences fetched successfully. 💼",

        experiences,
      });
    } catch (error) {
      return handleControllerError(
        res,
        error,
        "Unable to fetch public experiences."
      );
    }
  };

/*
|--------------------------------------------------------------------------
| GET EXPERIENCE BY ID - ADMIN
|--------------------------------------------------------------------------
*/

const getExperienceByIdController =
  async (
    req,
    res
  ) => {
    try {
      const experience =
        await getExperienceById(
          req.params.experienceId
        );

      return res.status(200).json({
        success: true,

        message:
          "Experience fetched successfully. 📄",

        experience,
      });
    } catch (error) {
      return handleControllerError(
        res,
        error,
        "Unable to fetch experience."
      );
    }
  };

/*
|--------------------------------------------------------------------------
| GET EXPERIENCE BY ID - PUBLIC
|--------------------------------------------------------------------------
*/

const getPublicExperienceByIdController =
  async (
    req,
    res
  ) => {
    try {
      const experience =
        await getPublicExperienceById(
          req.params.experienceId
        );

      return res.status(200).json({
        success: true,

        message:
          "Experience fetched successfully. 💼",

        experience,
      });
    } catch (error) {
      return handleControllerError(
        res,
        error,
        "Unable to fetch public experience."
      );
    }
  };

/*
|--------------------------------------------------------------------------
| CREATE EXPERIENCE
|--------------------------------------------------------------------------
*/

const createExperienceController =
  async (
    req,
    res
  ) => {
    try {
      const experience =
        await createExperience(
          req.body
        );

      return res.status(201).json({
        success: true,

        message:
          "Experience created successfully. 🎉",

        experience,
      });
    } catch (error) {
      return handleControllerError(
        res,
        error,
        "Unable to create experience."
      );
    }
  };

/*
|--------------------------------------------------------------------------
| UPDATE EXPERIENCE
|--------------------------------------------------------------------------
*/

const updateExperienceController =
  async (
    req,
    res
  ) => {
    try {
      const experience =
        await updateExperience(
          req.params.experienceId,
          req.body
        );

      return res.status(200).json({
        success: true,

        message:
          "Experience updated successfully. ✨",

        experience,
      });
    } catch (error) {
      return handleControllerError(
        res,
        error,
        "Unable to update experience."
      );
    }
  };

/*
|--------------------------------------------------------------------------
| DELETE EXPERIENCE
|--------------------------------------------------------------------------
|
| MongoDB experience record is deleted by the service.
|
| After successful MongoDB deletion, all associated
| Cloudinary documents are also deleted.
|
*/

const deleteExperienceController =
  async (
    req,
    res
  ) => {
    try {
      const deletedExperience =
        await deleteExperience(
          req.params.experienceId
        );

      /*
      |--------------------------------------------------------------------------
      | DELETE ASSOCIATED CLOUDINARY DOCUMENTS
      |--------------------------------------------------------------------------
      */

      if (
        Array.isArray(
          deletedExperience?.documents
        ) &&
        deletedExperience.documents.length >
          0
      ) {
        for (
          const document
          of deletedExperience.documents
        ) {
          if (
            document?.publicId
          ) {
            try {
              await deleteCloudinaryExperienceDocument(
                document.publicId,
                document.resourceType
              );
            } catch (
              cloudinaryError
            ) {
              console.error(
                `Unable to delete experience document ${document.publicId} from Cloudinary.`,
                cloudinaryError
              );
            }
          }
        }
      }

      return res.status(200).json({
        success: true,

        message:
          "Experience deleted successfully. 🗑️",

        experience:
          deletedExperience,
      });
    } catch (error) {
      return handleControllerError(
        res,
        error,
        "Unable to delete experience."
      );
    }
  };

/*
|--------------------------------------------------------------------------
| ADD EXPERIENCE DOCUMENT
|--------------------------------------------------------------------------
|
| Flow:
|
| Browser
|   ↓
| Multer memoryStorage
|   ↓
| Cloudinary authenticated asset
|   ↓
| MongoDB metadata
|
*/

const addExperienceDocumentController =
  async (
    req,
    res
  ) => {
    let uploadedDocument = null;

    try {
      if (
        !req.file ||
        !req.file.buffer
      ) {
        return res.status(400).json({
          success: false,

          message:
            "Please select an experience document. 📄",
        });
      }

      /*
      |--------------------------------------------------------------------------
      | UPLOAD TO CLOUDINARY
      |--------------------------------------------------------------------------
      */

      uploadedDocument =
        await uploadExperienceDocument(
          req.file
        );

      /*
      |--------------------------------------------------------------------------
      | SAVE METADATA TO MONGODB
      |--------------------------------------------------------------------------
      */

      const experience =
        await addExperienceDocument(
          req.params.experienceId,
          uploadedDocument
        );

      return res.status(201).json({
        success: true,

        message:
          "Experience document uploaded successfully. 📄✨",

        experience,
      });
    } catch (error) {
      /*
      |--------------------------------------------------------------------------
      | CLOUDINARY CLEANUP
      |--------------------------------------------------------------------------
      |
      | If MongoDB save fails after Cloudinary upload,
      | remove the newly uploaded Cloudinary asset so
      | orphan files are not left behind.
      |
      */

      if (
        uploadedDocument?.publicId
      ) {
        try {
          await deleteCloudinaryExperienceDocument(
            uploadedDocument.publicId,
            uploadedDocument.resourceType
          );
        } catch (
          cleanupError
        ) {
          console.error(
            "Unable to clean up uploaded experience document after failure.",
            cleanupError
          );
        }
      }

      return handleControllerError(
        res,
        error,
        "Unable to upload experience document."
      );
    }
  };

/*
|--------------------------------------------------------------------------
| DELETE EXPERIENCE DOCUMENT
|--------------------------------------------------------------------------
|
| MongoDB metadata is removed first.
| Then the corresponding Cloudinary asset is deleted.
|
*/

const deleteExperienceDocumentController =
  async (
    req,
    res
  ) => {
    try {
      const result =
        await deleteExperienceDocument(
          req.params.experienceId,
          req.params.documentId
        );

      /*
      |--------------------------------------------------------------------------
      | DELETE FROM CLOUDINARY
      |--------------------------------------------------------------------------
      */

      if (
        result?.deletedDocument?.publicId
      ) {
        try {
          await deleteCloudinaryExperienceDocument(
            result.deletedDocument.publicId,
            result.deletedDocument.resourceType
          );
        } catch (
          cloudinaryError
        ) {
          console.error(
            `Unable to delete experience document ${result.deletedDocument.publicId} from Cloudinary.`,
            cloudinaryError
          );
        }
      }

      return res.status(200).json({
        success: true,

        message:
          "Experience document deleted successfully. 🗑️",

        experience:
          result.experience,

        deletedDocument:
          result.deletedDocument,
      });
    } catch (error) {
      return handleControllerError(
        res,
        error,
        "Unable to delete experience document."
      );
    }
  };

/*
|--------------------------------------------------------------------------
| REORDER EXPERIENCE DOCUMENTS
|--------------------------------------------------------------------------
*/

const reorderExperienceDocumentsController =
  async (
    req,
    res
  ) => {
    try {
      const experience =
        await reorderExperienceDocuments(
          req.params.experienceId,
          req.body.orderedDocumentIds
        );

      return res.status(200).json({
        success: true,

        message:
          "Experience documents reordered successfully. ↕️",

        experience,
      });
    } catch (error) {
      return handleControllerError(
        res,
        error,
        "Unable to reorder experience documents."
      );
    }
  };

/*
|--------------------------------------------------------------------------
| GENERATE SIGNED DOCUMENT URL
|--------------------------------------------------------------------------
|
| This endpoint generates a temporary signed URL.
|
| IMPORTANT:
| The permanent Cloudinary document URL is NOT
| exposed through the public experience API.
|
*/

const getExperienceDocumentUrlController =
  async (
    req,
    res
  ) => {
    try {
      const experience =
        await getExperienceById(
          req.params.experienceId
        );

      const document =
        experience.documents.find(
          (item) =>
            String(item._id) ===
            String(
              req.params.documentId
            )
        );

      if (!document) {
        return res.status(404).json({
          success: false,

          message:
            "Experience document not found. 📄",
        });
      }

      const signedUrl =
        generateSignedExperienceDocumentUrl(
          document.publicId,
          document.resourceType
        );

      return res.status(200).json({
        success: true,

        message:
          "Secure document URL generated successfully. 🔐",

        url: signedUrl,

        document: {
          id:
            document._id,

          originalName:
            document.originalName,

          mimeType:
            document.mimeType,

          size:
            document.size,

          width:
            document.width,

          height:
            document.height,

          documentType:
            document.documentType,
        },
      });
    } catch (error) {
      return handleControllerError(
        res,
        error,
        "Unable to generate secure document URL."
      );
    }
  };

/*
|--------------------------------------------------------------------------
| UPDATE VISIBILITY
|--------------------------------------------------------------------------
*/

const updateExperienceVisibilityController =
  async (
    req,
    res
  ) => {
    try {
      const experience =
        await updateExperienceVisibility(
          req.params.experienceId,
          req.body.isVisible
        );

      return res.status(200).json({
        success: true,

        message:
          experience.isVisible
            ? "Experience is now publicly visible. 👁️"
            : "Experience hidden from public portfolio. 🙈",

        experience,
      });
    } catch (error) {
      return handleControllerError(
        res,
        error,
        "Unable to update experience visibility."
      );
    }
  };

/*
|--------------------------------------------------------------------------
| UPDATE FEATURED
|--------------------------------------------------------------------------
*/

const updateExperienceFeaturedController =
  async (
    req,
    res
  ) => {
    try {
      const experience =
        await updateExperienceFeatured(
          req.params.experienceId,
          req.body.isFeatured
        );

      return res.status(200).json({
        success: true,

        message:
          experience.isFeatured
            ? "Experience marked as featured. ⭐"
            : "Experience removed from featured. ✨",

        experience,
      });
    } catch (error) {
      return handleControllerError(
        res,
        error,
        "Unable to update experience featured status."
      );
    }
  };

/*
|--------------------------------------------------------------------------
| UPDATE ACTIVE STATUS
|--------------------------------------------------------------------------
*/

const updateExperienceActiveStatusController =
  async (
    req,
    res
  ) => {
    try {
      const experience =
        await updateExperienceActiveStatus(
          req.params.experienceId,
          req.body.isActive
        );

      return res.status(200).json({
        success: true,

        message:
          experience.isActive
            ? "Experience activated successfully. 🟢"
            : "Experience deactivated successfully. ⚪",

        experience,
      });
    } catch (error) {
      return handleControllerError(
        res,
        error,
        "Unable to update experience active status."
      );
    }
  };

/*
|--------------------------------------------------------------------------
| UPDATE DISPLAY ORDER
|--------------------------------------------------------------------------
*/

const updateExperienceDisplayOrderController =
  async (
    req,
    res
  ) => {
    try {
      const experience =
        await updateExperienceDisplayOrder(
          req.params.experienceId,
          req.body.displayOrder
        );

      return res.status(200).json({
        success: true,

        message:
          "Experience display order updated successfully. ↕️",

        experience,
      });
    } catch (error) {
      return handleControllerError(
        res,
        error,
        "Unable to update experience display order."
      );
    }
  };

/*
|--------------------------------------------------------------------------
| EXPORTS
|--------------------------------------------------------------------------
*/

module.exports = {
  getAdminExperiencesController,

  getPublicExperiencesController,

  getExperienceByIdController,

  getPublicExperienceByIdController,

  createExperienceController,

  updateExperienceController,

  deleteExperienceController,

  addExperienceDocumentController,

  deleteExperienceDocumentController,

  reorderExperienceDocumentsController,

  getExperienceDocumentUrlController,

  updateExperienceVisibilityController,

  updateExperienceFeaturedController,

  updateExperienceActiveStatusController,

  updateExperienceDisplayOrderController,
};