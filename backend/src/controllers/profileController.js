const profileService = require("../services/profileService");

const {
  uploadProfilePhoto,
  uploadResume,
  generateSignedResumeUrl,
  deleteProfilePhoto,
  deleteResume,
} = require("../services/cloudinaryService");

/*
|--------------------------------------------------------------------------
| ADMIN PROFILE CONTROLLER
|--------------------------------------------------------------------------
|
| Responsibilities:
| - Handle HTTP requests/responses
| - Validate request body/file presence
| - Call profile service
| - Handle Cloudinary file operations
| - Return consistent JSON responses
|
| Authentication/authorization is handled by:
| protectAdmin middleware
|
| Business logic/database operations are handled by:
| profileService
|
| Cloudinary file operations are handled by:
| cloudinaryService
|
*/

/*
|--------------------------------------------------------------------------
| GET ADMIN PROFILE
|--------------------------------------------------------------------------
|
| GET /api/admin/profile
|
*/

const getAdminProfile = async (
  req,
  res
) => {
  try {
    const profile =
      await profileService.getAdminProfile();

    if (!profile) {
      return res.status(200).json({
        success: true,
        message:
          "🔔 Profile has not been created yet.",
        profile: null,
        code: "PROFILE_NOT_FOUND",
      });
    }

    return res.status(200).json({
      success: true,
      message:
        "👤 Profile loaded successfully.",
      profile,
    });
  } catch (error) {
    console.error(
      "Get admin profile error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "❌ Failed to load profile.",
      code: "PROFILE_FETCH_FAILED",
    });
  }
};

/*
|--------------------------------------------------------------------------
| GET PUBLIC PROFILE
|--------------------------------------------------------------------------
|
| GET /api/profile
|
*/

const getPublicProfile = async (
  req,
  res
) => {
  try {
    const profile =
      await profileService.getProfile();

    if (!profile) {
      return res.status(200).json({
        success: true,
        message:
          "🔔 Public profile is not available yet.",
        profile: null,
      });
    }

    const publicProfile =
      profileService.sanitizeProfileForPublic(
        profile
      );

    if (!publicProfile) {
      return res.status(200).json({
        success: true,
        message:
          "🔔 Public profile is currently unavailable.",
        profile: null,
      });
    }

    return res.status(200).json({
      success: true,
      message:
        "👤 Public profile loaded successfully.",
      profile: publicProfile,
    });
  } catch (error) {
    console.error(
      "Get public profile error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "❌ Failed to load public profile.",
      code:
        "PUBLIC_PROFILE_FETCH_FAILED",
    });
  }
};

/*
|--------------------------------------------------------------------------
| CREATE PROFILE
|--------------------------------------------------------------------------
|
| POST /api/admin/profile
|
*/

const createProfile = async (
  req,
  res
) => {
  try {
    if (
      !req.body ||
      typeof req.body !== "object"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "⚠️ Profile data is required.",
        code:
          "PROFILE_DATA_REQUIRED",
      });
    }

    const profile =
      await profileService.createProfile(
        req.body
      );

    return res.status(201).json({
      success: true,
      message:
        "🎉 Profile created successfully.",
      profile,
    });
  } catch (error) {
    console.error(
      "Create profile error:",
      error
    );

    if (
      error.code ===
      "PROFILE_ALREADY_EXISTS"
    ) {
      return res.status(409).json({
        success: false,
        message:
          "⚠️ A profile already exists. Please update the existing profile.",
        code:
          "PROFILE_ALREADY_EXISTS",
      });
    }

    if (
      error.message &&
      !error.code
    ) {
      return res.status(400).json({
        success: false,
        message:
          `⚠️ ${error.message}`,
        code:
          "PROFILE_VALIDATION_ERROR",
      });
    }

    return res.status(500).json({
      success: false,
      message:
        "❌ Failed to create profile.",
      code:
        "PROFILE_CREATE_FAILED",
    });
  }
};

