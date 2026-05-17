import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";

function ChangePasswordPage() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [currentPasswordError, setCurrentPasswordError] = useState("");
  const [confirmPasswordError, setConfirmPasswordError] = useState("");
  const [formError, setFormError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [lastChanged, setLastChanged] = useState(() => {
    try {
      return localStorage.getItem("passwordLastChanged");
    } catch (_) { return null }
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
    if (diffDays < 7) return `Changed ${diffDays} days ago`;
    if (diffDays < 14) return "Changed 1 week ago";
    return `Changed ${Math.floor(diffDays / 7)} weeks ago`;
  }

  // Front-end password requirement checks (mirror server rules)
  const hasMinLen = newPassword.length >= 8;
  const hasUpper = /[A-Z]/.test(newPassword);
  const hasLower = /[a-z]/.test(newPassword);
  const hasDigit = /[0-9]/.test(newPassword);
  const hasSpecial = /[^A-Za-z0-9]/.test(newPassword);
  const meetsRequirements = hasMinLen && hasUpper && hasLower && hasDigit && hasSpecial;

  const handleSubmit = async (event) => {
    event.preventDefault();
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
      await api.patch("/profile/change-password", {
        currentPassword,
        newPassword,
      });

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
      const status = err.response?.status;
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

  return (
    <main className="min-h-screen bg-canvas-parchment flex flex-col font-body">
      <div className="flex-grow pt-24 pb-20 px-6">
        <div className="max-w-container-narrow mx-auto">
          <Link
            to="/profile"
            className="flex items-center gap-2 text-ink-muted hover:text-primary transition-colors mb-8"
          >
            <span className="material-symbols-outlined text-body">arrow_back</span>
            <span className="font-body text-body">Back to Profile</span>
          </Link>

          <header className="mb-12">
            <h1 className="font-display text-display text-on-surface mb-2">Change Password</h1>
            <p className="font-lead text-lead text-ink-muted">
              Update your password to keep your GIU Nexus account secure.
            </p>
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-7 bg-surface-container-lowest border border-hairline rounded-xl p-8 shadow-sm">
              <form className="space-y-6" onSubmit={handleSubmit}>
                <div className="space-y-2">
                  <label className="block font-body text-caption font-semibold text-on-surface" htmlFor="current-password">
                    Current Password
                  </label>
                  <div className="relative">
                    <input
                      id="current-password"
                      type={showCurrent ? "text" : "password"}
                      value={currentPassword}
                      onChange={(event) => setCurrentPassword(event.target.value)}
                      placeholder="••••••••"
                      className="w-full h-12 px-4 bg-white border rounded-lg focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all font-body text-body"
                    />
                    <button
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-ink-muted"
                      type="button"
                      aria-label={showCurrent ? "Hide current password" : "Show current password"}
                      onClick={() => setShowCurrent((s) => !s)}
                    >
                      <span className="material-symbols-outlined">{showCurrent ? "visibility" : "visibility_off"}</span>
                    </button>
                  </div>
                  {currentPasswordError && (
                    <p className="flex items-center gap-1.5 font-fine text-fine text-status-rejected-text">
                      <span className="material-symbols-outlined text-[16px]">error</span>
                      {currentPasswordError}
                    </p>
                  )}
                </div>

                <div className="h-px bg-hairline w-full my-4" />

                <div className="space-y-2">
                  <label className="block font-body text-caption font-semibold text-on-surface" htmlFor="new-password">
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      id="new-password"
                      type={showNew ? "text" : "password"}
                      value={newPassword}
                      onChange={(event) => setNewPassword(event.target.value)}
                      placeholder="Enter new password"
                      className="w-full h-12 px-4 bg-white border border-hairline rounded-lg focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all font-body text-body"
                    />
                    <button
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-ink-muted"
                      type="button"
                      aria-label={showNew ? "Hide new password" : "Show new password"}
                      onClick={() => setShowNew((s) => !s)}
                    >
                      <span className="material-symbols-outlined">{showNew ? "visibility" : "visibility_off"}</span>
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block font-body text-caption font-semibold text-on-surface" htmlFor="confirm-password">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <input
                      id="confirm-password"
                      type={showConfirm ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(event) => setConfirmPassword(event.target.value)}
                      placeholder="Repeat new password"
                      className="w-full h-12 px-4 bg-white border border-hairline rounded-lg focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all font-body text-body"
                    />
                    <button
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-ink-muted"
                      type="button"
                      aria-label={showConfirm ? "Hide confirm password" : "Show confirm password"}
                      onClick={() => setShowConfirm((s) => !s)}
                    >
                      <span className="material-symbols-outlined">{showConfirm ? "visibility" : "visibility_off"}</span>
                    </button>
                  </div>
                  {confirmPasswordError && (
                    <p className="font-fine text-fine text-status-rejected-text">{confirmPasswordError}</p>
                  )}
                </div>

                {formError && <p className="font-fine text-fine text-status-rejected-text">{formError}</p>}
                {successMessage && <p className="font-fine text-fine text-cat-frontend-text">{successMessage}</p>}

                <div className="pt-6 flex flex-col sm:flex-row items-start sm:items-center gap-4">
                  <button
                    type="submit"
                    disabled={loading}
                    className="bg-primary text-on-primary h-12 px-8 rounded-full font-body font-semibold hover:bg-primary-container transition-all active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {loading ? "Updating..." : "Update Password"}
                  </button>
                  <Link
                    to="/profile"
                    className="bg-surface-pearl border border-hairline text-on-surface-variant h-12 px-8 rounded-full font-body font-medium hover:bg-surface-container-low transition-all flex items-center justify-center"
                  >
                    Cancel
                  </Link>
                </div>
              </form>
            </div>

            <div className="lg:col-span-5 space-y-6">
              <div className="bg-white border border-hairline rounded-xl p-6 shadow-sm relative overflow-hidden">
                <div className="absolute -right-4 -top-4 w-20 h-20 bg-primary/5 rounded-full blur-3xl"></div>
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                    <span className="material-symbols-outlined">verified_user</span>
                  </div>
                  <div>
                    <h3 className="font-title text-caption font-bold text-on-surface mb-2">Password Requirements</h3>
                    <ul className="font-body text-caption text-on-surface-variant leading-relaxed space-y-1">
                      <li className="flex items-center gap-2">
                        <span className={`text-sm ${hasMinLen ? 'text-green-600' : 'text-ink-muted'}`}>{hasMinLen ? '✓' : '•'}</span>
                        <span>At least 8 characters</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <span className={`text-sm ${hasUpper ? 'text-green-600' : 'text-ink-muted'}`}>{hasUpper ? '✓' : '•'}</span>
                        <span>One uppercase letter</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <span className={`text-sm ${hasLower ? 'text-green-600' : 'text-ink-muted'}`}>{hasLower ? '✓' : '•'}</span>
                        <span>One lowercase letter</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <span className={`text-sm ${hasDigit ? 'text-green-600' : 'text-ink-muted'}`}>{hasDigit ? '✓' : '•'}</span>
                        <span>One digit</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <span className={`text-sm ${hasSpecial ? 'text-green-600' : 'text-ink-muted'}`}>{hasSpecial ? '✓' : '•'}</span>
                        <span>One special character</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
              <div className="bg-surface-container-low border border-hairline rounded-xl p-6">
                <h4 className="font-body text-caption font-bold text-on-surface mb-4">Security Overview</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-fine text-fine text-ink-muted">Last changed</span>
                    <span className="font-fine text-fine text-on-surface font-medium">{formatRelativeDate(lastChanged)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-fine text-fine text-ink-muted">Two-factor auth</span>
                    <span className="font-fine text-fine text-cat-frontend-text font-bold uppercase tracking-wider">Enabled</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

export default ChangePasswordPage;

