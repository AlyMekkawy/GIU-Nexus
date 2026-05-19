import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import Spinner from '../components/Spinner';
import './ApplicantsPage.css';

function ApplicantsPage() {
    const { jobId } = useParams();
    const navigate = useNavigate();

    const [applications, setApplications] = useState([]);
    const [jobTitle, setJobTitle]         = useState('');
    const [loading, setLoading]           = useState(true);
    const [error, setError]               = useState('');
    const [updatingId, setUpdatingId]     = useState(null);
    const [updateError, setUpdateError]   = useState('');

    useEffect(() => {
        async function fetchData() {
            setLoading(true);
            setError('');
            try {
                const [appsRes, jobRes] = await Promise.all([
                    api.get(`/jobs/${jobId}/applicants`),
                    api.get(`/jobs/${jobId}`)
                ]);
                setApplications(appsRes.data.applications || []);
                setJobTitle((jobRes.data.job || jobRes.data)?.title || 'Job');
            } catch (err) {
                setError(err.message || 'Failed to load applicants.');
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, [jobId]);

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

    function getInitials(name) {
        if (!name) return '?';
        return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    }

    if (loading) return <Spinner />;

    if (error) {
        return (
            <div className="ap-error-container">
                <div className="ap-error-box">
                    <span className="ap-error-icon">⚠️</span>
                    <p>{error}</p>
                    <button className="ap-btn-primary" onClick={() => navigate('/recruiter/dashboard')}>
                        Back to Dashboard
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="ap-page">
            <div className="ap-container">

                {/* Context Header */}
                <header className="ap-header">
                    <div className="ap-header-left">
                        <nav className="ap-breadcrumb">
                            <button className="ap-breadcrumb-link" onClick={() => navigate('/recruiter/dashboard')}>
                                Recruiter Dashboard
                            </button>
                            <span className="ap-breadcrumb-sep">›</span>
                            <span>Jobs</span>
                        </nav>
                        <h1 className="ap-title">{jobTitle}</h1>
                        <p className="ap-subtitle">
                            Manage {applications.length} applicant{applications.length !== 1 ? 's' : ''} for this role
                        </p>
                    </div>
                    <div className="ap-header-actions">
                        <button className="ap-btn-filter">
                            ☰ Filters
                        </button>
                        <button className="ap-btn-share">
                            ↗ Share Link
                        </button>
                    </div>
                </header>

                {/* Update error */}
                {updateError && (
                    <div className="ap-update-error">⚠️ {updateError}</div>
                )}

                {/* Empty state */}
                {applications.length === 0 ? (
                    <div className="ap-empty">
                        <span className="ap-empty-icon">👥</span>
                        <h2 className="ap-empty-title">No applicants yet</h2>
                        <p className="ap-empty-text">Wait for candidates to apply or share your job link to increase visibility.</p>
                        <button className="ap-btn-primary">Share Job Link</button>
                    </div>
                ) : (
                    <>
                        {/* Desktop Table */}
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
                                                <div className="ap-avatar">
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
                                                {app.user?.skills && app.user.skills.length > 0 ? (
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

                                        {/* Status Badge */}
                                        <td className="ap-td">
                                                <span className={`ap-status-badge ap-status-${app.status}`}>
                                                    {app.status === 'pending' && '⏱ '}
                                                    {app.status === 'shortlisted' && '✓ '}
                                                    {app.status === 'rejected' && '✕ '}
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
                                                    >
                                                        ✓
                                                    </button>
                                                )}
                                                {app.status !== 'rejected' && (
                                                    <button
                                                        className="ap-action-btn ap-action-reject"
                                                        title="Reject"
                                                        disabled={updatingId === app._id}
                                                        onClick={() => handleStatusChange(app._id, 'rejected')}
                                                    >
                                                        ✕
                                                    </button>
                                                )}
                                                {app.status === 'rejected' && (
                                                    <button
                                                        className="ap-action-btn ap-action-undo"
                                                        title="Reconsider"
                                                        disabled={updatingId === app._id}
                                                        onClick={() => handleStatusChange(app._id, 'pending')}
                                                    >
                                                        ↩
                                                    </button>
                                                )}
                                                <button className="ap-action-btn ap-action-view" title="View Profile">
                                                    👁
                                                </button>
                                                {updatingId === app._id && (
                                                    <span className="ap-saving">saving...</span>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Mobile Cards */}
                        <div className="ap-mobile-cards">
                            {applications.map(app => (
                                <div key={app._id} className="ap-mobile-card">
                                    <div className="ap-mobile-card-top">
                                        <div className="ap-applicant-cell">
                                            <div className="ap-avatar ap-avatar-lg">
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
                                                ✓ Shortlist
                                            </button>
                                        )}
                                        {app.status !== 'rejected' && (
                                            <button
                                                className="ap-mobile-btn ap-mobile-reject"
                                                disabled={updatingId === app._id}
                                                onClick={() => handleStatusChange(app._id, 'rejected')}
                                            >
                                                ✕ Reject
                                            </button>
                                        )}
                                        {app.status === 'rejected' && (
                                            <button
                                                className="ap-mobile-btn ap-mobile-undo"
                                                disabled={updatingId === app._id}
                                                onClick={() => handleStatusChange(app._id, 'pending')}
                                            >
                                                ↩ Reconsider
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Pagination */}
                        <div className="ap-pagination">
                            <p className="ap-pagination-text">
                                Showing 1–{applications.length} of {applications.length} applicants
                            </p>
                            <div className="ap-pagination-btns">
                                <button className="ap-page-btn" disabled>‹</button>
                                <button className="ap-page-btn">›</button>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

export default ApplicantsPage;