/*
|--------------------------------------------------------------------------
| UPDATE PROFILE
|--------------------------------------------------------------------------
|
| PUT /api/admin/profile
|
*/

const updateProfile = async (
  req,
  res
) => {
  try {
    if (
      !req.body ||
      typeof req.body !== "object"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "⚠️ Profile update data is required.",
        code:
          "PROFILE_DATA_REQUIRED",
      });
    }

    const profile =
      await profileService.updateProfile(
        req.body
      );

    return res.status(200).json({
      success: true,
      message:
        "🎉 Profile updated successfully.",
      profile,
    });
  } catch (error) {
    console.error(
      "Update profile error:",
      error
    );

    if (
      error.code ===
      "PROFILE_NOT_FOUND"
    ) {
      return res.status(404).json({
        success: false,
        message:
          "⚠️ Profile does not exist yet. Please create the profile first.",
        code:
          "PROFILE_NOT_FOUND",
      });
    }

    if (
      error.message &&
      !error.code
    ) {
      return res.status(400).json({
        success: false,
        message:
          `⚠️ ${error.message}`,
        code:
          "PROFILE_VALIDATION_ERROR",
      });
    }

    return res.status(500).json({
      success: false,
      message:
        "❌ Failed to update profile.",
      code:
        "PROFILE_UPDATE_FAILED",
    });
  }
};

/*
|--------------------------------------------------------------------------
| UPDATE ALL PROFESSIONAL LINKS
|--------------------------------------------------------------------------
|
| PUT /api/admin/profile/links
|
*/

const updateProfileLinks = async (
  req,
  res
) => {
  try {
    if (
      !req.body ||
      !Array.isArray(req.body.links)
    ) {
      return res.status(400).json({
        success: false,
        message:
          "⚠️ Links must be provided as an array.",
        code:
          "PROFILE_LINKS_REQUIRED",
      });
    }

    const profile =
      await profileService.updateProfileLinks(
        req.body.links
      );

    return res.status(200).json({
      success: true,
      message:
        "🔗 Professional links updated successfully.",
      profile,
    });
  } catch (error) {
    console.error(
      "Update profile links error:",
      error
    );

    if (
      error.code ===
      "PROFILE_NOT_FOUND"
    ) {
      return res.status(404).json({
        success: false,
        message:
          "⚠️ Profile does not exist.",
        code:
          "PROFILE_NOT_FOUND",
      });
    }

    return res.status(400).json({
      success: false,
      message:
        error.message ||
        "⚠️ Failed to update professional links.",
      code:
        "PROFILE_LINKS_UPDATE_FAILED",
    });
  }
};

/*
|--------------------------------------------------------------------------
| ADD PROFESSIONAL LINK
|--------------------------------------------------------------------------
|
| POST /api/admin/profile/links
|
*/

const addProfessionalLink =
  async (req, res) => {
    try {
      if (
        !req.body ||
        typeof req.body !== "object"
      ) {
        return res.status(400).json({
          success: false,
          message:
            "⚠️ Professional link data is required.",
          code:
            "PROFILE_LINK_DATA_REQUIRED",
        });
      }

      const profile =
        await profileService.addProfessionalLink(
          req.body
        );

      return res.status(201).json({
        success: true,
        message:
          "🔗 Professional link added successfully.",
        profile,
      });
    } catch (error) {
      console.error(
        "Add professional link error:",
        error
      );

      if (
        error.code ===
        "PROFILE_NOT_FOUND"
      ) {
        return res.status(404).json({
          success: false,
          message:
            "⚠️ Profile does not exist.",
          code:
            "PROFILE_NOT_FOUND",
        });
      }

      return res.status(400).json({
        success: false,
        message:
          error.message ||
          "⚠️ Failed to add professional link.",
        code:
          "PROFILE_LINK_ADD_FAILED",
      });
    }
  };

/*
|--------------------------------------------------------------------------
| UPDATE PROFESSIONAL LINK
|--------------------------------------------------------------------------
|
| PUT /api/admin/profile/links/:linkId
|
*/

