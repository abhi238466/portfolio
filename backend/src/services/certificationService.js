const mongoose = require("mongoose");

const Certification = require(
  "../models/Certification"
);

/*
|--------------------------------------------------------------------------
| Constants
|--------------------------------------------------------------------------
*/

const MAX_CERTIFICATIONS_PER_PAGE =
  100;

const MAX_SKILLS = 30;

const MAX_TECHNOLOGIES = 30;

const MAX_DOCUMENTS = 5;

/*
|--------------------------------------------------------------------------
| Allowed Values
|--------------------------------------------------------------------------
*/

const ALLOWED_DOCUMENT_TYPES = [
  "certificate",
  "badge",
  "license",
  "transcript",
  "other",
];

/*
|--------------------------------------------------------------------------
| Error Helper
|--------------------------------------------------------------------------
*/

const createServiceError = (
  message,
  statusCode = 400,
  validationErrors = null
) => {
  const error = new Error(
    message
  );

  error.statusCode =
    statusCode;

  if (validationErrors) {
    error.validationErrors =
      validationErrors;
  }

  return error;
};

/*
|--------------------------------------------------------------------------
| Utility Helpers
|--------------------------------------------------------------------------
*/

const isValidObjectId = (
  value
) => {
  return mongoose.Types.ObjectId.isValid(
    value
  );
};

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

const normalizeBoolean = (
  value,
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
    value === "true" ||
    value === 1 ||
    value === "1"
  ) {
    return true;
  }

  if (
    value === false ||
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
  defaultValue = 0
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

  return Number.isFinite(
    number
  )
    ? number
    : defaultValue;
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
    items =
      value
        .split(",")
        .map(
          (item) =>
            item.trim()
        );
  }

  const normalized =
    items
      .map((item) =>
        normalizeString(item)
      )
      .filter(Boolean);

  return [
    ...new Set(
      normalized
    ),
  ].slice(
    0,
    maxItems
  );
};

const normalizeUrl = (
  value
) => {
  const url =
    normalizeString(value);

  if (!url) {
    return "";
  }

  return url;
};

/*
|--------------------------------------------------------------------------
| Certification Validation
|--------------------------------------------------------------------------
*/

const validateCertificationInput =
  (data, options = {}) => {
    const {
      partial = false,
      existingCertification = null,
    } = options;

    const validationErrors =
      {};

    const certificateName =
      normalizeString(
        data.certificateName
      );

    const issuingOrganization =
      normalizeString(
        data.issuingOrganization
      );

    const issueDate =
      normalizeDate(
        data.issueDate
      );

    const doesNotExpire =
      normalizeBoolean(
        data.doesNotExpire,
        true
      );

    const expiryDate =
      normalizeDate(
        data.expiryDate
      );

    const credentialUrl =
      normalizeUrl(
        data.credentialUrl
      );

    /*
     * ---------------------------------------------------------------
     * CERTIFICATE NAME
     * ---------------------------------------------------------------
     */

    if (
      !partial ||
      data.certificateName !==
        undefined
    ) {
      if (!certificateName) {
        validationErrors.certificateName =
          "Certificate name is required.";
      } else if (
        certificateName.length <
        2
      ) {
        validationErrors.certificateName =
          "Certificate name must contain at least 2 characters.";
      }
    }

    /*
     * ---------------------------------------------------------------
     * ISSUING ORGANIZATION
     * ---------------------------------------------------------------
     */

    if (
      !partial ||
      data.issuingOrganization !==
        undefined
    ) {
      if (
        !issuingOrganization
      ) {
        validationErrors.issuingOrganization =
          "Issuing organization is required.";
      } else if (
        issuingOrganization.length <
        2
      ) {
        validationErrors.issuingOrganization =
          "Issuing organization must contain at least 2 characters.";
      }
    }

    /*
     * ---------------------------------------------------------------
     * ISSUE DATE
     * ---------------------------------------------------------------
     */

    if (
      !partial ||
      data.issueDate !==
        undefined
    ) {
      if (!issueDate) {
        validationErrors.issueDate =
          "Issue date is required.";
      }
    }

    /*
     * ---------------------------------------------------------------
     * CREDENTIAL URL
     * ---------------------------------------------------------------
     */

    if (credentialUrl) {
      if (
        !/^https?:\/\/\S+$/i.test(
          credentialUrl
        )
      ) {
        validationErrors.credentialUrl =
          "Credential URL must be a valid HTTP or HTTPS URL.";
      }
    }

    /*
     * ---------------------------------------------------------------
     * EXPIRY DATE
     * ---------------------------------------------------------------
     */

    if (
      doesNotExpire &&
      expiryDate
    ) {
      validationErrors.expiryDate =
        "Expiry date must be empty when certification does not expire.";
    }

    if (
      !doesNotExpire &&
      !expiryDate
    ) {
      validationErrors.expiryDate =
        "Expiry date is required when certification has an expiry.";
    }

    if (
      issueDate &&
      expiryDate &&
      expiryDate < issueDate
    ) {
      validationErrors.expiryDate =
        "Expiry date cannot be earlier than issue date.";
    }

    /*
     * ---------------------------------------------------------------
     * EXISTING CERTIFICATION
     * ---------------------------------------------------------------
     */

    if (
      existingCertification &&
      partial
    ) {
      /*
       * When updating a certification,
       * preserve values that were not supplied.
       */
    }

    /*
     * ---------------------------------------------------------------
     * RETURN
     * ---------------------------------------------------------------
     */

    if (
      Object.keys(
        validationErrors
      ).length > 0
    ) {
      throw createServiceError(
        "Please correct the certification details.",
        400,
        validationErrors
      );
    }
  };

