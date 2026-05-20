// components/ProgressList.jsx
// Horizontal progress bar list — used in Admin Dashboard for
// "Jobs by Status" and "Applications by Status" sections.
//
// Props:
//   items — array of: { key, label, value, colorHex }
//
// Styling uses CSS classes defined in AdminDashboard.css

import { useEffect, useRef } from "react";
import { gsap } from "gsap";

function ProgressList({ items = [] }) {
  const listRef = useRef(null);
  const total   = items.reduce((sum, i) => sum + (i.value || 0), 0) || 1;
  const hasData = items.some((i) => (i.value || 0) > 0);

  // Entrance animation
  useEffect(() => {
    if (!hasData || !listRef.current) return;

    const fills  = listRef.current.querySelectorAll(".adm-progress-fill");
    const counts = listRef.current.querySelectorAll(".adm-progress-count");

    gsap.fromTo(
      fills,
      { scaleX: 0, transformOrigin: "left center" },
      { scaleX: 1, duration: 0.75, stagger: 0.15, ease: "power3.out", delay: 0.05 }
    );

    gsap.fromTo(
      listRef.current.querySelectorAll(".adm-progress-item"),
      { opacity: 0, y: 14 },
      { opacity: 1, y: 0, duration: 0.5, stagger: 0.12, ease: "power2.out" }
    );

    items.forEach(({ value }, i) => {
      const val = value || 0;
      const obj = { n: 0 };
      gsap.to(obj, {
        n: val,
        duration: 0.8,
        delay: 0.05 + i * 0.15,
        ease: "power2.out",
        onUpdate() {
          const els = listRef.current?.querySelectorAll(".adm-progress-count");
          if (els?.[i]) els[i].textContent = Math.round(obj.n).toLocaleString();
        },
      });
    });
  }, [hasData, items]);

  // Hover animations
  useEffect(() => {
    if (!hasData || !listRef.current) return;

    const rows = listRef.current.querySelectorAll(".adm-progress-item");

    const onEnter = (e) => {
      const row   = e.currentTarget;
      const fill  = row.querySelector(".adm-progress-fill");
      const track = row.querySelector(".adm-progress-track");
      const label = row.querySelector(".adm-progress-label");
      const count = row.querySelector(".adm-progress-count");

      gsap.to(row,   { x: 4, duration: 0.2, ease: "power2.out" });
      gsap.to(track, { scaleY: 1.5, transformOrigin: "center center", duration: 0.2, ease: "power2.out" });
      gsap.to(fill,  { filter: "brightness(1.2)", duration: 0.2 });
      gsap.to(label, { color: "#1d1d1f", fontWeight: "600", duration: 0.15 });
      gsap.to(count, { scale: 1.15, transformOrigin: "right center", duration: 0.2, ease: "back.out(2)" });
    };

    const onLeave = (e) => {
      const row   = e.currentTarget;
      const fill  = row.querySelector(".adm-progress-fill");
      const track = row.querySelector(".adm-progress-track");
      const label = row.querySelector(".adm-progress-label");
      const count = row.querySelector(".adm-progress-count");

      gsap.to(row,   { x: 0, duration: 0.25, ease: "power2.out" });
      gsap.to(track, { scaleY: 1, duration: 0.25, ease: "power2.out" });
      gsap.to(fill,  { filter: "brightness(1)", duration: 0.25 });
      gsap.to(label, { color: "#6e6e73", fontWeight: "400", duration: 0.2 });
      gsap.to(count, { scale: 1, duration: 0.2, ease: "power2.out" });
    };

    rows.forEach((row) => {
      row.addEventListener("mouseenter", onEnter);
      row.addEventListener("mouseleave", onLeave);
    });

    return () => {
      rows.forEach((row) => {
        row.removeEventListener("mouseenter", onEnter);
        row.removeEventListener("mouseleave", onLeave);
      });
    };
  }, [hasData]);

  if (!hasData) {
    return <p style={{ color: "#6e6e73", fontSize: 14 }}>No data yet.</p>;
  }

  return (
    <div ref={listRef} className="adm-progress-list">
      {items.map(({ key, label, value, colorHex }) => {
        const widthPct = Math.max(1, Math.round(((value || 0) / total) * 100));

        return (
          <div className="adm-progress-item" key={key} style={{ cursor: "default" }}>
            <div className="adm-progress-header">
              <span className="adm-progress-label">{label}</span>
              <span className="adm-progress-count">0</span>
            </div>
            <div
              className="adm-progress-track"
              role="progressbar"
              aria-valuenow={value || 0}
              aria-valuemax={total}
              aria-label={`${label}: ${value}`}
            >
              <div
                className="adm-progress-fill"
                style={{ width: `${widthPct}%`, background: colorHex }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default ProgressList;
