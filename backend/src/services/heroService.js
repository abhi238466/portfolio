const Hero = require("../models/Hero");

/**
 * Hero CMS
 * ----------
 * This service handles:
 * - Hero fetch
 * - Hero create/update
 * - Input validation
 * - Animated title normalization
 * - CTA normalization
 * - Public data sanitization
 */

const SINGLETON_KEY = "main";

const MAX_ANIMATED_TITLES = 12;
const MAX_TITLE_LENGTH = 80;
const MAX_HEADLINE_LENGTH = 160;
const MAX_DESCRIPTION_LENGTH = 600;
const MAX_CTA_LABEL_LENGTH = 60;
const MAX_URL_LENGTH = 500;

const DEFAULT_HERO_DATA = {
  singletonKey: SINGLETON_KEY,

  headline: "",

  description: "",

  animatedTitles: [],

  primaryCta: {
    label: "View Resume",
    type: "resume",
    url: "",
    visible: true,
  },

  secondaryCta: {
    label: "Contact Me",
    type: "contact",
    url: "",
    visible: true,
  },

  showProfilePhoto: true,
  showSocialLinks: true,
  showResumeButton: true,
  showContactButton: true,

  isActive: true,
};

/**
 * Create a standard application error.
 */
const createError = (message, statusCode = 400) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

/**
 * Normalize string values.
 */
const normalizeString = (
  value,
  fieldName,
  maxLength,
  { required = false, defaultValue = "" } = {}
) => {
  if (value === undefined || value === null) {
    if (required) {
      throw createError(`${fieldName} is required.`);
    }

    return defaultValue;
  }

  if (typeof value !== "string") {
    throw createError(`${fieldName} must be a string.`);
  }

  const normalizedValue = value.trim();

  if (required && !normalizedValue) {
    throw createError(`${fieldName} is required.`);
  }

  if (normalizedValue.length > maxLength) {
    throw createError(
      `${fieldName} cannot be longer than ${maxLength} characters.`
    );
  }

  return normalizedValue;
};

/**
 * Normalize boolean values.
 */
const normalizeBoolean = (value, defaultValue = false) => {
  if (value === undefined || value === null) {
    return defaultValue;
  }

  if (typeof value !== "boolean") {
    throw createError("Boolean fields must contain true or false.");
  }

  return value;
};

/**
 * Check whether URL is:
 * - HTTP
 * - HTTPS
 * - Internal frontend path such as /contact
 */
const isValidActionUrl = (value) => {
  if (!value) {
    return false;
  }

  if (value.startsWith("/") && !value.startsWith("//")) {
    return true;
  }

  try {
    const parsedUrl = new URL(value);

    return parsedUrl.protocol === "http:" || parsedUrl.protocol === "https:";
  } catch {
    return false;
  }
};

/**
 * Normalize one animated title.
 */
const normalizeAnimatedTitle = (title, index) => {
  if (!title || typeof title !== "object") {
    throw createError(`Animated title ${index + 1} is invalid.`);
  }

  const text = normalizeString(
    title.text,
    `Animated title ${index + 1}`,
    MAX_TITLE_LENGTH,
    {
      required: true,
    }
  );

  const visible = normalizeBoolean(title.visible, true);

  let displayOrder = index;

  if (title.displayOrder !== undefined) {
    if (
      typeof title.displayOrder !== "number" ||
      !Number.isInteger(title.displayOrder) ||
      title.displayOrder < 0
    ) {
      throw createError(
        `Animated title ${index + 1} displayOrder must be a non-negative integer.`
      );
    }

    displayOrder = title.displayOrder;
  }

  return {
    ...(title._id ? { _id: title._id } : {}),
    text,
    visible,
    displayOrder,
  };
};

/**
 * Normalize all animated titles.
 */
const normalizeAnimatedTitles = (titles) => {
  if (titles === undefined || titles === null) {
    return [];
  }

  if (!Array.isArray(titles)) {
    throw createError("animatedTitles must be an array.");
  }

  if (titles.length > MAX_ANIMATED_TITLES) {
    throw createError(
      `You can add a maximum of ${MAX_ANIMATED_TITLES} animated titles.`
    );
  }

  const normalizedTitles = titles.map(normalizeAnimatedTitle);

  /**
   * Sort titles according to display order.
   */
  normalizedTitles.sort((a, b) => {
    return a.displayOrder - b.displayOrder;
  });

  /**
   * Rebuild displayOrder sequentially.
   * This prevents duplicate / broken ordering.
   */
  return normalizedTitles.map((title, index) => ({
    ...title,
    displayOrder: index,
  }));
};

