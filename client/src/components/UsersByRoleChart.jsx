// components/UsersByRoleChart.jsx
import { useEffect, useRef } from "react";
import { gsap } from "gsap";

const BAR_CONFIG = [
  { key: "jobSeeker", label: "Job Seekers", color: "#0066cc" },
  { key: "recruiter", label: "Recruiters",  color: "#6b3fd1" },
  { key: "admin",     label: "Admins",      color: "#8a8a8e" },
];

function UsersByRoleChart({ usersByRole = {} }) {
  const chartRef = useRef(null);
  const max      = Math.max(1, ...BAR_CONFIG.map((b) => usersByRole[b.key] || 0));
  const hasData  = BAR_CONFIG.some((b) => (usersByRole[b.key] || 0) > 0);

  // Entrance animation
  useEffect(() => {
    if (!hasData || !chartRef.current) return;

    const fills  = chartRef.current.querySelectorAll(".adm-bar-fill");
    const counts = chartRef.current.querySelectorAll(".adm-bar-count");

    gsap.fromTo(
      fills,
      { scaleY: 0, transformOrigin: "bottom center" },
      { scaleY: 1, duration: 0.8, stagger: 0.12, ease: "power3.out", delay: 0.1 }
    );

    BAR_CONFIG.forEach(({ key }, i) => {
      const val = usersByRole[key] || 0;
      const obj = { n: 0 };
      gsap.to(obj, {
        n: val,
        duration: 0.9,
        delay: 0.1 + i * 0.12,
        ease: "power2.out",
        onUpdate() {
          if (counts[i]) counts[i].textContent = Math.round(obj.n).toLocaleString();
        },
      });
    });
  }, [hasData, usersByRole]);

  // Hover animations
  useEffect(() => {
    if (!hasData || !chartRef.current) return;

    const cols = chartRef.current.querySelectorAll(".adm-bar-col");

    const onEnter = (e) => {
      const col   = e.currentTarget;
      const fill  = col.querySelector(".adm-bar-fill");
      const count = col.querySelector(".adm-bar-count");
      const label = col.querySelector(".adm-bar-label");

      gsap.to(col,   { y: -6, duration: 0.25, ease: "power2.out" });
      gsap.to(fill,  { filter: "brightness(1.2)", duration: 0.25 });
      gsap.to(count, { scale: 1.18, color: "#1d1d1f", duration: 0.2, ease: "back.out(2)" });
      gsap.to(label, { color: "#1d1d1f", duration: 0.2 });
    };

    const onLeave = (e) => {
      const col   = e.currentTarget;
      const fill  = col.querySelector(".adm-bar-fill");
      const count = col.querySelector(".adm-bar-count");
      const label = col.querySelector(".adm-bar-label");

      gsap.to(col,   { y: 0, duration: 0.3, ease: "power2.out" });
      gsap.to(fill,  { filter: "brightness(1)", duration: 0.3 });
      gsap.to(count, { scale: 1, color: "#1d1d1f", duration: 0.25, ease: "power2.out" });
      gsap.to(label, { color: "#6e6e73", duration: 0.25 });
    };

    cols.forEach((col) => {
      col.addEventListener("mouseenter", onEnter);
      col.addEventListener("mouseleave", onLeave);
    });

    return () => {
      cols.forEach((col) => {
        col.removeEventListener("mouseenter", onEnter);
        col.removeEventListener("mouseleave", onLeave);
      });
    };
  }, [hasData]);

  if (!hasData) {
    return (
      <div style={{ textAlign: "center", padding: "32px 0", color: "#6e6e73", fontSize: 14 }}>
        No user data yet.
      </div>
    );
  }

  return (
    <div
      ref={chartRef}
      className="adm-bar-chart"
      role="img"
      aria-label="Bar chart: users by role"
    >
      {BAR_CONFIG.map(({ key, label, color }) => {
        const val       = usersByRole[key] || 0;
        const heightPct = Math.round((val / max) * 100);

        return (
          <div className="adm-bar-col" key={key} style={{ cursor: "default" }}>
            <div className="adm-bar-count">0</div>
            <div className="adm-bar-track">
              <div
                className="adm-bar-fill"
                style={{ height: `${heightPct}%`, background: color }}
                role="progressbar"
                aria-valuenow={val}
                aria-valuemin={0}
                aria-valuemax={max}
                aria-label={`${label}: ${val}`}
              />
            </div>
            <div className="adm-bar-label">{label}</div>
          </div>
        );
      })}
    </div>
  );
}

export default UsersByRoleChart;
