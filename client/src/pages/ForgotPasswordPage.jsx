import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { gsap } from "gsap";
import api from "../services/api";
import "./ForgotPasswordPage.css";

function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState({ type: "", text: "" });
  const cardRef = useRef(null);

  /* Card entrance */
  useEffect(() => {
    gsap.fromTo(
      cardRef.current,
      { y: 28, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.55, ease: "power3.out" }
    );
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setStatus({ type: "", text: "" });
    try {
      await api.post("/auth/forgot-password", { email });
      setStatus({
        type: "success",
        text: "If an account exists for this email, a reset link has been sent.",
      });
    } catch (err) {
      setStatus({
        type: "error",
        text: err?.response?.data?.message || err.message || "Something went wrong",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fp-page">
      <div className="fp-card" ref={cardRef}>

        {/* Icon */}
        <div className="fp-icon" aria-hidden="true">
          <span className="material-symbols-outlined">lock_reset</span>
        </div>

        <h1 className="fp-title">Forgot your password?</h1>
        <p className="fp-subtitle">
          Enter your email and we'll send you instructions to reset your password.
        </p>

        <form className="fp-form" onSubmit={handleSubmit} aria-label="Forgot password form">
          <label className="fp-label" htmlFor="fp-email">Email address</label>
          <input
            id="fp-email"
            className="fp-input"
            type="email"
            placeholder="name@university.edu"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <button className="fp-btn" type="submit" disabled={loading}>
            {loading ? "Sending…" : "Send Reset Link"}
          </button>

          {status.text && (
            <div
              className={`fp-status ${status.type}`}
              role="status"
              aria-live="polite"
            >
              {status.text}
            </div>
          )}
        </form>

        <div className="fp-back-row">
          <Link to="/login" className="fp-back-link">
            <span className="material-symbols-outlined">arrow_back</span>
            Back to sign in
          </Link>
        </div>

      </div>
    </div>
  );
}

export default ForgotPasswordPage;