const updateProfessionalLink =
  async (req, res) => {
    try {
      const {
        linkId,
      } = req.params;

      if (!linkId) {
        return res.status(400).json({
          success: false,
          message:
            "⚠️ Professional link ID is required.",
          code:
            "PROFILE_LINK_ID_REQUIRED",
        });
      }

      if (
        !req.body ||
        typeof req.body !== "object"
      ) {
        return res.status(400).json({
          success: false,
          message:
            "⚠️ Professional link data is required.",
          code:
            "PROFILE_LINK_DATA_REQUIRED",
        });
      }

      const profile =
        await profileService.updateProfessionalLink(
          linkId,
          req.body
        );

      return res.status(200).json({
        success: true,
        message:
          "🔗 Professional link updated successfully.",
        profile,
      });
    } catch (error) {
      console.error(
        "Update professional link error:",
        error
      );

      if (
        error.code ===
        "PROFILE_NOT_FOUND"
      ) {
        return res.status(404).json({
          success: false,
          message:
            "⚠️ Profile does not exist.",
          code:
            "PROFILE_NOT_FOUND",
        });
      }

      if (
        error.code ===
        "PROFILE_LINK_NOT_FOUND"
      ) {
        return res.status(404).json({
          success: false,
          message:
            "⚠️ Professional link was not found.",
          code:
            "PROFILE_LINK_NOT_FOUND",
        });
      }

      return res.status(400).json({
        success: false,
        message:
          error.message ||
          "⚠️ Failed to update professional link.",
        code:
          "PROFILE_LINK_UPDATE_FAILED",
      });
    }
  };

/*
|--------------------------------------------------------------------------
| DELETE PROFESSIONAL LINK
|--------------------------------------------------------------------------
|
| DELETE /api/admin/profile/links/:linkId
|
*/

const deleteProfessionalLink =
  async (req, res) => {
    try {
      const {
        linkId,
      } = req.params;

      if (!linkId) {
        return res.status(400).json({
          success: false,
          message:
            "⚠️ Professional link ID is required.",
          code:
            "PROFILE_LINK_ID_REQUIRED",
        });
      }

      const profile =
        await profileService.deleteProfessionalLink(
          linkId
        );

      return res.status(200).json({
        success: true,
        message:
          "🗑️ Professional link deleted successfully.",
        profile,
      });
    } catch (error) {
      console.error(
        "Delete professional link error:",
        error
      );

      if (
        error.code ===
        "PROFILE_NOT_FOUND"
      ) {
        return res.status(404).json({
          success: false,
          message:
            "⚠️ Profile does not exist.",
          code:
            "PROFILE_NOT_FOUND",
        });
      }

      if (
        error.code ===
        "PROFILE_LINK_NOT_FOUND"
      ) {
        return res.status(404).json({
          success: false,
          message:
            "⚠️ Professional link was not found.",
          code:
            "PROFILE_LINK_NOT_FOUND",
        });
      }

      return res.status(500).json({
        success: false,
        message:
          "❌ Failed to delete professional link.",
        code:
          "PROFILE_LINK_DELETE_FAILED",
      });
    }
  };

/*
|--------------------------------------------------------------------------
| UPDATE PROFESSIONAL LINK VISIBILITY
|--------------------------------------------------------------------------
|
| PATCH /api/admin/profile/links/:linkId/visibility
|
*/

