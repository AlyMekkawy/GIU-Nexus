import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import api from "../services/api";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import JobCard from "../components/JobCard";
import Spinner from "../components/Spinner";
import "./JobListPage.css";

// Category filter options
const CATEGORIES = [
  { label: "Frontend", value: "Frontend" },
  { label: "Backend", value: "Backend" },
  { label: "AI & Research", value: "AI/ML" },
  { label: "DevOps", value: "DevOps" },
  { label: "Data Engineering", value: "Data Engineering" },
];

// Job type options
const JOB_TYPES = [
  { label: "Full-time", value: "full-time" },
  { label: "Part-time", value: "part-time" },
  { label: "Internship", value: "internship" },
];

// Status options
const STATUS_OPTIONS = [
  { label: "Open", value: "open" },
  { label: "Closed", value: "closed" },
];

const PAGE_LIMIT = 6;

// Helper to format date
function formatDate(isoDate) {
  if (!isoDate) return "";
  const date = new Date(isoDate);
  if (isNaN(date)) return "";
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? "s" : ""} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
  if (diffDays === 1) return "1 day ago";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} week${Math.floor(diffDays / 7) > 1 ? "s" : ""} ago`;

  return date.toLocaleDateString();
}

function JobListPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  // State for filters
  const [keyword, setKeyword] = useState(searchParams.get("keyword") || "");
  const [location, setLocation] = useState(searchParams.get("location") || "");
  const [type, setType] = useState(searchParams.get("type") || "");
  const [status, setStatus] = useState(searchParams.get("status") || "open");
  const [category, setCategory] = useState(searchParams.get("category") || "");

  // State for jobs and pagination
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(parseInt(searchParams.get("page")) || 1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // Fetch jobs whenever filters or page change
  const fetchJobs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (keyword) params.set("keyword", keyword);
      if (location) params.set("location", location);
      if (type) params.set("type", type);
      if (status) params.set("status", status);
      if (category) params.set("category", category);
      params.set("page", page);
      params.set("limit", PAGE_LIMIT);

      const res = await api.get(`/jobs?${params.toString()}`);
      setJobs(res.data.jobs || []);
      setTotal(res.data.total || 0);
      const pages = Math.ceil((res.data.total || 0) / PAGE_LIMIT);
      setTotalPages(pages);
    } catch (err) {
      setError(err.message || "Failed to load jobs");
      setJobs([]);
    } finally {
      setLoading(false);
    }
  }, [keyword, location, type, status, category, page]);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  // Update URL params when filters change
  useEffect(() => {
    const params = new URLSearchParams();
    if (keyword) params.set("keyword", keyword);
    if (location) params.set("location", location);
    if (type) params.set("type", type);
    if (status) params.set("status", status);
    if (category) params.set("category", category);
    params.set("page", page);
    setSearchParams(params);
  }, [keyword, location, type, status, category, page, setSearchParams]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
  };

  const handleCategoryToggle = (catValue) => {
    setCategory(category === catValue ? "" : catValue);
    setPage(1);
  };

  const handleClearFilters = () => {
    setKeyword("");
    setLocation("");
    setType("");
    setStatus("open");
    setCategory("");
    setPage(1);
  };

  const hasActiveFilters = keyword || location || type || category;

  return (
    <div style={{ background: "#f5f5f7", minHeight: "100vh", fontFamily: "Inter, system-ui, sans-serif" }}>
      <Navbar />

      <main style={{ paddingTop: "64px" }}>
        {/* Header Section */}
        <section style={{ maxWidth: "1200px", margin: "0 auto", padding: "3rem 1.5rem 2rem" }}>
          <h1 style={{ fontSize: "2.5rem", fontWeight: "700", color: "#1b1b1d", margin: "0 0 0.5rem" }}>
            Explore jobs
          </h1>
          <p style={{ fontSize: "1.0625rem", color: "#6b7280", margin: 0 }}>
            AI-categorized opportunities tailored for top-tier university talent.
          </p>
        </section>

        {/* Search and Filters Section */}
        <section style={{ maxWidth: "1200px", margin: "0 auto 2rem", padding: "0 1.5rem" }}>
          <form
            onSubmit={handleSearch}
            style={{
              display: "grid",
              gridTemplateColumns: "1fr auto auto auto auto",
              gap: "0.75rem",
              alignItems: "flex-end",
            }}
          >
            {/* Search input */}
            <div style={{ position: "relative" }}>
              <input
                type="text"
                placeholder="Keywords, roles, or companies"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                style={{
                  width: "100%",
                  padding: "0.75rem 1rem 0.75rem 2.5rem",
                  border: "1px solid #e5e7eb",
                  borderRadius: "8px",
                  fontSize: "0.95rem",
                  fontFamily: "inherit",
                }}
              />
              <span
                style={{
                  position: "absolute",
                  left: "0.75rem",
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "#9ca3af",
                }}
              >
                🔍
              </span>
            </div>

            {/* Location select */}
            <select
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              style={{
                padding: "0.75rem 1rem",
                border: "1px solid #e5e7eb",
                borderRadius: "8px",
                fontSize: "0.95rem",
                fontFamily: "inherit",
                background: "#fff",
                cursor: "pointer",
              }}
            >
              <option value="">Location</option>
              <option value="Cairo">Cairo</option>
              <option value="Alexandria">Alexandria</option>
              <option value="Giza">Giza</option>
              <option value="Remote">Remote</option>
              <option value="New York">New York</option>
              <option value="San Francisco">San Francisco</option>
              <option value="London">London</option>
            </select>

            {/* Job Type select */}
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              style={{
                padding: "0.75rem 1rem",
                border: "1px solid #e5e7eb",
                borderRadius: "8px",
                fontSize: "0.95rem",
                fontFamily: "inherit",
                background: "#fff",
                cursor: "pointer",
              }}
            >
              <option value="">Job Type</option>
              {JOB_TYPES.map((jt) => (
                <option key={jt.value} value={jt.value}>
                  {jt.label}
                </option>
              ))}
            </select>

            {/* Status select */}
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              style={{
                padding: "0.75rem 1rem",
                border: "1px solid #e5e7eb",
                borderRadius: "8px",
                fontSize: "0.95rem",
                fontFamily: "inherit",
                background: "#fff",
                cursor: "pointer",
              }}
            >
              {STATUS_OPTIONS.map((st) => (
                <option key={st.value} value={st.value}>
                  {st.label}
                </option>
              ))}
            </select>

            {/* Search button */}
            <button
              type="submit"
              style={{
                padding: "0.75rem 2rem",
                background: "#004e9f",
                color: "white",
                border: "none",
                borderRadius: "8px",
                fontSize: "0.95rem",
                fontWeight: "600",
                cursor: "pointer",
                transition: "background 0.2s",
              }}
              onMouseEnter={(e) => (e.target.style.background = "#003d7a")}
              onMouseLeave={(e) => (e.target.style.background = "#004e9f")}
            >
              Search
            </button>
          </form>

          {/* Category filter chips */}
          <div style={{ display: "flex", gap: "0.75rem", marginTop: "1.25rem", flexWrap: "wrap", alignItems: "center" }}>
            <span style={{ fontSize: "0.875rem", color: "#6b7280", fontWeight: "500" }}>Category:</span>
            {CATEGORIES.map((cat) => (
              <button
                key={cat.value}
                onClick={() => handleCategoryToggle(cat.value)}
                style={{
                  padding: "0.5rem 1rem",
                  border: category === cat.value ? "2px solid #004e9f" : "1px solid #e5e7eb",
                  borderRadius: "999px",
                  background: category === cat.value ? "#e8f4ff" : "#fff",
                  color: category === cat.value ? "#004e9f" : "#4b5563",
                  fontSize: "0.875rem",
                  fontWeight: "500",
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}
              >
                {cat.label}
              </button>
            ))}

            {/* Clear filters button */}
            {hasActiveFilters && (
              <button
                onClick={handleClearFilters}
                style={{
                  padding: "0.5rem 1rem",
                  border: "none",
                  borderRadius: "999px",
                  background: "#f3f4f6",
                  color: "#6b7280",
                  fontSize: "0.875rem",
                  cursor: "pointer",
                  marginLeft: "auto",
                }}
              >
                Clear all
              </button>
            )}
          </div>
        </section>

        {/* Results info */}
        {!loading && jobs.length > 0 && (
          <section style={{ maxWidth: "1200px", margin: "0 auto 1.5rem", padding: "0 1.5rem" }}>
            <p style={{ fontSize: "0.9rem", color: "#6b7280", margin: 0 }}>
              Showing {(page - 1) * PAGE_LIMIT + 1}–{Math.min(page * PAGE_LIMIT, total)} of {total} jobs
            </p>
          </section>
        )}

        {/* Loading State */}
        {loading && (
          <section style={{ maxWidth: "1200px", margin: "0 auto 4rem", padding: "0 1.5rem" }}>
            <div style={{ display: "flex", justifyContent: "center", padding: "3rem 1rem" }}>
              <Spinner />
            </div>
          </section>
        )}

        {/* Error State */}
        {!loading && error && (
          <section style={{ maxWidth: "1200px", margin: "0 auto 4rem", padding: "0 1.5rem" }}>
            <div
              style={{
                background: "#fee2e2",
                border: "1px solid #fecaca",
                borderRadius: "8px",
                padding: "2rem",
                textAlign: "center",
              }}
            >
              <p style={{ color: "#991b1b", fontSize: "0.95rem", margin: 0 }}>
                {error}
              </p>
              <button
                onClick={() => fetchJobs()}
                style={{
                  marginTop: "1rem",
                  padding: "0.5rem 1.25rem",
                  background: "#991b1b",
                  color: "white",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontSize: "0.9rem",
                }}
              >
                Try Again
              </button>
            </div>
          </section>
        )}

        {/* Empty State */}
        {!loading && !error && jobs.length === 0 && (
          <section style={{ maxWidth: "1200px", margin: "0 auto 4rem", padding: "0 1.5rem" }}>
            <div
              style={{
                background: "#fff",
                border: "1px solid #e5e7eb",
                borderRadius: "12px",
                padding: "4rem 2rem",
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: "3.5rem", marginBottom: "1rem" }}>🔍</div>
              <h2 style={{ fontSize: "1.25rem", fontWeight: "600", color: "#1b1b1d", margin: "0 0 0.5rem" }}>
                No jobs found
              </h2>
              <p style={{ color: "#6b7280", margin: 0 }}>
                Try adjusting your search filters or browse all available positions.
              </p>
              {hasActiveFilters && (
                <button
                  onClick={handleClearFilters}
                  style={{
                    marginTop: "1.5rem",
                    padding: "0.6rem 1.5rem",
                    background: "#004e9f",
                    color: "white",
                    border: "none",
                    borderRadius: "8px",
                    cursor: "pointer",
                    fontSize: "0.95rem",
                    fontWeight: "500",
                  }}
                >
                  Clear Filters
                </button>
              )}
            </div>
          </section>
        )}

        {/* Jobs Grid */}
        {!loading && !error && jobs.length > 0 && (
          <section style={{ maxWidth: "1200px", margin: "0 auto 3rem", padding: "0 1.5rem" }}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
                gap: "1.5rem",
              }}
            >
              {jobs.map((job) => (
                <JobCard key={job._id} job={job} initialSaved={job.saved || false} />
              ))}
            </div>
          </section>
        )}

        {/* Pagination */}
        {!loading && !error && jobs.length > 0 && totalPages > 1 && (
          <section style={{ maxWidth: "1200px", margin: "0 auto 4rem", padding: "0 1.5rem" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                gap: "0.5rem",
                flexWrap: "wrap",
              }}
            >
              {/* Previous button */}
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                style={{
                  padding: "0.625rem 1rem",
                  border: "1px solid #d1d5db",
                  background: page === 1 ? "#f3f4f6" : "#fff",
                  color: page === 1 ? "#9ca3af" : "#374151",
                  borderRadius: "6px",
                  cursor: page === 1 ? "not-allowed" : "pointer",
                  fontSize: "0.875rem",
                  fontWeight: "500",
                  transition: "all 0.2s",
                }}
              >
                ← Previous
              </button>

              {/* Page numbers */}
              <div style={{ display: "flex", gap: "0.25rem", flexWrap: "wrap" }}>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => {
                  // Show first page, last page, current page, and neighbors
                  const showPage =
                    p === 1 ||
                    p === totalPages ||
                    (p >= page - 1 && p <= page + 1);

                  if (!showPage && p !== 2 && p !== totalPages - 1) {
                    if (p === page - 2) {
                      return (
                        <span key="dots-before" style={{ color: "#d1d5db", padding: "0.625rem 0.5rem" }}>
                          ...
                        </span>
                      );
                    }
                    if (p === page + 2) {
                      return (
                        <span key="dots-after" style={{ color: "#d1d5db", padding: "0.625rem 0.5rem" }}>
                          ...
                        </span>
                      );
                    }
                    return null;
                  }

                  return (
                    <button
                      key={p}
                      onClick={() => setPage(p)}
                      style={{
                        padding: "0.625rem 0.875rem",
                        border: p === page ? "2px solid #004e9f" : "1px solid #d1d5db",
                        background: p === page ? "#004e9f" : "#fff",
                        color: p === page ? "#fff" : "#374151",
                        borderRadius: "6px",
                        cursor: "pointer",
                        fontSize: "0.875rem",
                        fontWeight: "500",
                        transition: "all 0.2s",
                      }}
                      aria-label={`Page ${p}`}
                      aria-current={p === page ? "page" : undefined}
                    >
                      {p}
                    </button>
                  );
                })}
              </div>

              {/* Next button */}
              <button
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page === totalPages}
                style={{
                  padding: "0.625rem 1rem",
                  border: "1px solid #d1d5db",
                  background: page === totalPages ? "#f3f4f6" : "#fff",
                  color: page === totalPages ? "#9ca3af" : "#374151",
                  borderRadius: "6px",
                  cursor: page === totalPages ? "not-allowed" : "pointer",
                  fontSize: "0.875rem",
                  fontWeight: "500",
                  transition: "all 0.2s",
                }}
              >
                Next →
              </button>
            </div>
          </section>
        )}
      </main>

      <Footer />

      {/* Floating action button */}
      <div
        style={{
          position: "fixed",
          bottom: "2rem",
          right: "2rem",
          width: "3.5rem",
          height: "3.5rem",
          background: "#004e9f",
          borderRadius: "50%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
          fontSize: "1.5rem",
          transition: "transform 0.2s, box-shadow 0.2s",
        }}
        onClick={() => {
          document.querySelector('input[type="text"]')?.focus();
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = "scale(1.1)";
          e.currentTarget.style.boxShadow = "0 6px 16px rgba(0, 0, 0, 0.2)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "scale(1)";
          e.currentTarget.style.boxShadow = "0 4px 12px rgba(0, 0, 0, 0.15)";
        }}
        title="Search jobs"
      >
        🔍
      </div>
    </div>
  );
}

export default JobListPage;

