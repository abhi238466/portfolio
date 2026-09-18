const Experience = require("../models/Experience");

/*
|--------------------------------------------------------------------------
| EXPERIENCE SERVICE CONFIGURATION
|--------------------------------------------------------------------------
*/

const MAX_EXPERIENCES_PER_PAGE = 100;
const MAX_RESPONSIBILITIES = 50;
const MAX_TECHNOLOGIES = 30;
const MAX_SKILLS = 30;
const MAX_DOCUMENTS = 10;

const EXPERIENCE_TYPES = [
  "internship",
  "full-time",
  "part-time",
  "freelance",
  "trainee",
  "contract",
  "other",
];

const WORK_MODES = [
  "on-site",
  "hybrid",
  "remote",
  "other",
];

const DOCUMENT_TYPES = [
  "certificate",
  "document",
  "other",
];

/*
|--------------------------------------------------------------------------
| NORMALIZATION HELPERS
|--------------------------------------------------------------------------
*/

const normalizeString = (
  value,
  fieldName,
  maxLength = 1000,
  required = false
) => {
  if (
    value === undefined ||
    value === null
  ) {
    if (required) {
      const error =
        new Error(
          `${fieldName} is required.`
        );

      error.statusCode = 400;

      throw error;
    }

    return "";
  }

  if (
    typeof value !== "string"
  ) {
    const error =
      new Error(
        `${fieldName} must be a string.`
      );

    error.statusCode = 400;

    throw error;
  }

  const normalized =
    value.trim();

  if (
    required &&
    !normalized
  ) {
    const error =
      new Error(
        `${fieldName} is required.`
      );

    error.statusCode = 400;

    throw error;
  }

  if (
    normalized.length >
    maxLength
  ) {
    const error =
      new Error(
        `${fieldName} cannot exceed ${maxLength} characters.`
      );

    error.statusCode = 400;

    throw error;
  }

  return normalized;
};

const normalizeBoolean = (
  value,
  fieldName,
  defaultValue = false
) => {
  if (
    value === undefined ||
    value === null ||
    value === ""
  ) {
    return defaultValue;
  }

  if (
    value === true ||
    value === "true"
  ) {
    return true;
  }

  if (
    value === false ||
    value === "false"
  ) {
    return false;
  }

  const error =
    new Error(
      `${fieldName} must be a boolean.`
    );

  error.statusCode = 400;

  throw error;
};

const normalizeNumber = (
  value,
  fieldName,
  defaultValue = 0,
  minimum = 0
) => {
  if (
    value === undefined ||
    value === null ||
    value === ""
  ) {
    return defaultValue;
  }

  const number =
    Number(value);

  if (
    !Number.isFinite(number)
  ) {
    const error =
      new Error(
        `${fieldName} must be a valid number.`
      );

    error.statusCode = 400;

    throw error;
  }

  if (
    number < minimum
  ) {
    const error =
      new Error(
        `${fieldName} cannot be less than ${minimum}.`
      );

    error.statusCode = 400;

    throw error;
  }

  return number;
};

const normalizeEnum = (
  value,
  fieldName,
  allowedValues,
  defaultValue
) => {
  const normalized =
    normalizeString(
      value,
      fieldName,
      100,
      false
    );

  if (!normalized) {
    return defaultValue;
  }

  if (
    !allowedValues.includes(
      normalized
    )
  ) {
    const error =
      new Error(
        `${fieldName} must be one of: ${allowedValues.join(
          ", "
        )}.`
      );

    error.statusCode = 400;

    throw error;
  }

  return normalized;
};

const normalizeDate = (
  value,
  fieldName,
  required = false
) => {
  if (
    value === undefined ||
    value === null ||
    value === ""
  ) {
    if (required) {
      const error =
        new Error(
          `${fieldName} is required.`
        );

      error.statusCode = 400;

      throw error;
    }

    return null;
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    const error =
      new Error(
        `${fieldName} must be a valid date.`
      );

    error.statusCode = 400;

    throw error;
  }

  return date;
};

