const jwt = require("jsonwebtoken");

const Admin = require("../models/Admin");

const {
  comparePassword,
  hashPassword,
} = require("../utils/password");

const {
  findActiveAdminByEmail,
  createPasswordResetOtp,
  verifyPasswordResetOtp,
  isPasswordResetVerified,
  clearPasswordResetState,
} = require("../services/passwordResetService");

const {
  sendPasswordResetOtpEmail,
} = require("../services/emailService");

/*
|--------------------------------------------------------------------------
| Helper: Create Admin Authentication Token
|--------------------------------------------------------------------------
*/

const createAdminToken = (adminId) => {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is not configured");
  }

  return jwt.sign(
    {
      sub: adminId,
      role: "admin",
    },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRES_IN || "7d",
    }
  );
};

/*
|--------------------------------------------------------------------------
| Helper: Set Authentication Cookie
|--------------------------------------------------------------------------
*/

const setAuthCookie = (res, token) => {
  const isProduction =
    process.env.NODE_ENV === "production" ||
    Boolean(process.env.RENDER);

  res.cookie("portfolio_admin_token", token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: "/",
  });
};

/*
|--------------------------------------------------------------------------
| Helper: Remove Authentication Cookie
|--------------------------------------------------------------------------
*/

const clearAuthCookie = (res) => {
  const isProduction =
    process.env.NODE_ENV === "production" ||
    Boolean(process.env.RENDER);

  res.clearCookie("portfolio_admin_token", {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
    path: "/",
  });
};

/*
|--------------------------------------------------------------------------
| Admin Login
|--------------------------------------------------------------------------
*/

const loginAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;

    /*
    |--------------------------------------------------------------------------
    | Validate Request
    |--------------------------------------------------------------------------
    */

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message:
          "📋 Please enter both email and password.",
      });
    }

    /*
    |--------------------------------------------------------------------------
    | Find Admin
    |--------------------------------------------------------------------------
    */

    const admin = await Admin.findOne({
      email: email.trim().toLowerCase(),
    });

    /*
    |--------------------------------------------------------------------------
    | Invalid Credentials
    |--------------------------------------------------------------------------
    */

    if (!admin) {
      return res.status(401).json({
        success: false,
        message:
          "🔐 Invalid email or password.",
      });
    }

    /*
    |--------------------------------------------------------------------------
    | Check Account Status
    |--------------------------------------------------------------------------
    */

    if (!admin.isActive) {
      return res.status(403).json({
        success: false,
        message:
          "🚫 Your admin account is currently inactive.",
      });
    }

    /*
    |--------------------------------------------------------------------------
    | Compare Password
    |--------------------------------------------------------------------------
    */

    const isPasswordCorrect =
      await comparePassword(
        password,
        admin.password
      );

    if (!isPasswordCorrect) {
      return res.status(401).json({
        success: false,
        message:
          "🔐 Invalid email or password.",
      });
    }

    /*
    |--------------------------------------------------------------------------
    | Create JWT
    |--------------------------------------------------------------------------
    */

    const token = createAdminToken(
      admin._id.toString()
    );

    /*
    |--------------------------------------------------------------------------
    | Update Last Login
    |--------------------------------------------------------------------------
    */

    admin.lastLoginAt = new Date();

    await admin.save();

    /*
    |--------------------------------------------------------------------------
    | Set Secure HTTP-Only Cookie
    |--------------------------------------------------------------------------
    */

    setAuthCookie(res, token);

    /*
    |--------------------------------------------------------------------------
    | Success Response
    |--------------------------------------------------------------------------
    */

    return res.status(200).json({
      success: true,
      message:
        "🎉 Welcome back! Admin login successful.",
      admin: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
      },
    });
  } catch (error) {
    console.error(
      "Admin login error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "⚠️ Something went wrong while logging in. Please try again.",
    });
  }
};

/*
|--------------------------------------------------------------------------
| Admin Logout
|--------------------------------------------------------------------------
*/

