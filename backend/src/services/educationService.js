const mongoose = require("mongoose");

const Education = require("../models/Education");
const {
  deleteCloudinaryAsset,
} = require("./cloudinaryService");

/*
|--------------------------------------------------------------------------
| EDUCATION SERVICE CONSTANTS
|--------------------------------------------------------------------------
*/

const MAX_EDUCATION_PER_PAGE = 100;

const MAX_HIGHLIGHTS = 30;

const MAX_DOCUMENTS = 10;

const MAX_TEXT_LENGTH = {
  degreeName: 200,
  institutionName: 250,
  boardOrUniversity: 250,
  fieldOfStudy: 200,
  location: 200,
  duration: 100,
  grade: 100,
  description: 2000,
  officialVerificationUrl: 1000,
};

const EDUCATION_LEVELS = [
  "class-10",
  "class-12",
  "graduation",
  "post-graduation",
  "diploma",
  "certification",
  "other",
];

const DOCUMENT_TYPES = [
  "marksheet",
  "certificate",
  "degree",
  "transcript",
  "other",
];

/*
|--------------------------------------------------------------------------
| NORMALIZATION HELPERS
|--------------------------------------------------------------------------
*/

const normalizeString = (
  value
) => {
  if (
    value === undefined ||
    value === null
  ) {
    return "";
  }

  return String(value).trim();
};

const normalizeOptionalString = (
  value,
  maxLength
) => {
  const normalized =
    normalizeString(value);

  if (!normalized) {
    return "";
  }

  return normalized.slice(
    0,
    maxLength
  );
};

const normalizeBoolean = (
  value,
  defaultValue = false
) => {
  if (
    value === undefined ||
    value === null
  ) {
    return defaultValue;
  }

  if (typeof value === "boolean") {
    return value;
  }

  if (
    value === "true" ||
    value === "1" ||
    value === 1
  ) {
    return true;
  }

  if (
    value === "false" ||
    value === "0" ||
    value === 0
  ) {
    return false;
  }

  return defaultValue;
};

const normalizeNumber = (
  value,
  defaultValue = null
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

  if (!Number.isFinite(number)) {
    return defaultValue;
  }

  return number;
};

const normalizeArray = (
  value,
  maxItems
) => {
  if (
    value === undefined ||
    value === null
  ) {
    return [];
  }

  let items = [];

  if (Array.isArray(value)) {
    items = value;
  } else if (
    typeof value === "string"
  ) {
    items = value.split(",");
  }

  return items
    .map((item) =>
      normalizeString(item)
    )
    .filter(Boolean)
    .slice(0, maxItems);
};

const normalizeDate = (
  value
) => {
  if (
    value === undefined ||
    value === null ||
    value === ""
  ) {
    return null;
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return null;
  }

  return date;
};

const isValidObjectId = (
  value
) => {
  return mongoose.Types.ObjectId.isValid(
    value
  );
};

/*
|--------------------------------------------------------------------------
| EDUCATION DATA NORMALIZATION
|--------------------------------------------------------------------------
*/

