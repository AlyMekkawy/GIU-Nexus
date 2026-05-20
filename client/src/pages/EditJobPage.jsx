import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../services/api";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import "./EditJobPage.css";

/* ── Category badge styles ─────────────────────────────────────────────── */
const CATEGORY_STYLES = {
    Frontend:           "ej-badge ej-badge-frontend",
    Backend:            "ej-badge ej-badge-backend",
    "AI/ML":            "ej-badge ej-badge-ai",
    DevOps:             "ej-badge ej-badge-devops",
    "Data Engineering": "ej-badge ej-badge-data",
    Other:              "ej-badge ej-badge-other",
};

// Must match the model enum exactly
const JOB_TYPES    = ["full-time", "part-time", "internship"];
const JOB_STATUSES = ["open", "closed"];

/* ── SVG Icons ─────────────────────────────────────────────────────────── */
const PencilIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4z" />
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

const InfoIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="8" strokeWidth="2.5" />
        <line x1="12" y1="12" x2="12" y2="16" />
    </svg>
);

/* ── Component ─────────────────────────────────────────────────────────── */
function EditJobPage() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [form, setForm]               = useState(null);       // null = not loaded yet
    const [originalJob, setOriginalJob] = useState(null);
    const [saved, setSaved]             = useState(false);
    const [loading, setLoading]         = useState(true);
    const [saving, setSaving]           = useState(false);
    const [fetchError, setFetchError]   = useState("");
    const [saveError, setSaveError]     = useState("");
    const [fieldErrors, setFieldErrors] = useState({});
    const [descChanged, setDescChanged] = useState(false);

    /* ── Fetch existing job ────────────────────────────────────────────── */
    useEffect(() => {
        let isMounted = true;
        async function loadJob() {
            setLoading(true);
            setFetchError("");
            try {
                const res = await api.get(`/jobs/${id}`);
                const job = res.data?.job || res.data;
                if (!isMounted) return;
                setOriginalJob(job);
                setForm({
                    title:        job.title        || "",
                    company:      job.company      || "",
                    description:  job.description  || "",
                    requirements: Array.isArray(job.requirements)
                        ? job.requirements.join(", ")
                        : (job.requirements || ""),
                    location:     job.location     || "",
                    type:         job.type         || "full-time",
                    salary:       job.salary != null ? String(job.salary) : "",
                    totalSlots:   job.totalSlots != null ? String(job.totalSlots) : "",
                    status:       job.status       || "open",
                });
            } catch (err) {
                if (!isMounted) return;
                setFetchError(err.message || "Failed to load job. Please try again.");
            } finally {
                if (isMounted) setLoading(false);
            }
        }
        loadJob();
        return () => { isMounted = false; };
    }, [id]);

    /* ── Handlers ──────────────────────────────────────────────────────── */
    function handleChange(e) {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
        if (name === "description" && value !== originalJob?.description) {
            setDescChanged(true);
        } else if (name === "description") {
            setDescChanged(false);
        }
        if (fieldErrors[name]) {
            setFieldErrors((prev) => ({ ...prev, [name]: "" }));
        }
        setSaved(false);
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
        setSaveError("");
        setSaved(false);

        const errs = validate();
        if (Object.keys(errs).length) { setFieldErrors(errs); return; }

        setSaving(true);
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
                status:     form.status,
                ...(form.salary ? { salary: Number(form.salary) } : {}),
            };
            const res = await api.patch(`/jobs/${id}`, payload);
            const updatedJob = res.data?.job || res.data;
            setOriginalJob(updatedJob);
            setDescChanged(false);
            setSaved(true);
        } catch (err) {
            setSaveError(err.message || "Failed to save changes. Please try again.");
        } finally {
            setSaving(false);
        }
    }

    /* ── Loading state ─────────────────────────────────────────────────── */
    if (loading) {
        return (
            <div className="ej-page">
                <Navbar />
                <main className="ej-container">
                    <div className="ej-loading">
                        <div className="ej-spinner" />
                        <p>Loading job details…</p>
                    </div>
                </main>
                <Footer />
            </div>
        );
    }

    /* ── Fetch error state ─────────────────────────────────────────────── */
    if (fetchError) {
        return (
            <div className="ej-page">
                <Navbar />
                <main className="ej-container">
                    <div className="ej-fetch-error">
                        <p>{fetchError}</p>
                        <button
                            type="button"
                            className="ej-btn-primary"
                            onClick={() => navigate("/recruiter/dashboard")}
                        >
                            Back to Dashboard
                        </button>
                    </div>
                </main>
                <Footer />
            </div>
        );
    }

    /* ── Success state (inline — stays on page) ────────────────────────── */
    const category = originalJob?.category || "Other";
    const badgeClass = CATEGORY_STYLES[category] || "ej-badge ej-badge-other";

    return (
        <div className="ej-page">
            <Navbar />
            <main className="ej-container">

                {/* Header */}
                <div className="ej-header">
                    <button
                        type="button"
                        className="ej-back-btn"
                        onClick={() => navigate("/recruiter/dashboard")}
                        aria-label="Back to dashboard"
                    >
                        <ArrowLeftIcon />
                    </button>
                    <div className="ej-header-text">
                        <h1 className="ej-heading">Edit Job Post</h1>
                        <p className="ej-sub">
                            Updating <strong>{originalJob?.title}</strong>
                            {" · "}
                            <span className={badgeClass}>{category}</span>
                        </p>
                    </div>
                    <span className="ej-icon-box">
                        <PencilIcon />
                    </span>
                </div>

                {/* Save success banner */}
                {saved && (
                    <div className="ej-success-banner" role="status">
                        <span className="ej-success-icon"><CheckIcon /></span>
                        Changes saved successfully.
                        {descChanged === false && originalJob?.category && (
                            <span> Category remains <strong>{originalJob.category}</strong>.</span>
                        )}
                    </div>
                )}

                {/* Save error banner */}
                {saveError && (
                    <div className="ej-error-banner" role="alert">{saveError}</div>
                )}

                {/* Form */}
                <form className="ej-form" onSubmit={handleSubmit} noValidate>

                    {/* Row 1: Title + Company */}
                    <div className="ej-row">
                        <div className="ej-field">
                            <label htmlFor="title" className="ej-label">
                                Job Title <span className="ej-required">*</span>
                            </label>
                            <input
                                id="title"
                                name="title"
                                type="text"
                                className={`ej-input${fieldErrors.title ? " ej-input-error" : ""}`}
                                value={form.title}
                                onChange={handleChange}
                                autoFocus
                            />
                            {fieldErrors.title && (
                                <span className="ej-field-error">{fieldErrors.title}</span>
                            )}
                        </div>

                        <div className="ej-field">
                            <label htmlFor="company" className="ej-label">
                                Company <span className="ej-required">*</span>
                            </label>
                            <input
                                id="company"
                                name="company"
                                type="text"
                                className={`ej-input${fieldErrors.company ? " ej-input-error" : ""}`}
                                value={form.company}
                                onChange={handleChange}
                            />
                            {fieldErrors.company && (
                                <span className="ej-field-error">{fieldErrors.company}</span>
                            )}
                        </div>
                    </div>

                    {/* Description */}
                    <div className="ej-field">
                        <label htmlFor="description" className="ej-label">
                            Description <span className="ej-required">*</span>
                        </label>
                        <textarea
                            id="description"
                            name="description"
                            className={`ej-textarea${fieldErrors.description ? " ej-input-error" : ""}`}
                            value={form.description}
                            onChange={handleChange}
                            rows={5}
                        />
                        {fieldErrors.description && (
                            <span className="ej-field-error">{fieldErrors.description}</span>
                        )}
                        {/* Warn the user the AI will re-classify if description changes */}
                        {descChanged && (
                            <span className="ej-desc-notice">
                                <InfoIcon />
                                Description changed — AI will re-assign the category on save.
                            </span>
                        )}
                    </div>

                    {/* Requirements */}
                    <div className="ej-field">
                        <label htmlFor="requirements" className="ej-label">
                            Requirements
                            <span className="ej-hint"> (comma-separated)</span>
                        </label>
                        <input
                            id="requirements"
                            name="requirements"
                            type="text"
                            className="ej-input"
                            value={form.requirements}
                            onChange={handleChange}
                        />
                    </div>

                    {/* Row 2: Location + Type */}
                    <div className="ej-row">
                        <div className="ej-field">
                            <label htmlFor="location" className="ej-label">
                                Location <span className="ej-required">*</span>
                            </label>
                            <input
                                id="location"
                                name="location"
                                type="text"
                                className={`ej-input${fieldErrors.location ? " ej-input-error" : ""}`}
                                value={form.location}
                                onChange={handleChange}
                            />
                            {fieldErrors.location && (
                                <span className="ej-field-error">{fieldErrors.location}</span>
                            )}
                        </div>

                        <div className="ej-field">
                            <label htmlFor="type" className="ej-label">
                                Job Type <span className="ej-required">*</span>
                            </label>
                            <select
                                id="type"
                                name="type"
                                className="ej-select"
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
                    <div className="ej-row">
                        <div className="ej-field">
                            <label htmlFor="salary" className="ej-label">
                                Salary
                                <span className="ej-hint"> (optional, number)</span>
                            </label>
                            <input
                                id="salary"
                                name="salary"
                                type="number"
                                min="0"
                                className="ej-input"
                                placeholder="e.g. 80000"
                                value={form.salary}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="ej-field">
                            <label htmlFor="totalSlots" className="ej-label">
                                Total Slots <span className="ej-required">*</span>
                            </label>
                            <input
                                id="totalSlots"
                                name="totalSlots"
                                type="number"
                                min="1"
                                className={`ej-input${fieldErrors.totalSlots ? " ej-input-error" : ""}`}
                                value={form.totalSlots}
                                onChange={handleChange}
                            />
                            {fieldErrors.totalSlots && (
                                <span className="ej-field-error">{fieldErrors.totalSlots}</span>
                            )}
                        </div>
                    </div>

                    {/* Status toggle */}
                    <div className="ej-field">
                        <label className="ej-label">Status</label>
                        <div className="ej-status-group">
                            {JOB_STATUSES.map((s) => (
                                <label key={s} className={`ej-status-option${form.status === s ? " ej-status-selected" : ""}`}>
                                    <input
                                        type="radio"
                                        name="status"
                                        value={s}
                                        checked={form.status === s}
                                        onChange={handleChange}
                                    />
                                    <span className={`ej-status-dot ej-status-dot-${s}`} />
                                    {s.charAt(0).toUpperCase() + s.slice(1)}
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* AI category notice */}
                    <div className="ej-ai-notice">
                        <span className="ej-ai-icon"><SparkleIcon /></span>
                        <p>
                            Current AI category: <span className={badgeClass}>{category}</span>.
                            {" "}Editing the <strong>description</strong> will trigger a re-classification on save.
                        </p>
                    </div>

                    {/* Footer */}
                    <div className="ej-form-footer">
                        <button
                            type="button"
                            className="ej-btn-secondary"
                            onClick={() => navigate("/recruiter/dashboard")}
                            disabled={saving}
                        >
                            Cancel
                        </button>
                        <button type="submit" className="ej-btn-primary" disabled={saving}>
                            {saving ? (
                                <>
                                    <span className="ej-spinner-sm" /> Saving…
                                </>
                            ) : (
                                "Save Changes"
                            )}
                        </button>
                    </div>
                </form>
            </main>
            <Footer />
        </div>
    );
}

export default EditJobPage;
