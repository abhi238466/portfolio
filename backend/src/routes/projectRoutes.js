const express = require("express"); 
 
/* 
|--------------------------------------------------------------------------
| CONTROLLERS 
|--------------------------------------------------------------------------
*/ 
 
const { 
  getAllProjects, 
  getPublicProjectList, 
  getPublicProject, 
 
  getAdminProject, 
 
  createNewProject, 
  updateExistingProject, 
  removeProject, 
 
  addImageToProject, 
  removeImageFromProject, 
  makeProjectImagePrimary, 
  reorderImages, 
 
  changeProjectVisibility, 
  changeProjectFeatured, 
  changeProjectActiveStatus, 
  changeProjectDisplayOrder, 
} = require("../controllers/projectController"); 
 
/* 
|--------------------------------------------------------------------------
| AUTHENTICATION MIDDLEWARE 
|--------------------------------------------------------------------------
*/ 
 
const { 
  protectAdmin, 
} = require("../middleware/authMiddleware"); 

/* 
|--------------------------------------------------------------------------
| PROJECT UPLOAD MIDDLEWARE 
|--------------------------------------------------------------------------
*/ 
 
const { 
  uploadProjectImage, 
} = require("../middleware/projectUploadMiddleware"); 
 
/* 
|--------------------------------------------------------------------------
| PUBLIC PROJECT ROUTES 
|--------------------------------------------------------------------------
| 
| Base: 
| /api/projects 
| 
| These routes do NOT require admin authentication. 
| 
*/ 
 
/* 
| GET /api/projects 
| 
| Returns only: 
| - active projects 
| - publicly visible projects 
| 
*/ 
 
const publicProjectRouter = 
  express.Router(); 
 
publicProjectRouter.get( 
  "/", 
  getPublicProjectList 
); 
 
/* 
| GET /api/projects/:projectId 
| 
| Returns one public project. 
| 
*/ 
 
publicProjectRouter.get( 
  "/:projectId", 
  getPublicProject 
); 
 
/* 
|--------------------------------------------------------------------------
| ADMIN PROJECT ROUTES 
|--------------------------------------------------------------------------
| 
| Base: 
| /api/admin/projects 
| 
| Every route below is protected. 
| 
*/ 
 
const adminProjectRouter = 
  express.Router(); 
 
/* 
|--------------------------------------------------------------------------
| ADMIN PROTECTION 
|--------------------------------------------------------------------------
| 
| IMPORTANT: 
| No admin project endpoint can be accessed 
| without a valid admin authentication session. 
| 
*/ 
 
adminProjectRouter.use( 
  protectAdmin 
); 
 
/* 
|--------------------------------------------------------------------------
| PROJECT CRUD 
|--------------------------------------------------------------------------
*/ 
 
/* 
| GET /api/admin/projects 
| 
| Get all projects including hidden/inactive projects. 
| 
*/ 
 
adminProjectRouter.get( 
  "/", 
  getAllProjects 
); 
 
/* 
| POST /api/admin/projects 
| 
| Create a new project. 
| 
*/ 
 
adminProjectRouter.post( 
  "/", 
  createNewProject 
); 
 
/* 
| GET /api/admin/projects/:projectId 
| 
| Get one project for admin editing. 
| 
*/ 
 
adminProjectRouter.get( 
  "/:projectId", 
  getAdminProject 
); 
 
/* 
| PUT /api/admin/projects/:projectId 
| 
| Update complete project information. 
| 
*/ 
 
adminProjectRouter.put( 
  "/:projectId", 
  updateExistingProject 
); 
 
/* 
| DELETE /api/admin/projects/:projectId 
| 
| Delete complete project. 
| 
*/ 
 
adminProjectRouter.delete( 
  "/:projectId", 
  removeProject 
); 
 
/* 
|--------------------------------------------------------------------------
| PROJECT IMAGE MANAGEMENT 
|--------------------------------------------------------------------------
| 
| Actual Cloudinary upload middleware will be 
| connected in the next step. 
| 
*/ 
 
/* 
| PATCH /api/admin/projects/:projectId/images 
| 
| Add image metadata after Cloudinary upload. 
| 
*/ 
 
adminProjectRouter.patch( 
  "/:projectId/images", 
  uploadProjectImage,
  addImageToProject 
); 
 
/* 
| DELETE /api/admin/projects/:projectId/images/:imageId 
| 
| Delete one project image. 
| 
*/ 
 
adminProjectRouter.delete( 
  "/:projectId/images/:imageId", 
  removeImageFromProject 
); 
 
/* 
| PATCH /api/admin/projects/:projectId/images/:imageId/primary 
| 
| Set one image as primary. 
| 
*/ 
 
adminProjectRouter.patch( 
  "/:projectId/images/:imageId/primary", 
  makeProjectImagePrimary 
); 
 
/* 
| PUT /api/admin/projects/:projectId/images/order 
| 
| Reorder project images. 
| 
*/ 
 
adminProjectRouter.put( 
  "/:projectId/images/order", 
  reorderImages 
); 
 
/* 
|--------------------------------------------------------------------------
| PROJECT DISPLAY CONTROLS 
|--------------------------------------------------------------------------
*/ 
 
/* 
| PATCH /api/admin/projects/:projectId/visibility 
| 
| Public visibility ON/OFF. 
| 
*/ 
 
adminProjectRouter.patch( 
  "/:projectId/visibility", 
  changeProjectVisibility 
); 
 
/* 
| PATCH /api/admin/projects/:projectId/featured 
| 
| Featured project ON/OFF. 
| 
*/ 
 
adminProjectRouter.patch( 
  "/:projectId/featured", 
  changeProjectFeatured 
); 
 
/* 
| PATCH /api/admin/projects/:projectId/status 
| 
| Active/inactive project. 
| 
*/ 
 
adminProjectRouter.patch( 
  "/:projectId/status", 
  changeProjectActiveStatus 
); 
 
/* 
| PATCH /api/admin/projects/:projectId/order 
| 
| Change project display order. 
| 
*/ 
 
adminProjectRouter.patch( 
  "/:projectId/order", 
  changeProjectDisplayOrder 
); 
 
/* 
|--------------------------------------------------------------------------
| EXPORT ROUTERS 
|--------------------------------------------------------------------------
*/ 
 
module.exports = { 
  publicProjectRouter, 
  adminProjectRouter, 
}; 