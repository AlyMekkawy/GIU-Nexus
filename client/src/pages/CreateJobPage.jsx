import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import "./CreateJobPage.css";

/* ── Category badge styles reused from RecruiterDashboard ─────────────── */
const CATEGORY_STYLES = {
    Frontend:           "cj-badge cj-badge-frontend",
    Backend:            "cj-badge cj-badge-backend",
    "AI/ML":            "cj-badge cj-badge-ai",
    DevOps:             "cj-badge cj-badge-devops",
    "Data Engineering": "cj-badge cj-badge-data",
    Other:              "cj-badge cj-badge-other",
};

const JOB_TYPES = ["full-time", "part-time", "internship", "contract", "freelance"];

const EMPTY_FORM = {
    title: "",
    company: "",
    description: "",
    requirements: "",
    location: "",
    type: "full-time",
    salary: "",
    totalSlots: "",
};

/* ── SVG Icons ─────────────────────────────────────────────────────────── */
const BriefcaseIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="7" width="20" height="14" rx="2" />
        <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
        <path d="M2 12h20" />
    </svg>
);

const CheckIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12" />
    </svg>
);

const ArrowLeftIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="19" y1="12" x2="5" y2="12" />
        <polyline points="12 19 5 12 12 5" />
    </svg>
);

const SparkleIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z" />
        <path d="M19 3l.9 2.1L22 6l-2.1.9L19 9l-.9-2.1L16 6l2.1-.9z" />
    </svg>
);

