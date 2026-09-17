const express = require("express");

const {
  getAdminHero,
  getPublicHero,
  updateAdminHero,
} = require("../controllers/heroController");

const { protectAdmin } = require("../middleware/authMiddleware");

/**
 * =========================================================
 * PUBLIC HERO ROUTES
 * =========================================================
 *
 * GET /api/hero
 *
 * Public portfolio ke liye active Hero data.
 */
const publicHeroRouter = express.Router();

publicHeroRouter.get("/", getPublicHero);

/**
 * =========================================================
 * ADMIN HERO ROUTES
 * =========================================================
 *
 * Base URL:
 * /api/admin/hero
 *
 * Saare admin Hero routes protected hain.
 */
const adminHeroRouter = express.Router();

adminHeroRouter.use(protectAdmin);

/**
 * GET /api/admin/hero
 *
 * Admin CMS ke liye complete Hero configuration.
 */
adminHeroRouter.get("/", getAdminHero);

/**
 * PUT /api/admin/hero
 *
 * Hero configuration create/update.
 */
adminHeroRouter.put("/", updateAdminHero);

module.exports = {
  publicHeroRouter,
  adminHeroRouter,
};