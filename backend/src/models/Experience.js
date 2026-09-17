const mongoose = require("mongoose");

/*
|--------------------------------------------------------------------------
| EXPERIENCE DOCUMENT / CERTIFICATE SCHEMA
|--------------------------------------------------------------------------
|
| Experience documents are stored as Cloudinary metadata.
| Sensitive document delivery will be handled securely by the
| backend service/controller layer and should not expose permanent
| public URLs on the public portfolio.
|
*/

const experienceDocumentSchema =
  new mongoose.Schema(
    {
      publicId: {
        type: String,
        required: true,
        trim: true,
      },

      url: {
        type: String,
        default: "",
        trim: true,
      },

      originalName: {
        type: String,
        required: true,
        trim: true,
        maxlength: 255,
      },

      mimeType: {
        type: String,
        required: true,
        trim: true,
      },

      resourceType: {
        type: String,
        enum: [
          "image",
          "raw",
        ],
        default: "raw",
      },

      deliveryType: {
        type: String,
        enum: [
          "authenticated",
          "upload",
        ],
        default: "authenticated",
      },

      size: {
        type: Number,
        required: true,
        min: 1,
      },

      width: {
        type: Number,
        default: null,
        min: 1,
      },

      height: {
        type: Number,
        default: null,
        min: 1,
      },

      documentType: {
        type: String,
        enum: [
          "certificate",
          "document",
          "other",
        ],
        default: "certificate",
      },

      displayOrder: {
        type: Number,
        default: 0,
        min: 0,
      },
    },
    {
      _id: true,
    }
  );

/*
|--------------------------------------------------------------------------
| EXPERIENCE SCHEMA
|--------------------------------------------------------------------------
*/

const experienceSchema =
  new mongoose.Schema(
    {
      /*
      |--------------------------------------------------------------------------
      | COMPANY INFORMATION
      |--------------------------------------------------------------------------
      */

      companyName: {
        type: String,
        required: true,
        trim: true,
        maxlength: 200,
      },

      companyWebsite: {
        type: String,
        trim: true,
        default: "",
      },

      role: {
        type: String,
        required: true,
        trim: true,
        maxlength: 200,
      },

      experienceType: {
        type: String,
        required: true,
        enum: [
          "internship",
          "full-time",
          "part-time",
          "freelance",
          "trainee",
          "contract",
          "other",
        ],
      },

      /*
      |--------------------------------------------------------------------------
      | TIMELINE
      |--------------------------------------------------------------------------
      */

      startDate: {
        type: Date,
        required: true,
      },

      endDate: {
        type: Date,
        default: null,
      },

      currentlyWorking: {
        type: Boolean,
        default: false,
      },

      duration: {
        type: String,
        trim: true,
        maxlength: 100,
        default: "",
      },

      /*
      |--------------------------------------------------------------------------
      | LOCATION / WORK MODE
      |--------------------------------------------------------------------------
      */

      location: {
        type: String,
        trim: true,
        maxlength: 200,
        default: "",
      },

      workMode: {
        type: String,
        enum: [
          "on-site",
          "hybrid",
          "remote",
          "other",
        ],
        default: "on-site",
      },

      /*
      |--------------------------------------------------------------------------
      | EXPERIENCE DESCRIPTION
      |--------------------------------------------------------------------------
      */

      description: {
        type: String,
        trim: true,
        maxlength: 3000,
        default: "",
      },

      responsibilities: {
        type: [
          {
            type: String,
            trim: true,
            maxlength: 500,
          },
        ],
        default: [],
      },

      /*
      |--------------------------------------------------------------------------
      | TECHNOLOGIES + SKILLS
      |--------------------------------------------------------------------------
      */

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

      /*
      |--------------------------------------------------------------------------
      | RELATED PROJECT
      |--------------------------------------------------------------------------
      |
      | Optional reference to a project from the Project collection.
      |
      */

      relatedProject: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Project",
        default: null,
      },

      /*
      |--------------------------------------------------------------------------
      | CERTIFICATE / DOCUMENTS
      |--------------------------------------------------------------------------
      */

      documents: {
        type: [
          experienceDocumentSchema,
        ],
        default: [],
      },

      certificateUrl: {
        type: String,
        trim: true,
        default: "",
      },

      /*
      |--------------------------------------------------------------------------
      | DISPLAY SETTINGS
      |--------------------------------------------------------------------------
      */

      isVisible: {
        type: Boolean,
        default: true,
      },

      isFeatured: {
        type: Boolean,
        default: false,
      },

      displayOrder: {
        type: Number,
        default: 0,
        min: 0,
      },

      isActive: {
        type: Boolean,
        default: true,
      },
    },
    {
      timestamps: true,
    }
  );

/*
|--------------------------------------------------------------------------
| INDEXES
|--------------------------------------------------------------------------
*/

experienceSchema.index({
  isActive: 1,
  isVisible: 1,
  displayOrder: 1,
});

experienceSchema.index({
  isFeatured: 1,
  isActive: 1,
});

experienceSchema.index({
  startDate: -1,
});

/*
|--------------------------------------------------------------------------
| MODEL
|--------------------------------------------------------------------------
*/

const Experience =
  mongoose.model(
    "Experience",
    experienceSchema
  );

module.exports = Experience;
