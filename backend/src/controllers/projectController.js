const {
  getAdminProjects,
  getPublicProjects,
  getProjectById,
  getPublicProjectById,
  createProject,
  updateProject,
  deleteProject,
  addProjectImage,
  deleteProjectImage,
  setPrimaryProjectImage,
  reorderProjectImages,
  updateProjectVisibility,
  updateProjectFeatured,
  updateProjectActiveStatus,
  updateProjectDisplayOrder,
} = require("../services/projectService");

/*
|--------------------------------------------------------------------------
| CLOUDINARY SERVICE
|--------------------------------------------------------------------------
*/

const {
  uploadProjectImage,
  deleteProjectImage: deleteCloudinaryProjectImage,
} = require("../services/cloudinaryService");

/*
|--------------------------------------------------------------------------
| ERROR RESPONSE HELPER
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

  const statusCode =
    error?.statusCode || 500;

  return res.status(statusCode).json({
    success: false,
    message:
      error?.message ||
      fallbackMessage,
  });
};

/*
|--------------------------------------------------------------------------
| ADMIN - GET ALL PROJECTS
|--------------------------------------------------------------------------
|
| GET /api/admin/projects
|
| Protected route.
|
*/

const getAllProjects = async (
  req,
  res
) => {
  try {
    const projects =
      await getAdminProjects();

    return res.status(200).json({
      success: true,
      message:
        "Projects loaded successfully.",
      projects,
    });
  } catch (error) {
    return handleControllerError(
      res,
      error,
      "Unable to load projects."
    );
  }
};

/*
|--------------------------------------------------------------------------
| PUBLIC - GET ALL PROJECTS
|--------------------------------------------------------------------------
|
| GET /api/projects
|
| Only active + publicly visible projects
| are returned by the service.
|
*/

const getPublicProjectList =
  async (req, res) => {
    try {
      const projects =
        await getPublicProjects();

      return res.status(200).json({
        success: true,
        message:
          "Public projects loaded successfully.",
        projects,
      });
    } catch (error) {
      return handleControllerError(
        res,
        error,
        "Unable to load public projects."
      );
    }
  };

/*
|--------------------------------------------------------------------------
| PUBLIC - GET SINGLE PROJECT
|--------------------------------------------------------------------------
|
| GET /api/projects/:projectId
|
*/

const getPublicProject =
  async (req, res) => {
    try {
      const project =
        await getPublicProjectById(
          req.params.projectId
        );

      return res.status(200).json({
        success: true,
        message:
          "Project loaded successfully.",
        project,
      });
    } catch (error) {
      return handleControllerError(
        res,
        error,
        "Unable to load project."
      );
    }
  };

/*
|--------------------------------------------------------------------------
| ADMIN - GET SINGLE PROJECT
|--------------------------------------------------------------------------
|
| GET /api/admin/projects/:projectId
|
*/

const getAdminProject =
  async (req, res) => {
    try {
      const project =
        await getProjectById(
          req.params.projectId
        );

      return res.status(200).json({
        success: true,
        message:
          "Project loaded successfully.",
        project,
      });
    } catch (error) {
      return handleControllerError(
        res,
        error,
        "Unable to load project."
      );
    }
  };

/*
|--------------------------------------------------------------------------
| ADMIN - CREATE PROJECT
|--------------------------------------------------------------------------
|
| POST /api/admin/projects
|
*/

const createNewProject =
  async (req, res) => {
    try {
      const project =
        await createProject(
          req.body
        );

      return res.status(201).json({
        success: true,
        message:
          "Project created successfully. 🎉",
        project,
      });
    } catch (error) {
      return handleControllerError(
        res,
        error,
        "Unable to create project."
      );
    }
  };

/*
|--------------------------------------------------------------------------
| ADMIN - UPDATE PROJECT
|--------------------------------------------------------------------------
|
| PUT /api/admin/projects/:projectId
|
*/

const updateExistingProject =
  async (req, res) => {
    try {
      const project =
        await updateProject(
          req.params.projectId,
          req.body
        );

      return res.status(200).json({
        success: true,
        message:
          "Project updated successfully. ✨",
        project,
      });
    } catch (error) {
      return handleControllerError(
        res,
        error,
        "Unable to update project."
      );
    }
  };

/*
|--------------------------------------------------------------------------
| ADMIN - DELETE PROJECT
|--------------------------------------------------------------------------
|
| DELETE /api/admin/projects/:projectId
|--------------------------------------------------------------------------
|
| Service returns the deleted project data.
| Controller can later use its image metadata
| to remove Cloudinary assets safely.
|
*/

