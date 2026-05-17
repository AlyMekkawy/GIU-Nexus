// client/src/pages/AdminDashboard.jsx
// Admin overview dashboard — fetches GET /api/v1/admin/stats
//
// All visual sub-components live in src/components/:
//   Navbar, Footer, MetricCard, Skeleton variants,
//   UsersByRoleChart, ProgressList, TopJobsLeaderboard

import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";

// ── Shared components ──────────────────────────────────────────────────────
import Navbar  from "../components/Navbar";
import Footer  from "../components/Footer";
import MetricCard from "../components/MetricCard";
import {
  MetricCardSkeleton,
  SectionSkeleton,
  LeaderboardSkeleton,
} from "../components/Skeleton";

// ── Admin-specific components ──────────────────────────────────────────────
import UsersByRoleChart   from "../components/UsersByRoleChart";
import ProgressList       from "../components/ProgressList";
import TopJobsLeaderboard from "../components/TopJobsLeaderboard";

import "./AdminDashboard.css";

// ── Inline SVG icons (no external icon lib needed) ────────────────────────
const IconUsers = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
    <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
  </svg>
);

const IconWork = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
    <path d="M20 6h-2.18c.07-.44.18-.88.18-1.36C18 2.51 15.86 1 14 1c-1.86 0-4 1.51-4 3.64 0 .48.11.92.18 1.36H8c-1.11 0-2 .89-2 2v13c0 1.11.89 2 2 2h12c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2zm-6.5-1.36c0-.47.89-1.14 1.5-1.14s1.5.67 1.5 1.14V6H13.5v-.36zM20 21H8V8h12v13z"/>
  </svg>
);

const IconDescription = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
    <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/>
  </svg>
);

const IconVerified = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
    <path d="M23 12l-2.44-2.79.34-3.69-3.61-.82-1.89-3.2L12 2.96 8.6 1.5 6.71 4.69 3.1 5.5l.34 3.7L1 12l2.44 2.79-.34 3.7 3.61.82 1.89 3.2L12 21.04l3.4 1.47 1.89-3.2 3.61-.82-.34-3.69L23 12zm-12.91 4.72l-3.8-3.81 1.48-1.48 2.32 2.33 5.85-5.87 1.48 1.48-7.33 7.35z"/>
  </svg>
);

// ── ProgressList item configs ─────────────────────────────────────────────
const jobProgressItems = (jobsByStatus) => [
  { key: "open",   label: "Open Positions", value: jobsByStatus.open   || 0, colorHex: "#16833a" },
  { key: "closed", label: "Closed",         value: jobsByStatus.closed || 0, colorHex: "#8a8a8e" },
];

const appProgressItems = (appsByStatus) => [
  { key: "pending",     label: "Pending",     value: appsByStatus.pending     || 0, colorHex: "#b26a00" },
  { key: "shortlisted", label: "Shortlisted", value: appsByStatus.shortlisted || 0, colorHex: "#0066cc" },
  { key: "rejected",    label: "Rejected",    value: appsByStatus.rejected    || 0, colorHex: "#b42318" },
];

