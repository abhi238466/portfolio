const crypto = require("crypto");
const bcrypt = require("bcryptjs");

/*
|--------------------------------------------------------------------------
| OTP Configuration
|--------------------------------------------------------------------------
|
| Centralized configuration for Forgot Password OTP.
|
*/

const OTP_LENGTH = 6;
const OTP_EXPIRY_MINUTES = 10;

/*
|--------------------------------------------------------------------------
| Generate OTP
|--------------------------------------------------------------------------
|
| Generates a cryptographically secure numeric OTP.
|
| Example:
| 483921
|
*/

const generateOtp = () => {
  const minimum = 10 ** (OTP_LENGTH - 1);
  const maximum = 10 ** OTP_LENGTH;

  const otpNumber =
    crypto.randomInt(minimum, maximum);

  return String(otpNumber);
};

/*
|--------------------------------------------------------------------------
| Hash OTP
|--------------------------------------------------------------------------
|
| The plain OTP should never be stored in MongoDB.
| We hash it before saving.
|
*/

const hashOtp = async (otp) => {
  if (!otp) {
    throw new Error("OTP is required for hashing");
  }

  return bcrypt.hash(otp, 12);
};

/*
|--------------------------------------------------------------------------
| Verify OTP
|--------------------------------------------------------------------------
|
| Compares the user-provided OTP with the stored hash.
|
*/

const verifyOtp = async (
  otp,
  otpHash
) => {
  if (!otp || !otpHash) {
    return false;
  }

  return bcrypt.compare(
    otp,
    otpHash
  );
};

/*
|--------------------------------------------------------------------------
| OTP Expiry
|--------------------------------------------------------------------------
|
| Creates the expiry timestamp from the current time.
|
*/

const getOtpExpiryTime = () => {
  return new Date(
    Date.now() +
      OTP_EXPIRY_MINUTES * 60 * 1000
  );
};

/*
|--------------------------------------------------------------------------
| OTP Expiry Check
|--------------------------------------------------------------------------
|
| Returns true when the OTP is missing or expired.
|
*/

const isOtpExpired = (
  expiresAt
) => {
  if (!expiresAt) {
    return true;
  }

  return new Date(expiresAt).getTime() <= Date.now();
};

/*
|--------------------------------------------------------------------------
| Exports
|--------------------------------------------------------------------------
*/

module.exports = {
  OTP_LENGTH,
  OTP_EXPIRY_MINUTES,
  generateOtp,
  hashOtp,
  verifyOtp,
  getOtpExpiryTime,
  isOtpExpired,
};