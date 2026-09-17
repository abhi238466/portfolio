const {
  createEducation,
  getEducationById,
  getAllEducation,
  getPublicEducation,
  updateEducation,
  deleteEducation,
  addEducationDocument,
  getEducationDocument,
  updateEducationDocument,
  deleteEducationDocument,
  replaceEducationDocument,
  reorderEducationDocuments,
  updateEducationVisibility,
  updateEducationFeatured,
  updateEducationActive,
  updateEducationDisplayOrder,
  reorderEducation,
  serializeEducationForAdmin,
  serializeEducationForPublic,
} = require("../services/educationService");

const {
  uploadEducationDocument,
  generateSignedEducationDocumentUrl,
} = require("../services/cloudinaryService");

/*
|--------------------------------------------------------------------------
| RESPONSE HELPERS
|--------------------------------------------------------------------------
*/

const sendSuccess = (
  res,
  statusCode,
  message,
  data = {}
) => {
  return res.status(
    statusCode
  ).json({
    success: true,
    message,
    ...data,
  });
};

const sendError = (
  res,
  error,
  fallbackMessage
) => {
  console.error(
    "Education controller error:",
    error
  );

  const statusCode =
    error.statusCode || 500;

  return res.status(
    statusCode
  ).json({
    success: false,
    message:
      error.message ||
      fallbackMessage,
    ...(error.validationErrors
      ? {
          validationErrors:
            error.validationErrors,
        }
      : {}),
  });
};

/*
|--------------------------------------------------------------------------
| GET PUBLIC EDUCATION
|--------------------------------------------------------------------------
|
| GET /api/education
|
*/

const getPublicEducationController =
  async (req, res) => {
    try {
      const education =
        await getPublicEducation();

      return sendSuccess(
        res,
        200,
        "Education loaded successfully.",
        {
          education,
        }
      );
    } catch (error) {
      return sendError(
        res,
        error,
        "Failed to load education."
      );
    }
  };

/*
|--------------------------------------------------------------------------
| GET ALL EDUCATION - ADMIN
|--------------------------------------------------------------------------
|
| GET /api/admin/education
|
*/

const getAllEducationController =
  async (req, res) => {
    try {
      const result =
        await getAllEducation({
          page:
            req.query.page,
          limit:
            req.query.limit,
          search:
            req.query.search,
          educationLevel:
            req.query.educationLevel,
          visibility:
            req.query.visibility,
          active:
            req.query.active,
          featured:
            req.query.featured,
        });

      return sendSuccess(
        res,
        200,
        "Education records loaded successfully.",
        result
      );
    } catch (error) {
      return sendError(
        res,
        error,
        "Failed to load education records."
      );
    }
  };

/*
|--------------------------------------------------------------------------
| GET EDUCATION BY ID - ADMIN
|--------------------------------------------------------------------------
|
| GET /api/admin/education/:educationId
|
*/

const getEducationByIdController =
  async (req, res) => {
    try {
      const education =
        await getEducationById(
          req.params.educationId
        );

      return sendSuccess(
        res,
        200,
        "Education record loaded successfully.",
        {
          education:
            serializeEducationForAdmin(
              education
            ),
        }
      );
    } catch (error) {
      return sendError(
        res,
        error,
        "Failed to load education record."
      );
    }
  };

/*
|--------------------------------------------------------------------------
| CREATE EDUCATION
|--------------------------------------------------------------------------
|
| POST /api/admin/education
|
*/

const createEducationController =
  async (req, res) => {
    try {
      const education =
        await createEducation(
          req.body
        );

      return sendSuccess(
        res,
        201,
        "Education record created successfully.",
        {
          education:
            serializeEducationForAdmin(
              education
            ),
        }
      );
    } catch (error) {
      return sendError(
        res,
        error,
        "Failed to create education record."
      );
    }
  };

/*
|--------------------------------------------------------------------------
| UPDATE EDUCATION
|--------------------------------------------------------------------------
|
| PUT /api/admin/education/:educationId
|
*/

const updateEducationController =
  async (req, res) => {
    try {
      const education =
        await updateEducation(
          req.params.educationId,
          req.body
        );

      return sendSuccess(
        res,
        200,
        "Education record updated successfully.",
        {
          education:
            serializeEducationForAdmin(
              education
            ),
        }
      );
    } catch (error) {
      return sendError(
        res,
        error,
        "Failed to update education record."
      );
    }
  };

/*
|--------------------------------------------------------------------------
| DELETE EDUCATION
|--------------------------------------------------------------------------
|
| DELETE /api/admin/education/:educationId
|
| The service returns the deleted education record.
| All related Cloudinary documents are then deleted.
|
*/

