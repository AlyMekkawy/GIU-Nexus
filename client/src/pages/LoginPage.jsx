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
            navigate("/", { replace: true });
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

                    <div className="divider" aria-hidden="true"><span>Or continue with</span></div>

                    <div className="social-row">
                        <a className="social-btn google" href="https://accounts.google.com/" aria-label="Continue with Google">
                            <svg width="18" height="18" viewBox="0 0 533.5 544.3" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
                                <path fill="#4285F4" d="M533.5 278.4c0-18.5-1.5-36.3-4.4-53.6H272v101.5h147.1c-6.4 34.7-25.8 64.1-55 83.8v69.6h88.8c52-48 81.6-118.6 81.6-201.3z"/>
                                <path fill="#34A853" d="M272 544.3c74.4 0 136.8-24.6 182.4-66.8l-88.8-69.6c-24.7 16.6-56.4 26.5-93.6 26.5-72 0-133-48.6-154.8-113.9H23.4v71.7C68.8 481.9 162.8 544.3 272 544.3z"/>
                                <path fill="#FBBC05" d="M117.2 324.6c-10.6-31.1-10.6-64.7 0-95.8V157.1H23.4C-6.1 212.3-6.1 331.9 23.4 387.1l93.8-62.5z"/>
                                <path fill="#EA4335" d="M272 107.7c39.6 0 75.2 13.6 103.3 40.4l77.5-77.5C408.8 23.9 346.4 0 272 0 162.8 0 68.8 62.4 23.4 157.1l93.8 71.7C139 156.3 200 107.7 272 107.7z"/>
                            </svg>
                            <span>Google</span>
                        </a>

                        <a className="social-btn apple" href="https://www.apple.com/" aria-label="Continue with Apple">
                            <svg width="16" height="20" viewBox="0 0 24 30" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
                                <path fill="#000" d="M19.665 12.39c-.023-2.53 2.06-3.744 2.15-3.8-1.175-1.705-3-1.94-3.64-1.964-1.554-.157-3.042.91-3.83.91-.79 0-2.02-.883-3.32-.86-1.71.023-3.29.99-4.17 2.51-1.78 3.07-.454 7.62 1.27 10.12.85 1.18 1.86 2.5 3.18 2.45 1.29-.05 1.78-.83 3.34-.83 1.56 0 2.01.83 3.35.8 1.41-.03 2.29-1.2 3.13-2.37.98-1.41 1.39-2.78 1.41-2.85-.03-.01-2.7-1.04-2.73-4.13zM16.03 3.22c.81-.98 1.36-2.35 1.21-3.72-1.17.05-2.59.79-3.42 1.77-.76.87-1.43 2.27-1.25 3.61 1.33.1 2.7-.68 3.46-.66z"/>
                            </svg>
                            <span>Apple</span>
                        </a>
                    </div>

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

