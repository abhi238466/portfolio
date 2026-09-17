import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Menu,
  X,
  Sun,
  Moon,
  ShieldCheck,
} from "lucide-react";

import "./Navbar.css";

/*
|--------------------------------------------------------------------------
| Navbar Component
|--------------------------------------------------------------------------
|
| IMPORTANT:
| Portfolio content will ultimately come from the Admin CMS/API.
|
| This component only owns:
| - Navigation UI
| - Mobile menu
| - Theme toggle
| - Admin access entry point
| - Scroll navigation behavior
|
|--------------------------------------------------------------------------
*/

function Navbar({
  navigationItems = [],
}) {
  /*
  |--------------------------------------------------------------------------
  | Mobile Menu
  |--------------------------------------------------------------------------
  */

  const [isMenuOpen, setIsMenuOpen] = useState(false);

  /*
  |--------------------------------------------------------------------------
  | Theme
  |--------------------------------------------------------------------------
  */

  const [isDarkMode, setIsDarkMode] = useState(true);

  /*
  |--------------------------------------------------------------------------
  | Active Section
  |--------------------------------------------------------------------------
  */

  const [activeSection, setActiveSection] = useState("");

  /*
  |--------------------------------------------------------------------------
  | Apply Theme
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    const root = document.documentElement;

    if (isDarkMode) {
      root.classList.remove("light");
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
      root.classList.add("light");
    }
  }, [isDarkMode]);

  /*
  |--------------------------------------------------------------------------
  | Prevent Body Scroll When Mobile Menu Is Open
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    document.body.style.overflow = isMenuOpen
      ? "hidden"
      : "";

    return () => {
      document.body.style.overflow = "";
    };
  }, [isMenuOpen]);

  /*
  |--------------------------------------------------------------------------
  | Escape Key
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener(
      "keydown",
      handleEscape
    );

    return () => {
      document.removeEventListener(
        "keydown",
        handleEscape
      );
    };
  }, []);

  /*
  |--------------------------------------------------------------------------
  | Active Section Observer
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    if (!navigationItems.length) {
      return undefined;
    }

    const sections = navigationItems
      .map((item) => {
        if (!item?.href) {
          return null;
        }

        return document.querySelector(item.href);
      })
      .filter(Boolean);

    if (!sections.length) {
      return undefined;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const visibleSection = entries
          .filter((entry) => entry.isIntersecting)
          .sort(
            (first, second) =>
              second.intersectionRatio -
              first.intersectionRatio
          )[0];

        if (visibleSection?.target?.id) {
          setActiveSection(
            visibleSection.target.id
          );
        }
      },
      {
        root: null,
        rootMargin: "-30% 0px -55% 0px",
        threshold: [0.1, 0.25, 0.5, 0.75],
      }
    );

    sections.forEach((section) => {
      observer.observe(section);
    });

    return () => {
      observer.disconnect();
    };
  }, [navigationItems]);

  /*
  |--------------------------------------------------------------------------
  | Scroll Navigation
  |--------------------------------------------------------------------------
  */

  const handleNavigation = (href) => {
    setIsMenuOpen(false);

    if (!href) {
      return;
    }

    const target = document.querySelector(href);

    if (!target) {
      return;
    }

    target.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  /*
  |--------------------------------------------------------------------------
  | Admin Access
  |--------------------------------------------------------------------------
  |
  | Public visitors can see the portfolio normally.
  |
  | Admin access opens the protected login route.
  | The actual authentication happens on the backend.
  |
  |--------------------------------------------------------------------------
  */

  const handleAdminAccess = () => {
    setIsMenuOpen(false);

    window.location.href = "/admin/login";
  };

  /*
  |--------------------------------------------------------------------------
  | Theme Toggle
  |--------------------------------------------------------------------------
  */

  const handleThemeToggle = () => {
    setIsDarkMode(
      (currentMode) => !currentMode
    );
  };

  /*
  |--------------------------------------------------------------------------
  | Render
  |--------------------------------------------------------------------------
  */

  return (
    <>
      {/* =========================================================
          DESKTOP / TABLET NAVBAR
          ========================================================= */}

      <motion.header
        className="navbar"
        initial={{
          opacity: 0,
          y: -24,
        }}
        animate={{
          opacity: 1,
          y: 0,
        }}
        transition={{
          duration: 0.65,
          ease: [0.22, 1, 0.36, 1],
        }}
      >
        <div className="navbar-container">

          {/* =====================================================
              BRAND
              ===================================================== */}

          <button
            type="button"
            className="navbar-brand"
            onClick={() =>
              handleNavigation("#home")
            }
            aria-label="Go to homepage"
          >
            <span className="navbar-brand-mark">
              <span className="navbar-brand-letter">
                A
              </span>
            </span>

            <span className="navbar-brand-content">
              <span className="navbar-brand-name">
                Portfolio
              </span>

              <span className="navbar-brand-role">
                Personal Career
              </span>
            </span>
          </button>

          {/* =====================================================
              DESKTOP NAVIGATION
              ===================================================== */}

          <nav
            className="navbar-navigation"
            aria-label="Primary navigation"
          >
            {navigationItems.map(
              (item) => {
                const sectionId =
                  item.href?.replace(
                    "#",
                    ""
                  );

                const isActive =
                  activeSection ===
                  sectionId;

                return (
                  <button
                    key={
                      item.id ||
                      item.href ||
                      item.label
                    }
                    type="button"
                    className={`navbar-nav-link ${
                      isActive
                        ? "is-active"
                        : ""
                    }`}
                    onClick={() =>
                      handleNavigation(
                        item.href
                      )
                    }
                  >
                    <span>
                      {item.label}
                    </span>

                    {isActive && (
                      <motion.span
                        className="navbar-active-indicator"
                        layoutId="navbar-active-indicator"
                        transition={{
                          type: "spring",
                          stiffness: 380,
                          damping: 30,
                        }}
                      />
                    )}
                  </button>
                );
              }
            )}
          </nav>

          {/* =====================================================
              DESKTOP ACTIONS
              ===================================================== */}

          <div className="navbar-actions">

            {/* Theme */}

            <button
              type="button"
              className="navbar-icon-button"
              onClick={
                handleThemeToggle
              }
              aria-label={
                isDarkMode
                  ? "Switch to light mode"
                  : "Switch to dark mode"
              }
              title={
                isDarkMode
                  ? "Switch to light mode"
                  : "Switch to dark mode"
              }
            >
              <AnimatePresence
                mode="wait"
                initial={false}
              >
                <motion.span
                  key={
                    isDarkMode
                      ? "moon"
                      : "sun"
                  }
                  className="navbar-icon-wrapper"
                  initial={{
                    opacity: 0,
                    rotate: -90,
                    scale: 0.7,
                  }}
                  animate={{
                    opacity: 1,
                    rotate: 0,
                    scale: 1,
                  }}
                  exit={{
                    opacity: 0,
                    rotate: 90,
                    scale: 0.7,
                  }}
                  transition={{
                    duration: 0.2,
                  }}
                >
                  {isDarkMode ? (
                    <Moon
                      size={18}
                      strokeWidth={1.8}
                    />
                  ) : (
                    <Sun
                      size={18}
                      strokeWidth={1.8}
                    />
                  )}
                </motion.span>
              </AnimatePresence>
            </button>

            {/* Admin Access */}

            <button
              type="button"
              className="navbar-admin-button"
              onClick={
                handleAdminAccess
              }
              title="Authorized admin access only"
            >
              <ShieldCheck
                size={16}
                strokeWidth={1.8}
              />

              <span>
                Admin
              </span>
            </button>
          </div>

          {/* =====================================================
              MOBILE MENU BUTTON
              ===================================================== */}

          <button
            type="button"
            className="navbar-mobile-toggle"
            onClick={() =>
              setIsMenuOpen(
                (current) => !current
              )
            }
            aria-label={
              isMenuOpen
                ? "Close navigation menu"
                : "Open navigation menu"
            }
            aria-expanded={
              isMenuOpen
            }
            aria-controls="mobile-navigation"
          >
            <AnimatePresence
              mode="wait"
              initial={false}
            >
              <motion.span
                key={
                  isMenuOpen
                    ? "close"
                    : "menu"
                }
                className="navbar-icon-wrapper"
                initial={{
                  opacity: 0,
                  rotate: -45,
                  scale: 0.7,
                }}
                animate={{
                  opacity: 1,
                  rotate: 0,
                  scale: 1,
                }}
                exit={{
                  opacity: 0,
                  rotate: 45,
                  scale: 0.7,
                }}
                transition={{
                  duration: 0.2,
                }}
              >
                {isMenuOpen ? (
                  <X
                    size={23}
                    strokeWidth={1.8}
                  />
                ) : (
                  <Menu
                    size={23}
                    strokeWidth={1.8}
                  />
                )}
              </motion.span>
            </AnimatePresence>
          </button>
        </div>
      </motion.header>

      {/* ===========================================================
          MOBILE NAVIGATION
          =========================================================== */}

      <AnimatePresence>
        {isMenuOpen && (
          <>
            {/* Backdrop */}

            <motion.div
              className="navbar-mobile-backdrop"
              initial={{
                opacity: 0,
              }}
              animate={{
                opacity: 1,
              }}
              exit={{
                opacity: 0,
              }}
              transition={{
                duration: 0.25,
              }}
              onClick={() =>
                setIsMenuOpen(false)
              }
              aria-hidden="true"
            />

            {/* Mobile Panel */}

            <motion.div
              id="mobile-navigation"
              className="navbar-mobile-panel"
              initial={{
                opacity: 0,
                y: -18,
                scale: 0.98,
              }}
              animate={{
                opacity: 1,
                y: 0,
                scale: 1,
              }}
              exit={{
                opacity: 0,
                y: -18,
                scale: 0.98,
              }}
              transition={{
                duration: 0.3,
                ease: [
                  0.22,
                  1,
                  0.36,
                  1,
                ],
              }}
            >
              <nav
                className="navbar-mobile-navigation"
                aria-label="Mobile navigation"
              >
                {navigationItems.map(
                  (item, index) => {
                    const sectionId =
                      item.href?.replace(
                        "#",
                        ""
                      );

                    const isActive =
                      activeSection ===
                      sectionId;

                    return (
                      <motion.button
                        key={
                          item.id ||
                          item.href ||
                          item.label
                        }
                        type="button"
                        className={`navbar-mobile-link ${
                          isActive
                            ? "is-active"
                            : ""
                        }`}
                        onClick={() =>
                          handleNavigation(
                            item.href
                          )
                        }
                        initial={{
                          opacity: 0,
                          x: -12,
                        }}
                        animate={{
                          opacity: 1,
                          x: 0,
                        }}
                        transition={{
                          delay:
                            0.04 * index,
                          duration: 0.25,
                        }}
                      >
                        <span className="navbar-mobile-link-number">
                          {String(
                            index + 1
                          ).padStart(
                            2,
                            "0"
                          )}
                        </span>

                        <span className="navbar-mobile-link-label">
                          {
                            item.label
                          }
                        </span>

                        <span className="navbar-mobile-link-arrow">
                          ↗
                        </span>
                      </motion.button>
                    );
                  }
                )}
              </nav>

              <div className="navbar-mobile-divider" />

              {/* =================================================
                  MOBILE ACTIONS
                  ================================================= */}

              <div className="navbar-mobile-footer">

                {/* Theme */}

                <button
                  type="button"
                  className="navbar-mobile-theme-button"
                  onClick={
                    handleThemeToggle
                  }
                >
                  {isDarkMode ? (
                    <>
                      <Sun
                        size={17}
                        strokeWidth={
                          1.8
                        }
                      />

                      <span>
                        Light Mode
                      </span>
                    </>
                  ) : (
                    <>
                      <Moon
                        size={17}
                        strokeWidth={
                          1.8
                        }
                      />

                      <span>
                        Dark Mode
                      </span>
                    </>
                  )}
                </button>

                {/* Admin */}

                <button
                  type="button"
                  className="navbar-mobile-admin-button"
                  onClick={
                    handleAdminAccess
                  }
                >
                  <ShieldCheck
                    size={17}
                    strokeWidth={1.8}
                  />

                  <span>
                    Admin Access
                  </span>
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

export default Navbar;