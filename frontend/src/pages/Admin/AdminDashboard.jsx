import { useState } from "react";
import { useNavigate } from "react-router";

import {
  LayoutDashboard,
  UserRound,
  Sparkles,
  FolderKanban,
  BriefcaseBusiness,
  GraduationCap,
  Award,
  LogOut,
  Menu,
  X,
  ExternalLink,
  ChevronRight,
  Activity,
  Database,
  Globe2,
} from "lucide-react";

import "./AdminDashboard.css";

/*
|--------------------------------------------------------------------------
| Admin Dashboard
|--------------------------------------------------------------------------
|
| Private CMS workspace.
|
| Responsibilities:
| - Dashboard overview
| - CMS section navigation
| - Public portfolio shortcut
| - Logout
|
| IMPORTANT:
| Actual admin CMS pages are handled through React Router.
|
| Every completed CMS module gets its own route and is protected
| by ProtectedAdminRoute / ProtectedAdminModule inside App.jsx.
|
*/

const dashboardSections = [
  {
    id: "profile",
    title: "Profile",
    description:
      "Manage your professional identity and personal information.",
    icon: UserRound,
    status: "Ready",
    route: "/admin/profile",
    available: true,
  },
  {
    id: "hero",
    title: "Hero Section",
    description:
      "Manage your homepage introduction, role and availability.",
    icon: Sparkles,
    status: "Ready",
    route: "/admin/hero",
    available: true,
  },
  {
    id: "projects",
    title: "Projects",
    description:
      "Create and manage portfolio projects, links and technologies.",
    icon: FolderKanban,
    status: "Ready",
    route: "/admin/projects",
    available: true,
  },
  {
    id: "experience",
    title: "Experience",
    description:
      "Manage internships, work experience and responsibilities.",
    icon: BriefcaseBusiness,
    status: "Ready",
    route: "/admin/experience",
    available: true,
  },
  {
    id: "education",
    title: "Education",
    description:
      "Manage academic qualifications and supporting documents.",
    icon: GraduationCap,
    status: "Ready",
    route: "/admin/education",
    available: true,
  },
  {
    id: "certifications",
    title: "Certifications",
    description:
      "Manage certificates, credentials, skills and verification links.",
    icon: Award,
    status: "Ready",
    route: "/admin/certifications",
    available: true,
  },
];

/*
|--------------------------------------------------------------------------
| Admin Dashboard
|--------------------------------------------------------------------------
*/

