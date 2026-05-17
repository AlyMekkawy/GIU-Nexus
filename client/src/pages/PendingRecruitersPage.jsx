import { useCallback, useEffect, useMemo, useState } from "react";
import api from "../services/api";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import "./PendingRecruiters.css";

/* ── Icons ─────────────────────────────────────────────────────────────── */
const SearchIcon = () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
    </svg>
);

const ClockIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
    </svg>
);

const ShieldIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    </svg>
);

const BlockIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/>
    </svg>
);

const MailIcon = () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="4" width="20" height="16" rx="2"/><polyline points="2,4 12,13 22,4"/>
    </svg>
);

const CalendarIcon = () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
    </svg>
);

/* ── Helpers ────────────────────────────────────────────────────────────── */
function formatDate(value) {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    return date.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

function getInitials(name) {
    if (!name) return "R";
    const parts = name.trim().split(" ");
    const first = parts[0]?.[0] || "";
    const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
    return `${first}${last}`.toUpperCase() || "R";
}

/* ── Config per status tab ──────────────────────────────────────────────── */
const TAB_CONFIG = {
    pending: {
        label:       "Pending Approvals",
        icon:        <ClockIcon />,
        roleLabel:   "Recruiter account pending approval",
        roleBadge:   null,
        actions: [
            { key: "reject",  label: "Reject",  nextStatus: "rejected",  variant: "outline-danger" },
            { key: "approve", label: "Approve", nextStatus: "approved",  variant: "solid-primary"  },
        ],
    },
    approved: {
        label:       "Active Recruiters",
        icon:        <ShieldIcon />,
        roleLabel:   "Active recruiter",
        roleBadge:   { text: "Active", className: "prp-badge prp-badge-success" },
        actions: [
            { key: "block", label: "Block", nextStatus: "rejected", variant: "outline-danger" },
        ],
    },
    rejected: {
        label:       "Blocked Entities",
        icon:        <BlockIcon />,
        roleLabel:   "Blocked recruiter",
        roleBadge:   { text: "Blocked", className: "prp-badge prp-badge-danger" },
        actions: [
            { key: "approve", label: "Reinstate", nextStatus: "approved", variant: "outline-primary" },
        ],
    },
};

/* ── Component ──────────────────────────────────────────────────────────── */
function PendingRecruitersPage() {
    const [recruiters,    setRecruiters]    = useState([]);
    const [loading,       setLoading]       = useState(true);
    const [error,         setError]         = useState("");
    const [searchTerm,    setSearchTerm]    = useState("");
    const [actionLoading, setActionLoading] = useState({});
    const [actionError,   setActionError]   = useState("");
    const [statusFilter,  setStatusFilter]  = useState("pending");

    const fetchRecruiters = useCallback(async (status) => {
        setLoading(true);
        setError("");
        try {
            const response = await api.get("/users", { params: { role: "recruiter", status } });
            setRecruiters(response?.data?.users || []);
        } catch (err) {
            setError(err?.message || "Failed to load recruiters.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchRecruiters(statusFilter);
        setSearchTerm("");
        setActionError("");
    }, [fetchRecruiters, statusFilter]);

    const handleStatusChange = useCallback(async (userId, nextStatus) => {
        setActionError("");
        setActionLoading((prev) => ({ ...prev, [userId]: true }));
        try {
            await api.patch(`/users/${userId}/status`, { status: nextStatus });
            setRecruiters((prev) => prev.filter((u) => u._id !== userId));
        } catch (err) {
            setActionError(err?.message || "Failed to update recruiter status.");
        } finally {
            setActionLoading((prev) => ({ ...prev, [userId]: false }));
        }
    }, []);

    const normalizedSearch = searchTerm.trim().toLowerCase();
    const filteredRecruiters = useMemo(() => {
        if (!normalizedSearch) return recruiters;
        return recruiters.filter((u) => {
            const name  = u.name?.toLowerCase()  || "";
            const email = u.email?.toLowerCase() || "";
            return name.includes(normalizedSearch) || email.includes(normalizedSearch);
        });
    }, [recruiters, normalizedSearch]);

    const tabCfg = TAB_CONFIG[statusFilter];

    return (
        <div className="prp-page">
            <Navbar />
            <main className="prp-container">

                {/* Page header */}
                <header className="prp-header">
                    <div>
                        <h1>Pending Recruiters</h1>
                        <p>Review and manage employer access requests for the GIU Nexus network.</p>
                    </div>
                </header>

                <section className="prp-layout">

                    {/* Sidebar */}
                    <aside className="prp-sidebar">
                        <p className="prp-sidebar-title">Admin Controls</p>
                        {Object.entries(TAB_CONFIG).map(([key, cfg]) => (
                            <button
                                key={key}
                                type="button"
                                className={`prp-nav${statusFilter === key ? " active" : ""}`}
                                onClick={() => setStatusFilter(key)}
                            >
                                <span className="prp-nav-icon">{cfg.icon}</span>
                                {cfg.label}
                            </button>
                        ))}
                    </aside>

                    {/* Main content */}
                    <section className="prp-content">

                        {/* Content header with search + count */}
                        <div className="prp-content-header">
                            <div className="prp-content-title">
                                <span className="prp-content-icon">{tabCfg.icon}</span>
                                <span>{tabCfg.label}</span>
                                {!loading && (
                                    <span className="prp-count">{filteredRecruiters.length}</span>
                                )}
                            </div>
                            <div className="prp-search">
                                <span className="prp-search-icon"><SearchIcon /></span>
                                <input
                                    type="search"
                                    placeholder="Search recruiters..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>

                        {/* Error banners */}
                        {error && !loading && (
                            <div className="prp-state prp-state-error"><p>{error}</p></div>
                        )}
                        {actionError && (
                            <div className="prp-state prp-state-error"><p>{actionError}</p></div>
                        )}

                        {/* Loading */}
                        {loading && (
                            <div className="prp-state">
                                <div className="prp-spinner" />
                                <p>Loading recruiters…</p>
                            </div>
                        )}

                        {/* Empty */}
                        {!loading && !error && filteredRecruiters.length === 0 && (
                            <div className="prp-state">
                                <p>No recruiters found{normalizedSearch ? " matching your search" : " for this status"}.</p>
                            </div>
                        )}

                        {/* Cards */}
                        {!loading && !error && filteredRecruiters.length > 0 && (
                            <div className="prp-cards">
                                {filteredRecruiters.map((user) => {
                                    const isUpdating = !!actionLoading[user._id];
                                    const badge      = tabCfg.roleBadge;

                                    return (
                                        <article key={user._id} className="prp-card">
                                            {/* Avatar */}
                                            <div className="prp-avatar" aria-hidden="true">
                                                {getInitials(user.name)}
                                            </div>

                                            {/* Info */}
                                            <div className="prp-info">
                                                <div className="prp-name-row">
                                                    <h3>{user.name || "Recruiter"}</h3>
                                                    {badge && (
                                                        <span className={badge.className}>{badge.text}</span>
                                                    )}
                                                </div>
                                                <p className="prp-role">
                                                    {user.jobTitle
                                                        ? <>{user.jobTitle} at <strong>{user.company}</strong></>
                                                        : tabCfg.roleLabel}
                                                </p>
                                                <div className="prp-meta">
                                                    <span className="prp-meta-item">
                                                        <MailIcon />{user.email}
                                                    </span>
                                                    <span className="prp-meta-item">
                                                        <CalendarIcon />{formatDate(user.createdAt)}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Context-aware actions */}
                                            <div className="prp-actions">
                                                {tabCfg.actions.map((action) => (
                                                    <button
                                                        key={action.key}
                                                        type="button"
                                                        className={`prp-btn prp-btn-${action.variant}`}
                                                        onClick={() => handleStatusChange(user._id, action.nextStatus)}
                                                        disabled={isUpdating}
                                                    >
                                                        {isUpdating ? "…" : action.label}
                                                    </button>
                                                ))}
                                            </div>
                                        </article>
                                    );
                                })}
                            </div>
                        )}
                    </section>
                </section>
            </main>
            <Footer />
        </div>
    );
}

export default PendingRecruitersPage;