const normalizeEducationData = (
  payload = {},
  existingEducation = null
) => {
  const data = {};

  /*
   * ---------------------------------------------------------------
   * EDUCATION LEVEL
   * ---------------------------------------------------------------
   */

  if (
    payload.educationLevel !==
      undefined
  ) {
    data.educationLevel =
      normalizeString(
        payload.educationLevel
      ).toLowerCase();
  }

  /*
   * ---------------------------------------------------------------
   * BASIC INFORMATION
   * ---------------------------------------------------------------
   */

  if (
    payload.degreeName !==
      undefined
  ) {
    data.degreeName =
      normalizeOptionalString(
        payload.degreeName,
        MAX_TEXT_LENGTH.degreeName
      );
  }

  if (
    payload.institutionName !==
      undefined
  ) {
    data.institutionName =
      normalizeOptionalString(
        payload.institutionName,
        MAX_TEXT_LENGTH.institutionName
      );
  }

  if (
    payload.boardOrUniversity !==
      undefined
  ) {
    data.boardOrUniversity =
      normalizeOptionalString(
        payload.boardOrUniversity,
        MAX_TEXT_LENGTH.boardOrUniversity
      );
  }

  if (
    payload.fieldOfStudy !==
      undefined
  ) {
    data.fieldOfStudy =
      normalizeOptionalString(
        payload.fieldOfStudy,
        MAX_TEXT_LENGTH.fieldOfStudy
      );
  }

  if (
    payload.location !==
      undefined
  ) {
    data.location =
      normalizeOptionalString(
        payload.location,
        MAX_TEXT_LENGTH.location
      );
  }

  /*
   * ---------------------------------------------------------------
   * DATES
   * ---------------------------------------------------------------
   */

  if (
    payload.startDate !==
      undefined
  ) {
    data.startDate =
      normalizeDate(
        payload.startDate
      );
  }

  if (
    payload.endDate !==
      undefined
  ) {
    data.endDate =
      normalizeDate(
        payload.endDate
      );
  }

  if (
    payload.currentlyStudying !==
      undefined
  ) {
    data.currentlyStudying =
      normalizeBoolean(
        payload.currentlyStudying,
        false
      );
  }

  /*
   * ---------------------------------------------------------------
   * ACADEMIC DETAILS
   * ---------------------------------------------------------------
   */

  if (
    payload.duration !==
      undefined
  ) {
    data.duration =
      normalizeOptionalString(
        payload.duration,
        MAX_TEXT_LENGTH.duration
      );
  }

  if (
    payload.grade !==
      undefined
  ) {
    data.grade =
      normalizeOptionalString(
        payload.grade,
        MAX_TEXT_LENGTH.grade
      );
  }

  if (
    payload.percentage !==
      undefined
  ) {
    data.percentage =
      normalizeNumber(
        payload.percentage
      );
  }

  if (
    payload.cgpa !==
      undefined
  ) {
    data.cgpa =
      normalizeNumber(
        payload.cgpa
      );
  }

  /*
   * ---------------------------------------------------------------
   * DESCRIPTION
   * ---------------------------------------------------------------
   */

  if (
    payload.description !==
      undefined
  ) {
    data.description =
      normalizeOptionalString(
        payload.description,
        MAX_TEXT_LENGTH.description
      );
  }

  /*
   * ---------------------------------------------------------------
   * HIGHLIGHTS
   * ---------------------------------------------------------------
   */

  if (
    payload.highlights !==
      undefined
  ) {
    data.highlights =
      normalizeArray(
        payload.highlights,
        MAX_HIGHLIGHTS
      );
  }

  /*
   * ---------------------------------------------------------------
   * VERIFICATION URL
   * ---------------------------------------------------------------
   */

  if (
    payload.officialVerificationUrl !==
      undefined
  ) {
    data.officialVerificationUrl =
      normalizeOptionalString(
        payload.officialVerificationUrl,
        MAX_TEXT_LENGTH.officialVerificationUrl
      );
  }

  /*
   * ---------------------------------------------------------------
   * PUBLIC / CMS FLAGS
   * ---------------------------------------------------------------
   */

  if (
    payload.isVisible !==
      undefined
  ) {
    data.isVisible =
      normalizeBoolean(
        payload.isVisible,
        true
      );
  }

  if (
    payload.isFeatured !==
      undefined
  ) {
    data.isFeatured =
      normalizeBoolean(
        payload.isFeatured,
        false
      );
  }

  if (
    payload.displayOrder !==
      undefined
  ) {
    const displayOrder =
      normalizeNumber(
        payload.displayOrder,
        0
      );

    data.displayOrder =
      Math.max(
        0,
        Math.floor(
          displayOrder || 0
        )
      );
  }

  if (
    payload.isActive !==
      undefined
  ) {
    data.isActive =
      normalizeBoolean(
        payload.isActive,
        true
      );
  }

  return data;
};

/*
|--------------------------------------------------------------------------
| VALIDATION
|--------------------------------------------------------------------------
*/