const removeProject =
  async (req, res) => {
    try {
      const deletedProject =
        await deleteProject(
          req.params.projectId
        );

      /*
      |--------------------------------------------------------------------------
      | DELETE PROJECT IMAGES FROM CLOUDINARY
      |--------------------------------------------------------------------------
      |
      | The project document has already been removed
      | from MongoDB by the service. Use the deleted
      | project's stored image metadata to remove every
      | associated Cloudinary asset as well.
      |
      */

      if (
        Array.isArray(
          deletedProject?.images
        ) &&
        deletedProject.images.length > 0
      ) {
        for (
          const image
          of deletedProject.images
        ) {
          if (
            image?.publicId
          ) {
            try {
              await deleteCloudinaryProjectImage(
                image.publicId
              );
            } catch (
              cloudinaryError
            ) {
              console.error(
                `Unable to delete project image ${image.publicId} from Cloudinary.`,
                cloudinaryError
              );
            }
          }
        }
      }

      return res.status(200).json({
        success: true,
        message:
          "Project deleted successfully. 🗑️",
        project:
          deletedProject,
      });
    } catch (error) {
      return handleControllerError(
        res,
        error,
        "Unable to delete project."
      );
    }
  };

/*
|--------------------------------------------------------------------------
| ADMIN - ADD PROJECT IMAGE
|--------------------------------------------------------------------------
|
| PATCH /api/admin/projects/:projectId/images
|
| IMPORTANT:
| The route uses projectUploadMiddleware
| before reaching this controller.
|
| The uploaded file is available in:
|
| req.file
|
| Flow:
|
| req.file
|   ↓
| Cloudinary
|   ↓
| Project image metadata
|   ↓
| MongoDB Project.images[]
|
*/

const addImageToProject =
  async (req, res) => {
    let uploadedImage = null;

    try {
      if (!req.file) {
        const error =
          new Error(
            "Project image file is required."
          );

        error.statusCode = 400;

        throw error;
      }

      /*
      |--------------------------------------------------------------------------
      | UPLOAD IMAGE TO CLOUDINARY
      |--------------------------------------------------------------------------
      */

      uploadedImage =
        await uploadProjectImage(
          req.file
        );

      /*
      |--------------------------------------------------------------------------
      | PREPARE IMAGE METADATA
      |--------------------------------------------------------------------------
      |
      | Only the fields required by the
      | Project image schema are stored.
      |
      */

      const imageMetadata = {
        publicId:
          uploadedImage.publicId,

        url:
          uploadedImage.url,

        originalName:
          uploadedImage.originalName,

        mimeType:
          uploadedImage.mimeType,

        size:
          uploadedImage.size,

        /*
        |--------------------------------------------------------------------------
        | ORIGINAL IMAGE DIMENSIONS
        |--------------------------------------------------------------------------
        |
        | Cloudinary provides the original
        | image width and height.
        |
        | These are required by the Project
        | image schema and are used to preserve
        | the original aspect ratio on frontend.
        |
        */

        width:
          uploadedImage.width,

        height:
          uploadedImage.height,

        isPrimary:
          req.body.isPrimary === true ||
          req.body.isPrimary === "true",

        displayOrder:
          Number.isFinite(
            Number(
              req.body.displayOrder
            )
          )
            ? Number(
                req.body.displayOrder
              )
            : 0,
      };

      /*
      |--------------------------------------------------------------------------
      | SAVE IMAGE METADATA TO MONGODB
      |--------------------------------------------------------------------------
      */

      const project =
        await addProjectImage(
          req.params.projectId,
          imageMetadata
        );

      return res.status(201).json({
        success: true,
        message:
          "Project image uploaded successfully. 📸",
        project,
      });
    } catch (error) {
      /*
      |--------------------------------------------------------------------------
      | CLEANUP CLOUDINARY ASSET
      |--------------------------------------------------------------------------
      |
      | If Cloudinary upload succeeds but
      | MongoDB save fails, remove the uploaded
      | asset so orphan files are not left behind.
      |
      */

      if (
        uploadedImage?.publicId
      ) {
        try {
          await deleteCloudinaryProjectImage(
            uploadedImage.publicId
          );
        } catch (
          cleanupError
        ) {
          console.error(
            "Unable to cleanup uploaded project image from Cloudinary.",
            cleanupError
          );
        }
      }

      return handleControllerError(
        res,
        error,
        "Unable to add project image."
      );
    }
  };

/*
|--------------------------------------------------------------------------
| ADMIN - DELETE PROJECT IMAGE
|--------------------------------------------------------------------------
|
| DELETE /api/admin/projects/:projectId/images/:imageId
|
*/

const removeImageFromProject =
  async (req, res) => {
    try {
      const result =
        await deleteProjectImage(
          req.params.projectId,
          req.params.imageId
        );

      /*
      |--------------------------------------------------------------------------
      | DELETE CLOUDINARY ASSET
      |--------------------------------------------------------------------------
      */

      if (
        result?.deletedImage?.publicId
      ) {
        try {
          await deleteCloudinaryProjectImage(
            result.deletedImage.publicId
          );
        } catch (
          cloudinaryError
        ) {
          console.error(
            "Project image was removed from MongoDB, but Cloudinary deletion failed.",
            cloudinaryError
          );
        }
      }

      return res.status(200).json({
        success: true,
        message:
          "Project image deleted successfully. 🗑️",
        project:
          result.project,
        deletedImage:
          result.deletedImage,
      });
    } catch (error) {
      return handleControllerError(
        res,
        error,
        "Unable to delete project image."
      );
    }
  };

