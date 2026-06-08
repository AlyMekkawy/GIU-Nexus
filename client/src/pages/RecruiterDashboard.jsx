import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { gsap } from "gsap";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { getRecruiterJobCtaState } from "../utils/recruiterAccess";
import "./RecruiterDashboard.css";

/* ── Inline SVG icons ─────────────────────────────────────────────────── */
const BriefcaseIcon = () => (
    <svg viewBox="0 0 24 24"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/><line x1="12" y1="12" x2="12" y2="12"/><path d="M2 12h20"/></svg>
);

const CircleCheckIcon = () => (
    <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M8 12l3 3 5-5"/></svg>
);

const LockIcon = () => (
    <svg viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
);

const UsersIcon = () => (
    <svg viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
);

const SearchIcon = () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
    </svg>
);

const FilterIcon = () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="4" y1="6" x2="20" y2="6"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="11" y1="18" x2="13" y2="18"/>
    </svg>
);

/* ── Constants ────────────────────────────────────────────────────────── */
const CATEGORY_STYLES = {
    Frontend:         "rd-badge rd-badge-frontend",
    Backend:          "rd-badge rd-badge-backend",
    "AI/ML":          "rd-badge rd-badge-ai",
    DevOps:           "rd-badge rd-badge-devops",
    "Data Engineering": "rd-badge rd-badge-data",
    Other:            "rd-badge rd-badge-other",
};

const STATUS_LABELS = {
    open:   "Active",
    closed: "Closed",
};

const STATUS_CLASSES = {
    open:   "rd-status rd-status-open",
    closed: "rd-status rd-status-closed",
};

function formatRelativeDate(value) {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    const diffDays = Math.max(Math.floor((Date.now() - date.getTime()) / 86400000), 0);
    if (diffDays === 0) return "Posted today";
    if (diffDays === 1) return "Posted 1 day ago";
    if (diffDays < 7) return `Posted ${diffDays} days ago`;
    if (diffDays < 14) return "Posted 1 week ago";
    return `Posted ${Math.floor(diffDays / 7)} weeks ago`;
}

