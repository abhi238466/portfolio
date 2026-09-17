const mongoose = require("mongoose");
const Project = require("../models/Project");

/*
|--------------------------------------------------------------------------
| CONSTANTS
|--------------------------------------------------------------------------
*/

const MAX_PROJECTS_PER_PAGE = 100;

const MAX_TECHNOLOGIES = 30;
const MAX_FEATURES = 50;
const MAX_IMAGES = 20;
const MAX_LINKS = 20;

const ALLOWED_STATUSES = [
  "completed",
  "in-progress",
  "planned",
];

const ALLOWED_PROJECT_TYPES = [
  "individual",
  "team",
];

const ALLOWED_LINK_TYPES = [
  "github",
  "live",
  "other",
];

const ALLOWED_IMAGE_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
];

/*
|--------------------------------------------------------------------------
| DEFAULT PROJECT DATA
|--------------------------------------------------------------------------
*/

const DEFAULT_PROJECT_DATA = {
  title: "",
  shortDescription: "",
  fullDescription: "",
  category: "",
  role: "",
  technologies: [],
  features: [],
  images: [],
  links: [],
  githubUrl: "",
  liveDemoUrl: "",
  startDate: null,
  endDate: null,
  status: "completed",
  projectType: "individual",
  teamSize: null,
  futureImprovements: "",
  isVisible: true,
  isFeatured: false,
  displayOrder: 0,
  isActive: true,
};

/*
|--------------------------------------------------------------------------
| ERROR HELPER
|--------------------------------------------------------------------------
*/

const createServiceError = (
  message,
  statusCode = 400
) => {
  const error = new Error(message);

  error.statusCode = statusCode;

  return error;
};

/*
|--------------------------------------------------------------------------
| NORMALIZATION HELPERS
|--------------------------------------------------------------------------
*/

const normalizeString = (
  value,
  fieldName,
  maxLength,
  required = false
) => {
  const normalized =
    typeof value === "string"
      ? value.trim()
      : "";

  if (
    required &&
    normalized.length === 0
  ) {
    throw createServiceError(
      `${fieldName} is required.`
    );
  }

  if (
    normalized.length > maxLength
  ) {
    throw createServiceError(
      `${fieldName} cannot exceed ${maxLength} characters.`
    );
  }

  return normalized;
};

const normalizeOptionalString = (
  value,
  fieldName,
  maxLength
) => {
  if (
    value === null ||
    value === undefined
  ) {
    return "";
  }

  return normalizeString(
    value,
    fieldName,
    maxLength,
    false
  );
};

const normalizeBoolean = (
  value,
  defaultValue = false
) => {
  if (typeof value === "boolean") {
    return value;
  }

  if (
    value === "true" ||
    value === 1 ||
    value === "1"
  ) {
    return true;
  }

  if (
    value === "false" ||
    value === 0 ||
    value === "0"
  ) {
    return false;
  }

  return defaultValue;
};

const normalizeNumber = (
  value,
  fieldName,
  defaultValue = 0
) => {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return defaultValue;
  }

  const numberValue = Number(value);

  if (
    !Number.isFinite(numberValue)
  ) {
    throw createServiceError(
      `${fieldName} must be a valid number.`
    );
  }

  if (numberValue < 0) {
    throw createServiceError(
      `${fieldName} cannot be negative.`
    );
  }

  return Math.floor(numberValue);
};

/*
|--------------------------------------------------------------------------
| URL VALIDATION
|--------------------------------------------------------------------------
|
| Supports:
| - https://...
| - http://...
| - /internal/path
|
| Relative paths are useful for internal portfolio navigation.
|
*/

const isValidActionUrl = (
  value
) => {
  const url = normalizeString(
    value,
    "URL",
    500
  );

  if (!url) {
    return false;
  }

  if (
    /^https?:\/\//i.test(url)
  ) {
    try {
      new URL(url);

      return true;
    } catch {
      return false;
    }
  }

  /*
   * Internal frontend route.
   *
   * Prevent protocol-relative URLs such as:
   * //evil.example.com
   */
  if (
    url.startsWith("/") &&
    !url.startsWith("//")
  ) {
    return true;
  }

  return false;
};

