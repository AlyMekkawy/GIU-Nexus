// pages/AdminUsersPage.jsx
// Admin: manage all platform users.
//
// API:
//   GET    /api/v1/users?role=&status=&page=&limit=   list users (filtered)
//   PATCH  /api/v1/users/:id/status                   change user status
//   DELETE /api/v1/users/:id                          remove user
//
// Components used (all in src/components/):
//   Navbar, Footer, Modal

import { useState, useEffect, useCallback } from "react";
import api from "../services/api";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import Modal  from "../components/Modal";
import "./AdminUsersPage.css";

// ── Display maps ──────────────────────────────────────────────────────────────
const ROLE_LABELS = {
  jobSeeker: "Job Seeker",
  recruiter: "Recruiter",
  admin:     "Admin",
};

const ROLE_BADGE_CLASS = {
  jobSeeker: "au-role-badge au-role-seeker",
  recruiter: "au-role-badge au-role-recruiter",
  admin:     "au-role-badge au-role-admin",
};

const STATUS_LABELS = {
  pending:  "Pending",
  approved: "Approved",
  rejected: "Rejected",
};

const STATUS_BADGE_CLASS = {
  pending:  "au-status-badge au-status-pending",
  approved: "au-status-badge au-status-approved",
  rejected: "au-status-badge au-status-rejected",
};

const STATUS_OPTIONS = [
  { value: "pending",  label: "Pending"  },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
];

const PAGE_LIMIT = 10;

// Returns up to 2 uppercase initials from a display name
const toInitials = (name = "") =>
  name.trim().split(/\s+/).map((w) => w[0] || "").slice(0, 2).join("").toUpperCase() || "?";

// ── Inline SVG icons ──────────────────────────────────────────────────────────
const IconFilter = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M4 6h16v2.586l-6 6V20l-4-2v-5.414L4 8.586V6z"/>
  </svg>
);

const IconCheck = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/>
  </svg>
);

const IconTrash = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
  </svg>
);

// ── Skeleton rows (desktop table) ─────────────────────────────────────────────
function SkeletonRows({ count = 6 }) {
  return Array.from({ length: count }).map((_, i) => (
    <tr key={i} className="au-table-row">
      <td className="au-td">
        <div className="au-user-cell">
          <div className="au-skeleton au-skel-avatar" />
          <div className="au-skeleton au-skel-name" />
        </div>
      </td>
      <td className="au-td"><div className="au-skeleton au-skel-email" /></td>
      <td className="au-td"><div className="au-skeleton au-skel-badge" /></td>
      <td className="au-td"><div className="au-skeleton au-skel-badge" /></td>
      <td className="au-td au-td-right">
        <div className="au-skeleton au-skel-actions" />
      </td>
    </tr>
  ));
}

// ── Skeleton cards (mobile) ────────────────────────────────────────────────────
function SkeletonCards({ count = 4 }) {
  return Array.from({ length: count }).map((_, i) => (
    <div key={i} className="au-mobile-card">
      <div className="au-mc-top">
        <div className="au-user-cell">
          <div className="au-skeleton au-skel-avatar" />
          <div>
            <div className="au-skeleton au-skel-name" />
            <div className="au-skeleton au-skel-email" style={{ marginTop: 6 }} />
          </div>
        </div>
        <div className="au-skeleton au-skel-badge" />
      </div>
      <div className="au-mc-footer">
        <div className="au-skeleton au-skel-badge" />
        <div className="au-skeleton au-skel-actions" />
      </div>
    </div>
  ));
}