/*
|--------------------------------------------------------------------------
| Normalize Certification Payload
|--------------------------------------------------------------------------
*/

const buildCertificationPayload =
  (data = {}) => {
    const payload = {};

    if (
      data.certificateName !==
      undefined
    ) {
      payload.certificateName =
        normalizeString(
          data.certificateName
        );
    }

    if (
      data.issuingOrganization !==
      undefined
    ) {
      payload.issuingOrganization =
        normalizeString(
          data.issuingOrganization
        );
    }

    if (
      data.description !==
      undefined
    ) {
      payload.description =
        normalizeString(
          data.description
        );
    }

    if (
      data.credentialId !==
      undefined
    ) {
      payload.credentialId =
        normalizeString(
          data.credentialId
        );
    }

    if (
      data.credentialUrl !==
      undefined
    ) {
      payload.credentialUrl =
        normalizeUrl(
          data.credentialUrl
        );
    }

    if (
      data.issueDate !==
      undefined
    ) {
      payload.issueDate =
        normalizeDate(
          data.issueDate
        );
    }

    if (
      data.expiryDate !==
      undefined
    ) {
      payload.expiryDate =
        normalizeDate(
          data.expiryDate
        );
    }

    if (
      data.doesNotExpire !==
      undefined
    ) {
      payload.doesNotExpire =
        normalizeBoolean(
          data.doesNotExpire,
          true
        );
    }

    if (
      data.skills !==
      undefined
    ) {
      payload.skills =
        normalizeArray(
          data.skills,
          MAX_SKILLS
        );
    }

    if (
      data.technologies !==
      undefined
    ) {
      payload.technologies =
        normalizeArray(
          data.technologies,
          MAX_TECHNOLOGIES
        );
    }

    if (
      data.isVisible !==
      undefined
    ) {
      payload.isVisible =
        normalizeBoolean(
          data.isVisible,
          false
        );
    }

    if (
      data.isFeatured !==
      undefined
    ) {
      payload.isFeatured =
        normalizeBoolean(
          data.isFeatured,
          false
        );
    }

    if (
      data.isActive !==
      undefined
    ) {
      payload.isActive =
        normalizeBoolean(
          data.isActive,
          true
        );
    }

    if (
      data.displayOrder !==
      undefined
    ) {
      payload.displayOrder =
        Math.max(
          0,
          Math.floor(
            normalizeNumber(
              data.displayOrder,
              0
            )
          )
        );
    }

    return payload;
  };