const updateProfessionalLinkVisibility =
  async (req, res) => {
    try {
      const {
        linkId,
      } = req.params;

      if (!linkId) {
        return res.status(400).json({
          success: false,
          message:
            "⚠️ Professional link ID is required.",
          code:
            "PROFILE_LINK_ID_REQUIRED",
        });
      }

      if (
        typeof req.body?.visible !==
        "boolean"
      ) {
        return res.status(400).json({
          success: false,
          message:
            "⚠️ Link visibility must be true or false.",
          code:
            "PROFILE_LINK_VISIBILITY_REQUIRED",
        });
      }

      const profile =
        await profileService.updateProfessionalLinkVisibility(
          linkId,
          req.body.visible
        );

      return res.status(200).json({
        success: true,
        message:
          req.body.visible
            ? "👁️ Professional link is now publicly visible."
            : "🔒 Professional link is now hidden from the public portfolio.",
        profile,
      });
    } catch (error) {
      console.error(
        "Update professional link visibility error:",
        error
      );

      if (
        error.code ===
        "PROFILE_NOT_FOUND"
      ) {
        return res.status(404).json({
          success: false,
          message:
            "⚠️ Profile does not exist.",
          code:
            "PROFILE_NOT_FOUND",
        });
      }

      if (
        error.code ===
        "PROFILE_LINK_NOT_FOUND"
      ) {
        return res.status(404).json({
          success: false,
          message:
            "⚠️ Professional link was not found.",
          code:
            "PROFILE_LINK_NOT_FOUND",
        });
      }

      return res.status(400).json({
        success: false,
        message:
          error.message ||
          "⚠️ Failed to update link visibility.",
        code:
          "PROFILE_LINK_VISIBILITY_UPDATE_FAILED",
      });
    }
  };

/*
|--------------------------------------------------------------------------
| UPDATE PROFILE VISIBILITY
|--------------------------------------------------------------------------
|
| PATCH /api/admin/profile/visibility
|
*/

const updateProfileVisibility =
  async (req, res) => {
    try {
      if (
        !req.body ||
        typeof req.body !== "object"
      ) {
        return res.status(400).json({
          success: false,
          message:
            "⚠️ Visibility settings are required.",
          code:
            "PROFILE_VISIBILITY_REQUIRED",
        });
      }

      const profile =
        await profileService.updateProfileVisibility(
          req.body
        );

      return res.status(200).json({
        success: true,
        message:
          "👁️ Profile visibility settings updated successfully.",
        profile,
      });
    } catch (error) {
      console.error(
        "Update profile visibility error:",
        error
      );

      if (
        error.code ===
        "PROFILE_NOT_FOUND"
      ) {
        return res.status(404).json({
          success: false,
          message:
            "⚠️ Profile does not exist.",
          code:
            "PROFILE_NOT_FOUND",
        });
      }

      return res.status(400).json({
        success: false,
        message:
          error.message ||
          "⚠️ Failed to update profile visibility.",
        code:
          "PROFILE_VISIBILITY_UPDATE_FAILED",
      });
    }
  };

/*
|--------------------------------------------------------------------------
| SET PROFILE PHOTO
|--------------------------------------------------------------------------
|
| PATCH /api/admin/profile/photo
|
| Request:
| Content-Type: multipart/form-data
| Field:
| profilePhoto
|
*/

const setProfilePhoto =
  async (req, res) => {
    let uploadedPhoto = null;

    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message:
            "⚠️ Please select a profile photo.",
          code:
            "PROFILE_PHOTO_FILE_REQUIRED",
        });
      }

      const existingProfile =
        await profileService.getAdminProfile();

      if (!existingProfile) {
        return res.status(404).json({
          success: false,
          message:
            "⚠️ Profile does not exist. Please create the profile first.",
          code:
            "PROFILE_NOT_FOUND",
        });
      }

      uploadedPhoto =
        await uploadProfilePhoto(
          req.file
        );

      const photoData = {
        url:
          uploadedPhoto.url,

        publicId:
          uploadedPhoto.publicId,

        originalName:
          uploadedPhoto.originalName,

        mimeType:
          uploadedPhoto.mimeType,

        size:
          uploadedPhoto.size,

        visible:
          existingProfile
            .profilePhoto
            ?.visible !== false,
      };

      const profile =
        await profileService.setProfilePhoto(
          photoData
        );

      if (
        existingProfile.profilePhoto
          ?.publicId
      ) {
        try {
          await deleteProfilePhoto(
            existingProfile.profilePhoto
              .publicId
          );
        } catch (deleteError) {
          console.error(
            "Old Cloudinary profile photo deletion error:",
            deleteError
          );
        }
      }

      return res.status(200).json({
        success: true,
        message:
          "🖼️ Profile photo uploaded and updated successfully.",
        profile,
      });
    } catch (error) {
      console.error(
        "Set profile photo error:",
        error
      );

      if (
        uploadedPhoto?.publicId
      ) {
        try {
          await deleteProfilePhoto(
            uploadedPhoto.publicId
          );
        } catch (cleanupError) {
          console.error(
            "New Cloudinary photo cleanup error:",
            cleanupError
          );
        }
      }

      if (
        error.code ===
        "PROFILE_NOT_FOUND"
      ) {
        return res.status(404).json({
          success: false,
          message:
            "⚠️ Profile does not exist.",
          code:
            "PROFILE_NOT_FOUND",
        });
      }

      return res.status(500).json({
        success: false,
        message:
          error.message ||
          "❌ Failed to upload profile photo. Please try again.",
        code:
          "PROFILE_PHOTO_UPLOAD_FAILED",
      });
    }
  };