/* ── Component ─────────────────────────────────────────────────────────── */
function CreateJobPage() {
    const navigate = useNavigate();
    const [form, setForm] = useState(EMPTY_FORM);
    const [createdJob, setCreatedJob] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [fieldErrors, setFieldErrors] = useState({});

    function handleChange(e) {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
        if (fieldErrors[name]) {
            setFieldErrors((prev) => ({ ...prev, [name]: "" }));
        }
    }

    function validate() {
        const errs = {};
        if (!form.title.trim())       errs.title       = "Job title is required.";
        if (!form.company.trim())     errs.company     = "Company name is required.";
        if (!form.description.trim()) errs.description = "Description is required.";
        if (!form.location.trim())    errs.location    = "Location is required.";
        if (!form.totalSlots || Number(form.totalSlots) < 1)
            errs.totalSlots = "Total slots must be at least 1.";
        return errs;
    }

    async function handleSubmit(e) {
        e.preventDefault();
        setError("");
        const errs = validate();
        if (Object.keys(errs).length) { setFieldErrors(errs); return; }

        setLoading(true);
        try {
            const payload = {
                title:        form.title.trim(),
                company:      form.company.trim(),
                description:  form.description.trim(),
                requirements: form.requirements
                    .split(",")
                    .map((r) => r.trim())
                    .filter(Boolean),
                location:   form.location.trim(),
                type:       form.type,
                totalSlots: Number(form.totalSlots),
                ...(form.salary ? { salary: form.salary.trim() } : {}),
            };
            const res = await api.post("/jobs", payload);
            const job = res.data?.job || res.data;
            setCreatedJob(job);
        } catch (err) {
            setError(err.message || "Failed to create job. Please try again.");
        } finally {
            setLoading(false);
        }
    }

    /* ── Success screen ─────────────────────────────────────────────────── */
    if (createdJob) {
        const category = createdJob.category || "Other";
        const badgeClass = CATEGORY_STYLES[category] || "cj-badge cj-badge-other";

        return (
            <div className="cj-page">
                <Navbar />
                <main className="cj-container">
                    <div className="cj-success-card">
                        <div className="cj-success-icon">
                            <CheckIcon />
                        </div>
                        <h1 className="cj-success-title">Job Posted Successfully</h1>
                        <p className="cj-success-sub">
                            Your listing is live. The AI has automatically categorised it below.
                        </p>

                        <div className="cj-success-details">
                            <div className="cj-detail-row">
                                <span className="cj-detail-label">Title</span>
                                <span className="cj-detail-value">{createdJob.title}</span>
                            </div>
                            <div className="cj-detail-row">
                                <span className="cj-detail-label">Company</span>
                                <span className="cj-detail-value">{createdJob.company}</span>
                            </div>
                            <div className="cj-detail-row">
                                <span className="cj-detail-label">Location</span>
                                <span className="cj-detail-value">{createdJob.location}</span>
                            </div>
                            <div className="cj-detail-row">
                                <span className="cj-detail-label">Type</span>
                                <span className="cj-detail-value cj-capitalize">{createdJob.type}</span>
                            </div>
                            {createdJob.salary && (
                                <div className="cj-detail-row">
                                    <span className="cj-detail-label">Salary</span>
                                    <span className="cj-detail-value">{createdJob.salary}</span>
                                </div>
                            )}
                            <div className="cj-detail-row">
                                <span className="cj-detail-label">Slots</span>
                                <span className="cj-detail-value">{createdJob.totalSlots}</span>
                            </div>
                            <div className="cj-detail-row cj-detail-row-category">
                                <span className="cj-detail-label">
                                    <span className="cj-ai-label">
                                        <SparkleIcon /> AI Category
                                    </span>
                                </span>
                                <span className={badgeClass}>{category}</span>
                            </div>
                        </div>

                        <div className="cj-success-actions">
                            <button
                                type="button"
                                className="cj-btn-secondary"
                                onClick={() => {
                                    setCreatedJob(null);
                                    setForm(EMPTY_FORM);
                                    setError("");
                                    setFieldErrors({});
                                }}
                            >
                                Post Another Job
                            </button>
                            <button
                                type="button"
                                className="cj-btn-primary"
                                onClick={() => navigate("/recruiter/dashboard")}
                            >
                                Back to Dashboard
                            </button>
                        </div>
                    </div>
                </main>
                <Footer />
            </div>
        );
    }

    /* ── Form screen ────────────────────────────────────────────────────── */
    return (
        <div className="cj-page">
            <Navbar />
            <main className="cj-container">

                {/* Header */}
                <div className="cj-header">
                    <button
                        type="button"
                        className="cj-back-btn"
                        onClick={() => navigate("/recruiter/dashboard")}
                        aria-label="Back to dashboard"
                    >
                        <ArrowLeftIcon />
                    </button>
                    <div>
                        <h1 className="cj-heading">Post a New Job</h1>
                        <p className="cj-sub">
                            Fill in the details below. The AI will auto-assign a category on submission.
                        </p>
                    </div>
                    <span className="cj-icon-box">
                        <BriefcaseIcon />
                    </span>
                </div>

                {/* Global error */}
                {error && (
                    <div className="cj-error-banner" role="alert">
                        {error}
                    </div>
                )}

                {/* Form */}
                <form className="cj-form" onSubmit={handleSubmit} noValidate>

                    {/* Row 1: Title + Company */}
                    <div className="cj-row">
                        <div className="cj-field">
                            <label htmlFor="title" className="cj-label">
                                Job Title <span className="cj-required">*</span>
                            </label>
                            <input
                                id="title"
                                name="title"
                                type="text"
                                className={`cj-input${fieldErrors.title ? " cj-input-error" : ""}`}
                                placeholder="e.g. Senior Frontend Engineer"
                                value={form.title}
                                onChange={handleChange}
                                autoFocus
                            />
                            {fieldErrors.title && (
                                <span className="cj-field-error">{fieldErrors.title}</span>
                            )}
                        </div>

                        <div className="cj-field">
                            <label htmlFor="company" className="cj-label">
                                Company <span className="cj-required">*</span>
                            </label>
                            <input
                                id="company"
                                name="company"
                                type="text"
                                className={`cj-input${fieldErrors.company ? " cj-input-error" : ""}`}
                                placeholder="e.g. Acme Corp"
                                value={form.company}
                                onChange={handleChange}
                            />
                            {fieldErrors.company && (
                                <span className="cj-field-error">{fieldErrors.company}</span>
                            )}
                        </div>
                    </div>

                    {/* Description */}
                    <div className="cj-field">
                        <label htmlFor="description" className="cj-label">
                            Description <span className="cj-required">*</span>
                        </label>
                        <textarea
                            id="description"
                            name="description"
                            className={`cj-textarea${fieldErrors.description ? " cj-input-error" : ""}`}
                            placeholder="Describe the role, responsibilities, and what makes it exciting…"
                            value={form.description}
                            onChange={handleChange}
                            rows={5}
                        />
                        {fieldErrors.description && (
                            <span className="cj-field-error">{fieldErrors.description}</span>
                        )}
                    </div>

                    {/* Requirements */}
                    <div className="cj-field">
                        <label htmlFor="requirements" className="cj-label">
                            Requirements
                            <span className="cj-hint"> (comma-separated)</span>
                        </label>
                        <input
                            id="requirements"
                            name="requirements"
                            type="text"
                            className="cj-input"
                            placeholder="e.g. React, Node.js, 3+ years experience"
                            value={form.requirements}
                            onChange={handleChange}
                        />
                    </div>

                    {/* Row 2: Location + Type */}
                    <div className="cj-row">
                        <div className="cj-field">
                            <label htmlFor="location" className="cj-label">
                                Location <span className="cj-required">*</span>
                            </label>
                            <input
                                id="location"
                                name="location"
                                type="text"
                                className={`cj-input${fieldErrors.location ? " cj-input-error" : ""}`}
                                placeholder="e.g. Cairo, Egypt or Remote"
                                value={form.location}
                                onChange={handleChange}
                            />
                            {fieldErrors.location && (
                                <span className="cj-field-error">{fieldErrors.location}</span>
                            )}
                        </div>

                        <div className="cj-field">
                            <label htmlFor="type" className="cj-label">
                                Job Type <span className="cj-required">*</span>
                            </label>
                            <select
                                id="type"
                                name="type"
                                className="cj-select"
                                value={form.type}
                                onChange={handleChange}
                            >
                                {JOB_TYPES.map((t) => (
                                    <option key={t} value={t}>
                                        {t.charAt(0).toUpperCase() + t.slice(1)}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Row 3: Salary + Total Slots */}
                    <div className="cj-row">
                        <div className="cj-field">
                            <label htmlFor="salary" className="cj-label">
                                Salary
                                <span className="cj-hint"> (optional)</span>
                            </label>
                            <input
                                id="salary"
                                name="salary"
                                type="text"
                                className="cj-input"
                                placeholder="e.g. $80,000 – $100,000 / year"
                                value={form.salary}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="cj-field">
                            <label htmlFor="totalSlots" className="cj-label">
                                Total Slots <span className="cj-required">*</span>
                            </label>
                            <input
                                id="totalSlots"
                                name="totalSlots"
                                type="number"
                                min="1"
                                className={`cj-input${fieldErrors.totalSlots ? " cj-input-error" : ""}`}
                                placeholder="e.g. 3"
                                value={form.totalSlots}
                                onChange={handleChange}
                            />
                            {fieldErrors.totalSlots && (
                                <span className="cj-field-error">{fieldErrors.totalSlots}</span>
                            )}
                        </div>
                    </div>

                    {/* AI notice */}
                    <div className="cj-ai-notice">
                        <span className="cj-ai-icon"><SparkleIcon /></span>
                        <p>
                            The <strong>Category</strong> field is automatically assigned by AI based on
                            your job description. You'll see it on the confirmation screen after posting.
                        </p>
                    </div>

                    {/* Submit */}
                    <div className="cj-form-footer">
                        <button
                            type="button"
                            className="cj-btn-secondary"
                            onClick={() => navigate("/recruiter/dashboard")}
                            disabled={loading}
                        >
                            Cancel
                        </button>
                        <button type="submit" className="cj-btn-primary" disabled={loading}>
                            {loading ? (
                                <>
                                    <span className="cj-spinner" /> Posting…
                                </>
                            ) : (
                                "Post Job"
                            )}
                        </button>
                    </div>
                </form>
            </main>
            <Footer />
        </div>
    );
}

export default CreateJobPage;