const logoutAdmin = async (req, res) => {
  try {
    clearAuthCookie(res);

    return res.status(200).json({
      success: true,
      message:
        "👋 You have been logged out successfully.",
    });
  } catch (error) {
    console.error(
      "Admin logout error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "⚠️ Unable to complete logout. Please try again.",
    });
  }
};

/*
|--------------------------------------------------------------------------
| Get Current Admin
|--------------------------------------------------------------------------
*/

const getCurrentAdmin = async (req, res) => {
  try {
    if (!req.admin || !req.admin.id) {
      return res.status(401).json({
        success: false,
        message:
          "🔒 Please log in to access the admin panel.",
      });
    }

    const admin = await Admin.findById(
      req.admin.id
    );

    if (!admin) {
      clearAuthCookie(res);

      return res.status(401).json({
        success: false,
        message:
          "🔒 Admin account could not be found.",
      });
    }

    if (!admin.isActive) {
      clearAuthCookie(res);

      return res.status(403).json({
        success: false,
        message:
          "🚫 This admin account is currently inactive.",
      });
    }

    return res.status(200).json({
      success: true,
      admin: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        lastLoginAt: admin.lastLoginAt,
      },
    });
  } catch (error) {
    console.error(
      "Get current admin error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "⚠️ Unable to load admin information.",
    });
  }
};

/*
|--------------------------------------------------------------------------
| Request Password Reset OTP
|--------------------------------------------------------------------------
|
| Public endpoint.
|
| Correct admin email:
|   → Generate OTP
|   → Save secure OTP hash
|   → Send OTP through Resend
|
| Wrong email:
|   → No OTP generated
|   → No email sent
|   → Clear warning returned
|
|--------------------------------------------------------------------------
*/

const requestPasswordResetOtp = async (
  req,
  res
) => {
  try {
    const { email } = req.body;

    /*
    |--------------------------------------------------------------------------
    | Validate Email
    |--------------------------------------------------------------------------
    */

    if (!email) {
      return res.status(400).json({
        success: false,
        message:
          "📧 Please enter your admin email address.",
        code: "EMAIL_REQUIRED",
      });
    }

    const normalizedEmail =
      email.trim().toLowerCase();

    /*
    |--------------------------------------------------------------------------
    | Basic Email Validation
    |--------------------------------------------------------------------------
    */

    const emailPattern =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailPattern.test(normalizedEmail)) {
      return res.status(400).json({
        success: false,
        message:
          "📧 Please enter a valid email address.",
        code: "INVALID_EMAIL_FORMAT",
      });
    }

    /*
    |--------------------------------------------------------------------------
    | Find Active Admin
    |--------------------------------------------------------------------------
    */

    const admin =
      await findActiveAdminByEmail(
        normalizedEmail
      );

    /*
    |--------------------------------------------------------------------------
    | WRONG EMAIL
    |--------------------------------------------------------------------------
    |
    | Important:
    | No OTP is generated.
    | No email is sent.
    |
    */

    if (!admin) {
      return res.status(404).json({
        success: false,
        message:
          "⚠️ This email is not registered as an admin account. Please check your email and try again.",
        code: "ADMIN_EMAIL_NOT_FOUND",
      });
    }

    /*
    |--------------------------------------------------------------------------
    | Generate + Store OTP
    |--------------------------------------------------------------------------
    */

    let otpData;

    try {
      otpData =
        await createPasswordResetOtp(
          admin
        );
    } catch (error) {
      /*
      |--------------------------------------------------------------------------
      | OTP Resend Cooldown
      |--------------------------------------------------------------------------
      */

      if (
        error.code ===
        "OTP_RESEND_COOLDOWN"
      ) {
        return res.status(429).json({
          success: false,
          message:
            `⏳ ${error.message}`,
          code:
            error.code,
          remainingSeconds:
            error.remainingSeconds,
        });
      }

      throw error;
    }

    /*
    |--------------------------------------------------------------------------
    | Send OTP Email
    |--------------------------------------------------------------------------
    */

    try {
      await sendPasswordResetOtpEmail({
        to: admin.email,
        name: admin.name,
        otp: otpData.otp,
        expiryMinutes: 10,
      });
    } catch (emailError) {
      /*
      |--------------------------------------------------------------------------
      | Email Sending Failed
      |--------------------------------------------------------------------------
      |
      | Remove OTP because the user never received it.
      |
      */

      console.error(
        "Password reset email error:",
        emailError
      );

      try {
        await clearPasswordResetState(
          admin
        );
      } catch (cleanupError) {
        console.error(
          "Password reset cleanup error:",
          cleanupError
        );
      }

      return res.status(502).json({
        success: false,
        message:
          "📧 We could not send the OTP email right now. Please try again.",
        code:
          "OTP_EMAIL_SEND_FAILED",
      });
    }

    /*
    |--------------------------------------------------------------------------
    | Success
    |--------------------------------------------------------------------------
    */

    return res.status(200).json({
      success: true,
      message:
        "📧 OTP sent successfully to your registered admin email.",
      expiresInMinutes: 10,
    });
  } catch (error) {
    console.error(
      "Request password reset OTP error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "⚠️ Unable to process the password reset request. Please try again.",
    });
  }
};