/*
|--------------------------------------------------------------------------
| Certification Proof Validation
|--------------------------------------------------------------------------
|
| A certification can be publicly displayed only when it has:
|
| 1. At least one uploaded certificate document
| OR
| 2. A credential verification URL
|
*/

const hasCertificationProof =
  (certification) => {
    const documents =
      Array.isArray(
        certification.documents
      )
        ? certification.documents
        : [];

    const hasDocument =
      documents.length > 0;

    const credentialUrl =
      normalizeString(
        certification.credentialUrl
      );

    const hasCredentialUrl =
      Boolean(
        credentialUrl
      );

    return (
      hasDocument ||
      hasCredentialUrl
    );
  };

/*
|--------------------------------------------------------------------------
| Validate Public Visibility
|--------------------------------------------------------------------------
*/

const validatePublicProof =
  (certification) => {
    if (
      !certification.isVisible
    ) {
      return;
    }

    if (
      !hasCertificationProof(
        certification
      )
    ) {
      throw createServiceError(
        "A certification must have a certificate document or credential verification URL before it can be made visible.",
        400
      );
    }
  };

/*
|--------------------------------------------------------------------------
| Sanitize Document For Admin
|--------------------------------------------------------------------------
*/

const serializeDocumentForAdmin =
  (document) => {
    if (!document) {
      return null;
    }

    return {
      id:
        document._id
          ? document._id.toString()
          : null,

      publicId:
        document.publicId ||
        null,

      url:
        document.url ||
        null,

      originalName:
        document.originalName ||
        "",

      mimeType:
        document.mimeType ||
        "",

      resourceType:
        document.resourceType ||
        null,

      deliveryType:
        document.deliveryType ||
        null,

      format:
        document.format ||
        null,

      size:
        document.size ??
        null,

      width:
        document.width ??
        null,

      height:
        document.height ??
        null,

      documentType:
        document.documentType ||
        "certificate",

      displayOrder:
        document.displayOrder ??
        0,

      createdAt:
        document.createdAt ||
        null,

      updatedAt:
        document.updatedAt ||
        null,
    };
  };

/*
|--------------------------------------------------------------------------
| Sanitize Document For Public
|--------------------------------------------------------------------------
|
| Do NOT expose:
| - Cloudinary publicId
| - Permanent authenticated URL
| - Internal storage metadata
|
| Public side receives only safe document metadata.
|
*/

const serializeDocumentForPublic =
  (document) => {
    if (!document) {
      return null;
    }

    return {
      id:
        document._id
          ? document._id.toString()
          : null,

      url:
        document.url || "",

      originalName:
        document.originalName ||
        "",

      mimeType:
        document.mimeType ||
        "",

      documentType:
        document.documentType ||
        "certificate",

      size:
        document.size ??
        null,

      width:
        document.width ??
        null,

      height:
        document.height ??
        null,

      displayOrder:
        document.displayOrder ??
        0,
    };
  };

/*
|--------------------------------------------------------------------------
| Serialize Certification For Admin
|--------------------------------------------------------------------------
*/

