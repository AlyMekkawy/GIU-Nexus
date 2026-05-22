import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import "./CursorEffect.css";

/*
  Custom cursor — three layers:
    1. Red dot  (6 px)  — snaps to pointer instantly
    2. Gold ring (30 px) — follows with smooth lerp lag
    3. Spotlight glow    — large radial gradient, very subtle

  Hover on interactive elements  → ring expands + tints red
  Click                          → both layers pulse scale
  Touch device                   → entire component bails out (no-op)
*/
function CursorEffect() {
  const dotRef      = useRef(null);
  const ringRef     = useRef(null);
  const glowRef     = useRef(null);
  const posRef      = useRef({ mx: 0, my: 0, rx: 0, ry: 0 });
  const rafRef      = useRef(null);
  const activeRef   = useRef(false);

  useEffect(() => {
    // Skip on touch / non-pointer devices
    if (window.matchMedia("(hover: none)").matches) return;

    const dot   = dotRef.current;
    const ring  = ringRef.current;
    const glow  = glowRef.current;
    if (!dot || !ring || !glow) return;

    // Hide default cursor on body
    document.body.classList.add("cursor-hidden");

    const LERP = 0.115; // ring lag factor (lower = more lag)

    /* ── Track mouse ─────────────────────────────────────────── */
    const onMove = (e) => {
      posRef.current.mx = e.clientX;
      posRef.current.my = e.clientY;

      if (!activeRef.current) {
        // First move — snap everything into place
        posRef.current.rx = e.clientX;
        posRef.current.ry = e.clientY;
        gsap.set([dot, ring, glow], { opacity: 1 });
        activeRef.current = true;
      }

      // Dot and glow snap instantly
      gsap.set(dot,  { x: e.clientX, y: e.clientY });
      gsap.set(glow, { x: e.clientX, y: e.clientY });
    };

    /* ── RAF loop — lerp ring ────────────────────────────────── */
    const loop = () => {
      const p = posRef.current;
      p.rx += (p.mx - p.rx) * LERP;
      p.ry += (p.my - p.ry) * LERP;
      gsap.set(ring, { x: p.rx, y: p.ry });
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);

    /* ── Hover — interactive elements ───────────────────────── */
    const SELECTOR = "a, button, input, select, textarea, label, [role='button'], [tabindex]";

    const onEnter = (e) => {
      if (!e.target.closest(SELECTOR)) return;
      gsap.to(ring, {
        width: 52, height: 52,
        borderColor: "rgba(221,0,0,0.7)",
        opacity: 0.55,
        duration: 0.3, ease: "power2.out",
      });
      gsap.to(dot, { scale: 0.4, duration: 0.25, ease: "power2.out" });
    };

    const onLeave = (e) => {
      if (!e.target.closest(SELECTOR)) return;
      gsap.to(ring, {
        width: 30, height: 30,
        borderColor: "rgba(255,206,0,0.55)",
        opacity: 0.7,
        duration: 0.3, ease: "power2.out",
      });
      gsap.to(dot, { scale: 1, duration: 0.25, ease: "power2.out" });
    };

    /* ── Click pulse ─────────────────────────────────────────── */
    const onClick = () => {
      gsap.fromTo(
        ring,
        { scale: 1 },
        { scale: 1.6, opacity: 0, duration: 0.45, ease: "power2.out",
          onComplete: () => gsap.set(ring, { scale: 1, opacity: 0.7 }) }
      );
      gsap.fromTo(
        dot,
        { scale: 1 },
        { scale: 1.8, duration: 0.2, ease: "back.out(3)",
          onComplete: () => gsap.to(dot, { scale: 1, duration: 0.2 }) }
      );
    };

    document.addEventListener("mousemove",  onMove);
    document.addEventListener("mouseover",  onEnter);
    document.addEventListener("mouseout",   onLeave);
    document.addEventListener("mousedown",  onClick);

    return () => {
      document.body.classList.remove("cursor-hidden");
      document.removeEventListener("mousemove",  onMove);
      document.removeEventListener("mouseover",  onEnter);
      document.removeEventListener("mouseout",   onLeave);
      document.removeEventListener("mousedown",  onClick);
      cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <>
      {/* Spotlight glow — large, very subtle */}
      <div ref={glowRef} className="cur-glow" aria-hidden />

      {/* Lagging gold ring */}
      <div ref={ringRef} className="cur-ring" aria-hidden />

      {/* Snapping red dot */}
      <div ref={dotRef}  className="cur-dot"  aria-hidden />
    </>
  );
}

export default CursorEffect;