/*
|--------------------------------------------------------------------------
| REMOVE PROFILE PHOTO
|--------------------------------------------------------------------------
|
| DELETE /api/admin/profile/photo
|
*/

const removeProfilePhoto =
  async (req, res) => {
    try {
      const existingProfile =
        await profileService.getAdminProfile();

      if (!existingProfile) {
        return res.status(404).json({
          success: false,
          message:
            "⚠️ Profile does not exist.",
          code:
            "PROFILE_NOT_FOUND",
        });
      }

      const oldPublicId =
        existingProfile.profilePhoto
          ?.publicId;

      const profile =
        await profileService.removeProfilePhoto();

      if (oldPublicId) {
        try {
          await deleteProfilePhoto(
            oldPublicId
          );
        } catch (deleteError) {
          console.error(
            "Cloudinary profile photo deletion error:",
            deleteError
          );

          return res.status(200).json({
            success: true,
            message:
              "🗑️ Profile photo removed from the portfolio. Cloud storage cleanup is pending.",
            profile,
            code:
              "PROFILE_PHOTO_CLOUDINARY_CLEANUP_PENDING",
          });
        }
      }

      return res.status(200).json({
        success: true,
        message:
          "🗑️ Profile photo removed successfully.",
        profile,
      });
    } catch (error) {
      console.error(
        "Remove profile photo error:",
        error
      );

      if (
        error.code ===
        "PROFILE_NOT_FOUND"
      ) {
        return res.status(404).json({
          success: false,
          message:
            "⚠️ Profile does not exist.",
          code:
            "PROFILE_NOT_FOUND",
        });
      }

      return res.status(500).json({
        success: false,
        message:
          "❌ Failed to remove profile photo.",
        code:
          "PROFILE_PHOTO_DELETE_FAILED",
      });
    }
  };

/*
|--------------------------------------------------------------------------
| UPLOAD / REPLACE RESUME
|--------------------------------------------------------------------------
|
| PATCH /api/admin/profile/resume
|
| Request:
| Content-Type: multipart/form-data
| Field:
| resume
|
*/

