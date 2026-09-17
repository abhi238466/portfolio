import { motion } from "motion/react";
import {
  ArrowDown,
  ArrowRight,
  Mail,
  Sparkles,
} from "lucide-react";
import {
  FaGithub,
  FaLinkedin,
} from "react-icons/fa";

import "./PublicHome.css";

/*
|--------------------------------------------------------------------------
| Public Home Page
|--------------------------------------------------------------------------
|
| Responsibility:
| - Public portfolio landing page
| - Hero presentation
| - Primary CTA area
| - Social/contact entry points
| - Scroll cue
|
| IMPORTANT:
| No personal/professional portfolio content is hardcoded here.
|
| All dynamic content will eventually come from:
|
| Admin CMS
|     ↓
| Backend API
|     ↓
| MongoDB
|     ↓
| PublicHome props
|
|--------------------------------------------------------------------------
*/

function PublicHome({
  profile = {},
  hero = {},
  socialLinks = {},
}) {
  /*
  |--------------------------------------------------------------------------
  | Dynamic Hero Data
  |--------------------------------------------------------------------------
  */

  const name = profile?.name || "";
  const primaryRole = profile?.primaryRole || "";
  const introduction = hero?.introduction || "";
  const availability = hero?.availability || "";

  const roles = Array.isArray(hero?.roles)
    ? hero.roles.filter(Boolean)
    : [];

  const githubUrl = socialLinks?.github || "";
  const linkedinUrl = socialLinks?.linkedin || "";
  const emailUrl = socialLinks?.email || "";

  /*
  |--------------------------------------------------------------------------
  | Hero Content State
  |--------------------------------------------------------------------------
  */

  const hasHeroContent =
    Boolean(name) ||
    Boolean(primaryRole) ||
    Boolean(introduction) ||
    roles.length > 0 ||
    Boolean(availability);

  /*
  |--------------------------------------------------------------------------
  | Render
  |--------------------------------------------------------------------------
  */

  return (
    <main className="public-home">
      {/* =========================================================
          HERO SECTION
          ========================================================= */}

      <section
        id="home"
        className="public-home-hero"
        aria-labelledby="public-home-title"
      >
        {/* =======================================================
            DECORATIVE BACKGROUND
            ======================================================= */}

        <div
          className="public-home-background"
          aria-hidden="true"
        >
          <motion.div
            className="public-home-orb public-home-orb-one"
            animate={{
              x: [0, 30, 0],
              y: [0, -20, 0],
              scale: [1, 1.08, 1],
            }}
            transition={{
              duration: 9,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />

          <motion.div
            className="public-home-orb public-home-orb-two"
            animate={{
              x: [0, -25, 0],
              y: [0, 25, 0],
              scale: [1, 1.12, 1],
            }}
            transition={{
              duration: 11,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />

          <div className="public-home-grid" />
        </div>

        {/* =======================================================
            HERO CONTAINER
            ======================================================= */}

        <div className="public-home-hero-container">
          {/* =====================================================
              LEFT / MAIN CONTENT
              ===================================================== */}

          <motion.div
            className="public-home-hero-content"
            initial={{
              opacity: 0,
              y: 30,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            transition={{
              duration: 0.8,
              delay: 0.15,
              ease: [0.22, 1, 0.36, 1],
            }}
          >
            {/* =================================================
                AVAILABILITY / STATUS
                ================================================= */}

            {availability && (
              <motion.div
                className="public-home-status"
                initial={{
                  opacity: 0,
                  y: 12,
                }}
                animate={{
                  opacity: 1,
                  y: 0,
                }}
                transition={{
                  duration: 0.5,
                  delay: 0.3,
                }}
              >
                <span className="public-home-status-dot" />

                <span>{availability}</span>
              </motion.div>
            )}

            {/* =================================================
                MAIN HEADING
                ================================================= */}

            {name && (
              <h1
                id="public-home-title"
                className="public-home-title"
              >
                <span className="public-home-title-muted">
                  Hello, I&apos;m
                </span>

                <span className="public-home-title-name">
                  {name}
                </span>
              </h1>
            )}

            {/* =================================================
                PRIMARY ROLE
                ================================================= */}

            {primaryRole && (
              <div className="public-home-role-wrapper">
                <span className="public-home-role-prefix">
                  &gt;
                </span>

                <span className="public-home-role">
                  {primaryRole}
                </span>

                <motion.span
                  className="public-home-role-cursor"
                  animate={{
                    opacity: [1, 0, 1],
                  }}
                  transition={{
                    duration: 1.1,
                    repeat: Infinity,
                    ease: "linear",
                  }}
                >
                  _
                </motion.span>
              </div>
            )}

            {/* =================================================
                INTRODUCTION
                ================================================= */}

            {introduction && (
              <p className="public-home-introduction">
                {introduction}
              </p>
            )}

            {/* =================================================
                DYNAMIC ROLES
                ================================================= */}

            {roles.length > 0 && (
              <div className="public-home-role-list">
                <span className="public-home-role-list-label">
                  Exploring
                </span>

                <div className="public-home-role-list-items">
                  {roles.map((role, index) => (
                    <motion.span
                      key={`${role}-${index}`}
                      className="public-home-role-chip"
                      initial={{
                        opacity: 0,
                        y: 10,
                      }}
                      animate={{
                        opacity: 1,
                        y: 0,
                      }}
                      transition={{
                        duration: 0.4,
                        delay: 0.5 + index * 0.08,
                      }}
                    >
                      {role}
                    </motion.span>
                  ))}
                </div>
              </div>
            )}

            {/* =================================================
                CTA AREA
                ================================================= */}

            <div className="public-home-actions">
              <a
                href="#projects"
                className="public-home-primary-button"
              >
                <span>View Projects</span>

                <ArrowRight
                  size={17}
                  strokeWidth={2}
                />
              </a>

              <a
                href="#contact"
                className="public-home-secondary-button"
              >
                <Mail
                  size={17}
                  strokeWidth={1.8}
                />

                <span>Get In Touch</span>
              </a>
            </div>

            {/* =================================================
                SOCIAL LINKS
                ================================================= */}

            {(githubUrl || linkedinUrl || emailUrl) && (
              <div className="public-home-socials">
                {githubUrl && (
                  <a
                    href={githubUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="GitHub"
                    title="GitHub"
                  >
                    <FaGithub size={18} />
                  </a>
                )}

                {linkedinUrl && (
                  <a
                    href={linkedinUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="LinkedIn"
                    title="LinkedIn"
                  >
                    <FaLinkedin size={18} />
                  </a>
                )}

                {emailUrl && (
                  <a
                    href={emailUrl}
                    aria-label="Email"
                    title="Email"
                  >
                    <Mail
                      size={18}
                      strokeWidth={1.7}
                    />
                  </a>
                )}
              </div>
            )}
          </motion.div>

          {/* =====================================================
              RIGHT VISUAL AREA
              ===================================================== */}

          <motion.div
            className="public-home-visual"
            initial={{
              opacity: 0,
              scale: 0.92,
              x: 30,
            }}
            animate={{
              opacity: 1,
              scale: 1,
              x: 0,
            }}
            transition={{
              duration: 0.9,
              delay: 0.25,
              ease: [0.22, 1, 0.36, 1],
            }}
          >
            {/* =================================================
                PROFILE FRAME
                ================================================= */}

            <div className="public-home-profile-frame">
              <div className="public-home-profile-glow" />

              <div className="public-home-profile-card">
                {/* =================================================
                    PROFILE IMAGE
                    ================================================= */}

                {profile?.photoUrl ? (
                  <img
                    src={profile.photoUrl}
                    alt={
                      name
                        ? `${name} profile`
                        : "Profile"
                    }
                    className="public-home-profile-image"
                  />
                ) : (
                  <div
                    className="public-home-profile-placeholder"
                    aria-hidden="true"
                  >
                    <Sparkles
                      size={30}
                      strokeWidth={1.4}
                    />
                  </div>
                )}

                {/* =================================================
                    CARD FOOTER
                    ================================================= */}

                <div className="public-home-profile-footer">
                  <div className="public-home-profile-line">
                    <span />
                    <span />
                    <span />
                  </div>

                  <div className="public-home-profile-code">
                    <span>01</span>
                    <span>BUILD</span>
                  </div>
                </div>
              </div>

              {/* =================================================
                  FLOATING DECORATION
                  ================================================= */}

              <motion.div
                className="public-home-floating-card public-home-floating-card-top"
                animate={{
                  y: [0, -8, 0],
                  rotate: [0, 1.5, 0],
                }}
                transition={{
                  duration: 5,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              >
                <span className="public-home-floating-dot" />
                <span>CREATE</span>
              </motion.div>

              <motion.div
                className="public-home-floating-card public-home-floating-card-bottom"
                animate={{
                  y: [0, 8, 0],
                  rotate: [0, -1.5, 0],
                }}
                transition={{
                  duration: 6,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              >
                <span>DEVELOP</span>

                <ArrowDown
                  size={14}
                  strokeWidth={1.8}
                />
              </motion.div>
            </div>
          </motion.div>
        </div>

        {/* =======================================================
            SCROLL INDICATOR
            ======================================================= */}

        <motion.a
          href="#about"
          className="public-home-scroll-indicator"
          initial={{
            opacity: 0,
          }}
          animate={{
            opacity: 1,
          }}
          transition={{
            duration: 0.7,
            delay: 1.1,
          }}
          aria-label="Scroll to About section"
        >
          <span className="public-home-scroll-label">
            Scroll to explore
          </span>

          <motion.span
            className="public-home-scroll-icon"
            animate={{
              y: [0, 5, 0],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            <ArrowDown
              size={15}
              strokeWidth={1.7}
            />
          </motion.span>
        </motion.a>
      </section>

      {/* ===========================================================
          FUTURE SECTION ANCHORS
          =========================================================== */}

      {!hasHeroContent && (
        <div
          className="public-home-data-placeholder"
          aria-hidden="true"
        />
      )}
    </main>
  );
}

export default PublicHome;