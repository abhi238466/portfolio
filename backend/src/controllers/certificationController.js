
const {
  createCertification,
  getCertificationById,
  getAllCertifications,
  getPublicCertifications,
  updateCertification,
  deleteCertification,
  addCertificationDocument,
  getCertificationDocument,
  updateCertificationDocument,
  deleteCertificationDocument,
  replaceCertificationDocument,
  reorderCertificationDocuments,
  updateCertificationVisibility,
  updateCertificationFeatured,
  updateCertificationActive,
  updateCertificationDisplayOrder,
  reorderCertifications,
  serializeCertificationForAdmin,
  serializeCertificationForPublic,
} = require("../services/certificationService");

const {
  uploadCertificationDocument,
  generateSignedCertificationDocumentUrl,
  deleteCertificationDocument: deleteCloudinaryCertificationDocument,
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
    "Certification controller error:",
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
| GET PUBLIC CERTIFICATIONS
|--------------------------------------------------------------------------
|
| GET /api/certifications
|
*/

const getPublicCertificationsController =
  async (req, res) => {
    try {
      const certifications =
        await getPublicCertifications();

      return sendSuccess(
        res,
        200,
        "Certifications loaded successfully.",
        {
          certifications,
        }
      );
    } catch (error) {
      return sendError(
        res,
        error,
        "Failed to load certifications."
      );
    }
  };

/*
|--------------------------------------------------------------------------
| GET ALL CERTIFICATIONS - ADMIN
|--------------------------------------------------------------------------
|
| GET /api/admin/certifications
|
*/

const getAllCertificationsController =
  async (req, res) => {
    try {
      const result =
        await getAllCertifications({
          page:
            req.query.page,

          limit:
            req.query.limit,

          search:
            req.query.search,

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
        "Certifications loaded successfully.",
        result
      );
    } catch (error) {
      return sendError(
        res,
        error,
        "Failed to load certifications."
      );
    }
  };

/*
|--------------------------------------------------------------------------
| GET CERTIFICATION BY ID - ADMIN
|--------------------------------------------------------------------------
|
| GET /api/admin/certifications/:certificationId
|
*/

const getCertificationByIdController =
  async (req, res) => {
    try {
      const certification =
        await getCertificationById(
          req.params.certificationId
        );

      return sendSuccess(
        res,
        200,
        "Certification loaded successfully.",
        {
          certification:
            serializeCertificationForAdmin(
              certification
            ),
        }
      );
    } catch (error) {
      return sendError(
        res,
        error,
        "Failed to load certification."
      );
    }
  };

/*
|--------------------------------------------------------------------------
| CREATE CERTIFICATION
|--------------------------------------------------------------------------
|
| POST /api/admin/certifications
|
*/

const createCertificationController =
  async (req, res) => {
    try {
      const certification =
        await createCertification(
          req.body
        );

      return sendSuccess(
        res,
        201,
        "Certification created successfully.",
        {
          certification:
            serializeCertificationForAdmin(
              certification
            ),
        }
      );
    } catch (error) {
      return sendError(
        res,
        error,
        "Failed to create certification."
      );
    }
  };

/*
|--------------------------------------------------------------------------
| UPDATE CERTIFICATION
|--------------------------------------------------------------------------
|
| PUT /api/admin/certifications/:certificationId
|
*/

const updateCertificationController =
  async (req, res) => {
    try {
      const certification =
        await updateCertification(
          req.params.certificationId,
          req.body
        );

      return sendSuccess(
        res,
        200,
        "Certification updated successfully.",
        {
          certification:
            serializeCertificationForAdmin(
              certification
            ),
        }
      );
    } catch (error) {
      return sendError(
        res,
        error,
        "Failed to update certification."
      );
    }
  };

/*
|--------------------------------------------------------------------------
| DELETE CERTIFICATION
|--------------------------------------------------------------------------
|
| DELETE /api/admin/certifications/:certificationId
|
| MongoDB record is deleted first.
| Related Cloudinary documents are then cleaned up.
|
*/

const deleteCertificationController =
  async (req, res) => {
    try {
      const certification =
        await deleteCertification(
          req.params.certificationId
        );

      const documents =
        Array.isArray(
          certification.documents
        )
          ? certification.documents
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
            await deleteCloudinaryCertificationDocument(
              document.publicId,
              document.resourceType ||
                "raw"
            );

          cloudinaryResults.push({
            publicId:
              document.publicId,

            result,
          });
        } catch (
          cloudinaryError
        ) {
          console.error(
            "Failed to delete certification document from Cloudinary:",
            cloudinaryError
          );
        }
      }

      return sendSuccess(
        res,
        200,
        "Certification deleted successfully.",
        {
          certification:
            serializeCertificationForAdmin(
              certification
            ),

          cloudinaryCleanup:
            cloudinaryResults,
        }
      );
    } catch (error) {
      return sendError(
        res,
        error,
        "Failed to delete certification."
      );
    }
  };

