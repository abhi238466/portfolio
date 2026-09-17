import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  ArrowDown,
  ArrowUp,
  ArrowLeft,
  Eye,
  EyeOff,
  GripVertical,
  Image as ImageIcon,
  Plus,
  Save,
  Trash2,
  X,
} from "lucide-react";

import { useNavigate } from "react-router";

import "./AdminHero.css";

/* =========================================================
   CONSTANTS
   ========================================================= */

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  "http://localhost:5000";

const MAX_HERO_TITLE_LENGTH = 80;
const MAX_HEADLINE_LENGTH = 160;
const MAX_DESCRIPTION_LENGTH = 600;
const MAX_CTA_LABEL_LENGTH = 40;
const MAX_CTA_URL_LENGTH = 500;
const MAX_TITLES = 10;

/* =========================================================
   DEFAULT DATA
   ========================================================= */

const EMPTY_FORM = {
  headline: "",
  description: "",
  animatedTitles: [],
  primaryCta: {
    label: "",
    type: "resume",
    url: "",
    visible: true,
  },
  secondaryCta: {
    label: "",
    type: "contact",
    url: "",
    visible: true,
  },
  showProfilePhoto: true,
  showSocialLinks: true,
  showResumeButton: true,
  showContactButton: true,
  isActive: true,
};

/* =========================================================
   UTILITY FUNCTIONS
   ========================================================= */

function createTitleId() {
  return `hero-title-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 9)}`;
}

function normalizeText(value) {
  return typeof value === "string"
    ? value.trim()
    : "";
}

function normalizeHeroResponse(data) {
  const hero =
    data?.hero ||
    data?.data ||
    data ||
    {};

  const animatedTitles = Array.isArray(
    hero?.animatedTitles
  )
    ? hero.animatedTitles
        .map((item, index) => {
          if (typeof item === "string") {
            return {
              clientId: createTitleId(),
              serverId: "",
              text: item,
              visible: true,
              displayOrder: index,
            };
          }

          return {
            clientId:
              item?.clientId ||
              createTitleId(),
            serverId:
              item?._id ||
              item?.id ||
              "",
            text:
              item?.text ||
              item?.title ||
              "",
            visible:
              item?.visible !== false,
            displayOrder:
              Number.isFinite(
                item?.displayOrder
              )
                ? item.displayOrder
                : index,
          };
        })
        .filter(
          (item) =>
            normalizeText(item.text)
              .length > 0
        )
        .sort(
          (a, b) =>
            a.displayOrder -
            b.displayOrder
        )
    : [];

  return {
    headline:
      hero?.headline || "",
    description:
      hero?.description ||
      hero?.intro ||
      "",
    animatedTitles,
    primaryCta: {
      label:
        hero?.primaryCta?.label ||
        "",
      type:
        hero?.primaryCta?.type ||
        "resume",
      url:
        hero?.primaryCta?.url ||
        "",
      visible:
        hero?.primaryCta?.visible !==
        false,
    },
    secondaryCta: {
      label:
        hero?.secondaryCta?.label ||
        "",
      type:
        hero?.secondaryCta?.type ||
        "contact",
      url:
        hero?.secondaryCta?.url ||
        "",
      visible:
        hero?.secondaryCta?.visible !==
        false,
    },
    showProfilePhoto:
      hero?.showProfilePhoto !==
      false,
    showSocialLinks:
      hero?.showSocialLinks !==
      false,
    showResumeButton:
      hero?.showResumeButton !==
      false,
    showContactButton:
      hero?.showContactButton !==
      false,
    isActive:
      hero?.isActive !== false,
  };
}

/* =========================================================
   REUSABLE FIELD LABEL
   ========================================================= */

function FieldLabel({
  children,
  required = false,
}) {
  return (
    <label className="admin-hero-field-label">
      {children}

      {required && (
        <span
          className="admin-hero-required"
          aria-hidden="true"
        >
          *
        </span>
      )}
    </label>
  );
}

/* =========================================================
   TOAST
   ========================================================= */

function HeroToast({
  status,
  onClose,
}) {
  if (!status?.message) {
    return null;
  }

  return (
    <div
      className={`admin-hero-toast admin-hero-toast-${status.type}`}
      role={
        status.type === "error"
          ? "alert"
          : "status"
      }
    >
      <div className="admin-hero-toast-content">
        <span className="admin-hero-toast-icon">
          {status.type === "success" &&
            "✅"}

          {status.type === "error" &&
            "❌"}

          {status.type === "warning" &&
            "⚠️"}

          {status.type === "info" &&
            "ℹ️"}

          {status.type === "loading" &&
            "⏳"}
        </span>

        <span>
          {status.message}
        </span>
      </div>

      {status.type !==
        "loading" && (
        <button
          type="button"
          className="admin-hero-toast-close"
          onClick={onClose}
          aria-label="Close notification"
        >
          <X size={17} />
        </button>
      )}
    </div>
  );
}

/* =========================================================
   CONFIRMATION MODAL
   ========================================================= */

