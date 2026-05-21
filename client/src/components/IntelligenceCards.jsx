import { useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { gsap } from "gsap";

const FEATURES = [
  {
    icon: "auto_awesome",
    accent: "#FFCE00",
    accentSoft: "rgba(255,206,0,0.1)",
    label: "AI Extraction",
    title: "Deep Skill Analysis",
    desc: "Our engine parses your projects and academic history to extract high-density skill vectors, mapping them precisely to industrial requirements.",
    stat: "98%",
    statLabel: "match accuracy",
  },
  {
    icon: "bolt",
    accent: "#DD0000",
    accentSoft: "rgba(221,0,0,0.1)",
    label: "Nexus Match™",
    title: "Beyond Keywords",
    desc: "We match on cultural fit, growth trajectory, and technical compatibility — not just buzzword overlap. Real intelligence, real results.",
    stat: "3×",
    statLabel: "faster placement",
    link: "/jobs/recommended",
    linkLabel: "View Matches →",
  },
  {
    icon: "trending_up",
    accent: "#22c55e",
    accentSoft: "rgba(34,197,94,0.1)",
    label: "Career Growth",
    title: "Track Your Journey",
    desc: "Monitor every application in real time. From applied to shortlisted, see exactly where you stand with every opportunity you pursue.",
    stat: "1,200+",
    statLabel: "students placed",
  },
];

function IntelligenceCards() {
  const sectionRef = useRef(null);
  const cardsRef   = useRef([]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        gsap.fromTo(
          cardsRef.current,
          { y: 48, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.8, stagger: 0.15, ease: "power3.out" }
        );
        observer.disconnect();
      },
      { threshold: 0.15 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  /* Hover micro-interactions */
  const handleEnter = (i) => {
    gsap.to(cardsRef.current[i], {
      y: -6,
      boxShadow: `0 20px 48px rgba(0,0,0,0.4), 0 0 0 1px ${FEATURES[i].accent}33`,
      duration: 0.3,
      ease: "power2.out",
    });
  };
  const handleLeave = (i) => {
    gsap.to(cardsRef.current[i], {
      y: 0,
      boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
      duration: 0.35,
      ease: "power2.out",
    });
  };

  return (
    <section ref={sectionRef} className="hp-features">
      <div className="hp-features__inner">

        <div className="hp-features__header">
          <span className="hp-features__eyebrow">Platform</span>
          <h2 className="hp-features__title">Why GIU Nexus?</h2>
          <p className="hp-features__sub">
            Three pillars that separate career acceleration from random job searching.
          </p>
        </div>

        <div className="hp-features__grid">
          {FEATURES.map((f, i) => (
            <div
              key={f.title}
              ref={el => (cardsRef.current[i] = el)}
              className="hp-feat-card"
              onMouseEnter={() => handleEnter(i)}
              onMouseLeave={() => handleLeave(i)}
            >
              {/* Icon */}
              <div className="hp-feat-card__icon" style={{ background: f.accentSoft }}>
                <span
                  className="material-symbols-outlined"
                  style={{ color: f.accent, fontSize: "26px",
                    fontVariationSettings: "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24" }}
                >
                  {f.icon}
                </span>
              </div>

              {/* Label pill */}
              <span className="hp-feat-card__label" style={{ color: f.accent, background: f.accentSoft }}>
                {f.label}
              </span>

              {/* Text */}
              <h3 className="hp-feat-card__title">{f.title}</h3>
              <p className="hp-feat-card__desc">{f.desc}</p>

              {/* Stat + optional link */}
              <div className="hp-feat-card__footer">
                <div>
                  <span className="hp-feat-card__stat" style={{ color: f.accent }}>{f.stat}</span>
                  <span className="hp-feat-card__stat-label">{f.statLabel}</span>
                </div>
                {f.link && (
                  <Link to={f.link} className="hp-feat-card__link" style={{ color: f.accent }}>
                    {f.linkLabel}
                  </Link>
                )}
              </div>

              {/* Bottom accent stripe */}
              <div className="hp-feat-card__stripe" style={{ background: f.accent }} />
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}

export default IntelligenceCards;
