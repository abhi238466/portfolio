const Admin = require("../models/Admin");

const {
  generateOtp,
  hashOtp,
  verifyOtp,
  getOtpExpiryTime,
  isOtpExpired,
} = require("../utils/otpUtils");

/*
|--------------------------------------------------------------------------
| Configuration
|--------------------------------------------------------------------------
*/

const MAX_OTP_ATTEMPTS = 5;
const OTP_RESEND_COOLDOWN_SECONDS = 60;

/*
|--------------------------------------------------------------------------
| Find Active Admin
|--------------------------------------------------------------------------
*/

const findActiveAdminByEmail = async (email) => {
  if (!email) {
    return null;
  }

  const normalizedEmail = email.trim().toLowerCase();

  return Admin.findOne({
    email: normalizedEmail,
    isActive: true,
  });
};

/*
|--------------------------------------------------------------------------
| Check OTP Resend Cooldown
|--------------------------------------------------------------------------
*/

const getRemainingResendSeconds = (lastSentAt) => {
  if (!lastSentAt) {
    return 0;
  }

  const lastSentTime = new Date(lastSentAt).getTime();

  if (Number.isNaN(lastSentTime)) {
    return 0;
  }

  const elapsedSeconds = Math.floor(
    (Date.now() - lastSentTime) / 1000
  );

  const remainingSeconds =
    OTP_RESEND_COOLDOWN_SECONDS - elapsedSeconds;

  return Math.max(0, remainingSeconds);
};

/*
|--------------------------------------------------------------------------
| Create Password Reset OTP
|--------------------------------------------------------------------------
|
| Generates a new OTP, hashes it and stores only the hash.
|
*/

const createPasswordResetOtp = async (admin) => {
  if (!admin) {
    throw new Error("Admin account not found");
  }

  const remainingSeconds = getRemainingResendSeconds(
    admin.resetOtpLastSentAt
  );

  if (remainingSeconds > 0) {
    const error = new Error(
      `Please wait ${remainingSeconds} seconds before requesting another OTP.`
    );

    error.code = "OTP_RESEND_COOLDOWN";
    error.remainingSeconds = remainingSeconds;

    throw error;
  }

  const otp = generateOtp();
  const otpHash = await hashOtp(otp);
  const otpExpiresAt = getOtpExpiryTime();

  admin.resetOtpHash = otpHash;
  admin.resetOtpExpiresAt = otpExpiresAt;
  admin.resetOtpAttempts = 0;
  admin.resetOtpLastSentAt = new Date();

  /*
   * A newly generated OTP invalidates
   * any previous password-reset verification state.
   */

  admin.passwordResetVerifiedAt = null;

  await admin.save();

  return {
    otp,
    expiresAt: otpExpiresAt,
  };
};

/*
|--------------------------------------------------------------------------
| Verify Password Reset OTP
|--------------------------------------------------------------------------
*/