const normalizeUrl = (
  value,
  fieldName,
  required = false
) => {
  const normalized =
    normalizeString(
      value,
      fieldName,
      1000,
      required
    );

  if (!normalized) {
    return "";
  }

  try {
    const url =
      new URL(normalized);

    if (
      url.protocol !==
        "http:" &&
      url.protocol !==
        "https:"
    ) {
      throw new Error();
    }
  } catch {
    const error =
      new Error(
        `${fieldName} must be a valid HTTP/HTTPS URL.`
      );

    error.statusCode = 400;

    throw error;
  }

  return normalized;
};

const normalizeStringArray = (
  value,
  fieldName,
  maxItems,
  maxItemLength = 200
) => {
  if (
    value === undefined ||
    value === null
  ) {
    return [];
  }

  if (
    !Array.isArray(value)
  ) {
    const error =
      new Error(
        `${fieldName} must be an array.`
      );

    error.statusCode = 400;

    throw error;
  }

  if (
    value.length >
    maxItems
  ) {
    const error =
      new Error(
        `${fieldName} cannot contain more than ${maxItems} items.`
      );

    error.statusCode = 400;

    throw error;
  }

  const result = [];

  for (
    const item of value
  ) {
    const normalized =
      normalizeString(
        item,
        fieldName,
        maxItemLength,
        true
      );

    if (
      !result.some(
        (existing) =>
          existing.toLowerCase() ===
          normalized.toLowerCase()
      )
    ) {
      result.push(
        normalized
      );
    }
  }

  return result;
};

/*
|--------------------------------------------------------------------------
| DOCUMENT METADATA NORMALIZATION
|--------------------------------------------------------------------------
*/

const normalizeDocumentMetadata = (
  value
) => {
  if (
    value === undefined ||
    value === null
  ) {
    return [];
  }

  if (
    !Array.isArray(value)
  ) {
    const error =
      new Error(
        "Documents must be an array."
      );

    error.statusCode = 400;

    throw error;
  }

  if (
    value.length >
    MAX_DOCUMENTS
  ) {
    const error =
      new Error(
        `A maximum of ${MAX_DOCUMENTS} documents are allowed per experience.`
      );

    error.statusCode = 400;

    throw error;
  }

  return value.map(
    (
      document,
      index
    ) => {
      if (
        !document ||
        typeof document !==
          "object"
      ) {
        const error =
          new Error(
            `Document ${index + 1} must be a valid object.`
          );

        error.statusCode = 400;

        throw error;
      }

      const publicId =
        normalizeString(
          document.publicId,
          `Document ${index + 1} publicId`,
          500,
          true
        );

      const url =
        normalizeString(
          document.url,
          `Document ${index + 1} URL`,
          2000,
          false
        );

      const originalName =
        normalizeString(
          document.originalName,
          `Document ${index + 1} originalName`,
          255,
          true
        );

      const mimeType =
        normalizeString(
          document.mimeType,
          `Document ${index + 1} mimeType`,
          100,
          true
        );

      const resourceType =
        normalizeEnum(
          document.resourceType,
          `Document ${index + 1} resourceType`,
          [
            "image",
            "raw",
          ],
          "raw"
        );

      const deliveryType =
        normalizeEnum(
          document.deliveryType,
          `Document ${index + 1} deliveryType`,
          [
            "authenticated",
            "upload",
          ],
          "authenticated"
        );

      const size =
        normalizeNumber(
          document.size,
          `Document ${index + 1} size`,
          0,
          1
        );

      const width =
        document.width ===
          null ||
        document.width ===
          undefined ||
        document.width ===
          ""
          ? null
          : normalizeNumber(
              document.width,
              `Document ${index + 1} width`,
              0,
              1
            );

      const height =
        document.height ===
          null ||
        document.height ===
          undefined ||
        document.height ===
          ""
          ? null
          : normalizeNumber(
              document.height,
              `Document ${index + 1} height`,
              0,
              1
            );

      const documentType =
        normalizeEnum(
          document.documentType,
          `Document ${index + 1} documentType`,
          DOCUMENT_TYPES,
          "certificate"
        );

      const displayOrder =
        normalizeNumber(
          document.displayOrder,
          `Document ${index + 1} displayOrder`,
          index,
          0
        );

      return {
        publicId,
        url,
        originalName,
        mimeType,
        resourceType,
        deliveryType,
        size,
        width,
        height,
        documentType,
        displayOrder,
      };
    }
  );
};