// ═════════════════════════════════════════════════════════════════════════════
function AdminUsersPage() {
  const [users,        setUsers]        = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState(null);

  // Filters
  const [roleFilter,   setRoleFilter]   = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  // Pagination
  const [page,         setPage]         = useState(1);
  const [totalPages,   setTotalPages]   = useState(1);
  const [totalCount,   setTotalCount]   = useState(0);

  // Delete modal
  const [deleteTarget,  setDeleteTarget]  = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError,   setDeleteError]   = useState(null);

  // Per-user status change loading
  const [statusBusy,   setStatusBusy]   = useState({});

  // ── Fetch users ────────────────────────────────────────────────────────────
  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = { page, limit: PAGE_LIMIT };
      if (roleFilter)   params.role   = roleFilter;
      if (statusFilter) params.status = statusFilter;

      const res  = await api.get("/users", { params });
      const data = res.data;

      // Normalise — backend may return array, { users }, or { data }
      let list, total;
      if (Array.isArray(data)) {
        list  = data;
        total = data.length;
      } else {
        list  = data.users ?? data.data ?? [];
        total = data.total ?? data.count ?? list.length;
      }

      setUsers(list);
      setTotalCount(total);
      setTotalPages(Math.max(1, Math.ceil(total / PAGE_LIMIT)));
    } catch (err) {
      setError(err.message || "Failed to load users.");
    } finally {
      setLoading(false);
    }
  }, [roleFilter, statusFilter, page]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  // Reset to page 1 when filters change
  useEffect(() => { setPage(1); }, [roleFilter, statusFilter]);

  // ── Delete user ────────────────────────────────────────────────────────────
  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    setDeleteError(null);
    try {
      await api.delete(`/users/${deleteTarget._id}`);
      setUsers((prev) => prev.filter((u) => u._id !== deleteTarget._id));
      setTotalCount((c) => Math.max(0, c - 1));
      setDeleteTarget(null);
    } catch (err) {
      setDeleteError(err.message || "Could not delete this user. Please try again.");
    } finally {
      setDeleteLoading(false);
    }
  }

  function openDeleteModal(user) {
    setDeleteTarget(user);
    setDeleteError(null);
  }

  // ── Status change (recruiter accounts) ────────────────────────────────────
  async function handleStatusChange(userId, newStatus) {
    setStatusBusy((prev) => ({ ...prev, [userId]: true }));
    try {
      const res     = await api.patch(`/users/${userId}/status`, { status: newStatus });
      const updated = res.data.user ?? res.data;
      setUsers((prev) =>
        prev.map((u) =>
          u._id === userId ? { ...u, status: updated.status ?? newStatus } : u
        )
      );
    } catch (err) {
      console.error("Status update failed:", err.message);
    } finally {
      setStatusBusy((prev) => ({ ...prev, [userId]: false }));
    }
  }

  // ── Helpers ────────────────────────────────────────────────────────────────
  const hasFilters = roleFilter || statusFilter;

  const StatusCell = ({ user }) => {
    if (user.role === "recruiter") {
      return (
        <div className="au-status-select-wrap">
          {statusBusy[user._id] ? (
            <span className="au-status-spinner" aria-label="Updating status" />
          ) : (
            <select
              className={`au-status-select au-status-select-${user.status ?? "pending"}`}
              value={user.status ?? "pending"}
              onChange={(e) => handleStatusChange(user._id, e.target.value)}
              aria-label={`Change status for ${user.name}`}
            >
              {STATUS_OPTIONS.map(({ value, label }) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          )}
        </div>
      );
    }
    const cls = STATUS_BADGE_CLASS[user.status] ?? "au-status-badge au-status-approved";
    return (
      <span className={cls}>
        <span className="au-status-dot" aria-hidden="true" />
        {STATUS_LABELS[user.status] ?? "Active"}
      </span>
    );
  };

  const deleteModalBody = deleteTarget ? (
    <>
      This action cannot be undone. All data associated with{" "}
      <strong>{deleteTarget.name}</strong> will be permanently removed from GIU Nexus.
      {deleteError && <p className="au-modal-error">{deleteError}</p>}
    </>
  ) : null;

  // ── JSX ────────────────────────────────────────────────────────────────────
  return (
    <div className="au-page">
      <Navbar />

      <main className="au-main" id="main-content">

        {/* Page header */}
        <div className="au-header">
          <div>
            <h1>User Management</h1>
            <p>Manage system access, roles, and account status for all platform members.</p>
          </div>
        </div>

        {/* Filters strip */}
        <div className="au-filters" role="search" aria-label="Filter users">
          <label className="au-filter-select-wrap" aria-label="Filter by role">
            <span className="au-filter-icon"><IconFilter /></span>
            <select
              className="au-filter-select"
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
            >
              <option value="">All Roles</option>
              <option value="jobSeeker">Job Seeker</option>
              <option value="recruiter">Recruiter</option>
              <option value="admin">Administrator</option>
            </select>
          </label>

          <label className="au-filter-select-wrap" aria-label="Filter by status">
            <span className="au-filter-icon"><IconCheck /></span>
            <select
              className="au-filter-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </label>

          {hasFilters && (
            <button
              className="au-clear-btn"
              onClick={() => { setRoleFilter(""); setStatusFilter(""); }}
            >
              Clear filters
            </button>
          )}

          {!loading && (
            <span className="au-user-count" aria-live="polite">
              Showing <strong>{users.length}</strong>
              {totalCount > PAGE_LIMIT && ` of ${totalCount}`} user{totalCount !== 1 ? "s" : ""}
            </span>
          )}
        </div>

        {/* Error state */}
        {error && !loading && (
          <div className="au-error-card" role="alert">
            <span className="au-error-icon" aria-hidden="true">⚠</span>
            <p><strong>We could not load users right now.</strong></p>
            <p className="au-error-detail">{error}</p>
            <button className="au-retry-btn" onClick={fetchUsers}>Retry</button>
          </div>
        )}

        {!error && (
          <>
            {/* ── Desktop table ──────────────────────────────────────── */}
            <div className="au-table-wrap">
              <table className="au-table" aria-label="Users table">
                <thead>
                  <tr className="au-thead-row">
                    <th className="au-th" scope="col">Name</th>
                    <th className="au-th" scope="col">Email</th>
                    <th className="au-th" scope="col">Role</th>
                    <th className="au-th" scope="col">Status</th>
                    <th className="au-th au-th-right" scope="col">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <SkeletonRows count={6} />
                  ) : users.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="au-empty-cell">
                        <div className="au-empty">
                          <span className="au-empty-icon" aria-hidden="true">👥</span>
                          <strong>No users found</strong>
                          <span>
                            {hasFilters
                              ? "Try adjusting or clearing your filters."
                              : "No users on the platform yet."}
                          </span>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    users.map((user) => (
                      <tr key={user._id} className="au-table-row">
                        <td className="au-td">
                          <div className="au-user-cell">
                            <div className="au-avatar" aria-hidden="true">
                              {toInitials(user.name)}
                            </div>
                            <span className="au-user-name">{user.name}</span>
                          </div>
                        </td>
                        <td className="au-td au-email">{user.email}</td>
                        <td className="au-td">
                          <span className={ROLE_BADGE_CLASS[user.role] ?? "au-role-badge au-role-admin"}>
                            {ROLE_LABELS[user.role] ?? user.role}
                          </span>
                        </td>
                        <td className="au-td">
                          <StatusCell user={user} />
                        </td>
                        <td className="au-td au-td-right">
                          <div className="au-row-actions">
                            <button
                              className="au-icon-btn au-icon-btn-danger"
                              onClick={() => openDeleteModal(user)}
                              aria-label={`Delete ${user.name}`}
                              title="Delete user"
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
                <div className="au-pagination" aria-label="Pagination">
                  <button
                    className="au-page-btn"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    aria-label="Previous page"
                  >
                    ← Previous
                  </button>
                  <div className="au-page-numbers" role="list">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                      <button
                        key={p}
                        role="listitem"
                        className={`au-page-num${p === page ? " au-page-num-active" : ""}`}
                        onClick={() => setPage(p)}
                        aria-label={`Page ${p}`}
                        aria-current={p === page ? "page" : undefined}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                  <button
                    className="au-page-btn"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    aria-label="Next page"
                  >
                    Next →
                  </button>
                </div>
              )}
            </div>

            {/* ── Mobile cards ───────────────────────────────────────── */}
            <div className="au-mobile-list" aria-label="Users list">
              {loading ? (
                <SkeletonCards count={4} />
              ) : users.length === 0 ? (
                <div className="au-empty au-empty-mobile">
                  <span className="au-empty-icon" aria-hidden="true">👥</span>
                  <strong>No users found</strong>
                  <span>
                    {hasFilters
                      ? "Try adjusting or clearing your filters."
                      : "No users on the platform yet."}
                  </span>
                </div>
              ) : (
                users.map((user) => (
                  <div key={user._id} className="au-mobile-card">
                    <div className="au-mc-top">
                      <div className="au-user-cell">
                        <div className="au-avatar" aria-hidden="true">
                          {toInitials(user.name)}
                        </div>
                        <div>
                          <div className="au-user-name">{user.name}</div>
                          <div className="au-email au-mc-email">{user.email}</div>
                        </div>
                      </div>
                      <span className={STATUS_BADGE_CLASS[user.status] ?? "au-status-badge au-status-approved"}>
                        <span className="au-status-dot" aria-hidden="true" />
                        {STATUS_LABELS[user.status] ?? "Active"}
                      </span>
                    </div>
                    <div className="au-mc-footer">
                      <span className={ROLE_BADGE_CLASS[user.role] ?? "au-role-badge au-role-admin"}>
                        {ROLE_LABELS[user.role] ?? user.role}
                      </span>
                      <div className="au-row-actions">
                        {user.role === "recruiter" && (
                          <select
                            className={`au-status-select au-status-select-${user.status ?? "pending"} au-status-select-sm`}
                            value={user.status ?? "pending"}
                            onChange={(e) => handleStatusChange(user._id, e.target.value)}
                            disabled={statusBusy[user._id]}
                            aria-label={`Change status for ${user.name}`}
                          >
                            {STATUS_OPTIONS.map(({ value, label }) => (
                              <option key={value} value={value}>{label}</option>
                            ))}
                          </select>
                        )}
                        <button
                          className="au-icon-btn au-icon-btn-danger"
                          onClick={() => openDeleteModal(user)}
                          aria-label={`Delete ${user.name}`}
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
        title="Delete User Account?"
        body={deleteModalBody}
        confirmLabel="Delete Permanently"
        confirmClass="modal-btn-danger"
        onConfirm={confirmDelete}
        confirmLoading={deleteLoading}
        icon="warn"
      />
    </div>
  );
}

export default AdminUsersPage;