const serializeCertificationForAdmin =
  (certification) => {
    if (!certification) {
      return null;
    }

    const plain =
      certification.toObject
        ? certification.toObject()
        : certification;

    return {
      id:
        plain._id
          ? plain._id.toString()
          : null,

      certificateName:
        plain.certificateName ||
        "",

      issuingOrganization:
        plain.issuingOrganization ||
        "",

      description:
        plain.description ||
        "",

      credentialId:
        plain.credentialId ||
        "",

      credentialUrl:
        plain.credentialUrl ||
        "",

      issueDate:
        plain.issueDate ||
        null,

      expiryDate:
        plain.expiryDate ||
        null,

      doesNotExpire:
        Boolean(
          plain.doesNotExpire
        ),

      skills:
        Array.isArray(
          plain.skills
        )
          ? plain.skills
          : [],

      technologies:
        Array.isArray(
          plain.technologies
        )
          ? plain.technologies
          : [],

      documents:
        Array.isArray(
          plain.documents
        )
          ? plain.documents
              .map(
                serializeDocumentForAdmin
              )
          : [],

      isVisible:
        Boolean(
          plain.isVisible
        ),

      isFeatured:
        Boolean(
          plain.isFeatured
        ),

      isActive:
        Boolean(
          plain.isActive
        ),

      displayOrder:
        plain.displayOrder ??
        0,

      createdAt:
        plain.createdAt ||
        null,

      updatedAt:
        plain.updatedAt ||
        null,
    };
  };

/*
|--------------------------------------------------------------------------
| Serialize Certification For Public
|--------------------------------------------------------------------------
*/

const serializeCertificationForPublic =
  (certification) => {
    if (!certification) {
      return null;
    }

    const plain =
      certification.toObject
        ? certification.toObject()
        : certification;

    return {
      id:
        plain._id
          ? plain._id.toString()
          : null,

      certificateName:
        plain.certificateName ||
        "",

      issuingOrganization:
        plain.issuingOrganization ||
        "",

      description:
        plain.description ||
        "",

      credentialId:
        plain.credentialId ||
        "",

      credentialUrl:
        plain.credentialUrl ||
        "",

      issueDate:
        plain.issueDate ||
        null,

      expiryDate:
        plain.expiryDate ||
        null,

      doesNotExpire:
        Boolean(
          plain.doesNotExpire
        ),

      skills:
        Array.isArray(
          plain.skills
        )
          ? plain.skills
          : [],

      technologies:
        Array.isArray(
          plain.technologies
        )
          ? plain.technologies
          : [],

      documents:
        Array.isArray(
          plain.documents
        )
          ? plain.documents
              .map(
                serializeDocumentForPublic
              )
          : [],

      isFeatured:
        Boolean(
          plain.isFeatured
        ),

      displayOrder:
        plain.displayOrder ??
        0,
    };
  };

/*
|--------------------------------------------------------------------------
| CREATE CERTIFICATION
|--------------------------------------------------------------------------
*/

const createCertification =
  async (data = {}) => {
    validateCertificationInput(
      data
    );

    const payload =
      buildCertificationPayload(
        data
      );

    const certification =
      new Certification(
        payload
      );

    /*
     * A newly created certification
     * is not visible by default.
     *
     * This allows the admin to first
     * add the certificate proof.
     */

    certification.isVisible =
      false;

    await certification.save();

    return certification;
  };

/*
|--------------------------------------------------------------------------
| GET CERTIFICATION BY ID
|--------------------------------------------------------------------------
*/

const getCertificationById =
  async (
    certificationId
  ) => {
    if (
      !isValidObjectId(
        certificationId
      )
    ) {
      throw createServiceError(
        "Invalid certification ID.",
        400
      );
    }

    const certification =
      await Certification.findById(
        certificationId
      );

    if (!certification) {
      throw createServiceError(
        "Certification not found.",
        404
      );
    }

    return certification;
  };

/*
|--------------------------------------------------------------------------
| GET ALL CERTIFICATIONS - ADMIN
|--------------------------------------------------------------------------
*/