function AdminDashboard() {
  const navigate = useNavigate();

  const [isSidebarOpen, setIsSidebarOpen] =
    useState(false);

  const [activeSection, setActiveSection] =
    useState("overview");

  const [isLoggingOut, setIsLoggingOut] =
    useState(false);

  /*
  |--------------------------------------------------------------------------
  | Section selection / navigation
  |--------------------------------------------------------------------------
  |
  | IMPORTANT:
  |
  | If a CMS module is already implemented, navigate to its protected
  | route.
  |
  | If it is not implemented yet, keep the existing dashboard placeholder.
  |
  | This prevents an unfinished module from accidentally navigating to
  | an unknown /admin route and getting redirected to Admin Login.
  |
  */

  const handleSectionSelect = (
    sectionId
  ) => {
    const selectedSection =
      dashboardSections.find(
        (section) =>
          section.id === sectionId
      );

    setIsSidebarOpen(false);

    /*
     * ================================================================
     * COMPLETED MODULE
     * ================================================================
     */

    if (
      selectedSection?.available &&
      selectedSection?.route
    ) {
      navigate(selectedSection.route);
      return;
    }

    /*
     * ================================================================
     * MODULE NOT IMPLEMENTED YET
     * ================================================================
     *
     * Keep the user inside Dashboard and show the existing
     * "Coming next" / module workspace placeholder.
     */

    setActiveSection(sectionId);
  };

  /*
  |--------------------------------------------------------------------------
  | Overview navigation
  |--------------------------------------------------------------------------
  */

  const handleOverviewSelect = () => {
    setActiveSection("overview");
    setIsSidebarOpen(false);

    /*
     * Dashboard is already the current route.
     *
     * We intentionally do not use navigate("/admin/dashboard")
     * here because it is unnecessary and could trigger an extra
     * authentication verification.
     */
  };

  /*
  |--------------------------------------------------------------------------
  | View public portfolio
  |--------------------------------------------------------------------------
  */

  const handleViewPortfolio = () => {
    window.location.href = "/";
  };

  /*
  |--------------------------------------------------------------------------
  | Logout
  |--------------------------------------------------------------------------
  |
  | Backend clears the HTTP-only admin cookie.
  | Afterwards the user is redirected to Admin Login.
  |
  */

  const handleLogout = async () => {
    if (isLoggingOut) {
      return;
    }

    setIsLoggingOut(true);

    try {
      const response = await fetch(
        `${
          import.meta.env
            .VITE_API_BASE_URL ||
          "http://localhost:5000"
        }/api/admin/logout`,
        {
          method: "POST",
          credentials: "include",
        }
      );

      if (!response.ok) {
        throw new Error(
          "Logout request failed."
        );
      }

      /*
       * Replace current history entry.
       *
       * This prevents the normal Back action from
       * immediately returning to the previous admin URL.
       */
      window.location.replace(
        "/admin/login?logout=success"
      );
    } catch (error) {
      console.error(
        "Admin logout failed:",
        error
      );

      /*
       * Do not keep the administrator trapped
       * inside the private workspace if the request fails.
       *
       * App.jsx + backend protection will still prevent
       * unauthorized access after the cookie/session is invalid.
       */
      window.location.replace(
        "/admin/login?logout=error"
      );
    }
  };

  /*
  |--------------------------------------------------------------------------
  | Active section information
  |--------------------------------------------------------------------------
  */

  const activeSectionData =
    dashboardSections.find(
      (section) =>
        section.id === activeSection
    );

  return (
    <div className="admin-dashboard">

      {/* ================================================================
          MOBILE OVERLAY
          ================================================================ */}

      {isSidebarOpen && (
        <button
          type="button"
          className="admin-dashboard-overlay"
          aria-label="Close navigation"
          onClick={() =>
            setIsSidebarOpen(false)
          }
        />
      )}

      {/* ================================================================
          SIDEBAR
          ================================================================ */}

      <aside
        className={`admin-dashboard-sidebar ${
          isSidebarOpen
            ? "is-open"
            : ""
        }`}
      >
        <div className="admin-dashboard-sidebar-inner">

          {/* ============================================================
              BRAND
              ============================================================ */}

          <div className="admin-dashboard-brand">

            <div className="admin-dashboard-brand-mark">
              A
            </div>

            <div className="admin-dashboard-brand-copy">
              <strong>
                Portfolio CMS
              </strong>

              <span>
                ADMIN WORKSPACE
              </span>
            </div>

            <button
              type="button"
              className="admin-dashboard-mobile-close"
              onClick={() =>
                setIsSidebarOpen(false)
              }
              aria-label="Close menu"
            >
              <X
                size={20}
                strokeWidth={2}
              />
            </button>

          </div>

          {/* ============================================================
              NAVIGATION
              ============================================================ */}

          <nav
            className="admin-dashboard-navigation"
            aria-label="Admin navigation"
          >

            {/* ==========================================================
                WORKSPACE
                ========================================================== */}

            <div className="admin-dashboard-nav-label">
              WORKSPACE
            </div>

            <button
              type="button"
              className={`admin-dashboard-nav-item ${
                activeSection ===
                "overview"
                  ? "is-active"
                  : ""
              }`}
              onClick={
                handleOverviewSelect
              }
            >
              <LayoutDashboard
                size={19}
                strokeWidth={1.9}
              />

              <span>
                Overview
              </span>
            </button>

            {/* ==========================================================
                CONTENT
                ========================================================== */}

            <div className="admin-dashboard-nav-label admin-dashboard-nav-label-spaced">
              CONTENT
            </div>

            {dashboardSections.map(
              (section) => {
                const Icon =
                  section.icon;

                return (
                  <button
                    type="button"
                    key={section.id}
                    className={`admin-dashboard-nav-item ${
                      activeSection ===
                      section.id
                        ? "is-active"
                        : ""
                    }`}
                    onClick={() =>
                      handleSectionSelect(
                        section.id
                      )
                    }
                  >

                    <Icon
                      size={19}
                      strokeWidth={1.9}
                    />

                    <span>
                      {section.title}
                    </span>

                  </button>
                );
              }
            )}

            {/* ==========================================================
                SIGN OUT
                ========================================================== */}

            <button
              type="button"
              className="admin-dashboard-nav-item admin-dashboard-logout-nav-item"
              onClick={
                handleLogout
              }
              disabled={
                isLoggingOut
              }
            >
              <LogOut
                size={19}
                strokeWidth={1.9}
              />

              <span>
                {isLoggingOut
                  ? "Signing out..."
                  : "Sign out"}
              </span>
            </button>

          </nav>
        </div>
      </aside>

      {/* ================================================================
          MAIN AREA
          ================================================================ */}

      <div className="admin-dashboard-main">

        {/* ============================================================
            TOPBAR
            ============================================================ */}

        <header className="admin-dashboard-topbar">

          <div className="admin-dashboard-topbar-left">

            <button
              type="button"
              className="admin-dashboard-menu-button"
              onClick={() =>
                setIsSidebarOpen(true)
              }
              aria-label="Open navigation"
            >
              <Menu
                size={21}
                strokeWidth={2}
              />
            </button>

            <div className="admin-dashboard-page-heading">

              <p className="admin-dashboard-eyebrow">
                PRIVATE WORKSPACE
              </p>

              <h1>
                {activeSection ===
                "overview"
                  ? "Dashboard"
                  : activeSectionData?.title ||
                    "Dashboard"}
              </h1>

            </div>
          </div>

          <div className="admin-dashboard-topbar-actions">

            <div className="admin-dashboard-live-status">
              <span className="admin-dashboard-live-dot" />

              <span>
                System online
              </span>
            </div>

            <button
              type="button"
              className="admin-dashboard-view-button"
              onClick={
                handleViewPortfolio
              }
            >
              <Globe2
                size={17}
                strokeWidth={1.9}
              />

              <span>
                View portfolio
              </span>

              <ExternalLink
                size={14}
                strokeWidth={1.9}
              />
            </button>

          </div>
        </header>

        {/* ============================================================
            CONTENT
            ============================================================ */}

        <main className="admin-dashboard-content">

          {activeSection ===
          "overview" ? (
            <>
              {/* ======================================================
                  WELCOME
                  ====================================================== */}

              <section className="admin-dashboard-welcome">

                <div className="admin-dashboard-welcome-copy">

                  <div className="admin-dashboard-section-kicker">

                    <Sparkles
                      size={15}
                      strokeWidth={2}
                    />

                    <span>
                      Portfolio control center
                    </span>

                  </div>

                  <h2>

                    <span className="admin-dashboard-welcome-title-main">
                      Build your professional
                    </span>

                    <span className="admin-dashboard-welcome-title-accent">
                      presence.
                    </span>

                  </h2>

                  <p>
                    Manage your portfolio
                    content, professional
                    information and public
                    presentation from one
                    secure workspace.
                  </p>

                </div>

                <div
                  className="admin-dashboard-welcome-art"
                  aria-hidden="true"
                >

                  <div className="admin-dashboard-art-ring admin-dashboard-art-ring-one" />

                  <div className="admin-dashboard-art-ring admin-dashboard-art-ring-two" />

                  <div className="admin-dashboard-art-core">

                    <Sparkles
                      size={31}
                      strokeWidth={1.5}
                    />

                  </div>

                </div>

              </section>

              {/* ======================================================
                  STATUS CARDS
                  ====================================================== */}

              <section className="admin-dashboard-stats">

                <article className="admin-dashboard-stat-card">

                  <div className="admin-dashboard-stat-icon">
                    <Database
                      size={19}
                      strokeWidth={1.8}
                    />
                  </div>

                  <div className="admin-dashboard-stat-copy">

                    <span>
                      Content system
                    </span>

                    <strong>
                      Connected
                    </strong>

                  </div>

                  <div className="admin-dashboard-stat-status">
                    <span />
                  </div>

                </article>

                <article className="admin-dashboard-stat-card">

                  <div className="admin-dashboard-stat-icon">
                    <Globe2
                      size={19}
                      strokeWidth={1.8}
                    />
                  </div>

                  <div className="admin-dashboard-stat-copy">

                    <span>
                      Public portfolio
                    </span>

                    <strong>
                      Available
                    </strong>

                  </div>

                  <div className="admin-dashboard-stat-status">
                    <span />
                  </div>

                </article>

                <article className="admin-dashboard-stat-card">

                  <div className="admin-dashboard-stat-icon">
                    <Activity
                      size={19}
                      strokeWidth={1.8}
                    />
                  </div>

                  <div className="admin-dashboard-stat-copy">

                    <span>
                      Workspace
                    </span>

                    <strong>
                      Protected
                    </strong>

                  </div>

                  <div className="admin-dashboard-stat-status">
                    <span />
                  </div>

                </article>

              </section>

              {/* ======================================================
                  CMS MODULES
                  ====================================================== */}

              <section className="admin-dashboard-sections">

                <div className="admin-dashboard-section-heading">

                  <div className="admin-dashboard-section-heading-copy">

                    <span>
                      CMS MODULES
                    </span>

                    <h3>
                      Manage your portfolio
                    </h3>

                  </div>

                  <p>
                    Each area will have its
                    own dedicated management
                    interface.
                  </p>

                </div>

                <div className="admin-dashboard-section-grid">

                  {dashboardSections.map(
                    (section) => {
                      const Icon =
                        section.icon;

                      return (
                        <button
                          type="button"
                          key={section.id}
                          className="admin-dashboard-module-card"
                          onClick={() =>
                            handleSectionSelect(
                              section.id
                            )
                          }
                        >

                          <div className="admin-dashboard-module-top">

                            <div className="admin-dashboard-module-icon">

                              <Icon
                                size={20}
                                strokeWidth={1.8}
                              />

                            </div>

                            <span
                              className={
                                section.status ===
                                "Ready"
                                  ? "is-ready"
                                  : "is-next"
                              }
                            >
                              {section.status}
                            </span>

                          </div>

                          <div className="admin-dashboard-module-content">

                            <h4>
                              {section.title}
                            </h4>

                            <p>
                              {section.description}
                            </p>

                          </div>

                          <div className="admin-dashboard-module-arrow">

                            <ChevronRight
                              size={18}
                              strokeWidth={1.8}
                            />

                          </div>

                        </button>
                      );
                    }
                  )}

                </div>

              </section>
            </>
          ) : (
            /* ==========================================================
               MODULE PLACEHOLDER

               Only modules that are not implemented yet reach here.

               Completed modules navigate to their own route instead.
               ========================================================== */

            <section className="admin-dashboard-module-placeholder">

              <div className="admin-dashboard-placeholder-icon">

                {activeSectionData &&
                  (() => {
                    const Icon =
                      activeSectionData.icon;

                    return (
                      <Icon
                        size={30}
                        strokeWidth={1.6}
                      />
                    );
                  })()}

              </div>

              <span className="admin-dashboard-section-kicker">
                CMS MODULE
              </span>

              <h2>
                {activeSectionData?.title}
              </h2>

              <p>
                {activeSectionData?.description}
              </p>

              <div className="admin-dashboard-placeholder-badge">

                {activeSectionData?.status ===
                "Ready"
                  ? "Module workspace ready"
                  : "Management interface coming next"}

              </div>

              <button
                type="button"
                className="admin-dashboard-back-button"
                onClick={
                  handleOverviewSelect
                }
              >
                <LayoutDashboard
                  size={17}
                  strokeWidth={1.9}
                />

                <span>
                  Back to dashboard
                </span>
              </button>

            </section>
          )}

        </main>
      </div>
    </div>
  );
}

export default AdminDashboard;