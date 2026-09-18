/*
|--------------------------------------------------------------------------
| LOAD ENVIRONMENT VARIABLES FIRST
|--------------------------------------------------------------------------
|
| IMPORTANT:
| dotenv.config() must run before importing any module
| that reads process.env during module initialization.
|
| Cloudinary configuration depends on:
| - CLOUDINARY_CLOUD_NAME
| - CLOUDINARY_API_KEY
| - CLOUDINARY_API_SECRET
|
*/

const dotenv = require("dotenv");

dotenv.config();

/*
|--------------------------------------------------------------------------
| CORE DEPENDENCIES
|--------------------------------------------------------------------------
*/

const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const helmet = require("helmet");

/*
|--------------------------------------------------------------------------
| APPLICATION CONFIG / DATABASE
|--------------------------------------------------------------------------
*/

const connectDB = require("./config/db");

/*
|--------------------------------------------------------------------------
| ROUTES
|--------------------------------------------------------------------------
*/

/*
|--------------------------------------------------------------------------
| ADMIN AUTHENTICATION
|--------------------------------------------------------------------------
*/

const adminRoutes = require("./routes/adminRoutes");

/*
|--------------------------------------------------------------------------
| PROFILE
|--------------------------------------------------------------------------
*/

const {
  publicProfileRouter,
  adminProfileRouter,
} = require("./routes/profileRoutes");

/*
|--------------------------------------------------------------------------
| HERO
|--------------------------------------------------------------------------
*/

const {
  publicHeroRouter,
  adminHeroRouter,
} = require("./routes/heroRoutes");

/*
|--------------------------------------------------------------------------
| PROJECTS
|--------------------------------------------------------------------------
*/

const {
  publicProjectRouter,
  adminProjectRouter,
} = require("./routes/projectRoutes");

/*
|--------------------------------------------------------------------------
| EXPERIENCE
|--------------------------------------------------------------------------
*/

const {
  publicExperienceRouter,
  adminExperienceRouter,
} = require("./routes/experienceRoutes");

/*
|--------------------------------------------------------------------------
| EDUCATION
|--------------------------------------------------------------------------
*/

const {
  publicEducationRouter,
  adminEducationRouter,
} = require("./routes/educationRoutes");

/*
|--------------------------------------------------------------------------
| CERTIFICATIONS
|--------------------------------------------------------------------------
*/

const certificationRoutes = require("./routes/certificationRoutes");

/*
|--------------------------------------------------------------------------
| APP INITIALIZATION
|--------------------------------------------------------------------------
*/

const app = express();
app.set("trust proxy", 1);
const PORT = process.env.PORT || 5000;

/*
|--------------------------------------------------------------------------
| SECURITY MIDDLEWARE
|--------------------------------------------------------------------------
*/

app.use(helmet());

/*
|--------------------------------------------------------------------------
| CORS
|--------------------------------------------------------------------------
*/


const allowedOrigins = [
  process.env.FRONTEND_URL,
  "http://localhost:5173",
  "http://localhost:5174",
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) {
        return callback(null, true);
      }

      const isAllowed =
        allowedOrigins.includes(origin) ||
        /^https:\/\/abhishek-portfolio-[a-z0-9-]+-aroma-trace\.vercel\.app$/.test(
          origin
        ) ||
        origin ===
          "https://abhishek-portfolio-aroma-trace.vercel.app";

      if (isAllowed) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);

/*
|--------------------------------------------------------------------------
| REQUEST PARSERS
|--------------------------------------------------------------------------
*/

app.use(
  express.json({
    limit: "2mb",
  })
);

app.use(
  express.urlencoded({
    extended: true,
    limit: "2mb",
  })
);

/*
|--------------------------------------------------------------------------
| COOKIE PARSER
|--------------------------------------------------------------------------
*/

app.use(cookieParser());

/*
|--------------------------------------------------------------------------
| BASIC HEALTH ROUTE
|--------------------------------------------------------------------------
|
| GET /api/health
|
*/

app.get(
  "/api/health",
  (req, res) => {
    return res.status(200).json({
      success: true,
      message:
        "Personal Career Portfolio API is running",
    });
  }
);