/*
|--------------------------------------------------------------------------
| Verify Password Reset OTP
|--------------------------------------------------------------------------
*/

const verifyPasswordResetOtpController =
  async (req, res) => {
    try {
      const { email, otp } = req.body;

      /*
      |--------------------------------------------------------------------------
      | Validate Request
      |--------------------------------------------------------------------------
      */

      if (!email || !otp) {
        return res.status(400).json({
          success: false,
          message:
            "📋 Please enter your email and OTP.",
          code: "OTP_FIELDS_REQUIRED",
        });
      }

      const normalizedEmail =
        email.trim().toLowerCase();

      /*
      |--------------------------------------------------------------------------
      | Find Active Admin
      |--------------------------------------------------------------------------
      */

      const admin =
        await findActiveAdminByEmail(
          normalizedEmail
        );

      /*
      |--------------------------------------------------------------------------
      | Wrong Email
      |--------------------------------------------------------------------------
      */

      if (!admin) {
        return res.status(404).json({
          success: false,
          message:
            "⚠️ This email is not registered as an admin account.",
          code:
            "ADMIN_EMAIL_NOT_FOUND",
        });
      }

      /*
      |--------------------------------------------------------------------------
      | Verify OTP
      |--------------------------------------------------------------------------
      */

      try {
        await verifyPasswordResetOtp(
          admin,
          otp
        );
      } catch (error) {
        return res.status(400).json({
          success: false,
          message:
            error.message ||
            "🔐 Invalid or expired OTP.",
          code:
            error.code ||
            "OTP_VERIFICATION_FAILED",
          ...(typeof error.attemptsRemaining ===
          "number"
            ? {
                attemptsRemaining:
                  error.attemptsRemaining,
              }
            : {}),
        });
      }

      /*
      |--------------------------------------------------------------------------
      | Success
      |--------------------------------------------------------------------------
      */

      return res.status(200).json({
        success: true,
        message:
          "✅ OTP verified successfully. You can now create a new password.",
        resetVerified: true,
      });
    } catch (error) {
      console.error(
        "Verify password reset OTP error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "⚠️ Unable to verify the OTP. Please try again.",
      });
    }
  };

/*
|--------------------------------------------------------------------------
| Reset Admin Password
|--------------------------------------------------------------------------
|
| Password is changed ONLY after successful OTP verification.
|
*/

