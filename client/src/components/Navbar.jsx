import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate('/login');
  }

  /* initials fallback for avatar */
  const initials = user?.name
    ? user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : 'U';

  return (
    <header
      className="glass-nav hairline-border"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        borderBottom: '1px solid rgba(0,0,0,0.08)',
        height: '64px',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          height: '100%',
          padding: '0 24px',
          maxWidth: '1440px',
          margin: '0 auto',
        }}
      >
        {/* Left — logo + nav links */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
          <Link
            to="/"
            style={{
              fontFamily: 'Inter, sans-serif',
              fontSize: '22px',
              fontWeight: 800,
              color: 'var(--color-primary)',
              textDecoration: 'none',
              letterSpacing: '-0.02em',
            }}
          >
            GIU Nexus
          </Link>

          <nav style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
            {[
              { label: 'Home', to: '/' },
              { label: 'Jobs', to: '/jobs' },
              { label: 'Recommended', to: '/jobs/recommended' },
            ].map(({ label, to }) => (
              <Link
                key={label}
                to={to}
                style={{
                  fontSize: '15px',
                  fontWeight: 500,
                  color: 'var(--color-on-surface-variant)',
                  textDecoration: 'none',
                  transition: 'color 0.2s',
                }}
                onMouseEnter={e => (e.currentTarget.style.color = 'var(--color-primary)')}
                onMouseLeave={e => (e.currentTarget.style.color = 'var(--color-on-surface-variant)')}
              >
                {label}
              </Link>
            ))}
          </nav>
        </div>

        {/* Right — icons + avatar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* Notification bell */}
          <button
            aria-label="Notifications"
            id="nav-notifications-btn"
            style={iconBtnStyle}
            onMouseEnter={e => (e.currentTarget.style.color = 'var(--color-primary)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'var(--color-on-surface-variant)')}
          >
            <span className="material-symbols-outlined">notifications</span>
          </button>

          {/* Settings */}
          <button
            aria-label="Settings"
            id="nav-settings-btn"
            style={iconBtnStyle}
            onMouseEnter={e => (e.currentTarget.style.color = 'var(--color-primary)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'var(--color-on-surface-variant)')}
          >
            <span className="material-symbols-outlined">settings</span>
          </button>

          {/* Avatar / initials */}
          <Link
            to="/profile"
            id="nav-avatar-link"
            style={{
              width: '34px',
              height: '34px',
              borderRadius: '50%',
              overflow: 'hidden',
              border: '1px solid rgba(0,0,0,0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'var(--color-primary)',
              color: '#fff',
              fontWeight: 700,
              fontSize: '13px',
              textDecoration: 'none',
              flexShrink: 0,
            }}
          >
            {user?.profilePicture ? (
              <img
                src={user.profilePicture}
                alt="User avatar"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : (
              initials
            )}
          </Link>
        </div>
      </div>
    </header>
  );
}

const iconBtnStyle = {
  padding: '8px',
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  color: 'var(--color-on-surface-variant)',
  display: 'flex',
  alignItems: 'center',
  transition: 'color 0.2s',
  borderRadius: '8px',
};

export default Navbar;
