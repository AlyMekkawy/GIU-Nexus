import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import "./LoginPage.css";

function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const { login } = useAuth();
    const navigate = useNavigate();

    async function handleSubmit(e) {
        e.preventDefault();
        setError(null);
        setLoading(true);
        try {
            const res = await api.post("/auth/login", { email, password });
            const token = res?.data?.token;
            const user = res?.data?.user;
            if (!token || !user) {
                const fallbackMsg = res?.data?.message || "Unexpected response from server";
                throw new Error(fallbackMsg);
            }
            login(token, user);
            const redirectTo = {
                admin:     "/admin/dashboard",
                recruiter: "/recruiter/dashboard",
                jobSeeker: "/",
            }[user.role] ?? "/";
            navigate(redirectTo, { replace: true });
        } catch (err) {
            const backendMessage = err?.response?.data?.message;
            const details = backendMessage || err.message || "Login failed";
            console.error("Login error:", err);
            setError(details);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="auth-container">
            <div className="auth-left">
                <div className="auth-left-inner">
                    <h2 className="brand-title">GIU Nexus</h2>
                    <p className="brand-sub">Sign in to your professional AI-powered ecosystem.</p>

                    {error && <div className="auth-error">{error}</div>}

                    <form onSubmit={handleSubmit} aria-label="Login form" className="auth-form">
                        <div className="field">
                            <label className="field-label">Work Email</label>
                            <input
                                className="field-input"
                                type="email"
                                placeholder="name@university.edu"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                aria-label="Work Email"
                            />
                        </div>

                        <div className="field">
                            <div className="field-row">
                                <label className="field-label">Password</label>
                                <Link to="/forgot-password" className="forgot-link">Forgot password?</Link>
                            </div>
                            <input
                                className="field-input"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                aria-label="Password"
                            />
                        </div>

                        <button type="submit" disabled={loading} className="submit-btn" aria-disabled={loading}>
                            {loading ? "Signing in..." : "Sign in →"}
                        </button>
                    </form>
                    <div className="join-line">Don't have an account? <Link to="/register">Join the Nexus</Link></div>
                </div>
            </div>

            <div className="auth-right">
                <div className="auth-right-top">
                    <div className="brand-row">
                        <div className="brand-logo" aria-hidden="true">
                            <svg width="48" height="48" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
                                <rect width="48" height="48" rx="10" fill="#0b57b7" />
                                <g transform="translate(11 11)" fill="#ffffff">
                                    <circle cx="4" cy="4" r="2.2" />
                                    <circle cx="14" cy="4" r="2.2" />
                                    <circle cx="4" cy="14" r="2.2" />
                                    <circle cx="14" cy="14" r="2.2" />
                                </g>
                            </svg>
                        </div>

                        <div className="brand-meta">
                            <div className="brand-name">GIU Nexus</div>
                            <div className="brand-badge">AI-POWERED CAREER EXCELLENCE</div>
                        </div>
                    </div>

                    <h1 className="hero-title">LinkedIn <em>Meets</em> AI.</h1>
                    <p className="hero-sub">The intelligent bridge between university talent and global opportunities, engineered for high-precision matching.</p>

                    <div className="features">
                        <div className="feature">
                            <div className="feature-head">
                                <div className="feature-icon" aria-hidden="true">
                                    <svg width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
                                        <path fill="#0b57b7" d="M12 2a2 2 0 00-2 2v1.1A7 7 0 005 12v2a7 7 0 007 7 7 7 0 007-7v-2a7 7 0 00-5-6.9V4a2 2 0 00-2-2z" />
                                    </svg>
                                </div>
                                <strong>Semantic Fit</strong>
                            </div>
                            <div className="feature-desc">Beyond keywords. We understand your potential.</div>
                        </div>

                        <div className="feature">
                            <div className="feature-head">
                                <div className="feature-icon" aria-hidden="true">
                                    <svg width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
                                        <path fill="#0b57b7" d="M2 21l21-9L2 3v7l15 2-15 2v7z" />
                                    </svg>
                                </div>
                                <strong>Fast Track</strong>
                            </div>
                            <div className="feature-desc">Direct pathways to top-tier global internships.</div>
                        </div>
                    </div>
                </div>

                <div className="auth-right-bottom">
                    <div>© {new Date().getFullYear()} GIU Nexus</div>
                    <div className="links">
                        <a href="#">Privacy</a>
                        <a href="#">Terms</a>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default LoginPage;

