import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import Spinner from '../components/Spinner';
import Modal from '../components/Modal';
import ApplicationStatusBadge from '../components/ApplicationStatusBadge';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import './JobDetailPage.css';

// Dual-theme category colour maps
const CATEGORY_COLORS = {
    dark: {
        'Frontend':         { bg: 'rgba(34,197,94,0.12)',  color: '#4ade80' },
        'Backend':          { bg: 'rgba(59,130,246,0.12)', color: '#60a5fa' },
        'AI/ML':            { bg: 'rgba(255,206,0,0.12)',  color: '#FFCE00' },
        'DevOps':           { bg: 'rgba(20,184,166,0.12)', color: '#2dd4bf' },
        'Data Engineering': { bg: 'rgba(249,115,22,0.12)', color: '#fb923c' },
        'Other':            { bg: 'rgba(156,163,175,0.12)',color: '#9A9690' },
    },
    light: {
        'Frontend':         { bg: '#e8f7ee', color: '#16833a' },
        'Backend':          { bg: '#e8f2ff', color: '#0066cc' },
        'AI/ML':            { bg: '#fff8e0', color: '#8a6400' },
        'DevOps':           { bg: '#ccfbf1', color: '#0f766e' },
        'Data Engineering': { bg: '#fff7e6', color: '#b26a00' },
        'Other':            { bg: '#f0edef', color: '#5a5660' },
    },
};