const deleteEducationController =
  async (req, res) => {
    try {
      const education =
        await deleteEducation(
          req.params.educationId
        );

      /*
       * ---------------------------------------------------------------
       * DELETE ALL CLOUDINARY DOCUMENTS
       * ---------------------------------------------------------------
       */

      const documents =
        Array.isArray(
          education.documents
        )
          ? education.documents
          : [];

      const cloudinaryResults =
        [];

      for (
        const document of documents
      ) {
        if (
          !document.publicId
        ) {
          continue;
        }

        try {
          const result =
            await require(
              "../services/cloudinaryService"
            ).deleteEducationDocument(
              document.publicId,
              document.resourceType ||
                "raw"
            );

          cloudinaryResults.push(
            {
              publicId:
                document.publicId,
              result,
            }
          );
        } catch (
          cloudinaryError
        ) {
          console.error(
            "Failed to delete education document from Cloudinary:",
            cloudinaryError
          );
        }
      }

      return sendSuccess(
        res,
        200,
        "Education record deleted successfully.",
        {
          education:
            serializeEducationForAdmin(
              education
            ),
          cloudinaryCleanup:
            cloudinaryResults,
        }
      );
    } catch (error) {
      return sendError(
        res,
        error,
        "Failed to delete education record."
      );
    }
  };

/*
|--------------------------------------------------------------------------
| UPLOAD EDUCATION DOCUMENT
|--------------------------------------------------------------------------
|
| POST /api/admin/education/:educationId/documents
|
| multipart/form-data
|
| Field:
| document
|
*/

const uploadEducationDocumentController =
  async (req, res) => {
    let uploadedDocument = null;

    try {
      if (!req.file) {
        return res.status(
          400
        ).json({
          success: false,
          message:
            "Please select an education document to upload.",
        });
      }

      /*
       * ---------------------------------------------------------------
       * UPLOAD TO CLOUDINARY
       * ---------------------------------------------------------------
       */

      uploadedDocument =
        await uploadEducationDocument(
          req.file
        );

      /*
       * ---------------------------------------------------------------
       * DOCUMENT TYPE
       * ---------------------------------------------------------------
       */

      const documentType =
        req.body.documentType ||
        "marksheet";

      /*
       * ---------------------------------------------------------------
       * SAVE CLOUDINARY METADATA TO MONGODB
       * ---------------------------------------------------------------
       */

      const education =
        await addEducationDocument(
          req.params.educationId,
          {
            ...uploadedDocument,
            documentType,
          }
        );

      return sendSuccess(
        res,
        201,
        "Education document uploaded successfully.",
        {
          education:
            serializeEducationForAdmin(
              education
            ),
        }
      );
    } catch (error) {
      /*
       * ---------------------------------------------------------------
       * ROLLBACK CLOUDINARY UPLOAD
       * ---------------------------------------------------------------
       |
       | If Cloudinary upload succeeds but MongoDB
       | save fails, remove the newly uploaded asset
       | so an orphan file is not left behind.
       */

      if (
        uploadedDocument?.publicId
      ) {
        try {
          const {
            deleteEducationDocument,
          } = require(
            "../services/cloudinaryService"
          );

          await deleteEducationDocument(
            uploadedDocument.publicId,
            uploadedDocument.resourceType ||
              "raw"
          );
        } catch (
          cleanupError
        ) {
          console.error(
            "Failed to rollback education Cloudinary upload:",
            cleanupError
          );
        }
      }

      return sendError(
        res,
        error,
        "Failed to upload education document."
      );
    }
  };

/*
|--------------------------------------------------------------------------
| GET EDUCATION DOCUMENT PREVIEW
|--------------------------------------------------------------------------
|
| GET /api/admin/education/:educationId/documents/:documentId
|
| Returns a fresh signed Cloudinary URL.
|
*/

const getEducationDocumentController =
  async (req, res) => {
    try {
      const {
        document,
      } =
        await getEducationDocument(
          req.params.educationId,
          req.params.documentId
        );

      const signedUrl =
        generateSignedEducationDocumentUrl(
          document.publicId,
          document.resourceType ||
            "raw",
          document.mimeType ===
            "application/pdf"
            ? "pdf"
            : null
        );

      return sendSuccess(
        res,
        200,
        "Education document preview URL generated successfully.",
        {
          document: {
            id:
              document._id
                ? document._id.toString()
                : null,

            originalName:
              document.originalName,

            mimeType:
              document.mimeType,

            documentType:
              document.documentType,

            size:
              document.size,

            width:
              document.width,

            height:
              document.height,

            url:
              signedUrl,
          },
        }
      );
    } catch (error) {
      return sendError(
        res,
        error,
        "Failed to generate education document preview."
      );
    }
  };

