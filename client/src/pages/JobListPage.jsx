import { useState, useEffect, useCallback, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { gsap } from "gsap";
import api from "../services/api";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import JobCard from "../components/JobCard";
import Spinner from "../components/Spinner";
import "./JobListPage.css";

// Category filter options
const CATEGORIES = [
  { label: "Frontend",      value: "Frontend" },
  { label: "Backend",       value: "Backend" },
  { label: "AI & Research", value: "AI/ML" },
  { label: "DevOps",        value: "DevOps" },
  { label: "Data Eng.",     value: "Data Engineering" },
];

// Job type options
const JOB_TYPES = [
  { label: "Full-time",  value: "full-time" },
  { label: "Part-time",  value: "part-time" },
  { label: "Internship", value: "internship" },
];

// Status options
const STATUS_OPTIONS = [
  { label: "Open",   value: "open" },
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
  const diffMins  = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays  = Math.floor(diffMs / 86400000);

  if (diffMins  < 1)  return "Just now";
  if (diffMins  < 60) return `${diffMins} minute${diffMins > 1 ? "s" : ""} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
  if (diffDays  === 1) return "1 day ago";
  if (diffDays  < 7)  return `${diffDays} days ago`;
  if (diffDays  < 30) return `${Math.floor(diffDays / 7)} week${Math.floor(diffDays / 7) > 1 ? "s" : ""} ago`;
  return date.toLocaleDateString();
}

function JobListPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  // Filters
  const [keyword,  setKeyword]  = useState(searchParams.get("keyword")   || "");
  const [location, setLocation] = useState(searchParams.get("location")  || "");
  const [type,     setType]     = useState(searchParams.get("type")      || "");
  const [status,   setStatus]   = useState(searchParams.get("status")    || "open");
  const [category, setCategory] = useState(searchParams.get("category")  || "");

  // Jobs + pagination
  const [jobs,       setJobs]       = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState(null);
  const [page,       setPage]       = useState(parseInt(searchParams.get("page")) || 1);
  const [total,      setTotal]      = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // Ref for GSAP context scope
  const pageRef = useRef(null);

  // ── Entrance animation ─────────────────────────────────────────
  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        [".jl-hero__label", ".jl-hero__title", ".jl-hero__subtitle"],
        { y: 24, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.65, stagger: 0.1, ease: "power3.out", delay: 0.1 }
      );
      gsap.fromTo(
        ".jl-search",
        { y: 18, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.55, ease: "power3.out", delay: 0.42 }
      );
    }, pageRef);
    return () => ctx.revert();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Fetch jobs ────────────────────────────────────────────────
  const fetchJobs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (keyword)  params.set("keyword",   keyword);
      if (location) params.set("location",  location);
      if (type)     params.set("type",      type);
      if (status)   params.set("status",    status);
      if (category) params.set("category",  category);
      params.set("page",  page);
      params.set("limit", PAGE_LIMIT);

      const res = await api.get(`/jobs?${params.toString()}`);
      setJobs(res.data.jobs || []);
      setTotal(res.data.total || 0);
      setTotalPages(Math.ceil((res.data.total || 0) / PAGE_LIMIT));
    } catch (err) {
      setError(err.message || "Failed to load jobs");
      setJobs([]);
    } finally {
      setLoading(false);
    }
  }, [keyword, location, type, status, category, page]);

  useEffect(() => { fetchJobs(); }, [fetchJobs]);

  // ── Sync URL params ────────────────────────────────────────────
  useEffect(() => {
    const params = new URLSearchParams();
    if (keyword)  params.set("keyword",  keyword);
    if (location) params.set("location", location);
    if (type)     params.set("type",     type);
    if (status)   params.set("status",   status);
    if (category) params.set("category", category);
    params.set("page", page);
    setSearchParams(params);
  }, [keyword, location, type, status, category, page, setSearchParams]);

  // ── Handlers ──────────────────────────────────────────────────
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

  // ── Pagination helpers ─────────────────────────────────────────
  const renderPageNumbers = () => {
    const items = [];
    for (let p = 1; p <= totalPages; p++) {
      const show = p === 1 || p === totalPages || (p >= page - 1 && p <= page + 1);
      if (!show) {
        if (p === page - 2 || p === page + 2) {
          items.push(<span key={`dots-${p}`} className="jl-page-dots">…</span>);
        }
        continue;
      }
      items.push(
        <button
          key={p}
          className={`jl-page-btn${p === page ? " active" : ""}`}
          onClick={() => setPage(p)}
          aria-label={`Page ${p}`}
          aria-current={p === page ? "page" : undefined}
        >
          {p}
        </button>
      );
    }
    return items;
  };

  // ── Render ─────────────────────────────────────────────────────
  return (
    <div className="jl-page" ref={pageRef}>
      <Navbar />

      {/* ── Hero ──────────────────────────────────────────────── */}
      <section className="jl-hero">
        <div className="jl-hero__inner">
          <span className="jl-hero__label">
            <span
              className="material-symbols-outlined"
              style={{ fontSize: "14px", fontVariationSettings: "'FILL' 1", lineHeight: 1 }}
            >
              work
            </span>
            Opportunities
          </span>
          <h1 className="jl-hero__title">Explore Jobs</h1>
          <p className="jl-hero__subtitle">
            AI-categorized opportunities tailored for top-tier university talent.
          </p>
        </div>
      </section>

      {/* ── Search + Chips ────────────────────────────────────── */}
      <div className="jl-search">
        <form className="jl-search__form" onSubmit={handleSearch}>
          {/* Keyword */}
          <div className="jl-search__input-wrap">
            <span className="material-symbols-outlined jl-search__icon">search</span>
            <input
              className="jl-search__input"
              type="text"
              placeholder="Keywords, roles, or companies"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
            />
          </div>

          {/* Location */}
          <select
            className="jl-search__select"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
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

          {/* Job type */}
          <select
            className="jl-search__select"
            value={type}
            onChange={(e) => setType(e.target.value)}
          >
            <option value="">Job Type</option>
            {JOB_TYPES.map((jt) => (
              <option key={jt.value} value={jt.value}>{jt.label}</option>
            ))}
          </select>

          {/* Status */}
          <select
            className="jl-search__select"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            {STATUS_OPTIONS.map((st) => (
              <option key={st.value} value={st.value}>{st.label}</option>
            ))}
          </select>

          {/* Submit */}
          <button className="jl-search__btn" type="submit">
            Search
          </button>
        </form>

        {/* Category chips */}
        <div className="jl-chips">
          <span className="jl-chips__label">Category</span>
          {CATEGORIES.map((cat) => (
            <button
              key={cat.value}
              className={`jl-chip${category === cat.value ? " active" : ""}`}
              onClick={() => handleCategoryToggle(cat.value)}
              type="button"
            >
              {cat.label}
            </button>
          ))}
          {hasActiveFilters && (
            <button
              className="jl-chip jl-chip--clear"
              onClick={handleClearFilters}
              type="button"
            >
              ✕ Clear all
            </button>
          )}
        </div>
      </div>

      {/* ── Main content ──────────────────────────────────────── */}
      <main className="jl-content">
        {/* Results count */}
        {!loading && jobs.length > 0 && (
          <div className="jl-results-bar">
            <p className="jl-results-bar__text">
              Showing {(page - 1) * PAGE_LIMIT + 1}–{Math.min(page * PAGE_LIMIT, total)} of {total} job{total !== 1 ? "s" : ""}
            </p>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="jl-spinner-wrap">
            <Spinner />
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="jl-error">
            <p className="jl-error__text">{error}</p>
            <button className="jl-error__btn" onClick={() => fetchJobs()}>
              Try Again
            </button>
          </div>
        )}

        {/* Empty */}
        {!loading && !error && jobs.length === 0 && (
          <div className="jl-empty">
            <span className="jl-empty__icon">🔍</span>
            <h2 className="jl-empty__title">No jobs found</h2>
            <p className="jl-empty__body">
              Try adjusting your search filters or browse all available positions.
            </p>
            {hasActiveFilters && (
              <button className="jl-empty__btn" onClick={handleClearFilters}>
                Clear Filters
              </button>
            )}
          </div>
        )}

        {/* Job grid */}
        {!loading && !error && jobs.length > 0 && (
          <div className="jl-grid">
            {jobs.map((job) => (
              <JobCard key={job._id} job={job} initialSaved={job.saved || false} />
            ))}
          </div>
        )}

        {/* Pagination */}
        {!loading && !error && jobs.length > 0 && totalPages > 1 && (
          <nav className="jl-pagination" aria-label="Job list pagination">
            <button
              className="jl-page-btn"
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
            >
              ← Prev
            </button>

            {renderPageNumbers()}

            <button
              className="jl-page-btn"
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              disabled={page === totalPages}
            >
              Next →
            </button>
          </nav>
        )}
      </main>

      <Footer />
    </div>
  );
}

export default JobListPage;