const normalizeUrl = (
  value,
  fieldName,
  required = false
) => {
  const url =
    typeof value === "string"
      ? value.trim()
      : "";

  if (!url) {
    if (required) {
      throw createServiceError(
        `${fieldName} is required.`
      );
    }

    return "";
  }

  if (!isValidActionUrl(url)) {
    throw createServiceError(
      `${fieldName} must be a valid HTTP/HTTPS URL or internal portfolio path.`
    );
  }

  return url;
};

/*
|--------------------------------------------------------------------------
| DATE NORMALIZATION
|--------------------------------------------------------------------------
*/

const normalizeDate = (
  value,
  fieldName
) => {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return null;
  }

  const date = new Date(value);

  if (
    Number.isNaN(date.getTime())
  ) {
    throw createServiceError(
      `${fieldName} must be a valid date.`
    );
  }

  return date;
};

/*
|--------------------------------------------------------------------------
| TECHNOLOGIES
|--------------------------------------------------------------------------
*/

const normalizeTechnologies = (
  technologies
) => {
  if (
    !Array.isArray(technologies)
  ) {
    throw createServiceError(
      "Technologies must be an array."
    );
  }

  if (
    technologies.length === 0
  ) {
    throw createServiceError(
      "At least one technology is required."
    );
  }

  if (
    technologies.length >
    MAX_TECHNOLOGIES
  ) {
    throw createServiceError(
      `A maximum of ${MAX_TECHNOLOGIES} technologies is allowed.`
    );
  }

  const normalized =
    technologies.map(
      (technology, index) => {
        return normalizeString(
          technology,
          `Technology ${index + 1}`,
          80,
          true
        );
      }
    );

  /*
   * Remove duplicate technologies
   * while preserving original order.
   */
  return [
    ...new Map(
      normalized.map((item) => [
        item.toLowerCase(),
        item,
      ])
    ).values(),
  ];
};

/*
|--------------------------------------------------------------------------
| FEATURES
|--------------------------------------------------------------------------
*/

const normalizeFeatures = (
  features
) => {
  if (
    features === undefined ||
    features === null
  ) {
    return [];
  }

  if (
    !Array.isArray(features)
  ) {
    throw createServiceError(
      "Features must be an array."
    );
  }

  if (
    features.length >
    MAX_FEATURES
  ) {
    throw createServiceError(
      `A maximum of ${MAX_FEATURES} features is allowed.`
    );
  }

  return features
    .map((feature, index) =>
      normalizeString(
        feature,
        `Feature ${index + 1}`,
        200,
        true
      )
    )
    .filter(Boolean);
};

/*
|--------------------------------------------------------------------------
| PROJECT LINKS
|--------------------------------------------------------------------------
*/

const normalizeLink = (
  link,
  index
) => {
  if (
    !link ||
    typeof link !== "object"
  ) {
    throw createServiceError(
      `Project link ${index + 1} is invalid.`
    );
  }

  const label =
    normalizeString(
      link.label,
      `Project link ${index + 1} label`,
      60,
      true
    );

  const url =
    normalizeUrl(
      link.url,
      `Project link ${index + 1} URL`,
      true
    );

  const type =
    link.type || "other";

  if (
    !ALLOWED_LINK_TYPES.includes(
      type
    )
  ) {
    throw createServiceError(
      `Project link ${index + 1} type is invalid.`
    );
  }

  return {
    _id:
      link._id &&
      mongoose.isValidObjectId(
        link._id
      )
        ? link._id
        : undefined,

    label,

    url,

    type,

    visible:
      normalizeBoolean(
        link.visible,
        true
      ),

    displayOrder:
      normalizeNumber(
        link.displayOrder,
        "Project link display order",
        index
      ),
  };
};

