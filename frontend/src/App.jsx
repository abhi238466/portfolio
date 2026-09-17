import {
  lazy,
  Suspense,
  useEffect,
  useState,
} from "react";

import {
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router";

import Navbar from "./components/Navbar";
import PublicHome from "./pages/Public/PublicHome";

import AdminLogin from "./pages/Admin/AdminLogin";
import ForgotPassword from "./pages/Admin/ForgotPassword";
import AdminDashboard from "./pages/Admin/AdminDashboard";

import "./App.css";

/* =========================================================
   LAZY-LOADED ADMIN CMS MODULES
   =========================================================

   Admin modules are loaded only when their route is opened.

   This prevents a problem in one future CMS module from
   unnecessarily breaking Admin Login or Dashboard.
   ========================================================= */

const AdminProfile = lazy(
  () =>
    import(
      "./pages/Admin/Profile/AdminProfile"
    )
);

/*
 * HERO CMS MODULE
 *
 * Hero is also lazy-loaded and protected.
 *
 * Direct access:
 * /admin/hero
 *
 * requires a valid backend admin session.
 */
const AdminHero = lazy(
  () =>
    import(
      "./pages/Admin/Hero/AdminHero"
    )
);

/*
 * PROJECTS CMS MODULE
 *
 * Projects is also lazy-loaded and protected.
 *
 * Direct access:
 * /admin/projects
 *
 * requires a valid backend admin session.
 */
const AdminProjects = lazy(
  () =>
    import(
      "./pages/Admin/Projects/AdminProjects"
    )
);

/*
 * EXPERIENCE CMS MODULE
 *
 * Experience is also lazy-loaded and protected.
 *
 * Direct access:
 * /admin/experience
 *
 * requires a valid backend admin session.
 */
const AdminExperience = lazy(
  () =>
    import(
      "./pages/Admin/Experience/AdminExperience"
    )
);

/*
 * EDUCATION CMS MODULE
 *
 * Education is also lazy-loaded and protected.
 *
 * Direct access:
 * /admin/education
 *
 * requires a valid backend admin session.
 */
const AdminEducation = lazy(
  () =>
    import(
      "./pages/Admin/Education/AdminEducation"
    )
);

/*
 * CERTIFICATIONS CMS MODULE
 *
 * Certifications is lazy-loaded and protected.
 *
 * Direct access:
 * /admin/certifications
 *
 * requires a valid backend admin session.
 */
const AdminCertifications = lazy(
  () =>
    import(
      "./pages/Admin/Certifications/AdminCertifications"
    )
);

/* =========================================================
   API CONFIGURATION
   ========================================================= */

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  "http://localhost:5000";

/* =========================================================
   PUBLIC PORTFOLIO DATA
   =========================================================

   Actual portfolio content will come from the API later.

   Nothing personal is hardcoded here.
   ========================================================= */

const publicPortfolioData = {
  profile: {},
  hero: {},
  socialLinks: {},
};

/* =========================================================
   PUBLIC NAVIGATION
   ========================================================= */

const publicNavigationItems = [
  {
    id: "home",
    label: "Home",
    href: "#home",
  },
  {
    id: "about",
    label: "About",
    href: "#about",
  },
  {
    id: "skills",
    label: "Skills",
    href: "#skills",
  },
  {
    id: "projects",
    label: "Projects",
    href: "#projects",
  },
  {
    id: "experience",
    label: "Experience",
    href: "#experience",
  },
  {
    id: "education",
    label: "Education",
    href: "#education",
  },
  {
    id: "contact",
    label: "Contact",
    href: "#contact",
  },
];

/* =========================================================
   PUBLIC PORTFOLIO
   ========================================================= */

function PublicPortfolio() {
  const {
    profile,
    hero,
    socialLinks,
  } = publicPortfolioData;

  return (
    <div className="app-shell">
      <Navbar
        navigationItems={
          publicNavigationItems
        }
      />

      <main className="app-page-transition">
        <PublicHome
          profile={profile}
          hero={hero}
          socialLinks={socialLinks}
        />
      </main>
    </div>
  );
}

/* =========================================================
   ADMIN ROUTE LOADING SCREEN
   ========================================================= */

function AdminRouteLoading() {
  return (
    <div className="admin-route-loading">
      <div className="admin-route-loading-card">
        <div className="admin-route-loading-icon">
          🔐
        </div>

        <div
          className="admin-route-loading-spinner"
          aria-hidden="true"
        />

        <h1>
          Verifying secure access
        </h1>

        <p>
          Please wait while we verify your
          administrator session.
        </p>
      </div>
    </div>
  );
}

/* =========================================================
   ADMIN MODULE LOADING SCREEN
   ========================================================= */

function AdminModuleLoading() {
  return (
    <div className="admin-route-loading">
      <div className="admin-route-loading-card">
        <div className="admin-route-loading-icon">
          ⏳
        </div>

        <div
          className="admin-route-loading-spinner"
          aria-hidden="true"
        />

        <h1>
          Loading workspace
        </h1>

        <p>
          Preparing this admin management
          module.
        </p>
      </div>
    </div>
  );
}

/* =========================================================
   ADMIN MODULE ERROR FALLBACK
   ========================================================= */

function AdminModuleErrorFallback() {
  return (
    <div className="admin-route-loading">
      <div className="admin-route-loading-card">
        <div className="admin-route-loading-icon">
          ⚠️
        </div>

        <h1>
          Module could not be loaded
        </h1>

        <p>
          Please refresh the page and try
          again.
        </p>

        <button
          type="button"
          onClick={() =>
            window.location.reload()
          }
          style={{
            marginTop: "16px",
            minHeight: "42px",
            padding: "0 16px",
            border:
              "1px solid rgba(244, 119, 99, 0.25)",
            borderRadius: "10px",
            background:
              "linear-gradient(135deg, #ff806b, #ffb27c)",
            color: "#28110c",
            fontWeight: 800,
            cursor: "pointer",
          }}
        >
          Refresh workspace
        </button>
      </div>
    </div>
  );
}

/* =========================================================
   ADMIN AUTHENTICATION GUARD
   =========================================================

   SECURITY CONTRACT:

   1. Never trust localStorage/sessionStorage.
   2. Authentication is verified by backend.
   3. Backend validates HTTP-only JWT cookie.
   4. Admin pages NEVER render before verification.
   5. Invalid/expired session redirects to login.
   6. Direct admin URLs are protected.
   7. Browser refresh is protected.
   8. Every future CMS page MUST use this guard.
   9. Logout is handled by the backend session.
   10. MongoDB content remains persistent after logout.
   ========================================================= */

function ProtectedAdminRoute({
  children,
}) {
  const location = useLocation();

  const [authState, setAuthState] =
    useState("checking");

  useEffect(() => {
    let isMounted = true;

    const verifyAdminSession =
      async () => {
        if (isMounted) {
          setAuthState("checking");
        }

        try {
          const response = await fetch(
            `${API_BASE_URL}/api/admin/me`,
            {
              method: "GET",

              credentials: "include",

              headers: {
                Accept:
                  "application/json",
              },

              /*
               * Do not allow browser/proxy
               * cache to provide an old auth result.
               */
              cache: "no-store",
            }
          );

          /* =====================================================
             SESSION INVALID
             ===================================================== */

          if (!response.ok) {
            if (isMounted) {
              setAuthState(
                "unauthenticated"
              );
            }

            return;
          }

          const data =
            await response.json();

          /* =====================================================
             VERIFY ADMIN RESPONSE
             ===================================================== */

          const isValidAdmin =
            data?.success === true &&
            Boolean(data?.admin);

          if (!isValidAdmin) {
            if (isMounted) {
              setAuthState(
                "unauthenticated"
              );
            }

            return;
          }

          /* =====================================================
             AUTHENTICATED
             ===================================================== */

          if (isMounted) {
            setAuthState(
              "authenticated"
            );
          }
        } catch (error) {
          console.error(
            "Admin session verification failed:",
            error
          );

          if (isMounted) {
            setAuthState(
              "unauthenticated"
            );
          }
        }
      };

    verifyAdminSession();

    return () => {
      isMounted = false;
    };
  }, [location.pathname]);

  /* =========================================================
     VERIFYING
     ========================================================= */

  if (authState === "checking") {
    return <AdminRouteLoading />;
  }

  /* =========================================================
     UNAUTHENTICATED
     ========================================================= */

  if (
    authState ===
    "unauthenticated"
  ) {
    return (
      <Navigate
        to="/admin/login"
        replace
        state={{
          from: location.pathname,
          reason:
            "authentication-required",
        }}
      />
    );
  }

  /* =========================================================
     AUTHENTICATED
     ========================================================= */

  return children;
}

/* =========================================================
   PROTECTED ADMIN MODULE WRAPPER
   ========================================================= */

function ProtectedAdminModule({
  children,
}) {
  return (
    <ProtectedAdminRoute>
      <Suspense
        fallback={
          <AdminModuleLoading />
        }
      >
        {children}
      </Suspense>
    </ProtectedAdminRoute>
  );
}

/* =========================================================
   ADMIN FALLBACK
   ========================================================= */

function AdminRouteFallback() {
  return (
    <Navigate
      to="/admin/login"
      replace
      state={{
        reason:
          "invalid-admin-route",
      }}
    />
  );
}

/* =========================================================
   APPLICATION ROUTER
   ========================================================= */

function App() {
  return (
    <Routes>

      {/* ===================================================
          PUBLIC PORTFOLIO
          =================================================== */}

      <Route
        path="/"
        element={
          <PublicPortfolio />
        }
      />

      {/* ===================================================
          ADMIN LOGIN

          This is intentionally public.

          Authentication starts here.
          =================================================== */}

      <Route
        path="/admin/login"
        element={
          <AdminLogin />
        }
      />

      {/* ===================================================
          ADMIN FORGOT PASSWORD

          Intentionally public because an admin who has
          forgotten the password must be able to recover
          the account without an active login session.

          Flow:

          Email
             ↓
          OTP
             ↓
          New Password
             ↓
          Admin Login
          =================================================== */}

      <Route
        path="/admin/forgot-password"
        element={
          <ForgotPassword />
        }
      />

      {/* ===================================================
          PROTECTED ADMIN DASHBOARD

          🔐 NEVER REMOVE THIS GUARD.

          Dashboard renders ONLY after:

          GET /api/admin/me

          confirms a valid authenticated admin.
          =================================================== */}

      <Route
        path="/admin/dashboard"
        element={
          <ProtectedAdminRoute>
            <AdminDashboard />
          </ProtectedAdminRoute>
        }
      />

      {/* ===================================================
          PROTECTED ADMIN PROFILE

          Direct URL:
          /admin/profile

          Refresh:
          /admin/profile

          Back navigation:
          /admin/profile

          ALL require valid backend authentication.

          Without valid session:
          → /admin/login
          =================================================== */}

      <Route
        path="/admin/profile"
        element={
          <ProtectedAdminModule>
            <AdminProfile />
          </ProtectedAdminModule>
        }
      />

      {/* ===================================================
          PROTECTED ADMIN HERO
          ===================================================

          Direct URL:
          /admin/hero

          🔐 This route is protected.

          Flow:

          /admin/hero
               ↓
          ProtectedAdminModule
               ↓
          ProtectedAdminRoute
               ↓
          GET /api/admin/me
               ↓
          Valid session?
             ↙       ↘
           YES        NO
            ↓          ↓
        AdminHero   Admin Login

          Hero CMS can therefore NOT be opened directly
          without a valid administrator session.
          =================================================== */}

      <Route
        path="/admin/hero"
        element={
          <ProtectedAdminModule>
            <AdminHero />
          </ProtectedAdminModule>
        }
      />

      {/* ===================================================
          PROTECTED ADMIN PROJECTS
          ===================================================
          
          Direct URL:
          /admin/projects

          🔐 This route is protected.

          Flow:

          /admin/projects
               ↓
          ProtectedAdminModule
               ↓
          ProtectedAdminRoute
               ↓
          GET /api/admin/me
               ↓
          Valid session?
             ↙       ↘
           YES        NO
            ↓          ↓
        AdminProjects  Admin Login

          Projects CMS can therefore NOT be opened directly
          without a valid administrator session.
          =================================================== */}

      <Route
        path="/admin/projects"
        element={
          <ProtectedAdminModule>
            <AdminProjects />
          </ProtectedAdminModule>
        }
      />

      {/* ===================================================
          PROTECTED ADMIN EXPERIENCE
          ===================================================

          Direct URL:
          /admin/experience

          🔐 This route is protected.

          Flow:

          /admin/experience
               ↓
          ProtectedAdminModule
               ↓
          ProtectedAdminRoute
               ↓
          GET /api/admin/me
               ↓
          Valid session?
             ↙       ↘
           YES        NO
            ↓          ↓
        AdminExperience  Admin Login

          Experience CMS can therefore NOT be opened directly
          without a valid administrator session.
          =================================================== */}

      <Route
        path="/admin/experience"
        element={
          <ProtectedAdminModule>
            <AdminExperience />
          </ProtectedAdminModule>
        }
      />

      {/* ===================================================
          PROTECTED ADMIN EDUCATION
          ===================================================

          Direct URL:
          /admin/education

          🔐 This route is protected.

          Flow:

          /admin/education
               ↓
          ProtectedAdminModule
               ↓
          ProtectedAdminRoute
               ↓
          GET /api/admin/me
               ↓
          Valid session?
             ↙       ↘
           YES        NO
            ↓          ↓
        AdminEducation  Admin Login

          Education CMS can therefore NOT be opened directly
          without a valid administrator session.
          =================================================== */}

      <Route
        path="/admin/education"
        element={
          <ProtectedAdminModule>
            <AdminEducation />
          </ProtectedAdminModule>
        }
      />

      {/* ===================================================
          PROTECTED ADMIN CERTIFICATIONS
          ===================================================

          Direct URL:
          /admin/certifications

          This route uses the same backend session verification
          and protected module wrapper as every completed CMS page.
          =================================================== */}

      <Route
        path="/admin/certifications"
        element={
          <ProtectedAdminModule>
            <AdminCertifications />
          </ProtectedAdminModule>
        }
      />

      {/* ===================================================
          FUTURE PROTECTED CMS ROUTES
          ===================================================

          Every future admin page MUST follow the same
          ProtectedAdminModule pattern.

          Example:

          <Route
            path="/admin/experience"
            element={
              <ProtectedAdminModule>
                <AdminExperience />
              </ProtectedAdminModule>
            }
          />

          <Route
            path="/admin/education"
            element={
              <ProtectedAdminModule>
                <AdminEducation />
              </ProtectedAdminModule>
            }
          />

          <Route
            path="/admin/certifications"
            element={
              <ProtectedAdminModule>
                <AdminCertifications />
              </ProtectedAdminModule>
            }
          />

          <Route
            path="/admin/contact"
            element={
              <ProtectedAdminModule>
                <AdminContact />
              </ProtectedAdminModule>
            }
          />

          <Route
            path="/admin/settings"
            element={
              <ProtectedAdminModule>
                <AdminSettings />
              </ProtectedAdminModule>
            }
          />

          =================================================== */}

      {/* ===================================================
          UNKNOWN ADMIN ROUTES
          ===================================================

          Any /admin/... route which has not been explicitly
          registered above will NEVER render a page.

          It goes back to Admin Login.
          =================================================== */}

      <Route
        path="/admin/*"
        element={
          <AdminRouteFallback />
        }
      />

      {/* ===================================================
          UNKNOWN PUBLIC ROUTES
          =================================================== */}

      <Route
        path="*"
        element={
          <Navigate
            to="/"
            replace
          />
        }
      />

    </Routes>
  );
}

export default App;