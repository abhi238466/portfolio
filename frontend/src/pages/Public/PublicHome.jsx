import { motion } from "motion/react";

import {
  ArrowDown,
  ArrowRight,
  ExternalLink,
  Mail,
  MapPin,
  Sparkles,
} from "lucide-react";

import { FaGithub, FaLinkedin } from "react-icons/fa";

import "./PublicHome.css";

/* =========================================================
   GENERAL HELPERS
========================================================= */

const asArray = (value) => {
  if (Array.isArray(value)) return value;

  if (value && typeof value === "object") {
    return [value];
  }

  return [];
};

const visibleItem = (item) =>
  item &&
  item.isActive !== false &&
  item.isVisible !== false &&
  item.visible !== false;

const toNumber = (value) => Number(value || 0);

/* =========================================================
   EMAIL HELPERS
========================================================= */

const getEmailAddress = (value) => {
  if (!value) return "";

  const email = String(value).trim();

  if (!email) return "";

  if (email.toLowerCase().startsWith("mailto:")) {
    return email.replace(/^mailto:/i, "").split("?")[0];
  }

  return email;
};

const getGmailComposeUrl = (value) => {
  const email = getEmailAddress(value);

  if (!email || !email.includes("@")) {
    return "";
  }

  return `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(
    email
  )}`;
};

/* =========================================================
   DOCUMENT URL HELPERS
========================================================= */

const getDocumentUrl = (document) => {
  if (!document) return "";

  return (
    document.url ||
    document.secureUrl ||
    document.secure_url ||
    document.previewUrl ||
    document.publicUrl ||
    document.signedUrl ||
    document.downloadUrl ||
    document.externalUrl ||
    document.fileUrl ||
    document.cloudinaryUrl ||
    document.path ||
    document.location ||
    ""
  );
};

const getDocumentType = (document) => {
  const mimeType = String(
    document?.mimeType ||
      document?.resourceType ||
      document?.type ||
      document?.fileType ||
      ""
  ).toLowerCase();

  const format = String(
    document?.format ||
      document?.extension ||
      ""
  ).toLowerCase();

  const originalName = String(
    document?.originalName ||
      document?.name ||
      document?.fileName ||
      document?.title ||
      ""
  ).toLowerCase();

  const url = String(getDocumentUrl(document)).toLowerCase();

  return {
    mimeType,
    format,
    originalName,
    url,
  };
};

const isImageDocument = (document) => {
  const {
    mimeType,
    format,
    originalName,
    url,
  } = getDocumentType(document);

  return (
    mimeType.startsWith("image/") ||
    mimeType === "image" ||
    ["jpg", "jpeg", "png", "webp", "gif", "svg", "avif"].includes(
      format
    ) ||
    /\.(jpg|jpeg|png|webp|gif|svg|avif)(\?|$)/i.test(
      originalName
    ) ||
    /\.(jpg|jpeg|png|webp|gif|svg|avif)(\?|$)/i.test(url)
  );
};

const isPdfDocument = (document) => {
  const {
    mimeType,
    format,
    originalName,
    url,
  } = getDocumentType(document);

  return (
    mimeType === "application/pdf" ||
    mimeType === "pdf" ||
    format === "pdf" ||
    originalName.endsWith(".pdf") ||
    /\.pdf(\?|$)/i.test(url)
  );
};

/* =========================================================
   MEDIA COLLECTION HELPERS
========================================================= */

const getMediaItems = (item, fields = []) => {
  if (!item) return [];

  const collected = [];

  fields.forEach((field) => {
    const value = item?.[field];

    if (Array.isArray(value)) {
      collected.push(...value);
    } else if (value && typeof value === "object") {
      collected.push(value);
    }
  });

  const directDocumentFields = [
    "document",
    "file",
    "attachment",
    "image",
    "media",
  ];

  directDocumentFields.forEach((field) => {
    const value = item?.[field];

    if (Array.isArray(value)) {
      collected.push(...value);
    } else if (value && typeof value === "object") {
      collected.push(value);
    }
  });

  const uniqueMedia = [];
  const usedKeys = new Set();

  collected.forEach((mediaItem, index) => {
    if (!mediaItem) return;

    const url = getDocumentUrl(mediaItem);

    if (!url) return;

    const uniqueKey =
      mediaItem?._id ||
      mediaItem?.id ||
      mediaItem?.publicId ||
      url ||
      `media-${index}`;

    if (usedKeys.has(uniqueKey)) return;

    usedKeys.add(uniqueKey);
    uniqueMedia.push(mediaItem);
  });

  return uniqueMedia;
};

