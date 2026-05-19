// components/UsersByRoleChart.jsx
// Admin-specific bar chart showing user distribution by role.
// Extracted from AdminDashboard so the page file stays clean.
//
// Props:
//   usersByRole — object: { jobSeeker: N, recruiter: N, admin: N }
//
// Styling uses CSS classes defined in AdminDashboard.css

const BAR_CONFIG = [
  { key: "jobSeeker", label: "Job Seekers", color: "#0066cc" },
  { key: "recruiter", label: "Recruiters",  color: "#6b3fd1" },
  { key: "admin",     label: "Admins",      color: "#8a8a8e" },
];

function UsersByRoleChart({ usersByRole = {} }) {
  const max = Math.max(1, ...BAR_CONFIG.map((b) => usersByRole[b.key] || 0));
  const hasData = BAR_CONFIG.some((b) => (usersByRole[b.key] || 0) > 0);

  if (!hasData) {
    return (
      <div style={{ textAlign: "center", padding: "32px 0", color: "#6e6e73", fontSize: 14 }}>
        No user data yet.
      </div>
    );
  }

  return (
    <div
      className="adm-bar-chart"
      role="img"
      aria-label="Bar chart: users by role"
    >
      {BAR_CONFIG.map(({ key, label, color }) => {
        const val = usersByRole[key] || 0;
        const heightPct = Math.round((val / max) * 100);

        return (
          <div className="adm-bar-col" key={key}>
            <div className="adm-bar-count">{val.toLocaleString()}</div>
            <div className="adm-bar-track">
              <div
                className="adm-bar-fill"
                style={{ height: `${heightPct}%`, background: color }}
                role="progressbar"
                aria-valuenow={val}
                aria-valuemin={0}
                aria-valuemax={max}
                aria-label={`${label}: ${val}`}
              />
            </div>
            <div className="adm-bar-label">{label}</div>
          </div>
        );
      })}
    </div>
  );
}

export default UsersByRoleChart;