/*
|--------------------------------------------------------------------------
| ADMIN AUTHENTICATION ROUTES
|--------------------------------------------------------------------------
|
| Base:
| /api/admin
|
| Examples:
| POST /api/admin/login
| POST /api/admin/logout
| GET  /api/admin/me
| POST /api/admin/forgot-password
| POST /api/admin/verify-otp
| POST /api/admin/reset-password
|
*/

app.use(
  "/api/admin",
  adminRoutes
);

/*
|--------------------------------------------------------------------------
| PUBLIC PROFILE ROUTES
|--------------------------------------------------------------------------
|
| Base:
| /api/profile
|
| Public endpoint:
| GET /api/profile
|
| No admin authentication required.
|
*/

app.use(
  "/api/profile",
  publicProfileRouter
);

/*
|--------------------------------------------------------------------------
| ADMIN PROFILE CMS ROUTES
|--------------------------------------------------------------------------
|
| Base:
| /api/admin/profile
|
| Authentication is handled inside
| adminProfileRouter using protectAdmin.
|
| Examples:
| GET    /api/admin/profile
| POST   /api/admin/profile
| PUT    /api/admin/profile
| DELETE /api/admin/profile
|
*/

app.use(
  "/api/admin/profile",
  adminProfileRouter
);

/*
|--------------------------------------------------------------------------
| PUBLIC HERO ROUTES
|--------------------------------------------------------------------------
|
| Base:
| /api/hero
|
| Public endpoint:
| GET /api/hero
|
| Only active/public Hero data is returned.
|
*/

app.use(
  "/api/hero",
  publicHeroRouter
);

/*
|--------------------------------------------------------------------------
| ADMIN HERO CMS ROUTES
|--------------------------------------------------------------------------
|
| Base:
| /api/admin/hero
|
| Authentication is handled inside
| adminHeroRouter using protectAdmin.
|
| Endpoints:
| GET /api/admin/hero
| PUT /api/admin/hero
|
*/

app.use(
  "/api/admin/hero",
  adminHeroRouter
);

/*
|--------------------------------------------------------------------------
| PUBLIC PROJECT ROUTES
|--------------------------------------------------------------------------
|
| Base:
| /api/projects
|
| Public endpoints:
|
| GET /api/projects
| GET /api/projects/:projectId
|
| Only active + visible projects are returned
| by the public project service.
|
*/

app.use(
  "/api/projects",
  publicProjectRouter
);

/*
|--------------------------------------------------------------------------
| ADMIN PROJECT CMS ROUTES
|--------------------------------------------------------------------------
|
| Base:
| /api/admin/projects
|
| Authentication is handled inside
| adminProjectRouter using protectAdmin.
|
| Examples:
|
| GET    /api/admin/projects
| POST   /api/admin/projects
| GET    /api/admin/projects/:projectId
| PUT    /api/admin/projects/:projectId
| DELETE /api/admin/projects/:projectId
|
| Project image management:
|
| PATCH  /api/admin/projects/:projectId/images
| DELETE /api/admin/projects/:projectId/images/:imageId
| PATCH  /api/admin/projects/:projectId/images/:imageId/primary
| PUT    /api/admin/projects/:projectId/images/order
|
| Display controls:
|
| PATCH /api/admin/projects/:projectId/visibility
| PATCH /api/admin/projects/:projectId/featured
| PATCH /api/admin/projects/:projectId/status
| PATCH /api/admin/projects/:projectId/order
|
*/

app.use(
  "/api/admin/projects",
  adminProjectRouter
);

/*
|--------------------------------------------------------------------------
| PUBLIC EXPERIENCE ROUTES
|--------------------------------------------------------------------------
|
| Base:
| /api/experience
|
| Public endpoints:
|
| GET /api/experience
| GET /api/experience/:experienceId
|
| Only active + visible experiences are returned
| by the public experience service.
|
*/

app.use(
  "/api/experience",
  publicExperienceRouter
);