/**
 * Normalize CTA button.
 */
const normalizeCta = (
  cta,
  fieldName,
  defaultCta,
  allowedTypes
) => {
  if (cta === undefined || cta === null) {
    return {
      ...defaultCta,
    };
  }

  if (typeof cta !== "object" || Array.isArray(cta)) {
    throw createError(`${fieldName} must be an object.`);
  }

  const label = normalizeString(
    cta.label,
    `${fieldName} label`,
    MAX_CTA_LABEL_LENGTH,
    {
      required: true,
    }
  );

  const type = normalizeString(
    cta.type,
    `${fieldName} type`,
    30,
    {
      required: true,
    }
  );

  if (!allowedTypes.includes(type)) {
    throw createError(
      `${fieldName} type must be one of: ${allowedTypes.join(", ")}.`
    );
  }

  const url = normalizeString(
    cta.url,
    `${fieldName} URL`,
    MAX_URL_LENGTH
  );

  /**
   * Resume and contact buttons don't require a URL
   * because frontend can resolve them dynamically.
   */
  if (
    type === "external" ||
    type === "custom"
  ) {
    if (!url) {
      throw createError(
        `${fieldName} URL is required for ${type} CTA.`
      );
    }

    if (!isValidActionUrl(url)) {
      throw createError(
        `${fieldName} URL must be a valid HTTP/HTTPS URL or internal path.`
      );
    }
  }

  return {
    label,
    type,
    url,
    visible: normalizeBoolean(cta.visible, true),
  };
};

/**
 * Normalize complete Hero payload.
 */
const normalizeHeroPayload = (payload = {}, existingHero = null) => {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    throw createError("Hero data must be a valid object.");
  }

  const existing = existingHero
    ? existingHero.toObject
      ? existingHero.toObject()
      : existingHero
    : DEFAULT_HERO_DATA;

  const headline = normalizeString(
    payload.headline !== undefined
      ? payload.headline
      : existing.headline,
    "Hero headline",
    MAX_HEADLINE_LENGTH,
    {
      required: true,
    }
  );

  const description = normalizeString(
    payload.description !== undefined
      ? payload.description
      : existing.description,
    "Hero description",
    MAX_DESCRIPTION_LENGTH,
    {
      required: true,
    }
  );

  const animatedTitles = normalizeAnimatedTitles(
    payload.animatedTitles !== undefined
      ? payload.animatedTitles
      : existing.animatedTitles
  );

  const primaryCta = normalizeCta(
    payload.primaryCta !== undefined
      ? payload.primaryCta
      : existing.primaryCta,
    "Primary CTA",
    DEFAULT_HERO_DATA.primaryCta,
    ["resume", "external", "custom"]
  );

  const secondaryCta = normalizeCta(
    payload.secondaryCta !== undefined
      ? payload.secondaryCta
      : existing.secondaryCta,
    "Secondary CTA",
    DEFAULT_HERO_DATA.secondaryCta,
    ["contact", "external", "custom"]
  );

  return {
    singletonKey: SINGLETON_KEY,

    headline,

    description,

    animatedTitles,

    primaryCta,

    secondaryCta,

    showProfilePhoto: normalizeBoolean(
      payload.showProfilePhoto !== undefined
        ? payload.showProfilePhoto
        : existing.showProfilePhoto,
      true
    ),

    showSocialLinks: normalizeBoolean(
      payload.showSocialLinks !== undefined
        ? payload.showSocialLinks
        : existing.showSocialLinks,
      true
    ),

    showResumeButton: normalizeBoolean(
      payload.showResumeButton !== undefined
        ? payload.showResumeButton
        : existing.showResumeButton,
      true
    ),

    showContactButton: normalizeBoolean(
      payload.showContactButton !== undefined
        ? payload.showContactButton
        : existing.showContactButton,
      true
    ),

    isActive: normalizeBoolean(
      payload.isActive !== undefined
        ? payload.isActive
        : existing.isActive,
      true
    ),
  };
};

/**
 * Convert MongoDB document into a clean object.
 */