/* ── Component ────────────────────────────────────────────────────────── */
function RecruiterDashboard() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [jobs, setJobs] = useState([]);
    const [applicantCounts, setApplicantCounts] = useState({});
    const [searchTerm, setSearchTerm] = useState("");
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const heroRef = useRef(null);
    const jobCtaState = getRecruiterJobCtaState(user);
    const isPending = jobCtaState.isPending;
    const pageSize = 5;

    useEffect(() => {
        let isMounted = true;

        async function loadJobs() {
            setLoading(true);
            setError("");
            try {
                const response = await api.get("/jobs/my-jobs");
                const fetchedJobs = response?.data?.jobs || [];
                if (!isMounted) return;
                setJobs(fetchedJobs);

                if (fetchedJobs.length === 0) { setApplicantCounts({}); return; }

                const counts = await Promise.all(
                    fetchedJobs.map(async (job) => {
                        try {
                            const res = await api.get(`/jobs/${job._id}/applicants`);
                            return [job._id, (res?.data?.applications || []).length];
                        } catch { return [job._id, 0]; }
                    })
                );
                if (!isMounted) return;
                setApplicantCounts(Object.fromEntries(counts));
            } catch (err) {
                if (!isMounted) return;
                setError(err?.message || "Failed to load recruiter jobs.");
            } finally {
                if (isMounted) setLoading(false);
            }
        }

        loadJobs();
        return () => { isMounted = false; };
    }, []);

    // Hero entrance
    useEffect(() => {
        if (!heroRef.current) return;
        gsap.fromTo(
            heroRef.current.children,
            { y: 20, opacity: 0 },
            { y: 0, opacity: 1, duration: 0.55, stagger: 0.08, ease: "power3.out" }
        );
    }, []);

    const normalizedSearch = searchTerm.trim().toLowerCase();
    const filteredJobs = useMemo(() => {
        if (!normalizedSearch) return jobs;
        return jobs.filter((j) => j.title?.toLowerCase().includes(normalizedSearch));
    }, [jobs, normalizedSearch]);

    const totalJobs      = jobs.length;
    const openJobs       = jobs.filter((j) => j.status === "open").length;
    const closedJobs     = jobs.filter((j) => j.status === "closed").length;
    const totalApplicants = Object.values(applicantCounts).reduce((s, c) => s + c, 0);

    const totalPages   = Math.max(Math.ceil(filteredJobs.length / pageSize), 1);
    const currentPage  = Math.min(page, totalPages);
    const startIndex   = (currentPage - 1) * pageSize;
    const paginatedJobs = filteredJobs.slice(startIndex, startIndex + pageSize);

    const showEmptyState = !loading && !error && filteredJobs.length === 0;

    return (
        <div className="rd-page">
            <Navbar />

            <main className="rd-container">
                {isPending && (
                    <div className="rd-banner" role="status">
                        <div className="rd-banner-content">
                            <span className="rd-banner-icon">i</span>
                            <p style={{ margin: 0 }}>
                                Your recruiter account is currently pending verification.
                                Some features may be limited until approval.
                            </p>
                        </div>
                        <button className="rd-banner-action" type="button" disabled>
                            View Verification Status
                        </button>
                    </div>
                )}

                {/* Hero */}
                <section className="rd-hero" ref={heroRef}>
                    <div className="rd-hero-text">
                        <span className="rd-header__label">
                            <span className="material-symbols-outlined" style={{ fontSize: "13px" }}>work</span>
                            Recruiter Console
                        </span>
                        <h1>Welcome{user?.name ? `, ${user.name}` : ""}</h1>
                        <div className="rd-hero-meta">
                            <span className="rd-hero-status">
                                <span className={isPending ? "rd-dot rd-dot-pending" : "rd-dot"} />
                                Account Status: {isPending ? "Pending Verification" : (user?.status || "Active")}
                            </span>
                            <span className="rd-divider">·</span>
                            <span>Nexus Recruiter Tier</span>
                        </div>
                    </div>
                    <button
                        className="rd-primary-button"
                        type="button"
                        onClick={() => navigate("/recruiter/jobs/create")}
                        disabled={!jobCtaState.isAvailable}
                        title={jobCtaState.isPending ? "Account pending approval" : "Create a job post"}
                        data-cy="recruiter-create-job"
                    >
                        <span className="rd-button-icon">{jobCtaState.isPending ? "🔒" : "+"}</span>
                        {jobCtaState.isPending ? "Pending Approval" : "Create Job Post"}
                    </button>
                </section>

                {/* Stats */}
                <section className="rd-stats">
                    <div className="rd-card">
                        <div className="rd-card-header">
                            <span className="rd-icon"><BriefcaseIcon /></span>
                            <span className="rd-pill rd-pill-positive">+{openJobs}</span>
                        </div>
                        <p className="rd-card-label">Total Jobs</p>
                        <p className="rd-card-value">{totalJobs}</p>
                    </div>
                    <div className="rd-card">
                        <div className="rd-card-header">
                            <span className="rd-icon"><CircleCheckIcon /></span>
                        </div>
                        <p className="rd-card-label">Open Jobs</p>
                        <p className="rd-card-value">{openJobs}</p>
                    </div>
                    <div className="rd-card">
                        <div className="rd-card-header">
                            <span className="rd-icon"><LockIcon /></span>
                        </div>
                        <p className="rd-card-label">Closed Jobs</p>
                        <p className="rd-card-value">{closedJobs}</p>
                    </div>
                    <div className="rd-card">
                        <div className="rd-card-header">
                            <span className="rd-icon"><UsersIcon /></span>
                            <span className="rd-pill rd-pill-positive">+{totalApplicants}</span>
                        </div>
                        <p className="rd-card-label">Total Applicants</p>
                        <p className="rd-card-value">{totalApplicants.toLocaleString()}</p>
                    </div>
                </section>

                {/* Table */}
                <section className="rd-table">
                    <div className="rd-table-header">
                        <h2>Active Job Posts</h2>
                        <div className="rd-table-actions">
                            <div className="rd-search">
                                <span className="rd-search-icon"><SearchIcon /></span>
                                <input
                                    type="search"
                                    placeholder="Search posts..."
                                    value={searchTerm}
                                    onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
                                />
                            </div>
                            <button className="rd-filter-button" type="button" disabled aria-label="Filter">
                                <FilterIcon />
                            </button>
                        </div>
                    </div>

                    {loading && (
                        <div className="rd-state">
                            <div className="rd-spinner" />
                            <p>Loading job posts…</p>
                        </div>
                    )}

                    {error && !loading && (
                        <div className="rd-state rd-state-error"><p>{error}</p></div>
                    )}

                    {showEmptyState && (
                        <div className="rd-state">
                            <p>
                                {isPending
                                    ? "Your account is pending verification. You cannot create job posts yet."
                                    : "You haven't posted any jobs yet."}
                            </p>
                        </div>
                    )}

                    {!loading && !error && filteredJobs.length > 0 && (
                        <div className="rd-table-body">
                            <div className="rd-table-row rd-table-head">
                                <span>Job Title</span>
                                <span>AI Category</span>
                                <span>Applications</span>
                                <span>Match Rate</span>
                                <span>Status</span>
                                <span />
                            </div>

                            {paginatedJobs.map((job) => {
                                const category      = job.category || "Other";
                                const applicantCount = applicantCounts[job._id] ?? 0;
                                const statusLabel   = STATUS_LABELS[job.status] || job.status;
                                const statusClass   = STATUS_CLASSES[job.status] || "rd-status";

                                return (
                                    <div
                                        key={job._id}
                                        className="rd-table-row"
                                        role="button"
                                        tabIndex={0}
                                        onClick={() => navigate(`/recruiter/applicants/${job._id}`)}
                                        onKeyDown={(e) => { if (e.key === "Enter") navigate(`/recruiter/applicants/${job._id}`); }}
                                        data-cy={`recruiter-job-row-${job._id}`}
                                    >
                                        <div className="rd-job-title">
                                            <span>{job.title}</span>
                                            <span className="rd-subtext">{formatRelativeDate(job.createdAt)}</span>
                                        </div>

                                        <span className={CATEGORY_STYLES[category] || "rd-badge rd-badge-other"}>
                                            {category}
                                        </span>

                                        <span className="rd-app-count">
                                            <strong>{applicantCount}</strong> applicants
                                        </span>

                                        <span className="rd-match">
                                            {typeof job.matchRate === "number"
                                                ? `${Math.round(job.matchRate)}% Avg.`
                                                : "N/A"}
                                        </span>

                                        <span className={statusClass}>
                                            <span className="rd-dot" />
                                            {statusLabel}
                                        </span>

                                        <div className="rd-actions">
                                            <button
                                                type="button"
                                                className="rd-link"
                                                onClick={(e) => { e.stopPropagation(); navigate(`/recruiter/jobs/${job._id}/edit`); }}
                                            >
                                                Edit
                                            </button>
                                            <button
                                                type="button"
                                                className="rd-link"
                                                onClick={(e) => { e.stopPropagation(); navigate(`/recruiter/applicants/${job._id}`); }}
                                                data-cy={`recruiter-view-applicants-${job._id}`}
                                            >
                                                Applicants
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {!loading && !error && filteredJobs.length > 0 && (
                        <div className="rd-table-footer">
                            <span>
                                Showing {startIndex + 1}–{Math.min(startIndex + pageSize, filteredJobs.length)} of {filteredJobs.length} posts
                            </span>
                            <div className="rd-pagination">
                                <button
                                    type="button"
                                    onClick={() => setPage((p) => Math.max(p - 1, 1))}
                                    disabled={currentPage === 1}
                                >
                                    Previous
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                                    disabled={currentPage === totalPages}
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    )}
                </section>
            </main>

            <Footer />
        </div>
    );
}

export default RecruiterDashboard;