/*
|--------------------------------------------------------------------------
| ADMIN - SET PRIMARY IMAGE
|--------------------------------------------------------------------------
|
| PATCH /api/admin/projects/:projectId/images/:imageId/primary
|
*/

const makeProjectImagePrimary =
  async (req, res) => {
    try {
      const project =
        await setPrimaryProjectImage(
          req.params.projectId,
          req.params.imageId
        );

      return res.status(200).json({
        success: true,
        message:
          "Primary project image updated successfully. ⭐",
        project,
      });
    } catch (error) {
      return handleControllerError(
        res,
        error,
        "Unable to set primary project image."
      );
    }
  };

/*
|--------------------------------------------------------------------------
| ADMIN - REORDER PROJECT IMAGES
|--------------------------------------------------------------------------
|
| PUT /api/admin/projects/:projectId/images/order
|
| Expected req.body:
|
| {
|   orderedImageIds: [
|     "imageId1",
|     "imageId2",
|     "imageId3"
|   ]
| }
|
*/

const reorderImages =
  async (req, res) => {
    try {
      const {
        orderedImageIds,
      } = req.body;

      const project =
        await reorderProjectImages(
          req.params.projectId,
          orderedImageIds
        );

      return res.status(200).json({
        success: true,
        message:
          "Project image order updated successfully. 🔃",
        project,
      });
    } catch (error) {
      return handleControllerError(
        res,
        error,
        "Unable to reorder project images."
      );
    }
  };

/*
|--------------------------------------------------------------------------
| ADMIN - UPDATE VISIBILITY
|--------------------------------------------------------------------------
|
| PATCH /api/admin/projects/:projectId/visibility
|
| Expected:
|
| {
|   isVisible: true
| }
|
*/

const changeProjectVisibility =
  async (req, res) => {
    try {
      const project =
        await updateProjectVisibility(
          req.params.projectId,
          req.body.isVisible
        );

      return res.status(200).json({
        success: true,
        message:
          project.isVisible
            ? "Project is now visible on the public portfolio. 👁️"
            : "Project is now hidden from the public portfolio. 🙈",
        project,
      });
    } catch (error) {
      return handleControllerError(
        res,
        error,
        "Unable to update project visibility."
      );
    }
  };

/*
|--------------------------------------------------------------------------
| ADMIN - UPDATE FEATURED STATUS
|--------------------------------------------------------------------------
|
| PATCH /api/admin/projects/:projectId/featured
|
| Expected:
|
| {
|   isFeatured: true
| }
|
*/

const changeProjectFeatured =
  async (req, res) => {
    try {
      const project =
        await updateProjectFeatured(
          req.params.projectId,
          req.body.isFeatured
        );

      return res.status(200).json({
        success: true,
        message:
          project.isFeatured
            ? "Project marked as featured. ⭐"
            : "Project removed from featured projects.",
        project,
      });
    } catch (error) {
      return handleControllerError(
        res,
        error,
        "Unable to update featured status."
      );
    }
  };

/*
|--------------------------------------------------------------------------
| ADMIN - UPDATE ACTIVE STATUS
|--------------------------------------------------------------------------
|
| PATCH /api/admin/projects/:projectId/status
|
| Expected:
|
| {
|   isActive: true
| }
|
*/

const changeProjectActiveStatus =
  async (req, res) => {
    try {
      const project =
        await updateProjectActiveStatus(
          req.params.projectId,
          req.body.isActive
        );

      return res.status(200).json({
        success: true,
        message:
          project.isActive
            ? "Project activated successfully. 🟢"
            : "Project deactivated successfully. ⚪",
        project,
      });
    } catch (error) {
      return handleControllerError(
        res,
        error,
        "Unable to update project active status."
      );
    }
  };

/*
|--------------------------------------------------------------------------
| ADMIN - UPDATE DISPLAY ORDER
|--------------------------------------------------------------------------
|
| PATCH /api/admin/projects/:projectId/order
|--------------------------------------------------------------------------
|
| Expected:
|
| {
|   displayOrder: 2
| }
|
*/

const changeProjectDisplayOrder =
  async (req, res) => {
    try {
      const project =
        await updateProjectDisplayOrder(
          req.params.projectId,
          req.body.displayOrder
        );

      return res.status(200).json({
        success: true,
        message:
          "Project display order updated successfully. 🔃",
        project,
      });
    } catch (error) {
      return handleControllerError(
        res,
        error,
        "Unable to update project display order."
      );
    }
  };

/*
|--------------------------------------------------------------------------
| EXPORTS
|--------------------------------------------------------------------------
*/

module.exports = {
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
};