/*
|--------------------------------------------------------------------------
| UPDATE EDUCATION DOCUMENT METADATA
|--------------------------------------------------------------------------
|
| PATCH /api/admin/education/:educationId/documents/:documentId
|
| Currently supports:
| - documentType
| - displayOrder
|
*/

const updateEducationDocumentController =
  async (req, res) => {
    try {
      const education =
        await updateEducationDocument(
          req.params.educationId,
          req.params.documentId,
          req.body
        );

      return sendSuccess(
        res,
        200,
        "Education document updated successfully.",
        {
          education:
            serializeEducationForAdmin(
              education
            ),
        }
      );
    } catch (error) {
      return sendError(
        res,
        error,
        "Failed to update education document."
      );
    }
  };

/*
|--------------------------------------------------------------------------
| DELETE EDUCATION DOCUMENT
|--------------------------------------------------------------------------
|
| DELETE /api/admin/education/:educationId/documents/:documentId
|
*/

const deleteEducationDocumentController =
  async (req, res) => {
    try {
      const result =
        await deleteEducationDocument(
          req.params.educationId,
          req.params.documentId
        );

      return sendSuccess(
        res,
        200,
        "Education document deleted successfully.",
        {
          education:
            serializeEducationForAdmin(
              result.education
            ),
          deletedDocument:
            result.deletedDocument,
        }
      );
    } catch (error) {
      return sendError(
        res,
        error,
        "Failed to delete education document."
      );
    }
  };

/*
|--------------------------------------------------------------------------
| REPLACE EDUCATION DOCUMENT
|--------------------------------------------------------------------------
|
| PUT /api/admin/education/:educationId/documents/:documentId
|
| multipart/form-data
|
| Field:
| document
|
*/

const replaceEducationDocumentController =
  async (req, res) => {
    let uploadedDocument = null;

    try {
      if (!req.file) {
        return res.status(
          400
        ).json({
          success: false,
          message:
            "Please select a replacement education document.",
        });
      }

      /*
       * ---------------------------------------------------------------
       * GET OLD DOCUMENT FIRST
       * ---------------------------------------------------------------
       */

      const {
        document:
          oldDocument,
      } =
        await getEducationDocument(
          req.params.educationId,
          req.params.documentId
        );

      /*
       * ---------------------------------------------------------------
       * UPLOAD NEW DOCUMENT
       * ---------------------------------------------------------------
       */

      uploadedDocument =
        await uploadEducationDocument(
          req.file
        );

      /*
       * ---------------------------------------------------------------
       * PRESERVE OLD DOCUMENT TYPE
       * ---------------------------------------------------------------
       */

      const documentType =
        req.body.documentType ||
        oldDocument.documentType ||
        "marksheet";

      /*
       * ---------------------------------------------------------------
       * REPLACE MONGODB METADATA
       * ---------------------------------------------------------------
       */

      const result =
        await replaceEducationDocument(
          req.params.educationId,
          req.params.documentId,
          {
            ...uploadedDocument,
            documentType,
            displayOrder:
              oldDocument.displayOrder,
          }
        );

      /*
       * ---------------------------------------------------------------
       * DELETE OLD CLOUDINARY ASSET
       * ---------------------------------------------------------------
       */

      if (
        result.oldDocument?.publicId &&
        result.oldDocument.publicId !==
          result.newDocument?.publicId
      ) {
        try {
          const {
            deleteEducationDocument,
          } = require(
            "../services/cloudinaryService"
          );

          await deleteEducationDocument(
            result.oldDocument.publicId,
            result.oldDocument.resourceType ||
              "raw"
          );
        } catch (
          cloudinaryError
        ) {
          console.error(
            "Failed to delete replaced education document from Cloudinary:",
            cloudinaryError
          );
        }
      }

      return sendSuccess(
        res,
        200,
        "Education document replaced successfully.",
        {
          education:
            serializeEducationForAdmin(
              result.education
            ),
          document:
            result.newDocument,
        }
      );
    } catch (error) {
      /*
       * ---------------------------------------------------------------
       * ROLLBACK NEW CLOUDINARY FILE
       * ---------------------------------------------------------------
       */

      if (
        uploadedDocument?.publicId
      ) {
        try {
          const {
            deleteEducationDocument,
          } = require(
            "../services/cloudinaryService"
          );

          await deleteEducationDocument(
            uploadedDocument.publicId,
            uploadedDocument.resourceType ||
              "raw"
          );
        } catch (
          cleanupError
        ) {
          console.error(
            "Failed to rollback replacement education document:",
            cleanupError
          );
        }
      }

      return sendError(
        res,
        error,
        "Failed to replace education document."
      );
    }
  };

