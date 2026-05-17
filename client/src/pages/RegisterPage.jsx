import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";

function RegisterPage() {
    const navigate = useNavigate();
    const { login, isAuthenticated } = useAuth();

    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [role, setRole] = useState("jobSeeker");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [touchedConfirm, setTouchedConfirm] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formError, setFormError] = useState("");
    const [pendingStatus, setPendingStatus] = useState(null);

    // Redirect authenticated users away from the register page.
    useEffect(() => {
        if (isAuthenticated) {
            navigate("/", { replace: true });
        }
    }, [isAuthenticated, navigate]);

    const passwordsMismatch = (touchedConfirm || isSubmitting) && confirmPassword.length > 0 && password !== confirmPassword;
    const showPendingNotice = pendingStatus === "pending";

    const resetServerFeedback = () => {
        setFormError("");
        setPendingStatus(null);
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setTouchedConfirm(true);

        if (!fullName.trim() || !email.trim() || !password || !confirmPassword) {
            setFormError("Please fill out all required fields.");
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
                name: fullName.trim(),
                email: email.trim(),
                password,
                role,
            });

            login(data.token, data.user);
            setPendingStatus(data.user?.status || null);

            if (data.user?.status !== "pending") {
                navigate("/");
            }
        } catch (err) {
            setFormError(err.message || "Unable to create account right now.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="register-page">
            <style>{`
        .register-page {
          min-height: 100vh;
          background: #f5f5f7;
          display: flex;
          flex-direction: column;
          font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
        }

        .register-page__main {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 96px 24px 48px;
        }

        .register-page__wrap {
          width: 100%;
          max-width: 480px;
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .register-page__notice {
          display: flex;
          gap: 12px;
          align-items: flex-start;
          background: #fff4df;
          border: 1px solid rgba(178, 106, 0, 0.2);
          color: #b26a00;
          padding: 16px;
          border-radius: 16px;
          box-shadow: 0 4px 18px rgba(0, 0, 0, 0.05);
        }

        .register-page__notice-icon {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: rgba(178, 106, 0, 0.15);
          display: inline-flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .register-page__notice-title {
          font-size: 0.9375rem;
          font-weight: 600;
          margin: 0 0 6px;
        }

        .register-page__notice-text {
          font-size: 0.875rem;
          margin: 0;
          line-height: 1.5;
        }

        .register-page__card {
          background: #ffffff;
          border-radius: 24px;
          padding: 32px;
          border: 1px solid #e5e7eb;
          box-shadow: 0 12px 32px rgba(15, 23, 42, 0.08);
        }

        .register-page__heading {
          text-align: center;
          margin-bottom: 24px;
        }

        .register-page__title {
          margin: 0 0 8px;
          font-size: 1.75rem;
          font-weight: 700;
          color: #1f2937;
        }

        .register-page__subtitle {
          margin: 0;
          font-size: 0.95rem;
          color: #6b7280;
        }

        .register-page__form {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .register-page__field {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .register-page__label {
          font-size: 0.875rem;
          font-weight: 600;
          color: #374151;
        }

        .register-page__input {
          width: 100%;
          padding: 12px 16px;
          border-radius: 14px;
          border: 1px solid #d1d5db;
          background: #ffffff;
          font-size: 1rem;
          color: #1f2937;
          outline: none;
          transition: border-color 0.2s ease, box-shadow 0.2s ease;
        }

        .register-page__input:focus {
          border-color: #0f62fe;
          box-shadow: 0 0 0 3px rgba(15, 98, 254, 0.15);
        }

        .register-page__role-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 10px;
        }

        .register-page__role {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 12px 10px;
          border-radius: 14px;
          border: 1px solid #d1d5db;
          background: #ffffff;
          cursor: pointer;
          font-weight: 600;
          color: #374151;
          transition: border-color 0.2s ease, background 0.2s ease, color 0.2s ease;
        }

        .register-page__role input {
          position: absolute;
          opacity: 0;
          pointer-events: none;
        }

        .register-page__role--active {
          border-color: #0f62fe;
          background: rgba(15, 98, 254, 0.08);
          color: #0f62fe;
        }

        .register-page__error-input {
          border-color: #dc2626;
          background: #fef2f2;
        }

        .register-page__error-text {
          display: flex;
          align-items: center;
          gap: 6px;
          color: #dc2626;
          font-size: 0.75rem;
          margin: 0;
        }

        .register-page__form-error {
          background: #fef2f2;
          border: 1px solid #fecaca;
          color: #b91c1c;
          padding: 12px 14px;
          border-radius: 12px;
          font-size: 0.875rem;
        }

        .register-page__submit {
          margin-top: 8px;
          width: 100%;
          border: none;
          border-radius: 999px;
          padding: 14px 16px;
          background: #0b4ea2;
          color: #ffffff;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          box-shadow: 0 12px 20px rgba(11, 78, 162, 0.25);
          transition: transform 0.15s ease, box-shadow 0.15s ease;
        }

        .register-page__submit:active {
          transform: scale(0.98);
        }

        .register-page__signin {
          margin-top: 20px;
          text-align: center;
          font-size: 0.875rem;
          color: #6b7280;
        }

        .register-page__signin a {
          color: #0f62fe;
          font-weight: 600;
          text-decoration: none;
        }

        .register-page__signin a:hover {
          text-decoration: underline;
        }

        .register-page__terms {
          text-align: center;
          font-size: 0.75rem;
          color: #6b7280;
          margin: 0;
          padding: 0 20px;
        }

        .register-page__terms a {
          color: inherit;
        }

        @media (max-width: 480px) {
          .register-page__main {
            padding: 88px 16px 40px;
          }

          .register-page__card {
            padding: 24px;
          }
        }
      `}</style>

            <Navbar />

            <main className="register-page__main">
                <div className="register-page__wrap">
                    {showPendingNotice && (
                        <section className="register-page__notice" aria-live="polite">
                            <span className="register-page__notice-icon" aria-hidden="true">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="12" cy="12" r="10" />
                                    <line x1="12" y1="8" x2="12" y2="12" />
                                    <circle cx="12" cy="16" r="1" fill="currentColor" stroke="none" />
                                </svg>
                            </span>
                            <div>
                                <p className="register-page__notice-title">Account Pending Approval</p>
                                <p className="register-page__notice-text">
                                    Your recruiter account is pending admin approval. You can sign in, but job posting will be locked until approval.
                                </p>
                            </div>
                        </section>
                    )}

                    <section className="register-page__card">
                        <div className="register-page__heading">
                            <h1 className="register-page__title">Create Account</h1>
                            <p className="register-page__subtitle">Join the GIU Nexus network for career excellence.</p>
                        </div>

                        <form className="register-page__form" onSubmit={handleSubmit}>
                            {formError && <div className="register-page__form-error" role="alert">{formError}</div>}
                            <div className="register-page__field">
                                <label className="register-page__label" htmlFor="fullName">Full Name</label>
                                <input
                                    id="fullName"
                                    className="register-page__input"
                                    type="text"
                                    placeholder="Alex Johnson"
                                    value={fullName}
                                    onChange={(event) => {
                                        setFullName(event.target.value);
                                        resetServerFeedback();
                                    }}
                                />
                            </div>

                            <div className="register-page__field">
                                <label className="register-page__label" htmlFor="email">Email Address</label>
                                <input
                                    id="email"
                                    className="register-page__input"
                                    type="email"
                                    placeholder="name@university.edu"
                                    value={email}
                                    onChange={(event) => {
                                        setEmail(event.target.value);
                                        resetServerFeedback();
                                    }}
                                />
                            </div>

                            <div className="register-page__field">
                                <span className="register-page__label">I am a...</span>
                                <div className="register-page__role-grid">
                                    <label className={`register-page__role${role === "jobSeeker" ? " register-page__role--active" : ""}`}>
                                        <input
                                            type="radio"
                                            name="role"
                                            value="jobSeeker"
                                            checked={role === "jobSeeker"}
                                            onChange={() => {
                                                setRole("jobSeeker");
                                                resetServerFeedback();
                                            }}
                                        />
                                        Job Seeker
                                    </label>
                                    <label className={`register-page__role${role === "recruiter" ? " register-page__role--active" : ""}`}>
                                        <input
                                            type="radio"
                                            name="role"
                                            value="recruiter"
                                            checked={role === "recruiter"}
                                            onChange={() => {
                                                setRole("recruiter");
                                                resetServerFeedback();
                                            }}
                                        />
                                        Recruiter
                                    </label>
                                </div>
                            </div>

                            <div className="register-page__field">
                                <label className="register-page__label" htmlFor="password">Password</label>
                                <input
                                    id="password"
                                    className="register-page__input"
                                    type="password"
                                    placeholder="********"
                                    value={password}
                                    onChange={(event) => {
                                        setPassword(event.target.value);
                                        resetServerFeedback();
                                    }}
                                />
                            </div>

                            <div className="register-page__field">
                                <label className="register-page__label" htmlFor="confirmPassword">Confirm Password</label>
                                <input
                                    id="confirmPassword"
                                    className={`register-page__input${passwordsMismatch ? " register-page__error-input" : ""}`}
                                    type="password"
                                    placeholder="********"
                                    value={confirmPassword}
                                    onChange={(event) => {
                                        setConfirmPassword(event.target.value);
                                        resetServerFeedback();
                                    }}
                                    onBlur={() => setTouchedConfirm(true)}
                                />
                                {passwordsMismatch && (
                                    <p className="register-page__error-text">
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                            <circle cx="12" cy="12" r="10" />
                                            <line x1="12" y1="8" x2="12" y2="12" />
                                            <circle cx="12" cy="16" r="1" fill="currentColor" stroke="none" />
                                        </svg>
                                        Passwords do not match
                                    </p>
                                )}
                            </div>

                            <button className="register-page__submit" type="submit" disabled={isSubmitting}>
                                {isSubmitting ? "Creating Account..." : "Create Account"}
                            </button>
                        </form>

                        <p className="register-page__signin">
                            Already have an account? <Link to="/login">Sign in</Link>
                        </p>
                    </section>

                    <p className="register-page__terms">
                        By creating an account, you agree to our <Link to="/terms">Terms of Service</Link> and <Link to="/privacy">Privacy Policy</Link>.
                    </p>
                </div>
            </main>

            <Footer />
        </div>
    );
}

export default RegisterPage;
