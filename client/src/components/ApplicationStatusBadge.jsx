import "./ApplicationStatusBadge.css";

const STATUS_STYLES = {
  pending:     { label: "Pending",     className: "badge--pending" },
  shortlisted: { label: "Shortlisted", className: "badge--shortlisted" },
  rejected:    { label: "Rejected",    className: "badge--rejected" },
};

export default function ApplicationStatusBadge({ status }) {
  const config = STATUS_STYLES[status] ?? { label: status, className: "" };
  return (
    <span className={`app-status-badge ${config.className}`}>
      {config.label}
    </span>
  );
}