const normalizeLinks = (
  links
) => {
  if (
    links === undefined ||
    links === null
  ) {
    return [];
  }

  if (
    !Array.isArray(links)
  ) {
    throw createServiceError(
      "Project links must be an array."
    );
  }

  if (
    links.length > MAX_LINKS
  ) {
    throw createServiceError(
      `A maximum of ${MAX_LINKS} project links is allowed.`
    );
  }

  return links.map(
    (link, index) =>
      normalizeLink(
        link,
        index
      )
  );
};

/*
|--------------------------------------------------------------------------
| IMAGE METADATA
|--------------------------------------------------------------------------
|
| Actual upload/delete is handled separately through Cloudinary.
|
| MongoDB stores:
| - Cloudinary public ID
| - URL
| - original filename
| - MIME type
| - original file size
| - original width
| - original height
| - primary/order settings
|
| IMPORTANT:
| Original width and height are preserved so the public
| frontend can render every image without cropping/stretching.
|
*/

const normalizeImageMetadata = (
  image,
  index
) => {
  if (
    !image ||
    typeof image !== "object"
  ) {
    throw createServiceError(
      `Project image ${index + 1} is invalid.`
    );
  }

  const publicId =
    normalizeString(
      image.publicId,
      `Project image ${index + 1} public ID`,
      500,
      true
    );

  const url =
    normalizeString(
      image.url,
      `Project image ${index + 1} URL`,
      1000,
      true
    );

  const originalName =
    normalizeString(
      image.originalName,
      `Project image ${index + 1} original name`,
      255,
      true
    );

  const mimeType =
    normalizeString(
      image.mimeType,
      `Project image ${index + 1} MIME type`,
      100,
      true
    );

  if (
    !ALLOWED_IMAGE_MIME_TYPES.includes(
      mimeType
    )
  ) {
    throw createServiceError(
      `Project image ${index + 1} must be JPG, JPEG, PNG, or WEBP.`
    );
  }

  const size =
    Number(image.size);

  if (
    !Number.isFinite(size) ||
    size < 0
  ) {
    throw createServiceError(
      `Project image ${index + 1} size is invalid.`
    );
  }

  /*
   * Original Cloudinary image dimensions.
   *
   * These are mandatory for newly uploaded images.
   */
  const width =
    Number(image.width);

  const height =
    Number(image.height);

  if (
    !Number.isFinite(width) ||
    width < 1
  ) {
    throw createServiceError(
      `Project image ${index + 1} width is invalid.`
    );
  }

  if (
    !Number.isFinite(height) ||
    height < 1
  ) {
    throw createServiceError(
      `Project image ${index + 1} height is invalid.`
    );
  }

  return {
    _id:
      image._id &&
      mongoose.isValidObjectId(
        image._id
      )
        ? image._id
        : undefined,

    publicId,

    url,

    originalName,

    mimeType,

    size,

    width,

    height,

    isPrimary:
      normalizeBoolean(
        image.isPrimary,
        false
      ),

    displayOrder:
      normalizeNumber(
        image.displayOrder,
        "Project image display order",
        index
      ),
  };
};

const normalizeImages = (
  images
) => {
  if (
    images === undefined ||
    images === null
  ) {
    return [];
  }

  if (
    !Array.isArray(images)
  ) {
    throw createServiceError(
      "Project images must be an array."
    );
  }

  if (
    images.length > MAX_IMAGES
  ) {
    throw createServiceError(
      `A maximum of ${MAX_IMAGES} project images is allowed.`
    );
  }

  const normalized =
    images.map(
      (image, index) =>
        normalizeImageMetadata(
          image,
          index
        )
    );

  /*
   * Only one image can be primary.
   */
  let primaryFound = false;

  return normalized.map(
    (image, index) => {
      let isPrimary =
        image.isPrimary;

      if (
        isPrimary &&
        primaryFound
      ) {
        isPrimary = false;
      }

      if (isPrimary) {
        primaryFound = true;
      }

      return {
        ...image,
        isPrimary,
        displayOrder: index,
      };
    }
  );
};

