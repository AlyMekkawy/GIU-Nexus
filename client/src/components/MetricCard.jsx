// components/MetricCard.jsx
// Reusable summary metric card for Admin and Recruiter dashboards.
//
// Props:
//   icon       — JSX element (SVG icon)
//   label      — string, e.g. "Total Users"
//   value      — string or number to display large
//   trendText  — string, e.g. "12 job seekers · 4 recruiters"
//   trendClass — "up" | "warn" | "down" | "muted"

import "./MetricCard.css";

function MetricCard({ icon, label, value, trendText, trendClass = "muted" }) {
  return (
    <div className="metric-card">
      <div>
        <div className="metric-card-icon" aria-hidden="true">
          {icon}
        </div>
        <div className="metric-card-label">{label}</div>
      </div>
      <div>
        <div className="metric-card-value">{value}</div>
        <div className={`metric-card-trend ${trendClass}`} aria-label={trendText}>
          {trendText}
        </div>
      </div>
    </div>
  );
}

export default MetricCard;
