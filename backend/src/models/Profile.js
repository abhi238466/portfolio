const mongoose = require("mongoose");

/*
|--------------------------------------------------------------------------
| PROFILE LINK SCHEMA
|--------------------------------------------------------------------------
|
| Stores GitHub, LinkedIn, Website and future professional links.
| Brand-specific icons are handled by frontend, not stored in MongoDB.
|
*/

const profileLinkSchema = new mongoose.Schema(
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
        "linkedin",
        "email",
        "website",
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
| PROFILE PHOTO SCHEMA
|--------------------------------------------------------------------------
|
| Actual image will later be stored in persistent cloud storage
| such as Cloudinary.
|
| MongoDB stores only the cloud reference/URL and metadata.
|
*/

const profilePhotoSchema = new mongoose.Schema(
  {
    url: {
      type: String,
      trim: true,
      default: "",
    },

    publicId: {
      type: String,
      trim: true,
      default: "",
    },

    originalName: {
      type: String,
      trim: true,
      default: "",
    },

    mimeType: {
      type: String,
      trim: true,
      default: "",
    },

    size: {
      type: Number,
      default: 0,
      min: 0,
    },

    visible: {
      type: Boolean,
      default: true,
    },
  },
  {
    _id: false,
  }
);

/*
|--------------------------------------------------------------------------
| RESUME SCHEMA
|--------------------------------------------------------------------------
|
| Current active resume.
| File itself will be stored in persistent cloud storage.
|
*/

const resumeSchema = new mongoose.Schema(
  {
    url: {
      type: String,
      trim: true,
      default: "",
    },

    publicId: {
      type: String,
      trim: true,
      default: "",
    },

    /*
    |--------------------------------------------------------------------------
    | CLOUDINARY RESOURCE TYPE
    |--------------------------------------------------------------------------
    |
    | Example:
    | - raw
    | - image
    | - video
    |
    */

    resourceType: {
      type: String,
      trim: true,
      default: "raw",
    },

    /*
    |--------------------------------------------------------------------------
    | CLOUDINARY DELIVERY TYPE
    |--------------------------------------------------------------------------
    |
    | Example:
    | - upload
    | - authenticated
    |
    */

    deliveryType: {
      type: String,
      trim: true,
      default: "authenticated",
    },

    /*
    |--------------------------------------------------------------------------
    | CLOUDINARY FILE FORMAT
    |--------------------------------------------------------------------------
    |
    | Stored only when available.
    | Empty string prevents forcing a format in signed URLs.
    |
    */

    format: {
      type: String,
      trim: true,
      default: "",
    },

    originalName: {
      type: String,
      trim: true,
      default: "",
    },

    mimeType: {
      type: String,
      trim: true,
      default: "application/pdf",
    },

    size: {
      type: Number,
      default: 0,
      min: 0,
    },

    visible: {
      type: Boolean,
      default: true,
    },
  },
  {
    _id: false,
  }
);

/*
|--------------------------------------------------------------------------
| PROFILE VISIBILITY SCHEMA
|--------------------------------------------------------------------------
|
| Controls which professional contact details can appear publicly.
|
*/

const visibilitySchema = new mongoose.Schema(
  {
    email: {
      type: Boolean,
      default: true,
    },

    phone: {
      type: Boolean,
      default: true,
    },

    currentAddress: {
      type: Boolean,
      default: false,
    },

    permanentAddress: {
      type: Boolean,
      default: false,
    },
  },
  {
    _id: false,
  }
);

/*
|--------------------------------------------------------------------------
| PROFILE SCHEMA
|--------------------------------------------------------------------------
*/

const profileSchema = new mongoose.Schema(
  {
    /*
    |--------------------------------------------------------------------------
    | IDENTITY
    |--------------------------------------------------------------------------
    */

    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },

    headline: {
      type: String,
      trim: true,
      default: "",
      maxlength: 160,
    },

    shortBio: {
      type: String,
      trim: true,
      default: "",
      maxlength: 600,
    },

    /*
    |--------------------------------------------------------------------------
    | PROFILE PHOTO
    |--------------------------------------------------------------------------
    */

    profilePhoto: {
      type: profilePhotoSchema,
      default: null,
    },

    /*
    |--------------------------------------------------------------------------
    | CONTACT INFORMATION
    |--------------------------------------------------------------------------
    */

    email: {
      type: String,
      trim: true,
      lowercase: true,
      default: "",
      maxlength: 254,
    },

    phone: {
      type: String,
      trim: true,
      default: "",
      maxlength: 30,
    },

    currentAddress: {
      type: String,
      trim: true,
      default: "",
      maxlength: 300,
    },

    permanentAddress: {
      type: String,
      trim: true,
      default: "",
      maxlength: 300,
    },

    /*
    |--------------------------------------------------------------------------
    | PROFESSIONAL LINKS
    |--------------------------------------------------------------------------
    */

    links: {
      type: [profileLinkSchema],
      default: [],
    },

    /*
    |--------------------------------------------------------------------------
    | RESUME
    |--------------------------------------------------------------------------
    */

    resume: {
      type: resumeSchema,
      default: null,
    },

    /*
    |--------------------------------------------------------------------------
    | PUBLIC VISIBILITY
    |--------------------------------------------------------------------------
    */

    visibility: {
      type: visibilitySchema,
      default: () => ({}),
    },

    /*
    |--------------------------------------------------------------------------
    | PROFILE STATUS
    |--------------------------------------------------------------------------
    |
    | Allows the admin to keep the profile record active/inactive
    | without deleting the stored information.
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
| SINGLE PROFILE RECORD
|--------------------------------------------------------------------------
|
| This portfolio currently has one public profile.
| The controller/service will enforce the single-record behavior.
|
*/

const Profile = mongoose.model(
  "Profile",
  profileSchema
);

module.exports = Profile;