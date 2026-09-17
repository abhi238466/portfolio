const {
  getAdminHero: getAdminHeroService,
  getPublicHero: getPublicHeroService,
  upsertHero,
} = require("../services/heroService");

/**
 * Send standardized error response.
 */
const handleControllerError = (res, error) => {
  console.error("Hero Controller Error:", error);

  const statusCode = error.statusCode || 500;

  return res.status(statusCode).json({
    success: false,
    message:
      statusCode === 500
        ? "Something went wrong while processing the Hero request."
        : error.message,
  });
};

/**
 * GET /api/admin/hero
 *
 * Protected admin endpoint.
 *
 * Returns the complete Hero CMS configuration.
 */
const getAdminHero = async (req, res) => {
  try {
    const hero = await getAdminHeroService();

    return res.status(200).json({
      success: true,
      message: "Hero data fetched successfully.",
      hero,
    });
  } catch (error) {
    return handleControllerError(res, error);
  }
};

/**
 * GET /api/hero
 *
 * Public endpoint.
 *
 * Returns only active and public-safe Hero data.
 */
const getPublicHero = async (req, res) => {
  try {
    const hero = await getPublicHeroService();

    return res.status(200).json({
      success: true,
      message: hero
        ? "Hero data fetched successfully."
        : "No active Hero configuration found.",
      hero,
    });
  } catch (error) {
    return handleControllerError(res, error);
  }
};

/**
 * PUT /api/admin/hero
 *
 * Protected admin endpoint.
 *
 * Creates the Hero configuration if it doesn't exist,
 * otherwise updates the existing configuration.
 */
const updateAdminHero = async (req, res) => {
  try {
    const hero = await upsertHero(req.body);

    return res.status(200).json({
      success: true,
      message: "Hero updated successfully. 🎉",
      hero,
    });
  } catch (error) {
    return handleControllerError(res, error);
  }
};

module.exports = {
  getAdminHero,
  getPublicHero,
  updateAdminHero,
};