const validateEducationData = (
  data,
  {
    isCreate = false,
    existingEducation = null,
  } = {}
) => {
  const errors = [];

  /*
   * ---------------------------------------------------------------
   * REQUIRED FIELDS
   * ---------------------------------------------------------------
   */

  const educationLevel =
    data.educationLevel ??
    existingEducation?.educationLevel;

  const degreeName =
    data.degreeName ??
    existingEducation?.degreeName;

  const institutionName =
    data.institutionName ??
    existingEducation?.institutionName;

  const startDate =
    data.startDate ??
    existingEducation?.startDate;

  if (!educationLevel) {
    errors.push(
      "Education level is required."
    );
  } else if (
    !EDUCATION_LEVELS.includes(
      educationLevel
    )
  ) {
    errors.push(
      "Invalid education level."
    );
  }

  if (!degreeName) {
    errors.push(
      "Degree or qualification name is required."
    );
  }

  if (!institutionName) {
    errors.push(
      "Institution name is required."
    );
  }

  if (!startDate) {
    errors.push(
      "Start date is required."
    );
  }

  /*
   * ---------------------------------------------------------------
   * DATE VALIDATION
   * ---------------------------------------------------------------
   */

  const normalizedStartDate =
    normalizeDate(
      startDate
    );

  if (
    startDate &&
    !normalizedStartDate
  ) {
    errors.push(
      "Please provide a valid start date."
    );
  }

  const endDate =
    data.endDate !== undefined
      ? data.endDate
      : existingEducation?.endDate;

  const currentlyStudying =
    data.currentlyStudying !==
    undefined
      ? data.currentlyStudying
      : existingEducation?.currentlyStudying;

  const normalizedEndDate =
    normalizeDate(
      endDate
    );

  if (
    endDate &&
    !normalizedEndDate
  ) {
    errors.push(
      "Please provide a valid end date."
    );
  }

  if (
    normalizedStartDate &&
    normalizedEndDate &&
    normalizedEndDate <
      normalizedStartDate
  ) {
    errors.push(
      "End date cannot be before the start date."
    );
  }

  if (
    currentlyStudying &&
    endDate
  ) {
    errors.push(
      "End date should be empty while currently studying."
    );
  }

  /*
   * ---------------------------------------------------------------
   * PERCENTAGE VALIDATION
   * ---------------------------------------------------------------
   */

  const percentage =
    data.percentage !== undefined
      ? data.percentage
      : existingEducation?.percentage;

  if (
    percentage !== null &&
    percentage !== undefined &&
    percentage !== ""
  ) {
    if (
      !Number.isFinite(
        Number(percentage)
      ) ||
      Number(percentage) < 0 ||
      Number(percentage) > 100
    ) {
      errors.push(
        "Percentage must be between 0 and 100."
      );
    }
  }

  /*
   * ---------------------------------------------------------------
   * CGPA VALIDATION
   * ---------------------------------------------------------------
   */

  const cgpa =
    data.cgpa !== undefined
      ? data.cgpa
      : existingEducation?.cgpa;

  if (
    cgpa !== null &&
    cgpa !== undefined &&
    cgpa !== ""
  ) {
    if (
      !Number.isFinite(
        Number(cgpa)
      ) ||
      Number(cgpa) < 0
    ) {
      errors.push(
        "CGPA must be a valid positive number."
      );
    }
  }

  /*
   * ---------------------------------------------------------------
   * ARRAY LIMITS
   * ---------------------------------------------------------------
   */

  if (
    Array.isArray(
      data.highlights
    ) &&
    data.highlights.length >
      MAX_HIGHLIGHTS
  ) {
    errors.push(
      `Maximum ${MAX_HIGHLIGHTS} highlights are allowed.`
    );
  }

  /*
   * ---------------------------------------------------------------
   * CREATE VALIDATION
   * ---------------------------------------------------------------
   */

  if (
    isCreate &&
    !degreeName
  ) {
    errors.push(
      "Degree or qualification name is required."
    );
  }

  return errors;
};

/*
|--------------------------------------------------------------------------
| DOCUMENT NORMALIZATION
|--------------------------------------------------------------------------
*/

const normalizeDocumentData = (
  document = {},
  index = 0
) => {
  const resourceType =
    normalizeString(
      document.resourceType
    ) || "raw";

  const deliveryType =
    normalizeString(
      document.deliveryType
    ) || "authenticated";

  const documentType =
    normalizeString(
      document.documentType
    ).toLowerCase() ||
    "marksheet";

  return {
    publicId:
      normalizeString(
        document.publicId
      ),

    url:
      normalizeString(
        document.url
      ),

    originalName:
      normalizeString(
        document.originalName
      ),

    mimeType:
      normalizeString(
        document.mimeType
      ),

    resourceType:
      resourceType === "image"
        ? "image"
        : "raw",

    deliveryType:
      deliveryType === "upload"
        ? "upload"
        : "authenticated",

    size:
      Math.max(
        0,
        normalizeNumber(
          document.size,
          0
        )
      ),

    width:
      normalizeNumber(
        document.width
      ),

    height:
      normalizeNumber(
        document.height
      ),

    documentType:
      DOCUMENT_TYPES.includes(
        documentType
      )
        ? documentType
        : "other",

    displayOrder:
      Math.max(
        0,
        Math.floor(
          normalizeNumber(
            document.displayOrder,
            index
          ) || 0
        )
      ),
  };
};

/*
|--------------------------------------------------------------------------
| DOCUMENT VALIDATION
|--------------------------------------------------------------------------
*/

const validateDocumentData = (
  document
) => {
  const errors = [];

  if (!document.publicId) {
    errors.push(
      "Document Cloudinary public ID is required."
    );
  }

  if (!document.url) {
    errors.push(
      "Document URL is required."
    );
  }

  if (!document.originalName) {
    errors.push(
      "Document original name is required."
    );
  }

  if (!document.mimeType) {
    errors.push(
      "Document MIME type is required."
    );
  }

  if (
    !DOCUMENT_TYPES.includes(
      document.documentType
    )
  ) {
    errors.push(
      "Invalid education document type."
    );
  }

  return errors;
};

