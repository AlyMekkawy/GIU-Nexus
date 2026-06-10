import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { gsap } from 'gsap';
import api from '../services/api';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import './ApplicantsPage.css';

/* ── Helpers ────────────────────────────────────────────────────────────── */
function getInitials(name) {
    if (!name) return '?';
    return name.trim().split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

/* ── Component ──────────────────────────────────────────────────────────── */
function ApplicantsPage() {
    const { jobId }   = useParams();
    const navigate    = useNavigate();
    const headerRef   = useRef(null);

    const [applications, setApplications] = useState([]);
    const [jobTitle,     setJobTitle]     = useState('');
    const [loading,      setLoading]      = useState(true);
    const [error,        setError]        = useState('');
    const [updatingId,   setUpdatingId]   = useState(null);
    const [updateError,  setUpdateError]  = useState('');
    const [summary,      setSummary]      = useState(null);
    const [summaryLoading, setSummaryLoading] = useState(false);
    const [summaryError,   setSummaryError]   = useState('');

    useEffect(() => {
        let isMounted = true;
        async function fetchData() {
            setLoading(true);
            setError('');
            try {
                const [appsRes, jobRes] = await Promise.all([
                    api.get(`/jobs/${jobId}/applicants`),
                    api.get(`/jobs/${jobId}`),
                ]);
                if (!isMounted) return;
                setApplications(appsRes.data.applications || []);
                setJobTitle((jobRes.data.job || jobRes.data)?.title || 'Job');
            } catch (err) {
                if (!isMounted) return;
                setError(err.message || 'Failed to load applicants.');
            } finally {
                if (isMounted) setLoading(false);
            }
        }
        fetchData();
        return () => { isMounted = false; };
    }, [jobId]);

    // Header entrance
    useEffect(() => {
        if (loading || !headerRef.current) return;
        gsap.fromTo(
            headerRef.current.children,
            { y: 16, opacity: 0 },
            { y: 0, opacity: 1, duration: 0.5, stagger: 0.07, ease: 'power3.out' }
        );
    }, [loading]);

    async function handleGenerateSummary() {
        setSummaryLoading(true);
        setSummaryError('');
        setSummary(null);
        try {
            const res = await api.get(`/jobs/${jobId}/applicant-summary`);
            setSummary(res.data.summary);
        } catch (err) {
            setSummaryError(err.response?.data?.message || err.message || 'Failed to generate summary.');
        } finally {
            setSummaryLoading(false);
        }
    }

    async function handleStatusChange(applicationId, newStatus) {
        setUpdatingId(applicationId);
        setUpdateError('');
        try {
            const res = await api.patch(`/applications/${applicationId}/status`, { status: newStatus });
            const updated = res.data.application;
            setApplications(prev =>
                prev.map(app => app._id === applicationId ? { ...app, status: updated.status } : app)
            );
        } catch (err) {
            setUpdateError(err.message || 'Failed to update status.');
        } finally {
            setUpdatingId(null);
        }
    }

    /* ── Loading ─────────────────────────────────────────────────────────── */
    if (loading) {
        return (
            <div className="ap-page">
                <Navbar />
                <main className="ap-container">
                    <div className="ap-state">
                        <div className="ap-spinner" />
                        <p>Loading applicants…</p>
                    </div>
                </main>
                <Footer />
            </div>
        );
    }

    /* ── Error ───────────────────────────────────────────────────────────── */
    if (error) {
        return (
            <div className="ap-page">
                <Navbar />
                <main className="ap-container">
                    <div className="ap-state ap-state-error">
                        <span className="material-symbols-outlined" style={{ fontSize: '2.5rem' }}>error</span>
                        <p>{error}</p>
                        <button className="ap-btn-primary" onClick={() => navigate('/recruiter/dashboard')}>
                            Back to Dashboard
                        </button>
                    </div>
                </main>
                <Footer />
            </div>
        );
    }

    /* ── Nexi display helpers (pure presentation, no logic) ─────────────── */
    const nexiSpeech = summary
        ? summary.strong > 0
            ? `I scanned this pool and found ${summary.strong} high-signal candidate${summary.strong !== 1 ? 's' : ''} worth reviewing first.`
            : `I scanned this pool. No standout candidates yet — here's what I found.`
        : '';
    const nexiVerdict = (() => {
        if (!summary) return '';
        const size = summary.total < 5 ? 'Small' : summary.total < 15 ? 'Moderate' : 'Large';
        const gaps = summary.missingSkills.slice(0, 3).join(', ');
        return summary.strong > 0
            ? `${size} applicant pool — ${summary.strong === 1 ? 'one candidate shows' : `${summary.strong} candidates show`} strong alignment with this role.${gaps ? ` Main gaps across the pool: ${gaps}.` : ''}`
            : `${size} applicant pool with no standout signals yet.${gaps ? ` Most applicants are missing ${gaps}.` : ''}`;
    })();

    /* ── Main ────────────────────────────────────────────────────────────── */
    return (
        <div className="ap-page">
            <Navbar />
            <main className="ap-container">

                {/* Header */}
                <header className="ap-header" ref={headerRef}>
                    <div className="ap-header-left">
                        <nav className="ap-breadcrumb" aria-label="breadcrumb">
                            <button
                                className="ap-breadcrumb-link"
                                onClick={() => navigate('/recruiter/dashboard')}
                            >
                                Recruiter Dashboard
                            </button>
                            <span className="ap-breadcrumb-sep" aria-hidden="true">›</span>
                            <span>Applicants</span>
                        </nav>
                        <span className="ap-header__label">
                            <span className="material-symbols-outlined" style={{ fontSize: '13px' }}>group</span>
                            Applicant Review
                        </span>
                        <h1 className="ap-title">{jobTitle}</h1>
                        <p className="ap-subtitle">
                            {applications.length} applicant{applications.length !== 1 ? 's' : ''} for this role
                        </p>
                    </div>
                    <div className="ap-header-actions">
                        <button className="ap-btn-back" onClick={() => navigate('/recruiter/dashboard')}>
                            <span className="material-symbols-outlined">arrow_back</span>
                            Dashboard
                        </button>
                        {applications.length > 0 && (
                            <button
                                className="ap-btn-summary"
                                onClick={handleGenerateSummary}
                                disabled={summaryLoading}
                            >
                                <div className="ap-nexi-btn-img-wrap">
                                    <img
                                        src={summaryLoading ? '/Nexi/Nexi_InsightB.png' : '/Nexi/Nexi_Summarize.png'}
                                        alt="Nexi"
                                        className={`ap-nexi-btn-img${summaryLoading ? ' ap-btn-nexi-spin' : ''}`}
                                    />
                                </div>
                                <div className="ap-nexi-btn-text">
                                    <span className="ap-nexi-btn-label">
                                        {summaryLoading ? 'Analyzing…' : 'Ask Nexi'}
                                    </span>
                                    <span className="ap-nexi-btn-sub">
                                        {summaryLoading ? 'Scanning the applicant pool' : 'Analyze applicants'}
                                    </span>
                                </div>
                            </button>
                        )}
                    </div>
                </header>

                {/* Nexi summary panel */}
                {summaryError && (
                    <div className="ap-update-error" role="alert">
                        <span className="material-symbols-outlined">warning</span>
                        {summaryError}
                    </div>
                )}
                {summary && (
                    <div className="ap-summary-panel">

                        {/* Floating close */}
                        <button className="ap-summary-close" onClick={() => setSummary(null)} aria-label="Close">
                            <span className="material-symbols-outlined">close</span>
                        </button>

                        {/* Two-column: Nexi assistant left, content right */}
                        <div className="ap-summary-layout">

                            {/* ── Left: mascot + speech bubble ── */}
                            <div className="ap-nexi-col">
                                <img src="/Nexi/Nexi_Summarize.png" alt="Nexi" className="ap-nexi-large" />
                                <div className="ap-nexi-bubble">
                                    <p>{nexiSpeech}</p>
                                </div>
                            </div>

                            {/* ── Right: all content ── */}
                            <div className="ap-summary-content">

                                {/* Title */}
                                <h2 className="ap-summary-title">Nexi Applicant Intel</h2>

                                {/* Stats */}
                                <div className="ap-summary-stats">
                                    <div className="ap-stat-card ap-stat-total">
                                        <span className="ap-stat-value">{summary.total}</span>
                                        <span className="ap-stat-label">Pool Size</span>
                                    </div>
                                    <div className="ap-stat-card ap-stat-strong">
                                        <span className="ap-stat-value">{summary.strong}</span>
                                        <span className="ap-stat-label">Ready to Review</span>
                                    </div>
                                    <div className="ap-stat-card ap-stat-medium">
                                        <span className="ap-stat-value">{summary.medium}</span>
                                        <span className="ap-stat-label">Maybe Later</span>
                                    </div>
                                    <div className="ap-stat-card ap-stat-weak">
                                        <span className="ap-stat-value">{summary.weak}</span>
                                        <span className="ap-stat-label">Needs Development</span>
                                    </div>
                                    <div className="ap-stat-card ap-stat-avg">
                                        <span className="ap-stat-value">{summary.averageScore}%</span>
                                        <span className="ap-stat-label">Overall Fit</span>
                                    </div>
                                </div>

                                {/* Nexi verdict card */}
                                <div className="ap-verdict-card">
                                    <span className="ap-verdict-label">
                                        <span className="material-symbols-outlined">verified</span>
                                        Nexi Verdict
                                    </span>
                                    <p className="ap-verdict-text">{nexiVerdict}</p>
                                </div>

                                {/* Sections */}
                                <div className="ap-summary-body">

                                    {/* Top skills */}
                                    <div className="ap-summary-section">
                                        <h3 className="ap-summary-section-title">
                                            <img src="/Nexi/Nexi_Insight.png" alt="" className="ap-nexi-section-icon" />
                                            What Nexi noticed
                                        </h3>
                                        {summary.topSkills.length > 0 ? (
                                            <div className="ap-summary-skills">
                                                {summary.topSkills.map(({ skill, count }) => (
                                                    <span key={skill} className="ap-summary-skill-chip">
                                                        {skill}
                                                        <span className="ap-summary-skill-count">{count}</span>
                                                    </span>
                                                ))}
                                            </div>
                                        ) : <p className="ap-summary-empty">No skill data available.</p>}
                                    </div>

                                    {/* Missing skills */}
                                    <div className="ap-summary-section">
                                        <h3 className="ap-summary-section-title">
                                            <img src="/Nexi/Nexi_Insight.png" alt="" className="ap-nexi-section-icon" />
                                            Where the pool is weak
                                        </h3>
                                        {summary.missingSkills.length > 0 ? (
                                            <div className="ap-summary-skills">
                                                {summary.missingSkills.map(skill => (
                                                    <span key={skill} className="ap-summary-skill-chip ap-summary-skill-missing">{skill}</span>
                                                ))}
                                            </div>
                                        ) : <p className="ap-summary-empty">All requirements are well-covered.</p>}
                                    </div>

                                    {/* Recommended */}
                                    <div className="ap-summary-section">
                                        <h3 className="ap-summary-section-title">
                                            <img src="/Nexi/Nexi_Discover.png" alt="" className="ap-nexi-section-icon" />
                                            Who Nexi would review first
                                        </h3>
                                        {summary.recommended.length > 0 ? (
                                            <div className="ap-recommended-list">
                                                {summary.recommended.map((rec, i) => (
                                                    <div key={rec._id} className="ap-recommended-item">
                                                        <div className="ap-recommended-rank">#{i + 1}</div>
                                                        <div className="ap-avatar ap-avatar-sm">{getInitials(rec.name)}</div>
                                                        <div className="ap-recommended-info">
                                                            <span className="ap-recommended-name">{rec.name}</span>
                                                            <span className="ap-recommended-email">{rec.email}</span>
                                                        </div>
                                                        <div className="ap-recommended-score">
                                                            <span className="ap-score-badge">{rec.score}%</span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : <p className="ap-summary-empty">No strong candidates found.</p>}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Update error banner */}
                {updateError && (
                    <div className="ap-update-error" role="alert">
                        <span className="material-symbols-outlined">warning</span>
                        {updateError}
                    </div>
                )}

                {/* Empty state */}
                {applications.length === 0 ? (
                    <div className="ap-empty">
                        <div className="ap-empty__icon-wrap">
                            <span className="material-symbols-outlined">group</span>
                        </div>
                        <h2 className="ap-empty__title">No applicants yet</h2>
                        <p className="ap-empty__body">
                            Wait for candidates to apply, or share your job listing to increase visibility.
                        </p>
                    </div>
                ) : (
                    <>
                        {/* Desktop table */}
                        <div className="ap-table-wrapper">
                            <table className="ap-table">
                                <thead>
                                    <tr>
                                        <th>Applicant</th>
                                        <th>Skills</th>
                                        <th>Status</th>
                                        <th className="ap-th-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {applications.map(app => (
                                        <tr key={app._id} className="ap-row">

                                            {/* Applicant */}
                                            <td className="ap-td">
                                                <div className="ap-applicant-cell">
                                                    <div className="ap-avatar" aria-hidden="true">
                                                        {getInitials(app.user?.name)}
                                                    </div>
                                                    <div>
                                                        <div className="ap-name">{app.user?.name || 'Unknown'}</div>
                                                        <div className="ap-email">{app.user?.email || ''}</div>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Skills */}
                                            <td className="ap-td">
                                                <div className="ap-skills-wrap">
                                                    {app.user?.skills?.length > 0 ? (
                                                        <>
                                                            {app.user.skills.slice(0, 2).map((skill, i) => (
                                                                <span key={i} className="ap-skill-chip">{skill}</span>
                                                            ))}
                                                            {app.user.skills.length > 2 && (
                                                                <span className="ap-skill-more">+{app.user.skills.length - 2}</span>
                                                            )}
                                                        </>
                                                    ) : (
                                                        <span className="ap-no-skills">—</span>
                                                    )}
                                                </div>
                                            </td>

                                            {/* Status badge */}
                                            <td className="ap-td">
                                                <span className={`ap-status-badge ap-status-${app.status}`}>
                                                    {app.status === 'pending'     && <span className="material-symbols-outlined">schedule</span>}
                                                    {app.status === 'shortlisted' && <span className="material-symbols-outlined">check_circle</span>}
                                                    {app.status === 'rejected'    && <span className="material-symbols-outlined">cancel</span>}
                                                    {app.status?.charAt(0).toUpperCase() + app.status?.slice(1)}
                                                </span>
                                            </td>

                                            {/* Actions */}
                                            <td className="ap-td ap-td-right">
                                                <div className="ap-actions">
                                                    {app.status !== 'shortlisted' && (
                                                        <button
                                                            className="ap-action-btn ap-action-shortlist"
                                                            title="Shortlist"
                                                            disabled={updatingId === app._id}
                                                            onClick={() => handleStatusChange(app._id, 'shortlisted')}
                                                            aria-label="Shortlist applicant"
                                                        >
                                                            <span className="material-symbols-outlined">check</span>
                                                        </button>
                                                    )}
                                                    {app.status !== 'rejected' && (
                                                        <button
                                                            className="ap-action-btn ap-action-reject"
                                                            title="Reject"
                                                            disabled={updatingId === app._id}
                                                            onClick={() => handleStatusChange(app._id, 'rejected')}
                                                            aria-label="Reject applicant"
                                                        >
                                                            <span className="material-symbols-outlined">close</span>
                                                        </button>
                                                    )}
                                                    {app.status === 'rejected' && (
                                                        <button
                                                            className="ap-action-btn ap-action-undo"
                                                            title="Reconsider"
                                                            disabled={updatingId === app._id}
                                                            onClick={() => handleStatusChange(app._id, 'pending')}
                                                            aria-label="Reconsider applicant"
                                                        >
                                                            <span className="material-symbols-outlined">undo</span>
                                                        </button>
                                                    )}
                                                    {updatingId === app._id && (
                                                        <span className="ap-saving-dot" aria-label="Saving" />
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Mobile cards */}
                        <div className="ap-mobile-cards">
                            {applications.map(app => (
                                <div key={app._id} className="ap-mobile-card">
                                    <div className="ap-mobile-card-top">
                                        <div className="ap-applicant-cell">
                                            <div className="ap-avatar ap-avatar-lg" aria-hidden="true">
                                                {getInitials(app.user?.name)}
                                            </div>
                                            <div>
                                                <h3 className="ap-name">{app.user?.name || 'Unknown'}</h3>
                                                <p className="ap-email">{app.user?.email || ''}</p>
                                            </div>
                                        </div>
                                        <span className={`ap-status-badge ap-status-${app.status}`}>
                                            {app.status?.charAt(0).toUpperCase() + app.status?.slice(1)}
                                        </span>
                                    </div>

                                    <div className="ap-skills-wrap ap-mobile-skills">
                                        {(app.user?.skills ?? []).slice(0, 3).map((skill, i) => (
                                            <span key={i} className="ap-skill-chip">{skill}</span>
                                        ))}
                                    </div>

                                    <div className="ap-mobile-actions">
                                        {app.status !== 'shortlisted' && (
                                            <button
                                                className="ap-mobile-btn ap-mobile-shortlist"
                                                disabled={updatingId === app._id}
                                                onClick={() => handleStatusChange(app._id, 'shortlisted')}
                                            >
                                                <span className="material-symbols-outlined">check</span>
                                                Shortlist
                                            </button>
                                        )}
                                        {app.status !== 'rejected' && (
                                            <button
                                                className="ap-mobile-btn ap-mobile-reject"
                                                disabled={updatingId === app._id}
                                                onClick={() => handleStatusChange(app._id, 'rejected')}
                                            >
                                                <span className="material-symbols-outlined">close</span>
                                                Reject
                                            </button>
                                        )}
                                        {app.status === 'rejected' && (
                                            <button
                                                className="ap-mobile-btn ap-mobile-undo"
                                                disabled={updatingId === app._id}
                                                onClick={() => handleStatusChange(app._id, 'pending')}
                                            >
                                                <span className="material-symbols-outlined">undo</span>
                                                Reconsider
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Footer count */}
                        <div className="ap-footer-row">
                            <p className="ap-footer-count">
                                Showing all {applications.length} applicant{applications.length !== 1 ? 's' : ''}
                            </p>
                        </div>
                    </>
                )}
            </main>
            <Footer />
        </div>
    );
}

export default ApplicantsPage;