const verifyPasswordResetOtp = async (
  admin,
  enteredOtp
) => {
  if (!admin) {
    throw new Error("Admin account not found");
  }

  if (!enteredOtp) {
    const error = new Error("OTP is required.");

    error.code = "OTP_REQUIRED";

    throw error;
  }

  const normalizedOtp = String(enteredOtp).trim();

  /*
   * OTP must contain exactly 6 digits.
   */

  if (!/^\d{6}$/.test(normalizedOtp)) {
    const error = new Error(
      "OTP must be a valid 6-digit number."
    );

    error.code = "INVALID_OTP_FORMAT";

    throw error;
  }

  /*
   * Check whether an OTP exists.
   */

  if (!admin.resetOtpHash || !admin.resetOtpExpiresAt) {
    const error = new Error(
      "No active OTP found. Please request a new OTP."
    );

    error.code = "OTP_NOT_FOUND";

    throw error;
  }

  /*
   * Check OTP expiry.
   */

  if (isOtpExpired(admin.resetOtpExpiresAt)) {
    admin.resetOtpHash = null;
    admin.resetOtpExpiresAt = null;
    admin.resetOtpAttempts = 0;
    admin.resetOtpLastSentAt = null;
    admin.passwordResetVerifiedAt = null;

    await admin.save();

    const error = new Error(
      "Your OTP has expired. Please request a new OTP."
    );

    error.code = "OTP_EXPIRED";

    throw error;
  }

  /*
   * Check maximum attempts.
   */

  if (admin.resetOtpAttempts >= MAX_OTP_ATTEMPTS) {
    admin.resetOtpHash = null;
    admin.resetOtpExpiresAt = null;
    admin.resetOtpAttempts = 0;
    admin.resetOtpLastSentAt = null;
    admin.passwordResetVerifiedAt = null;

    await admin.save();

    const error = new Error(
      "Too many incorrect OTP attempts. Please request a new OTP."
    );

    error.code = "OTP_MAX_ATTEMPTS";

    throw error;
  }

  const isValidOtp = await verifyOtp(
    normalizedOtp,
    admin.resetOtpHash
  );

  /*
   * Incorrect OTP
   */

  if (!isValidOtp) {
    admin.resetOtpAttempts += 1;

    const attemptsRemaining = Math.max(
      0,
      MAX_OTP_ATTEMPTS - admin.resetOtpAttempts
    );

    /*
     * Invalidate OTP immediately after
     * the final unsuccessful attempt.
     */

    if (admin.resetOtpAttempts >= MAX_OTP_ATTEMPTS) {
      admin.resetOtpHash = null;
      admin.resetOtpExpiresAt = null;
      admin.resetOtpAttempts = 0;
      admin.resetOtpLastSentAt = null;
      admin.passwordResetVerifiedAt = null;
    }

    await admin.save();

    const error = new Error(
      attemptsRemaining > 0
        ? `Incorrect OTP. ${attemptsRemaining} attempt(s) remaining.`
        : "Too many incorrect OTP attempts. Please request a new OTP."
    );

    error.code =
      attemptsRemaining > 0
        ? "INVALID_OTP"
        : "OTP_MAX_ATTEMPTS";

    error.attemptsRemaining = attemptsRemaining;

    throw error;
  }

  /*
   * Successful OTP verification.
   *
   * We do NOT change the password here.
   * Instead, we create a short-lived verified
   * reset state that the password reset endpoint
   * will check.
   */

  admin.passwordResetVerifiedAt = new Date();

  /*
   * OTP becomes unusable after successful verification.
   */

  admin.resetOtpHash = null;
  admin.resetOtpExpiresAt = null;
  admin.resetOtpAttempts = 0;
  admin.resetOtpLastSentAt = null;

  await admin.save();

  return {
    success: true,
    verifiedAt: admin.passwordResetVerifiedAt,
  };
};

/*
|--------------------------------------------------------------------------
| Check Password Reset Verification
|--------------------------------------------------------------------------
|
| Password can only be changed after successful OTP
| verification.
|
*/

const isPasswordResetVerified = (admin) => {
  if (!admin || !admin.passwordResetVerifiedAt) {
    return false;
  }

  const verifiedAt = new Date(
    admin.passwordResetVerifiedAt
  ).getTime();

  if (Number.isNaN(verifiedAt)) {
    return false;
  }

  /*
   * Password reset verification remains valid
   * for 10 minutes.
   */

  const verificationWindowMs =
    10 * 60 * 1000;

  return (
    Date.now() - verifiedAt <=
    verificationWindowMs
  );
};

/*
|--------------------------------------------------------------------------
| Clear Password Reset State
|--------------------------------------------------------------------------
*/

const clearPasswordResetState = async (admin) => {
  if (!admin) {
    return;
  }

  admin.resetOtpHash = null;
  admin.resetOtpExpiresAt = null;
  admin.resetOtpAttempts = 0;
  admin.resetOtpLastSentAt = null;
  admin.passwordResetVerifiedAt = null;

  await admin.save();
};

/*
|--------------------------------------------------------------------------
| Exports
|--------------------------------------------------------------------------
*/

module.exports = {
  MAX_OTP_ATTEMPTS,
  OTP_RESEND_COOLDOWN_SECONDS,
  findActiveAdminByEmail,
  getRemainingResendSeconds,
  createPasswordResetOtp,
  verifyPasswordResetOtp,
  isPasswordResetVerified,
  clearPasswordResetState,
};