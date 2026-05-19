// components/ParticleCanvas.jsx
// Lightweight canvas-based particle network animation.
// Renders floating dots connected by faint lines — brand blue, very subtle.
// Drop it anywhere as a background layer:
//   <ParticleCanvas className="my-canvas" />

import { useEffect, useRef } from "react";

const COUNT      = 38;
const MAX_SPEED  = 0.28;
const MIN_R      = 1.4;
const MAX_R      = 3.2;
const LINK_DIST  = 110;
const COLOR      = "0, 102, 204"; // brand blue RGB

function rand(a, b) { return a + Math.random() * (b - a); }

function ParticleCanvas({ className, style }) {
  const canvasRef  = useRef(null);
  const frameRef   = useRef(null);
  const roRef      = useRef(null);
  const particles  = useRef([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    function resize() {
      canvas.width  = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    }

    function init() {
      particles.current = Array.from({ length: COUNT }, () => ({
        x:  rand(0, canvas.width),
        y:  rand(0, canvas.height),
        r:  rand(MIN_R, MAX_R),
        vx: rand(-MAX_SPEED, MAX_SPEED) || MAX_SPEED * 0.5,
        vy: rand(-MAX_SPEED, MAX_SPEED) || MAX_SPEED * 0.5,
        a:  rand(0.07, 0.22),
      }));
    }

    function tick() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const pts = particles.current;
      const w   = canvas.width;
      const h   = canvas.height;

      // Update positions
      for (const p of pts) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < -p.r)     { p.x = w + p.r; }
        else if (p.x > w + p.r) { p.x = -p.r; }
        if (p.y < -p.r)     { p.y = h + p.r; }
        else if (p.y > h + p.r) { p.y = -p.r; }
      }

      // Draw connections
      for (let i = 0; i < pts.length; i++) {
        for (let j = i + 1; j < pts.length; j++) {
          const dx   = pts[i].x - pts[j].x;
          const dy   = pts[i].y - pts[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < LINK_DIST) {
            const opacity = 0.06 * (1 - dist / LINK_DIST);
            ctx.beginPath();
            ctx.moveTo(pts[i].x, pts[i].y);
            ctx.lineTo(pts[j].x, pts[j].y);
            ctx.strokeStyle = `rgba(${COLOR}, ${opacity})`;
            ctx.lineWidth   = 0.8;
            ctx.stroke();
          }
        }
      }

      // Draw dots
      for (const p of pts) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${COLOR}, ${p.a})`;
        ctx.fill();
      }

      frameRef.current = requestAnimationFrame(tick);
    }

    resize();
    init();
    tick();

    roRef.current = new ResizeObserver(() => { resize(); });
    roRef.current.observe(canvas);

    return () => {
      cancelAnimationFrame(frameRef.current);
      roRef.current?.disconnect();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={style}
      aria-hidden="true"
    />
  );
}

export default ParticleCanvas;