/*
|--------------------------------------------------------------------------
| UPLOAD CERTIFICATION DOCUMENT
|--------------------------------------------------------------------------
|
| POST /api/admin/certifications/:certificationId/documents
|
| multipart/form-data
|
| Field:
| document
|
*/

const uploadCertificationDocumentController =
  async (req, res) => {
    let uploadedDocument = null;

    try {
      if (!req.file) {
        return res.status(
          400
        ).json({
          success: false,
          message:
            "Please select a certification document to upload.",
        });
      }

      uploadedDocument =
        await uploadCertificationDocument(
          req.file
        );

      const documentType =
        req.body.documentType ||
        "certificate";

      const certification =
        await addCertificationDocument(
          req.params.certificationId,
          {
            ...uploadedDocument,
            documentType,
          }
        );

      return sendSuccess(
        res,
        201,
        "Certification document uploaded successfully.",
        {
          certification:
            serializeCertificationForAdmin(
              certification
            ),
        }
      );
    } catch (error) {
      /*
       * ---------------------------------------------------------------
       * ROLLBACK CLOUDINARY UPLOAD
       * ---------------------------------------------------------------
       */

      if (
        uploadedDocument?.publicId
      ) {
        try {
          await deleteCloudinaryCertificationDocument(
            uploadedDocument.publicId,
            uploadedDocument.resourceType ||
              "raw"
          );
        } catch (
          cleanupError
        ) {
          console.error(
            "Failed to rollback certification Cloudinary upload:",
            cleanupError
          );
        }
      }

      return sendError(
        res,
        error,
        "Failed to upload certification document."
      );
    }
  };

/*
|--------------------------------------------------------------------------
| GET CERTIFICATION DOCUMENT PREVIEW
|--------------------------------------------------------------------------
|
| GET /api/admin/certifications/:certificationId/documents/:documentId
|
| Returns a fresh signed Cloudinary URL.
|
*/

const getCertificationDocumentController =
  async (req, res) => {
    try {
      const {
        document,
      } =
        await getCertificationDocument(
          req.params.certificationId,
          req.params.documentId
        );

      const signedUrl =
        generateSignedCertificationDocumentUrl(
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
        "Certification document preview URL generated successfully.",
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
        "Failed to generate certification document preview."
      );
    }
  };

/*
|--------------------------------------------------------------------------
| UPDATE CERTIFICATION DOCUMENT METADATA
|--------------------------------------------------------------------------
|
| PATCH /api/admin/certifications/:certificationId/documents/:documentId
|
| Supports:
| - documentType
| - displayOrder
|
*/

const updateCertificationDocumentController =
  async (req, res) => {
    try {
      const certification =
        await updateCertificationDocument(
          req.params.certificationId,
          req.params.documentId,
          req.body
        );

      return sendSuccess(
        res,
        200,
        "Certification document updated successfully.",
        {
          certification:
            serializeCertificationForAdmin(
              certification
            ),
        }
      );
    } catch (error) {
      return sendError(
        res,
        error,
        "Failed to update certification document."
      );
    }
  };

/*
|--------------------------------------------------------------------------
| DELETE CERTIFICATION DOCUMENT
|--------------------------------------------------------------------------
|
| DELETE /api/admin/certifications/:certificationId/documents/:documentId
|
*/

