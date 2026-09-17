const express = require("express");

const {
  loginAdmin,
  logoutAdmin,
  getCurrentAdmin,

  requestPasswordResetOtp,
  verifyPasswordResetOtpController,
  resetAdminPassword,
} = require("../controllers/adminController");

const {
  protectAdmin,
} = require("../middleware/authMiddleware");

const {
  adminLoginRateLimiter,
} = require("../middleware/rateLimitMiddleware");

const router = express.Router();

/*
|--------------------------------------------------------------------------
| Public Admin Authentication Routes
|--------------------------------------------------------------------------
*/

/**
 * @route   POST /api/admin/login
 * @desc    Authenticate admin and create secure session
 * @access  Public
 *
 * Security:
 * - Login rate limiting
 * - Email/password validation
 * - bcrypt password verification
 * - HTTP-only authentication cookie
 */
router.post(
  "/login",
  adminLoginRateLimiter,
  loginAdmin
);

/**
 * @route   POST /api/admin/logout
 * @desc    Logout admin and clear authentication cookie
 * @access  Public
 *
 * Logout itself does not require an active session because
 * the endpoint safely clears the authentication cookie.
 */
router.post(
  "/logout",
  logoutAdmin
);

/*
|--------------------------------------------------------------------------
| Forgot Password Routes
|--------------------------------------------------------------------------
|
| These routes are intentionally public because an admin who
| has forgotten the password cannot already be authenticated.
|
*/

/**
 * @route   POST /api/admin/forgot-password
 * @desc    Send password reset OTP to registered admin email
 * @access  Public
 *
 * Flow:
 * - Validate email
 * - Find active admin
 * - Generate secure OTP
 * - Store only OTP hash
 * - Send OTP through Resend HTTPS API
 *
 * Wrong email:
 * - No OTP generated
 * - No email sent
 * - Clear warning returned
 */
router.post(
  "/forgot-password",
  requestPasswordResetOtp
);

/**
 * @route   POST /api/admin/verify-otp
 * @desc    Verify password reset OTP
 * @access  Public
 *
 * Successful verification creates a temporary
 * server-side password-reset verification state.
 */
router.post(
  "/verify-otp",
  verifyPasswordResetOtpController
);

/**
 * @route   POST /api/admin/reset-password
 * @desc    Set a new admin password after OTP verification
 * @access  Public
 *
 * Security:
 * - OTP verification required
 * - Verification expiry checked
 * - New password validation
 * - bcrypt password hashing
 * - Password reset state cleared
 * - Old password becomes invalid
 * - Admin must login again with new password
 */
router.post(
  "/reset-password",
  resetAdminPassword
);

/*
|--------------------------------------------------------------------------
| Protected Admin Routes
|--------------------------------------------------------------------------
*/

/**
 * @route   GET /api/admin/me
 * @desc    Get currently authenticated admin
 * @access  Private - Admin
 *
 * Security:
 * - Authentication cookie required
 * - JWT verification
 * - Admin role verification
 */
router.get(
  "/me",
  protectAdmin,
  getCurrentAdmin
);

/*
|--------------------------------------------------------------------------
| Export Router
|--------------------------------------------------------------------------
*/

module.exports = router;