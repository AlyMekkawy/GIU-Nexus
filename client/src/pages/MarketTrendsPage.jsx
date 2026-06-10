import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { gsap } from 'gsap';
import api from '../services/api';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import './MarketTrendsPage.css';

function MarketTrendsPage() {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  const pageRef = useRef(null);

  // Entrance animation
  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        ['.mt-hero__label', '.mt-hero__title', '.mt-hero__subtitle'],
        { y: 24, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.65, stagger: 0.1, ease: 'power3.out', delay: 0.1 }
      );
      gsap.fromTo(
        '.mt-content',
        { y: 18, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.55, ease: 'power3.out', delay: 0.42 }
      );
    }, pageRef);
    return () => ctx.revert();
  }, []);

  useEffect(() => {
    let isMounted = true;
    api.get('/jobs/market-trends')
      .then(res => { if (isMounted) setData(res.data); })
      .catch(err => { if (isMounted) setError(err.response?.data?.message || err.message); })
      .finally(() => { if (isMounted) setLoading(false); });
    return () => { isMounted = false; };
  }, []);

  const maxSkillCount  = data?.topSkills?.[0]?.count  || 1;
  const maxCatCount    = data?.topCategories?.[0]?.count || 1;

  return (
    <div className="mt-page" ref={pageRef}>
      <Navbar />

      {/* Hero */}
      <section className="mt-hero">
        <div className="mt-hero__inner">
          <span className="mt-hero__label">
            <span
              className="material-symbols-outlined"
              style={{ fontSize: '14px', fontVariationSettings: "'FILL' 1", lineHeight: 1 }}
            >
              trending_up
            </span>
            Nexi Market Intelligence
          </span>
          <h1 className="mt-hero__title">Job Market Trends</h1>
          <p className="mt-hero__subtitle">
            Nexi analyzed every open role on the platform to surface what employers want right now
            — so you can focus on skills that matter.
          </p>
        </div>
      </section>

      {/* Content */}
      <main className="mt-content">

        {/* Loading */}
        {loading && (
          <div className="mt-loading">
            <div className="mt-loading__mascot">
              <img src="/Nexi/Nexi_InsightB.png" alt="Nexi analyzing" className="mt-loading__img" />
            </div>
            <p className="mt-loading__text">Nexi is analyzing the job market…</p>
            <div className="mt-loading__dots">
              <span /><span /><span />
            </div>
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="mt-error">
            <div className="mt-error__icon">
              <span className="material-symbols-outlined">wifi_off</span>
            </div>
            <h2 className="mt-error__title">Couldn't load market data</h2>
            <p className="mt-error__body">{error}</p>
            <Link to="/jobs" className="mt-error__btn">Browse All Jobs</Link>
          </div>
        )}

        {/* Data */}
        {!loading && !error && data && (
          <div className="mt-grid">

            {/* ── Nexi Brief ─────────────────────────────────────── */}
            <section className="mt-section mt-section--full mt-brief-section">
              <div className="mt-brief-card">
                <div className="mt-brief-nexi">
                  <div className="mt-brief-img-wrap">
                    <img src="/Nexi/Nexi_Summarize.png" alt="Nexi" className="mt-brief-img" />
                  </div>
                </div>
                <div className="mt-brief-body">
                  <div className="mt-brief-header">
                    <span className="mt-section__badge">
                      <span className="material-symbols-outlined" style={{ fontSize: '13px', fontVariationSettings: "'FILL' 1" }}>
                        auto_awesome
                      </span>
                      Nexi's Market Brief
                    </span>
                  </div>
                  <p className="mt-brief-text">{data.insight}</p>
                </div>
              </div>
            </section>

            {/* ── Top Skills ─────────────────────────────────────── */}
            <section className="mt-section mt-section--half">
              <div className="mt-section__head">
                <span className="mt-section__icon">
                  <img src="/Nexi/Nexi_Insight.png" alt="" />
                </span>
                <div>
                  <h2 className="mt-section__title">What employers want most</h2>
                  <p className="mt-section__sub">Top skills across all open roles</p>
                </div>
              </div>
              <div className="mt-skills-list">
                {data.topSkills.map((item, i) => (
                  <div className="mt-skill-row" key={item.skill}>
                    <span className="mt-skill-rank">#{i + 1}</span>
                    <span className="mt-skill-name">{item.skill}</span>
                    <div className="mt-skill-bar-wrap">
                      <div
                        className="mt-skill-bar"
                        style={{ width: `${Math.round((item.count / maxSkillCount) * 100)}%` }}
                      />
                    </div>
                    <span className="mt-skill-count">{item.count}</span>
                  </div>
                ))}
              </div>
            </section>

            {/* ── Top Categories ─────────────────────────────────── */}
            <section className="mt-section mt-section--half">
              <div className="mt-section__head">
                <span className="mt-section__icon">
                  <img src="/Nexi/Nexi_Discover.png" alt="" />
                </span>
                <div>
                  <h2 className="mt-section__title">Where hiring is happening</h2>
                  <p className="mt-section__sub">Open roles by job category</p>
                </div>
              </div>
              <div className="mt-cats-list">
                {data.topCategories.map((item) => (
                  <div className="mt-cat-row" key={item.category}>
                    <span className="mt-cat-name">{item.category}</span>
                    <div className="mt-cat-bar-wrap">
                      <div
                        className="mt-cat-bar"
                        style={{ width: `${Math.round((item.count / maxCatCount) * 100)}%` }}
                      />
                    </div>
                    <span className="mt-cat-count">{item.count} role{item.count !== 1 ? 's' : ''}</span>
                  </div>
                ))}
              </div>
            </section>

            {/* ── Recommended Skills ─────────────────────────────── */}
            {data.recommendedSkills?.length > 0 && (
              <section className="mt-section mt-section--full">
                <div className="mt-section__head">
                  <span className="mt-section__icon">
                    <img src="/Nexi/Nexi_InsightB.png" alt="" />
                  </span>
                  <div>
                    <h2 className="mt-section__title">Skills worth learning next</h2>
                    <p className="mt-section__sub">Emerging demand — not yet saturated</p>
                  </div>
                </div>
                <div className="mt-chips">
                  {data.recommendedSkills.map((skill) => (
                    <span className="mt-chip" key={skill}>{skill}</span>
                  ))}
                </div>
              </section>
            )}

          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}

export default MarketTrendsPage;