/*
|--------------------------------------------------------------------------
| CREATE / UPDATE NORMALIZATION
|--------------------------------------------------------------------------
*/

const normalizeExperiencePayload = (
  payload = {},
  existingExperience = null
) => {
  const currentlyWorking =
    normalizeBoolean(
      payload.currentlyWorking,
      "Currently Working",
      existingExperience?.currentlyWorking ||
        false
    );

  const startDate =
    normalizeDate(
      payload.startDate,
      "Start Date",
      true
    );

  const endDate =
    currentlyWorking
      ? null
      : normalizeDate(
          payload.endDate,
          "End Date",
          false
        );

  if (
    endDate &&
    startDate &&
    endDate < startDate
  ) {
    const error =
      new Error(
        "End Date cannot be earlier than Start Date."
      );

    error.statusCode = 400;

    throw error;
  }

  const relatedProject =
    payload.relatedProject ===
      undefined ||
    payload.relatedProject ===
      null ||
    payload.relatedProject ===
      ""
      ? existingExperience?.relatedProject ||
        null
      : payload.relatedProject;

  if (
    relatedProject &&
    !/^[a-fA-F0-9]{24}$/.test(
      String(relatedProject)
    )
  ) {
    const error =
      new Error(
        "Related Project must be a valid project ID."
      );

    error.statusCode = 400;

    throw error;
  }

  const documents =
    payload.documents !==
      undefined
      ? normalizeDocumentMetadata(
          payload.documents
        )
      : existingExperience
        ? existingExperience.documents
        : [];

  return {
    companyName:
      normalizeString(
        payload.companyName,
        "Company Name",
        200,
        true
      ),

    companyWebsite:
      normalizeUrl(
        payload.companyWebsite,
        "Company Website",
        false
      ),

    role:
      normalizeString(
        payload.role,
        "Role / Designation",
        200,
        true
      ),

    experienceType:
      normalizeEnum(
        payload.experienceType,
        "Experience Type",
        EXPERIENCE_TYPES,
        existingExperience?.experienceType ||
          "internship"
      ),

    startDate,

    endDate,

    currentlyWorking,

    duration:
      normalizeString(
        payload.duration,
        "Duration",
        100,
        false
      ),

    location:
      normalizeString(
        payload.location,
        "Location",
        200,
        false
      ),

    workMode:
      normalizeEnum(
        payload.workMode,
        "Work Mode",
        WORK_MODES,
        existingExperience?.workMode ||
          "on-site"
      ),

    description:
      normalizeString(
        payload.description,
        "Description",
        3000,
        false
      ),

    responsibilities:
      payload.responsibilities !==
      undefined
        ? normalizeStringArray(
            payload.responsibilities,
            "Responsibilities",
            MAX_RESPONSIBILITIES,
            500
          )
        : existingExperience
          ? existingExperience.responsibilities
          : [],

    technologies:
      payload.technologies !==
      undefined
        ? normalizeStringArray(
            payload.technologies,
            "Technologies",
            MAX_TECHNOLOGIES,
            100
          )
        : existingExperience
          ? existingExperience.technologies
          : [],

    skills:
      payload.skills !==
      undefined
        ? normalizeStringArray(
            payload.skills,
            "Skills",
            MAX_SKILLS,
            100
          )
        : existingExperience
          ? existingExperience.skills
          : [],

    relatedProject,

    documents,

    certificateUrl:
      normalizeUrl(
        payload.certificateUrl,
        "Certificate URL",
        false
      ),

    isVisible:
      normalizeBoolean(
        payload.isVisible,
        "Public Visibility",
        existingExperience?.isVisible !==
          false
      ),

    isFeatured:
      normalizeBoolean(
        payload.isFeatured,
        "Featured",
        existingExperience?.isFeatured ===
          true
      ),

    displayOrder:
      normalizeNumber(
        payload.displayOrder,
        "Display Order",
        existingExperience?.displayOrder ||
          0,
        0
      ),

    isActive:
      normalizeBoolean(
        payload.isActive,
        "Active",
        existingExperience?.isActive !==
          false
      ),
  };
};

