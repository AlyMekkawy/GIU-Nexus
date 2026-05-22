import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { gsap } from "gsap";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import ApplicationStatusBadge from "../components/ApplicationStatusBadge";
import Spinner from "../components/Spinner";
import api from "../services/api";
import "./MyApplicationsPage.css";

export default function MyApplicationsPage() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState(null);
  const [filter, setFilter]             = useState("all");
  const navigate = useNavigate();
  const pageRef  = useRef(null);

  const fetchApplications = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get("/applications/my");
      setApplications(res.data.applications ?? res.data);
    } catch (err) {
      setError(err.response?.data?.message ?? "Failed to load your applications.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchApplications(); }, [fetchApplications]);

  /* GSAP entrance */
  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        [".ma-hero__label", ".ma-hero__title", ".ma-hero__subtitle"],
        { y: 20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.6, stagger: 0.1, ease: "power3.out" }
      );
    }, pageRef);
    return () => ctx.revert();
  }, []);

  const STATUS_FILTERS = ["all", "pending", "shortlisted", "rejected"];

  const visible = filter === "all"
    ? applications
    : applications.filter((a) => a.status === filter);

  return (
    <>
      <Navbar />

      <div className="ma-page" ref={pageRef}>
        {/* Hero */}
        <header className="ma-hero">
          <span className="ma-hero__label">
            <span className="material-symbols-outlined">assignment</span>
            Dashboard
          </span>
          <h1 className="ma-hero__title">My Applications</h1>
          <p className="ma-hero__subtitle">Track every role you've applied to with live status updates.</p>
        </header>

        <div className="ma-content">
          {/* Filter pills */}
          {!loading && !error && applications.length > 0 && (
            <div className="ma-filters" role="group" aria-label="Filter by status">
              {STATUS_FILTERS.map((s) => {
                const count = s === "all"
                  ? applications.length
                  : applications.filter((a) => a.status === s).length;
                return (
                  <button
                    key={s}
                    className={`ma-pill${filter === s ? " active" : ""}`}
                    onClick={() => setFilter(s)}
                  >
                    {s.charAt(0).toUpperCase() + s.slice(1)}
                    <span className="ma-pill__count">{count}</span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Loading */}
          {loading && (
            <div className="ma-spinner-wrap">
              <Spinner />
              <p>Loading your applications…</p>
            </div>
          )}

          {/* Error */}
          {error && !loading && (
            <div className="ma-error">
              <p className="ma-error__text">{error}</p>
              <button className="ma-retry-btn" onClick={fetchApplications}>Try again</button>
            </div>
          )}

          {/* Empty — no applications at all */}
          {!loading && !error && applications.length === 0 && (
            <div className="ma-empty">
              <div className="ma-empty__icon-wrap">
                <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>inbox</span>
              </div>
              <h2 className="ma-empty__title">No applications yet</h2>
              <p className="ma-empty__body">Start applying to jobs and they'll appear here with live status updates.</p>
              <a href="/jobs" className="ma-empty__btn">Browse Jobs</a>
            </div>
          )}

          {/* Empty — filter yields nothing */}
          {!loading && !error && applications.length > 0 && visible.length === 0 && (
            <div className="ma-empty">
              <div className="ma-empty__icon-wrap">
                <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>search_off</span>
              </div>
              <h2 className="ma-empty__title">No {filter} applications</h2>
              <p className="ma-empty__body">Try a different filter above.</p>
            </div>
          )}

          {/* Application list */}
          {!loading && !error && visible.length > 0 && (
            <ul className="ma-list" aria-label="Applications">
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
                    className="ma-card"
                    onClick={() => navigate(`/jobs/${job._id ?? job.id}`)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === "Enter" && navigate(`/jobs/${job._id ?? job.id}`)}
                  >
                    <div className="ma-card__main">
                      <div className="ma-card__info">
                        <h2 className="ma-card__title">{job.title ?? "—"}</h2>
                        <p className="ma-card__company">{job.company ?? "—"}</p>
                        <div className="ma-card__meta">
                          {job.location && (
                            <span className="ma-meta-item">
                              <span className="material-symbols-outlined">location_on</span>
                              {job.location}
                            </span>
                          )}
                          {job.type && (
                            <span className="ma-meta-item">
                              <span className="material-symbols-outlined">work</span>
                              {job.type}
                            </span>
                          )}
                          {appliedAt && (
                            <span className="ma-meta-item">
                              <span className="material-symbols-outlined">calendar_today</span>
                              Applied {appliedAt}
                            </span>
                          )}
                        </div>
                        {app.coverLetter && (
                          <p className="ma-card__cover">
                            "{app.coverLetter.slice(0, 120)}{app.coverLetter.length > 120 ? "…" : ""}"
                          </p>
                        )}
                      </div>

                      <div className="ma-card__status">
                        <ApplicationStatusBadge status={app.status} />
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>

      <Footer />
    </>
  );
}
