const mongoose = require("mongoose");

const educationDocumentSchema = new mongoose.Schema(
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
      enum: ["image", "raw"],
      required: true,
    },

    deliveryType: {
      type: String,
      enum: ["upload", "authenticated"],
      default: "authenticated",
    },

    size: {
      type: Number,
      default: 0,
      min: 0,
    },

    width: {
      type: Number,
      default: null,
      min: 0,
    },

    height: {
      type: Number,
      default: null,
      min: 0,
    },

    documentType: {
      type: String,
      enum: [
        "marksheet",
        "certificate",
        "degree",
        "transcript",
        "other",
      ],
      default: "marksheet",
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

const educationSchema = new mongoose.Schema(
  {
    educationLevel: {
      type: String,
      required: true,
      trim: true,
      enum: [
        "class-10",
        "class-12",
        "graduation",
        "post-graduation",
        "diploma",
        "certification",
        "other",
      ],
    },

    degreeName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },

    institutionName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 250,
    },

    boardOrUniversity: {
      type: String,
      trim: true,
      maxlength: 250,
      default: "",
    },

    fieldOfStudy: {
      type: String,
      trim: true,
      maxlength: 200,
      default: "",
    },

    location: {
      type: String,
      trim: true,
      maxlength: 200,
      default: "",
    },

    startDate: {
      type: Date,
      required: true,
    },

    endDate: {
      type: Date,
      default: null,
    },

    currentlyStudying: {
      type: Boolean,
      default: false,
    },

    duration: {
      type: String,
      trim: true,
      maxlength: 100,
      default: "",
    },

    grade: {
      type: String,
      trim: true,
      maxlength: 100,
      default: "",
    },

    percentage: {
      type: Number,
      min: 0,
      max: 100,
      default: null,
    },

    cgpa: {
      type: Number,
      min: 0,
      default: null,
    },

    description: {
      type: String,
      trim: true,
      maxlength: 2000,
      default: "",
    },

    highlights: {
      type: [String],
      default: [],
    },

    officialVerificationUrl: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: "",
    },

    documents: {
      type: [educationDocumentSchema],
      default: [],
    },

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

educationSchema.index({
  isActive: 1,
  isVisible: 1,
  displayOrder: 1,
});

educationSchema.index({
  isFeatured: 1,
  isActive: 1,
});

educationSchema.index({
  startDate: -1,
});

module.exports = mongoose.model("Education", educationSchema);