function JobDetailPage() {
    const { id } = useParams();
    const { user, isAuthenticated } = useAuth();
    const { theme } = useTheme();
    const navigate = useNavigate();

    const [job, setJob]                     = useState(null);
    const [loading, setLoading]             = useState(true);
    const [error, setError]                 = useState('');
    const [myApplication, setMyApplication] = useState(null);
    const [saved, setSaved]                 = useState(false);
    const [saveLoading, setSaveLoading]     = useState(false);

    const [modalOpen, setModalOpen]         = useState(false);
    const [coverLetter, setCoverLetter]     = useState('');
    const [applying, setApplying]           = useState(false);
    const [applyError, setApplyError]       = useState('');
    const [applySuccess, setApplySuccess]   = useState(false);
    const [suggesting, setSuggesting]       = useState(false);
    const [suggestionError, setSuggestionError] = useState('');

    const isJobSeeker = isAuthenticated && user?.role === 'jobSeeker';

    useEffect(() => {
        async function fetchJob() {
            setLoading(true);
            setError('');
            try {
                const res = await api.get(`/jobs/${id}`);
                const jobData = res.data.job || res.data;
                setJob(jobData);
            } catch (err) {
                setError(err.message || 'Failed to load job details.');
            } finally {
                setLoading(false);
            }
        }

        async function fetchSavedState() {
            if (!isJobSeeker) return;
            try {
                const res = await api.get('/jobs/saved');
                const savedJobs = res.data.jobs || res.data || [];
                const isSaved = savedJobs.some(j => (j._id || j) === id);
                setSaved(isSaved);
            } catch (_) {}
        }

        async function fetchMyApplications() {
            if (!isJobSeeker) return;
            try {
                const res = await api.get('/applications/my');
                const apps = res.data.applications || res.data || [];
                const match = apps.find(app => (app.job?._id || app.job) === id);
                if (match) setMyApplication(match);
            } catch (_) {}
        }

        fetchJob();
        fetchSavedState();
        fetchMyApplications();
    }, [id, isJobSeeker]);

    async function handleSaveToggle() {
        if (saveLoading || job?.status !== 'open') return;
        setSaveLoading(true);
        try {
            const res = await api.post(`/jobs/${id}/save`);
            setSaved(res.data.saved);
        } catch (err) {
            console.error('Save toggle failed:', err.message);
        } finally {
            setSaveLoading(false);
        }
    }

    async function handleApply() {
        setApplying(true);
        setApplyError('');
        try {
            const res = await api.post(`/jobs/${id}/apply`, { coverLetter });
            setMyApplication(res.data.application || { status: 'pending' });
            setApplySuccess(true);
            setTimeout(() => {
                closeApplyModal();
                setApplySuccess(false);
            }, 1800);
        } catch (err) {
            setApplyError(err.message || 'Failed to apply. Please try again.');
        } finally {
            setApplying(false);
        }
    }

    async function handleSuggestCoverLetter() {
        if (suggesting) return;

        setSuggesting(true);
        setSuggestionError('');

        try {
            const res = await api.post(`/jobs/${id}/cover-letter-suggestion`);
            const suggestedCoverLetter =
                res.data?.coverLetter ||
                res.data?.suggestion ||
                res.data?.draft ||
                res.data?.text ||
                '';

            setCoverLetter(suggestedCoverLetter);
        } catch (err) {
            setSuggestionError(err.message || 'Failed to generate a cover letter suggestion.');
        } finally {
            setSuggesting(false);
        }
    }

    function closeApplyModal() {
        setModalOpen(false);
        setApplyError('');
        setSuggestionError('');
        setCoverLetter('');
    }

    if (loading) return <><Navbar /><Spinner /></>;

    if (error) {
        return (
            <>
                <Navbar />
                <div className="jd-error-container">
                    <div className="jd-error-box">
                        <span className="jd-error-icon">⚠️</span>
                        <p>{error}</p>
                        <button className="jd-btn-primary" onClick={() => navigate('/jobs')}>
                            Back to Jobs
                        </button>
                    </div>
                </div>
                <Footer />
            </>
        );
    }

    if (!job) return null;

    const categoryPalette = CATEGORY_COLORS[theme] || CATEGORY_COLORS.dark;
    const categoryStyle = categoryPalette[job.category] || categoryPalette['Other'];

    return (
        <div className="jd-page">
            <Navbar />

            <main className="jd-main-container">
                {/* Breadcrumb */}
                <nav className="jd-breadcrumb">
                    <button onClick={() => navigate('/jobs')} className="jd-breadcrumb-link">
                        ← Back to Search
                    </button>
                    <span className="jd-breadcrumb-sep">›</span>
                    <span className="jd-breadcrumb-current">{job.title}</span>
                </nav>

                <div className="jd-grid">
                    {/* Left Column */}
                    <div className="jd-left-col">
                        {/* Header */}
                        <section className="jd-header-section">
                            <div className="jd-header-top">
                                <div className="jd-header-info">
                                    <div className="jd-company-logo">
                                        {job.createdBy?.name?.charAt(0) || 'C'}
                                    </div>
                                    <div>
                                        <h1 className="jd-title">{job.title}</h1>
                                        <p className="jd-subtitle">{job.createdBy?.name || 'Company'}</p>
                                    </div>
                                </div>
                                <div className="jd-badges">
                                    <span
                                        className="jd-category-badge"
                                        style={{ background: categoryStyle.bg, color: categoryStyle.color }}
                                    >
                                        ✦ {job.category || 'Other'}
                                    </span>
                                    {myApplication && (
                                        <span className="jd-applied-badge">✓ Already Applied</span>
                                    )}
                                </div>
                            </div>
                            <div className="jd-meta-pills">
                                <span className="jd-pill">
                                    📋 {job.status?.charAt(0).toUpperCase() + job.status?.slice(1)}
                                </span>
                                {job.type && <span className="jd-pill">⏰ {job.type}</span>}
                                {job.location && <span className="jd-pill">📍 {job.location}</span>}
                                {job.salary && <span className="jd-pill">💰 {job.salary}</span>}
                                {job.totalSlots && <span className="jd-pill">👥 {job.totalSlots} Slots</span>}
                            </div>
                        </section>

                        {/* Description */}
                        <section className="jd-section">
                            <h2 className="jd-section-title">Job Description</h2>
                            <p className="jd-description">{job.description}</p>
                            {job.requirements && job.requirements.length > 0 && (
                                <>
                                    <h3 className="jd-section-subtitle">Requirements</h3>
                                    <ul className="jd-req-list">
                                        {job.requirements.map((req, i) => (
                                            <li key={i} className="jd-req-item">
                                                <span className="jd-req-icon">✦</span>
                                                <span>{req}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </>
                            )}
                        </section>
                    </div>

                    {/* Right Column */}
                    <div className="jd-right-col">
                        <div className="jd-action-card">
                            {myApplication && (
                                <div className="jd-status-section">
                                    <div className="jd-status-row">
                                        <span className="jd-status-label">Application Status</span>
                                        <ApplicationStatusBadge status={myApplication.status} />
                                    </div>
                                    <div className="jd-progress-bar">
                                        <div
                                            className="jd-progress-fill"
                                            style={{
                                                width: myApplication.status === 'pending' ? '33%'
                                                    : myApplication.status === 'shortlisted' ? '66%'
                                                        : '100%'
                                            }}
                                        />
                                    </div>
                                </div>
                            )}

                            <div className="jd-action-buttons">
                                {!isAuthenticated && (
                                    <button className="jd-btn-apply-full" onClick={() => navigate('/login')}>
                                        Login to Apply →
                                    </button>
                                )}
                                {isJobSeeker && !myApplication && job.status === 'open' && (
                                    <button className="jd-btn-apply-full" onClick={() => setModalOpen(true)}>
                                        Apply Now →
                                    </button>
                                )}
                                {isJobSeeker && job.status !== 'open' && !myApplication && (
                                    <button className="jd-btn-apply-full" disabled>Position Closed</button>
                                )}
                                {isJobSeeker && (
                                    <button
                                        className={`jd-btn-save-full ${saved ? 'saved' : ''}`}
                                        onClick={handleSaveToggle}
                                        disabled={saveLoading || job.status !== 'open'}
                                    >
                                        {saved ? '🔖 Saved' : '🔖 Save Job'}
                                    </button>
                                )}
                            </div>

                            <div className="jd-overview">
                                <h4 className="jd-overview-title">Job Overview</h4>
                                <div className="jd-overview-rows">
                                    {job.createdBy?.name && (
                                        <div className="jd-overview-row">
                                            <div className="jd-overview-label-wrap">
                                                <span className="jd-overview-icon">👤</span>
                                                <span className="jd-overview-label">Posted By</span>
                                            </div>
                                            <span className="jd-overview-value">{job.createdBy.name}</span>
                                        </div>
                                    )}
                                    {job.salary && (
                                        <div className="jd-overview-row">
                                            <div className="jd-overview-label-wrap">
                                                <span className="jd-overview-icon">💰</span>
                                                <span className="jd-overview-label">Salary</span>
                                            </div>
                                            <span className="jd-overview-value">{job.salary}</span>
                                        </div>
                                    )}
                                    <div className="jd-overview-row">
                                        <div className="jd-overview-label-wrap">
                                            <span className="jd-overview-icon">✦</span>
                                            <span className="jd-overview-label">Category</span>
                                        </div>
                                        <span
                                            className="jd-mini-badge"
                                            style={{ background: categoryStyle.bg, color: categoryStyle.color }}
                                        >
                                            {job.category || 'Other'}
                                        </span>
                                    </div>
                                    <div className="jd-overview-row">
                                        <div className="jd-overview-label-wrap">
                                            <span className="jd-overview-icon">📋</span>
                                            <span className="jd-overview-label">Status</span>
                                        </div>
                                        <span className={`jd-status-pill ${job.status === 'open' ? 'open' : 'closed'}`}>
                                            {job.status}
                                        </span>
                                    </div>
                                    {job.createdBy?.email && (
                                        <div className="jd-overview-row">
                                            <div className="jd-overview-label-wrap">
                                                <span className="jd-overview-icon">✉</span>
                                                <span className="jd-overview-label">Contact</span>
                                            </div>
                                            <span className="jd-overview-value small">{job.createdBy.email}</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="jd-card-footer">
                                <button className="jd-footer-btn">↗ Share</button>
                                <button className="jd-footer-btn">⚑ Report</button>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            <Footer />

            {/* Apply Modal */}
            <Modal
                isOpen={modalOpen}
                onClose={closeApplyModal}
                title={`Apply for ${job.title}`}
            >
                {applySuccess ? (
                    <div className="jd-apply-success">
                        <span className="jd-success-icon">✅</span>
                        <p>Application submitted successfully!</p>
                    </div>
                ) : (
                    <>
                        <p className="jd-apply-subtitle">
                            Posted by <strong>{job.createdBy?.name}</strong>
                        </p>
                        <button
                            className="jd-btn-secondary"
                            onClick={handleSuggestCoverLetter}
                            disabled={suggesting || applying}
                            type="button"
                            style={{ marginBottom: '12px' }}
                        >
                            {suggesting ? 'Generating suggestion...' : 'Suggest cover letter'}
                        </button>
                        {suggestionError && <p className="jd-apply-error">{suggestionError}</p>}
                        <div className="jd-form-group">
                            <label className="jd-label">
                                Cover Letter <span className="jd-optional">(optional)</span>
                            </label>
                            <textarea
                                className="jd-textarea"
                                rows={6}
                                placeholder="Tell the recruiter why you're a great fit..."
                                value={coverLetter}
                                onChange={e => setCoverLetter(e.target.value)}
                            />
                        </div>
                        {applyError && <p className="jd-apply-error">{applyError}</p>}
                        <div className="jd-modal-actions">
                            <button
                                className="jd-btn-secondary"
                                onClick={closeApplyModal}
                            >
                                Cancel
                            </button>
                            <button
                                className="jd-btn-apply-modal"
                                onClick={handleApply}
                                disabled={applying}
                            >
                                {applying ? 'Submitting...' : 'Submit Application'}
                            </button>
                        </div>
                    </>
                )}
            </Modal>
        </div>
    );
}

export default JobDetailPage;