function HeroConfirmModal({
  action,
  isSaving,
  onConfirm,
  onCancel,
  confirmButtonRef,
}) {
  if (!action) {
    return null;
  }

  return (
    <div
      className="admin-hero-modal-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (
          event.target ===
          event.currentTarget
        ) {
          onCancel();
        }
      }}
    >
      <div
        className="admin-hero-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="admin-hero-confirm-title"
      >
        <div className="admin-hero-modal-icon">
          ⚠️
        </div>

        <h2
          id="admin-hero-confirm-title"
        >
          {action.title}
        </h2>

        <p>
          {action.message}
        </p>

        <div className="admin-hero-modal-actions">
          <button
            type="button"
            className="admin-hero-button admin-hero-button-secondary"
            onClick={onCancel}
            disabled={isSaving}
          >
            Cancel
          </button>

          <button
            ref={confirmButtonRef}
            type="button"
            className="admin-hero-button admin-hero-button-danger"
            onClick={onConfirm}
            disabled={isSaving}
          >
            {isSaving
              ? "Please wait..."
              : action.confirmLabel ||
                "Confirm"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   TITLE ROW
   ========================================================= */

function AnimatedTitleRow({
  item,
  index,
  total,
  onChange,
  onToggleVisibility,
  onMoveUp,
  onMoveDown,
  onDelete,
}) {
  return (
    <div className="admin-hero-title-row">
      <div className="admin-hero-title-drag">
        <GripVertical
          size={18}
          aria-hidden="true"
        />
      </div>

      <div className="admin-hero-title-number">
        {index + 1}
      </div>

      <div className="admin-hero-title-input-wrap">
        <input
          type="text"
          value={item.text}
          onChange={(event) =>
            onChange(
              item.clientId,
              event.target.value
            )
          }
          maxLength={
            MAX_HERO_TITLE_LENGTH
          }
          placeholder="e.g. Full Stack Developer"
          className="admin-hero-input"
        />

        <span className="admin-hero-character-count">
          {item.text.length}/
          {MAX_HERO_TITLE_LENGTH}
        </span>
      </div>

      <button
        type="button"
        className={`admin-hero-icon-button ${
          item.visible
            ? ""
            : "is-hidden"
        }`}
        onClick={() =>
          onToggleVisibility(
            item.clientId
          )
        }
        title={
          item.visible
            ? "Hide title"
            : "Show title"
        }
        aria-label={
          item.visible
            ? "Hide title"
            : "Show title"
        }
      >
        {item.visible ? (
          <Eye size={18} />
        ) : (
          <EyeOff size={18} />
        )}
      </button>

      <div className="admin-hero-title-order">
        <button
          type="button"
          className="admin-hero-icon-button"
          onClick={() =>
            onMoveUp(index)
          }
          disabled={index === 0}
          title="Move up"
          aria-label="Move title up"
        >
          <ArrowUp size={17} />
        </button>

        <button
          type="button"
          className="admin-hero-icon-button"
          onClick={() =>
            onMoveDown(index)
          }
          disabled={
            index === total - 1
          }
          title="Move down"
          aria-label="Move title down"
        >
          <ArrowDown size={17} />
        </button>
      </div>

      <button
        type="button"
        className="admin-hero-icon-button admin-hero-delete-button"
        onClick={() =>
          onDelete(item)
        }
        title="Delete title"
        aria-label="Delete title"
      >
        <Trash2 size={18} />
      </button>
    </div>
  );
}

/* =========================================================
   MAIN ADMIN HERO COMPONENT
   ========================================================= */

function AdminHero() {
  const navigate = useNavigate();

  const [form, setForm] =
    useState(EMPTY_FORM);

  const [initialForm, setInitialForm] =
    useState(EMPTY_FORM);

  const [isLoading, setIsLoading] =
    useState(true);

  const [isSaving, setIsSaving] =
    useState(false);

  const [status, setStatus] =
    useState({
      type: "",
      message: "",
    });

  const [confirmAction, setConfirmAction] =
    useState(null);

  const confirmButtonRef =
    useRef(null);

  /* =======================================================
     TEMPORARY TOAST AUTO DISMISS
     ======================================================= */

  useEffect(() => {
    if (
      !status.message ||
      status.type === "loading"
    ) {
      return undefined;
    }

    const timer =
      window.setTimeout(() => {
        setStatus({
          type: "",
          message: "",
        });
      }, 4000);

    return () => {
      window.clearTimeout(timer);
    };
  }, [
    status.message,
    status.type,
  ]);

  /* =======================================================
     CONFIRM MODAL KEYBOARD HANDLING
     ======================================================= */

  useEffect(() => {
    if (!confirmAction) {
      return undefined;
    }

    const handleKeyDown = (
      event
    ) => {
      if (event.key === "Escape") {
        event.preventDefault();

        if (!isSaving) {
          setConfirmAction(null);
        }

        return;
      }

      if (
        event.key === "Enter" &&
        !isSaving
      ) {
        const activeElement =
          document.activeElement;

        const isTextarea =
          activeElement?.tagName ===
          "TEXTAREA";

        if (!isTextarea) {
          event.preventDefault();
          confirmButtonRef.current?.click();
        }
      }
    };

    document.addEventListener(
      "keydown",
      handleKeyDown
    );

    const focusTimer =
      window.setTimeout(() => {
        confirmButtonRef.current?.focus();
      }, 0);

    return () => {
      document.removeEventListener(
        "keydown",
        handleKeyDown
      );

      window.clearTimeout(
        focusTimer
      );
    };
  }, [
    confirmAction,
    isSaving,
  ]);

  /* =======================================================
     LOAD HERO
     ======================================================= */

  useEffect(() => {
    let isMounted = true;

    const loadHero = async () => {
      setIsLoading(true);

      setStatus({
        type: "loading",
        message:
          "Loading Hero Section...",
      });

      try {
        const response =
          await fetch(
            `${API_BASE_URL}/api/admin/hero`,
            {
              method: "GET",
              credentials: "include",
              headers: {
                Accept:
                  "application/json",
              },
              cache: "no-store",
            }
          );

        if (
          response.status === 401 ||
          response.status === 403
        ) {
          if (isMounted) {
            navigate(
              "/admin/login",
              {
                replace: true,
                state: {
                  reason:
                    "authentication-required",
                },
              }
            );
          }

          return;
        }

        const data =
          await response.json();

        if (!response.ok) {
          throw new Error(
            data?.message ||
              "Unable to load Hero Section."
          );
        }

        const normalized =
          normalizeHeroResponse(
            data
          );

        if (isMounted) {
          setForm(normalized);
          setInitialForm(normalized);

          setStatus({
            type: "success",
            message:
              "Hero Section loaded successfully. ✨",
          });
        }
      } catch (error) {
        console.error(
          "Hero load error:",
          error
        );

        if (isMounted) {
          setForm(EMPTY_FORM);
          setInitialForm(EMPTY_FORM);

          setStatus({
            type: "info",
            message:
              "Hero CMS is ready. Backend data will be connected in the next step.",
          });
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadHero();

    return () => {
      isMounted = false;
    };
  }, [navigate]);

  /* =======================================================
     DIRTY STATE
     ======================================================= */

  const isDirty = useMemo(
    () =>
      JSON.stringify(form) !==
      JSON.stringify(initialForm),
    [form, initialForm]
  );

  /* =======================================================
     FIELD CHANGE
     ======================================================= */

  const updateField = (
    field,
    value
  ) => {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));

    if (
      status.type !== "loading"
    ) {
      setStatus({
        type: "",
        message: "",
      });
    }
  };

  /* =======================================================
     CTA CHANGE
     ======================================================= */

  const updateCta = (
    ctaName,
    field,
    value
  ) => {
    setForm((previous) => ({
      ...previous,
      [ctaName]: {
        ...previous[ctaName],
        [field]: value,
      },
    }));

    if (
      status.type !== "loading"
    ) {
      setStatus({
        type: "",
        message: "",
      });
    }
  };

  /* =======================================================
     ADD ANIMATED TITLE
     ======================================================= */

  const handleAddTitle = () => {
    if (
      form.animatedTitles.length >=
      MAX_TITLES
    ) {
      setStatus({
        type: "warning",
        message: `You can add a maximum of ${MAX_TITLES} animated titles. ⚠️`,
      });

      return;
    }

    const newTitle = {
      clientId: createTitleId(),
      serverId: "",
      text: "",
      visible: true,
      displayOrder:
        form.animatedTitles.length,
    };

    setForm((previous) => ({
      ...previous,
      animatedTitles: [
        ...previous.animatedTitles,
        newTitle,
      ],
    }));
  };

  /* =======================================================
     UPDATE ANIMATED TITLE
     ======================================================= */

  const handleTitleChange = (
    clientId,
    value
  ) => {
    setForm((previous) => ({
      ...previous,
      animatedTitles:
        previous.animatedTitles.map(
          (item) =>
            item.clientId ===
            clientId
              ? {
                  ...item,
                  text: value,
                }
              : item
        ),
    }));
  };

  /* =======================================================
     TOGGLE TITLE VISIBILITY
     ======================================================= */

  const handleTitleVisibility =
    (clientId) => {
      setForm((previous) => ({
        ...previous,
        animatedTitles:
          previous.animatedTitles.map(
            (item) =>
              item.clientId ===
              clientId
                ? {
                    ...item,
                    visible:
                      !item.visible,
                  }
                : item
          ),
      }));
    };

  /* =======================================================
     MOVE TITLE
     ======================================================= */

  const moveTitle = (
    currentIndex,
    direction
  ) => {
    const newIndex =
      currentIndex + direction;

    if (
      newIndex < 0 ||
      newIndex >=
        form.animatedTitles.length
    ) {
      return;
    }

    setForm((previous) => {
      const updatedTitles = [
        ...previous.animatedTitles,
      ];

      const [
        movedTitle,
      ] = updatedTitles.splice(
        currentIndex,
        1
      );

      updatedTitles.splice(
        newIndex,
        0,
        movedTitle
      );

      return {
        ...previous,
        animatedTitles:
          updatedTitles.map(
            (item, index) => ({
              ...item,
              displayOrder: index,
            })
          ),
      };
    });
  };

  /* =======================================================
     DELETE TITLE
     ======================================================= */

  const handleDeleteTitle = (
    item
  ) => {
    setConfirmAction({
      type: "delete-title",
      title:
        "Delete animated title?",
      message: `Are you sure you want to remove "${item.text || "this title"}" from the Hero Section?`,
      confirmLabel: "Delete",
      payload: item,
    });
  };

  /* =======================================================
     SAVE
     ======================================================= */

  const handleSave = async () => {
    if (isSaving) {
      return;
    }

    const headline =
      normalizeText(
        form.headline
      );

    const description =
      normalizeText(
        form.description
      );

    const cleanedTitles =
      form.animatedTitles
        .map((item) => ({
          ...item,
          text: normalizeText(
            item.text
          ),
        }))
        .filter(
          (item) =>
            item.text.length > 0
        );

    if (
      headline.length >
      MAX_HEADLINE_LENGTH
    ) {
      setStatus({
        type: "error",
        message: `Headline cannot exceed ${MAX_HEADLINE_LENGTH} characters. ❌`,
      });

      return;
    }

    if (
      description.length >
      MAX_DESCRIPTION_LENGTH
    ) {
      setStatus({
        type: "error",
        message: `Description cannot exceed ${MAX_DESCRIPTION_LENGTH} characters. ❌`,
      });

      return;
    }

    const invalidTitle =
      cleanedTitles.find(
        (item) =>
          item.text.length >
          MAX_HERO_TITLE_LENGTH
      );

    if (invalidTitle) {
      setStatus({
        type: "error",
        message: `Each animated title must be ${MAX_HERO_TITLE_LENGTH} characters or fewer. ❌`,
      });

      return;
    }

    if (
      form.primaryCta.label.length >
      MAX_CTA_LABEL_LENGTH ||
      form.secondaryCta.label
        .length >
        MAX_CTA_LABEL_LENGTH
    ) {
      setStatus({
        type: "error",
        message: `CTA labels cannot exceed ${MAX_CTA_LABEL_LENGTH} characters. ❌`,
      });

      return;
    }

    setIsSaving(true);

    setStatus({
      type: "loading",
      message:
        "Saving Hero Section...",
    });

    const payload = {
      headline,
      description,
      animatedTitles:
        cleanedTitles.map(
          (item, index) => ({
            ...(item.serverId
              ? {
                  _id: item.serverId,
                }
              : {}),
            text: item.text,
            visible:
              item.visible !== false,
            displayOrder: index,
          })
        ),
      primaryCta: {
        label:
          normalizeText(
            form.primaryCta.label
          ),
        type:
          form.primaryCta.type,
        url:
          normalizeText(
            form.primaryCta.url
          ),
        visible:
          form.primaryCta.visible !==
          false,
      },
      secondaryCta: {
        label:
          normalizeText(
            form.secondaryCta.label
          ),
        type:
          form.secondaryCta.type,
        url:
          normalizeText(
            form.secondaryCta.url
          ),
        visible:
          form.secondaryCta.visible !==
          false,
      },
      showProfilePhoto:
        form.showProfilePhoto,
      showSocialLinks:
        form.showSocialLinks,
      showResumeButton:
        form.showResumeButton,
      showContactButton:
        form.showContactButton,
      isActive: form.isActive,
    };

    try {
      const response =
        await fetch(
          `${API_BASE_URL}/api/admin/hero`,
          {
            method: "PUT",
            credentials: "include",
            headers: {
              "Content-Type":
                "application/json",
              Accept:
                "application/json",
            },
            body: JSON.stringify(
              payload
            ),
          }
        );

      if (
        response.status === 401 ||
        response.status === 403
      ) {
        navigate(
          "/admin/login",
          {
            replace: true,
            state: {
              reason:
                "authentication-required",
            },
          }
        );

        return;
      }

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data?.message ||
            "Unable to save Hero Section."
        );
      }

      const savedForm =
        normalizeHeroResponse(
          data
        );

      setForm(savedForm);
      setInitialForm(savedForm);

      setStatus({
        type: "success",
        message:
          "Hero Section saved successfully. 🎉",
      });
    } catch (error) {
      console.error(
        "Hero save error:",
        error
      );

      setStatus({
        type: "error",
        message:
          error?.message ||
          "Unable to save Hero Section. Please try again.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  /* =======================================================
     CONFIRM ACTION
     ======================================================= */

  const handleConfirmAction =
    async () => {
      if (!confirmAction) {
        return;
      }

      if (
        confirmAction.type ===
        "delete-title"
      ) {
        const clientId =
          confirmAction.payload
            ?.clientId;

        setForm((previous) => ({
          ...previous,
          animatedTitles:
            previous.animatedTitles
              .filter(
                (item) =>
                  item.clientId !==
                  clientId
              )
              .map(
                (item, index) => ({
                  ...item,
                  displayOrder:
                    index,
                })
              ),
        }));

        setConfirmAction(null);

        setStatus({
          type: "success",
          message:
            "Animated title removed. Save changes to apply it. 🗑️",
        });
      }
    };

  /* =======================================================
     CANCEL CHANGES
     ======================================================= */

  const handleCancelChanges =
    () => {
      if (!isDirty) {
        return;
      }

      setConfirmAction({
        type: "discard",
        title:
          "Discard unsaved changes?",
        message:
          "Your current Hero Section changes have not been saved. Do you want to discard them?",
        confirmLabel:
          "Discard Changes",
      });
    };

  /* =======================================================
     CONFIRM DISCARD
     ======================================================= */

  const handleDiscardChanges =
    () => {
      setForm(initialForm);

      setConfirmAction(null);

      setStatus({
        type: "info",
        message:
          "Unsaved changes were discarded. ↩️",
      });
    };

  /* =======================================================
     ACTIVE / VISIBILITY TOGGLE
     ======================================================= */

  const handleActiveToggle = () => {
    setForm((previous) => ({
      ...previous,
      isActive:
        !previous.isActive,
    }));
  };

  /* =======================================================
     LOADING STATE
     ======================================================= */

  if (isLoading) {
    return (
      <div className="admin-hero-page">
        <div className="admin-hero-loading">
          <div className="admin-hero-loading-icon">
            ✨
          </div>

          <div
            className="admin-hero-spinner"
            aria-hidden="true"
          />

          <h1>
            Loading Hero Section
          </h1>

          <p>
            Preparing your Hero CMS
            workspace...
          </p>
        </div>
      </div>
    );
  }

  /* =======================================================
     RENDER
     ======================================================= */

  return (
    <div className="admin-hero-page">
      <HeroToast
        status={status}
        onClose={() =>
          setStatus({
            type: "",
            message: "",
          })
        }
      />

      <HeroConfirmModal
        action={confirmAction}
        isSaving={isSaving}
        confirmButtonRef={
          confirmButtonRef
        }
        onCancel={() =>
          setConfirmAction(null)
        }
        onConfirm={() => {
          if (
            confirmAction?.type ===
            "discard"
          ) {
            handleDiscardChanges();
            return;
          }

          handleConfirmAction();
        }}
      />

      {/* ===================================================
          HEADER
          =================================================== */}

      <header className="admin-hero-header">
        <div
          className="admin-hero-header-content"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "18px",
          }}
        >
          {/* =================================================
              BACK TO DASHBOARD BUTTON
              ================================================= */}

          <button
            type="button"
            onClick={() =>
              navigate(
                "/admin/dashboard"
              )
            }
            aria-label="Back to dashboard"
            title="Back to dashboard"
            style={{
              flex: "0 0 auto",
              width: "54px",
              height: "54px",
              minWidth: "54px",
              border: "1px solid rgba(89, 64, 48, 0.12)",
              borderRadius: "14px",
              background:
                "rgba(255, 255, 255, 0.82)",
              color: "#2d211b",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              boxShadow:
                "0 8px 24px rgba(63, 38, 24, 0.06)",
              transition:
                "transform 180ms ease, box-shadow 180ms ease, background 180ms ease",
            }}
            onMouseEnter={(
              event
            ) => {
              event.currentTarget.style.transform =
                "translateY(-1px)";
              event.currentTarget.style.boxShadow =
                "0 12px 28px rgba(63, 38, 24, 0.10)";
              event.currentTarget.style.background =
                "#ffffff";
            }}
            onMouseLeave={(
              event
            ) => {
              event.currentTarget.style.transform =
                "translateY(0)";
              event.currentTarget.style.boxShadow =
                "0 8px 24px rgba(63, 38, 24, 0.06)";
              event.currentTarget.style.background =
                "rgba(255, 255, 255, 0.82)";
            }}
          >
            <ArrowLeft
              size={22}
              strokeWidth={1.9}
            />
          </button>

          <div
            style={{
              flex: "1 1 auto",
              minWidth: 0,
            }}
          >
            <div className="admin-hero-eyebrow">
              <span>✨</span>
              Homepage CMS
            </div>

            <h1>
              Hero Section
            </h1>

            <p>
              Manage the first
              impression visitors see
              when they open your
              portfolio.
            </p>
          </div>

          <div className="admin-hero-header-status">
            <span
              className={`admin-hero-status-dot ${
                form.isActive
                  ? "is-active"
                  : "is-inactive"
              }`}
            />

            <span>
              {form.isActive
                ? "Hero Active"
                : "Hero Hidden"}
            </span>
          </div>
        </div>
      </header>

      {/* ===================================================
          MAIN CONTENT
          =================================================== */}

      <main className="admin-hero-content">
        {/* =================================================
            HERO IDENTITY
            ================================================= */}

        <section className="admin-hero-card">
          <div className="admin-hero-card-header">
            <div>
              <span className="admin-hero-section-number">
                01
              </span>

              <div>
                <h2>
                  Hero Introduction
                </h2>

                <p>
                  Define the primary
                  message visitors see
                  at the top of your
                  portfolio.
                </p>
              </div>
            </div>
          </div>

          <div className="admin-hero-form-grid">
            <div className="admin-hero-form-field admin-hero-full-width">
              <FieldLabel required>
                Main Headline
              </FieldLabel>

              <input
                type="text"
                value={form.headline}
                onChange={(event) =>
                  updateField(
                    "headline",
                    event.target.value
                  )
                }
                maxLength={
                  MAX_HEADLINE_LENGTH
                }
                placeholder="e.g. Full Stack Developer"
                className="admin-hero-input"
              />

              <div className="admin-hero-field-meta">
                <span>
                  This is the primary
                  professional headline.
                </span>

                <span>
                  {form.headline.length}/
                  {MAX_HEADLINE_LENGTH}
                </span>
              </div>
            </div>

            <div className="admin-hero-form-field admin-hero-full-width">
              <FieldLabel>
                Introduction
              </FieldLabel>

              <textarea
                value={form.description}
                onChange={(event) =>
                  updateField(
                    "description",
                    event.target.value
                  )
                }
                maxLength={
                  MAX_DESCRIPTION_LENGTH
                }
                rows={5}
                placeholder="Write a concise introduction for visitors..."
                className="admin-hero-textarea"
              />

              <div className="admin-hero-field-meta">
                <span>
                  Keep this clear,
                  professional and
                  visitor-friendly.
                </span>

                <span>
                  {form.description.length}/
                  {MAX_DESCRIPTION_LENGTH}
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* =================================================
            ANIMATED TITLES
            ================================================= */}

        <section className="admin-hero-card">
          <div className="admin-hero-card-header">
            <div>
              <span className="admin-hero-section-number">
                02
              </span>

              <div>
                <h2>
                  Animated Professional
                  Titles
                </h2>

                <p>
                  Add the professional
                  roles or technologies
                  that rotate in the
                  public Hero section.
                </p>
              </div>
            </div>

            <button
              type="button"
              className="admin-hero-button admin-hero-button-primary"
              onClick={
                handleAddTitle
              }
              disabled={
                form.animatedTitles
                  .length >=
                MAX_TITLES
              }
            >
              <Plus size={18} />
              Add Title
            </button>
          </div>

          <div className="admin-hero-title-info">
            <div className="admin-hero-info-icon">
              💡
            </div>

            <p>
              Example: Full Stack
              Developer, Java
              Developer, MERN
              Developer, Cloud
              Enthusiast.
            </p>
          </div>

          {form.animatedTitles
            .length === 0 ? (
            <div className="admin-hero-empty-state">
              <div className="admin-hero-empty-icon">
                ✨
              </div>

              <h3>
                No animated titles
                yet
              </h3>

              <p>
                Add at least one
                professional title
                for the public Hero
                animation.
              </p>

              <button
                type="button"
                className="admin-hero-button admin-hero-button-secondary"
                onClick={
                  handleAddTitle
                }
              >
                <Plus size={17} />
                Add First Title
              </button>
            </div>
          ) : (
            <div className="admin-hero-title-list">
              {form.animatedTitles.map(
                (
                  item,
                  index
                ) => (
                  <AnimatedTitleRow
                    key={
                      item.clientId
                    }
                    item={item}
                    index={index}
                    total={
                      form
                        .animatedTitles
                        .length
                    }
                    onChange={
                      handleTitleChange
                    }
                    onToggleVisibility={
                      handleTitleVisibility
                    }
                    onMoveUp={() =>
                      moveTitle(
                        index,
                        -1
                      )
                    }
                    onMoveDown={() =>
                      moveTitle(
                        index,
                        1
                      )
                    }
                    onDelete={
                      handleDeleteTitle
                    }
                  />
                )
              )}
            </div>
          )}
        </section>

        {/* =================================================
            CTA BUTTONS
            ================================================= */}

        <section className="admin-hero-card">
          <div className="admin-hero-card-header">
            <div>
              <span className="admin-hero-section-number">
                03
              </span>

              <div>
                <h2>
                  Hero Actions
                </h2>

                <p>
                  Configure the primary
                  actions visitors can
                  take from the Hero
                  section.
                </p>
              </div>
            </div>
          </div>

          <div className="admin-hero-cta-grid">
            {/* =============================================
                PRIMARY CTA
                ============================================= */}

            <div className="admin-hero-cta-card">
              <div className="admin-hero-cta-card-header">
                <div className="admin-hero-cta-icon">
                  📄
                </div>

                <div>
                  <h3>
                    Primary Action
                  </h3>

                  <p>
                    Usually used for
                    Resume.
                  </p>
                </div>

                <button
                  type="button"
                  className={`admin-hero-icon-button ${
                    form.primaryCta
                      .visible
                      ? ""
                      : "is-hidden"
                  }`}
                  onClick={() =>
                    updateCta(
                      "primaryCta",
                      "visible",
                      !form
                        .primaryCta
                        .visible
                    )
                  }
                  title={
                    form.primaryCta
                      .visible
                      ? "Hide primary action"
                      : "Show primary action"
                  }
                  aria-label={
                    form.primaryCta
                      .visible
                      ? "Hide primary action"
                      : "Show primary action"
                  }
                >
                  {form.primaryCta
                    .visible ? (
                    <Eye size={18} />
                  ) : (
                    <EyeOff
                      size={18}
                    />
                  )}
                </button>
              </div>

              <div className="admin-hero-form-field">
                <FieldLabel>
                  Button Label
                </FieldLabel>

                <input
                  type="text"
                  value={
                    form.primaryCta
                      .label
                  }
                  onChange={(event) =>
                    updateCta(
                      "primaryCta",
                      "label",
                      event.target
                        .value
                    )
                  }
                  maxLength={
                    MAX_CTA_LABEL_LENGTH
                  }
                  placeholder="e.g. View Resume"
                  className="admin-hero-input"
                />
              </div>

              <div className="admin-hero-form-field">
                <FieldLabel>
                  Action Type
                </FieldLabel>

                <select
                  value={
                    form.primaryCta
                      .type
                  }
                  onChange={(event) =>
                    updateCta(
                      "primaryCta",
                      "type",
                      event.target
                        .value
                    )
                  }
                  className="admin-hero-select"
                >
                  <option value="resume">
                    Resume
                  </option>

                  <option value="external">
                    External Link
                  </option>

                  <option value="custom">
                    Custom
                  </option>
                </select>
              </div>

              {form.primaryCta
                .type !==
                "resume" && (
                <div className="admin-hero-form-field">
                  <FieldLabel>
                    URL
                  </FieldLabel>

                  <input
                    type="text"
                    value={
                      form.primaryCta
                        .url
                    }
                    onChange={(
                      event
                    ) =>
                      updateCta(
                        "primaryCta",
                        "url",
                        event.target
                          .value
                      )
                    }
                    maxLength={
                      MAX_CTA_URL_LENGTH
                    }
                    placeholder="https://..."
                    className="admin-hero-input"
                  />
                </div>
              )}

              <div className="admin-hero-cta-status">
                <span
                  className={
                    form.primaryCta
                      .visible
                      ? "is-visible"
                      : "is-hidden"
                  }
                >
                  {form.primaryCta
                    .visible
                    ? "Visible on public Hero"
                    : "Hidden from public Hero"}
                </span>
              </div>
            </div>

            {/* =============================================
                SECONDARY CTA
                ============================================= */}

            <div className="admin-hero-cta-card">
              <div className="admin-hero-cta-card-header">
                <div className="admin-hero-cta-icon">
                  📩
                </div>

                <div>
                  <h3>
                    Secondary Action
                  </h3>

                  <p>
                    Usually used for
                    Contact.
                  </p>
                </div>

                <button
                  type="button"
                  className={`admin-hero-icon-button ${
                    form.secondaryCta
                      .visible
                      ? ""
                      : "is-hidden"
                  }`}
                  onClick={() =>
                    updateCta(
                      "secondaryCta",
                      "visible",
                      !form
                        .secondaryCta
                        .visible
                    )
                  }
                  title={
                    form.secondaryCta
                      .visible
                      ? "Hide secondary action"
                      : "Show secondary action"
                  }
                  aria-label={
                    form.secondaryCta
                      .visible
                      ? "Hide secondary action"
                      : "Show secondary action"
                  }
                >
                  {form.secondaryCta
                    .visible ? (
                    <Eye size={18} />
                  ) : (
                    <EyeOff
                      size={18}
                    />
                  )}
                </button>
              </div>

              <div className="admin-hero-form-field">
                <FieldLabel>
                  Button Label
                </FieldLabel>

                <input
                  type="text"
                  value={
                    form.secondaryCta
                      .label
                  }
                  onChange={(event) =>
                    updateCta(
                      "secondaryCta",
                      "label",
                      event.target
                        .value
                    )
                  }
                  maxLength={
                    MAX_CTA_LABEL_LENGTH
                  }
                  placeholder="e.g. Contact Me"
                  className="admin-hero-input"
                />
              </div>

              <div className="admin-hero-form-field">
                <FieldLabel>
                  Action Type
                </FieldLabel>

                <select
                  value={
                    form.secondaryCta
                      .type
                  }
                  onChange={(event) =>
                    updateCta(
                      "secondaryCta",
                      "type",
                      event.target
                        .value
                    )
                  }
                  className="admin-hero-select"
                >
                  <option value="contact">
                    Contact
                  </option>

                  <option value="external">
                    External Link
                  </option>

                  <option value="custom">
                    Custom
                  </option>
                </select>
              </div>

              {form.secondaryCta
                .type !==
                "contact" && (
                <div className="admin-hero-form-field">
                  <FieldLabel>
                    URL
                  </FieldLabel>

                  <input
                    type="text"
                    value={
                      form.secondaryCta
                        .url
                    }
                    onChange={(
                      event
                    ) =>
                      updateCta(
                        "secondaryCta",
                        "url",
                        event.target
                          .value
                      )
                    }
                    maxLength={
                      MAX_CTA_URL_LENGTH
                    }
                    placeholder="https://..."
                    className="admin-hero-input"
                  />
                </div>
              )}

              <div className="admin-hero-cta-status">
                <span
                  className={
                    form.secondaryCta
                      .visible
                      ? "is-visible"
                      : "is-hidden"
                  }
                >
                  {form.secondaryCta
                    .visible
                    ? "Visible on public Hero"
                    : "Hidden from public Hero"}
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* =================================================
            DISPLAY SETTINGS
            ================================================= */}

        <section className="admin-hero-card">
          <div className="admin-hero-card-header">
            <div>
              <span className="admin-hero-section-number">
                04
              </span>

              <div>
                <h2>
                  Display Settings
                </h2>

                <p>
                  Control which shared
                  portfolio elements are
                  presented inside the
                  Hero.
                </p>
              </div>
            </div>
          </div>

          <div className="admin-hero-settings-list">
            {/* PROFILE PHOTO */}

            <div className="admin-hero-setting-row">
              <div className="admin-hero-setting-icon">
                <ImageIcon
                  size={19}
                />
              </div>

              <div className="admin-hero-setting-content">
                <h3>
                  Profile Photo
                </h3>

                <p>
                  Use the profile photo
                  managed from the Profile
                  module.
                </p>
              </div>

              <button
                type="button"
                className={`admin-hero-toggle ${
                  form.showProfilePhoto
                    ? "is-on"
                    : ""
                }`}
                onClick={() =>
                  updateField(
                    "showProfilePhoto",
                    !form.showProfilePhoto
                  )
                }
                aria-pressed={
                  form.showProfilePhoto
                }
              >
                <span />
              </button>
            </div>

            {/* SOCIAL LINKS */}

            <div className="admin-hero-setting-row">
              <div className="admin-hero-setting-icon">
                🔗
              </div>

              <div className="admin-hero-setting-content">
                <h3>
                  Social Links
                </h3>

                <p>
                  Show visible professional
                  links from the Profile
                  module.
                </p>
              </div>

              <button
                type="button"
                className={`admin-hero-toggle ${
                  form.showSocialLinks
                    ? "is-on"
                    : ""
                }`}
                onClick={() =>
                  updateField(
                    "showSocialLinks",
                    !form.showSocialLinks
                  )
                }
                aria-pressed={
                  form.showSocialLinks
                }
              >
                <span />
              </button>
            </div>

            {/* RESUME */}

            <div className="admin-hero-setting-row">
              <div className="admin-hero-setting-icon">
                📄
              </div>

              <div className="admin-hero-setting-content">
                <h3>
                  Resume Button
                </h3>

                <p>
                  Allow the Hero to
                  display the managed
                  resume action.
                </p>
              </div>

              <button
                type="button"
                className={`admin-hero-toggle ${
                  form.showResumeButton
                    ? "is-on"
                    : ""
                }`}
                onClick={() =>
                  updateField(
                    "showResumeButton",
                    !form.showResumeButton
                  )
                }
                aria-pressed={
                  form.showResumeButton
                }
              >
                <span />
              </button>
            </div>

            {/* CONTACT */}

            <div className="admin-hero-setting-row">
              <div className="admin-hero-setting-icon">
                📩
              </div>

              <div className="admin-hero-setting-content">
                <h3>
                  Contact Button
                </h3>

                <p>
                  Allow the Hero to
                  display the contact
                  action.
                </p>
              </div>

              <button
                type="button"
                className={`admin-hero-toggle ${
                  form.showContactButton
                    ? "is-on"
                    : ""
                }`}
                onClick={() =>
                  updateField(
                    "showContactButton",
                    !form.showContactButton
                  )
                }
                aria-pressed={
                  form.showContactButton
                }
              >
                <span />
              </button>
            </div>

            {/* HERO ACTIVE */}

            <div className="admin-hero-setting-row admin-hero-setting-row-important">
              <div className="admin-hero-setting-icon">
                {form.isActive ? (
                  <Eye size={19} />
                ) : (
                  <EyeOff size={19} />
                )}
              </div>

              <div className="admin-hero-setting-content">
                <h3>
                  Hero Section Active
                </h3>

                <p>
                  When disabled, the
                  public portfolio should
                  not render this Hero
                  section.
                </p>
              </div>

              <button
                type="button"
                className={`admin-hero-toggle ${
                  form.isActive
                    ? "is-on"
                    : ""
                }`}
                onClick={
                  handleActiveToggle
                }
                aria-pressed={
                  form.isActive
                }
              >
                <span />
              </button>
            </div>
          </div>
        </section>

        {/* =================================================
            PREVIEW NOTE
            ================================================= */}

        <section className="admin-hero-preview-note">
          <div className="admin-hero-preview-note-icon">
            👀
          </div>

          <div>
            <h3>
              Public Hero Preview
            </h3>

            <p>
              The final public Hero
              preview will be connected
              after the Hero backend and
              public portfolio integration
              are completed.
            </p>
          </div>
        </section>

        {/* =================================================
            SAVE BAR
            ================================================= */}

        <div className="admin-hero-save-bar">
          <div>
            <span
              className={`admin-hero-save-state ${
                isDirty
                  ? "is-dirty"
                  : "is-clean"
              }`}
            >
              <span />
              {isDirty
                ? "Unsaved changes"
                : "All changes saved"}
            </span>
          </div>

          <div className="admin-hero-save-actions">
            <button
              type="button"
              className="admin-hero-button admin-hero-button-secondary"
              onClick={
                handleCancelChanges
              }
              disabled={
                !isDirty ||
                isSaving
              }
            >
              Discard
            </button>

            <button
              type="button"
              className="admin-hero-button admin-hero-button-primary"
              onClick={handleSave}
              disabled={
                !isDirty ||
                isSaving
              }
            >
              {isSaving ? (
                <>
                  <span className="admin-hero-button-spinner" />
                  Saving...
                </>
              ) : (
                <>
                  <Save size={18} />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

export default AdminHero;