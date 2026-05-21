import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import Navbar from "../components/Navbar";
import "./ChangePasswordPage.css";

function ChangePasswordPage() {
  const [currentPassword, setCurrentPassword]         = useState("");
  const [newPassword, setNewPassword]                 = useState("");
  const [confirmPassword, setConfirmPassword]         = useState("");
  const [currentPasswordError, setCurrentPasswordError] = useState("");
  const [confirmPasswordError, setConfirmPasswordError] = useState("");
  const [formError, setFormError]                     = useState("");
  const [successMessage, setSuccessMessage]           = useState("");
  const [loading, setLoading]                         = useState(false);
  const [showCurrent, setShowCurrent]                 = useState(false);
  const [showNew, setShowNew]                         = useState(false);
  const [showConfirm, setShowConfirm]                 = useState(false);
  const [lastChanged, setLastChanged] = useState(() => {
    try { return localStorage.getItem("passwordLastChanged"); }
    catch (_) { return null; }
  });

  useEffect(() => {
    try {
      const stored = localStorage.getItem("passwordLastChanged");
      if (stored) setLastChanged(stored);
    } catch (_) {}
  }, []);

  function formatRelativeDate(value) {
    if (!value) return "Not available";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "Not available";
    const diffDays = Math.max(Math.floor((Date.now() - date.getTime()) / 86400000), 0);
    if (diffDays === 0) return "Changed today";
    if (diffDays === 1) return "Changed 1 day ago";
    if (diffDays < 7)  return `Changed ${diffDays} days ago`;
    if (diffDays < 14) return "Changed 1 week ago";
    return `Changed ${Math.floor(diffDays / 7)} weeks ago`;
  }

  /* Password requirement checks */
  const hasMinLen  = newPassword.length >= 8;
  const hasUpper   = /[A-Z]/.test(newPassword);
  const hasLower   = /[a-z]/.test(newPassword);
  const hasDigit   = /[0-9]/.test(newPassword);
  const hasSpecial = /[^A-Za-z0-9]/.test(newPassword);
  const meetsRequirements = hasMinLen && hasUpper && hasLower && hasDigit && hasSpecial;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setCurrentPasswordError("");
    setConfirmPasswordError("");
    setFormError("");
    setSuccessMessage("");

    if (!currentPassword || !newPassword || !confirmPassword) {
      setFormError("Please fill in all password fields.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setConfirmPasswordError("New passwords do not match.");
      return;
    }
    if (!meetsRequirements) {
      setFormError("New password does not meet complexity requirements.");
      return;
    }

    setLoading(true);
    try {
      await api.patch("/profile/change-password", { currentPassword, newPassword });
      setSuccessMessage("Password updated successfully.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      try {
        const now = new Date().toISOString();
        localStorage.setItem("passwordLastChanged", now);
        setLastChanged(now);
      } catch (_) {}
    } catch (err) {
      const status  = err.response?.status;
      const message = err.response?.data?.message || err.message || "Unable to update password.";
      if (status === 401) {
        setCurrentPasswordError("Current password is incorrect.");
      } else {
        setFormError(message);
      }
    } finally {
      setLoading(false);
    }
  };

  const requirements = [
    { met: hasMinLen,  label: "At least 8 characters"  },
    { met: hasUpper,   label: "One uppercase letter"    },
    { met: hasLower,   label: "One lowercase letter"    },
    { met: hasDigit,   label: "One digit"               },
    { met: hasSpecial, label: "One special character"   },
  ];

  return (
    <div className="cp-page">
      <Navbar />

      <main className="cp-main">
        {/* Back link */}
        <Link to="/profile" className="cp-back">
          <span className="material-symbols-outlined">arrow_back</span>
          Back to Profile
        </Link>

        {/* Header */}
        <header className="cp-header">
          <h1 className="cp-header__title">Change Password</h1>
          <p className="cp-header__subtitle">
            Update your password to keep your GIU Nexus account secure.
          </p>
        </header>

        <div className="cp-layout">
          {/* ── Form card ── */}
          <div className="cp-card">
            <form onSubmit={handleSubmit}>

              {/* Current password */}
              <div className="cp-field">
                <label className="cp-label" htmlFor="cp-current">Current Password</label>
                <div className="cp-input-wrap">
                  <input
                    id="cp-current"
                    className="cp-input"
                    type={showCurrent ? "text" : "password"}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    className="cp-toggle-btn"
                    aria-label={showCurrent ? "Hide password" : "Show password"}
                    onClick={() => setShowCurrent((s) => !s)}
                  >
                    <span className="material-symbols-outlined">
                      {showCurrent ? "visibility_off" : "visibility"}
                    </span>
                  </button>
                </div>
                {currentPasswordError && (
                  <p className="cp-field-error">
                    <span className="material-symbols-outlined">error</span>
                    {currentPasswordError}
                  </p>
                )}
              </div>

              <div className="cp-divider" />

              {/* New password */}
              <div className="cp-field">
                <label className="cp-label" htmlFor="cp-new">New Password</label>
                <div className="cp-input-wrap">
                  <input
                    id="cp-new"
                    className="cp-input"
                    type={showNew ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                  />
                  <button
                    type="button"
                    className="cp-toggle-btn"
                    aria-label={showNew ? "Hide password" : "Show password"}
                    onClick={() => setShowNew((s) => !s)}
                  >
                    <span className="material-symbols-outlined">
                      {showNew ? "visibility_off" : "visibility"}
                    </span>
                  </button>
                </div>
              </div>

              {/* Confirm password */}
              <div className="cp-field">
                <label className="cp-label" htmlFor="cp-confirm">Confirm New Password</label>
                <div className="cp-input-wrap">
                  <input
                    id="cp-confirm"
                    className="cp-input"
                    type={showConfirm ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat new password"
                  />
                  <button
                    type="button"
                    className="cp-toggle-btn"
                    aria-label={showConfirm ? "Hide password" : "Show password"}
                    onClick={() => setShowConfirm((s) => !s)}
                  >
                    <span className="material-symbols-outlined">
                      {showConfirm ? "visibility_off" : "visibility"}
                    </span>
                  </button>
                </div>
                {confirmPasswordError && (
                  <p className="cp-field-error">
                    <span className="material-symbols-outlined">error</span>
                    {confirmPasswordError}
                  </p>
                )}
              </div>

              {/* Banners */}
              {formError    && <div className="cp-form-error">{formError}</div>}
              {successMessage && <div className="cp-form-success">{successMessage}</div>}

              {/* Actions */}
              <div className="cp-actions">
                <button type="submit" className="cp-btn-submit" disabled={loading}>
                  {loading ? "Updating…" : "Update Password"}
                </button>
                <Link to="/profile" className="cp-btn-cancel">Cancel</Link>
              </div>

            </form>
          </div>

          {/* ── Sidebar ── */}
          <div className="cp-sidebar">
            {/* Password requirements */}
            <div className="cp-sidebar-card">
              <div className="cp-sidebar-card__head">
                <div className="cp-sidebar-card__icon-wrap">
                  <span className="material-symbols-outlined">verified_user</span>
                </div>
                <div>
                  <p className="cp-sidebar-card__title">Password Requirements</p>
                  <p className="cp-sidebar-card__sub">Must satisfy all of the following</p>
                </div>
              </div>
              <ul className="cp-req-list">
                {requirements.map(({ met, label }) => (
                  <li key={label} className="cp-req-item">
                    <span className={`cp-req-check${met ? " met" : ""}`}>
                      {met ? "✓" : "•"}
                    </span>
                    {label}
                  </li>
                ))}
              </ul>
            </div>

            {/* Security overview */}
            <div className="cp-sidebar-card">
              <div className="cp-sidebar-card__head">
                <div className="cp-sidebar-card__icon-wrap">
                  <span className="material-symbols-outlined">shield</span>
                </div>
                <div>
                  <p className="cp-sidebar-card__title">Security Overview</p>
                  <p className="cp-sidebar-card__sub">Account status</p>
                </div>
              </div>
              <div className="cp-security-row">
                <span className="cp-security-label">Last changed</span>
                <span className="cp-security-value">{formatRelativeDate(lastChanged)}</span>
              </div>
              <div className="cp-security-row">
                <span className="cp-security-label">Two-factor auth</span>
                <span className="cp-security-value enabled">Enabled</span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default ChangePasswordPage;