/*
|--------------------------------------------------------------------------
| PUBLIC SANITIZATION
|--------------------------------------------------------------------------
|
| Public response includes the already-generated document URL.
|
*/

const sanitizeExperienceForPublic = (
  experience
) => {
  if (!experience) {
    return null;
  }

  const experienceObject =
    typeof experience.toObject ===
    "function"
      ? experience.toObject()
      : experience;

  return {
    id:
      experienceObject._id,

    companyName:
      experienceObject.companyName,

    companyWebsite:
      experienceObject.companyWebsite,

    role:
      experienceObject.role,

    experienceType:
      experienceObject.experienceType,

    startDate:
      experienceObject.startDate,

    endDate:
      experienceObject.endDate,

    currentlyWorking:
      experienceObject.currentlyWorking,

    duration:
      experienceObject.duration,

    location:
      experienceObject.location,

    workMode:
      experienceObject.workMode,

    description:
      experienceObject.description,

    responsibilities:
      experienceObject.responsibilities,

    technologies:
      experienceObject.technologies,

    skills:
      experienceObject.skills,

    relatedProject:
      experienceObject.relatedProject,

    /*
    |--------------------------------------------------------------------------
    | DOCUMENT METADATA
    |--------------------------------------------------------------------------
    */

    documents:
      Array.isArray(
        experienceObject.documents
      )
        ? experienceObject.documents.map(
            (document) => ({
              id:
                document._id,

              url:
                document.url,

              originalName:
                document.originalName,

              mimeType:
                document.mimeType,

              size:
                document.size,

              width:
                document.width,

              height:
                document.height,

              documentType:
                document.documentType,

              displayOrder:
                document.displayOrder,
            })
          )
        : [],

    certificateUrl:
      experienceObject.certificateUrl,

    isVisible:
      experienceObject.isVisible,

    isFeatured:
      experienceObject.isFeatured,

    displayOrder:
      experienceObject.displayOrder,

    isActive:
      experienceObject.isActive,

    createdAt:
      experienceObject.createdAt,

    updatedAt:
      experienceObject.updatedAt,
  };
};

/*
|--------------------------------------------------------------------------
| ADMIN GET ALL EXPERIENCES
|--------------------------------------------------------------------------
*/

const getAdminExperiences =
  async () => {
    return Experience.find()
      .sort({
        displayOrder: 1,
        startDate: -1,
        createdAt: -1,
      })
      .limit(
        MAX_EXPERIENCES_PER_PAGE
      );
  };

/*
|--------------------------------------------------------------------------
| PUBLIC GET ALL EXPERIENCES
|--------------------------------------------------------------------------
*/

const getPublicExperiences =
  async () => {
    const experiences =
      await Experience.find({
        isActive: true,
        isVisible: true,
      })
        .sort({
          displayOrder: 1,
          startDate: -1,
          createdAt: -1,
        })
        .limit(
          MAX_EXPERIENCES_PER_PAGE
        );

    return experiences.map(
      sanitizeExperienceForPublic
    );
  };

/*
|--------------------------------------------------------------------------
| GET EXPERIENCE BY ID
|--------------------------------------------------------------------------
*/

const getExperienceById =
  async (experienceId) => {
    const experience =
      await Experience.findById(
        experienceId
      );

    if (!experience) {
      const error =
        new Error(
          "Experience not found."
        );

      error.statusCode = 404;

      throw error;
    }

    return experience;
  };