/*
|--------------------------------------------------------------------------
| ADMIN EXPERIENCE CMS ROUTES
|--------------------------------------------------------------------------
|
| Base:
| /api/admin/experience
|
| Authentication is handled inside
| adminExperienceRouter using requireAdminAuth.
|
| Examples:
|
| GET    /api/admin/experience
| POST   /api/admin/experience
| GET    /api/admin/experience/:experienceId
| PUT    /api/admin/experience/:experienceId
| DELETE /api/admin/experience/:experienceId
|
| Experience document management:
|
| POST   /api/admin/experience/:experienceId/documents
| DELETE /api/admin/experience/:experienceId/documents/:documentId
| PATCH  /api/admin/experience/:experienceId/documents/reorder
| GET    /api/admin/experience/:experienceId/documents/:documentId/url
|
| Display controls:
|
| PATCH /api/admin/experience/:experienceId/visibility
| PATCH /api/admin/experience/:experienceId/featured
| PATCH /api/admin/experience/:experienceId/active
| PATCH /api/admin/experience/:experienceId/display-order
|
*/

app.use(
  "/api/admin/experience",
  adminExperienceRouter
);

/*
|--------------------------------------------------------------------------
| PUBLIC EDUCATION ROUTES
|--------------------------------------------------------------------------
|
| Base:
| /api/education
|
| Public endpoint:
|
| GET /api/education
|
| Only active + visible education records are returned
| by the public education service.
|
*/

app.use(
  "/api/education",
  publicEducationRouter
);

/*
|--------------------------------------------------------------------------
| ADMIN EDUCATION CMS ROUTES
|--------------------------------------------------------------------------
|
| Base:
| /api/admin/education
|
| Authentication is handled inside
| adminEducationRouter using protectAdmin.
|
| Education CRUD:
|
| GET    /api/admin/education
| GET    /api/admin/education/:educationId
| POST   /api/admin/education
| PUT    /api/admin/education/:educationId
| DELETE /api/admin/education/:educationId
|
| Education document management:
|
| POST   /api/admin/education/:educationId/documents
| GET    /api/admin/education/:educationId/documents/:documentId
| PATCH  /api/admin/education/:educationId/documents/:documentId
| PUT    /api/admin/education/:educationId/documents/:documentId
| DELETE /api/admin/education/:educationId/documents/:documentId
| PATCH  /api/admin/education/:educationId/documents/reorder
|
| Display controls:
|
| PATCH /api/admin/education/:educationId/visibility
| PATCH /api/admin/education/:educationId/featured
| PATCH /api/admin/education/:educationId/active
| PATCH /api/admin/education/:educationId/order
|
| Education ordering:
|
| PATCH /api/admin/education/reorder
|
*/

app.use(
  "/api/admin/education",
  adminEducationRouter
);

/*
|--------------------------------------------------------------------------
| CERTIFICATION ROUTES
|--------------------------------------------------------------------------
|
| Base:
| /api/certifications
|
| Public:
| GET /api/certifications
|
| Admin:
| GET    /api/certifications/admin
| POST   /api/certifications/admin
| GET    /api/certifications/admin/:certificationId
| PUT    /api/certifications/admin/:certificationId
| DELETE /api/certifications/admin/:certificationId
|
| Documents:
| POST   /api/certifications/admin/:certificationId/documents
| GET    /api/certifications/admin/:certificationId/documents/:documentId
| PATCH  /api/certifications/admin/:certificationId/documents/:documentId
| PUT    /api/certifications/admin/:certificationId/documents/:documentId
| DELETE /api/certifications/admin/:certificationId/documents/:documentId
|
| Display controls:
| PATCH /api/certifications/admin/:certificationId/visibility
| PATCH /api/certifications/admin/:certificationId/featured
| PATCH /api/certifications/admin/:certificationId/active
| PATCH /api/certifications/admin/:certificationId/display-order
|
| Certification ordering:
| PATCH /api/certifications/admin/reorder
|
*/

app.use(
  "/api/certifications",
  certificationRoutes
);

/*
|--------------------------------------------------------------------------
| START SERVER
|--------------------------------------------------------------------------
|
| MongoDB connection is established before
| the HTTP server starts.
|
*/

const startServer = async () => {
  try {
    await connectDB();

    app.listen(
      PORT,
      () => {
        console.log(
          `Backend server running on http://localhost:${PORT}`
        );
      }
    );
  } catch (error) {
    console.error(
      "Server startup failed:",
      error.message
    );

    process.exit(1);
  }
};

startServer();