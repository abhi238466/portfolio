const mongoose = require("mongoose");

/**
 * Animated title schema
 * Example:
 * Full Stack Developer
 * Java Developer
 * MERN Stack Developer
 */
const animatedTitleSchema = new mongoose.Schema(
  {
    text: {
      type: String,
      required: true,
      trim: true,
      maxlength: 80,
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

/**
 * CTA button schema
 *
 * Supported types:
 * - resume
 * - contact
 * - external
 * - custom
 */
const ctaSchema = new mongoose.Schema(
  {
    label: {
      type: String,
      required: true,
      trim: true,
      maxlength: 60,
    },

    type: {
      type: String,
      enum: ["resume", "contact", "external", "custom"],
      required: true,
    },

    url: {
      type: String,
      trim: true,
      maxlength: 500,
      default: "",
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

/**
 * Main Hero schema
 *
 * singletonKey ensures that the portfolio has
 * only one main Hero configuration.
 */
const heroSchema = new mongoose.Schema(
  {
    singletonKey: {
      type: String,
      required: true,
      unique: true,
      default: "main",
      immutable: true,
    },

    /**
     * Main Hero heading
     */
    headline: {
      type: String,
      trim: true,
      maxlength: 160,
      default: "",
    },

    /**
     * Short introduction displayed below headline
     */
    description: {
      type: String,
      trim: true,
      maxlength: 600,
      default: "",
    },

    /**
     * Animated titles shown below/around the Hero heading
     */
    animatedTitles: {
      type: [animatedTitleSchema],
      default: [],
    },

    /**
     * Primary Hero CTA
     */
    primaryCta: {
      type: ctaSchema,
      default: () => ({
        label: "View Resume",
        type: "resume",
        url: "",
        visible: true,
      }),
    },

    /**
     * Secondary Hero CTA
     */
    secondaryCta: {
      type: ctaSchema,
      default: () => ({
        label: "Contact Me",
        type: "contact",
        url: "",
        visible: true,
      }),
    },

    /**
     * Display controls
     */
    showProfilePhoto: {
      type: Boolean,
      default: true,
    },

    showSocialLinks: {
      type: Boolean,
      default: true,
    },

    showResumeButton: {
      type: Boolean,
      default: true,
    },

    showContactButton: {
      type: Boolean,
      default: true,
    },

    /**
     * Whether the Hero section is publicly active
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

/**
 * Export Hero model
 */
const Hero = mongoose.model("Hero", heroSchema);

module.exports = Hero;