/*
|--------------------------------------------------------------------------
| REORDER EDUCATION DOCUMENTS
|--------------------------------------------------------------------------
|
| PATCH /api/admin/education/:educationId/documents/reorder
|
| Body:
| {
|   "documentIds": ["id1", "id2", "id3"]
| }
|
*/

const reorderEducationDocumentsController =
  async (req, res) => {
    try {
      const education =
        await reorderEducationDocuments(
          req.params.educationId,
          req.body.documentIds
        );

      return sendSuccess(
        res,
        200,
        "Education documents reordered successfully.",
        {
          education:
            serializeEducationForAdmin(
              education
            ),
        }
      );
    } catch (error) {
      return sendError(
        res,
        error,
        "Failed to reorder education documents."
      );
    }
  };

/*
|--------------------------------------------------------------------------
| UPDATE VISIBILITY
|--------------------------------------------------------------------------
|
| PATCH /api/admin/education/:educationId/visibility
|
*/

const updateEducationVisibilityController =
  async (req, res) => {
    try {
      const education =
        await updateEducationVisibility(
          req.params.educationId,
          req.body.isVisible
        );

      return sendSuccess(
        res,
        200,
        "Education visibility updated successfully.",
        {
          education:
            serializeEducationForAdmin(
              education
            ),
        }
      );
    } catch (error) {
      return sendError(
        res,
        error,
        "Failed to update education visibility."
      );
    }
  };

/*
|--------------------------------------------------------------------------
| UPDATE FEATURED
|--------------------------------------------------------------------------
|
| PATCH /api/admin/education/:educationId/featured
|
*/

const updateEducationFeaturedController =
  async (req, res) => {
    try {
      const education =
        await updateEducationFeatured(
          req.params.educationId,
          req.body.isFeatured
        );

      return sendSuccess(
        res,
        200,
        "Education featured status updated successfully.",
        {
          education:
            serializeEducationForAdmin(
              education
            ),
        }
      );
    } catch (error) {
      return sendError(
        res,
        error,
        "Failed to update education featured status."
      );
    }
  };

/*
|--------------------------------------------------------------------------
| UPDATE ACTIVE STATUS
|--------------------------------------------------------------------------
|
| PATCH /api/admin/education/:educationId/active
|
*/

const updateEducationActiveController =
  async (req, res) => {
    try {
      const education =
        await updateEducationActive(
          req.params.educationId,
          req.body.isActive
        );

      return sendSuccess(
        res,
        200,
        "Education active status updated successfully.",
        {
          education:
            serializeEducationForAdmin(
              education
            ),
        }
      );
    } catch (error) {
      return sendError(
        res,
        error,
        "Failed to update education active status."
      );
    }
  };

/*
|--------------------------------------------------------------------------
| UPDATE DISPLAY ORDER
|--------------------------------------------------------------------------
|
| PATCH /api/admin/education/:educationId/order
|
*/

const updateEducationDisplayOrderController =
  async (req, res) => {
    try {
      const education =
        await updateEducationDisplayOrder(
          req.params.educationId,
          req.body.displayOrder
        );

      return sendSuccess(
        res,
        200,
        "Education display order updated successfully.",
        {
          education:
            serializeEducationForAdmin(
              education
            ),
        }
      );
    } catch (error) {
      return sendError(
        res,
        error,
        "Failed to update education display order."
      );
    }
  };

/*
|--------------------------------------------------------------------------
| REORDER EDUCATION RECORDS
|--------------------------------------------------------------------------
|
| PATCH /api/admin/education/reorder
|
| Body:
| {
|   "educationIds": ["id1", "id2", "id3"]
| }
|
*/

const reorderEducationController =
  async (req, res) => {
    try {
      const education =
        await reorderEducation(
          req.body.educationIds
        );

      return sendSuccess(
        res,
        200,
        "Education records reordered successfully.",
        {
          education:
            education.map(
              serializeEducationForAdmin
            ),
        }
      );
    } catch (error) {
      return sendError(
        res,
        error,
        "Failed to reorder education records."
      );
    }
  };

/*
|--------------------------------------------------------------------------
| EXPORTS
|--------------------------------------------------------------------------
*/

module.exports = {
  getPublicEducationController,

  getAllEducationController,

  getEducationByIdController,

  createEducationController,

  updateEducationController,

  deleteEducationController,

  uploadEducationDocumentController,

  getEducationDocumentController,

  updateEducationDocumentController,

  deleteEducationDocumentController,

  replaceEducationDocumentController,

  reorderEducationDocumentsController,

  updateEducationVisibilityController,

  updateEducationFeaturedController,

  updateEducationActiveController,

  updateEducationDisplayOrderController,

  reorderEducationController,
};