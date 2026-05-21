import { useRef, useEffect, useState } from "react";
import { gsap } from "gsap";
import Scene3D from "./Scene3D";

const ROLES = ["Engineering", "Design", "Data Science", "DevOps", "AI & ML"];

function Hero({ keyword, setKeyword, location, setLocation, type, setType, onSearch }) {
  const heroRef     = useRef(null);
  const badgeRef    = useRef(null);
  const titleRef    = useRef(null);
  const subtitleRef = useRef(null);
  const searchRef   = useRef(null);
  const statsRef    = useRef(null);

  const [roleIndex, setRoleIndex] = useState(0);
  const [exiting,   setExiting]   = useState(false);

  /* ── Entrance animation ─────────────────────────────────────── */
  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: "power4.out" } });

      tl.fromTo(badgeRef.current,
        { x: -24, opacity: 0 },
        { x: 0,   opacity: 1, duration: 0.7 }
      )
      .fromTo(titleRef.current,
        { x: -40, opacity: 0 },
        { x: 0,   opacity: 1, duration: 1 },
        "-=0.4"
      )
      .fromTo(subtitleRef.current,
        { x: -24, opacity: 0 },
        { x: 0,   opacity: 1, duration: 0.8 },
        "-=0.6"
      )
      .fromTo(searchRef.current,
        { y: 20, opacity: 0, scale: 0.97 },
        { y: 0,  opacity: 1, scale: 1, duration: 0.8 },
        "-=0.5"
      )
      .fromTo(Array.from(statsRef.current?.children ?? []),
        { y: 16, opacity: 0 },
        { y: 0,  opacity: 1, duration: 0.6, stagger: 0.1 },
        "-=0.4"
      );
    }, heroRef);

    return () => ctx.revert();
  }, []);

  /* ── Role cycling ──────────────────────────────────────────── */
  useEffect(() => {
    const id = setInterval(() => {
      setExiting(true);
      setTimeout(() => {
        setRoleIndex(i => (i + 1) % ROLES.length);
        setExiting(false);
      }, 350);
    }, 2800);
    return () => clearInterval(id);
  }, []);

  return (
    <section ref={heroRef} className="hp-hero">
      {/* Background layers */}
      <div className="hp-hero__grid"   aria-hidden />
      <div className="hp-hero__glow"   aria-hidden />
      <div className="hp-hero__stripe" aria-hidden />

      {/* ── Split: text left · sphere right ───────────────────── */}
      <div className="hp-hero__split">

        {/* LEFT — text content */}
        <div className="hp-hero__content">

          <div ref={badgeRef} className="hp-hero__badge" style={{ opacity: 0 }}>
            <span className="hp-hero__badge-dot" />
            AI-Powered Career Matching
          </div>

          <h1 ref={titleRef} className="hp-hero__title" style={{ opacity: 0 }}>
            Find Your Career in<br />
            <span className={`hp-hero__role ${exiting ? "hp-hero__role--out" : "hp-hero__role--in"}`}>
              {ROLES[roleIndex]}
            </span>
          </h1>

          <p ref={subtitleRef} className="hp-hero__subtitle" style={{ opacity: 0 }}>
            Intelligence-led career matching for GIU students and graduates.
            We extract your core strengths and surface opportunities that fit.
          </p>

          <form ref={searchRef} onSubmit={onSearch} className="hp-hero__form" style={{ opacity: 0 }}>
            <div className="hp-hero__bar">
              <div className="hp-hero__field hp-hero__field--sep">
                <span className="material-symbols-outlined hp-hero__field-icon">search</span>
                <input
                  className="hp-hero__input"
                  placeholder="Job title or keyword"
                  value={keyword}
                  onChange={e => setKeyword(e.target.value)}
                />
              </div>

              <div className="hp-hero__field hp-hero__field--sep">
                <span className="material-symbols-outlined hp-hero__field-icon">location_on</span>
                <input
                  className="hp-hero__input"
                  placeholder="Location"
                  value={location}
                  onChange={e => setLocation(e.target.value)}
                />
              </div>

              <div className="hp-hero__field">
                <span className="material-symbols-outlined hp-hero__field-icon">work</span>
                <select
                  className="hp-hero__input hp-hero__select"
                  value={type}
                  onChange={e => setType(e.target.value)}
                >
                  <option value="">All Types</option>
                  <option value="full-time">Full-time</option>
                  <option value="part-time">Part-time</option>
                  <option value="internship">Internship</option>
                </select>
              </div>

              <button type="submit" className="hp-hero__btn">
                <span className="material-symbols-outlined">search</span>
                Search Jobs
              </button>
            </div>
          </form>

          <div ref={statsRef} className="hp-hero__stats">
            {[
              { value: "500+", label: "Open Positions"   },
              { value: "80+",  label: "Partner Companies" },
              { value: "AI",   label: "Skill Matching"   },
            ].map(({ value, label }) => (
              <div key={label} className="hp-hero__stat">
                <span className="hp-hero__stat-value">{value}</span>
                <span className="hp-hero__stat-label">{label}</span>
              </div>
            ))}
          </div>

        </div>

        {/* RIGHT — 3D sphere */}
        <div className="hp-hero__3d" aria-hidden="true">
          <Scene3D />
        </div>

      </div>
    </section>
  );
}

export default Hero;
