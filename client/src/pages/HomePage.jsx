import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { gsap } from "gsap";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import Spinner from "../components/Spinner";
import Hero from "../components/Hero";
import IntelligenceCards from "../components/IntelligenceCards";
import JobCard from "../components/JobCard";
import RecommendedJobCard from "../components/RecommendedJobCard";
import CursorEffect from "../components/CursorEffect";
import "./HomePage.css";

function HomePage() {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  const [jobs,        setJobs]        = useState([]);
  const [recommended, setRecommended] = useState([]);
  const [loadingJobs, setLoadingJobs] = useState(true);
  const [loadingRec,  setLoadingRec]  = useState(false);

  const [keyword,  setKeyword]  = useState("");
  const [location, setLocation] = useState("");
  const [type,     setType]     = useState("");

  const recRef     = useRef(null);
  const trendRef   = useRef(null);
  const ctaRef     = useRef(null);

  /* ── Fetch latest jobs ─────────────────────────────────────── */
  useEffect(() => {
    api.get("/jobs?status=open&limit=6")
      .then(res => setJobs(res.data.jobs || []))
      .catch(() => {})
      .finally(() => setLoadingJobs(false));
  }, []);

  /* ── Fetch recommendations (jobSeeker only) ────────────────── */
  const userId   = user?._id;
  const userRole = user?.role;

  useEffect(() => {
    if (!isAuthenticated || userRole !== "jobSeeker") return;
    let cancelled = false;
    setLoadingRec(true);
    api.get("/jobs/recommended")
      .then(res  => { if (!cancelled) setRecommended(res.data.jobs || []); })
      .catch(()  => { if (!cancelled) setRecommended([]); })
      .finally(() => { if (!cancelled) setLoadingRec(false); });
    return () => { cancelled = true; };
  }, [isAuthenticated, userRole, userId]);

  /* ── Scroll-reveal for sections ────────────────────────────── */
  useEffect(() => {
    const targets = [recRef.current, trendRef.current, ctaRef.current].filter(Boolean);
    const obs = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        gsap.fromTo(entry.target,
          { y: 40, opacity: 0 },
          { y: 0,  opacity: 1, duration: 0.8, ease: "power3.out" }
        );
        obs.unobserve(entry.target);
      });
    }, { threshold: 0.1 });
    targets.forEach(t => obs.observe(t));
    return () => obs.disconnect();
  }, [loadingJobs, isAuthenticated]);

  /* ── Search ────────────────────────────────────────────────── */
  function handleSearch(e) {
    e.preventDefault();
    const p = new URLSearchParams();
    if (keyword)  p.set("keyword",  keyword);
    if (location) p.set("location", location);
    if (type)     p.set("type",     type);
    navigate(`/jobs?${p.toString()}`);
  }

  const isJobSeeker = isAuthenticated && userRole === "jobSeeker";

  return (
    <div className="hp-page">
      <CursorEffect />
      <Navbar />

      <main className="hp-main">
        {/* ── Hero ─────────────────────────────────────────────── */}
        <Hero
          keyword={keyword}   setKeyword={setKeyword}
          location={location} setLocation={setLocation}
          type={type}         setType={setType}
          onSearch={handleSearch}
        />

        {/* ── Platform features ────────────────────────────────── */}
        <IntelligenceCards />

        {/* ── Recommended (job seekers only) ───────────────────── */}
        {isJobSeeker && (
          <section ref={recRef} className="hp-section">
            <div className="hp-section__head">
              <div>
                <span className="hp-section__eyebrow hp-section__eyebrow--gold">
                  <span className="material-symbols-outlined" style={{ fontSize: "14px", fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
                  AI Curated
                </span>
                <h2 className="hp-section__title">Recommended for You</h2>
                <p className="hp-section__sub">Opportunities matched to your skills and profile.</p>
              </div>
              <Link to="/jobs/recommended" className="hp-section__link">View all →</Link>
            </div>

            {loadingRec ? (
              <div className="hp-center"><Spinner /></div>
            ) : recommended.length === 0 ? (
              <div className="hp-empty">
                <span className="material-symbols-outlined hp-empty__icon">auto_awesome</span>
                <p className="hp-empty__text">No recommendations yet.</p>
                <Link to="/profile/edit" className="hp-empty__link">Complete your profile →</Link>
              </div>
            ) : (
              <div className="hp-grid hp-grid--3">
                {recommended.slice(0, 3).map(job => (
                  <RecommendedJobCard key={job._id} job={job} />
                ))}
              </div>
            )}
          </section>
        )}

        {/* ── Trending Jobs ─────────────────────────────────────── */}
        <section ref={trendRef} className="hp-section">
          <div className="hp-section__head">
            <div>
              <span className="hp-section__eyebrow">Latest</span>
              <h2 className="hp-section__title">Trending Jobs</h2>
              <p className="hp-section__sub">Fresh opportunities posted this week.</p>
            </div>
            <Link to="/jobs" className="hp-section__link">Browse all →</Link>
          </div>

          {loadingJobs ? (
            <div className="hp-center"><Spinner /></div>
          ) : jobs.length === 0 ? (
            <div className="hp-empty">
              <span className="material-symbols-outlined hp-empty__icon">work_off</span>
              <p className="hp-empty__text">No jobs available right now.</p>
            </div>
          ) : (
            <div className="hp-grid hp-grid--3">
              {jobs.slice(0, 6).map(job => (
                <JobCard key={job._id} job={job} />
              ))}
            </div>
          )}
        </section>

        {/* ── CTA (guests only) ─────────────────────────────────── */}
        {!isAuthenticated && (
          <section ref={ctaRef} className="hp-cta-wrap">
            <div className="hp-cta">
              <div className="hp-cta__glow" aria-hidden />
              <div className="hp-cta__stripe" aria-hidden />

              <div className="hp-cta__content">
                <span className="hp-cta__eyebrow">Join 1,200+ Students</span>
                <h2 className="hp-cta__title">Start Your Career Journey Today</h2>
                <p className="hp-cta__sub">
                  Create a free account and let AI match you with the best opportunities at top companies.
                </p>
                <div className="hp-cta__actions">
                  <Link to="/register" className="hp-cta__btn-primary">Create Free Account</Link>
                  <Link to="/jobs"     className="hp-cta__btn-ghost">Browse Jobs</Link>
                </div>
              </div>
            </div>
          </section>
        )}
      </main>

      <Footer />
    </div>
  );
}

export default HomePage;