/*
|--------------------------------------------------------------------------
| GET PUBLIC EXPERIENCE BY ID
|--------------------------------------------------------------------------
*/

const getPublicExperienceById =
  async (experienceId) => {
    const experience =
      await Experience.findOne({
        _id: experienceId,
        isActive: true,
        isVisible: true,
      });

    if (!experience) {
      const error =
        new Error(
          "Experience not found."
        );

      error.statusCode = 404;

      throw error;
    }

    return sanitizeExperienceForPublic(
      experience
    );
  };

/*
|--------------------------------------------------------------------------
| CREATE EXPERIENCE
|--------------------------------------------------------------------------
*/

const createExperience =
  async (payload) => {
    const normalizedPayload =
      normalizeExperiencePayload(
        payload
      );

    const experience =
      await Experience.create(
        normalizedPayload
      );

    return experience;
  };

/*
|--------------------------------------------------------------------------
| UPDATE EXPERIENCE
|--------------------------------------------------------------------------
*/

const updateExperience =
  async (
    experienceId,
    payload
  ) => {
    const existingExperience =
      await getExperienceById(
        experienceId
      );

    const normalizedPayload =
      normalizeExperiencePayload(
        payload,
        existingExperience
      );

    Object.assign(
      existingExperience,
      normalizedPayload
    );

    await existingExperience.save();

    return existingExperience;
  };

/*
|--------------------------------------------------------------------------
| DELETE EXPERIENCE
|--------------------------------------------------------------------------
|
| IMPORTANT:
| The controller can use the returned deleted experience document to
| delete all associated Cloudinary assets before/after MongoDB cleanup.
|
*/

const deleteExperience =
  async (experienceId) => {
    const experience =
      await getExperienceById(
        experienceId
      );

    await Experience.findByIdAndDelete(
      experienceId
    );

    return experience;
  };

/*
|--------------------------------------------------------------------------
| ADD DOCUMENT METADATA
|--------------------------------------------------------------------------
*/

const addExperienceDocument =
  async (
    experienceId,
    documentMetadata
  ) => {
    const experience =
      await getExperienceById(
        experienceId
      );

    const currentDocuments =
      Array.isArray(
        experience.documents
      )
        ? experience.documents
        : [];

    if (
      currentDocuments.length >=
      MAX_DOCUMENTS
    ) {
      const error =
        new Error(
          `Maximum ${MAX_DOCUMENTS} documents are allowed per experience.`
        );

      error.statusCode = 400;

      throw error;
    }

    const normalizedDocuments =
      normalizeDocumentMetadata([
        ...currentDocuments.map(
          (document) =>
            typeof document.toObject ===
            "function"
              ? document.toObject()
              : document
        ),
        documentMetadata,
      ]);

    experience.documents =
      normalizedDocuments;

    await experience.save();

    return experience;
  };

/*
|--------------------------------------------------------------------------
| DELETE DOCUMENT
|--------------------------------------------------------------------------
*/

const deleteExperienceDocument =
  async (
    experienceId,
    documentId
  ) => {
    const experience =
      await getExperienceById(
        experienceId
      );

    const document =
      experience.documents.find(
        (item) =>
          String(item._id) ===
          String(documentId)
      );

    if (!document) {
      const error =
        new Error(
          "Experience document not found."
        );

      error.statusCode = 404;

      throw error;
    }

    experience.documents =
      experience.documents.filter(
        (item) =>
          String(item._id) !==
          String(documentId)
      );

    experience.documents =
      experience.documents.map(
        (
          item,
          index
        ) => ({
          ...item.toObject(),
          displayOrder: index,
        })
      );

    await experience.save();

    return {
      experience,
      deletedDocument:
        document,
    };
  };

/*
|--------------------------------------------------------------------------
| SET PRIMARY / DOCUMENT ORDER
|--------------------------------------------------------------------------
|
| Documents are independently ordered. There is no primary document
| requirement because an experience may have multiple certificates
| or supporting documents.
|
*/

