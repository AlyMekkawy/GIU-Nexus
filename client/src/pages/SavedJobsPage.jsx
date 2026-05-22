import { useState, useEffect, useCallback, useRef } from 'react';
import { gsap } from 'gsap';
import JobCard from '../components/JobCard';
import Spinner from '../components/Spinner';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import api from '../services/api';
import './SavedJobsPage.css';

export default function SavedJobsPage() {
  const [savedJobs, setSavedJobs] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState(null);

  const pageRef = useRef(null);

  // ── Entrance animation ─────────────────────────────────────────
  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        ['.sj-hero__label', '.sj-hero__title', '.sj-hero__subtitle'],
        { y: 24, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.65, stagger: 0.1, ease: 'power3.out', delay: 0.1 }
      );
      gsap.fromTo(
        '.sj-content',
        { y: 18, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.55, ease: 'power3.out', delay: 0.42 }
      );
    }, pageRef);
    return () => ctx.revert();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Fetch saved jobs ───────────────────────────────────────────
  const fetchSavedJobs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/jobs/saved');
      const jobs =
        res.data.jobs ??
        res.data.data ??
        res.data.savedJobs ??
        (Array.isArray(res.data) ? res.data : []);
      setSavedJobs(jobs);
    } catch (err) {
      setError(err.response?.data?.message ?? 'Failed to load saved jobs.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchSavedJobs(); }, [fetchSavedJobs]);

  // Toggle bookmark state using the same backend endpoint as other job cards.
  const handleToggleSave = async (jobId) => {
    try {
      const res = await api.post(`/jobs/${jobId}/save`);
      if (res.data.success && res.data.saved === false) {
        setSavedJobs((prev) => prev.filter((j) => (j._id ?? j.id) !== jobId));
      }
    } catch (err) {
      console.error('Error toggling saved job:', err);
    }
  };

  // ── Render ─────────────────────────────────────────────────────
  return (
    <div className="sj-page" ref={pageRef}>
      <Navbar />

      {/* ── Hero ────────────────────────────────────────────────── */}
      <section className="sj-hero">
        <div className="sj-hero__inner">
          <span className="sj-hero__label">
            <span
              className="material-symbols-outlined"
              style={{ fontSize: '14px', fontVariationSettings: "'FILL' 1", lineHeight: 1 }}
            >
              bookmark
            </span>
            Your Bookmarks
          </span>
          <h1 className="sj-hero__title">Saved Jobs</h1>
          <p className="sj-hero__subtitle">
            Positions you&apos;ve bookmarked — ready when you are.
          </p>
        </div>
      </section>

      {/* ── Content ─────────────────────────────────────────────── */}
      <main className="sj-content">

        {/* Loading */}
        {loading && (
          <div className="sj-spinner-wrap">
            <Spinner />
            <span>Loading your saved jobs…</span>
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="sj-error">
            <p className="sj-error__text">{error}</p>
            <button className="sj-retry-btn" onClick={fetchSavedJobs}>
              Try again
            </button>
          </div>
        )}

        {/* Empty */}
        {!loading && !error && savedJobs.length === 0 && (
          <div className="sj-empty">
            <div className="sj-empty__icon-wrap">
              <span className="material-symbols-outlined">bookmark</span>
            </div>
            <h2 className="sj-empty__title">No saved jobs yet</h2>
            <p className="sj-empty__body">
              Browse listings and click the bookmark icon on any job to save it here.
            </p>
            <a href="/jobs" className="sj-empty__btn">Browse Jobs</a>
          </div>
        )}

        {/* Grid */}
        {!loading && !error && savedJobs.length > 0 && (
          <>
            <p className="sj-count">
              {savedJobs.length} saved {savedJobs.length === 1 ? 'job' : 'jobs'}
            </p>
            <div className="sj-grid">
              {savedJobs.map((job) => (
                <JobCard
                  key={job._id ?? job.id}
                  job={job}
                  isSaved={true}
                  onToggleSave={handleToggleSave}
                />
              ))}
            </div>
          </>
        )}

      </main>

      <Footer />
    </div>
  );
}