/* =========================================================
   MEDIA PREVIEW COMPONENT
========================================================= */

function MediaPreview({
  items = [],
  className = "public-media-gallery",
}) {
  const media = asArray(items)
    .filter((item) => Boolean(getDocumentUrl(item)))
    .sort(
      (a, b) =>
        toNumber(a?.displayOrder) -
        toNumber(b?.displayOrder)
    );

  if (media.length === 0) {
    return null;
  }

  return (
    <div className={className}>
      {media.map((item, index) => {
        const url = getDocumentUrl(item);

        const label =
          item?.originalName ||
          item?.name ||
          item?.fileName ||
          item?.title ||
          `Document ${index + 1}`;

        const key =
          item?._id ||
          item?.id ||
          item?.publicId ||
          `${url}-${index}`;

        if (isImageDocument(item)) {
          return (
            <a
              key={key}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="public-media-item"
            >
              <img
                src={url}
                alt={label}
                loading="lazy"
              />
            </a>
          );
        }

        if (isPdfDocument(item)) {
          return (
            <div
              key={key}
              className="public-pdf-preview"
            >
              <iframe
                src={url}
                title={label}
                loading="lazy"
              />

              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="public-document-link"
              >
                <ExternalLink size={14} />

                <span>
                  Open PDF: {label}
                </span>
              </a>
            </div>
          );
        }

        return (
          <a
            key={key}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="public-document-link"
          >
            <ExternalLink size={14} />

            <span>{label}</span>
          </a>
        );
      })}
    </div>
  );
}

/* =========================================================
   DATE HELPERS
========================================================= */

const formatDate = (value) => {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return date.toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
  });
};

const dateRange = (
  startDate,
  endDate,
  current
) => {
  const start = formatDate(startDate);
  const end = current
    ? "Present"
    : formatDate(endDate);

  if (!start && !end) return "";

  return `${start || ""}${
    start || end ? " — " : ""
  }${end || ""}`.replace(
    /\s+—\s+$/,
    ""
  );
};

/* =========================================================
   SECTION HEADING
========================================================= */

function SectionHeading({
  eyebrow,
  title,
  description,
}) {
  return (
    <div className="public-section-heading">
      <span className="public-section-eyebrow">
        {eyebrow}
      </span>

      <h2>{title}</h2>

      {description && <p>{description}</p>}
    </div>
  );
}

/* =========================================================
   PUBLIC HOME COMPONENT
========================================================= */