/*
|--------------------------------------------------------------------------
| ADMIN DOCUMENT SERIALIZER
|--------------------------------------------------------------------------
*/

const serializeDocumentForAdmin = (
  document
) => {
  if (!document) {
    return null;
  }

  return {
    id:
      document._id
        ? document._id.toString()
        : document.id || null,

    publicId:
      document.publicId || "",

    url:
      document.url || "",

    originalName:
      document.originalName || "",

    mimeType:
      document.mimeType || "",

    resourceType:
      document.resourceType || "raw",

    deliveryType:
      document.deliveryType ||
      "authenticated",

    size:
      document.size || 0,

    width:
      document.width ?? null,

    height:
      document.height ?? null,

    documentType:
      document.documentType ||
      "other",

    displayOrder:
      Number.isFinite(
        Number(
          document.displayOrder
        )
      )
        ? Number(
            document.displayOrder
          )
        : 0,
  };
};

/*
|--------------------------------------------------------------------------
| PUBLIC DOCUMENT SERIALIZER
|--------------------------------------------------------------------------
|
| Permanent Cloudinary publicId and storage URL are intentionally
| not exposed through public education responses.
|
*/

const serializeDocumentForPublic = (
  document
) => {
  if (!document) {
    return null;
  }

  return {
    id:
      document._id
        ? document._id.toString()
        : document.id || null,

    url:
      document.url || "",

    originalName:
      document.originalName || "",

    mimeType:
      document.mimeType || "",

    size:
      document.size || 0,

    width:
      document.width ?? null,

    height:
      document.height ?? null,

    documentType:
      document.documentType ||
      "other",

    displayOrder:
      Number.isFinite(
        Number(
          document.displayOrder
        )
      )
        ? Number(
            document.displayOrder
          )
        : 0,
  };
};

/*
|--------------------------------------------------------------------------
| ADMIN SERIALIZER
|--------------------------------------------------------------------------
*/

const serializeEducationForAdmin = (
  education
) => {
  if (!education) {
    return null;
  }

  const plain =
    education.toObject
      ? education.toObject()
      : education;

  return {
    ...plain,

    _id:
      plain._id
        ? plain._id.toString()
        : plain._id,

    documents:
      Array.isArray(
        plain.documents
      )
        ? plain.documents
            .sort(
              (a, b) =>
                Number(
                  a.displayOrder || 0
                ) -
                Number(
                  b.displayOrder || 0
                )
            )
            .map(
              serializeDocumentForAdmin
            )
        : [],
  };
};

/*
|--------------------------------------------------------------------------
| PUBLIC SERIALIZER
|--------------------------------------------------------------------------
*/

const serializeEducationForPublic = (
  education
) => {
  if (!education) {
    return null;
  }

  const plain =
    education.toObject
      ? education.toObject()
      : education;

  return {
    _id:
      plain._id
        ? plain._id.toString()
        : plain._id,

    educationLevel:
      plain.educationLevel,

    degreeName:
      plain.degreeName,

    institutionName:
      plain.institutionName,

    boardOrUniversity:
      plain.boardOrUniversity || "",

    fieldOfStudy:
      plain.fieldOfStudy || "",

    location:
      plain.location || "",

    startDate:
      plain.startDate || null,

    endDate:
      plain.endDate || null,

    currentlyStudying:
      Boolean(
        plain.currentlyStudying
      ),

    duration:
      plain.duration || "",

    grade:
      plain.grade || "",

    percentage:
      plain.percentage ?? null,

    cgpa:
      plain.cgpa ?? null,

    description:
      plain.description || "",

    highlights:
      Array.isArray(
        plain.highlights
      )
        ? plain.highlights
        : [],

    officialVerificationUrl:
      plain.officialVerificationUrl ||
      "",

    documents:
      Array.isArray(
        plain.documents
      )
        ? plain.documents
            .sort(
              (a, b) =>
                Number(
                  a.displayOrder || 0
                ) -
                Number(
                  b.displayOrder || 0
                )
            )
            .map(
              serializeDocumentForPublic
            )
        : [],

    isFeatured:
      Boolean(
        plain.isFeatured
      ),

    displayOrder:
      Number(
        plain.displayOrder || 0
      ),
  };
};

/*
|--------------------------------------------------------------------------
| CREATE EDUCATION
|--------------------------------------------------------------------------
*/

