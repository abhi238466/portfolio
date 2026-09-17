const jwt = require("jsonwebtoken");

const protectAdmin = (req, res, next) => {
  try {
    const token = req.cookies?.portfolio_admin_token;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "🔒 Please log in to access the admin panel.",
      });
    }

    if (!process.env.JWT_SECRET) {
      console.error("JWT_SECRET is not configured.");

      return res.status(500).json({
        success: false,
        message: "⚠️ Authentication service is not configured correctly.",
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (!decoded?.sub || decoded.role !== "admin") {
      return res.status(401).json({
        success: false,
        message: "🔐 Your admin session is invalid. Please log in again.",
      });
    }

    req.admin = {
      id: decoded.sub,
      role: decoded.role,
    };

    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "⏰ Your admin session has expired. Please log in again.",
      });
    }

    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({
        success: false,
        message: "🔐 Your admin session is invalid. Please log in again.",
      });
    }

    console.error("Admin authentication error:", error);

    return res.status(500).json({
      success: false,
      message: "⚠️ Unable to verify your admin session.",
    });
  }
};

module.exports = {
  protectAdmin,
};

