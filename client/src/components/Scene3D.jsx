// components/Scene3D.jsx
// Floating gold wireframe icosahedron with orbit rings + mouse parallax
import { useRef, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float } from "@react-three/drei";
import { gsap } from "gsap";
import * as THREE from "three";

/* ── The 3D objects inside the canvas ──────────────────────────── */
function GlobeScene({ mouseRef }) {
  const groupRef  = useRef();
  const autoAngle = useRef(0);
  const influence = useRef({ x: 0, y: 0 });

  useFrame((_, delta) => {
    if (!groupRef.current) return;

    // Slow continuous spin on Y
    autoAngle.current += delta * 0.18;

    // Smooth lerp toward mouse position
    influence.current.x += (mouseRef.current.y *  0.55 - influence.current.x) * 0.04;
    influence.current.y += (mouseRef.current.x *  0.55 - influence.current.y) * 0.04;

    groupRef.current.rotation.y = autoAngle.current + influence.current.y;
    groupRef.current.rotation.x = influence.current.x;
  });

  return (
    <group ref={groupRef}>
      {/*
        Float adds a gentle breathing bob — feels alive even when
        the mouse isn't moving.
      */}
      <Float speed={1.4} rotationIntensity={0.12} floatIntensity={0.35}>

        {/* ── Main gold wireframe sphere ── */}
        <mesh>
          <icosahedronGeometry args={[1.5, 2]} />
          <meshStandardMaterial
            color="#FFCE00"
            wireframe
            transparent
            opacity={0.62}
            emissive="#FFCE00"
            emissiveIntensity={0.06}
          />
        </mesh>

        {/* ── Inner very-subtle red glow ── */}
        <mesh>
          <icosahedronGeometry args={[1.26, 2]} />
          <meshStandardMaterial
            color="#DD0000"
            transparent
            opacity={0.045}
            side={THREE.BackSide}
          />
        </mesh>

        {/* ── Orbit ring 1 — gold, equatorial ── */}
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[2.1, 0.007, 2, 180]} />
          <meshBasicMaterial color="#FFCE00" transparent opacity={0.18} />
        </mesh>

        {/* ── Orbit ring 2 — red, tilted 52° ── */}
        <mesh rotation={[Math.PI / 3.4, 0.45, 0]}>
          <torusGeometry args={[2.3, 0.005, 2, 180]} />
          <meshBasicMaterial color="#DD0000" transparent opacity={0.14} />
        </mesh>

      </Float>
    </group>
  );
}

/* ── Canvas wrapper exported to Hero ───────────────────────────── */
export default function Scene3D() {
  const wrapRef  = useRef(null);
  const mouseRef = useRef({ x: 0, y: 0 });

  /* GSAP entrance — fade in + gentle float up */
  useEffect(() => {
    gsap.set(wrapRef.current, { opacity: 0, y: 40 });
    gsap.to(wrapRef.current, {
      opacity: 1,
      y: 0,
      duration: 1.4,
      delay: 0.5,
      ease: "power3.out",
    });
  }, []);

  /* Track mouse globally — updates the ref so useFrame can read it */
  useEffect(() => {
    const onMove = (e) => {
      mouseRef.current = {
        x:  (e.clientX / window.innerWidth  - 0.5) * 2,
        y: -(e.clientY / window.innerHeight - 0.5) * 2,
      };
    };
    window.addEventListener("mousemove", onMove, { passive: true });
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  return (
    <div ref={wrapRef} className="hp-hero__canvas-wrap">
      <Canvas
        camera={{ position: [0, 0, 5], fov: 42 }}
        gl={{ alpha: true, antialias: true, powerPreference: "high-performance" }}
        dpr={[1, 1.5]}
      >
        {/* Atmospheric lighting — red from upper-left, gold from lower-right */}
        <ambientLight intensity={0.08} />
        <pointLight position={[-4,  3,  3]} color="#DD0000" intensity={14} />
        <pointLight position={[ 4, -2, -3]} color="#FFCE00" intensity={9}  />
        <pointLight position={[ 0,  3,  1]} color="#ffffff"  intensity={2}  />

        <GlobeScene mouseRef={mouseRef} />
      </Canvas>
    </div>
  );
}
