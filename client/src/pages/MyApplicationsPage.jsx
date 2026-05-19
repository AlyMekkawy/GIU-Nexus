import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import ApplicationStatusBadge from "../components/ApplicationStatusBadge";
import Spinner from "../components/Spinner";
import api from "../services/api";
import "./MyApplicationsPage.css";

export default function MyApplicationsPage() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState(null);
  const [filter, setFilter]             = useState("all"); // "all" | "pending" | "shortlisted" | "rejected"
  const navigate = useNavigate();

  const fetchApplications = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get("/api/v1/applications/my");
      // backend may return { applications: [...] } or plain array
      setApplications(res.data.applications ?? res.data);
    } catch (err) {
      setError(err.response?.data?.message ?? "Failed to load your applications.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchApplications(); }, [fetchApplications]);

  const STATUS_FILTERS = ["all", "pending", "shortlisted", "rejected"];

  const visible = filter === "all"
    ? applications
    : applications.filter((a) => a.status === filter);

  return (
    <div className="my-apps-page">
      <header className="my-apps-header">
        <h1 className="my-apps-title">
          <span className="my-apps-icon" aria-hidden>📋</span>
          My Applications
        </h1>
        <p className="my-apps-subtitle">Track every role you've applied to</p>
      </header>

      {/* Filter pills */}
      {!loading && !error && applications.length > 0 && (
        <div className="my-apps-filters" role="group" aria-label="Filter by status">
          {STATUS_FILTERS.map((s) => {
            const count = s === "all"
              ? applications.length
              : applications.filter((a) => a.status === s).length;
            return (
              <button
                key={s}
                className={`filter-pill ${filter === s ? "filter-pill--active" : ""}`}
                onClick={() => setFilter(s)}
              >
                {s.charAt(0).toUpperCase() + s.slice(1)}
                <span className="filter-pill__count">{count}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="my-apps-loading">
          <Spinner />
          <p>Loading your applications…</p>
        </div>
      )}

      {/* Error */}
      {error && !loading && (
        <div className="my-apps-error">
          <p>{error}</p>
          <button className="retry-btn" onClick={fetchApplications}>Try again</button>
        </div>
      )}

      {/* Empty — no applications at all */}
      {!loading && !error && applications.length === 0 && (
        <div className="my-apps-empty">
          <span className="empty-icon" aria-hidden>📭</span>
          <h2>No applications yet</h2>
          <p>Start applying to jobs and they'll appear here with live status updates.</p>
          <a href="/jobs" className="browse-btn">Browse Jobs</a>
        </div>
      )}

      {/* Empty — filter yields nothing */}
      {!loading && !error && applications.length > 0 && visible.length === 0 && (
        <div className="my-apps-empty">
          <span className="empty-icon" aria-hidden>🔍</span>
          <h2>No {filter} applications</h2>
          <p>Try a different filter above.</p>
        </div>
      )}

      {/* Application list */}
      {!loading && !error && visible.length > 0 && (
        <ul className="apps-list" aria-label="Applications">
          {visible.map((app) => {
            const job = app.job ?? {};
            const appliedAt = app.createdAt
              ? new Date(app.createdAt).toLocaleDateString("en-GB", {
                  day: "numeric", month: "short", year: "numeric",
                })
              : null;

            return (
              <li
                key={app._id}
                className="app-card"
                onClick={() => navigate(`/jobs/${job._id ?? job.id}`)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === "Enter" && navigate(`/jobs/${job._id ?? job.id}`)}
              >
                <div className="app-card__main">
                  <div className="app-card__info">
                    <h2 className="app-card__title">{job.title ?? "—"}</h2>
                    <p className="app-card__company">{job.company ?? "—"}</p>
                    <div className="app-card__meta">
                      {job.location && (
                        <span className="meta-item">
                          <span aria-hidden>📍</span> {job.location}
                        </span>
                      )}
                      {job.type && (
                        <span className="meta-item">
                          <span aria-hidden>💼</span> {job.type}
                        </span>
                      )}
                      {appliedAt && (
                        <span className="meta-item">
                          <span aria-hidden>🗓</span> Applied {appliedAt}
                        </span>
                      )}
                    </div>
                    {app.coverLetter && (
                      <p className="app-card__cover-preview">
                        "{app.coverLetter.slice(0, 120)}{app.coverLetter.length > 120 ? "…" : ""}"
                      </p>
                    )}
                  </div>

                  <div className="app-card__status">
                    <ApplicationStatusBadge status={app.status} />
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