const createEducation = async (
  payload
) => {
  const normalizedData =
    normalizeEducationData(
      payload
    );

  const validationErrors =
    validateEducationData(
      normalizedData,
      {
        isCreate: true,
      }
    );

  if (
    validationErrors.length > 0
  ) {
    const error =
      new Error(
        validationErrors.join(" ")
      );

    error.statusCode = 400;
    error.validationErrors =
      validationErrors;

    throw error;
  }

  const education =
    await Education.create(
      normalizedData
    );

  return education;
};

/*
|--------------------------------------------------------------------------
| GET EDUCATION BY ID
|--------------------------------------------------------------------------
*/

const getEducationById = async (
  educationId
) => {
  if (
    !isValidObjectId(
      educationId
    )
  ) {
    const error =
      new Error(
        "Invalid education ID."
      );

    error.statusCode = 400;

    throw error;
  }

  const education =
    await Education.findById(
      educationId
    );

  if (!education) {
    const error =
      new Error(
        "Education record not found."
      );

    error.statusCode = 404;

    throw error;
  }

  return education;
};

/*
|--------------------------------------------------------------------------
| GET ALL EDUCATION - ADMIN
|--------------------------------------------------------------------------
*/

const getAllEducation = async ({
  page = 1,
  limit = MAX_EDUCATION_PER_PAGE,
  search = "",
  educationLevel = "",
  visibility = "all",
  active = "all",
  featured = "all",
} = {}) => {
  const normalizedPage =
    Math.max(
      1,
      Number(page) || 1
    );

  const normalizedLimit =
    Math.min(
      MAX_EDUCATION_PER_PAGE,
      Math.max(
        1,
        Number(limit) || 20
      )
    );

  const skip =
    (normalizedPage - 1) *
    normalizedLimit;

  const filter = {};

  /*
   * ---------------------------------------------------------------
   * SEARCH
   * ---------------------------------------------------------------
   */

  const normalizedSearch =
    normalizeString(search);

  if (normalizedSearch) {
    const searchRegex =
      new RegExp(
        normalizedSearch.replace(
          /[.*+?^${}()|[\]\\]/g,
          "\\$&"
        ),
        "i"
      );

    filter.$or = [
      {
        degreeName:
          searchRegex,
      },
      {
        institutionName:
          searchRegex,
      },
      {
        boardOrUniversity:
          searchRegex,
      },
      {
        fieldOfStudy:
          searchRegex,
      },
      {
        location:
          searchRegex,
      },
    ];
  }

  /*
   * ---------------------------------------------------------------
   * EDUCATION LEVEL
   * ---------------------------------------------------------------
   */

  if (
    educationLevel &&
    EDUCATION_LEVELS.includes(
      educationLevel
    )
  ) {
    filter.educationLevel =
      educationLevel;
  }

  /*
   * ---------------------------------------------------------------
   * VISIBILITY
   * ---------------------------------------------------------------
   */

  if (
    visibility === "visible"
  ) {
    filter.isVisible = true;
  }

  if (
    visibility === "hidden"
  ) {
    filter.isVisible = false;
  }

  /*
   * ---------------------------------------------------------------
   * ACTIVE
   * ---------------------------------------------------------------
   */

  if (
    active === "active"
  ) {
    filter.isActive = true;
  }

  if (
    active === "inactive"
  ) {
    filter.isActive = false;
  }

  /*
   * ---------------------------------------------------------------
   * FEATURED
   * ---------------------------------------------------------------
   */

  if (
    featured === "featured"
  ) {
    filter.isFeatured = true;
  }

  if (
    featured === "not-featured"
  ) {
    filter.isFeatured = false;
  }

  const [
    education,
    total,
  ] = await Promise.all([
    Education.find(
      filter
    )
      .sort({
        displayOrder: 1,
        startDate: -1,
        createdAt: -1,
      })
      .skip(skip)
      .limit(
        normalizedLimit
      )
      .lean(),

    Education.countDocuments(
      filter
    ),
  ]);

  return {
    education:
      education.map(
        serializeEducationForAdmin
      ),

    pagination: {
      page:
        normalizedPage,

      limit:
        normalizedLimit,

      total,

      totalPages:
        Math.ceil(
          total /
            normalizedLimit
        ),

      hasNextPage:
        normalizedPage *
          normalizedLimit <
        total,

      hasPreviousPage:
        normalizedPage > 1,
    },
  };
};

/*
|--------------------------------------------------------------------------
| GET PUBLIC EDUCATION
|--------------------------------------------------------------------------
*/

