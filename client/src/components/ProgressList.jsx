// components/ProgressList.jsx
// Horizontal progress bar list — used in Admin Dashboard for
// "Jobs by Status" and "Applications by Status" sections.
//
// Props:
//   items — array of: { key, label, value, colorHex }
//
// Styling uses CSS classes defined in AdminDashboard.css

function ProgressList({ items = [] }) {
  const total = items.reduce((sum, i) => sum + (i.value || 0), 0) || 1;
  const hasData = items.some((i) => (i.value || 0) > 0);

  if (!hasData) {
    return (
      <p style={{ color: "#6e6e73", fontSize: 14 }}>No data yet.</p>
    );
  }

  return (
    <div className="adm-progress-list">
      {items.map(({ key, label, value, colorHex }) => {
        const widthPct = Math.max(1, Math.round(((value || 0) / total) * 100));

        return (
          <div className="adm-progress-item" key={key}>
            <div className="adm-progress-header">
              <span className="adm-progress-label">{label}</span>
              <span className="adm-progress-count">
                {(value || 0).toLocaleString()}
              </span>
            </div>
            <div
              className="adm-progress-track"
              role="progressbar"
              aria-valuenow={value || 0}
              aria-valuemax={total}
              aria-label={`${label}: ${value}`}
            >
              <div
                className="adm-progress-fill"
                style={{ width: `${widthPct}%`, background: colorHex }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default ProgressList;