/*
|--------------------------------------------------------------------------
| NORMALIZE PROJECT PAYLOAD
|--------------------------------------------------------------------------
*/

const normalizeProjectPayload = (
  payload = {},
  existingProject = null
) => {
  if (
    !payload ||
    typeof payload !== "object"
  ) {
    throw createServiceError(
      "Project data must be a valid object."
    );
  }

  const existing =
    existingProject?.toObject
      ? existingProject.toObject()
      : existingProject || {};

  /*
   * ================================================================
   * BASIC INFORMATION
   * ================================================================
   */

  const title =
    normalizeString(
      payload.title ??
        existing.title ??
        DEFAULT_PROJECT_DATA.title,
      "Project title",
      150,
      true
    );

  const shortDescription =
    normalizeString(
      payload.shortDescription ??
        existing.shortDescription ??
        DEFAULT_PROJECT_DATA.shortDescription,
      "Short description",
      300,
      true
    );

  const fullDescription =
    normalizeOptionalString(
      payload.fullDescription ??
        existing.fullDescription ??
        DEFAULT_PROJECT_DATA.fullDescription,
      "Full description",
      3000
    );

  const category =
    normalizeString(
      payload.category ??
        existing.category ??
        DEFAULT_PROJECT_DATA.category,
      "Project category",
      100,
      true
    );

  const role =
    normalizeOptionalString(
      payload.role ??
        existing.role ??
        DEFAULT_PROJECT_DATA.role,
      "Project role",
      150
    );

  /*
   * ================================================================
   * TECHNOLOGIES
   * ================================================================
   */

  const technologies =
    normalizeTechnologies(
      payload.technologies ??
        existing.technologies ??
        DEFAULT_PROJECT_DATA.technologies
    );

  /*
   * ================================================================
   * FEATURES
   * ================================================================
   */

  const features =
    normalizeFeatures(
      payload.features ??
        existing.features ??
        DEFAULT_PROJECT_DATA.features
    );

  /*
   * ================================================================
   * IMAGES
   * ================================================================
   */

  const images =
    normalizeImages(
      payload.images ??
        existing.images ??
        DEFAULT_PROJECT_DATA.images
    );

  /*
   * ================================================================
   * LINKS
   * ================================================================
   */

  const links =
    normalizeLinks(
      payload.links ??
        existing.links ??
        DEFAULT_PROJECT_DATA.links
    );

  /*
   * ================================================================
   * DIRECT GITHUB / LIVE URLS
   * ================================================================
   */

  const githubUrl =
    normalizeUrl(
      payload.githubUrl ??
        existing.githubUrl ??
        "",
      "GitHub URL",
      false
    );

  const liveDemoUrl =
    normalizeUrl(
      payload.liveDemoUrl ??
        existing.liveDemoUrl ??
        "",
      "Live Demo URL",
      false
    );

  /*
   * ================================================================
   * DATES
   * ================================================================
   */

  const startDate =
    normalizeDate(
      payload.startDate ??
        existing.startDate ??
        null,
      "Start date"
    );

  const endDate =
    normalizeDate(
      payload.endDate ??
        existing.endDate ??
        null,
      "End date"
    );

  if (
    startDate &&
    endDate &&
    endDate < startDate
  ) {
    throw createServiceError(
      "End date cannot be earlier than start date."
    );
  }

  /*
   * ================================================================
   * STATUS
   * ================================================================
   */

  const status =
    payload.status ??
    existing.status ??
    DEFAULT_PROJECT_DATA.status;

  if (
    !ALLOWED_STATUSES.includes(
      status
    )
  ) {
    throw createServiceError(
      "Project status must be completed, in-progress, or planned."
    );
  }

  /*
   * ================================================================
   * PROJECT TYPE
   * ================================================================
   */

  const projectType =
    payload.projectType ??
    existing.projectType ??
    DEFAULT_PROJECT_DATA.projectType;

  if (
    !ALLOWED_PROJECT_TYPES.includes(
      projectType
    )
  ) {
    throw createServiceError(
      "Project type must be individual or team."
    );
  }

  /*
   * ================================================================
   * TEAM SIZE
   * ================================================================
   */

  let teamSize =
    payload.teamSize ??
    existing.teamSize ??
    DEFAULT_PROJECT_DATA.teamSize;

  if (
    projectType ===
    "individual"
  ) {
    teamSize = null;
  } else {
    teamSize =
      normalizeNumber(
        teamSize,
        "Team size",
        0
      );

    if (teamSize < 2) {
      throw createServiceError(
        "Team project must have a team size of at least 2."
      );
    }
  }

  /*
   * ================================================================
   * FUTURE IMPROVEMENTS
   * ================================================================
   */

  const futureImprovements =
    normalizeOptionalString(
      payload.futureImprovements ??
        existing.futureImprovements ??
        DEFAULT_PROJECT_DATA.futureImprovements,
      "Future improvements",
      2000
    );

  /*
   * ================================================================
   * PUBLIC DISPLAY
   * ================================================================
   */

  const isVisible =
    normalizeBoolean(
      payload.isVisible ??
        existing.isVisible,
      DEFAULT_PROJECT_DATA.isVisible
    );

  const isFeatured =
    normalizeBoolean(
      payload.isFeatured ??
        existing.isFeatured,
      DEFAULT_PROJECT_DATA.isFeatured
    );

  const displayOrder =
    normalizeNumber(
      payload.displayOrder ??
        existing.displayOrder,
      "Display order",
      DEFAULT_PROJECT_DATA.displayOrder
    );

  /*
   * ================================================================
   * ACTIVE
   * ================================================================
   */

  const isActive =
    normalizeBoolean(
      payload.isActive ??
        existing.isActive,
      DEFAULT_PROJECT_DATA.isActive
    );

  /*
   * ================================================================
   * FINAL NORMALIZED DATA
   * ================================================================
   */

  return {
    title,
    shortDescription,
    fullDescription,
    category,
    role,
    technologies,
    features,
    images,
    links,
    githubUrl,
    liveDemoUrl,
    startDate,
    endDate,
    status,
    projectType,
    teamSize,
    futureImprovements,
    isVisible,
    isFeatured,
    displayOrder,
    isActive,
  };
};

