import { Link } from "react-router-dom";

function IntelligenceCards() {
  return (
    <section style={{ maxWidth: '1200px', margin: '0 auto 48px', padding: '0 24px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
        <div style={{
          background: '#fff', border: '1px solid rgba(0,0,0,0.08)', borderRadius: '12px',
          padding: '32px', display: 'flex', alignItems: 'center', gap: '32px',
        }}>
          <div style={{ flex: 1 }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: '8px',
              background: '#f1eaff', color: '#6b3fd1', padding: '4px 12px',
              borderRadius: '9999px', marginBottom: '16px',
            }}>
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>auto_awesome</span>
              <span style={{ fontSize: '12px', fontWeight: '600' }}>AI Extraction</span>
            </div>
            <h3 style={{ fontSize: '28px', fontWeight: '600', margin: '0 0 12px', color: '#1b1b1d' }}>Deep Skill Analysis</h3>
            <p style={{ fontSize: '17px', color: '#414753', margin: 0, lineHeight: '1.5' }}>
              Our engine parses your projects and academic history to extract high-density skill vectors, mapping them to industrial requirements.
            </p>
          </div>
          <div style={{ flex: 1, background: '#f6f3f5', borderRadius: '8px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {[
              { color: '#004e9f', width: '96px' },
              { color: '#6b3fd1', width: '128px', marginLeft: '24px' },
              { color: '#16833a', width: '80px', opacity: 0.5 },
            ].map((bar, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#fff', padding: '8px', borderRadius: '6px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', marginLeft: bar.marginLeft || 0, opacity: bar.opacity || 1 }}>
                <div style={{ width: '16px', height: '16px', background: bar.color, borderRadius: '4px' }} />
                <div style={{ height: '8px', width: bar.width, background: '#dcd9dc', borderRadius: '4px' }} />
              </div>
            ))}
          </div>
        </div>

        <div style={{
          background: '#004e9f', color: '#fff', borderRadius: '12px',
          padding: '32px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
        }}>
          <div>
            <span className="material-symbols-outlined" style={{ fontSize: '32px', marginBottom: '16px', display: 'block' }}>bolt</span>
            <h3 style={{ fontSize: '28px', fontWeight: '600', margin: '0 0 8px' }}>Nexus Match™</h3>
            <p style={{ fontSize: '14px', opacity: 0.9, margin: 0, lineHeight: '1.5' }}>
              Beyond keywords. We match based on cultural fit, growth trajectory, and technical compatibility.
            </p>
          </div>
          <Link to="/jobs/recommended" style={{
            display: 'block', marginTop: '32px', border: '1px solid rgba(255,255,255,0.3)',
            padding: '8px 16px', borderRadius: '9999px', fontWeight: '600',
            fontSize: '14px', textAlign: 'center', color: '#fff', textDecoration: 'none',
          }}>
            View Matches
          </Link>
        </div>
      </div>
    </section>
  );
}

export default IntelligenceCards;