const uploadProfileResume =
  async (req, res) => {
    let uploadedResume = null;

    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message:
            "⚠️ Please select a PDF resume.",
          code:
            "PROFILE_RESUME_FILE_REQUIRED",
        });
      }

      const existingProfile =
        await profileService.getAdminProfile();

      if (!existingProfile) {
        return res.status(404).json({
          success: false,
          message:
            "⚠️ Profile does not exist. Please create the profile first.",
          code:
            "PROFILE_NOT_FOUND",
        });
      }

      uploadedResume =
        await uploadResume(
          req.file
        );

      /*
       * Store the signed URL in MongoDB.
       *
       * The public profile sanitizer does not
       * expose this URL.
       */

      const resumeData = {
        url:
          uploadedResume.url,

        publicId:
          uploadedResume.publicId,

        originalName:
          uploadedResume.originalName,

        mimeType:
          uploadedResume.mimeType,

        size:
          uploadedResume.size,

        visible:
          existingProfile.resume
            ?.visible !== false,
      };

      const profile =
        await profileService.setResume(
          resumeData
        );

      /*
       * Delete previous resume only after
       * MongoDB successfully stores the new one.
       */

      if (
        existingProfile.resume
          ?.publicId
      ) {
        try {
          await deleteResume(
            existingProfile.resume
              .publicId
          );
        } catch (deleteError) {
          console.error(
            "Old Cloudinary resume deletion error:",
            deleteError
          );
        }
      }

      return res.status(200).json({
        success: true,
        message:
          "📄 Resume uploaded and updated successfully.",
        profile,
      });
    } catch (error) {
      console.error(
        "Upload profile resume error:",
        error
      );

      /*
       * If new resume was uploaded but
       * database update failed, remove it.
       */

      if (
        uploadedResume?.publicId
      ) {
        try {
          await deleteResume(
            uploadedResume.publicId
          );
        } catch (cleanupError) {
          console.error(
            "New Cloudinary resume cleanup error:",
            cleanupError
          );
        }
      }

      if (
        error.code ===
        "PROFILE_NOT_FOUND"
      ) {
        return res.status(404).json({
          success: false,
          message:
            "⚠️ Profile does not exist.",
          code:
            "PROFILE_NOT_FOUND",
        });
      }

      return res.status(400).json({
        success: false,
        message:
          error.message ||
          "❌ Failed to upload resume.",
        code:
          "PROFILE_RESUME_UPLOAD_FAILED",
      });
    }
  };

/*
|--------------------------------------------------------------------------
| REMOVE RESUME
|--------------------------------------------------------------------------
|
| DELETE /api/admin/profile/resume
|
*/

const removeResume =
  async (req, res) => {
    try {
      const existingProfile =
        await profileService.getAdminProfile();

      if (!existingProfile) {
        return res.status(404).json({
          success: false,
          message:
            "⚠️ Profile does not exist.",
          code:
            "PROFILE_NOT_FOUND",
        });
      }

      const oldPublicId =
        existingProfile.resume
          ?.publicId;

      const profile =
        await profileService.removeResume();

      if (oldPublicId) {
        try {
          await deleteResume(
            oldPublicId
          );
        } catch (deleteError) {
          console.error(
            "Cloudinary resume deletion error:",
            deleteError
          );

          return res.status(200).json({
            success: true,
            message:
              "🗑️ Resume removed from the portfolio. Cloud storage cleanup is pending.",
            profile,
            code:
              "PROFILE_RESUME_CLOUDINARY_CLEANUP_PENDING",
          });
        }
      }

      return res.status(200).json({
        success: true,
        message:
          "🗑️ Resume removed successfully.",
        profile,
      });
    } catch (error) {
      console.error(
        "Remove resume error:",
        error
      );

      if (
        error.code ===
        "PROFILE_NOT_FOUND"
      ) {
        return res.status(404).json({
          success: false,
          message:
            "⚠️ Profile does not exist.",
          code:
            "PROFILE_NOT_FOUND",
        });
      }

      return res.status(500).json({
        success: false,
        message:
          "❌ Failed to remove resume.",
        code:
          "PROFILE_RESUME_DELETE_FAILED",
      });
    }
  };

/*
|--------------------------------------------------------------------------
| UPDATE RESUME VISIBILITY
|--------------------------------------------------------------------------
|
| PATCH /api/admin/profile/resume/visibility
|
*/