/*
|--------------------------------------------------------------------------
| SORT PROJECTS
|--------------------------------------------------------------------------
*/

const sortProjects = (
  projects
) => {
  return projects.sort(
    (a, b) => {
      if (
        a.displayOrder !==
        b.displayOrder
      ) {
        return (
          a.displayOrder -
          b.displayOrder
        );
      }

      return (
        new Date(
          b.createdAt
        ).getTime() -
        new Date(
          a.createdAt
        ).getTime()
      );
    }
  );
};

/*
|--------------------------------------------------------------------------
| ADMIN PROJECTS
|--------------------------------------------------------------------------
*/

const getAdminProjects = async () => {
  const projects =
    await Project.find({})
      .sort({
        displayOrder: 1,
        createdAt: -1,
      })
      .lean();

  return sortProjects(
    projects
  );
};

/*
|--------------------------------------------------------------------------
| PUBLIC PROJECTS
|--------------------------------------------------------------------------
*/

const getPublicProjects = async () => {
  const projects =
    await Project.find({
      isActive: true,
      isVisible: true,
    })
      .sort({
        displayOrder: 1,
        createdAt: -1,
      })
      .lean();

  return sortProjects(
    projects
  ).map(
    sanitizeProjectForPublic
  );
};

/*
|--------------------------------------------------------------------------
| GET PROJECT BY ID
|--------------------------------------------------------------------------
*/

const getProjectById = async (
  projectId
) => {
  if (
    !mongoose.isValidObjectId(
      projectId
    )
  ) {
    throw createServiceError(
      "Invalid project ID.",
      400
    );
  }

  const project =
    await Project.findById(
      projectId
    );

  if (!project) {
    throw createServiceError(
      "Project not found.",
      404
    );
  }

  return project;
};

