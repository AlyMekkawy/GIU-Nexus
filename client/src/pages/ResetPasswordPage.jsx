import { useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";

function ResetPasswordPage() {
  const { token } = useParams();
  const navigate = useNavigate();
  const { login } = useAuth();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
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
      const response = await api.patch(`/auth/reset-password/${token}`, {
        password,
      });

      const { token: newToken, user } = response.data;
      login(newToken, user);
      setSuccess(true);

      window.setTimeout(() => {
        navigate("/");
      }, 1200);
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Unable to reset password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-canvas-parchment flex flex-col font-body text-on-background selection:bg-primary-fixed-dim">
      <div className="flex-grow flex items-center justify-center px-6 py-16">
        <div className="w-full max-w-[480px]">
          <div className="glass-card p-space-8 md:p-space-12 rounded-[24px] shadow-sm bg-surface-container-lowest">
            {success ? (
              <div className="flex flex-col items-center text-center py-space-6">
                <div className="w-20 h-20 rounded-full bg-cat-frontend-bg flex items-center justify-center mb-space-6">
                  <span className="material-symbols-outlined text-cat-frontend-text text-[48px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                    check_circle
                  </span>
                </div>
                <h2 className="font-display text-title font-bold text-on-surface mb-space-3">
                  Password reset successfully
                </h2>
                <p className="font-body text-body text-ink-muted mb-space-8">
                  Your account security has been updated. Redirecting you to your dashboard...
                </p>
                <div className="w-full bg-hairline h-1 rounded-full overflow-hidden">
                  <div className="bg-primary h-full w-full rounded-full transition-all duration-500" />
                </div>
              </div>
            ) : (
              <div>
                <div className="flex justify-center mb-space-6">
                  <div className="w-16 h-16 rounded-full bg-primary-fixed flex items-center justify-center">
                    <span className="material-symbols-outlined text-primary text-[32px]">lock_reset</span>
                  </div>
                </div>

                <div className="text-center mb-space-8">
                  <h1 className="font-display text-display-mobile font-bold text-on-surface mb-space-2">
                    Create a new password
                  </h1>
                  <p className="font-body text-body text-ink-muted">
                    Enter your new credentials below to regain access to your GIU Nexus account.
                  </p>
                </div>

                <form className="space-y-space-6" onSubmit={handleSubmit}>
                  <div className="space-y-space-2">
                    <label className="block font-caption text-caption font-semibold text-on-surface-variant px-1" htmlFor="new-password">
                      New Password
                    </label>
                    <div className="relative group">
                      <input
                        id="new-password"
                        type="password"
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        placeholder="Min. 8 characters"
                        className="w-full h-12 bg-surface-container-lowest border border-hairline rounded-xl px-4 font-body text-body focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all outline-none"
                      />
                      <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant cursor-pointer group-focus-within:text-primary transition-colors">
                        visibility
                      </span>
                    </div>
                  </div>

                  <div className="space-y-space-2">
                    <label className="block font-caption text-caption font-semibold text-on-surface-variant px-1" htmlFor="confirm-password">
                      Confirm New Password
                    </label>
                    <div className="relative group">
                      <input
                        id="confirm-password"
                        type="password"
                        value={confirmPassword}
                        onChange={(event) => setConfirmPassword(event.target.value)}
                        placeholder="Repeat password"
                        className="w-full h-12 bg-surface-container-lowest border border-hairline rounded-xl px-4 font-body text-body focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all outline-none"
                      />
                      <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant cursor-pointer group-focus-within:text-primary transition-colors">
                        visibility
                      </span>
                    </div>
                  </div>

                  {error && <p className="text-sm text-status-rejected-text font-medium px-1">{error}</p>}

                  <div className="pt-space-4">
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full h-12 bg-primary text-on-primary rounded-full font-body font-semibold hover:bg-primary-container transition-colors active:scale-[0.98] duration-150 disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {loading ? "Resetting..." : "Reset Password"}
                    </button>
                  </div>
                </form>

                <div className="mt-space-8 text-center">
                  <Link
                    className="font-caption text-caption text-primary font-medium hover:underline flex items-center justify-center gap-space-1"
                    to="/login"
                  >
                    <span className="material-symbols-outlined text-[18px]">arrow_back</span>
                    Back to login
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

export default ResetPasswordPage;