const reorderExperienceDocuments =
  async (
    experienceId,
    orderedDocumentIds
  ) => {
    if (
      !Array.isArray(
        orderedDocumentIds
      )
    ) {
      const error =
        new Error(
          "orderedDocumentIds must be an array."
        );

      error.statusCode = 400;

      throw error;
    }

    const experience =
      await getExperienceById(
        experienceId
      );

    const documents =
      experience.documents || [];

    if (
      orderedDocumentIds.length !==
      documents.length
    ) {
      const error =
        new Error(
          "All experience document IDs must be included when reordering."
        );

      error.statusCode = 400;

      throw error;
    }

    const documentMap =
      new Map(
        documents.map(
          (document) => [
            String(
              document._id
            ),
            document,
          ]
        )
      );

    const reordered =
      orderedDocumentIds.map(
        (documentId) => {
          const document =
            documentMap.get(
              String(
                documentId
              )
            );

          if (!document) {
            const error =
              new Error(
                "One or more document IDs are invalid."
              );

            error.statusCode = 400;

            throw error;
          }

          return document;
        }
      );

    experience.documents =
      reordered.map(
        (
          document,
          index
        ) => ({
          ...document.toObject(),
          displayOrder: index,
        })
      );

    await experience.save();

    return experience;
  };

/*
|--------------------------------------------------------------------------
| UPDATE VISIBILITY
|--------------------------------------------------------------------------
*/

const updateExperienceVisibility =
  async (
    experienceId,
    isVisible
  ) => {
    const experience =
      await getExperienceById(
        experienceId
      );

    experience.isVisible =
      normalizeBoolean(
        isVisible,
        "Public Visibility",
        experience.isVisible
      );

    await experience.save();

    return experience;
  };

/*
|--------------------------------------------------------------------------
| UPDATE FEATURED
|--------------------------------------------------------------------------
*/

const updateExperienceFeatured =
  async (
    experienceId,
    isFeatured
  ) => {
    const experience =
      await getExperienceById(
        experienceId
      );

    experience.isFeatured =
      normalizeBoolean(
        isFeatured,
        "Featured",
        experience.isFeatured
      );

    await experience.save();

    return experience;
  };

/*
|--------------------------------------------------------------------------
| UPDATE ACTIVE STATUS
|--------------------------------------------------------------------------
*/

const updateExperienceActiveStatus =
  async (
    experienceId,
    isActive
  ) => {
    const experience =
      await getExperienceById(
        experienceId
      );

    experience.isActive =
      normalizeBoolean(
        isActive,
        "Active",
        experience.isActive
      );

    await experience.save();

    return experience;
  };

/*
|--------------------------------------------------------------------------
| UPDATE DISPLAY ORDER
|--------------------------------------------------------------------------
*/

const updateExperienceDisplayOrder =
  async (
    experienceId,
    displayOrder
  ) => {
    const experience =
      await getExperienceById(
        experienceId
      );

    experience.displayOrder =
      normalizeNumber(
        displayOrder,
        "Display Order",
        experience.displayOrder,
        0
      );

    await experience.save();

    return experience;
  };

/*
|--------------------------------------------------------------------------
| EXPORTS
|--------------------------------------------------------------------------
*/

module.exports = {
  MAX_EXPERIENCES_PER_PAGE,
  MAX_RESPONSIBILITIES,
  MAX_TECHNOLOGIES,
  MAX_SKILLS,
  MAX_DOCUMENTS,

  EXPERIENCE_TYPES,
  WORK_MODES,
  DOCUMENT_TYPES,

  normalizeExperiencePayload,
  normalizeDocumentMetadata,

  sanitizeExperienceForPublic,

  getAdminExperiences,
  getPublicExperiences,
  getExperienceById,
  getPublicExperienceById,

  createExperience,
  updateExperience,
  deleteExperience,

  addExperienceDocument,
  deleteExperienceDocument,
  reorderExperienceDocuments,

  updateExperienceVisibility,
  updateExperienceFeatured,
  updateExperienceActiveStatus,
  updateExperienceDisplayOrder,
};