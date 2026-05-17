// pages/AdminJobsPage.jsx
// Admin: view and moderate all job listings.
//
// API:
//   GET    /api/v1/jobs?keyword=&type=&status=&page=&limit=   all jobs (filtered)
//   DELETE /api/v1/jobs/:id                                   remove any listing
//
// Components: Navbar, Footer, Modal

import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import api    from "../services/api";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import Modal  from "../components/Modal";
import "./AdminJobsPage.css";

// ── Badge maps ────────────────────────────────────────────────────────────────
const CATEGORY_STYLES = {
  Frontend:           { bg: "#e8f7ee", text: "#16833a", border: "#bfe8cd" },
  Backend:            { bg: "#e8f2ff", text: "#0066cc", border: "#b9d8ff" },
  "AI/ML":            { bg: "#f1eaff", text: "#6b3fd1", border: "#d8c8ff" },
  DevOps:             { bg: "#e6f7f6", text: "#007c78", border: "#bce9e6" },
  "Data Engineering": { bg: "#fff3e0", text: "#b26a00", border: "#ffd99a" },
  Other:              { bg: "#f2f2f2", text: "#666666", border: "#dedede" },
};

const TYPE_LABELS = {
  "full-time":  "Full-time",
  "part-time":  "Part-time",
  internship:   "Internship",
};

const TYPE_STYLES = {
  "full-time":  { bg: "#e8f2ff", text: "#0066cc" },
  "part-time":  { bg: "#f1eaff", text: "#6b3fd1" },
  internship:   { bg: "#e6f7f6", text: "#007c78" },
};

const PAGE_LIMIT = 12;

// Relative date helper
function relativeDate(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d)) return "";
  const days = Math.floor((Date.now() - d) / 86400000);
  if (days === 0) return "Today";
  if (days === 1) return "1 day ago";
  if (days < 7)  return `${days} days ago`;
  if (days < 14) return "1 week ago";
  return `${Math.floor(days / 7)} weeks ago`;
}

// Company initials avatar
const toInitials = (s = "") =>
  s.trim().split(/\s+/).map((w) => w[0] || "").slice(0, 2).join("").toUpperCase() || "?";

// ── SVG icons ─────────────────────────────────────────────────────────────────
const IconSearch = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
  </svg>
);

const IconTrash = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
  </svg>
);

const IconEye = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
    <circle cx="12" cy="12" r="3"/>
  </svg>
);

// ── Skeleton ──────────────────────────────────────────────────────────────────
function SkeletonRows({ count = 8 }) {
  return Array.from({ length: count }).map((_, i) => (
    <tr key={i} className="aj-row">
      <td className="aj-td">
        <div className="aj-job-cell">
          <div className="aj-skeleton aj-skel-avatar" />
          <div>
            <div className="aj-skeleton aj-skel-title" />
            <div className="aj-skeleton aj-skel-sub" style={{ marginTop: 5 }} />
          </div>
        </div>
      </td>
      <td className="aj-td"><div className="aj-skeleton aj-skel-meta" /></td>
      <td className="aj-td"><div className="aj-skeleton aj-skel-badge" /></td>
      <td className="aj-td"><div className="aj-skeleton aj-skel-badge" /></td>
      <td className="aj-td"><div className="aj-skeleton aj-skel-badge" /></td>
      <td className="aj-td aj-td-right"><div className="aj-skeleton aj-skel-actions" /></td>
    </tr>
  ));
}

function SkeletonCards({ count = 4 }) {
  return Array.from({ length: count }).map((_, i) => (
    <div key={i} className="aj-mobile-card">
      <div className="aj-mc-top">
        <div className="aj-job-cell">
          <div className="aj-skeleton aj-skel-avatar" />
          <div>
            <div className="aj-skeleton aj-skel-title" />
            <div className="aj-skeleton aj-skel-sub" style={{ marginTop: 5 }} />
          </div>
        </div>
        <div className="aj-skeleton aj-skel-badge" />
      </div>
      <div className="aj-mc-footer">
        <div style={{ display: "flex", gap: 6 }}>
          <div className="aj-skeleton aj-skel-badge" />
          <div className="aj-skeleton aj-skel-badge" />
        </div>
        <div className="aj-skeleton aj-skel-actions" />
      </div>
    </div>
  ));
}