// ═════════════════════════════════════════════════════════════════════════════
function AdminDashboard() {
  const [stats,   setStats]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get("/admin/stats");
      setStats(res.data.stats);
    } catch (err) {
      setError(err.message || "Failed to load platform statistics.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchStats(); }, [fetchStats]);

  // ── Derived values ───────────────────────────────────────────────────────
  const usersByRole  = stats?.usersByRole  || {};
  const jobsByStatus = stats?.jobsByStatus || {};
  const appsByStatus = stats?.appsByStatus || {};
  const topJobs      = stats?.topJobs      || [];

  const totalUsers        = Object.values(usersByRole).reduce((s, v) => s + v, 0);
  const totalJobs         = Object.values(jobsByStatus).reduce((s, v) => s + v, 0);
  const totalApps         = Object.values(appsByStatus).reduce((s, v) => s + v, 0);
  const pendingRecruiters = usersByRole.recruiter || 0;

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="adm-page">

      {/* ── Navigation ──────────────────────────────────────────────── */}
      <Navbar />

      {/* ── Main content ────────────────────────────────────────────── */}
      <main className="adm-main" id="main-content">

        {/* Page heading */}
        <div className="adm-header">
          <h1>Admin Overview</h1>
          <p>Managing the ecosystem of academic and professional excellence.</p>
        </div>

        {/* ── Error state ─────────────────────────────────────────── */}
        {error && !loading && (
          <div className="glass-card adm-error-card" role="alert">
            <div className="adm-error-icon" aria-hidden="true">⚠️</div>
            <p className="adm-error-title">Could not load statistics</p>
            <p className="adm-error-sub">{error}</p>
            <button
              className="adm-retry-btn"
              onClick={fetchStats}
              aria-label="Retry loading statistics"
            >
              Retry
            </button>
          </div>
        )}

        {!error && (
          <>
            {/* ── Metric cards ──────────────────────────────────────── */}
            <section aria-label="Platform summary metrics">
              <div className="adm-metrics-grid">
                {loading ? (
                  <>
                    <MetricCardSkeleton />
                    <MetricCardSkeleton />
                    <MetricCardSkeleton />
                    <MetricCardSkeleton />
                  </>
                ) : (
                  <>
                    <MetricCard
                      icon={<IconUsers />}
                      label="Total Users"
                      value={totalUsers.toLocaleString()}
                      trendText={`${usersByRole.jobSeeker || 0} job seekers · ${usersByRole.recruiter || 0} recruiters`}
                      trendClass="muted"
                    />
                    <MetricCard
                      icon={<IconWork />}
                      label="Total Jobs"
                      value={totalJobs.toLocaleString()}
                      trendText={`${jobsByStatus.open || 0} open · ${jobsByStatus.closed || 0} closed`}
                      trendClass={jobsByStatus.open > 0 ? "up" : "muted"}
                    />
                    <MetricCard
                      icon={<IconDescription />}
                      label="Applications"
                      value={totalApps.toLocaleString()}
                      trendText={`${appsByStatus.pending || 0} pending · ${appsByStatus.shortlisted || 0} shortlisted`}
                      trendClass="muted"
                    />
                    <MetricCard
                      icon={<IconVerified />}
                      label="Pending Recruiters"
                      value={pendingRecruiters.toLocaleString()}
                      trendText={pendingRecruiters > 0 ? "Action required" : "All approved"}
                      trendClass={pendingRecruiters > 0 ? "warn" : "up"}
                    />
                  </>
                )}
              </div>
            </section>

            {/* ── Two-column panel ──────────────────────────────────── */}
            <div className="adm-panel-grid">

              {/* Left column: charts */}
              <div className="adm-left-col">

                {/* Users by Role */}
                <section aria-label="Users by role">
                  {loading ? <SectionSkeleton rows={3} /> : (
                    <div className="glass-card adm-section-card">
                      <h2 className="adm-section-title">
                        Users by Role
                        <Link to="/admin/users" className="adm-section-link">
                          View All →
                        </Link>
                      </h2>
                      <UsersByRoleChart usersByRole={usersByRole} />
                    </div>
                  )}
                </section>

                {/* Jobs by Status */}
                <section aria-label="Jobs by status">
                  {loading ? <SectionSkeleton rows={2} /> : (
                    <div className="glass-card adm-section-card">
                      <h2 className="adm-section-title">
                        Jobs by Status
                        <Link to="/admin/jobs" className="adm-section-link">
                          View All →
                        </Link>
                      </h2>
                      <ProgressList items={jobProgressItems(jobsByStatus)} />
                    </div>
                  )}
                </section>

                {/* Applications by Status */}
                <section aria-label="Applications by status">
                  {loading ? <SectionSkeleton rows={3} /> : (
                    <div className="glass-card adm-section-card">
                      <h2 className="adm-section-title">
                        Applications by Status
                      </h2>
                      <ProgressList items={appProgressItems(appsByStatus)} />
                    </div>
                  )}
                </section>

              </div>

              {/* Right column: leaderboard */}
              <aside aria-label="Top jobs leaderboard">
                {loading ? <LeaderboardSkeleton rows={5} /> : (
                  <div className="glass-card adm-leaderboard">
                    <h2 className="adm-section-title">Top Jobs</h2>
                    <TopJobsLeaderboard topJobs={topJobs} />
                    {topJobs.length > 0 && (
                      <Link
                        to="/admin/jobs"
                        className="adm-leaderboard-btn"
                        aria-label="View all job rankings"
                      >
                        View All Rankings
                      </Link>
                    )}
                  </div>
                )}
              </aside>

            </div>
          </>
        )}
      </main>

      {/* ── Footer ──────────────────────────────────────────────────── */}
      <Footer />

    </div>
  );
}

export default AdminDashboard;
