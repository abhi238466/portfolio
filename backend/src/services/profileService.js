const Profile = require("../models/Profile");

/*
|--------------------------------------------------------------------------
| PROFILE SERVICE
|--------------------------------------------------------------------------
|
| Business logic for the single portfolio profile record.
|
| Responsibilities:
| - Get profile
| - Create profile
| - Update profile
| - Manage professional links
| - Manage visibility
| - Store profile photo metadata
| - Store resume metadata
| - Manage active status
| - Delete profile
| - Sanitize public profile response
|
| Important:
| - Authentication belongs to middleware.
| - HTTP handling belongs to controller.
| - Cloudinary upload/delete belongs to cloudinaryService.
| - This service stores only cloud-file metadata/reference.
|
*/

/*
|--------------------------------------------------------------------------
| DEFAULT PROFILE DATA
|--------------------------------------------------------------------------
*/

const DEFAULT_PROFILE_DATA = {
  name: "",
  headline: "",
  shortBio: "",

  profilePhoto: null,

  email: "",
  phone: "",
  currentAddress: "",
  permanentAddress: "",

  links: [],

  resume: null,

  visibility: {
    email: true,
    phone: true,
    currentAddress: false,
    permanentAddress: false,
  },

  isActive: true,
};

/*
|--------------------------------------------------------------------------
| CONSTANTS
|--------------------------------------------------------------------------
*/

const ALLOWED_LINK_TYPES = [
  "github",
  "linkedin",
  "email",
  "website",
  "other",
];

const ALLOWED_RESUME_MIME_TYPE =
  "application/pdf";

/*
|--------------------------------------------------------------------------
| STRING NORMALIZATION
|--------------------------------------------------------------------------
*/

const normalizeString = (
  value,
  defaultValue = ""
) => {
  if (
    value === undefined ||
    value === null
  ) {
    return defaultValue;
  }

  return String(value).trim();
};

/*
|--------------------------------------------------------------------------
| EMAIL NORMALIZATION
|--------------------------------------------------------------------------
*/

const normalizeEmail = (
  value
) => {
  const email =
    normalizeString(value);

  return email
    ? email.toLowerCase()
    : "";
};

/*
|--------------------------------------------------------------------------
| EMAIL VALIDATION
|--------------------------------------------------------------------------
*/

const isValidEmail = (
  email
) => {
  if (!email) {
    return true;
  }

  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
    email
  );
};

/*
|--------------------------------------------------------------------------
| HTTP URL VALIDATION
|--------------------------------------------------------------------------
*/

const isValidHttpUrl = (
  value
) => {
  try {
    const url =
      new URL(value);

    return (
      url.protocol === "http:" ||
      url.protocol === "https:"
    );
  } catch {
    return false;
  }
};

/*
|--------------------------------------------------------------------------
| LINK TYPE VALIDATION
|--------------------------------------------------------------------------
*/

const isValidLinkType = (
  type
) => {
  return ALLOWED_LINK_TYPES.includes(
    type
  );
};

/*
|--------------------------------------------------------------------------
| LINK NORMALIZATION
|--------------------------------------------------------------------------
*/

const normalizeLink = (
  link,
  index = 0
) => {
  if (
    !link ||
    typeof link !== "object"
  ) {
    throw new Error(
      "Invalid professional link data."
    );
  }

  const label =
    normalizeString(
      link.label
    );

  const url =
    normalizeString(
      link.url
    );

  const type =
    normalizeString(
      link.type,
      "other"
    ).toLowerCase();

  if (!label) {
    throw new Error(
      "Professional link name is required."
    );
  }

  if (label.length > 60) {
    throw new Error(
      "Professional link name cannot exceed 60 characters."
    );
  }

  if (!url) {
    throw new Error(
      `URL is required for professional link "${label}".`
    );
  }

  if (url.length > 500) {
    throw new Error(
      `URL for "${label}" cannot exceed 500 characters.`
    );
  }

  if (!isValidHttpUrl(url)) {
    throw new Error(
      `Please provide a valid HTTP or HTTPS URL for "${label}".`
    );
  }

  if (!isValidLinkType(type)) {
    throw new Error(
      `Invalid professional link type for "${label}".`
    );
  }

  return {
    _id: link._id,

    label,

    url,

    type,

    visible:
      typeof link.visible ===
      "boolean"
        ? link.visible
        : true,

    displayOrder:
      Number.isFinite(
        Number(
          link.displayOrder
        )
      )
        ? Math.max(
            0,
            Number(
              link.displayOrder
            )
          )
        : index,
  };
};