const getPublicEducation = async () => {
  const education =
    await Education.find({
      isActive: true,
      isVisible: true,
    })
      .sort({
        displayOrder: 1,
        startDate: -1,
        createdAt: -1,
      })
      .lean();

  return education.map(
    serializeEducationForPublic
  );
};

/*
|--------------------------------------------------------------------------
| UPDATE EDUCATION
|--------------------------------------------------------------------------
*/

const updateEducation = async (
  educationId,
  payload
) => {
  const education =
    await getEducationById(
      educationId
    );

  const normalizedData =
    normalizeEducationData(
      payload,
      education
    );

  /*
   * ---------------------------------------------------------------
   * MERGE CURRENT DATA FOR VALIDATION
   * ---------------------------------------------------------------
   */

  const mergedData = {
    educationLevel:
      normalizedData.educationLevel !==
      undefined
        ? normalizedData.educationLevel
        : education.educationLevel,

    degreeName:
      normalizedData.degreeName !==
      undefined
        ? normalizedData.degreeName
        : education.degreeName,

    institutionName:
      normalizedData.institutionName !==
      undefined
        ? normalizedData.institutionName
        : education.institutionName,

    startDate:
      normalizedData.startDate !==
      undefined
        ? normalizedData.startDate
        : education.startDate,

    endDate:
      normalizedData.endDate !==
      undefined
        ? normalizedData.endDate
        : education.endDate,

    currentlyStudying:
      normalizedData.currentlyStudying !==
      undefined
        ? normalizedData.currentlyStudying
        : education.currentlyStudying,

    percentage:
      normalizedData.percentage !==
      undefined
        ? normalizedData.percentage
        : education.percentage,

    cgpa:
      normalizedData.cgpa !==
      undefined
        ? normalizedData.cgpa
        : education.cgpa,
  };

  const validationErrors =
    validateEducationData(
      mergedData,
      {
        isCreate: false,
        existingEducation:
          education,
      }
    );

  if (
    validationErrors.length > 0
  ) {
    const error =
      new Error(
        validationErrors.join(" ")
      );

    error.statusCode = 400;
    error.validationErrors =
      validationErrors;

    throw error;
  }

  /*
   * ---------------------------------------------------------------
   * APPLY UPDATE
   * ---------------------------------------------------------------
   */

  Object.assign(
    education,
    normalizedData
  );

  await education.save();

  return education;
};

/*
|--------------------------------------------------------------------------
| DELETE EDUCATION
|--------------------------------------------------------------------------
|
| Returns the deleted education document so the controller can clean
| all related Cloudinary files after successful MongoDB deletion.
|
*/

const deleteEducation = async (
  educationId
) => {
  const education =
    await getEducationById(
      educationId
    );

  await Education.deleteOne({
    _id: education._id,
  });

  return education;
};

/*
|--------------------------------------------------------------------------
| ADD EDUCATION DOCUMENT
|--------------------------------------------------------------------------
*/

const addEducationDocument = async (
  educationId,
  documentData
) => {
  const education =
    await getEducationById(
      educationId
    );

  if (
    education.documents.length >=
    MAX_DOCUMENTS
  ) {
    const error =
      new Error(
        `Maximum ${MAX_DOCUMENTS} education documents are allowed.`
      );

    error.statusCode = 400;

    throw error;
  }

  const normalizedDocument =
    normalizeDocumentData(
      documentData,
      education.documents.length
    );

  const validationErrors =
    validateDocumentData(
      normalizedDocument
    );

  if (
    validationErrors.length > 0
  ) {
    const error =
      new Error(
        validationErrors.join(" ")
      );

    error.statusCode = 400;
    error.validationErrors =
      validationErrors;

    throw error;
  }

  normalizedDocument.displayOrder =
    education.documents.length;

  education.documents.push(
    normalizedDocument
  );

  await education.save();

  return education;
};

/*
|--------------------------------------------------------------------------
| GET EDUCATION DOCUMENT
|--------------------------------------------------------------------------
*/

const getEducationDocument = async (
  educationId,
  documentId
) => {
  const education =
    await getEducationById(
      educationId
    );

  if (
    !isValidObjectId(
      documentId
    )
  ) {
    const error =
      new Error(
        "Invalid education document ID."
      );

    error.statusCode = 400;

    throw error;
  }

  const document =
    education.documents.id(
      documentId
    );

  if (!document) {
    const error =
      new Error(
        "Education document not found."
      );

    error.statusCode = 404;

    throw error;
  }

  return {
    education,
    document,
  };
};

/*
|--------------------------------------------------------------------------
| UPDATE EDUCATION DOCUMENT METADATA
|--------------------------------------------------------------------------
*/

