// components/Skeleton.jsx
// Named exports for every skeleton variant used across the app.
// Import only the ones you need per page.
//
// Available exports:
//   MetricCardSkeleton    — for dashboard metric cards
//   SectionSkeleton       — for chart / progress bar sections
//   LeaderboardSkeleton   — for top-jobs leaderboard

import "./Skeleton.css";

// ── Metric Card Skeleton ───────────────────────────────────────────────────
export function MetricCardSkeleton() {
  return (
    <div className="sk-metric-card" aria-hidden="true" role="presentation">
      <div>
        <div className="sk-block sk-metric-icon" />
        <div className="sk-block sk-metric-label" />
      </div>
      <div>
        <div className="sk-block sk-metric-value" />
        <div className="sk-block sk-metric-trend" />
      </div>
    </div>
  );
}

// ── Section Skeleton (charts / progress bars) ──────────────────────────────
export function SectionSkeleton({ rows = 3 }) {
  return (
    <div className="sk-section-card" aria-hidden="true" role="presentation">
      <div className="sk-block sk-section-title" />
      {Array.from({ length: rows }).map((_, i) => (
        <div className="sk-progress-row" key={i}>
          <div className="sk-block sk-progress-label" />
          <div className="sk-block sk-progress-bar" />
        </div>
      ))}
    </div>
  );
}

// ── Leaderboard Skeleton ───────────────────────────────────────────────────
export function LeaderboardSkeleton({ rows = 5 }) {
  return (
    <div className="sk-leaderboard-card" aria-hidden="true" role="presentation">
      <div className="sk-block sk-lb-title" />
      {Array.from({ length: rows }).map((_, i) => (
        <div className="sk-lb-row" key={i}>
          <div className="sk-block sk-lb-avatar" />
          <div className="sk-lb-info">
            <div className="sk-block sk-lb-name" />
            <div className="sk-block sk-lb-company" />
          </div>
          <div className="sk-block sk-lb-count" />
        </div>
      ))}
    </div>
  );
}