/*
|--------------------------------------------------------------------------
| LINKS NORMALIZATION
|--------------------------------------------------------------------------
*/

const normalizeLinks = (
  links
) => {
  if (
    links === undefined
  ) {
    return undefined;
  }

  if (
    !Array.isArray(links)
  ) {
    throw new Error(
      "Professional links must be provided as an array."
    );
  }

  return links.map(
    (
      link,
      index
    ) =>
      normalizeLink(
        link,
        index
      )
  );
};

/*
|--------------------------------------------------------------------------
| VISIBILITY NORMALIZATION
|--------------------------------------------------------------------------
*/

const normalizeVisibility = (
  visibility = {}
) => {
  return {
    email:
      typeof visibility.email ===
      "boolean"
        ? visibility.email
        : true,

    phone:
      typeof visibility.phone ===
      "boolean"
        ? visibility.phone
        : true,

    currentAddress:
      typeof visibility.currentAddress ===
      "boolean"
        ? visibility.currentAddress
        : false,

    permanentAddress:
      typeof visibility.permanentAddress ===
      "boolean"
        ? visibility.permanentAddress
        : false,
  };
};

/*
|--------------------------------------------------------------------------
| PROFILE DATA VALIDATION
|--------------------------------------------------------------------------
*/

const validateProfileData = (
  data
) => {
  if (!data) {
    throw new Error(
      "Profile data is required."
    );
  }

  const name =
    normalizeString(
      data.name
    );

  if (!name) {
    throw new Error(
      "Profile name is required."
    );
  }

  if (name.length > 100) {
    throw new Error(
      "Profile name cannot exceed 100 characters."
    );
  }

  const headline =
    normalizeString(
      data.headline
    );

  if (headline.length > 160) {
    throw new Error(
      "Professional headline cannot exceed 160 characters."
    );
  }

  const shortBio =
    normalizeString(
      data.shortBio
    );

  if (shortBio.length > 600) {
    throw new Error(
      "Short professional bio cannot exceed 600 characters."
    );
  }

  const email =
    normalizeEmail(
      data.email
    );

  if (!isValidEmail(email)) {
    throw new Error(
      "Please provide a valid email address."
    );
  }

  const phone =
    normalizeString(
      data.phone
    );

  if (phone.length > 30) {
    throw new Error(
      "Phone number cannot exceed 30 characters."
    );
  }

  const currentAddress =
    normalizeString(
      data.currentAddress
    );

  if (
    currentAddress.length >
    300
  ) {
    throw new Error(
      "Current address cannot exceed 300 characters."
    );
  }

  const permanentAddress =
    normalizeString(
      data.permanentAddress
    );

  if (
    permanentAddress.length >
    300
  ) {
    throw new Error(
      "Permanent address cannot exceed 300 characters."
    );
  }

  return {
    name,
    headline,
    shortBio,
    email,
    phone,
    currentAddress,
    permanentAddress,
  };
};

/*
|--------------------------------------------------------------------------
| CLOUD FILE METADATA VALIDATION
|--------------------------------------------------------------------------
*/

const validateCloudFileMetadata = (
  fileData,
  type
) => {
  if (
    !fileData ||
    typeof fileData !==
      "object"
  ) {
    throw new Error(
      `${type} file data is required.`
    );
  }

  if (
    !fileData.url ||
    typeof fileData.url !==
      "string"
  ) {
    throw new Error(
      `${type} file URL is required.`
    );
  }

  if (
    !fileData.publicId ||
    typeof fileData.publicId !==
      "string"
  ) {
    throw new Error(
      `${type} cloud storage reference is required.`
    );
  }

  if (
    !isValidHttpUrl(
      fileData.url
    )
  ) {
    throw new Error(
      `${type} file URL must be a valid HTTP/HTTPS URL.`
    );
  }

  if (
    fileData.originalName &&
    String(
      fileData.originalName
    ).length > 255
  ) {
    throw new Error(
      `${type} file name cannot exceed 255 characters.`
    );
  }

  if (
    fileData.size !==
      undefined &&
    fileData.size !== null
  ) {
    const size =
      Number(fileData.size);

    if (
      !Number.isFinite(size) ||
      size < 0
    ) {
      throw new Error(
        `${type} file size is invalid.`
      );
    }
  }

  return fileData;
};

