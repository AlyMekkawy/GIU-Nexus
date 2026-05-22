import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { gsap } from 'gsap';
import api from '../services/api';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import Spinner from '../components/Spinner';
import JobCard from '../components/JobCard';
import '../styles/RecommendedJobsPage.css';

function RecommendedJobsPage() {
  const [jobs,      setJobs]      = useState([]);
  const [savedJobs, setSavedJobs] = useState(new Set());
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState(null);

  const pageRef = useRef(null);

  // ── Entrance animation ─────────────────────────────────────────
  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
          ['.rj-hero__label', '.rj-hero__title', '.rj-hero__subtitle'],
          { y: 24, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.65, stagger: 0.1, ease: 'power3.out', delay: 0.1 }
      );
      gsap.fromTo(
          '.rj-content',
          { y: 18, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.55, ease: 'power3.out', delay: 0.42 }
      );
    }, pageRef);
    return () => ctx.revert();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Fetch recommended jobs ─────────────────────────────────────
  useEffect(() => {
    let isMounted = true;

    async function fetchRecommended() {
      const [recommendedResult, savedResult] = await Promise.allSettled([
        api.get('/jobs/recommended'),
        api.get('/jobs/saved'),
      ]);

      if (!isMounted) return;

      if (recommendedResult.status === 'fulfilled') {
        setJobs(recommendedResult.value.data.jobs || []);
      } else {
        setError(recommendedResult.reason.message);
      }

      if (savedResult.status === 'fulfilled') {
        const savedIds = (savedResult.value.data.jobs || []).map((job) => job._id);
        setSavedJobs(new Set(savedIds));
      }

      setLoading(false);
    }

    fetchRecommended();

    return () => {
      isMounted = false;
    };
  }, []);

  // ── Save / unsave toggle ───────────────────────────────────────
  const toggleSaveJob = async (jobId) => {
    try {
      const res = await api.post(`/jobs/${jobId}/save`);
      if (res.data.success) {
        setSavedJobs((prev) => {
          const next = new Set(prev);
          res.data.saved ? next.add(jobId) : next.delete(jobId);
          return next;
        });
      }
    } catch (err) {
      console.error('Error saving job:', err);
    }
  };

  // ── Render ─────────────────────────────────────────────────────
  return (
      <div className="rj-page" ref={pageRef}>
        <Navbar />

        {/* ── Hero ────────────────────────────────────────────────── */}
        <section className="rj-hero">
          <div className="rj-hero__inner">
          <span className="rj-hero__label">
            <span
                className="material-symbols-outlined"
                style={{ fontSize: '14px', fontVariationSettings: "'FILL' 1", lineHeight: 1 }}
            >
              auto_awesome
            </span>
            AI Powered
          </span>
            <h1 className="rj-hero__title">Recommended for You</h1>
            <p className="rj-hero__subtitle">
              Our AI ranking engine has analyzed your profile bio and preferences to curate
              these opportunities specifically for your career trajectory.
            </p>
          </div>
        </section>

        {/* ── Content ─────────────────────────────────────────────── */}
        <main className="rj-content">

          {/* Loading */}
          {loading && (
              <div className="rj-spinner-wrap">
                <Spinner />
              </div>
          )}

          {/* Error */}
          {!loading && error && (
              <div className="rj-error">
                <div className="rj-error__icon">
                  <span className="material-symbols-outlined">wifi_off</span>
                </div>
                <h2 className="rj-error__title">AI service unavailable</h2>
                <p className="rj-error__body">
                  The recommendation engine is temporarily unavailable. Browse all jobs instead.
                </p>
                <Link to="/jobs" className="rj-error__btn">Browse All Jobs</Link>
              </div>
          )}

          {/* Empty */}
          {!loading && !error && jobs.length === 0 && (
              <div className="rj-empty">
                <div className="rj-empty__icon">
                  <span className="material-symbols-outlined">person_search</span>
                </div>
                <h2 className="rj-empty__title">No recommendations yet</h2>
                <p className="rj-empty__body">
                  Our AI needs a bit more context to find your perfect fit. Add a detailed bio to
                  your profile to unlock personalized matches.
                </p>
                <Link to="/profile" className="rj-empty__btn">Update Profile Bio</Link>
              </div>
          )}

          {/* Results */}
          {!loading && !error && jobs.length > 0 && (
              <>
                <p className="rj-count">
                  {jobs.length} opportunit{jobs.length === 1 ? 'y' : 'ies'} matched to your profile
                </p>

                <div className="rj-grid">
                  {jobs.map((job) => (
                      <JobCard
                          key={job._id}
                          job={job}
                          isSaved={savedJobs.has(job._id)}
                          onToggleSave={toggleSaveJob}
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

export default RecommendedJobsPage;