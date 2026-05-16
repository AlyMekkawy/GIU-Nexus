import './ApplicationStatusBadge.css';

const STATUS_CONFIG = {
    pending:     { label: 'Pending',     className: 'badge-pending' },
    shortlisted: { label: 'Shortlisted', className: 'badge-shortlisted' },
    rejected:    { label: 'Rejected',    className: 'badge-rejected' },
};

function ApplicationStatusBadge({ status }) {
    const config = STATUS_CONFIG[status] || { label: status, className: 'badge-pending' };
    return (
        <span className={`app-status-badge ${config.className}`}>
            {config.label}
        </span>
    );
}

export default ApplicationStatusBadge;