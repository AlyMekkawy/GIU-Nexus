import { useState, useRef, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { gsap } from "gsap";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import AuthBrandPanel from "../components/AuthBrandPanel";
import CursorEffect from "../components/CursorEffect";
import "../styles/AuthPage.css";

const ENABLE_CURSOR_EFFECT = false;

function LoginPage() {
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [showPw,   setShowPw]   = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState(null);

  const { login } = useAuth();
  const navigate  = useNavigate();

  const formRef  = useRef(null);
  const rightRef = useRef(null);

  /* ── Entrance ──────────────────────────────────────────────── */
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

  /* ── Submit ─────────────────────────────────────────────────── */
  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res   = await api.post("/auth/login", { email, password });
      const token = res?.data?.token;
      const user  = res?.data?.user;
      if (!token || !user) {
        setError(res?.data?.message ?? "Unexpected server response");
        return;
      }
      login(token, user);
      const dest = { admin: "/admin/dashboard", recruiter: "/recruiter/dashboard", jobSeeker: "/" }[user.role] ?? "/";
      navigate(dest, { replace: true });
    } catch (err) {
      setError(err?.response?.data?.message ?? err.message ?? "Sign in failed. Please try again.");
    } finally {
      setLoading(false);
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
            <h1 className="auth-page__title">Welcome back</h1>
            <p className="auth-page__subtitle">Sign in to continue your career journey.</p>
          </div>

          {/* Error */}
          {error && (
            <div className="auth-page__error" role="alert">
              <span className="material-symbols-outlined" style={{ fontSize: "18px", flexShrink: 0 }}>error</span>
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="auth-page__form" noValidate>

            <div className="auth-page__field">
              <label className="auth-page__label" htmlFor="login-email">Email Address</label>
              <input
                id="login-email"
                className="auth-page__input"
                type="email"
                placeholder="you@university.edu"
                value={email}
                onChange={e => { setEmail(e.target.value); setError(null); }}
                required
                autoComplete="email"
              />
            </div>

            <div className="auth-page__field">
              <div className="auth-page__field-row">
                <label className="auth-page__label" htmlFor="login-password">Password</label>
                <Link to="/forgot-password" className="auth-page__forgot">Forgot password?</Link>
              </div>
              <div className="auth-page__pw-wrap">
                <input
                  id="login-password"
                  className="auth-page__input"
                  type={showPw ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={e => { setPassword(e.target.value); setError(null); }}
                  required
                  autoComplete="current-password"
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

            <button type="submit" className="auth-page__submit" disabled={loading}>
              {loading ? "Signing in…" : "Sign In"}
            </button>

          </form>

          {/* Switch to register */}
          <p className="auth-page__switch">
            Don&apos;t have an account?{" "}
            <button className="auth-page__switch-link" onClick={() => goTo("/register")}>
              Create one free
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

export default LoginPage;