const getAllCertifications =
  async (options = {}) => {
    const page =
      Math.max(
        1,
        Math.floor(
          normalizeNumber(
            options.page,
            1
          )
        )
      );

    const requestedLimit =
      Math.floor(
        normalizeNumber(
          options.limit,
          20
        )
      );

    const limit =
      Math.min(
        Math.max(
          requestedLimit,
          1
        ),
        MAX_CERTIFICATIONS_PER_PAGE
      );

    const search =
      normalizeString(
        options.search
      );

    const query = {};

    /*
     * ---------------------------------------------------------------
     * SEARCH
     * ---------------------------------------------------------------
     */

    if (search) {
      query.$or = [
        {
          certificateName: {
            $regex: search,
            $options: "i",
          },
        },
        {
          issuingOrganization: {
            $regex: search,
            $options: "i",
          },
        },
        {
          credentialId: {
            $regex: search,
            $options: "i",
          },
        },
      ];
    }

    /*
     * ---------------------------------------------------------------
     * VISIBILITY FILTER
     * ---------------------------------------------------------------
     */

    if (
      options.visibility !==
        undefined &&
      options.visibility !== ""
    ) {
      query.isVisible =
        normalizeBoolean(
          options.visibility
        );
    }

    /*
     * ---------------------------------------------------------------
     * ACTIVE FILTER
     * ---------------------------------------------------------------
     */

    if (
      options.active !==
        undefined &&
      options.active !== ""
    ) {
      query.isActive =
        normalizeBoolean(
          options.active
        );
    }

    /*
     * ---------------------------------------------------------------
     * FEATURED FILTER
     * ---------------------------------------------------------------
 */

    if (
      options.featured !==
        undefined &&
      options.featured !== ""
    ) {
      query.isFeatured =
        normalizeBoolean(
          options.featured
        );
    }

    const skip =
      (page - 1) * limit;

    const [
      certifications,
      total,
    ] =
      await Promise.all([
        Certification.find(
          query
        )
          .sort({
            displayOrder: 1,
            issueDate: -1,
            createdAt: -1,
          })
          .skip(skip)
          .limit(limit),

        Certification.countDocuments(
          query
        ),
      ]);

    const totalPages =
      total === 0
        ? 0
        : Math.ceil(
            total / limit
          );

    return {
      certifications:
        certifications.map(
          serializeCertificationForAdmin
        ),

      pagination: {
        page,

        limit,

        total,

        totalPages,

        hasNextPage:
          page <
          totalPages,

        hasPreviousPage:
          page > 1,
      },
    };
  };

/*
|--------------------------------------------------------------------------
| GET PUBLIC CERTIFICATIONS
|--------------------------------------------------------------------------
*/

const getPublicCertifications =
  async () => {
    const certifications =
      await Certification.find({
        isActive: true,
        isVisible: true,
      })
        .sort({
          displayOrder: 1,
          issueDate: -1,
          createdAt: -1,
        });

    /*
     * Only certifications with valid
     * public proof are exposed.
     */

    return certifications
      .filter(
        hasCertificationProof
      )
      .map(
        serializeCertificationForPublic
      );
  };

/*
|--------------------------------------------------------------------------
| UPDATE CERTIFICATION
|--------------------------------------------------------------------------
*/

const updateCertification =
  async (
    certificationId,
    data = {}
  ) => {
    const certification =
      await getCertificationById(
        certificationId
      );

    validateCertificationInput(
      data,
      {
        partial: true,
        existingCertification:
          certification,
      }
    );

    const payload =
      buildCertificationPayload(
        data
      );

    Object.assign(
      certification,
      payload
    );

    /*
     * If the certification is being
     * made visible, proof is mandatory.
     */

    validatePublicProof(
      certification
    );

    await certification.save();

    return certification;
  };

/*
|--------------------------------------------------------------------------
| DELETE CERTIFICATION
|--------------------------------------------------------------------------
|
| The controller can use the returned
| certification document to delete
| all related Cloudinary assets.
|
*/

const deleteCertification =
  async (
    certificationId
  ) => {
    const certification =
      await getCertificationById(
        certificationId
      );

    await Certification.findByIdAndDelete(
      certificationId
    );

    return certification;
  };

/*
|--------------------------------------------------------------------------
| ADD CERTIFICATION DOCUMENT
|--------------------------------------------------------------------------
*/

