import { useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import "./ForgotPasswordPage.css";

function ForgotPasswordPage() {
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState({ type: "", text: "" });

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
        <div className="forgot-page">
            <div className="forgot-card">
                <div className="forgot-icon" aria-hidden="true">↺</div>
                <h1>Forgot your password?</h1>
                <p>Enter your email and we'll send you instructions to reset your password.</p>

                <form onSubmit={handleSubmit} aria-label="Forgot password form">
                    <label htmlFor="forgot-email">Email</label>
                    <input
                        id="forgot-email"
                        type="email"
                        placeholder="name@university.edu"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />

                    <button type="submit" disabled={loading}>
                        {loading ? "Sending..." : "Send Reset Link →"}
                    </button>

                    {status.text && (
                        <div className={`forgot-status ${status.type}`} role="status" aria-live="polite">
                            {status.text}
                        </div>
                    )}

                    <div>
                        <Link to="/login">← Back to sign in</Link>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default ForgotPasswordPage;

