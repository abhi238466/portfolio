const express = require("express");

const {
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
} = require("../controllers/experienceController");

const {
  uploadExperienceDocument,
} = require("../middleware/experienceUploadMiddleware");

const {
  protectAdmin,
} = require("../middleware/authMiddleware");

/*
|--------------------------------------------------------------------------
| PUBLIC EXPERIENCE ROUTES
|--------------------------------------------------------------------------
|
| These routes are accessible from the public portfolio.
|
*/

const publicExperienceRouter =
  express.Router();

/*
|--------------------------------------------------------------------------
| GET ALL PUBLIC EXPERIENCES
|--------------------------------------------------------------------------
|
| Only:
| - isActive: true
| - isVisible: true
|
*/

publicExperienceRouter.get(
  "/",
  getPublicExperiencesController
);

/*
|--------------------------------------------------------------------------
| GET PUBLIC EXPERIENCE BY ID
|--------------------------------------------------------------------------
*/

publicExperienceRouter.get(
  "/:experienceId",
  getPublicExperienceByIdController
);

/*
|--------------------------------------------------------------------------
| ADMIN EXPERIENCE ROUTES
|--------------------------------------------------------------------------
|
| All routes below require authenticated admin access.
|
*/

const adminExperienceRouter =
  express.Router();

/*
|--------------------------------------------------------------------------
| ADMIN AUTHENTICATION
|--------------------------------------------------------------------------
*/

adminExperienceRouter.use(
  protectAdmin
);

/*
|--------------------------------------------------------------------------
| GET ALL EXPERIENCES
|--------------------------------------------------------------------------
|
| Includes:
| - visible
| - hidden
| - active
| - inactive
|
*/

adminExperienceRouter.get(
  "/",
  getAdminExperiencesController
);

/*
|--------------------------------------------------------------------------
| CREATE EXPERIENCE
|--------------------------------------------------------------------------
*/

adminExperienceRouter.post(
  "/",
  createExperienceController
);

/*
|--------------------------------------------------------------------------
| GET EXPERIENCE BY ID
|--------------------------------------------------------------------------
*/

adminExperienceRouter.get(
  "/:experienceId",
  getExperienceByIdController
);

/*
|--------------------------------------------------------------------------
| UPDATE EXPERIENCE
|--------------------------------------------------------------------------
*/

adminExperienceRouter.put(
  "/:experienceId",
  updateExperienceController
);

/*
|--------------------------------------------------------------------------
| DELETE EXPERIENCE
|--------------------------------------------------------------------------
*/

adminExperienceRouter.delete(
  "/:experienceId",
  deleteExperienceController
);

/*
|--------------------------------------------------------------------------
| ADD EXPERIENCE DOCUMENT
|--------------------------------------------------------------------------
|
| Expected multipart/form-data field:
|
| document
|
*/

adminExperienceRouter.post(
  "/:experienceId/documents",
  uploadExperienceDocument,
  addExperienceDocumentController
);

/*
|--------------------------------------------------------------------------
| DELETE EXPERIENCE DOCUMENT
|--------------------------------------------------------------------------
*/

adminExperienceRouter.delete(
  "/:experienceId/documents/:documentId",
  deleteExperienceDocumentController
);

/*
|--------------------------------------------------------------------------
| REORDER EXPERIENCE DOCUMENTS
|--------------------------------------------------------------------------
|
| Expected JSON:
|
| {
|   "orderedDocumentIds": [
|     "documentId1",
|     "documentId2"
|   ]
| }
|
*/

adminExperienceRouter.patch(
  "/:experienceId/documents/reorder",
  reorderExperienceDocumentsController
);

/*
|--------------------------------------------------------------------------
| GENERATE SECURE EXPERIENCE DOCUMENT URL
|--------------------------------------------------------------------------
|
| Generates a signed Cloudinary URL for an authenticated
| experience document.
|
*/

adminExperienceRouter.get(
  "/:experienceId/documents/:documentId/url",
  getExperienceDocumentUrlController
);

/*
|--------------------------------------------------------------------------
| UPDATE PUBLIC VISIBILITY
|--------------------------------------------------------------------------
*/

adminExperienceRouter.patch(
  "/:experienceId/visibility",
  updateExperienceVisibilityController
);

/*
|--------------------------------------------------------------------------
| UPDATE FEATURED STATUS
|--------------------------------------------------------------------------
*/

adminExperienceRouter.patch(
  "/:experienceId/featured",
  updateExperienceFeaturedController
);

/*
|--------------------------------------------------------------------------
| UPDATE ACTIVE STATUS
|--------------------------------------------------------------------------
*/

adminExperienceRouter.patch(
  "/:experienceId/active",
  updateExperienceActiveStatusController
);

/*
|--------------------------------------------------------------------------
| UPDATE DISPLAY ORDER
|--------------------------------------------------------------------------
*/

adminExperienceRouter.patch(
  "/:experienceId/display-order",
  updateExperienceDisplayOrderController
);

/*
|--------------------------------------------------------------------------
| EXPORTS
|--------------------------------------------------------------------------
*/

module.exports = {
  publicExperienceRouter,
  adminExperienceRouter,
};