const mongoose = require("mongoose");

/*
|--------------------------------------------------------------------------
| PROJECT IMAGE SCHEMA
|--------------------------------------------------------------------------
|
| Project ke multiple screenshots/images Cloudinary par store honge.
|
| MongoDB mein actual image file nahi jayegi.
| Sirf Cloudinary metadata/reference store hoga.
|
| IMPORTANT:
| - Original image aspect ratio preserve rahega.
| - Image crop nahi hogi.
| - Image stretch nahi hogi.
| - Forced aspect ratio nahi lagaya jayega.
| - Original width aur height store ki jayegi.
|
*/

const projectImageSchema =
  new mongoose.Schema(
    {
      /*
      |--------------------------------------------------------------------------
      | CLOUDINARY REFERENCE
      |--------------------------------------------------------------------------
      */

      publicId: {
        type: String,
        required: true,
        trim: true,
        maxlength: 500,
      },

      /*
      |--------------------------------------------------------------------------
      | PUBLIC IMAGE URL
      |--------------------------------------------------------------------------
      |
      | Project screenshots public portfolio par dikhaye ja sakte hain.
      |
      */

      url: {
        type: String,
        required: true,
        trim: true,
        maxlength: 1000,
      },

      /*
      |--------------------------------------------------------------------------
      | ORIGINAL FILE INFORMATION
      |--------------------------------------------------------------------------
      */

      originalName: {
        type: String,
        required: true,
        trim: true,
        maxlength: 255,
      },

      mimeType: {
        type: String,
        required: true,
        enum: [
          "image/jpeg",
          "image/png",
          "image/webp",
        ],
      },

      size: {
        type: Number,
        required: true,
        min: 0,
      },

      /*
      |--------------------------------------------------------------------------
      | ORIGINAL IMAGE DIMENSIONS
      |--------------------------------------------------------------------------
      |
      | Cloudinary upload ke time actual image dimensions
      | yahan store hongi.
      |
      | Example:
      |
      | width: 1920
      | height: 1080
      |
      | Ya:
      |
      | width: 1080
      | height: 1920
      |
      | Frontend in dimensions ka use karke image ko
      | original proportion mein render karega.
      |
      */

      width: {
        type: Number,
        required: true,
        min: 1,
      },

      height: {
        type: Number,
        required: true,
        min: 1,
      },

      /*
      |--------------------------------------------------------------------------
      | IMAGE DISPLAY SETTINGS
      |--------------------------------------------------------------------------
      */

      isPrimary: {
        type: Boolean,
        default: false,
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
| PROJECT LINK SCHEMA
|--------------------------------------------------------------------------
|
| Optional professional links associated with a project.
|
*/

const projectLinkSchema =
  new mongoose.Schema(
    {
      label: {
        type: String,
        required: true,
        trim: true,
        maxlength: 60,
      },

      url: {
        type: String,
        required: true,
        trim: true,
        maxlength: 500,
      },

      type: {
        type: String,
        enum: [
          "github",
          "live",
          "other",
        ],
        default: "other",
      },

      visible: {
        type: Boolean,
        default: true,
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
| PROJECT SCHEMA
|--------------------------------------------------------------------------
*/

const projectSchema =
  new mongoose.Schema(
    {
      /*
      |--------------------------------------------------------------------------
      | BASIC INFORMATION
      |--------------------------------------------------------------------------
      */

      title: {
        type: String,
        required: [
          true,
          "Project title is required.",
        ],
        trim: true,
        maxlength: [
          150,
          "Project title cannot exceed 150 characters.",
        ],
      },

      shortDescription: {
        type: String,
        required: [
          true,
          "Short description is required.",
        ],
        trim: true,
        maxlength: [
          300,
          "Short description cannot exceed 300 characters.",
        ],
      },

      fullDescription: {
        type: String,
        trim: true,
        default: "",
        maxlength: [
          3000,
          "Full description cannot exceed 3000 characters.",
        ],
      },

      category: {
        type: String,
        required: [
          true,
          "Project category is required.",
        ],
        trim: true,
        maxlength: [
          100,
          "Project category cannot exceed 100 characters.",
        ],
      },

      role: {
        type: String,
        trim: true,
        default: "",
        maxlength: [
          150,
          "Project role cannot exceed 150 characters.",
        ],
      },

      /*
      |--------------------------------------------------------------------------
      | TECHNOLOGIES
      |--------------------------------------------------------------------------
      |
      | At least one technology is required.
      |
      */

      technologies: {
        type: [
          {
            type: String,
            trim: true,
            maxlength: 80,
          },
        ],

        required: [
          true,
          "At least one technology is required.",
        ],

        validate: {
          validator: function (value) {
            return (
              Array.isArray(value) &&
              value.length >= 1
            );
          },

          message:
            "At least one technology is required.",
        },
      },

      /*
      |--------------------------------------------------------------------------
      | FEATURES
      |--------------------------------------------------------------------------
      |
      | Optional dynamic feature list.
      |
      */

      features: {
        type: [
          {
            type: String,
            trim: true,
            maxlength: 200,
          },
        ],

        default: [],
      },

      /*
      |--------------------------------------------------------------------------
      | PROJECT IMAGES
      |--------------------------------------------------------------------------
      |
      | Multiple screenshots/images allowed.
      |
      | Each image:
      | - Keeps its original aspect ratio.
      | - Is not cropped.
      | - Is not stretched.
      | - Stores original width/height.
      |
      */

      images: {
        type: [
          projectImageSchema,
        ],

        default: [],
      },

      /*
      |--------------------------------------------------------------------------
      | PROJECT LINKS
      |--------------------------------------------------------------------------
      */

      links: {
        type: [
          projectLinkSchema,
        ],

        default: [],
      },

      githubUrl: {
        type: String,
        trim: true,
        default: "",
        maxlength: 500,
      },

      liveDemoUrl: {
        type: String,
        trim: true,
        default: "",
        maxlength: 500,
      },

      /*
      |--------------------------------------------------------------------------
      | DATES
      |--------------------------------------------------------------------------
      */

      startDate: {
        type: Date,
        default: null,
      },

      endDate: {
        type: Date,
        default: null,
      },

      /*
      |--------------------------------------------------------------------------
      | PROJECT STATUS
      |--------------------------------------------------------------------------
      */

      status: {
        type: String,

        required: [
          true,
          "Project status is required.",
        ],

        enum: {
          values: [
            "completed",
            "in-progress",
            "planned",
          ],

          message:
            "Project status must be completed, in-progress, or planned.",
        },

        default: "completed",
      },

      /*
      |--------------------------------------------------------------------------
      | TEAM INFORMATION
      |--------------------------------------------------------------------------
      */

      projectType: {
        type: String,

        required: [
          true,
          "Project type is required.",
        ],

        enum: {
          values: [
            "individual",
            "team",
          ],

          message:
            "Project type must be individual or team.",
        },

        default: "individual",
      },

      teamSize: {
        type: Number,

        min: [
          1,
          "Team size must be at least 1.",
        ],

        default: null,
      },

      /*
      |--------------------------------------------------------------------------
      | FUTURE IMPROVEMENTS
      |--------------------------------------------------------------------------
      */

      futureImprovements: {
        type: String,

        trim: true,

        default: "",

        maxlength: [
          2000,
          "Future improvements cannot exceed 2000 characters.",
        ],
      },

      /*
      |--------------------------------------------------------------------------
      | PUBLIC DISPLAY SETTINGS
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

      /*
      |--------------------------------------------------------------------------
      | ACTIVE STATUS
      |--------------------------------------------------------------------------
      |
      | Allows the project to be disabled without
      | deleting its data.
      |
      */

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
|
| Helpful for public project listing and featured project queries.
|
*/

projectSchema.index({
  isActive: 1,
  isVisible: 1,
  displayOrder: 1,
});

projectSchema.index({
  isActive: 1,
  isVisible: 1,
  isFeatured: 1,
  displayOrder: 1,
});

/*
|--------------------------------------------------------------------------
| MODEL
|--------------------------------------------------------------------------
*/

const Project =
  mongoose.model(
    "Project",
    projectSchema
  );

module.exports = Project;