// ═════════════════════════════════════════════════════════════════════════════
function AdminJobsPage() {
  const [jobs,         setJobs]         = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState(null);

  // Filters
  const [keyword,      setKeyword]      = useState("");
  const [typeFilter,   setTypeFilter]   = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  // Pagination
  const [page,         setPage]         = useState(1);
  const [totalPages,   setTotalPages]   = useState(1);
  const [totalCount,   setTotalCount]   = useState(0);

  // Delete modal
  const [deleteTarget,  setDeleteTarget]  = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError,   setDeleteError]   = useState(null);

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const fetchJobs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = { page, limit: PAGE_LIMIT };
      if (keyword)      params.keyword = keyword;
      if (typeFilter)   params.type    = typeFilter;
      if (statusFilter) params.status  = statusFilter;

      const res  = await api.get("/jobs", { params });
      const data = res.data;

      let list, total;
      if (Array.isArray(data)) {
        list  = data;
        total = data.length;
      } else {
        list  = data.jobs ?? data.data ?? [];
        total = data.total ?? data.count ?? list.length;
      }

      setJobs(list);
      setTotalCount(total);
      setTotalPages(Math.max(1, Math.ceil(total / PAGE_LIMIT)));
    } catch (err) {
      setError(err.message || "Failed to load jobs.");
    } finally {
      setLoading(false);
    }
  }, [keyword, typeFilter, statusFilter, page]);

  useEffect(() => { fetchJobs(); }, [fetchJobs]);
  useEffect(() => { setPage(1); }, [keyword, typeFilter, statusFilter]);

  // ── Delete ─────────────────────────────────────────────────────────────────
  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    setDeleteError(null);
    try {
      await api.delete(`/jobs/${deleteTarget._id}`);
      setJobs((prev) => prev.filter((j) => j._id !== deleteTarget._id));
      setTotalCount((c) => Math.max(0, c - 1));
      setDeleteTarget(null);
    } catch (err) {
      setDeleteError(err.message || "Could not delete this listing. Please try again.");
    } finally {
      setDeleteLoading(false);
    }
  }

  // ── Helpers ────────────────────────────────────────────────────────────────
  const hasFilters = keyword || typeFilter || statusFilter;

  function CategoryBadge({ category }) {
    const style = CATEGORY_STYLES[category] ?? CATEGORY_STYLES.Other;
    return (
      <span
        className="aj-cat-badge"
        style={{ background: style.bg, color: style.text, borderColor: style.border }}
      >
        {category || "Other"}
      </span>
    );
  }

  function TypeBadge({ type }) {
    const style  = TYPE_STYLES[type]  ?? { bg: "#f2f2f2", text: "#666" };
    const label  = TYPE_LABELS[type]  ?? type;
    return (
      <span className="aj-type-badge" style={{ background: style.bg, color: style.text }}>
        {label}
      </span>
    );
  }

  function StatusBadge({ status }) {
    const isOpen = status === "open";
    return (
      <span className={`aj-status-badge ${isOpen ? "aj-status-open" : "aj-status-closed"}`}>
        <span className="aj-status-dot" aria-hidden="true" />
        {isOpen ? "Open" : "Closed"}
      </span>
    );
  }

  const deleteModalBody = deleteTarget ? (
    <>
      This will permanently remove the listing{" "}
      <strong>"{deleteTarget.title}"</strong> by{" "}
      <strong>{deleteTarget.company}</strong>. This action cannot be undone.
      {deleteError && <p className="aj-modal-error">{deleteError}</p>}
    </>
  ) : null;

  // ── JSX ────────────────────────────────────────────────────────────────────
  return (
    <div className="aj-page">
      <Navbar />

      <main className="aj-main" id="main-content">

        {/* Page header */}
        <div className="aj-header">
          <div>
            <h1>Job Management</h1>
            <p>Review and moderate all listings across the platform.</p>
          </div>
        </div>

        {/* Filters */}
        <div className="aj-filters">
          {/* Keyword search */}
          <div className="aj-search-wrap">
            <span className="aj-search-icon"><IconSearch /></span>
            <input
              className="aj-search-input"
              type="search"
              placeholder="Search by title or company…"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              aria-label="Search jobs"
            />
          </div>

          {/* Type filter */}
          <label className="aj-filter-select-wrap">
            <select
              className="aj-filter-select"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              aria-label="Filter by type"
            >
              <option value="">All Types</option>
              <option value="full-time">Full-time</option>
              <option value="part-time">Part-time</option>
              <option value="internship">Internship</option>
            </select>
          </label>

          {/* Status filter */}
          <label className="aj-filter-select-wrap">
            <select
              className="aj-filter-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              aria-label="Filter by status"
            >
              <option value="">All Statuses</option>
              <option value="open">Open</option>
              <option value="closed">Closed</option>
            </select>
          </label>

          {hasFilters && (
            <button
              className="aj-clear-btn"
              onClick={() => { setKeyword(""); setTypeFilter(""); setStatusFilter(""); }}
            >
              Clear filters
            </button>
          )}

          {!loading && (
            <span className="aj-count" aria-live="polite">
              <strong>{totalCount}</strong> listing{totalCount !== 1 ? "s" : ""}
            </span>
          )}
        </div>

        {/* Error */}
        {error && !loading && (
          <div className="aj-error-card" role="alert">
            <span aria-hidden="true">⚠</span>
            <p><strong>Could not load jobs right now.</strong></p>
            <p className="aj-error-detail">{error}</p>
            <button className="aj-retry-btn" onClick={fetchJobs}>Retry</button>
          </div>
        )}

        {!error && (
          <>
            {/* ── Desktop table ─────────────────────────────────────── */}
            <div className="aj-table-wrap">
              <table className="aj-table" aria-label="Jobs table">
                <thead>
                  <tr className="aj-thead-row">
                    <th className="aj-th" scope="col">Job</th>
                    <th className="aj-th" scope="col">Location</th>
                    <th className="aj-th" scope="col">Category</th>
                    <th className="aj-th" scope="col">Type</th>
                    <th className="aj-th" scope="col">Status</th>
                    <th className="aj-th aj-th-right" scope="col">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <SkeletonRows count={8} />
                  ) : jobs.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="aj-empty-cell">
                        <div className="aj-empty">
                          <span className="aj-empty-icon" aria-hidden="true">💼</span>
                          <strong>No jobs found</strong>
                          <span>
                            {hasFilters
                              ? "Try adjusting or clearing your filters."
                              : "No job listings on the platform yet."}
                          </span>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    jobs.map((job) => (
                      <tr key={job._id} className="aj-row">

                        {/* Title + company */}
                        <td className="aj-td">
                          <div className="aj-job-cell">
                            <div className="aj-company-avatar" aria-hidden="true">
                              {toInitials(job.company)}
                            </div>
                            <div>
                              <div className="aj-job-title">{job.title}</div>
                              <div className="aj-job-sub">
                                {job.company}
                                {job.createdAt && (
                                  <> · <span>{relativeDate(job.createdAt)}</span></>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Location */}
                        <td className="aj-td aj-muted">{job.location || "—"}</td>

                        {/* Category */}
                        <td className="aj-td">
                          <CategoryBadge category={job.category} />
                        </td>

                        {/* Type */}
                        <td className="aj-td">
                          <TypeBadge type={job.type} />
                        </td>

                        {/* Status */}
                        <td className="aj-td">
                          <StatusBadge status={job.status} />
                        </td>

                        {/* Actions */}
                        <td className="aj-td aj-td-right">
                          <div className="aj-row-actions">
                            <Link
                              to={`/jobs/${job._id}`}
                              className="aj-icon-btn aj-icon-btn-view"
                              aria-label={`View ${job.title}`}
                              title="View listing"
                            >
                              <IconEye />
                            </Link>
                            <button
                              className="aj-icon-btn aj-icon-btn-danger"
                              onClick={() => { setDeleteTarget(job); setDeleteError(null); }}
                              aria-label={`Delete ${job.title}`}
                              title="Delete listing"
                            >
                              <IconTrash />
                            </button>
                          </div>
                        </td>

                      </tr>
                    ))
                  )}
                </tbody>
              </table>

              {/* Pagination */}
              {!loading && totalPages > 1 && (
                <div className="aj-pagination">
                  <button
                    className="aj-page-btn"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    aria-label="Previous page"
                  >
                    ← Previous
                  </button>
                  <div className="aj-page-numbers">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                      <button
                        key={p}
                        className={`aj-page-num${p === page ? " aj-page-num-active" : ""}`}
                        onClick={() => setPage(p)}
                        aria-label={`Page ${p}`}
                        aria-current={p === page ? "page" : undefined}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                  <button
                    className="aj-page-btn"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    aria-label="Next page"
                  >
                    Next →
                  </button>
                </div>
              )}
            </div>

            {/* ── Mobile cards ──────────────────────────────────────── */}
            <div className="aj-mobile-list">
              {loading ? (
                <SkeletonCards count={4} />
              ) : jobs.length === 0 ? (
                <div className="aj-empty aj-empty-mobile">
                  <span className="aj-empty-icon" aria-hidden="true">💼</span>
                  <strong>No jobs found</strong>
                  <span>
                    {hasFilters
                      ? "Try adjusting or clearing your filters."
                      : "No job listings on the platform yet."}
                  </span>
                </div>
              ) : (
                jobs.map((job) => (
                  <div key={job._id} className="aj-mobile-card">
                    <div className="aj-mc-top">
                      <div className="aj-job-cell">
                        <div className="aj-company-avatar" aria-hidden="true">
                          {toInitials(job.company)}
                        </div>
                        <div>
                          <div className="aj-job-title">{job.title}</div>
                          <div className="aj-job-sub">{job.company}</div>
                        </div>
                      </div>
                      <StatusBadge status={job.status} />
                    </div>
                    <div className="aj-mc-badges">
                      <CategoryBadge category={job.category} />
                      <TypeBadge type={job.type} />
                      {job.location && <span className="aj-mc-location">{job.location}</span>}
                    </div>
                    <div className="aj-mc-footer">
                      <span className="aj-muted" style={{ fontSize: "0.8rem" }}>
                        {relativeDate(job.createdAt)}
                      </span>
                      <div className="aj-row-actions">
                        <Link
                          to={`/jobs/${job._id}`}
                          className="aj-icon-btn aj-icon-btn-view"
                          aria-label={`View ${job.title}`}
                        >
                          <IconEye />
                        </Link>
                        <button
                          className="aj-icon-btn aj-icon-btn-danger"
                          onClick={() => { setDeleteTarget(job); setDeleteError(null); }}
                          aria-label={`Delete ${job.title}`}
                        >
                          <IconTrash />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        )}

      </main>

      <Footer />

      {/* Delete confirmation modal */}
      <Modal
        isOpen={!!deleteTarget}
        onClose={() => { if (!deleteLoading) { setDeleteTarget(null); setDeleteError(null); } }}
        title="Delete Job Listing?"
        body={deleteModalBody}
        confirmLabel="Delete Listing"
        confirmClass="modal-btn-danger"
        onConfirm={confirmDelete}
        confirmLoading={deleteLoading}
        icon="warn"
      />
    </div>
  );
}

export default AdminJobsPage;