const addCertificationDocument =
  async (
    certificationId,
    documentData
  ) => {
    const certification =
      await getCertificationById(
        certificationId
      );

    if (
      !documentData ||
      !documentData.publicId
    ) {
      throw createServiceError(
        "Certification document upload data is required.",
        400
      );
    }

    const documents =
      Array.isArray(
        certification.documents
      )
        ? certification.documents
        : [];

    if (
      documents.length >=
      MAX_DOCUMENTS
    ) {
      throw createServiceError(
        `A maximum of ${MAX_DOCUMENTS} certification documents is allowed.`,
        400
      );
    }

    const documentType =
      ALLOWED_DOCUMENT_TYPES.includes(
        documentData.documentType
      )
        ? documentData.documentType
        : "certificate";

    const nextDisplayOrder =
      documents.length;

    documents.push({
      publicId:
        documentData.publicId,

      url:
        documentData.url ||
        "",

      originalName:
        documentData.originalName ||
        "",

      mimeType:
        documentData.mimeType ||
        "",

      resourceType:
        documentData.resourceType ||
        "image",

      deliveryType:
        documentData.deliveryType ||
        "authenticated",

      format:
        documentData.format ||
        null,

      size:
        documentData.size ??
        null,

      width:
        documentData.width ??
        null,

      height:
        documentData.height ??
        null,

      documentType,

      displayOrder:
        documentData.displayOrder ??
        nextDisplayOrder,
    });

    certification.documents =
      documents;

    await certification.save();

    return certification;
  };

/*
|--------------------------------------------------------------------------
| GET CERTIFICATION DOCUMENT
|--------------------------------------------------------------------------
*/

const getCertificationDocument =
  async (
    certificationId,
    documentId
  ) => {
    const certification =
      await getCertificationById(
        certificationId
      );

    const document =
      certification.documents.id(
        documentId
      );

    if (!document) {
      throw createServiceError(
        "Certification document not found.",
        404
      );
    }

    return {
      certification,

      document,
    };
  };

/*
|--------------------------------------------------------------------------
| UPDATE CERTIFICATION DOCUMENT
|--------------------------------------------------------------------------
|
| Supports:
| - documentType
| - displayOrder
|
*/

const updateCertificationDocument =
  async (
    certificationId,
    documentId,
    data = {}
  ) => {
    const {
      certification,
      document,
    } =
      await getCertificationDocument(
        certificationId,
        documentId
      );

    if (
      data.documentType !==
      undefined
    ) {
      if (
        !ALLOWED_DOCUMENT_TYPES.includes(
          data.documentType
        )
      ) {
        throw createServiceError(
          "Invalid certification document type.",
          400
        );
      }

      document.documentType =
        data.documentType;
    }

    if (
      data.displayOrder !==
      undefined
    ) {
      document.displayOrder =
        Math.max(
          0,
          Math.floor(
            normalizeNumber(
              data.displayOrder,
              0
            )
          )
        );
    }

    await certification.save();

    return certification;
  };

/*
|--------------------------------------------------------------------------
| DELETE CERTIFICATION DOCUMENT
|--------------------------------------------------------------------------
*/

const deleteCertificationDocument =
  async (
    certificationId,
    documentId
  ) => {
    const {
      certification,
      document,
    } =
      await getCertificationDocument(
        certificationId,
        documentId
      );

    const deletedDocument =
      serializeDocumentForAdmin(
        document
      );

    document.deleteOne();

    /*
     * If this was the last proof and
     * certification was visible, automatically
     * hide it rather than leaving an invalid
     * publicly visible certification.
     */

    if (
      certification.documents
        .length === 0 &&
      !normalizeString(
        certification.credentialUrl
      )
    ) {
      certification.isVisible =
        false;
    }

    await certification.save();

    return {
      certification,

      deletedDocument,
    };
  };

/*
|--------------------------------------------------------------------------
| REPLACE CERTIFICATION DOCUMENT
|--------------------------------------------------------------------------
|
| New Cloudinary metadata is supplied by
| the controller after successful upload.
|
*/

