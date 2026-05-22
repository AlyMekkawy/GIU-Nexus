import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { gsap } from "gsap";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import "./ResetPasswordPage.css";

function ResetPasswordPage() {
  const { token } = useParams();
  const navigate  = useNavigate();
  const { login } = useAuth();
  const cardRef   = useRef(null);

  const [password, setPassword]               = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword]       = useState(false);
  const [showConfirm, setShowConfirm]         = useState(false);
  const [error, setError]                     = useState("");
  const [success, setSuccess]                 = useState(false);
  const [loading, setLoading]                 = useState(false);

  /* Card entrance */
  useEffect(() => {
    gsap.fromTo(
      cardRef.current,
      { y: 28, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.55, ease: "power3.out" }
    );
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!password || !confirmPassword) {
      setError("Please enter and confirm your new password.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (!token) {
      setError("Reset token is missing or invalid.");
      return;
    }

    setLoading(true);
    try {
      const response = await api.patch(`/auth/reset-password/${token}`, { password });
      const { token: newToken, user } = response.data;
      login(newToken, user);
      setSuccess(true);
      window.setTimeout(() => navigate("/"), 1200);
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Unable to reset password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rp-page">
      <div className="rp-card" ref={cardRef}>

        {success ? (
          /* ── Success state ── */
          <div className="rp-success">
            <div className="rp-success__icon">
              <span
                className="material-symbols-outlined"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                check_circle
              </span>
            </div>
            <h2 className="rp-success__title">Password reset successfully</h2>
            <p className="rp-success__body">
              Your account security has been updated. Redirecting you to your dashboard…
            </p>
            <div className="rp-progress-bar">
              <div className="rp-progress-fill" />
            </div>
          </div>
        ) : (
          /* ── Form state ── */
          <>
            {/* Icon */}
            <div className="rp-icon-wrap" aria-hidden="true">
              <span className="material-symbols-outlined">lock_reset</span>
            </div>

            {/* Header */}
            <div className="rp-header">
              <h1 className="rp-title">Create a new password</h1>
              <p className="rp-subtitle">
                Enter your new credentials below to regain access to your GIU Nexus account.
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit}>
              {/* New password */}
              <div className="rp-field">
                <label className="rp-label" htmlFor="rp-password">New Password</label>
                <div className="rp-input-wrap">
                  <input
                    id="rp-password"
                    className="rp-input"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min. 8 characters"
                  />
                  <button
                    type="button"
                    className="rp-eye"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    onClick={() => setShowPassword((s) => !s)}
                  >
                    <span className="material-symbols-outlined">
                      {showPassword ? "visibility_off" : "visibility"}
                    </span>
                  </button>
                </div>
              </div>

              {/* Confirm password */}
              <div className="rp-field">
                <label className="rp-label" htmlFor="rp-confirm">Confirm New Password</label>
                <div className="rp-input-wrap">
                  <input
                    id="rp-confirm"
                    className="rp-input"
                    type={showConfirm ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat password"
                  />
                  <button
                    type="button"
                    className="rp-eye"
                    aria-label={showConfirm ? "Hide confirm password" : "Show confirm password"}
                    onClick={() => setShowConfirm((s) => !s)}
                  >
                    <span className="material-symbols-outlined">
                      {showConfirm ? "visibility_off" : "visibility"}
                    </span>
                  </button>
                </div>
              </div>

              {error && <p className="rp-error">{error}</p>}

              <button className="rp-btn" type="submit" disabled={loading}>
                {loading ? "Resetting…" : "Reset Password"}
              </button>
            </form>

            {/* Back link */}
            <div className="rp-back-row">
              <Link to="/login" className="rp-back-link">
                <span className="material-symbols-outlined">arrow_back</span>
                Back to login
              </Link>
            </div>
          </>
        )}

      </div>
    </div>
  );
}

export default ResetPasswordPage;
