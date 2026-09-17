const mongoose = require("mongoose");

const adminSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    password: {
      type: String,
      required: true,
      minlength: 8,
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    lastLoginAt: {
      type: Date,
      default: null,
    },

    /*
     * ---------------------------------------------------------
     * PASSWORD RESET / FORGOT PASSWORD
     * ---------------------------------------------------------
     *
     * The actual OTP will never be stored in the database.
     * Only its secure hash will be stored.
     */

    resetOtpHash: {
      type: String,
      default: null,
    },

    resetOtpExpiresAt: {
      type: Date,
      default: null,
    },

    resetOtpAttempts: {
      type: Number,
      default: 0,
    },

    resetOtpLastSentAt: {
      type: Date,
      default: null,
    },

    /*
     * Used after successful OTP verification.
     *
     * This gives us a short-lived server-side reset state
     * before allowing the password to be changed.
     */

    passwordResetVerifiedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

const Admin = mongoose.model("Admin", adminSchema);

module.exports = Admin;