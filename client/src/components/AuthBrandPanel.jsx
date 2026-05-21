// Shared right-side brand panel used by LoginPage and RegisterPage
const FEATURES = [
  {
    icon: "auto_awesome",
    color: "#FFCE00",
    bg: "rgba(255,206,0,0.1)",
    title: "AI Skill Matching",
    desc: "Semantic extraction of your strengths — far beyond simple keyword scanning.",
  },
  {
    icon: "bolt",
    color: "#DD0000",
    bg: "rgba(221,0,0,0.1)",
    title: "Fast-Track Applications",
    desc: "Direct pathways to top companies. Apply in seconds with your AI-built profile.",
  },
  {
    icon: "bar_chart",
    color: "#22c55e",
    bg: "rgba(34,197,94,0.1)",
    title: "Real-Time Tracking",
    desc: "Know your status at every step — from applied to shortlisted to hired.",
  },
];

function AuthBrandPanel() {
  return (
    <div className="auth-brand">

      {/* German tricolor stripe */}
      <div className="auth-brand__stripe">
        <div className="auth-brand__stripe-black" />
        <div className="auth-brand__stripe-red"   />
        <div className="auth-brand__stripe-gold"  />
      </div>

      {/* Logo */}
      <h2 className="auth-brand__logo">
        GIU<span className="auth-brand__logo-dot">.</span>Nexus
      </h2>
      <span className="auth-brand__tagline">AI-Powered Career Excellence</span>

      {/* Hero headline */}
      <p className="auth-brand__headline">
        Where Academic<br />
        <em>Excellence</em> Meets<br />
        Opportunity.
      </p>

      {/* Feature list */}
      <div className="auth-brand__features">
        {FEATURES.map(f => (
          <div key={f.title} className="auth-brand__feat">
            <div className="auth-brand__feat-icon" style={{ background: f.bg }}>
              <span
                className="material-symbols-outlined"
                style={{
                  color: f.color,
                  fontSize: "20px",
                  fontVariationSettings: "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24",
                }}
              >
                {f.icon}
              </span>
            </div>
            <div>
              <p className="auth-brand__feat-title">{f.title}</p>
              <p className="auth-brand__feat-desc">{f.desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Stats */}
      <div className="auth-brand__stats">
        {[
          { value: "500+",   label: "Open Positions" },
          { value: "80+",    label: "Companies" },
          { value: "1,200+", label: "Students Placed" },
        ].map(s => (
          <div key={s.label}>
            <span className="auth-brand__stat-value">{s.value}</span>
            <span className="auth-brand__stat-label">{s.label}</span>
          </div>
        ))}
      </div>

    </div>
  );
}

export default AuthBrandPanel;