/*
|--------------------------------------------------------------------------
| GET ACTIVE PUBLIC PROFILE
|--------------------------------------------------------------------------
*/

const getProfile =
  async () => {
    const profile =
      await Profile.findOne({
        isActive: true,
      }).lean();

    return profile;
  };

/*
|--------------------------------------------------------------------------
| GET ADMIN PROFILE
|--------------------------------------------------------------------------
|
| Includes inactive profile because admin
| needs to manage it.
|
*/

const getAdminProfile =
  async () => {
    const profile =
      await Profile.findOne(
        {}
      ).lean();

    return profile;
  };

/*
|--------------------------------------------------------------------------
| CREATE INITIAL PROFILE
|--------------------------------------------------------------------------
*/

const createProfile =
  async (
    profileData = {}
  ) => {
    const existingProfile =
      await Profile.findOne(
        {}
      );

    if (existingProfile) {
      const error =
        new Error(
          "A profile already exists. Please update the existing profile instead."
        );

      error.code =
        "PROFILE_ALREADY_EXISTS";

      throw error;
    }

    const validatedData =
      validateProfileData(
        profileData
      );

    const links =
      normalizeLinks(
        profileData.links
      ) || [];

    const visibility =
      normalizeVisibility(
        profileData.visibility
      );

    const profile =
      await Profile.create({
        ...DEFAULT_PROFILE_DATA,

        ...validatedData,

        links,

        visibility,

        profilePhoto:
          profileData.profilePhoto ||
          null,

        resume:
          profileData.resume ||
          null,

        isActive:
          typeof profileData.isActive ===
          "boolean"
            ? profileData.isActive
            : true,
      });

    return profile;
  };

/*
|--------------------------------------------------------------------------
| UPDATE PROFILE
|--------------------------------------------------------------------------
*/

const updateProfile =
  async (
    profileData
  ) => {
    if (
      !profileData ||
      typeof profileData !==
        "object"
    ) {
      throw new Error(
        "Profile update data is required."
      );
    }

    const profile =
      await Profile.findOne(
        {}
      );

    if (!profile) {
      const error =
        new Error(
          "Profile does not exist yet. Create the profile first."
        );

      error.code =
        "PROFILE_NOT_FOUND";

      throw error;
    }

    const dataToValidate = {
      name:
        profileData.name !==
        undefined
          ? profileData.name
          : profile.name,

      headline:
        profileData.headline !==
        undefined
          ? profileData.headline
          : profile.headline,

      shortBio:
        profileData.shortBio !==
        undefined
          ? profileData.shortBio
          : profile.shortBio,

      email:
        profileData.email !==
        undefined
          ? profileData.email
          : profile.email,

      phone:
        profileData.phone !==
        undefined
          ? profileData.phone
          : profile.phone,

      currentAddress:
        profileData.currentAddress !==
        undefined
          ? profileData.currentAddress
          : profile.currentAddress,

      permanentAddress:
        profileData.permanentAddress !==
        undefined
          ? profileData.permanentAddress
          : profile.permanentAddress,
    };

    const validatedData =
      validateProfileData(
        dataToValidate
      );

    profile.name =
      validatedData.name;

    profile.headline =
      validatedData.headline;

    profile.shortBio =
      validatedData.shortBio;

    profile.email =
      validatedData.email;

    profile.phone =
      validatedData.phone;

    profile.currentAddress =
      validatedData.currentAddress;

    profile.permanentAddress =
      validatedData.permanentAddress;

    /*
     * Optional links update.
     */

    if (
      profileData.links !==
      undefined
    ) {
      profile.links =
        normalizeLinks(
          profileData.links
        );
    }

    /*
     * Optional visibility update.
     */

    if (
      profileData.visibility !==
      undefined
    ) {
      profile.visibility =
        normalizeVisibility(
          profileData.visibility
        );
    }

    /*
     * Profile photo metadata.
     */

    if (
      profileData.profilePhoto !==
      undefined
    ) {
      if (
        profileData.profilePhoto !==
        null
      ) {
        validateCloudFileMetadata(
          profileData.profilePhoto,
          "Profile photo"
        );
      }

      profile.profilePhoto =
        profileData.profilePhoto;
    }

    /*
     * Resume metadata.
     */

    if (
      profileData.resume !==
      undefined
    ) {
      if (
        profileData.resume !==
        null
      ) {
        validateCloudFileMetadata(
          profileData.resume,
          "Resume"
        );

        if (
          profileData.resume.mimeType &&
          profileData.resume.mimeType !==
            ALLOWED_RESUME_MIME_TYPE
        ) {
          throw new Error(
            "Resume must be a PDF file."
          );
        }
      }

      profile.resume =
        profileData.resume;
    }

    /*
     * Optional active status.
     */

    if (
      typeof profileData.isActive ===
      "boolean"
    ) {
      profile.isActive =
        profileData.isActive;
    }

    await profile.save();

    return profile;
  };