/*
|--------------------------------------------------------------------------
| GET PUBLIC PROJECT BY ID
|--------------------------------------------------------------------------
*/

const getPublicProjectById =
  async (projectId) => {
    if (
      !mongoose.isValidObjectId(
        projectId
      )
    ) {
      throw createServiceError(
        "Invalid project ID.",
        400
      );
    }

    const project =
      await Project.findOne({
        _id: projectId,
        isActive: true,
        isVisible: true,
      }).lean();

    if (!project) {
      throw createServiceError(
        "Project not found.",
        404
      );
    }

    return sanitizeProjectForPublic(
      project
    );
  };

/*
|--------------------------------------------------------------------------
| CREATE PROJECT
|--------------------------------------------------------------------------
*/

const createProject = async (
  payload
) => {
  const normalized =
    normalizeProjectPayload(
      payload
    );

  /*
   * If no display order is provided,
   * put the project at the end.
   */
  if (
    payload.displayOrder ===
    undefined
  ) {
    const lastProject =
      await Project.findOne({})
        .sort({
          displayOrder: -1,
        })
        .select("displayOrder")
        .lean();

    normalized.displayOrder =
      lastProject
        ? Number(
            lastProject.displayOrder
          ) + 1
        : 0;
  }

  const project =
    await Project.create(
      normalized
    );

  return project;
};

/*
|--------------------------------------------------------------------------
| UPDATE PROJECT
|--------------------------------------------------------------------------
*/

const updateProject = async (
  projectId,
  payload
) => {
  const project =
    await getProjectById(
      projectId
    );

  const normalized =
    normalizeProjectPayload(
      payload,
      project
    );

  Object.assign(
    project,
    normalized
  );

  await project.save();

  return project;
};

/*
|--------------------------------------------------------------------------
| DELETE PROJECT
|--------------------------------------------------------------------------
|
| Returns the deleted project so controller can safely delete
| associated Cloudinary assets after MongoDB deletion.
|
*/

const deleteProject = async (
  projectId
) => {
  const project =
    await getProjectById(
      projectId
    );

  const deletedProjectData =
    project.toObject();

  await project.deleteOne();

  return deletedProjectData;
};

/*
|--------------------------------------------------------------------------
| ADD PROJECT IMAGE
|--------------------------------------------------------------------------
|
| Image should already be uploaded to Cloudinary by controller.
|
*/

const addProjectImage =
  async (
    projectId,
    imageData
  ) => {
    const project =
      await getProjectById(
        projectId
      );

    if (
      project.images.length >=
      MAX_IMAGES
    ) {
      throw createServiceError(
        `A maximum of ${MAX_IMAGES} images is allowed per project.`
      );
    }

    const normalizedImage =
      normalizeImageMetadata(
        imageData,
        project.images.length
      );

    /*
     * First image automatically becomes primary.
     */
    if (
      project.images.length ===
      0
    ) {
      normalizedImage.isPrimary =
        true;
    }

    /*
     * If new image is marked primary,
     * remove primary flag from existing images.
     */
    if (
      normalizedImage.isPrimary
    ) {
      project.images =
        project.images.map(
          (image) => {
            image.isPrimary =
              false;

            return image;
          }
        );
    }

    normalizedImage.displayOrder =
      project.images.length;

    project.images.push(
      normalizedImage
    );

    await project.save();

    return project;
  };

/*
|--------------------------------------------------------------------------
| DELETE PROJECT IMAGE
|--------------------------------------------------------------------------
|
| Returns deleted image metadata so controller can remove
| the corresponding Cloudinary asset.
|
*/