const updateResumeVisibility =
  async (req, res) => {
    try {
      if (
        typeof req.body?.visible !==
        "boolean"
      ) {
        return res.status(400).json({
          success: false,
          message:
            "⚠️ Resume visibility must be true or false.",
          code:
            "PROFILE_RESUME_VISIBILITY_REQUIRED",
        });
      }

      const existingProfile =
        await profileService.getAdminProfile();

      if (!existingProfile) {
        return res.status(404).json({
          success: false,
          message:
            "⚠️ Profile does not exist.",
          code:
            "PROFILE_NOT_FOUND",
        });
      }

      if (
        !existingProfile.resume
      ) {
        return res.status(404).json({
          success: false,
          message:
            "⚠️ No resume is currently uploaded.",
          code:
            "PROFILE_RESUME_NOT_FOUND",
        });
      }

      /*
       * Preserve all existing resume metadata
       * and only change visibility.
       */

      const updatedResume = {
        ...existingProfile.resume,

        visible:
          req.body.visible,
      };

      const profile =
        await profileService.updateProfile(
          {
            resume:
              updatedResume,
          }
        );

      return res.status(200).json({
        success: true,
        message:
          req.body.visible
            ? "👁️ Resume is now publicly visible."
            : "🔒 Resume is now hidden from the public portfolio.",
        profile,
      });
    } catch (error) {
      console.error(
        "Update resume visibility error:",
        error
      );

      if (
        error.code ===
        "PROFILE_NOT_FOUND"
      ) {
        return res.status(404).json({
          success: false,
          message:
            "⚠️ Profile does not exist.",
          code:
            "PROFILE_NOT_FOUND",
        });
      }

      return res.status(400).json({
        success: false,
        message:
          error.message ||
          "⚠️ Failed to update resume visibility.",
        code:
          "PROFILE_RESUME_VISIBILITY_UPDATE_FAILED",
      });
    }
  };

/*
|--------------------------------------------------------------------------
| GET ADMIN RESUME
|--------------------------------------------------------------------------
|
| GET /api/admin/profile/resume
|
| Protected endpoint.
|
| The permanent Cloudinary URL is never returned.
| Instead, the backend generates a signed URL and
| redirects the browser to it.
|
*/

const getAdminResume =
  async (req, res) => {
    try {
      const profile =
        await profileService.getAdminProfile();

      if (!profile) {
        return res.status(404).json({
          success: false,
          message:
            "⚠️ Profile does not exist.",
          code:
            "PROFILE_NOT_FOUND",
        });
      }

      if (
        !profile.resume?.publicId
      ) {
        return res.status(404).json({
          success: false,
          message:
            "⚠️ No resume is currently uploaded.",
          code:
            "PROFILE_RESUME_NOT_FOUND",
        });
      }

      const signedUrl =
        generateSignedResumeUrl(
          profile.resume.publicId
        );

      return res.redirect(
        302,
        signedUrl
      );
    } catch (error) {
      console.error(
        "Get admin resume error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "❌ Failed to open resume.",
        code:
          "PROFILE_RESUME_FETCH_FAILED",
      });
    }
  };

/*
|--------------------------------------------------------------------------
| GET PUBLIC RESUME
|--------------------------------------------------------------------------
|
| GET /api/profile/resume
|
| Public access is allowed only when:
| - Profile is active
| - Resume exists
| - Resume visibility is true
|
*/

const getPublicResume =
  async (req, res) => {
    try {
      const profile =
        await profileService.getProfile();

      if (!profile) {
        return res.status(404).json({
          success: false,
          message:
            "⚠️ Public profile is not available.",
          code:
            "PUBLIC_PROFILE_NOT_FOUND",
        });
      }

      if (
        !profile.resume?.publicId
      ) {
        return res.status(404).json({
          success: false,
          message:
            "⚠️ Resume is not available.",
          code:
            "PUBLIC_RESUME_NOT_FOUND",
        });
      }

      if (
        profile.resume.visible ===
        false
      ) {
        return res.status(404).json({
          success: false,
          message:
            "🔒 Resume is currently hidden.",
          code:
            "PUBLIC_RESUME_HIDDEN",
        });
      }

      const signedUrl =
        generateSignedResumeUrl(
          profile.resume.publicId
        );

      return res.redirect(
        302,
        signedUrl
      );
    } catch (error) {
      console.error(
        "Get public resume error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "❌ Failed to open public resume.",
        code:
          "PUBLIC_RESUME_FETCH_FAILED",
      });
    }
  };

