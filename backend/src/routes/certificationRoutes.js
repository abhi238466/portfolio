const express = require("express");

const router = express.Router();

/*
|--------------------------------------------------------------------------
| Middleware
|--------------------------------------------------------------------------
*/

const {
  protectAdmin,
} = require("../middleware/authMiddleware");

const {
  certificationDocumentUpload,
} = require("../middleware/certificationUploadMiddleware");

/*
|--------------------------------------------------------------------------
| Controller
|--------------------------------------------------------------------------
*/

const {
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
} = require("../controllers/certificationController");

/*
|--------------------------------------------------------------------------
| PUBLIC ROUTES
|--------------------------------------------------------------------------
*/

/*
 * Get all visible certifications
 *
 * GET /api/certifications
 */
router.get(
  "/",
  getPublicCertificationsController
);

/*
|--------------------------------------------------------------------------
| PROTECTED ADMIN ROUTES
|--------------------------------------------------------------------------
*/

router.use(
  "/admin",
  protectAdmin
);

/*
|--------------------------------------------------------------------------
| CERTIFICATION CRUD
|--------------------------------------------------------------------------
*/

/*
 * Get all certifications
 *
 * GET /api/certifications/admin
 */
router.get(
  "/admin",
  getAllCertificationsController
);

/*
 * Reorder certifications
 *
 * PATCH /api/certifications/admin/reorder
 *
 * Must be declared before /:certificationId
 */
router.patch(
  "/admin/reorder",
  reorderCertificationsController
);

/*
 * Create certification
 *
 * POST /api/certifications/admin
 */
router.post(
  "/admin",
  createCertificationController
);

/*
 * Get certification by ID
 *
 * GET /api/certifications/admin/:certificationId
 */
router.get(
  "/admin/:certificationId",
  getCertificationByIdController
);

/*
 * Update certification
 *
 * PUT /api/certifications/admin/:certificationId
 */
router.put(
  "/admin/:certificationId",
  updateCertificationController
);

/*
 * Delete certification
 *
 * DELETE /api/certifications/admin/:certificationId
 */
router.delete(
  "/admin/:certificationId",
  deleteCertificationController
);

/*
|--------------------------------------------------------------------------
| CERTIFICATION DOCUMENT ROUTES
|--------------------------------------------------------------------------
*/

/*
 * Add certification document
 *
 * POST /api/certifications/admin/:certificationId/documents
 */
router.post(
  "/admin/:certificationId/documents",
  certificationDocumentUpload.single("document"),
  uploadCertificationDocumentController
);

/*
 * Get certification document
 *
 * GET /api/certifications/admin/:certificationId/documents/:documentId
 */
router.get(
  "/admin/:certificationId/documents/:documentId",
  getCertificationDocumentController
);

/*
 * Reorder certification documents
 *
 * PATCH /api/certifications/admin/:certificationId/documents/reorder
 *
 * Must be declared before /:documentId
 */
router.patch(
  "/admin/:certificationId/documents/reorder",
  reorderCertificationDocumentsController
);

/*
 * Update certification document metadata
 *
 * PATCH /api/certifications/admin/:certificationId/documents/:documentId
 */
router.patch(
  "/admin/:certificationId/documents/:documentId",
  updateCertificationDocumentController
);

/*
 * Replace certification document
 *
 * PUT /api/certifications/admin/:certificationId/documents/:documentId
 */
router.put(
  "/admin/:certificationId/documents/:documentId",
  certificationDocumentUpload.single("document"),
  replaceCertificationDocumentController
);

/*
 * Delete certification document
 *
 * DELETE /api/certifications/admin/:certificationId/documents/:documentId
 */
router.delete(
  "/admin/:certificationId/documents/:documentId",
  deleteCertificationDocumentController
);

/*
|--------------------------------------------------------------------------
| CERTIFICATION STATUS AND DISPLAY CONTROLS
|--------------------------------------------------------------------------
*/

/*
 * Update visibility
 *
 * PATCH /api/certifications/admin/:certificationId/visibility
 */
router.patch(
  "/admin/:certificationId/visibility",
  updateCertificationVisibilityController
);

/*
 * Update featured status
 *
 * PATCH /api/certifications/admin/:certificationId/featured
 */
router.patch(
  "/admin/:certificationId/featured",
  updateCertificationFeaturedController
);

/*
 * Update active status
 *
 * PATCH /api/certifications/admin/:certificationId/active
 */
router.patch(
  "/admin/:certificationId/active",
  updateCertificationActiveController
);

/*
 * Update display order
 *
 * PATCH /api/certifications/admin/:certificationId/display-order
 */
router.patch(
  "/admin/:certificationId/display-order",
  updateCertificationDisplayOrderController
);

/*
|--------------------------------------------------------------------------
| EXPORT ROUTER
|--------------------------------------------------------------------------
*/

module.exports = router;