/*
|--------------------------------------------------------------------------
| UPDATE COMPLETE LINKS COLLECTION
|--------------------------------------------------------------------------
*/

const updateProfileLinks =
  async (
    links
  ) => {
    const profile =
      await Profile.findOne(
        {}
      );

    if (!profile) {
      const error =
        new Error(
          "Profile does not exist."
        );

      error.code =
        "PROFILE_NOT_FOUND";

      throw error;
    }

    const normalizedLinks =
      normalizeLinks(
        links
      );

    profile.links =
      normalizedLinks;

    await profile.save();

    return profile;
  };

/*
|--------------------------------------------------------------------------
| ADD PROFESSIONAL LINK
|--------------------------------------------------------------------------
*/

const addProfessionalLink =
  async (
    linkData
  ) => {
    const profile =
      await Profile.findOne(
        {}
      );

    if (!profile) {
      const error =
        new Error(
          "Profile does not exist."
        );

      error.code =
        "PROFILE_NOT_FOUND";

      throw error;
    }

    const newLink =
      normalizeLink(
        linkData,
        profile.links.length
      );

    profile.links.push(
      newLink
    );

    /*
     * Rebuild display order.
     */

    profile.links =
      profile.links.map(
        (
          link,
          index
        ) => {
          link.displayOrder =
            index;

          return link;
        }
      );

    await profile.save();

    return profile;
  };

/*
|--------------------------------------------------------------------------
| UPDATE PROFESSIONAL LINK
|--------------------------------------------------------------------------
*/

const updateProfessionalLink =
  async (
    linkId,
    linkData
  ) => {
    if (!linkId) {
      throw new Error(
        "Professional link ID is required."
      );
    }

    const profile =
      await Profile.findOne(
        {}
      );

    if (!profile) {
      const error =
        new Error(
          "Profile does not exist."
        );

      error.code =
        "PROFILE_NOT_FOUND";

      throw error;
    }

    const linkIndex =
      profile.links.findIndex(
        (
          link
        ) =>
          String(
            link._id
          ) ===
          String(linkId)
      );

    if (
      linkIndex ===
      -1
    ) {
      const error =
        new Error(
          "Professional link was not found."
        );

      error.code =
        "PROFILE_LINK_NOT_FOUND";

      throw error;
    }

    const existingLink =
      profile.links[
        linkIndex
      ];

    const mergedLink = {
      _id:
        existingLink._id,

      label:
        linkData.label !==
        undefined
          ? linkData.label
          : existingLink.label,

      url:
        linkData.url !==
        undefined
          ? linkData.url
          : existingLink.url,

      type:
        linkData.type !==
        undefined
          ? linkData.type
          : existingLink.type,

      visible:
        typeof linkData.visible ===
        "boolean"
          ? linkData.visible
          : existingLink.visible,

      displayOrder:
        linkData.displayOrder !==
        undefined
          ? linkData.displayOrder
          : existingLink.displayOrder,
    };

    const normalizedLink =
      normalizeLink(
        mergedLink,
        linkIndex
      );

    profile.links[
      linkIndex
    ] =
      normalizedLink;

    await profile.save();

    return profile;
  };

/*
|--------------------------------------------------------------------------
| DELETE PROFESSIONAL LINK
|--------------------------------------------------------------------------
*/