const deleteProjectImage =
  async (
    projectId,
    imageId
  ) => {
    const project =
      await getProjectById(
        projectId
      );

    if (
      !mongoose.isValidObjectId(
        imageId
      )
    ) {
      throw createServiceError(
        "Invalid project image ID.",
        400
      );
    }

    const image =
      project.images.id(
        imageId
      );

    if (!image) {
      throw createServiceError(
        "Project image not found.",
        404
      );
    }

    const wasPrimary =
      image.isPrimary;

    const deletedImage =
      image.toObject();

    image.deleteOne();

    /*
     * Recalculate image order.
     */
    project.images.forEach(
      (item, index) => {
        item.displayOrder =
          index;
      }
    );

    /*
     * If the deleted image was primary,
     * automatically make the first remaining image primary.
     */
    if (
      wasPrimary &&
      project.images.length > 0
    ) {
      project.images.forEach(
        (item, index) => {
          item.isPrimary =
            index === 0;
        }
      );
    }

    await project.save();

    return {
      project,
      deletedImage,
    };
  };

/*
|--------------------------------------------------------------------------
| SET PRIMARY PROJECT IMAGE
|--------------------------------------------------------------------------
*/

const setPrimaryProjectImage =
  async (
    projectId,
    imageId
  ) => {
    const project =
      await getProjectById(
        projectId
      );

    if (
      !mongoose.isValidObjectId(
        imageId
      )
    ) {
      throw createServiceError(
        "Invalid project image ID.",
        400
      );
    }

    const targetImage =
      project.images.id(
        imageId
      );

    if (!targetImage) {
      throw createServiceError(
        "Project image not found.",
        404
      );
    }

    project.images.forEach(
      (image) => {
        image.isPrimary =
          image._id.toString() ===
          imageId;
      }
    );

    await project.save();

    return project;
  };

/*
|--------------------------------------------------------------------------
| REORDER PROJECT IMAGES
|--------------------------------------------------------------------------
*/

const reorderProjectImages =
  async (
    projectId,
    orderedImageIds
  ) => {
    const project =
      await getProjectById(
        projectId
      );

    if (
      !Array.isArray(
        orderedImageIds
      )
    ) {
      throw createServiceError(
        "Image order must be an array."
      );
    }

    if (
      orderedImageIds.length !==
      project.images.length
    ) {
      throw createServiceError(
        "Image order must contain every project image exactly once."
      );
    }

    const existingIds =
      project.images.map(
        (image) =>
          image._id.toString()
      );

    const uniqueIds = [
      ...new Set(
        orderedImageIds.map(
          (id) =>
            String(id)
        )
      ),
    ];

    if (
      uniqueIds.length !==
      existingIds.length
    ) {
      throw createServiceError(
        "Image order contains duplicate IDs."
      );
    }

    const allIdsValid =
      uniqueIds.every(
        (id) =>
          existingIds.includes(
            id
          )
      );

    if (!allIdsValid) {
      throw createServiceError(
        "Image order contains an invalid image ID."
      );
    }

    const imageMap =
      new Map(
        project.images.map(
          (image) => [
            image._id.toString(),
            image,
          ]
        )
      );

    const reorderedImages =
      orderedImageIds.map(
        (id, index) => {
          const image =
            imageMap.get(
              String(id)
            );

          image.displayOrder =
            index;

          return image;
        }
      );

    project.images =
      reorderedImages;

    await project.save();

    return project;
  };

/*
|--------------------------------------------------------------------------
| UPDATE PROJECT VISIBILITY
|--------------------------------------------------------------------------
*/

const updateProjectVisibility =
  async (
    projectId,
    isVisible
  ) => {
    const project =
      await getProjectById(
        projectId
      );

    project.isVisible =
      normalizeBoolean(
        isVisible,
        project.isVisible
      );

    await project.save();

    return project;
  };

/*
|--------------------------------------------------------------------------
| UPDATE PROJECT FEATURED
|--------------------------------------------------------------------------
*/

const updateProjectFeatured =
  async (
    projectId,
    isFeatured
  ) => {
    const project =
      await getProjectById(
        projectId
      );

    project.isFeatured =
      normalizeBoolean(
        isFeatured,
        project.isFeatured
      );

    await project.save();

    return project;
  };

