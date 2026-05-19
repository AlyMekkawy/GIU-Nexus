// components/TopJobsLeaderboard.jsx
// Ranked leaderboard of top jobs by application count.
// Used in AdminDashboard right panel.
//
// Props:
//   topJobs — array from backend: [{ _id, title, company, applicationCount }]
//
// Styling uses CSS classes defined in AdminDashboard.css

// Returns first letter of a string in uppercase
const initial = (str = "") => (str.trim()[0] || "?").toUpperCase();

function TopJobsLeaderboard({ topJobs = [] }) {
  if (!topJobs || topJobs.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: "24px 0" }}>
        <div style={{ fontSize: 32, marginBottom: 10 }}>📋</div>
        <p style={{ fontWeight: 600, color: "#1d1d1f", marginBottom: 6 }}>
          No applications yet
        </p>
        <p style={{ fontSize: 14, color: "#6e6e73" }}>
          Top jobs will appear here once students start applying.
        </p>
      </div>
    );
  }

  return (
    <ol className="adm-leaderboard-list" aria-label="Top jobs by applicant count">
      {topJobs.map((job, idx) => (
        <li className="adm-lb-item" key={job._id}>
          <div className="adm-lb-left">
            <span className="adm-lb-rank" aria-label={`Rank ${idx + 1}`}>
              #{idx + 1}
            </span>
            <div className="adm-lb-avatar" aria-hidden="true">
              {initial(job.company)}
            </div>
            <div className="adm-lb-info">
              <div className="adm-lb-title">{job.title}</div>
              <div className="adm-lb-company">{job.company}</div>
            </div>
          </div>
          <div className="adm-lb-right">
            <div className="adm-lb-count">
              {(job.applicationCount || 0).toLocaleString()}
            </div>
            <div className="adm-lb-sub">applicants</div>
          </div>
        </li>
      ))}
    </ol>
  );
}

export default TopJobsLeaderboard;