const replaceCertificationDocument =
  async (
    certificationId,
    documentId,
    newDocumentData
  ) => {
    const {
      certification,
      document:
        oldDocument,
    } =
      await getCertificationDocument(
        certificationId,
        documentId
      );

    if (
      !newDocumentData ||
      !newDocumentData.publicId
    ) {
      throw createServiceError(
        "Replacement certification document data is required.",
        400
      );
    }

    const oldDocumentData =
      serializeDocumentForAdmin(
        oldDocument
      );

    oldDocument.publicId =
      newDocumentData.publicId;

    oldDocument.url =
      newDocumentData.url ||
      "";

    oldDocument.originalName =
      newDocumentData.originalName ||
      "";

    oldDocument.mimeType =
      newDocumentData.mimeType ||
      "";

    oldDocument.resourceType =
      newDocumentData.resourceType ||
      "image";

    oldDocument.deliveryType =
      newDocumentData.deliveryType ||
      "authenticated";

    oldDocument.format =
      newDocumentData.format ||
      null;

    oldDocument.size =
      newDocumentData.size ??
      null;

    oldDocument.width =
      newDocumentData.width ??
      null;

    oldDocument.height =
      newDocumentData.height ??
      null;

    if (
      newDocumentData.documentType
    ) {
      if (
        !ALLOWED_DOCUMENT_TYPES.includes(
          newDocumentData.documentType
        )
      ) {
        throw createServiceError(
          "Invalid certification document type.",
          400
        );
      }

      oldDocument.documentType =
        newDocumentData.documentType;
    }

    await certification.save();

    return {
      certification,

      oldDocument:
        oldDocumentData,

      newDocument:
        serializeDocumentForAdmin(
          oldDocument
        ),
    };
  };

/*
|--------------------------------------------------------------------------
| REORDER CERTIFICATION DOCUMENTS
|--------------------------------------------------------------------------
*/

const reorderCertificationDocuments =
  async (
    certificationId,
    documentIds
  ) => {
    const certification =
      await getCertificationById(
        certificationId
      );

    if (
      !Array.isArray(
        documentIds
      )
    ) {
      throw createServiceError(
        "documentIds must be an array.",
        400
      );
    }

    const existingDocuments =
      certification.documents;

    if (
      documentIds.length !==
      existingDocuments.length
    ) {
      throw createServiceError(
        "All certification document IDs must be provided when reordering documents.",
        400
      );
    }

    const existingIds =
      existingDocuments.map(
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
      existingIds.length
    ) {
      throw createServiceError(
        "Duplicate certification document IDs are not allowed.",
        400
      );
    }

    for (
      const id of documentIds
    ) {
      if (
        !existingIds.includes(
          String(id)
        )
      ) {
        throw createServiceError(
          "One or more certification document IDs are invalid.",
          400
        );
      }
    }

    const documentMap =
      new Map(
        existingDocuments.map(
          (document) => [
            document._id.toString(),
            document,
          ]
        )
      );

    const reordered =
      documentIds.map(
        (id) =>
          documentMap.get(
            String(id)
          )
      );

    reordered.forEach(
      (
        document,
        index
      ) => {
        document.displayOrder =
          index;
      }
    );

    certification.documents =
      reordered;

    await certification.save();

    return certification;
  };

/*
|--------------------------------------------------------------------------
| UPDATE CERTIFICATION VISIBILITY
|--------------------------------------------------------------------------
*/

const updateCertificationVisibility =
  async (
    certificationId,
    isVisible
  ) => {
    const certification =
      await getCertificationById(
        certificationId
      );

    const visible =
      normalizeBoolean(
        isVisible,
        false
      );

    if (visible) {
      certification.isVisible =
        true;

      validatePublicProof(
        certification
      );
    } else {
      certification.isVisible =
        false;
    }

    await certification.save();

    return certification;
  };

/*
|--------------------------------------------------------------------------
| UPDATE FEATURED STATUS
|--------------------------------------------------------------------------
*/

