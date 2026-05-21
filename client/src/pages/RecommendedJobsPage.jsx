import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { gsap } from 'gsap';
import api from '../services/api';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import Spinner from '../components/Spinner';
import '../styles/RecommendedJobsPage.css';

// Maps category value → CSS modifier class
const BADGE_CLASS = {
  'Frontend':         'frontend',
  'Backend':          'backend',
  'AI/ML':            'ai',
  'DevOps':           'devops',
  'Data Engineering': 'data',
  'Other':            'other',
};

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
    async function fetchRecommended() {
      try {
        const res = await api.get('/jobs/recommended');
        setJobs(res.data.jobs || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchRecommended();
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
              {jobs.map((job) => {
                const badgeClass = `rj-badge rj-badge--${BADGE_CLASS[job.category] || 'other'}`;
                const isSaved    = savedJobs.has(job._id);

                return (
                  <article key={job._id} className="rj-card">

                    {/* Card header */}
                    <div className="rj-card__head">
                      <div className="rj-card__avatar">
                        {job.company?.charAt(0).toUpperCase() || 'J'}
                      </div>
                      <div className="rj-card__badges">
                        <span className={badgeClass}>
                          <span
                            className="material-symbols-outlined"
                            style={{ fontVariationSettings: "'FILL' 1" }}
                          >
                            auto_awesome
                          </span>
                          {job.category || 'Other'}
                        </span>
                        {job.score !== undefined && job.score > 0 && (
                          <span className="rj-badge rj-badge--score">
                            ✦ {Math.round(job.score * 100)}% Match
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Card body */}
                    <h3 className="rj-card__title">{job.title}</h3>
                    <p className="rj-card__company">
                      {job.company}{job.location ? ` · ${job.location}` : ''}
                    </p>

                    {/* Skill tags */}
                    {(job.requirements || []).length > 0 && (
                      <div className="rj-card__skills">
                        {(job.requirements || []).slice(0, 3).map((skill, idx) => (
                          <span key={idx} className="rj-skill">{skill}</span>
                        ))}
                      </div>
                    )}

                    {/* Card footer */}
                    <div className="rj-card__foot">
                      <Link to={`/jobs/${job._id}`} className="rj-card__link">
                        View Details →
                      </Link>
                      <button
                        className={`rj-card__bookmark${isSaved ? ' saved' : ''}`}
                        onClick={() => toggleSaveJob(job._id)}
                        title={isSaved ? 'Unsave job' : 'Save job'}
                        type="button"
                      >
                        <span
                          className="material-symbols-outlined"
                          style={{ fontVariationSettings: isSaved ? "'FILL' 1" : "'FILL' 0" }}
                        >
                          bookmark
                        </span>
                      </button>
                    </div>

                  </article>
                );
              })}
            </div>
          </>
        )}
      </main>

      <Footer />
    </div>
  );
}

export default RecommendedJobsPage;