const deleteProfessionalLink =
  async (
    linkId
  ) => {
    if (!linkId) {
      throw new Error(
        "Professional link ID is required."
      );
    }

    const profile =
      await Profile.findOne(
        {}
      );

    if (!profile) {
      const error =
        new Error(
          "Profile does not exist."
        );

      error.code =
        "PROFILE_NOT_FOUND";

      throw error;
    }

    const originalLength =
      profile.links.length;

    profile.links =
      profile.links.filter(
        (
          link
        ) =>
          String(
            link._id
          ) !==
          String(linkId)
      );

    if (
      profile.links.length ===
      originalLength
    ) {
      const error =
        new Error(
          "Professional link was not found."
        );

      error.code =
        "PROFILE_LINK_NOT_FOUND";

      throw error;
    }

    profile.links =
      profile.links.map(
        (
          link,
          index
        ) => {
          link.displayOrder =
            index;

          return link;
        }
      );

    await profile.save();

    return profile;
  };

/*
|--------------------------------------------------------------------------
| UPDATE PROFESSIONAL LINK VISIBILITY
|--------------------------------------------------------------------------
*/

const updateProfessionalLinkVisibility =
  async (
    linkId,
    visible
  ) => {
    if (!linkId) {
      throw new Error(
        "Professional link ID is required."
      );
    }

    if (
      typeof visible !==
      "boolean"
    ) {
      throw new Error(
        "Link visibility must be true or false."
      );
    }

    const profile =
      await Profile.findOne(
        {}
      );

    if (!profile) {
      const error =
        new Error(
          "Profile does not exist."
        );

      error.code =
        "PROFILE_NOT_FOUND";

      throw error;
    }

    const link =
      profile.links.id(
        linkId
      );

    if (!link) {
      const error =
        new Error(
          "Professional link was not found."
        );

      error.code =
        "PROFILE_LINK_NOT_FOUND";

      throw error;
    }

    link.visible =
      visible;

    await profile.save();

    return profile;
  };

/*
|--------------------------------------------------------------------------
| UPDATE PROFILE VISIBILITY
|--------------------------------------------------------------------------
*/

const updateProfileVisibility =
  async (
    visibility
  ) => {
    if (
      !visibility ||
      typeof visibility !==
        "object"
    ) {
      throw new Error(
        "Visibility settings are required."
      );
    }

    const profile =
      await Profile.findOne(
        {}
      );

    if (!profile) {
      const error =
        new Error(
          "Profile does not exist."
        );

      error.code =
        "PROFILE_NOT_FOUND";

      throw error;
    }

    profile.visibility =
      normalizeVisibility(
        visibility
      );

    await profile.save();

    return profile;
  };

/*
|--------------------------------------------------------------------------
| SET PROFILE PHOTO
|--------------------------------------------------------------------------
|
| Controller uploads the actual file to Cloudinary.
| This function stores the resulting metadata.
|
*/

const setProfilePhoto =
  async (
    photoData
  ) => {
    const profile =
      await Profile.findOne(
        {}
      );

    if (!profile) {
      const error =
        new Error(
          "Profile does not exist."
        );

      error.code =
        "PROFILE_NOT_FOUND";

      throw error;
    }

    validateCloudFileMetadata(
      photoData,
      "Profile photo"
    );

    if (
      photoData.mimeType &&
      ![
        "image/jpeg",
        "image/png",
        "image/webp",
      ].includes(
        photoData.mimeType
      )
    ) {
      throw new Error(
        "Profile photo must be JPG, JPEG, PNG, or WEBP."
      );
    }

    profile.profilePhoto =
      photoData;

    await profile.save();

    return profile;
  };

/*
|--------------------------------------------------------------------------
| REMOVE PROFILE PHOTO
|--------------------------------------------------------------------------
*/

const removeProfilePhoto =
  async () => {
    const profile =
      await Profile.findOne(
        {}
      );

    if (!profile) {
      const error =
        new Error(
          "Profile does not exist."
        );

      error.code =
        "PROFILE_NOT_FOUND";

      throw error;
    }

    profile.profilePhoto =
      null;

    await profile.save();

    return profile;
  };

/*
|--------------------------------------------------------------------------
| SET RESUME
|--------------------------------------------------------------------------
|
| Controller/cloud storage layer provides metadata.
|
*/

const setResume =
  async (
    resumeData
  ) => {
    const profile =
      await Profile.findOne(
        {}
      );

    if (!profile) {
      const error =
        new Error(
          "Profile does not exist."
        );

      error.code =
        "PROFILE_NOT_FOUND";

      throw error;
    }

    validateCloudFileMetadata(
      resumeData,
      "Resume"
    );

    if (
      resumeData.mimeType &&
      resumeData.mimeType !==
        ALLOWED_RESUME_MIME_TYPE
    ) {
      throw new Error(
        "Resume must be a PDF file."
      );
    }

    profile.resume =
      resumeData;

    await profile.save();

    return profile;
  };

