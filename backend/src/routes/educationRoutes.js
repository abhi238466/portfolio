const express = require("express");

const {
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
} = require("../controllers/educationController");

const { protectAdmin } = require("../middleware/authMiddleware");

const {
  uploadEducationDocument,
} = require("../middleware/educationUploadMiddleware");

/*
|--------------------------------------------------------------------------
| PUBLIC EDUCATION ROUTER
|--------------------------------------------------------------------------
|
| Publicly accessible education endpoints.
|
*/

const publicEducationRouter =
  express.Router();

/*
 * GET /api/education
 *
 * Returns only visible/active education records.
 */
publicEducationRouter.get(
  "/",
  getPublicEducationController
);

/*
|--------------------------------------------------------------------------
| ADMIN EDUCATION ROUTER
|--------------------------------------------------------------------------
|
| All routes below require authenticated admin access.
|
*/

const adminEducationRouter =
  express.Router();

/*
 * Protect every admin education route.
 */
adminEducationRouter.use(
  protectAdmin
);

/*
|--------------------------------------------------------------------------
| EDUCATION CRUD
|--------------------------------------------------------------------------
*/

/*
 * GET /api/admin/education
 *
 * Get all education records with search/filter/pagination.
 */
adminEducationRouter.get(
  "/",
  getAllEducationController
);

/*
 * GET /api/admin/education/:educationId
 *
 * Get one education record.
 */
adminEducationRouter.get(
  "/:educationId",
  getEducationByIdController
);

/*
 * POST /api/admin/education
 *
 * Create a new education record.
 */
adminEducationRouter.post(
  "/",
  createEducationController
);

/*
 * PUT /api/admin/education/:educationId
 *
 * Update an education record.
 */
adminEducationRouter.put(
  "/:educationId",
  updateEducationController
);

/*
 * DELETE /api/admin/education/:educationId
 *
 * Delete an education record and its Cloudinary documents.
 */
adminEducationRouter.delete(
  "/:educationId",
  deleteEducationController
);

/*
|--------------------------------------------------------------------------
| EDUCATION DOCUMENTS
|--------------------------------------------------------------------------
*/

/*
 * POST /api/admin/education/:educationId/documents
 *
 * Upload a new document.
 *
 * multipart/form-data
 * field: document
 */
adminEducationRouter.post(
  "/:educationId/documents",
  uploadEducationDocument,
  uploadEducationDocumentController
);

/*
 * GET /api/admin/education/:educationId/documents/:documentId
 *
 * Generate a fresh signed URL for document preview.
 */
adminEducationRouter.get(
  "/:educationId/documents/:documentId",
  getEducationDocumentController
);

/*
 * PATCH /api/admin/education/:educationId/documents/:documentId
 *
 * Update document metadata.
 */
adminEducationRouter.patch(
  "/:educationId/documents/:documentId",
  updateEducationDocumentController
);

/*
 * PUT /api/admin/education/:educationId/documents/:documentId
 *
 * Replace an existing document.
 *
 * multipart/form-data
 * field: document
 */
adminEducationRouter.put(
  "/:educationId/documents/:documentId",
  uploadEducationDocument,
  replaceEducationDocumentController
);

/*
 * DELETE /api/admin/education/:educationId/documents/:documentId
 *
 * Delete one education document.
 */
adminEducationRouter.delete(
  "/:educationId/documents/:documentId",
  deleteEducationDocumentController
);

/*
 * PATCH /api/admin/education/:educationId/documents/reorder
 *
 * Reorder documents belonging to one education record.
 *
 * IMPORTANT:
 * This route is declared before the generic
 * /:documentId route so "reorder" is not treated
 * as a document ID.
 */
adminEducationRouter.patch(
  "/:educationId/documents/reorder",
  reorderEducationDocumentsController
);

/*
|--------------------------------------------------------------------------
| EDUCATION STATUS / DISPLAY CONTROLS
|--------------------------------------------------------------------------
*/

/*
 * PATCH /api/admin/education/:educationId/visibility
 */
adminEducationRouter.patch(
  "/:educationId/visibility",
  updateEducationVisibilityController
);

/*
 * PATCH /api/admin/education/:educationId/featured
 */
adminEducationRouter.patch(
  "/:educationId/featured",
  updateEducationFeaturedController
);

/*
 * PATCH /api/admin/education/:educationId/active
 */
adminEducationRouter.patch(
  "/:educationId/active",
  updateEducationActiveController
);

/*
 * PATCH /api/admin/education/:educationId/order
 */
adminEducationRouter.patch(
  "/:educationId/order",
  updateEducationDisplayOrderController
);

/*
|--------------------------------------------------------------------------
| EDUCATION RECORD REORDER
|--------------------------------------------------------------------------
|
| PATCH /api/admin/education/reorder
|
| IMPORTANT:
| This route must come before /:educationId,
| otherwise "reorder" will be interpreted as
| an educationId.
|
*/
adminEducationRouter.patch(
  "/reorder",
  reorderEducationController
);

/*
|--------------------------------------------------------------------------
| EXPORT
|--------------------------------------------------------------------------
*/

module.exports = {
  publicEducationRouter,
  adminEducationRouter,
};