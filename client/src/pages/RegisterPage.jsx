import { useState, useRef, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { gsap } from "gsap";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import AuthBrandPanel from "../components/AuthBrandPanel";
import CursorEffect from "../components/CursorEffect";
import "../styles/AuthPage.css";

const ENABLE_CURSOR_EFFECT = false;

function RegisterPage() {
  const [fullName,         setFullName]         = useState("");
  const [email,            setEmail]            = useState("");
  const [role,             setRole]             = useState("jobSeeker");
  const [password,         setPassword]         = useState("");
  const [confirmPassword,  setConfirmPassword]  = useState("");
  const [showPw,           setShowPw]           = useState(false);
  const [showConfirmPw,    setShowConfirmPw]     = useState(false);
  const [touchedConfirm,   setTouchedConfirm]   = useState(false);
  const [isSubmitting,     setIsSubmitting]     = useState(false);
  const [formError,        setFormError]        = useState("");
  const [pendingStatus,    setPendingStatus]    = useState(null);

  const { login, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  const formRef  = useRef(null);
  const rightRef = useRef(null);

  /* ── Redirect if already authenticated ─────────────────────── */
  useEffect(() => {
    if (!isAuthenticated) return;
    // Pending recruiters stay on this page to see the approval notice
    if (user?.status === "pending") return;
    // New jobSeekers who haven't completed onboarding go to the guided flow
    if (user?.role === "jobSeeker" && !user?.hasCompletedOnboarding) {
      navigate("/onboarding", { replace: true });
    } else {
      navigate("/", { replace: true });
    }
  }, [isAuthenticated, user?.role, user?.status, user?.hasCompletedOnboarding, navigate]);

  /* ── Entrance animation ─────────────────────────────────────── */
  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        formRef.current,
        { x: 32, opacity: 0 },
        { x: 0,  opacity: 1, duration: 0.55, ease: "power3.out" }
      );
      gsap.fromTo(
        rightRef.current,
        { opacity: 0 },
        { opacity: 1, duration: 0.8, ease: "power2.out" }
      );
    });
    return () => ctx.revert();
  }, []);

  /* ── Navigate away with exit animation ─────────────────────── */
  const goTo = (path) => {
    gsap.to(formRef.current, {
      x: -32, opacity: 0, duration: 0.3, ease: "power3.in",
      onComplete: () => navigate(path),
    });
  };

  const passwordsMismatch =
    (touchedConfirm || isSubmitting) &&
    confirmPassword.length > 0 &&
    password !== confirmPassword;

  const clearErrors = () => { setFormError(""); setPendingStatus(null); };

  /* ── Submit ─────────────────────────────────────────────────── */
  async function handleSubmit(e) {
    e.preventDefault();
    setTouchedConfirm(true);

    if (!fullName.trim() || !email.trim() || !password || !confirmPassword) {
      setFormError("Please fill in all required fields.");
      return;
    }
    if (password !== confirmPassword) {
      setFormError("Passwords do not match.");
      return;
    }

    setIsSubmitting(true);
    setFormError("");

    try {
      const { data } = await api.post("/auth/register", {
        name:  fullName.trim(),
        email: email.trim(),
        password,
        role,
      });
      login(data.token, data.user);
      setPendingStatus(data.user?.status ?? null);
      // Navigation is handled by the isAuthenticated useEffect above
    } catch (err) {
      setFormError(
        err?.response?.data?.message ?? err.message ?? "Unable to create account. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="auth-page">
      {ENABLE_CURSOR_EFFECT && <CursorEffect />}

      {/* ── Left — form ─────────────────────────────────────────── */}
      <div className="auth-page__left" ref={formRef}>
        <div className="auth-page__form-wrap">

          {/* Logo */}
          <Link to="/" className="auth-page__logo">
            GIU<span className="auth-page__logo-dot">.</span>Nexus
          </Link>

          {/* Heading */}
          <div className="auth-page__heading">
            <h1 className="auth-page__title">Create account</h1>
            <p className="auth-page__subtitle">Join the GIU Nexus network and accelerate your career.</p>
          </div>

          {/* Pending recruiter notice */}
          {pendingStatus === "pending" && (
            <div className="auth-page__pending" role="status" aria-live="polite">
              <span className="material-symbols-outlined auth-page__pending-icon">schedule</span>
              <div>
                <p className="auth-page__pending-title">Account Pending Approval</p>
                <p className="auth-page__pending-text">
                  Your recruiter account is under review. You can sign in now but job posting
                  will be unlocked once an admin approves your account.
                </p>
              </div>
            </div>
          )}

          {/* Form error */}
          {formError && (
            <div className="auth-page__error" role="alert">
              <span className="material-symbols-outlined" style={{ fontSize: "18px", flexShrink: 0 }}>error</span>
              {formError}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="auth-page__form" noValidate>

            <div className="auth-page__field">
              <label className="auth-page__label" htmlFor="reg-name">Full Name</label>
              <input
                id="reg-name"
                className="auth-page__input"
                type="text"
                placeholder="Alex Johnson"
                value={fullName}
                onChange={e => { setFullName(e.target.value); clearErrors(); }}
                required
                autoComplete="name"
              />
            </div>

            <div className="auth-page__field">
              <label className="auth-page__label" htmlFor="reg-email">Email Address</label>
              <input
                id="reg-email"
                className="auth-page__input"
                type="email"
                placeholder="you@university.edu"
                value={email}
                onChange={e => { setEmail(e.target.value); clearErrors(); }}
                required
                autoComplete="email"
              />
            </div>

            {/* Role selector */}
            <div className="auth-page__field">
              <span className="auth-page__label">I am a…</span>
              <div className="auth-page__role-grid">
                {[
                  { value: "jobSeeker", icon: "person_search", label: "Job Seeker" },
                  { value: "recruiter", icon: "business_center", label: "Recruiter" },
                ].map(opt => (
                  <label
                    key={opt.value}
                    className={`auth-page__role${role === opt.value ? " auth-page__role--active" : ""}`}
                  >
                    <input
                      type="radio"
                      name="role"
                      value={opt.value}
                      checked={role === opt.value}
                      onChange={() => { setRole(opt.value); clearErrors(); }}
                    />
                    <span
                      className="material-symbols-outlined"
                      style={{ fontSize: "18px",
                        fontVariationSettings: role === opt.value ? "'FILL' 1" : "'FILL' 0" }}
                    >
                      {opt.icon}
                    </span>
                    {opt.label}
                  </label>
                ))}
              </div>
            </div>

            <div className="auth-page__field">
              <label className="auth-page__label" htmlFor="reg-password">Password</label>
              <div className="auth-page__pw-wrap">
                <input
                  id="reg-password"
                  className="auth-page__input"
                  type={showPw ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={e => { setPassword(e.target.value); clearErrors(); }}
                  required
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  className="auth-page__pw-toggle"
                  onClick={() => setShowPw(v => !v)}
                  tabIndex={-1}
                  aria-label={showPw ? "Hide password" : "Show password"}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: "20px" }}>
                    {showPw ? "visibility_off" : "visibility"}
                  </span>
                </button>
              </div>
            </div>

            <div className="auth-page__field">
              <label className="auth-page__label" htmlFor="reg-confirm">Confirm Password</label>
              <div className="auth-page__pw-wrap">
                <input
                  id="reg-confirm"
                  className={`auth-page__input${passwordsMismatch ? " auth-page__input--error" : ""}`}
                  type={showConfirmPw ? "text" : "password"}
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={e => { setConfirmPassword(e.target.value); clearErrors(); }}
                  onBlur={() => setTouchedConfirm(true)}
                  required
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  className="auth-page__pw-toggle"
                  onClick={() => setShowConfirmPw(v => !v)}
                  tabIndex={-1}
                  aria-label={showConfirmPw ? "Hide password" : "Show password"}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: "20px" }}>
                    {showConfirmPw ? "visibility_off" : "visibility"}
                  </span>
                </button>
              </div>
              {passwordsMismatch && (
                <p className="auth-page__field-error" role="alert">
                  <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>error</span>
                  Passwords do not match
                </p>
              )}
            </div>

            <button type="submit" className="auth-page__submit" disabled={isSubmitting}>
              {isSubmitting ? "Creating Account…" : "Create Account"}
            </button>

          </form>

          {/* Switch to login */}
          <p className="auth-page__switch">
            Already have an account?{" "}
            <button className="auth-page__switch-link" onClick={() => goTo("/login")}>
              Sign in
            </button>
          </p>

        </div>

        {/* Footer */}
        <div className="auth-page__footer">
          <span>© {new Date().getFullYear()} GIU Nexus</span>
          <div>
            <a href="#">Privacy</a>
            <a href="#">Terms</a>
          </div>
        </div>
      </div>

      {/* ── Right — brand ───────────────────────────────────────── */}
      <div className="auth-page__right" ref={rightRef}>
        <AuthBrandPanel />
      </div>

    </div>
  );
}

export default RegisterPage;
