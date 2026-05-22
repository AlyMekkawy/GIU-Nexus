import "./RecruiterAccessNotice.css";

const LockIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect x="4" y="10" width="16" height="10" rx="2" />
        <path d="M7 10V7a5 5 0 0 1 10 0v3" />
    </svg>
);

function RecruiterAccessNotice({
    onReturnToDashboard,
    contactHref = "mailto:support@giu-nexus.com?subject=Recruiter%20verification%20support",
}) {
    return (
        <section className="rac-card" role="status" aria-live="polite">
            <div className="rac-card__icon" aria-hidden="true">
                <LockIcon />
            </div>
            <p className="rac-card__eyebrow">Recruiter access restricted</p>
            <h1 className="rac-card__title">Recruiter Verification Pending</h1>
            <p className="rac-card__body">
                Your recruiter account is currently under review. You’ll be able to post jobs once your account has been approved.
            </p>

            <div className="rac-card__actions">
                <button type="button" className="rac-card__primary" onClick={onReturnToDashboard}>
                    Return to Dashboard
                </button>
                <a className="rac-card__secondary" href={contactHref}>
                    Contact Support
                </a>
            </div>
        </section>
    );
}

export default RecruiterAccessNotice;


