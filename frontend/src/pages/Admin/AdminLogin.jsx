import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import {
  ArrowRight,
  CheckCircle2,
  CircleAlert,
  Eye,
  EyeOff,
  Info,
  LockKeyhole,
  Mail,
  ShieldCheck,
  Sparkles,
  X,
} from "lucide-react";

import "./AdminLogin.css";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  "http://localhost:5000";

function AdminLogin() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [showPassword, setShowPassword] = useState(false);

  const [status, setStatus] = useState({
    type: "",
    message: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  /*
   * =========================================================
   * AUTO DISMISS TOAST
   * =========================================================
   *
   * Every temporary UI message disappears automatically.
   */

  useEffect(() => {
    if (!status.message) {
      return undefined;
    }

    /*
     * Loading message stays until the request finishes.
     */
    if (status.type === "loading") {
      return undefined;
    }

    const timer = setTimeout(() => {
      setStatus({
        type: "",
        message: "",
      });
    }, 5000);

    return () => clearTimeout(timer);
  }, [status.message, status.type]);

  /*
   * =========================================================
   * INPUT CHANGE
   * =========================================================
   */

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((currentData) => ({
      ...currentData,
      [name]: value,
    }));

    /*
     * Remove old toast when the user starts correcting
     * the form.
     */
    if (status.message && status.type !== "loading") {
      setStatus({
        type: "",
        message: "",
      });
    }
  };

  /*
   * =========================================================
   * CLOSE TOAST
   * =========================================================
   */

  const handleCloseToast = () => {
    setStatus({
      type: "",
      message: "",
    });
  };

  /*
   * =========================================================
   * VALIDATION
   * =========================================================
   */

  const validateForm = () => {
    const email = formData.email.trim();
    const password = formData.password;

    if (!email) {
      return {
        type: "warning",
        message: "Please enter your admin email address.",
      };
    }

    if (!email.includes("@")) {
      return {
        type: "warning",
        message: "Please enter a valid email address.",
      };
    }

    if (!password) {
      return {
        type: "warning",
        message: "Please enter your password.",
      };
    }

    return null;
  };

  /*
   * =========================================================
   * LOGIN REQUEST
   * =========================================================
   */

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    const validationResult = validateForm();

    if (validationResult) {
      setStatus(validationResult);
      return;
    }

    setIsSubmitting(true);

    setStatus({
      type: "loading",
      message:
        "Verifying your administrator credentials...",
    });

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/admin/login`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          credentials: "include",

          body: JSON.stringify({
            email: formData.email.trim(),
            password: formData.password,
          }),
        }
      );

      let data = {};

      try {
        data = await response.json();
      } catch {
        data = {};
      }

      /*
       * =====================================================
       * LOGIN FAILED
       * =====================================================
       */

      if (!response.ok) {
        const errorMessage =
          data?.message ||
          "Unable to sign in. Please check your credentials and try again.";

        setStatus({
          type:
            response.status === 429
              ? "warning"
              : "error",

          message: errorMessage,
        });

        return;
      }

      /*
       * =====================================================
       * LOGIN SUCCESS
       * =====================================================
       *
       * Backend has already created the HTTP-only
       * authentication cookie.
       */

      setStatus({
        type: "success",
        message:
          "Login successful! Opening your admin dashboard...",
      });

      /*
       * Give the success toast a moment to appear.
       */

      setTimeout(() => {
        navigate("/admin/dashboard", {
          replace: true,
        });
      }, 900);
    } catch (error) {
      console.error(
        "Admin login request failed:",
        error
      );

      setStatus({
        type: "error",
        message:
          "Unable to connect to the server. Please make sure the backend is running.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  /*
   * =========================================================
   * PASSWORD VISIBILITY
   * =========================================================
   */

  const handlePasswordToggle = () => {
    setShowPassword(
      (currentValue) => !currentValue
    );
  };

  /*
   * =========================================================
   * TOAST ICON
   * =========================================================
   */

  const renderToastIcon = () => {
    if (status.type === "success") {
      return (
        <CheckCircle2
          size={19}
          strokeWidth={2}
        />
      );
    }

    if (status.type === "warning") {
      return (
        <CircleAlert
          size={19}
          strokeWidth={2}
        />
      );
    }

    if (status.type === "loading") {
      return (
        <span
          className="admin-login-toast-spinner"
          aria-hidden="true"
        />
      );
    }

    if (status.type === "info") {
      return (
        <Info
          size={19}
          strokeWidth={2}
        />
      );
    }

    return (
      <CircleAlert
        size={19}
        strokeWidth={2}
      />
    );
  };

  return (
    <div className="admin-login-page">
      {/* =====================================================
          BACKGROUND
          ===================================================== */}

      <div
        className="admin-login-background"
        aria-hidden="true"
      >
        <div className="admin-login-grid" />

        <div className="admin-login-glow admin-login-glow-one" />

        <div className="admin-login-glow admin-login-glow-two" />

        <div className="admin-login-orbit admin-login-orbit-one" />

        <div className="admin-login-orbit admin-login-orbit-two" />
      </div>

      {/* =====================================================
          GLOBAL RIGHT-SIDE TOAST
          ===================================================== */}

      {status.message && (
        <div
          className={`admin-login-toast admin-login-toast-${status.type}`}
          role="status"
          aria-live="polite"
        >
          <div className="admin-login-toast-icon">
            {renderToastIcon()}
          </div>

          <div className="admin-login-toast-content">
            <strong>
              {status.type === "success" && "Success"}
              {status.type === "error" && "Sign in failed"}
              {status.type === "warning" && "Please check"}
              {status.type === "loading" && "Signing in"}
              {status.type === "info" && "Information"}
            </strong>

            <p>{status.message}</p>
          </div>

          {status.type !== "loading" && (
            <button
              type="button"
              className="admin-login-toast-close"
              onClick={handleCloseToast}
              aria-label="Close notification"
              title="Close"
            >
              <X
                size={16}
                strokeWidth={2}
              />
            </button>
          )}
        </div>
      )}

      {/* =====================================================
          MAIN CONTENT
          ===================================================== */}

      <main className="admin-login-main">
        <section
          className="admin-login-card"
          aria-labelledby="admin-login-title"
        >
          {/* =================================================
              BRAND / SECURITY HEADER
              ================================================= */}

          <div className="admin-login-header">
            <div className="admin-login-brand-mark">
              <ShieldCheck
                size={23}
                strokeWidth={1.9}
              />
            </div>

            <div className="admin-login-header-copy">
              <span className="admin-login-eyebrow">
                Private workspace
              </span>

              <span className="admin-login-secure">
                <span className="admin-login-secure-dot" />
                Secure access
              </span>
            </div>
          </div>

          {/* =================================================
              TITLE
              ================================================= */}

          <div className="admin-login-heading">
            <div className="admin-login-spark">
              <Sparkles
                size={16}
                strokeWidth={1.8}
              />
            </div>

            <p className="admin-login-kicker">
              Welcome back
            </p>

            <h1 id="admin-login-title">
              Admin Login
            </h1>

            <p className="admin-login-description">
              Sign in to manage your personal career
              portfolio, projects, experience and
              professional information.
            </p>
          </div>

          {/* =================================================
              LOGIN FORM
              ================================================= */}

          <form
            className="admin-login-form"
            onSubmit={handleSubmit}
            noValidate
          >
            {/* =================================================
                EMAIL
                ================================================= */}

            <div className="admin-login-field">
              <label htmlFor="admin-email">
                Email address
              </label>

              <div className="admin-login-input-wrapper">
                <Mail
                  className="admin-login-input-icon"
                  size={18}
                  strokeWidth={1.8}
                  aria-hidden="true"
                />

                <input
                  id="admin-email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Enter your admin email"
                  autoComplete="username"
                  disabled={isSubmitting}
                  spellCheck="false"
                />
              </div>
            </div>

            {/* =================================================
                PASSWORD
                ================================================= */}

            <div className="admin-login-field">
              <div className="admin-login-label-row">
                <label htmlFor="admin-password">
                  Password
                </label>

                <button
                  type="button"
                  className="admin-login-forgot-button"
                  onClick={() =>
                    navigate(
                      "/admin/forgot-password"
                    )
                  }
                  disabled={isSubmitting}
                >
                  Forgot password?
                </button>
              </div>

              <div className="admin-login-input-wrapper">
                <LockKeyhole
                  className="admin-login-input-icon"
                  size={18}
                  strokeWidth={1.8}
                  aria-hidden="true"
                />

                <input
                  id="admin-password"
                  name="password"
                  type={
                    showPassword
                      ? "text"
                      : "password"
                  }
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  disabled={isSubmitting}
                />

                <button
                  type="button"
                  className="admin-login-password-toggle"
                  onClick={handlePasswordToggle}
                  aria-label={
                    showPassword
                      ? "Hide password"
                      : "Show password"
                  }
                  title={
                    showPassword
                      ? "Hide password"
                      : "Show password"
                  }
                  disabled={isSubmitting}
                >
                  {showPassword ? (
                    <EyeOff
                      size={18}
                      strokeWidth={1.8}
                    />
                  ) : (
                    <Eye
                      size={18}
                      strokeWidth={1.8}
                    />
                  )}
                </button>
              </div>
            </div>

            {/* =================================================
                SUBMIT
                ================================================= */}

            <button
              type="submit"
              className="admin-login-submit"
              disabled={isSubmitting}
            >
              <span>
                {isSubmitting
                  ? "Signing in..."
                  : "Sign in to dashboard"}
              </span>

              {isSubmitting ? (
                <span
                  className="admin-login-spinner"
                  aria-hidden="true"
                />
              ) : (
                <ArrowRight
                  size={18}
                  strokeWidth={2}
                />
              )}
            </button>
          </form>

          {/* =================================================
              SECURITY NOTE
              ================================================= */}

          <div className="admin-login-security-note">
            <LockKeyhole
              size={15}
              strokeWidth={1.8}
            />

            <p>
              Your administrator session is protected
              by secure authentication.
            </p>
          </div>

          {/* =================================================
              BACK TO PORTFOLIO
              ================================================= */}

          <button
            type="button"
            className="admin-login-back-button"
            onClick={() => navigate("/")}
            disabled={isSubmitting}
          >
            <span aria-hidden="true">←</span>
            <span>Back to portfolio</span>
          </button>
        </section>
      </main>
    </div>
  );
}

export default AdminLogin;