import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  CircleAlert,
  Eye,
  EyeOff,
  Info,
  KeyRound,
  LockKeyhole,
  Mail,
  RefreshCw,
  ShieldCheck,
  X,
} from "lucide-react";

import "./ForgotPassword.css";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  "http://localhost:5000";

const OTP_LENGTH = 6;
const RESEND_COOLDOWN_SECONDS = 60;

function ForgotPassword() {
  const navigate = useNavigate();

  /*
   * =========================================================
   * RESET STAGES
   * =========================================================
   *
   * email  → Enter admin email
   * otp    → Verify OTP
   * reset  → Create new password
   */

  const [stage, setStage] = useState("email");

  /*
   * =========================================================
   * FORM STATE
   * =========================================================
   */

  const [email, setEmail] = useState("");

  const [otp, setOtp] = useState(
    Array(OTP_LENGTH).fill("")
  );

  const [newPassword, setNewPassword] =
    useState("");

  const [confirmPassword, setConfirmPassword] =
    useState("");

  /*
   * =========================================================
   * UI STATE
   * =========================================================
   */

  const [showNewPassword, setShowNewPassword] =
    useState(false);

  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);

  const [isSubmitting, setIsSubmitting] =
    useState(false);

  const [resendSeconds, setResendSeconds] =
    useState(0);

  const [status, setStatus] = useState({
    type: "",
    message: "",
  });

  const otpInputRefs = useRef([]);

  /*
   * =========================================================
   * TOAST AUTO DISMISS
   * =========================================================
   */

  useEffect(() => {
    if (!status.message) {
      return undefined;
    }

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
   * RESEND COUNTDOWN
   * =========================================================
   */

  useEffect(() => {
    if (resendSeconds <= 0) {
      return undefined;
    }

    const timer = setInterval(() => {
      setResendSeconds((currentValue) =>
        Math.max(0, currentValue - 1)
      );
    }, 1000);

    return () => clearInterval(timer);
  }, [resendSeconds]);

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
   * EMAIL NORMALIZATION
   * =========================================================
   */

  const normalizedEmail = useMemo(
    () => email.trim().toLowerCase(),
    [email]
  );

  /*
   * =========================================================
   * EMAIL VALIDATION
   * =========================================================
   */

  const validateEmail = () => {
    if (!normalizedEmail) {
      return {
        type: "warning",
        message:
          "📧 Please enter your admin email address.",
      };
    }

    const emailPattern =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailPattern.test(normalizedEmail)) {
      return {
        type: "warning",
        message:
          "📧 Please enter a valid email address.",
      };
    }

    return null;
  };

  /*
   * =========================================================
   * OTP VALIDATION
   * =========================================================
   */

  const getOtpValue = () =>
    otp.join("");

  const validateOtp = () => {
    const otpValue = getOtpValue();

    if (!otpValue) {
      return {
        type: "warning",
        message:
          "🔢 Please enter the 6-digit OTP sent to your email.",
      };
    }

    if (!/^\d{6}$/.test(otpValue)) {
      return {
        type: "warning",
        message:
          "🔢 Please enter the complete 6-digit OTP.",
      };
    }

    return null;
  };

  /*
   * =========================================================
   * PASSWORD VALIDATION
   * =========================================================
   */

  const validateNewPassword = () => {
    if (!newPassword) {
      return {
        type: "warning",
        message:
          "🔐 Please enter your new password.",
      };
    }

    if (newPassword.length < 8) {
      return {
        type: "warning",
        message:
          "🔐 Password must contain at least 8 characters.",
      };
    }

    if (!confirmPassword) {
      return {
        type: "warning",
        message:
          "🔐 Please confirm your new password.",
      };
    }

    if (newPassword !== confirmPassword) {
      return {
        type: "warning",
        message:
          "🔐 New password and confirm password do not match.",
      };
    }

    return null;
  };

  /*
   * =========================================================
   * SEND OTP
   * =========================================================
   */

  const handleSendOtp = async (event) => {
    event?.preventDefault();

    if (isSubmitting) {
      return;
    }

    const validationResult =
      validateEmail();

    if (validationResult) {
      setStatus(validationResult);
      return;
    }

    setIsSubmitting(true);

    setStatus({
      type: "loading",
      message:
        "Sending a secure password reset OTP...",
    });

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/admin/forgot-password`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          credentials: "include",

          body: JSON.stringify({
            email: normalizedEmail,
          }),
        }
      );

      let data = {};

      try {
        data = await response.json();
      } catch {
        data = {};
      }

      if (!response.ok) {
        setStatus({
          type:
            response.status === 429
              ? "warning"
              : "error",

          message:
            data?.message ||
            "Unable to send the OTP. Please try again.",
        });

        return;
      }

      /*
       * Move to OTP stage only after successful
       * backend response.
       */

      setOtp(
        Array(OTP_LENGTH).fill("")
      );

      setResendSeconds(
        RESEND_COOLDOWN_SECONDS
      );

      setStage("otp");

      setStatus({
        type: "success",
        message:
          data?.message ||
          "📧 OTP sent successfully to your registered admin email.",
      });

      /*
       * Focus first OTP input after the UI changes.
       */

      setTimeout(() => {
        otpInputRefs.current[0]?.focus();
      }, 120);
    } catch (error) {
      console.error(
        "Send password reset OTP request failed:",
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
   * OTP INPUT CHANGE
   * =========================================================
   */

  const handleOtpChange = (
    index,
    value
  ) => {
    if (isSubmitting) {
      return;
    }

    /*
     * Keep digits only.
     */

    const digitsOnly =
      value.replace(/\D/g, "");

    /*
     * If user pastes multiple digits into one
     * box, distribute them across all boxes.
     */

    if (digitsOnly.length > 1) {
      const pastedDigits =
        digitsOnly.slice(0, OTP_LENGTH);

      const nextOtp = Array(
        OTP_LENGTH
      ).fill("");

      pastedDigits
        .split("")
        .forEach(
          (digit, digitIndex) => {
            nextOtp[digitIndex] = digit;
          }
        );

      setOtp(nextOtp);

      const nextFocusIndex = Math.min(
        pastedDigits.length,
        OTP_LENGTH - 1
      );

      setTimeout(() => {
        otpInputRefs.current[
          nextFocusIndex
        ]?.focus();
      }, 0);

      return;
    }

    const nextOtp = [...otp];

    nextOtp[index] =
      digitsOnly.slice(-1);

    setOtp(nextOtp);

    /*
     * Automatically move forward after entering
     * a digit.
     */

    if (
      digitsOnly &&
      index < OTP_LENGTH - 1
    ) {
      otpInputRefs.current[
        index + 1
      ]?.focus();
    }
  };

  /*
   * =========================================================
   * OTP KEYBOARD NAVIGATION
   * =========================================================
   */

  const handleOtpKeyDown = (
    event,
    index
  ) => {
    if (isSubmitting) {
      return;
    }

    if (
      event.key === "Backspace" &&
      !otp[index] &&
      index > 0
    ) {
      otpInputRefs.current[
        index - 1
      ]?.focus();
    }

    if (
      event.key === "ArrowLeft" &&
      index > 0
    ) {
      event.preventDefault();

      otpInputRefs.current[
        index - 1
      ]?.focus();
    }

    if (
      event.key === "ArrowRight" &&
      index < OTP_LENGTH - 1
    ) {
      event.preventDefault();

      otpInputRefs.current[
        index + 1
      ]?.focus();
    }
  };

  /*
   * =========================================================
   * OTP VERIFY
   * =========================================================
   */

  const handleVerifyOtp = async (
    event
  ) => {
    event?.preventDefault();

    if (isSubmitting) {
      return;
    }

    const validationResult =
      validateOtp();

    if (validationResult) {
      setStatus(validationResult);
      return;
    }

    setIsSubmitting(true);

    setStatus({
      type: "loading",
      message:
        "Verifying your secure OTP...",
    });

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/admin/verify-otp`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          credentials: "include",

          body: JSON.stringify({
            email: normalizedEmail,
            otp: getOtpValue(),
          }),
        }
      );

      let data = {};

      try {
        data = await response.json();
      } catch {
        data = {};
      }

      if (!response.ok) {
        setStatus({
          type:
            response.status === 429
              ? "warning"
              : "error",

          message:
            data?.message ||
            "Unable to verify the OTP. Please try again.",
        });

        return;
      }

      /*
       * OTP verified successfully.
       */

      setStage("reset");

      setStatus({
        type: "success",
        message:
          data?.message ||
          "✅ OTP verified successfully. You can now create a new password.",
      });
    } catch (error) {
      console.error(
        "Verify password reset OTP request failed:",
        error
      );

      setStatus({
        type: "error",
        message:
          "Unable to connect to the server. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  /*
   * =========================================================
   * RESEND OTP
   * =========================================================
   */

  const handleResendOtp = async () => {
    if (
      isSubmitting ||
      resendSeconds > 0
    ) {
      return;
    }

    await handleSendOtp();
  };

  /*
   * =========================================================
   * RESET PASSWORD
   * =========================================================
   */

  const handleResetPassword = async (
    event
  ) => {
    event?.preventDefault();

    if (isSubmitting) {
      return;
    }

    const validationResult =
      validateNewPassword();

    if (validationResult) {
      setStatus(validationResult);
      return;
    }

    setIsSubmitting(true);

    setStatus({
      type: "loading",
      message:
        "Updating your admin password securely...",
    });

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/admin/reset-password`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          credentials: "include",

          body: JSON.stringify({
            email: normalizedEmail,
            newPassword,
            confirmPassword,
          }),
        }
      );

      let data = {};

      try {
        data = await response.json();
      } catch {
        data = {};
      }

      if (!response.ok) {
        setStatus({
          type:
            response.status === 429
              ? "warning"
              : "error",

          message:
            data?.message ||
            "Unable to reset your password. Please try again.",
        });

        return;
      }

      /*
       * Password successfully changed.
       */

      setStatus({
        type: "success",
        message:
          data?.message ||
          "🎉 Password reset successful! Please sign in using your new password.",
      });

      /*
       * Clear sensitive frontend state.
       */

      setOtp(
        Array(OTP_LENGTH).fill("")
      );

      setNewPassword("");
      setConfirmPassword("");
      setResendSeconds(0);

      /*
       * Give the success toast enough time to be seen.
       * Then return to login.
       */

      setTimeout(() => {
        navigate(
          "/admin/login?reset=success",
          {
            replace: true,
          }
        );
      }, 1400);
    } catch (error) {
      console.error(
        "Reset admin password request failed:",
        error
      );

      setStatus({
        type: "error",
        message:
          "Unable to connect to the server. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  /*
   * =========================================================
   * BACK BUTTON
   * =========================================================
   */

  const handleBack = () => {
    if (isSubmitting) {
      return;
    }

    /*
     * OTP → Email
     * Reset → OTP
     * Email → Login
     */

    if (stage === "otp") {
      setStage("email");

      setOtp(
        Array(OTP_LENGTH).fill("")
      );

      setResendSeconds(0);

      setStatus({
        type: "info",
        message:
          "🔔 You can update your admin email address.",
      });

      return;
    }

    if (stage === "reset") {
      setStage("otp");

      setStatus({
        type: "info",
        message:
          "🔔 Please enter the OTP sent to your email.",
      });

      setTimeout(() => {
        const firstEmptyIndex =
          otp.findIndex(
            (value) => !value
          );

        otpInputRefs.current[
          firstEmptyIndex >= 0
            ? firstEmptyIndex
            : OTP_LENGTH - 1
        ]?.focus();
      }, 100);

      return;
    }

    navigate("/admin/login");
  };

  /*
   * =========================================================
   * PASSWORD TOGGLE
   * =========================================================
   */

  const toggleNewPassword = () => {
    setShowNewPassword(
      (currentValue) =>
        !currentValue
    );
  };

  const toggleConfirmPassword = () => {
    setShowConfirmPassword(
      (currentValue) =>
        !currentValue
    );
  };

  /*
   * =========================================================
   * PASSWORD STRENGTH
   * =========================================================
   */

  const passwordStrength = useMemo(() => {
    if (!newPassword) {
      return {
        label: "Enter a new password",
        level: 0,
      };
    }

    let score = 0;

    if (newPassword.length >= 8) {
      score += 1;
    }

    if (/[A-Z]/.test(newPassword)) {
      score += 1;
    }

    if (/[a-z]/.test(newPassword)) {
      score += 1;
    }

    if (/\d/.test(newPassword)) {
      score += 1;
    }

    if (
      /[^A-Za-z0-9]/.test(
        newPassword
      )
    ) {
      score += 1;
    }

    if (score <= 2) {
      return {
        label: "Weak password",
        level: 1,
      };
    }

    if (score <= 3) {
      return {
        label: "Fair password",
        level: 2,
      };
    }

    if (score <= 4) {
      return {
        label: "Good password",
        level: 3,
      };
    }

    return {
      label: "Strong password",
      level: 4,
    };
  }, [newPassword]);

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
          className="forgot-password-toast-spinner"
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

  /*
   * =========================================================
   * STAGE CONTENT
   * =========================================================
   */

  const stageData = {
    email: {
      step: "01",
      kicker: "Account recovery",
      title: "Forgot password?",
      description:
        "Enter your registered administrator email and we’ll send you a secure one-time verification code.",
    },

    otp: {
      step: "02",
      kicker: "Verify identity",
      title: "Enter your OTP",
      description:
        "We sent a 6-digit verification code to your registered admin email. Enter it below to continue.",
    },

    reset: {
      step: "03",
      kicker: "Create new password",
      title: "Secure your account",
      description:
        "Your identity has been verified. Create a new password for your administrator account.",
    },
  }[stage];

  return (
    <div className="forgot-password-page">
      {/* =====================================================
          BACKGROUND
          ===================================================== */}

      <div
        className="forgot-password-background"
        aria-hidden="true"
      >
        <div className="forgot-password-grid" />

        <div className="forgot-password-glow forgot-password-glow-one" />

        <div className="forgot-password-glow forgot-password-glow-two" />

        <div className="forgot-password-orbit forgot-password-orbit-one" />

        <div className="forgot-password-orbit forgot-password-orbit-two" />
      </div>

      {/* =====================================================
          TOAST
          ===================================================== */}

      {status.message && (
        <div
          className={`forgot-password-toast forgot-password-toast-${status.type}`}
          role="status"
          aria-live="polite"
        >
          <div className="forgot-password-toast-icon">
            {renderToastIcon()}
          </div>

          <div className="forgot-password-toast-content">
            <strong>
              {status.type === "success" &&
                "Success"}

              {status.type === "error" &&
                "Something went wrong"}

              {status.type === "warning" &&
                "Please check"}

              {status.type === "loading" &&
                "Working securely"}

              {status.type === "info" &&
                "Information"}
            </strong>

            <p>{status.message}</p>
          </div>

          {status.type !== "loading" && (
            <button
              type="button"
              className="forgot-password-toast-close"
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
          MAIN
          ===================================================== */}

      <main className="forgot-password-main">
        <section
          className="forgot-password-card"
          aria-labelledby="forgot-password-title"
        >
          {/* =================================================
              TOP HEADER
              ================================================= */}

          <div className="forgot-password-header">
            <button
              type="button"
              className="forgot-password-back-button"
              onClick={handleBack}
              disabled={isSubmitting}
              aria-label="Go back"
              title="Go back"
            >
              <ArrowLeft
                size={17}
                strokeWidth={1.9}
              />
            </button>

            <div className="forgot-password-brand-mark">
              <ShieldCheck
                size={22}
                strokeWidth={1.9}
              />
            </div>

            <div className="forgot-password-header-copy">
              <span className="forgot-password-eyebrow">
                Private workspace
              </span>

              <span className="forgot-password-secure">
                <span className="forgot-password-secure-dot" />
                Secure recovery
              </span>
            </div>
          </div>

          {/* =================================================
              PROGRESS
              ================================================= */}

          <div
            className="forgot-password-progress"
            aria-label={`Password recovery step ${stageData.step} of 03`}
          >
            {["email", "otp", "reset"].map(
              (item, index) => {
                const itemNumber =
                  String(index + 1).padStart(
                    2,
                    "0"
                  );

                const isActive =
                  stage === item;

                const isCompleted =
                  (stage === "otp" &&
                    item === "email") ||
                  (stage === "reset" &&
                    (item === "email" ||
                      item === "otp"));

                return (
                  <div
                    className="forgot-password-progress-item"
                    key={item}
                  >
                    <span
                      className={`forgot-password-progress-dot ${
                        isActive
                          ? "is-active"
                          : ""
                      } ${
                        isCompleted
                          ? "is-completed"
                          : ""
                      }`}
                    >
                      {isCompleted ? (
                        <CheckCircle2
                          size={13}
                          strokeWidth={2.2}
                        />
                      ) : (
                        itemNumber
                      )}
                    </span>

                    {index < 2 && (
                      <span
                        className={`forgot-password-progress-line ${
                          isCompleted
                            ? "is-completed"
                            : ""
                        }`}
                      />
                    )}
                  </div>
                );
              }
            )}
          </div>

          {/* =================================================
              HEADING
              ================================================= */}

          <div className="forgot-password-heading">
            <div className="forgot-password-spark">
              {stage === "email" && (
                <Mail
                  size={17}
                  strokeWidth={1.8}
                />
              )}

              {stage === "otp" && (
                <KeyRound
                  size={17}
                  strokeWidth={1.8}
                />
              )}

              {stage === "reset" && (
                <LockKeyhole
                  size={17}
                  strokeWidth={1.8}
                />
              )}
            </div>

            <p className="forgot-password-kicker">
              {stageData.kicker}
            </p>

            <h1 id="forgot-password-title">
              {stageData.title}
            </h1>

            <p className="forgot-password-description">
              {stageData.description}
            </p>
          </div>

          {/* =================================================
              EMAIL STAGE
              ================================================= */}

          {stage === "email" && (
            <form
              className="forgot-password-form"
              onSubmit={handleSendOtp}
              noValidate
            >
              <div className="forgot-password-field">
                <label htmlFor="forgot-email">
                  Admin email address
                </label>

                <div className="forgot-password-input-wrapper">
                  <Mail
                    className="forgot-password-input-icon"
                    size={18}
                    strokeWidth={1.8}
                    aria-hidden="true"
                  />

                  <input
                    id="forgot-email"
                    type="email"
                    value={email}
                    onChange={(event) =>
                      setEmail(
                        event.target.value
                      )
                    }
                    placeholder="Enter your registered admin email"
                    autoComplete="username"
                    autoFocus
                    disabled={isSubmitting}
                    spellCheck="false"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="forgot-password-submit"
                disabled={isSubmitting}
              >
                <span>
                  {isSubmitting
                    ? "Sending OTP..."
                    : "Send secure OTP"}
                </span>

                {isSubmitting ? (
                  <span
                    className="forgot-password-spinner"
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
          )}

          {/* =================================================
              OTP STAGE
              ================================================= */}

          {stage === "otp" && (
            <form
              className="forgot-password-form"
              onSubmit={handleVerifyOtp}
              noValidate
            >
              <div className="forgot-password-email-preview">
                <Mail
                  size={15}
                  strokeWidth={1.8}
                />

                <span>
                  {normalizedEmail}
                </span>
              </div>

              <div className="forgot-password-field">
                <div className="forgot-password-label-row">
                  <label htmlFor="otp-0">
                    Verification code
                  </label>

                  <span className="forgot-password-otp-count">
                    {getOtpValue().length}/6
                  </span>
                </div>

                <div
                  className="forgot-password-otp-group"
                  role="group"
                  aria-label="6 digit verification code"
                >
                  {otp.map(
                    (value, index) => (
                      <input
                        key={index}
                        ref={(element) => {
                          otpInputRefs.current[
                            index
                          ] = element;
                        }}
                        id={`otp-${index}`}
                        className={`forgot-password-otp-input ${
                          value
                            ? "has-value"
                            : ""
                        }`}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={value}
                        onChange={(event) =>
                          handleOtpChange(
                            index,
                            event.target.value
                          )
                        }
                        onKeyDown={(event) =>
                          handleOtpKeyDown(
                            event,
                            index
                          )
                        }
                        onPaste={(event) => {
                          event.preventDefault();

                          const pasted =
                            event.clipboardData
                              .getData(
                                "text"
                              );

                          handleOtpChange(
                            index,
                            pasted
                          );
                        }}
                        autoComplete={
                          index === 0
                            ? "one-time-code"
                            : "off"
                        }
                        disabled={
                          isSubmitting
                        }
                        aria-label={`OTP digit ${
                          index + 1
                        }`}
                      />
                    )
                  )}
                </div>
              </div>

              <div className="forgot-password-resend-row">
                <span>
                  Didn’t receive the code?
                </span>

                <button
                  type="button"
                  className="forgot-password-resend-button"
                  onClick={handleResendOtp}
                  disabled={
                    isSubmitting ||
                    resendSeconds > 0
                  }
                >
                  <RefreshCw
                    size={14}
                    strokeWidth={1.9}
                  />

                  {resendSeconds > 0
                    ? `Resend in ${resendSeconds}s`
                    : "Resend OTP"}
                </button>
              </div>

              <button
                type="submit"
                className="forgot-password-submit"
                disabled={isSubmitting}
              >
                <span>
                  {isSubmitting
                    ? "Verifying OTP..."
                    : "Verify OTP"}
                </span>

                {isSubmitting ? (
                  <span
                    className="forgot-password-spinner"
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
          )}

          {/* =================================================
              RESET PASSWORD STAGE
              ================================================= */}

          {stage === "reset" && (
            <form
              className="forgot-password-form"
              onSubmit={
                handleResetPassword
              }
              noValidate
            >
              <div className="forgot-password-field">
                <label htmlFor="new-password">
                  New password
                </label>

                <div className="forgot-password-input-wrapper">
                  <LockKeyhole
                    className="forgot-password-input-icon"
                    size={18}
                    strokeWidth={1.8}
                    aria-hidden="true"
                  />

                  <input
                    id="new-password"
                    type={
                      showNewPassword
                        ? "text"
                        : "password"
                    }
                    value={newPassword}
                    onChange={(event) =>
                      setNewPassword(
                        event.target.value
                      )
                    }
                    placeholder="Create a new password"
                    autoComplete="new-password"
                    autoFocus
                    disabled={isSubmitting}
                  />

                  <button
                    type="button"
                    className="forgot-password-password-toggle"
                    onClick={
                      toggleNewPassword
                    }
                    disabled={isSubmitting}
                    aria-label={
                      showNewPassword
                        ? "Hide new password"
                        : "Show new password"
                    }
                    title={
                      showNewPassword
                        ? "Hide password"
                        : "Show password"
                    }
                  >
                    {showNewPassword ? (
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

                <div className="forgot-password-strength">
                  <div className="forgot-password-strength-bars">
                    {[1, 2, 3, 4].map(
                      (level) => (
                        <span
                          key={level}
                          className={
                            level <=
                            passwordStrength.level
                              ? "is-filled"
                              : ""
                          }
                        />
                      )
                    )}
                  </div>

                  <span>
                    {
                      passwordStrength.label
                    }
                  </span>
                </div>
              </div>

              <div className="forgot-password-field">
                <label htmlFor="confirm-password">
                  Confirm new password
                </label>

                <div className="forgot-password-input-wrapper">
                  <LockKeyhole
                    className="forgot-password-input-icon"
                    size={18}
                    strokeWidth={1.8}
                    aria-hidden="true"
                  />

                  <input
                    id="confirm-password"
                    type={
                      showConfirmPassword
                        ? "text"
                        : "password"
                    }
                    value={
                      confirmPassword
                    }
                    onChange={(event) =>
                      setConfirmPassword(
                        event.target.value
                      )
                    }
                    placeholder="Confirm your new password"
                    autoComplete="new-password"
                    disabled={isSubmitting}
                  />

                  <button
                    type="button"
                    className="forgot-password-password-toggle"
                    onClick={
                      toggleConfirmPassword
                    }
                    disabled={isSubmitting}
                    aria-label={
                      showConfirmPassword
                        ? "Hide confirm password"
                        : "Show confirm password"
                    }
                    title={
                      showConfirmPassword
                        ? "Hide password"
                        : "Show password"
                    }
                  >
                    {showConfirmPassword ? (
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

              <button
                type="submit"
                className="forgot-password-submit"
                disabled={isSubmitting}
              >
                <span>
                  {isSubmitting
                    ? "Updating password..."
                    : "Create new password"}
                </span>

                {isSubmitting ? (
                  <span
                    className="forgot-password-spinner"
                    aria-hidden="true"
                  />
                ) : (
                  <CheckCircle2
                    size={18}
                    strokeWidth={2}
                  />
                )}
              </button>
            </form>
          )}

          {/* =================================================
              SECURITY NOTE
              ================================================= */}

          <div className="forgot-password-security-note">
            <ShieldCheck
              size={15}
              strokeWidth={1.8}
            />

            <p>
              Your verification code is temporary,
              securely handled and cannot be reused
              after successful verification.
            </p>
          </div>

          {/* =================================================
              FOOTER
              ================================================= */}

          <div className="forgot-password-footer">
            <button
              type="button"
              className="forgot-password-login-link"
              onClick={() =>
                navigate(
                  "/admin/login"
                )
              }
              disabled={isSubmitting}
            >
              <ArrowLeft
                size={14}
                strokeWidth={1.9}
              />

              <span>
                Back to Admin Login
              </span>
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}

export default ForgotPassword;