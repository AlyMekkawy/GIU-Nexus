import { Link } from 'react-router-dom';

function Footer() {
  return (
    <footer
      style={{
        background: 'var(--color-surface-container-low)',
        borderTop: '1px solid rgba(0,0,0,0.07)',
        width: '100%',
        padding: '48px 0',
        marginTop: 'auto',
      }}
    >
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '32px',
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '0 24px',
        }}
      >
        {/* Brand */}
        <div>
          <span
            style={{
              fontFamily: 'Inter, sans-serif',
              fontSize: '20px',
              fontWeight: 700,
              color: 'var(--color-on-surface)',
              letterSpacing: '-0.01em',
            }}
          >
            GIU Nexus
          </span>
          <p
            style={{
              marginTop: '16px',
              fontSize: '13px',
              color: 'var(--color-ink-muted)',
              lineHeight: 1.6,
              maxWidth: '220px',
            }}
          >
            Empowering the next generation of university talent through AI-driven career matching.
          </p>
        </div>

        {/* Platform */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <span style={{ fontWeight: 600, color: 'var(--color-on-surface)', fontSize: '14px' }}>Platform</span>
          {[
            { label: 'About Us', to: '#' },
            { label: 'Help Center', to: '#' },
          ].map(({ label, to }) => (
            <Link key={label} to={to} style={footerLinkStyle}>
              {label}
            </Link>
          ))}
        </div>

        {/* Legal */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <span style={{ fontWeight: 600, color: 'var(--color-on-surface)', fontSize: '14px' }}>Legal</span>
          {[
            { label: 'Privacy Policy', to: '#' },
            { label: 'Terms of Service', to: '#' },
          ].map(({ label, to }) => (
            <Link key={label} to={to} style={footerLinkStyle}>
              {label}
            </Link>
          ))}
        </div>

        {/* Copyright + socials */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-end',
            gap: '12px',
          }}
        >
          <p
            style={{
              fontSize: '13px',
              color: 'var(--color-ink-muted)',
              textAlign: 'right',
              lineHeight: 1.5,
            }}
          >
            © 2024 GIU Nexus. AI-Powered Career Excellence.
          </p>
          <div style={{ display: 'flex', gap: '16px' }}>
            {['language', 'share'].map(icon => (
              <span
                key={icon}
                className="material-symbols-outlined"
                style={{
                  color: 'var(--color-secondary)',
                  cursor: 'pointer',
                  fontSize: '22px',
                  transition: 'color 0.2s',
                }}
                onMouseEnter={e => (e.currentTarget.style.color = 'var(--color-primary)')}
                onMouseLeave={e => (e.currentTarget.style.color = 'var(--color-secondary)')}
              >
                {icon}
              </span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}

const footerLinkStyle = {
  fontSize: '13px',
  color: 'var(--color-ink-muted)',
  textDecoration: 'underline',
  textUnderlineOffset: '3px',
  transition: 'color 0.2s',
};

export default Footer;