/*
|--------------------------------------------------------------------------
| UPDATE PROJECT ACTIVE STATUS
|--------------------------------------------------------------------------
*/

const updateProjectActiveStatus =
  async (
    projectId,
    isActive
  ) => {
    const project =
      await getProjectById(
        projectId
      );

    project.isActive =
      normalizeBoolean(
        isActive,
        project.isActive
      );

    await project.save();

    return project;
  };

/*
|--------------------------------------------------------------------------
| UPDATE PROJECT DISPLAY ORDER
|--------------------------------------------------------------------------
*/

const updateProjectDisplayOrder =
  async (
    projectId,
    displayOrder
  ) => {
    const project =
      await getProjectById(
        projectId
      );

    project.displayOrder =
      normalizeNumber(
        displayOrder,
        "Display order",
        project.displayOrder
      );

    await project.save();

    return project;
  };

/*
|--------------------------------------------------------------------------
| PUBLIC SANITIZATION
|--------------------------------------------------------------------------
|
| Admin-only/internal fields are not exposed.
|
| Project images are intentionally public assets.
|
| Original width/height are returned so the frontend
| can preserve the exact aspect ratio without cropping.
|
*/

const sanitizeProjectForPublic =
  (project) => {
    if (!project) {
      return null;
    }

    const source =
      project.toObject
        ? project.toObject()
        : {
            ...project,
          };

    return {
      id:
        source._id
          ? source._id.toString()
          : source.id,

      title:
        source.title,

      shortDescription:
        source.shortDescription,

      fullDescription:
        source.fullDescription,

      category:
        source.category,

      role:
        source.role,

      technologies:
        Array.isArray(
          source.technologies
        )
          ? source.technologies
          : [],

      features:
        Array.isArray(
          source.features
        )
          ? source.features
          : [],

      images:
        Array.isArray(
          source.images
        )
          ? source.images
              .filter(
                (image) =>
                  image?.url
              )
              .sort(
                (a, b) =>
                  a.displayOrder -
                  b.displayOrder
              )
              .map(
                (image) => ({
                  id:
                    image._id
                      ? image._id.toString()
                      : image.id,

                  url:
                    image.url,

                  originalName:
                    image.originalName,

                  mimeType:
                    image.mimeType,

                  width:
                    image.width,

                  height:
                    image.height,

                  isPrimary:
                    image.isPrimary,

                  displayOrder:
                    image.displayOrder,
                })
              )
          : [],

      links:
        Array.isArray(
          source.links
        )
          ? source.links
              .filter(
                (link) =>
                  link?.visible !==
                  false
              )
              .sort(
                (a, b) =>
                  a.displayOrder -
                  b.displayOrder
              )
              .map(
                (link) => ({
                  id:
                    link._id
                      ? link._id.toString()
                      : link.id,

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
          : [],

      githubUrl:
        source.githubUrl || "",

      liveDemoUrl:
        source.liveDemoUrl || "",

      startDate:
        source.startDate || null,

      endDate:
        source.endDate || null,

      status:
        source.status,

      projectType:
        source.projectType,

      teamSize:
        source.teamSize ?? null,

      futureImprovements:
        source.futureImprovements ||
        "",

      isFeatured:
        source.isFeatured ===
        true,

      displayOrder:
        source.displayOrder ?? 0,
    };
  };

/*
|--------------------------------------------------------------------------
| EXPORTS
|--------------------------------------------------------------------------
*/

module.exports = {
  DEFAULT_PROJECT_DATA,

  MAX_PROJECTS_PER_PAGE,

  MAX_TECHNOLOGIES,
  MAX_FEATURES,
  MAX_IMAGES,
  MAX_LINKS,

  ALLOWED_STATUSES,
  ALLOWED_PROJECT_TYPES,
  ALLOWED_LINK_TYPES,

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

  sanitizeProjectForPublic,

  normalizeProjectPayload,
};