/*
|--------------------------------------------------------------------------
| REMOVE RESUME
|--------------------------------------------------------------------------
*/

const removeResume =
  async () => {
    const profile =
      await Profile.findOne(
        {}
      );

    if (!profile) {
      const error =
        new Error(
          "Profile does not exist."
        );

      error.code =
        "PROFILE_NOT_FOUND";

      throw error;
    }

    profile.resume =
      null;

    await profile.save();

    return profile;
  };

/*
|--------------------------------------------------------------------------
| SET PROFILE ACTIVE STATUS
|--------------------------------------------------------------------------
*/

const setProfileActiveStatus =
  async (
    isActive
  ) => {
    if (
      typeof isActive !==
      "boolean"
    ) {
      throw new Error(
        "Profile active status must be true or false."
      );
    }

    const profile =
      await Profile.findOne(
        {}
      );

    if (!profile) {
      const error =
        new Error(
          "Profile does not exist."
        );

      error.code =
        "PROFILE_NOT_FOUND";

      throw error;
    }

    profile.isActive =
      isActive;

    await profile.save();

    return profile;
  };

/*
|--------------------------------------------------------------------------
| DELETE PROFILE
|--------------------------------------------------------------------------
|
| MongoDB document deletion only.
|
| Cloudinary assets must be cleaned by the
| controller/cloudinary service before/around
| this operation.
|
*/

const deleteProfile =
  async () => {
    const profile =
      await Profile.findOne(
        {}
      );

    if (!profile) {
      const error =
        new Error(
          "Profile does not exist."
        );

      error.code =
        "PROFILE_NOT_FOUND";

      throw error;
    }

    await Profile.deleteOne({
      _id: profile._id,
    });

    return {
      deleted: true,

      profileId:
        String(
          profile._id
        ),
    };
  };

/*
|--------------------------------------------------------------------------
| PUBLIC PROFILE SANITIZER
|--------------------------------------------------------------------------
|
| This is the final backend safety layer before
| profile data reaches the public frontend.
|
*/

const sanitizeProfileForPublic =
  (profile) => {
    if (!profile) {
      return null;
    }

    const profileObject =
      typeof profile.toObject ===
      "function"
        ? profile.toObject()
        : {
            ...profile,
          };

    /*
     * Inactive profile must never be public.
     */

    if (
      profileObject.isActive ===
      false
    ) {
      return null;
    }

    const visibility =
      normalizeVisibility(
        profileObject.visibility
      );

    /*
     * Remove internal MongoDB field.
     */

    delete profileObject.__v;

    /*
     * Remove private contact data
     * according to visibility.
     */

    if (
      !visibility.email
    ) {
      delete profileObject.email;
    }

    if (
      !visibility.phone
    ) {
      delete profileObject.phone;
    }

    if (
      !visibility.currentAddress
    ) {
      delete profileObject.currentAddress;
    }

    if (
      !visibility.permanentAddress
    ) {
      delete profileObject.permanentAddress;
    }

    /*
     * Only visible professional links
     * are public.
     */

    profileObject.links =
      Array.isArray(
        profileObject.links
      )
        ? profileObject.links
            .filter(
              (
                link
              ) =>
                link.visible !==
                false
            )
            .sort(
              (
                first,
                second
              ) =>
                (
                  first.displayOrder ||
                  0
                ) -
                (
                  second.displayOrder ||
                  0
                )
            )
            .map(
              (
                link
              ) => ({
                _id:
                  link._id,
                label:
                  link.label,
                url:
                  link.url,
                type:
                  link.type,
                displayOrder:
                  link.displayOrder,
              })
            )
        : [];

    /*
     * Visibility configuration is admin-only.
     */

    delete profileObject.visibility;

    /*
     * Resume metadata is not exposed
     * directly through the public profile API.
     *
     * Public resume delivery will be handled
     * through a dedicated controlled endpoint.
     */

    delete profileObject.resume;

    return profileObject;
  };

/*
|--------------------------------------------------------------------------
| EXPORTS
|--------------------------------------------------------------------------
*/

module.exports = {
  DEFAULT_PROFILE_DATA,

  getProfile,
  getAdminProfile,

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

  setResume,
  removeResume,

  setProfileActiveStatus,

  deleteProfile,

  sanitizeProfileForPublic,
};