const deleteCertificationDocumentController =
  async (req, res) => {
    try {
      const result =
        await deleteCertificationDocument(
          req.params.certificationId,
          req.params.documentId
        );

      const deletedDocument =
        result.deletedDocument;

      let cloudinaryResult =
        null;

      if (
        deletedDocument?.publicId
      ) {
        try {
          cloudinaryResult =
            await deleteCloudinaryCertificationDocument(
              deletedDocument.publicId,
              deletedDocument.resourceType ||
                "raw"
            );
        } catch (
          cloudinaryError
        ) {
          console.error(
            "Failed to delete certification document from Cloudinary:",
            cloudinaryError
          );
        }
      }

      return sendSuccess(
        res,
        200,
        "Certification document deleted successfully.",
        {
          certification:
            serializeCertificationForAdmin(
              result.certification
            ),

          deletedDocument,

          cloudinaryResult,
        }
      );
    } catch (error) {
      return sendError(
        res,
        error,
        "Failed to delete certification document."
      );
    }
  };

/*
|--------------------------------------------------------------------------
| REPLACE CERTIFICATION DOCUMENT
|--------------------------------------------------------------------------
|
| PUT /api/admin/certifications/:certificationId/documents/:documentId
|
| multipart/form-data
|
| Field:
| document
|
*/