const updateEducationDocument = async (
  educationId,
  documentId,
  payload
) => {
  const {
    education,
    document,
  } =
    await getEducationDocument(
      educationId,
      documentId
    );

  const updates = {};

  if (
    payload.documentType !==
    undefined
  ) {
    const documentType =
      normalizeString(
        payload.documentType
      ).toLowerCase();

    if (
      !DOCUMENT_TYPES.includes(
        documentType
      )
    ) {
      const error =
        new Error(
          "Invalid education document type."
        );

      error.statusCode = 400;

      throw error;
    }

    updates.documentType =
      documentType;
  }

  if (
    payload.displayOrder !==
    undefined
  ) {
    const displayOrder =
      normalizeNumber(
        payload.displayOrder,
        0
      );

    updates.displayOrder =
      Math.max(
        0,
        Math.floor(
          displayOrder || 0
        )
      );
  }

  Object.assign(
    document,
    updates
  );

  await education.save();

  return education;
};

/*
|--------------------------------------------------------------------------
| DELETE EDUCATION DOCUMENT
|--------------------------------------------------------------------------
|
| MongoDB document is removed first only after the education record
| has been located. The returned document metadata lets the controller
| delete the corresponding Cloudinary asset.
|
*/

const deleteEducationDocument = async (
  educationId,
  documentId
) => {
  const {
    education,
    document,
  } =
    await getEducationDocument(
      educationId,
      documentId
    );

  const deletedDocument = {
    ...serializeDocumentForAdmin(
      document
    ),
  };

  document.deleteOne();

  await education.save();

  /*
   * ---------------------------------------------------------------
   * NORMALIZE REMAINING DISPLAY ORDER
   * ---------------------------------------------------------------
   */

  education.documents.forEach(
    (item, index) => {
      item.displayOrder =
        index;
    }
  );

  await education.save();

  /*
   * ---------------------------------------------------------------
   * DELETE CLOUDINARY ASSET
   * ---------------------------------------------------------------
   */

  if (
    deletedDocument.publicId
  ) {
    try {
      await deleteCloudinaryAsset(
        deletedDocument.publicId,
        deletedDocument.resourceType ||
          "raw",
        deletedDocument.deliveryType ||
          "authenticated"
      );
    } catch (cloudinaryError) {
      console.error(
        "Failed to delete education document from Cloudinary:",
        cloudinaryError
      );

      /*
       * MongoDB deletion has already succeeded.
       * Do not convert the successful database operation into
       * a failed request only because cloud cleanup failed.
       */
    }
  }

  return {
    education,
    deletedDocument,
  };
};

/*
|--------------------------------------------------------------------------
| REPLACE EDUCATION DOCUMENT METADATA
|--------------------------------------------------------------------------
|
| The controller should upload the new file to Cloudinary first,
| then call this method with the new Cloudinary metadata.
|
| The old document metadata is returned so its Cloudinary asset
| can be deleted after the database update succeeds.
|
*/

const replaceEducationDocument = async (
  educationId,
  documentId,
  newDocumentData
) => {
  const {
    education,
    document,
  } =
    await getEducationDocument(
      educationId,
      documentId
    );

  const normalizedDocument =
    normalizeDocumentData(
      newDocumentData,
      document.displayOrder
    );

  const validationErrors =
    validateDocumentData(
      normalizedDocument
    );

  if (
    validationErrors.length > 0
  ) {
    const error =
      new Error(
        validationErrors.join(" ")
      );

    error.statusCode = 400;
    error.validationErrors =
      validationErrors;

    throw error;
  }

  const oldDocument =
    serializeDocumentForAdmin(
      document
    );

  Object.assign(
    document,
    normalizedDocument
  );

  await education.save();

  return {
    education,
    oldDocument,
    newDocument:
      serializeDocumentForAdmin(
        document
      ),
  };
};

/*
|--------------------------------------------------------------------------
| REORDER EDUCATION DOCUMENTS
|--------------------------------------------------------------------------
*/

const reorderEducationDocuments =
  async (
    educationId,
    documentIds
  ) => {
    const education =
      await getEducationById(
        educationId
      );

    if (
      !Array.isArray(
        documentIds
      )
    ) {
      const error =
        new Error(
          "documentIds must be an array."
        );

      error.statusCode = 400;

      throw error;
    }

    if (
      documentIds.length !==
      education.documents.length
    ) {
      const error =
        new Error(
          "All education document IDs must be included when reordering."
        );

      error.statusCode = 400;

      throw error;
    }

    const existingIds =
      education.documents.map(
        (document) =>
          document._id.toString()
      );

    const uniqueIds =
      new Set(
        documentIds.map(
          (id) =>
            String(id)
        )
      );

    if (
      uniqueIds.size !==
      documentIds.length
    ) {
      const error =
        new Error(
          "Duplicate document IDs are not allowed."
        );

      error.statusCode = 400;

      throw error;
    }

    const allIdsValid =
      documentIds.every(
        (id) =>
          existingIds.includes(
            String(id)
          )
      );

    if (!allIdsValid) {
      const error =
        new Error(
          "One or more education document IDs are invalid."
        );

      error.statusCode = 400;

      throw error;
    }

    documentIds.forEach(
      (documentId, index) => {
        const document =
          education.documents.id(
            documentId
          );

        if (document) {
          document.displayOrder =
            index;
        }
      }
    );

    await education.save();

    return education;
  };