/*
|--------------------------------------------------------------------------
| UPDATE PROFILE ACTIVE STATUS
|--------------------------------------------------------------------------
|
| PATCH /api/admin/profile/status
|
*/

const setProfileActiveStatus =
  async (req, res) => {
    try {
      if (
        typeof req.body?.isActive !==
        "boolean"
      ) {
        return res.status(400).json({
          success: false,
          message:
            "⚠️ Profile active status must be true or false.",
          code:
            "PROFILE_STATUS_REQUIRED",
        });
      }

      const profile =
        await profileService.setProfileActiveStatus(
          req.body.isActive
        );

      return res.status(200).json({
        success: true,
        message:
          req.body.isActive
            ? "🟢 Profile has been activated."
            : "🔒 Profile has been deactivated.",
        profile,
      });
    } catch (error) {
      console.error(
        "Set profile active status error:",
        error
      );

      if (
        error.code ===
        "PROFILE_NOT_FOUND"
      ) {
        return res.status(404).json({
          success: false,
          message:
            "⚠️ Profile does not exist.",
          code:
            "PROFILE_NOT_FOUND",
        });
      }

      return res.status(400).json({
        success: false,
        message:
          error.message ||
          "⚠️ Failed to update profile status.",
        code:
          "PROFILE_STATUS_UPDATE_FAILED",
      });
    }
  };

/*
|--------------------------------------------------------------------------
| DELETE PROFILE
|--------------------------------------------------------------------------
|
| DELETE /api/admin/profile
|
*/

const deleteProfile =
  async (req, res) => {
    try {
      const existingProfile =
        await profileService.getAdminProfile();

      if (!existingProfile) {
        return res.status(404).json({
          success: false,
          message:
            "⚠️ Profile does not exist.",
          code:
            "PROFILE_NOT_FOUND",
        });
      }

      /*
       * Delete profile photo from Cloudinary.
       */

      if (
        existingProfile.profilePhoto
          ?.publicId
      ) {
        try {
          await deleteProfilePhoto(
            existingProfile.profilePhoto
              .publicId
          );
        } catch (deleteError) {
          console.error(
            "Cloudinary profile photo deletion error:",
            deleteError
          );

          return res.status(500).json({
            success: false,
            message:
              "❌ Profile could not be deleted because its cloud photo could not be cleaned up. Please try again.",
            code:
              "PROFILE_CLOUDINARY_DELETE_FAILED",
          });
        }
      }

      /*
       * Delete resume from Cloudinary.
       */

      if (
        existingProfile.resume
          ?.publicId
      ) {
        try {
          await deleteResume(
            existingProfile.resume
              .publicId
          );
        } catch (deleteError) {
          console.error(
            "Cloudinary resume deletion error:",
            deleteError
          );

          return res.status(500).json({
            success: false,
            message:
              "❌ Profile could not be deleted because its cloud resume could not be cleaned up. Please try again.",
            code:
              "PROFILE_RESUME_CLOUDINARY_DELETE_FAILED",
          });
        }
      }

      const result =
        await profileService.deleteProfile();

      return res.status(200).json({
        success: true,
        message:
          "🗑️ Profile deleted successfully.",
        profileId:
          result.profileId,
      });
    } catch (error) {
      console.error(
        "Delete profile error:",
        error
      );

      if (
        error.code ===
        "PROFILE_NOT_FOUND"
      ) {
        return res.status(404).json({
          success: false,
          message:
            "⚠️ Profile does not exist.",
          code:
            "PROFILE_NOT_FOUND",
        });
      }

      return res.status(500).json({
        success: false,
        message:
          "❌ Failed to delete profile.",
        code:
          "PROFILE_DELETE_FAILED",
      });
    }
  };

/*
|--------------------------------------------------------------------------
| EXPORT CONTROLLERS
|--------------------------------------------------------------------------
*/

module.exports = {
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
};