const replaceCertificationDocumentController =
  async (req, res) => {
    let uploadedDocument = null;

    try {
      if (!req.file) {
        return res.status(
          400
        ).json({
          success: false,
          message:
            "Please select a replacement certification document.",
        });
      }

      const {
        document:
          oldDocument,
      } =
        await getCertificationDocument(
          req.params.certificationId,
          req.params.documentId
        );

      uploadedDocument =
        await uploadCertificationDocument(
          req.file
        );

      const documentType =
        req.body.documentType ||
        oldDocument.documentType ||
        "certificate";

      const result =
        await replaceCertificationDocument(
          req.params.certificationId,
          req.params.documentId,
          {
            ...uploadedDocument,
            documentType,

            displayOrder:
              oldDocument.displayOrder,
          }
        );

      if (
        result.oldDocument?.publicId &&
        result.oldDocument.publicId !==
          result.newDocument?.publicId
      ) {
        try {
          await deleteCloudinaryCertificationDocument(
            result.oldDocument.publicId,
            result.oldDocument.resourceType ||
              "raw"
          );
        } catch (
          cloudinaryError
        ) {
          console.error(
            "Failed to delete replaced certification document from Cloudinary:",
            cloudinaryError
          );
        }
      }

      return sendSuccess(
        res,
        200,
        "Certification document replaced successfully.",
        {
          certification:
            serializeCertificationForAdmin(
              result.certification
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
          await deleteCloudinaryCertificationDocument(
            uploadedDocument.publicId,
            uploadedDocument.resourceType ||
              "raw"
          );
        } catch (
          cleanupError
        ) {
          console.error(
            "Failed to rollback replacement certification document:",
            cleanupError
          );
        }
      }

      return sendError(
        res,
        error,
        "Failed to replace certification document."
      );
    }
  };

/*
|--------------------------------------------------------------------------
| REORDER CERTIFICATION DOCUMENTS
|--------------------------------------------------------------------------
|
| PATCH /api/admin/certifications/:certificationId/documents/reorder
|
| Body:
| {
|   "documentIds": ["id1", "id2", "id3"]
| }
|
*/

const reorderCertificationDocumentsController =
  async (req, res) => {
    try {
      const certification =
        await reorderCertificationDocuments(
          req.params.certificationId,
          req.body.documentIds
        );

      return sendSuccess(
        res,
        200,
        "Certification documents reordered successfully.",
        {
          certification:
            serializeCertificationForAdmin(
              certification
            ),
        }
      );
    } catch (error) {
      return sendError(
        res,
        error,
        "Failed to reorder certification documents."
      );
    }
  };

/*
|--------------------------------------------------------------------------
| UPDATE VISIBILITY
|--------------------------------------------------------------------------
|
| PATCH /api/admin/certifications/:certificationId/visibility
|
*/

const updateCertificationVisibilityController =
  async (req, res) => {
    try {
      const certification =
        await updateCertificationVisibility(
          req.params.certificationId,
          req.body.isVisible
        );

      return sendSuccess(
        res,
        200,
        "Certification visibility updated successfully.",
        {
          certification:
            serializeCertificationForAdmin(
              certification
            ),
        }
      );
    } catch (error) {
      return sendError(
        res,
        error,
        "Failed to update certification visibility."
      );
    }
  };

/*
|--------------------------------------------------------------------------
| UPDATE FEATURED STATUS
|--------------------------------------------------------------------------
|
| PATCH /api/admin/certifications/:certificationId/featured
|
*/

const updateCertificationFeaturedController =
  async (req, res) => {
    try {
      const certification =
        await updateCertificationFeatured(
          req.params.certificationId,
          req.body.isFeatured
        );

      return sendSuccess(
        res,
        200,
        "Certification featured status updated successfully.",
        {
          certification:
            serializeCertificationForAdmin(
              certification
            ),
        }
      );
    } catch (error) {
      return sendError(
        res,
        error,
        "Failed to update certification featured status."
      );
    }
  };

/*
|--------------------------------------------------------------------------
| UPDATE ACTIVE STATUS
|--------------------------------------------------------------------------
|
| PATCH /api/admin/certifications/:certificationId/active
|
*/

const updateCertificationActiveController =
  async (req, res) => {
    try {
      const certification =
        await updateCertificationActive(
          req.params.certificationId,
          req.body.isActive
        );

      return sendSuccess(
        res,
        200,
        "Certification active status updated successfully.",
        {
          certification:
            serializeCertificationForAdmin(
              certification
            ),
        }
      );
    } catch (error) {
      return sendError(
        res,
        error,
        "Failed to update certification active status."
      );
    }
  };

/*
|--------------------------------------------------------------------------
| UPDATE DISPLAY ORDER
|--------------------------------------------------------------------------
|
| PATCH /api/admin/certifications/:certificationId/order
|
*/

const updateCertificationDisplayOrderController =
  async (req, res) => {
    try {
      const certification =
        await updateCertificationDisplayOrder(
          req.params.certificationId,
          req.body.displayOrder
        );

      return sendSuccess(
        res,
        200,
        "Certification display order updated successfully.",
        {
          certification:
            serializeCertificationForAdmin(
              certification
            ),
        }
      );
    } catch (error) {
      return sendError(
        res,
        error,
        "Failed to update certification display order."
      );
    }
  };

/*
|--------------------------------------------------------------------------
| REORDER CERTIFICATIONS
|--------------------------------------------------------------------------
|
| PATCH /api/admin/certifications/reorder
|
| Body:
| {
|   "certificationIds": ["id1", "id2", "id3"]
| }
|
*/

const reorderCertificationsController =
  async (req, res) => {
    try {
      const certifications =
        await reorderCertifications(
          req.body.certificationIds
        );

      return sendSuccess(
        res,
        200,
        "Certifications reordered successfully.",
        {
          certifications:
            certifications.map(
              serializeCertificationForAdmin
            ),
        }
      );
    } catch (error) {
      return sendError(
        res,
        error,
        "Failed to reorder certifications."
      );
    }
  };

/*
|--------------------------------------------------------------------------
| EXPORTS
|--------------------------------------------------------------------------
*/

module.exports = {
  getPublicCertificationsController,

  getAllCertificationsController,

  getCertificationByIdController,

  createCertificationController,

  updateCertificationController,

  deleteCertificationController,

  uploadCertificationDocumentController,

  getCertificationDocumentController,

  updateCertificationDocumentController,

  deleteCertificationDocumentController,

  replaceCertificationDocumentController,

  reorderCertificationDocumentsController,

  updateCertificationVisibilityController,

  updateCertificationFeaturedController,

  updateCertificationActiveController,

  updateCertificationDisplayOrderController,

  reorderCertificationsController,
};