/*
|--------------------------------------------------------------------------
| UPDATE VISIBILITY
|--------------------------------------------------------------------------
*/

const updateEducationVisibility =
  async (
    educationId,
    isVisible
  ) => {
    const education =
      await getEducationById(
        educationId
      );

    education.isVisible =
      normalizeBoolean(
        isVisible,
        true
      );

    await education.save();

    return education;
  };

/*
|--------------------------------------------------------------------------
| UPDATE FEATURED
|--------------------------------------------------------------------------
*/

const updateEducationFeatured =
  async (
    educationId,
    isFeatured
  ) => {
    const education =
      await getEducationById(
        educationId
      );

    education.isFeatured =
      normalizeBoolean(
        isFeatured,
        false
      );

    await education.save();

    return education;
  };

/*
|--------------------------------------------------------------------------
| UPDATE ACTIVE STATUS
|--------------------------------------------------------------------------
*/

const updateEducationActive =
  async (
    educationId,
    isActive
  ) => {
    const education =
      await getEducationById(
        educationId
      );

    education.isActive =
      normalizeBoolean(
        isActive,
        true
      );

    await education.save();

    return education;
  };

/*
|--------------------------------------------------------------------------
| UPDATE DISPLAY ORDER
|--------------------------------------------------------------------------
*/

const updateEducationDisplayOrder =
  async (
    educationId,
    displayOrder
  ) => {
    const education =
      await getEducationById(
        educationId
      );

    const normalizedOrder =
      normalizeNumber(
        displayOrder,
        0
      );

    education.displayOrder =
      Math.max(
        0,
        Math.floor(
          normalizedOrder || 0
        )
      );

    await education.save();

    return education;
  };

/*
|--------------------------------------------------------------------------
| REORDER EDUCATION RECORDS
|--------------------------------------------------------------------------
*/

const reorderEducation = async (
  educationIds
) => {
  if (
    !Array.isArray(
      educationIds
    )
  ) {
    const error =
      new Error(
        "educationIds must be an array."
      );

    error.statusCode = 400;

    throw error;
  }

  const education =
    await Education.find({
      _id: {
        $in: educationIds,
      },
    });

  if (
    education.length !==
    educationIds.length
  ) {
    const error =
      new Error(
        "One or more education IDs are invalid."
      );

    error.statusCode = 400;

    throw error;
  }

  const uniqueIds =
    new Set(
      educationIds.map(
        (id) =>
          String(id)
      )
    );

  if (
    uniqueIds.size !==
    educationIds.length
  ) {
    const error =
      new Error(
        "Duplicate education IDs are not allowed."
      );

    error.statusCode = 400;

    throw error;
  }

  await Promise.all(
    educationIds.map(
      (educationId, index) =>
        Education.updateOne(
          {
            _id: educationId,
          },
          {
            $set: {
              displayOrder:
                index,
            },
          }
        )
    )
  );

  return Education.find({
    _id: {
      $in: educationIds,
    },
  }).sort({
    displayOrder: 1,
  });
};

/*
|--------------------------------------------------------------------------
| EXPORTS
|--------------------------------------------------------------------------
*/

module.exports = {
  MAX_EDUCATION_PER_PAGE,
  MAX_HIGHLIGHTS,
  MAX_DOCUMENTS,
  EDUCATION_LEVELS,
  DOCUMENT_TYPES,

  normalizeEducationData,
  validateEducationData,

  normalizeDocumentData,
  validateDocumentData,

  serializeEducationForAdmin,
  serializeEducationForPublic,

  createEducation,
  getEducationById,
  getAllEducation,
  getPublicEducation,
  updateEducation,
  deleteEducation,

  addEducationDocument,
  getEducationDocument,
  updateEducationDocument,
  deleteEducationDocument,
  replaceEducationDocument,
  reorderEducationDocuments,

  updateEducationVisibility,
  updateEducationFeatured,
  updateEducationActive,
  updateEducationDisplayOrder,
  reorderEducation,
};