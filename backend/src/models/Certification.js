const mongoose = require("mongoose");

/*
|--------------------------------------------------------------------------
| Certification Document Schema
|--------------------------------------------------------------------------
|
| Supports:
| - Certificate PDF
| - Certificate image
| - Cloudinary authenticated storage
| - Preview / replace / delete
|
*/

const certificationDocumentSchema = new mongoose.Schema(
  {
    publicId: {
      type: String,
      required: true,
      trim: true,
    },

    url: {
      type: String,
      required: true,
      trim: true,
    },

    originalName: {
      type: String,
      required: true,
      trim: true,
    },

    mimeType: {
      type: String,
      required: true,
      trim: true,
    },

    resourceType: {
      type: String,
      required: true,
      enum: ["image", "raw", "video", "auto"],
    },

    deliveryType: {
      type: String,
      enum: ["upload", "authenticated", "private"],
      default: "authenticated",
    },

    format: {
      type: String,
      trim: true,
      default: null,
    },

    size: {
      type: Number,
      min: 0,
      default: null,
    },

    width: {
      type: Number,
      min: 0,
      default: null,
    },

    height: {
      type: Number,
      min: 0,
      default: null,
    },

    documentType: {
      type: String,
      enum: ["certificate", "badge", "license", "transcript", "other"],
      default: "certificate",
    },

    displayOrder: {
      type: Number,
      min: 0,
      default: 0,
    },
  },
  {
    _id: true,
    timestamps: true,
  }
);

/*
|--------------------------------------------------------------------------
| Certification Schema
|--------------------------------------------------------------------------
*/

const certificationSchema = new mongoose.Schema(
  {
    /*
     * ---------------------------------------------------------------
     * BASIC CERTIFICATION INFORMATION
     * ---------------------------------------------------------------
     */

    certificateName: {
      type: String,
      required: [true, "Certificate name is required."],
      trim: true,
      minlength: [2, "Certificate name must contain at least 2 characters."],
      maxlength: [200, "Certificate name cannot exceed 200 characters."],
    },

    issuingOrganization: {
      type: String,
      required: [true, "Issuing organization is required."],
      trim: true,
      minlength: [
        2,
        "Issuing organization must contain at least 2 characters.",
      ],
      maxlength: [200, "Issuing organization cannot exceed 200 characters."],
    },

    description: {
      type: String,
      trim: true,
      maxlength: [2000, "Description cannot exceed 2000 characters."],
      default: "",
    },

    /*
     * ---------------------------------------------------------------
     * CREDENTIAL INFORMATION
     * ---------------------------------------------------------------
     */

    credentialId: {
      type: String,
      trim: true,
      maxlength: [200, "Credential ID cannot exceed 200 characters."],
      default: "",
    },

    credentialUrl: {
      type: String,
      trim: true,
      maxlength: [1000, "Credential URL cannot exceed 1000 characters."],
      default: "",
      validate: {
        validator: function (value) {
          if (!value) {
            return true;
          }

          return /^https?:\/\/\S+$/i.test(value);
        },

        message: "Credential URL must be a valid HTTP or HTTPS URL.",
      },
    },

    /*
     * ---------------------------------------------------------------
     * DATE INFORMATION
     * ---------------------------------------------------------------
     */

    issueDate: {
      type: Date,
      required: [true, "Issue date is required."],
    },

    expiryDate: {
      type: Date,
      default: null,
    },

    doesNotExpire: {
      type: Boolean,
      default: true,
    },

    /*
     * ---------------------------------------------------------------
     * SKILLS AND TECHNOLOGIES
     * ---------------------------------------------------------------
     */

    skills: {
      type: [
        {
          type: String,
          trim: true,
          maxlength: 100,
        },
      ],
      default: [],
    },

    technologies: {
      type: [
        {
          type: String,
          trim: true,
          maxlength: 100,
        },
      ],
      default: [],
    },

    /*
     * ---------------------------------------------------------------
     * CERTIFICATE DOCUMENTS
     * ---------------------------------------------------------------
     *
     * Certificate proof is uploaded through a separate
     * protected admin endpoint.
     *
     * At least one proof source will be enforced
     * in the certification service before publishing.
     *
     */

    documents: {
      type: [certificationDocumentSchema],
      default: [],
      validate: {
        validator: function (documents) {
          return documents.length <= 5;
        },

        message: "A maximum of 5 certification documents is allowed.",
      },
    },

    /*
     * ---------------------------------------------------------------
     * DISPLAY AND STATUS CONTROLS
     * ---------------------------------------------------------------
     */

    isVisible: {
      type: Boolean,
      default: false,
    },

    isFeatured: {
      type: Boolean,
      default: false,
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    displayOrder: {
      type: Number,
      min: 0,
      default: 0,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

/*
|--------------------------------------------------------------------------
| DATE VALIDATION
|--------------------------------------------------------------------------
|
| Expiry date:
| - Must be empty when certification does not expire.
| - Must be greater than or equal to issue date.
|
| Important:
| This middleware is synchronous. It intentionally does not use
| next(), which prevents "next is not a function" errors.
|
*/

certificationSchema.pre("validate", function () {
  if (this.doesNotExpire && this.expiryDate) {
    this.invalidate(
      "expiryDate",
      "Expiry date must be empty when certification does not expire."
    );
  }

  if (!this.doesNotExpire && !this.expiryDate) {
    this.invalidate(
      "expiryDate",
      "Expiry date is required when certification has an expiry."
    );
  }

  if (
    this.issueDate &&
    this.expiryDate &&
    this.expiryDate < this.issueDate
  ) {
    this.invalidate(
      "expiryDate",
      "Expiry date cannot be earlier than issue date."
    );
  }
});

/*
|--------------------------------------------------------------------------
| INDEXES
|--------------------------------------------------------------------------
*/

certificationSchema.index({
  isActive: 1,
  isVisible: 1,
  displayOrder: 1,
});

certificationSchema.index({
  isFeatured: 1,
  isActive: 1,
});

certificationSchema.index({
  issuingOrganization: 1,
});

certificationSchema.index({
  issueDate: -1,
});

/*
|--------------------------------------------------------------------------
| MODEL EXPORT
|--------------------------------------------------------------------------
*/

const Certification =
  mongoose.models.Certification ||
  mongoose.model("Certification", certificationSchema);

module.exports = Certification;