function PublicHome({
  profile = {},
  hero = {},
  projects = [],
  experiences = [],
  education = [],
  certifications = [],
  socialLinks = {},
}) {
  /* -------------------------------------------------------
     PROFILE DATA
  ------------------------------------------------------- */

  const name = profile?.name || "";

  const headline = profile?.headline || "";

  const description =
    hero?.description ||
    profile?.shortBio ||
    "";

  const roles = asArray(
    hero?.animatedTitles
  )
    .filter(visibleItem)
    .sort(
      (a, b) =>
        toNumber(a?.displayOrder) -
        toNumber(b?.displayOrder)
    )
    .map((item) => item?.text)
    .filter(Boolean);

  const profilePhoto =
    profile?.profilePhoto?.url ||
    profile?.profilePhoto?.secureUrl ||
    profile?.photoUrl ||
    "";

  const links = asArray(
    profile?.links
  ).filter(visibleItem);

  const githubUrl =
    socialLinks?.github ||
    links.find(
      (link) => link?.type === "github"
    )?.url ||
    "";

  const linkedinUrl =
    socialLinks?.linkedin ||
    links.find(
      (link) => link?.type === "linkedin"
    )?.url ||
    "";

  const emailAddress =
    socialLinks?.email ||
    profile?.email ||
    "";

  const emailUrl =
    getGmailComposeUrl(emailAddress);

  const resumeUrl =
    hero?.primaryCta?.url ||
    profile?.resume?.url ||
    profile?.resumeUrl ||
    "";

  const contactUrl =
    hero?.secondaryCta?.url ||
    emailUrl ||
    "#contact";

  /* -------------------------------------------------------
     PUBLIC DATA
  ------------------------------------------------------- */

  const publicProjects = asArray(projects)
    .filter(visibleItem)
    .sort(
      (a, b) =>
        toNumber(a?.displayOrder) -
        toNumber(b?.displayOrder)
    );

  const publicExperiences = asArray(
    experiences
  )
    .filter(visibleItem)
    .sort(
      (a, b) =>
        toNumber(a?.displayOrder) -
        toNumber(b?.displayOrder)
    );

  const publicEducation = asArray(
    education
  )
    .filter(visibleItem)
    .sort(
      (a, b) =>
        toNumber(a?.displayOrder) -
        toNumber(b?.displayOrder)
    );

  const publicCertifications = asArray(
    certifications
  )
    .filter(visibleItem)
    .sort(
      (a, b) =>
        toNumber(a?.displayOrder) -
        toNumber(b?.displayOrder)
    );

  /* -------------------------------------------------------
     SKILLS
  ------------------------------------------------------- */

  const skills = [
    ...new Set(
      [
        ...publicProjects.flatMap((item) =>
          asArray(item?.technologies)
        ),

        ...publicExperiences.flatMap((item) => [
          ...asArray(item?.technologies),
          ...asArray(item?.skills),
        ]),

        ...publicCertifications.flatMap(
          (item) => [
            ...asArray(item?.technologies),
            ...asArray(item?.skills),
          ]
        ),
      ].filter(Boolean)
    ),
  ];

  /* =======================================================
     JSX
  ======================================================= */

  return (
    <main className="public-home">
      {/* =================================================
          HERO
      ================================================= */}

      <section
        id="home"
        className="public-home-hero"
        aria-labelledby="public-home-title"
      >
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

        <div className="public-home-hero-container">
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
            }}
          >
            <div className="public-home-status">
              <span />

              Available for meaningful
              opportunities
            </div>

            <p className="public-home-kicker">
              Hello, I'm
            </p>

            <h1 id="public-home-title">
              {name || "Your Name"}
            </h1>

            <div className="public-home-role">
              &gt;{" "}
              {headline ||
                roles[0] ||
                "Full Stack Developer"}

              <span className="public-home-cursor">
                _
              </span>
            </div>

            {description && (
              <p className="public-home-description">
                {description}
              </p>
            )}

            {roles.length > 0 && (
              <div className="public-home-exploring">
                <span>EXPLORING</span>

                {roles
                  .slice(0, 4)
                  .map((role) => (
                    <span
                      className="public-home-chip"
                      key={role}
                    >
                      {role}
                    </span>
                  ))}
              </div>
            )}

            <div className="public-home-actions">
              {hero?.primaryCta?.visible !== false &&
                resumeUrl && (
                  <a
                    className="public-home-primary-button"
                    href={resumeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {hero?.primaryCta?.label ||
                      "View Resume"}

                    <ArrowRight size={18} />
                  </a>
                )}

              {hero?.secondaryCta?.visible !==
                false && (
                <a
                  className="public-home-secondary-button"
                  href={contactUrl}
                  target={
                    contactUrl.startsWith("http")
                      ? "_blank"
                      : undefined
                  }
                  rel={
                    contactUrl.startsWith("http")
                      ? "noopener noreferrer"
                      : undefined
                  }
                >
                  {hero?.secondaryCta?.label ||
                    "Get In Touch"}

                  <Mail size={17} />
                </a>
              )}

              {!resumeUrl &&
                hero?.secondaryCta?.visible ===
                  false && (
                  <a
                    className="public-home-primary-button"
                    href="#projects"
                  >
                    Explore Work

                    <ArrowRight size={18} />
                  </a>
                )}
            </div>

            {hero?.showSocialLinks !== false &&
              (githubUrl ||
                linkedinUrl ||
                emailUrl) && (
                <div className="public-home-socials">
                  {githubUrl && (
                    <a
                      href={githubUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="GitHub"
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
                    >
                      <FaLinkedin size={18} />
                    </a>
                  )}

                  {emailUrl && (
                    <a
                      href={emailUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="Email"
                    >
                      <Mail size={18} />
                    </a>
                  )}
                </div>
              )}
          </motion.div>

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
              delay: 0.15,
            }}
          >
            <div className="public-home-profile-frame">
              <div className="public-home-profile-glow" />

              <div className="public-home-profile-card">
                {hero?.showProfilePhoto !== false &&
                profilePhoto ? (
                  <img
                    src={profilePhoto}
                    alt={`${name || "Profile"} profile`}
                    className="public-home-profile-image"
                  />
                ) : (
                  <div className="public-home-profile-placeholder">
                    <Sparkles size={30} />
                  </div>
                )}

                <div className="public-home-profile-overlay">
                  <span>PERSONAL CAREER</span>

                  <strong>
                    {roles[0] ||
                      headline ||
                      "BUILD / CREATE"}
                  </strong>
                </div>

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

              <motion.div
                className="public-home-floating-card public-home-floating-card-top"
                animate={{
                  y: [0, -8, 0],
                  rotate: [0, 1.5, 0],
                }}
                transition={{
                  duration: 5,
                  repeat: Infinity,
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
                }}
              >
                <span>DEVELOP</span>

                <ArrowDown size={14} />
              </motion.div>
            </div>
          </motion.div>
        </div>

        <a
          href="#about"
          className="public-home-scroll-indicator"
        >
          <span>Scroll to explore</span>

          <ArrowDown size={15} />
        </a>
      </section>

      {/* =================================================
          ABOUT
      ================================================= */}

      <section
        id="about"
        className="public-section public-about-section"
      >
        <SectionHeading
          eyebrow="01 / ABOUT"
          title="A little about me"
          description="A quick introduction, directly from the profile managed in the admin panel."
        />

        <div className="public-about-grid">
          <div className="public-panel public-about-copy">
            <p>
              {profile?.shortBio ||
                description ||
                "Profile information will appear here once it is published from the admin dashboard."}
            </p>

            {profile?.location && (
              <span className="public-meta">
                <MapPin size={15} />

                {profile.location}
              </span>
            )}
          </div>

          <div className="public-panel public-facts">
            <div>
              <span>Name</span>

              <strong>{name || "—"}</strong>
            </div>

            <div>
              <span>Headline</span>

              <strong>{headline || "—"}</strong>
            </div>

            <div>
              <span>Email</span>

              <strong>
                {profile?.email || "—"}
              </strong>
            </div>

            <div>
              <span>Phone</span>

              <strong>
                {profile?.phone || "—"}
              </strong>
            </div>
          </div>
        </div>
      </section>

      {/* =================================================
          SKILLS
      ================================================= */}

      <section
        id="skills"
        className="public-section"
      >
        <SectionHeading
          eyebrow="02 / SKILLS"
          title="Tools I work with"
          description="Technologies collected from published projects, experience and certifications."
        />

        <div className="public-skill-list">
          {skills.length ? (
            skills.map((skill) => (
              <span
                className="public-skill-pill"
                key={skill}
              >
                {skill}
              </span>
            ))
          ) : (
            <div className="public-empty">
              Skills will appear here from your
              published records.
            </div>
          )}
        </div>
      </section>

      {/* =================================================
          PROJECTS
      ================================================= */}

      <section
        id="projects"
        className="public-section"
      >
        <SectionHeading
          eyebrow="03 / PROJECTS"
          title="Selected work"
          description="Projects published through the admin CMS."
        />

        <div className="public-card-grid">
          {publicProjects.length ? (
            publicProjects.map((project) => {
              const projectMedia =
                getMediaItems(project, [
                  "images",
                  "documents",
                  "media",
                  "attachments",
                  "files",
                ]);

              return (
                <article
                  className="public-panel public-project-card"
                  key={
                    project?._id ||
                    project?.id ||
                    project?.title
                  }
                >
                  <div className="public-card-topline">
                    <span>
                      {project?.category ||
                        project?.projectType ||
                        "Project"}
                    </span>

                    <span>
                      {project?.status || ""}
                    </span>
                  </div>

                  <h3>{project?.title}</h3>

                  <p>
                    {project?.shortDescription ||
                      project?.fullDescription ||
                      ""}
                  </p>

                  {project?.role && (
                    <div className="public-card-role">
                      Role: {project.role}
                    </div>
                  )}

                  <div className="public-tag-list">
                    {asArray(
                      project?.technologies
                    ).map((tech) => (
                      <span key={tech}>
                        {tech}
                      </span>
                    ))}
                  </div>

                  <MediaPreview
                    items={projectMedia}
                    className="public-project-media"
                  />

                  <div className="public-card-links">
                    {project?.githubUrl && (
                      <a
                        href={project.githubUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        GitHub

                        <ExternalLink size={14} />
                      </a>
                    )}

                    {project?.liveDemoUrl && (
                      <a
                        href={project.liveDemoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Live Demo

                        <ExternalLink size={14} />
                      </a>
                    )}

                    {asArray(project?.links)
                      .filter(visibleItem)
                      .map((link, index) => (
                        <a
                          key={
                            link?._id ||
                            link?.id ||
                            link?.url ||
                            index
                          }
                          href={link?.url}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {link?.label ||
                            "Open link"}

                          <ExternalLink size={14} />
                        </a>
                      ))}
                  </div>
                </article>
              );
            })
          ) : (
            <div className="public-empty">
              No published projects yet.
            </div>
          )}
        </div>
      </section>

      {/* =================================================
          EXPERIENCE
      ================================================= */}

      <section
        id="experience"
        className="public-section"
      >
        <SectionHeading
          eyebrow="04 / EXPERIENCE"
          title="Where I have learned"
          description="Professional experience and practical learning published from the admin panel."
        />

        <div className="public-timeline">
          {publicExperiences.length ? (
            publicExperiences.map((item) => {
              const experienceMedia =
                getMediaItems(item, [
                  "documents",
                  "images",
                  "media",
                  "attachments",
                  "files",
                ]);

              return (
                <article
                  className="public-panel public-timeline-item"
                  key={
                    item?._id ||
                    item?.id ||
                    item?.companyName
                  }
                >
                  <div className="public-timeline-marker" />

                  <div>
                    <div className="public-card-topline">
                      <span>
                        {dateRange(
                          item?.startDate,
                          item?.endDate,
                          item?.currentlyWorking
                        )}
                      </span>

                      <span>
                        {item?.workMode || ""}
                      </span>
                    </div>

                    <h3>{item?.role}</h3>

                    <h4>
                      {item?.companyName}
                    </h4>

                    <p>
                      {item?.description || ""}
                    </p>

                    <div className="public-tag-list">
                      {[
                        ...asArray(
                          item?.technologies
                        ),
                        ...asArray(item?.skills),
                      ].map((tag, index) => (
                        <span
                          key={`${tag}-${index}`}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>

                    <MediaPreview
                      items={experienceMedia}
                      className="public-experience-media"
                    />
                  </div>
                </article>
              );
            })
          ) : (
            <div className="public-empty">
              No published experience yet.
            </div>
          )}
        </div>
      </section>

      {/* =================================================
          EDUCATION
      ================================================= */}

      <section
        id="education"
        className="public-section"
      >
        <SectionHeading
          eyebrow="05 / EDUCATION"
          title="Academic journey"
          description="Education records marked visible in the admin CMS."
        />

        <div className="public-card-grid">
          {publicEducation.length ? (
            publicEducation.map((item) => {
              const educationMedia =
                getMediaItems(item, [
                  "documents",
                  "images",
                  "media",
                  "attachments",
                  "files",
                ]);

              return (
                <article
                  className="public-panel public-education-card"
                  key={
                    item?._id ||
                    item?.id ||
                    item?.degreeName
                  }
                >
                  <div className="public-card-topline">
                    <span>
                      {item?.educationLevel ||
                        "Education"}
                    </span>

                    <span>
                      {dateRange(
                        item?.startDate,
                        item?.endDate,
                        item?.currentlyStudying
                      )}
                    </span>
                  </div>

                  <h3>{item?.degreeName}</h3>

                  <h4>
                    {item?.institutionName}
                  </h4>

                  {item?.fieldOfStudy && (
                    <p>{item.fieldOfStudy}</p>
                  )}

                  {item?.boardOrUniversity && (
                    <p>
                      {item.boardOrUniversity}
                    </p>
                  )}

                  {item?.grade && (
                    <strong>
                      Grade: {item.grade}
                    </strong>
                  )}

                  {item?.cgpa !== null &&
                    item?.cgpa !== undefined && (
                      <strong>
                        CGPA: {item.cgpa}
                      </strong>
                    )}

                  {item?.description && (
                    <p>{item.description}</p>
                  )}

                  <MediaPreview
                    items={educationMedia}
                    className="public-education-media"
                  />
                </article>
              );
            })
          ) : (
            <div className="public-empty">
              No published education records yet.
            </div>
          )}
        </div>
      </section>

      {/* =================================================
          CERTIFICATIONS
      ================================================= */}

      <section
        id="certifications"
        className="public-section"
      >
        <SectionHeading
          eyebrow="06 / CERTIFICATIONS"
          title="Continuous learning"
          description="Certificates published and marked visible by the administrator."
        />

        <div className="public-card-grid">
          {publicCertifications.length ? (
            publicCertifications.map((item) => {
              const certificationMedia =
                getMediaItems(item, [
                  "documents",
                  "images",
                  "media",
                  "attachments",
                  "files",
                ]);

              return (
                <article
                  className="public-panel public-certification-card"
                  key={
                    item?._id ||
                    item?.id ||
                    item?.certificateName
                  }
                >
                  <div className="public-card-topline">
                    <span>
                      {item?.issuingOrganization ||
                        "Certification"}
                    </span>

                    <span>
                      {formatDate(
                        item?.issueDate
                      )}
                    </span>
                  </div>

                  <h3>
                    {item?.certificateName}
                  </h3>

                  <p>
                    {item?.description || ""}
                  </p>

                  {item?.credentialId && (
                    <p className="public-muted">
                      Credential ID:{" "}
                      {item.credentialId}
                    </p>
                  )}

                  <div className="public-tag-list">
                    {[
                      ...asArray(
                        item?.technologies
                      ),
                      ...asArray(item?.skills),
                    ].map((tag, index) => (
                      <span
                        key={`${tag}-${index}`}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  <MediaPreview
                    items={certificationMedia}
                    className="public-document-media"
                  />

                  {item?.credentialUrl && (
                    <a
                      className="public-inline-link"
                      href={item.credentialUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Verify credential

                      <ExternalLink size={14} />
                    </a>
                  )}
                </article>
              );
            })
          ) : (
            <div className="public-empty">
              No published certifications yet.
            </div>
          )}
        </div>
      </section>

      {/* =================================================
          CONTACT
      ================================================= */}

      <section
        id="contact"
        className="public-section public-contact-section"
      >
        <SectionHeading
          eyebrow="07 / CONTACT"
          title="Let's build something useful"
          description="Have a project, opportunity or question? Reach out through the available contact details."
        />

        <div className="public-panel public-contact-card">
          <div>
            <h3>
              {name
                ? `Connect with ${name}`
                : "Let's connect"}
            </h3>

            <p>
              {profile?.email ||
                "Your contact email will appear here when it is published."}
            </p>

            {profile?.currentAddress && (
              <span className="public-meta">
                <MapPin size={15} />

                {profile.currentAddress}
              </span>
            )}
          </div>

          <div className="public-contact-actions">
            {emailUrl && (
              <a
                className="public-home-primary-button"
                href={emailUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                Email me

                <Mail size={17} />
              </a>
            )}

            {linkedinUrl && (
              <a
                className="public-home-secondary-button"
                href={linkedinUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                LinkedIn

                <ExternalLink size={16} />
              </a>
            )}
          </div>
        </div>
      </section>

      {/* =================================================
          FOOTER
      ================================================= */}

      <footer className="public-footer">
        <span>
          © {new Date().getFullYear()}{" "}
          {name || "Portfolio"}
        </span>

        <span>
          Built with purpose · Managed through
          Admin CMS
        </span>
      </footer>
    </main>
  );
}

export default PublicHome;