const updateCertificationFeatured =
  async (
    certificationId,
    isFeatured
  ) => {
    const certification =
      await getCertificationById(
        certificationId
      );

    certification.isFeatured =
      normalizeBoolean(
        isFeatured,
        false
      );

    await certification.save();

    return certification;
  };

/*
|--------------------------------------------------------------------------
| UPDATE ACTIVE STATUS
|--------------------------------------------------------------------------
*/

const updateCertificationActive =
  async (
    certificationId,
    isActive
  ) => {
    const certification =
      await getCertificationById(
        certificationId
      );

    certification.isActive =
      normalizeBoolean(
        isActive,
        true
      );

    /*
     * Inactive certifications
     * should not be publicly visible.
     */

    if (
      !certification.isActive
    ) {
      certification.isVisible =
        false;
    }

    await certification.save();

    return certification;
  };

/*
|--------------------------------------------------------------------------
| UPDATE DISPLAY ORDER
|--------------------------------------------------------------------------
*/

const updateCertificationDisplayOrder =
  async (
    certificationId,
    displayOrder
  ) => {
    const certification =
      await getCertificationById(
        certificationId
      );

    certification.displayOrder =
      Math.max(
        0,
        Math.floor(
          normalizeNumber(
            displayOrder,
            0
          )
        )
      );

    await certification.save();

    return certification;
  };

/*
|--------------------------------------------------------------------------
| REORDER CERTIFICATIONS
|--------------------------------------------------------------------------
|
| Body:
| {
|   "certificationIds": [
|     "id1",
|     "id2",
|     "id3"
|   ]
| }
|
*/

const reorderCertifications =
  async (
    certificationIds
  ) => {
    if (
      !Array.isArray(
        certificationIds
      )
    ) {
      throw createServiceError(
        "certificationIds must be an array.",
        400
      );
    }

    const certifications =
      await Certification.find({
        _id: {
          $in: certificationIds,
        },
      });

    if (
      certifications.length !==
      certificationIds.length
    ) {
      throw createServiceError(
        "One or more certification IDs are invalid.",
        400
      );
    }

    const uniqueIds =
      new Set(
        certificationIds.map(
          (id) =>
            String(id)
        )
      );

    if (
      uniqueIds.size !==
      certificationIds.length
    ) {
      throw createServiceError(
        "Duplicate certification IDs are not allowed.",
        400
      );
    }

    const certificationMap =
      new Map(
        certifications.map(
          (certification) => [
            certification._id.toString(),
            certification,
          ]
        )
      );

    const reordered =
      certificationIds.map(
        (id) =>
          certificationMap.get(
            String(id)
          )
      );

    /*
     * Assign sequential display order.
     */

    const bulkOperations =
      reordered.map(
        (
          certification,
          index
        ) => ({
          updateOne: {
            filter: {
              _id:
                certification._id,
            },

            update: {
              $set: {
                displayOrder:
                  index,
              },
            },
          },
        })
      );

    if (
      bulkOperations.length > 0
    ) {
      await Certification.bulkWrite(
        bulkOperations
      );
    }

    return Certification.find({
      _id: {
        $in: certificationIds,
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
  MAX_CERTIFICATIONS_PER_PAGE,

  MAX_SKILLS,

  MAX_TECHNOLOGIES,

  MAX_DOCUMENTS,

  ALLOWED_DOCUMENT_TYPES,

  createCertification,

  getCertificationById,

  getAllCertifications,

  getPublicCertifications,

  updateCertification,

  deleteCertification,

  addCertificationDocument,

  getCertificationDocument,

  updateCertificationDocument,

  deleteCertificationDocument,

  replaceCertificationDocument,

  reorderCertificationDocuments,

  updateCertificationVisibility,

  updateCertificationFeatured,

  updateCertificationActive,

  updateCertificationDisplayOrder,

  reorderCertifications,

  serializeCertificationForAdmin,

  serializeCertificationForPublic,

  serializeDocumentForAdmin,

  serializeDocumentForPublic,

  hasCertificationProof,

  validatePublicProof,
};