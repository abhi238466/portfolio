const express = require("express");

const {
  getAdminProfile,
  getPublicProfile,

  createProfile,
  updateProfile,

  updateProfileLinks,

  addProfessionalLink,
  updateProfessionalLink,
  deleteProfessionalLink,
  updateProfessionalLinkVisibility,

  updateProfileVisibility,

  setProfilePhoto,
  removeProfilePhoto,

  uploadProfileResume,
  removeResume,
  updateResumeVisibility,

  getAdminResume,
  getPublicResume,

  setProfileActiveStatus,

  deleteProfile,
} = require("../controllers/profileController");

const {
  protectAdmin,
} = require("../middleware/authMiddleware");

const {
  uploadProfilePhoto,
  uploadResume,
} = require("../middleware/profileUploadMiddleware");

/*
|--------------------------------------------------------------------------
| PUBLIC PROFILE ROUTER
|--------------------------------------------------------------------------
|
| Mounted in server.js at:
|
| /api/profile
|
| Endpoints:
|
| GET /api/profile
| GET /api/profile/resume
|
*/

const publicProfileRouter =
  express.Router();

/*
|--------------------------------------------------------------------------
| GET PUBLIC PROFILE
|--------------------------------------------------------------------------
*/

publicProfileRouter.get(
  "/",
  getPublicProfile
);

/*
|--------------------------------------------------------------------------
| GET PUBLIC RESUME
|--------------------------------------------------------------------------
|
| Public resume is available only when:
| - Profile is active
| - Resume exists
| - Resume visibility is enabled
|
| The controller generates a signed Cloudinary
| URL and redirects the request.
|
*/

publicProfileRouter.get(
  "/resume",
  getPublicResume
);

/*
|--------------------------------------------------------------------------
| ADMIN PROFILE ROUTER
|--------------------------------------------------------------------------
|
| Mounted in server.js at:
|
| /api/admin/profile
|
| Every route inside this router is protected
| by protectAdmin.
|
*/

const adminProfileRouter =
  express.Router();

/*
|--------------------------------------------------------------------------
| ADMIN AUTHENTICATION
|--------------------------------------------------------------------------
*/

adminProfileRouter.use(
  protectAdmin
);

/*
|--------------------------------------------------------------------------
| PROFILE CRUD
|--------------------------------------------------------------------------
|
| GET    /api/admin/profile
| POST   /api/admin/profile
| PUT    /api/admin/profile
| DELETE /api/admin/profile
|
*/

/*
 * Get profile
 */

adminProfileRouter.get(
  "/",
  getAdminProfile
);

/*
 * Create initial profile
 */

adminProfileRouter.post(
  "/",
  createProfile
);

/*
 * Update profile
 */

adminProfileRouter.put(
  "/",
  updateProfile
);

/*
 * Delete complete profile
 */

adminProfileRouter.delete(
  "/",
  deleteProfile
);

/*
|--------------------------------------------------------------------------
| PROFESSIONAL LINKS
|--------------------------------------------------------------------------
|
| PUT  /api/admin/profile/links
| POST /api/admin/profile/links
|
*/

/*
 * Update/replace complete links collection
 */

adminProfileRouter.put(
  "/links",
  updateProfileLinks
);

/*
 * Add professional link
 */

adminProfileRouter.post(
  "/links",
  addProfessionalLink
);

/*
|--------------------------------------------------------------------------
| INDIVIDUAL PROFESSIONAL LINK
|--------------------------------------------------------------------------
|
| PUT    /api/admin/profile/links/:linkId
| DELETE /api/admin/profile/links/:linkId
|
*/

/*
 * Update individual link
 */

adminProfileRouter.put(
  "/links/:linkId",
  updateProfessionalLink
);

/*
 * Delete individual link
 */

adminProfileRouter.delete(
  "/links/:linkId",
  deleteProfessionalLink
);

/*
|--------------------------------------------------------------------------
| PROFESSIONAL LINK VISIBILITY
|--------------------------------------------------------------------------
|
| PATCH /api/admin/profile/links/:linkId/visibility
|
*/

adminProfileRouter.patch(
  "/links/:linkId/visibility",
  updateProfessionalLinkVisibility
);

/*
|--------------------------------------------------------------------------
| PROFILE VISIBILITY
|--------------------------------------------------------------------------
|
| PATCH /api/admin/profile/visibility
|
*/

adminProfileRouter.patch(
  "/visibility",
  updateProfileVisibility
);

/*
|--------------------------------------------------------------------------
| PROFILE PHOTO
|--------------------------------------------------------------------------
|
| PATCH  /api/admin/profile/photo
| DELETE /api/admin/profile/photo
|
| Upload flow:
|
| Admin Authentication
|        ↓
| protectAdmin
|        ↓
| Multer Memory Storage
|        ↓
| Profile Photo Validation
|        ↓
| Controller
|        ↓
| Cloudinary
|        ↓
| MongoDB Metadata
|
| Frontend field name:
|
| profilePhoto
|
| Allowed:
| - JPG / JPEG
| - PNG
| - WEBP
|
| Maximum:
| - 10 MB
|
*/

/*
 * Upload / replace profile photo
 */

adminProfileRouter.patch(
  "/photo",
  uploadProfilePhoto,
  setProfilePhoto
);

/*
 * Remove profile photo
 */

adminProfileRouter.delete(
  "/photo",
  removeProfilePhoto
);

/*
|--------------------------------------------------------------------------
| RESUME
|--------------------------------------------------------------------------
|
| PATCH  /api/admin/profile/resume
| DELETE /api/admin/profile/resume
|
| Resume upload flow:
|
| Admin Authentication
|        ↓
| protectAdmin
|        ↓
| Multer Memory Storage
|        ↓
| PDF + 10 MB Validation
|        ↓
| Controller
|        ↓
| Cloudinary RAW / Authenticated
|        ↓
| MongoDB Metadata
|
| Frontend field name:
|
| resume
|
| Allowed:
| - PDF
|
| Maximum:
| - 10 MB
|
*/

/*
 * Upload / replace resume
 */

adminProfileRouter.patch(
  "/resume",
  uploadResume,
  uploadProfileResume
);

/*
 * Remove resume
 */

adminProfileRouter.delete(
  "/resume",
  removeResume
);

/*
|--------------------------------------------------------------------------
| RESUME VISIBILITY
|--------------------------------------------------------------------------
|
| PATCH /api/admin/profile/resume/visibility
|
*/

adminProfileRouter.patch(
  "/resume/visibility",
  updateResumeVisibility
);

/*
|--------------------------------------------------------------------------
| ADMIN RESUME DELIVERY
|--------------------------------------------------------------------------
|
| GET /api/admin/profile/resume
|
| Protected endpoint.
|
| Controller generates a signed Cloudinary
| URL and redirects the browser.
|
*/

adminProfileRouter.get(
  "/resume",
  getAdminResume
);

/*
|--------------------------------------------------------------------------
| PROFILE ACTIVE STATUS
|--------------------------------------------------------------------------
|
| PATCH /api/admin/profile/status
|
*/

adminProfileRouter.patch(
  "/status",
  setProfileActiveStatus
);

/*
|--------------------------------------------------------------------------
| EXPORT
|--------------------------------------------------------------------------
|
| Public and Admin routers are intentionally
| exported separately so server.js can mount
| them at different API prefixes.
|
*/

module.exports = {
  publicProfileRouter,
  adminProfileRouter,
};