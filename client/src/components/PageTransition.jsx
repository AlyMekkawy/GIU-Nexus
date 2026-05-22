// components/PageTransition.jsx
//
// Branded wipe transition between every route change.
// A dark panel sweeps in from the left (hiding the old page),
// the route updates silently, then the panel exits to the right
// revealing the new page. A red→gold stripe rides the leading edge.
//
import { useState, useEffect, useRef } from "react";
import { Routes, useLocation } from "react-router-dom";
import { gsap } from "gsap";
import "./PageTransition.css";

export default function PageTransition({ children }) {
  const location        = useLocation();
  const [displayLoc, setDisplayLoc] = useState(location);
  const overlayRef      = useRef(null);

  useEffect(() => {
    // ── Same key: nothing changed at all ──────────────────────────
    if (location.key === displayLoc.key) return;

    // ── Same pathname: only search params / hash changed ──────────
    // (e.g. JobListPage calling setSearchParams, pagination, filters)
    // Update the displayed location silently — no wipe animation.
    if (location.pathname === displayLoc.pathname) {
      setDisplayLoc(location);
      return;
    }

    // ── Different pathname: run the wipe animation ─────────────────
    const overlay = overlayRef.current;

    // Kill any in-progress tween so rapid navigations don't queue
    gsap.killTweensOf(overlay);

    gsap.timeline()
      // ① Off-screen left, ready to wipe in
      .set(overlay, { x: "-100%" })

      // ② Sweep IN — covers the old page (300 ms)
      .to(overlay, { x: "0%", duration: 0.30, ease: "power3.inOut" })

      // ③ Swap route while the panel is covering the screen
      .call(() => setDisplayLoc(location))

      // ④ Tiny pause — React renders the new page in the background
      .to({}, { duration: 0.06 })

      // ⑤ Sweep OUT to the right — new page is revealed (300 ms)
      .to(overlay, { x: "100%", duration: 0.30, ease: "power3.inOut" })

      // ⑥ Reset completely off-screen for next use
      .set(overlay, { x: "-200%" });

  }, [location.key]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <>
      {/* The wipe panel */}
      <div ref={overlayRef} className="page-overlay" aria-hidden="true" />

      {/*
        Routes receive displayLoc (the currently-visible page) instead of the
        real location. Only swapped once the panel is fully covering the screen,
        so the user never sees a partial flash of the next page.
      */}
      <Routes location={displayLoc}>
        {children}
      </Routes>
    </>
  );
}