const serializeHero = (hero) => {
  if (!hero) {
    return null;
  }

  const data = hero.toObject ? hero.toObject() : hero;

  return {
    id: data._id ? data._id.toString() : null,

    headline: data.headline || "",

    description: data.description || "",

    animatedTitles: Array.isArray(data.animatedTitles)
      ? data.animatedTitles
          .sort((a, b) => a.displayOrder - b.displayOrder)
          .map((title, index) => ({
            serverId: title._id
              ? title._id.toString()
              : null,
            text: title.text,
            visible: title.visible,
            displayOrder: index,
          }))
      : [],

    primaryCta: {
      label: data.primaryCta?.label || "",
      type: data.primaryCta?.type || "resume",
      url: data.primaryCta?.url || "",
      visible:
        data.primaryCta?.visible !== undefined
          ? data.primaryCta.visible
          : true,
    },

    secondaryCta: {
      label: data.secondaryCta?.label || "",
      type: data.secondaryCta?.type || "contact",
      url: data.secondaryCta?.url || "",
      visible:
        data.secondaryCta?.visible !== undefined
          ? data.secondaryCta.visible
          : true,
    },

    showProfilePhoto: Boolean(data.showProfilePhoto),

    showSocialLinks: Boolean(data.showSocialLinks),

    showResumeButton: Boolean(data.showResumeButton),

    showContactButton: Boolean(data.showContactButton),

    isActive: Boolean(data.isActive),

    createdAt: data.createdAt || null,

    updatedAt: data.updatedAt || null,
  };
};

/**
 * Get Hero for Admin CMS.
 *
 * If Hero has never been saved, return a safe
 * default object without creating a MongoDB document.
 */
const getAdminHero = async () => {
  const hero = await Hero.findOne({
    singletonKey: SINGLETON_KEY,
  });

  if (!hero) {
    return {
      ...DEFAULT_HERO_DATA,
      id: null,
      createdAt: null,
      updatedAt: null,
    };
  }

  return serializeHero(hero);
};

/**
 * Get Hero for public portfolio.
 *
 * Only active Hero is returned.
 */
const getPublicHero = async () => {
  const hero = await Hero.findOne({
    singletonKey: SINGLETON_KEY,
    isActive: true,
  });

  if (!hero) {
    return null;
  }

  return sanitizeHeroForPublic(hero);
};

/**
 * Create or update the single Hero document.
 */
const upsertHero = async (payload) => {
  const existingHero = await Hero.findOne({
    singletonKey: SINGLETON_KEY,
  });

  const normalizedData = normalizeHeroPayload(
    payload,
    existingHero
  );

  const hero = await Hero.findOneAndUpdate(
    {
      singletonKey: SINGLETON_KEY,
    },
    {
      $set: normalizedData,
    },
    {
      new: true,
      upsert: true,
      runValidators: true,
      setDefaultsOnInsert: true,
    }
  );

  return serializeHero(hero);
};

/**
 * Sanitize Hero before sending to public frontend.
 *
 * No admin-only information is exposed.
 */
const sanitizeHeroForPublic = (hero) => {
  if (!hero) {
    return null;
  }

  const data = hero.toObject ? hero.toObject() : hero;

  if (!data.isActive) {
    return null;
  }

  const animatedTitles = Array.isArray(data.animatedTitles)
    ? data.animatedTitles
        .filter((title) => title.visible)
        .sort((a, b) => a.displayOrder - b.displayOrder)
        .map((title) => ({
          text: title.text,
          displayOrder: title.displayOrder,
        }))
    : [];

  const publicData = {
    headline: data.headline || "",

    description: data.description || "",

    animatedTitles,

    primaryCta: data.primaryCta
      ? {
          label: data.primaryCta.label,
          type: data.primaryCta.type,
          url: data.primaryCta.url || "",
          visible: Boolean(data.primaryCta.visible),
        }
      : null,

    secondaryCta: data.secondaryCta
      ? {
          label: data.secondaryCta.label,
          type: data.secondaryCta.type,
          url: data.secondaryCta.url || "",
          visible: Boolean(data.secondaryCta.visible),
        }
      : null,

    showProfilePhoto: Boolean(data.showProfilePhoto),

    showSocialLinks: Boolean(data.showSocialLinks),

    showResumeButton: Boolean(data.showResumeButton),

    showContactButton: Boolean(data.showContactButton),

    isActive: true,
  };

  return publicData;
};

module.exports = {
  getAdminHero,
  getPublicHero,
  upsertHero,
  sanitizeHeroForPublic,
  normalizeHeroPayload,
};