const resetAdminPassword = async (
  req,
  res
) => {
  try {
    const {
      email,
      newPassword,
      confirmPassword,
    } = req.body;

    /*
    |--------------------------------------------------------------------------
    | Validate Required Fields
    |--------------------------------------------------------------------------
    */

    if (
      !email ||
      !newPassword ||
      !confirmPassword
    ) {
      return res.status(400).json({
        success: false,
        message:
          "📋 Please complete all password fields.",
        code:
          "PASSWORD_FIELDS_REQUIRED",
      });
    }

    const normalizedEmail =
      email.trim().toLowerCase();

    /*
    |--------------------------------------------------------------------------
    | Validate Password Match
    |--------------------------------------------------------------------------
    */

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message:
          "🔐 New password and confirm password do not match.",
        code:
          "PASSWORD_MISMATCH",
      });
    }

    /*
    |--------------------------------------------------------------------------
    | Validate Password Length
    |--------------------------------------------------------------------------
    */

    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message:
          "🔐 Password must contain at least 8 characters.",
        code:
          "PASSWORD_TOO_SHORT",
      });
    }

    /*
    |--------------------------------------------------------------------------
    | Find Active Admin
    |--------------------------------------------------------------------------
    */

    const admin =
      await findActiveAdminByEmail(
        normalizedEmail
      );

    if (!admin) {
      return res.status(404).json({
        success: false,
        message:
          "⚠️ This email is not registered as an admin account.",
        code:
          "ADMIN_EMAIL_NOT_FOUND",
      });
    }

    /*
    |--------------------------------------------------------------------------
    | Check OTP Verification
    |--------------------------------------------------------------------------
    */

    if (
      !isPasswordResetVerified(admin)
    ) {
      /*
      |--------------------------------------------------------------------------
      | Clear Expired Reset State
      |--------------------------------------------------------------------------
      */

      await clearPasswordResetState(
        admin
      );

      return res.status(401).json({
        success: false,
        message:
          "⏳ Password reset verification has expired. Please request a new OTP.",
        code:
          "PASSWORD_RESET_VERIFICATION_EXPIRED",
      });
    }

    /*
    |--------------------------------------------------------------------------
    | Prevent Reusing Current Password
    |--------------------------------------------------------------------------
    */

    const isSameAsCurrentPassword =
      await comparePassword(
        newPassword,
        admin.password
      );

    if (isSameAsCurrentPassword) {
      return res.status(400).json({
        success: false,
        message:
          "🔐 New password must be different from your current password.",
        code:
          "PASSWORD_SAME_AS_CURRENT",
      });
    }

    /*
    |--------------------------------------------------------------------------
    | Hash New Password
    |--------------------------------------------------------------------------
    */

    const hashedPassword =
      await hashPassword(
        newPassword
      );

    /*
    |--------------------------------------------------------------------------
    | Replace Old Password
    |--------------------------------------------------------------------------
    */

    admin.password =
      hashedPassword;

    /*
    |--------------------------------------------------------------------------
    | Clear Password Reset State
    |--------------------------------------------------------------------------
    */

    admin.resetOtpHash = null;
    admin.resetOtpExpiresAt = null;
    admin.resetOtpAttempts = 0;
    admin.resetOtpLastSentAt = null;
    admin.passwordResetVerifiedAt = null;

    await admin.save();

    /*
    |--------------------------------------------------------------------------
    | Do Not Automatically Login
    |--------------------------------------------------------------------------
    |
    | The user must login again using the NEW password.
    |
    */

    clearAuthCookie(res);

    /*
    |--------------------------------------------------------------------------
    | Success
    |--------------------------------------------------------------------------
    */

    return res.status(200).json({
      success: true,
      message:
        "🎉 Password reset successful! Your old password is no longer valid. Please log in using your new password.",
      requiresLogin: true,
    });
  } catch (error) {
    console.error(
      "Reset admin password error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "⚠️ Unable to reset your password. Please try again.",
    });
  }
};

/*
|--------------------------------------------------------------------------
| Export Controllers
|--------------------------------------------------------------------------
*/

module.exports = {
  loginAdmin,
  logoutAdmin,
  getCurrentAdmin,

  requestPasswordResetOtp,
  verifyPasswordResetOtpController,
  resetAdminPassword,
};