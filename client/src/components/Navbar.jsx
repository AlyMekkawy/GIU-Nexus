import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const BellIcon = () => (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
        <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
    </svg>
);

const SettingsIcon = () => (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3"/>
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
    </svg>
);

const MenuIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <line x1="3" y1="6" x2="21" y2="6"/>
        <line x1="3" y1="12" x2="21" y2="12"/>
        <line x1="3" y1="18" x2="21" y2="18"/>
    </svg>
);

const XIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="6" x2="6" y2="18"/>
        <line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
);

const Navbar = () => {
    const [mobileOpen, setMobileOpen] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();
    const { isAuthenticated, user, logout } = useAuth();

    async function handleLogout() {
        await logout();
        navigate("/");
    }

    const navLinks = [
        { label: "Home", to: "/" },
        { label: "Jobs", to: "/jobs" },
        { label: "Recommended", to: "/recommended" },
    ];

    const isActive = (path) => location.pathname === path;

    return (
        <>
            <style>{`
        .giu-navbar {
          position: sticky;
          top: 0;
          z-index: 100;
          background: #ffffff;
          border-bottom: 1px solid #e8eaed;
          font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
        }

        .giu-navbar__inner {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 24px;
          height: 64px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 32px;
        }

        /* Logo */
        .giu-navbar__logo {
          text-decoration: none;
          font-size: 1.375rem;
          font-weight: 700;
          color: #1a7a6e;
          letter-spacing: -0.3px;
          white-space: nowrap;
          flex-shrink: 0;
        }

        .giu-navbar__logo:hover {
          color: #15685d;
        }

        /* Nav links */
        .giu-navbar__links {
          display: flex;
          align-items: center;
          gap: 4px;
          list-style: none;
          margin: 0;
          padding: 0;
          flex: 1;
          justify-content: center;
        }

        .giu-navbar__link {
          text-decoration: none;
          padding: 8px 14px;
          border-radius: 8px;
          font-size: 0.9375rem;
          font-weight: 500;
          color: #3c4048;
          transition: background 0.15s ease, color 0.15s ease;
          white-space: nowrap;
        }

        .giu-navbar__link:hover {
          background: #f0f4f3;
          color: #1a7a6e;
        }

        .giu-navbar__link--active {
          color: #1a7a6e;
          background: #eaf4f2;
        }

        /* Right side actions */
        .giu-navbar__actions {
          display: flex;
          align-items: center;
          gap: 4px;
          flex-shrink: 0;
        }

        .giu-navbar__icon-btn {
          width: 38px;
          height: 38px;
          border-radius: 50%;
          border: none;
          background: transparent;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #5a6270;
          transition: background 0.15s ease, color 0.15s ease;
          position: relative;
        }

        .giu-navbar__icon-btn:hover {
          background: #f0f4f3;
          color: #1a7a6e;
        }

        /* Notification badge */
        .giu-navbar__badge {
          position: absolute;
          top: 6px;
          right: 6px;
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #e53e3e;
          border: 2px solid #fff;
        }

        /* Avatar */
        .giu-navbar__avatar {
          width: 38px;
          height: 38px;
          border-radius: 50%;
          background: #2d7d74;
          color: #ffffff;
          font-size: 0.875rem;
          font-weight: 600;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          border: none;
          transition: background 0.15s ease, box-shadow 0.15s ease;
          letter-spacing: 0.3px;
          margin-left: 4px;
        }

        .giu-navbar__avatar:hover {
          background: #236860;
          box-shadow: 0 0 0 3px rgba(29, 122, 110, 0.15);
        }

        /* Mobile hamburger */
        .giu-navbar__hamburger {
          display: none;
          width: 38px;
          height: 38px;
          border-radius: 8px;
          border: none;
          background: transparent;
          cursor: pointer;
          align-items: center;
          justify-content: center;
          color: #5a6270;
          transition: background 0.15s ease;
        }

        .giu-navbar__hamburger:hover {
          background: #f0f4f3;
        }

        /* Mobile menu */
        .giu-navbar__mobile-menu {
          display: none;
          flex-direction: column;
          padding: 12px 16px 16px;
          border-top: 1px solid #e8eaed;
          gap: 4px;
          background: #fff;
        }

        .giu-navbar__mobile-link {
          text-decoration: none;
          padding: 10px 14px;
          border-radius: 8px;
          font-size: 0.9375rem;
          font-weight: 500;
          color: #3c4048;
          transition: background 0.15s ease, color 0.15s ease;
        }

        .giu-navbar__mobile-link:hover,
        .giu-navbar__mobile-link--active {
          background: #eaf4f2;
          color: #1a7a6e;
        }

        /* Auth links */
        .giu-navbar__auth-link {
          text-decoration: none;
          padding: 7px 14px;
          border-radius: 8px;
          font-size: 0.9rem;
          font-weight: 500;
          color: #3c4048;
          transition: background 0.15s ease, color 0.15s ease;
          white-space: nowrap;
        }

        .giu-navbar__auth-link:hover {
          background: #f0f4f3;
          color: #1a7a6e;
        }

        .giu-navbar__auth-link--outline {
          border: 1.5px solid #1a7a6e;
          color: #1a7a6e;
          padding: 6px 14px;
        }

        .giu-navbar__auth-link--outline:hover {
          background: #eaf4f2;
        }

        .giu-navbar__logout-btn {
          padding: 7px 14px;
          border-radius: 8px;
          border: 1.5px solid #d1d5db;
          background: transparent;
          cursor: pointer;
          font-size: 0.9rem;
          font-weight: 500;
          color: #5a6270;
          transition: background 0.15s ease, border-color 0.15s ease, color 0.15s ease;
          white-space: nowrap;
        }

        .giu-navbar__logout-btn:hover {
          border-color: #e53e3e;
          color: #e53e3e;
          background: #fff5f5;
        }

        .giu-navbar__greeting {
          font-size: 0.9rem;
          color: #5a6270;
          white-space: nowrap;
        }

        /* Responsive */
        @media (max-width: 640px) {
          .giu-navbar__links {
            display: none;
          }

          .giu-navbar__hamburger {
            display: flex;
          }

          .giu-navbar__mobile-menu {
            display: flex;
          }
        }
      `}</style>

            <header className="giu-navbar">
                <div className="giu-navbar__inner">
                    {/* Logo */}
                    <Link to="/" className="giu-navbar__logo">
                        GIU Nexus
                    </Link>

                    {/* Desktop Nav */}
                    <ul className="giu-navbar__links">
                        {navLinks.map(({ label, to }) => (
                            <li key={to}>
                                <Link
                                    to={to}
                                    className={`giu-navbar__link${isActive(to) ? " giu-navbar__link--active" : ""}`}
                                >
                                    {label}
                                </Link>
                            </li>
                        ))}
                    </ul>

                    {/* Actions */}
                    <div className="giu-navbar__actions">
                        {isAuthenticated ? (
                            <>
                                {/* Notifications */}
                                <button className="giu-navbar__icon-btn" aria-label="Notifications">
                                    <BellIcon />
                                    <span className="giu-navbar__badge" aria-hidden="true" />
                                </button>

                                {/* Settings */}
                                <button className="giu-navbar__icon-btn" aria-label="Settings">
                                    <SettingsIcon />
                                </button>

                                {/* Greeting */}
                                <span className="giu-navbar__greeting">Hi, {user?.name}</span>

                                {/* Avatar */}
                                <button className="giu-navbar__avatar" aria-label="User menu">
                                    {user?.name?.charAt(0).toUpperCase() || "U"}
                                </button>

                                {/* Logout */}
                                <button className="giu-navbar__logout-btn" onClick={handleLogout}>
                                    Logout
                                </button>
                            </>
                        ) : (
                            <>
                                <Link to="/login" className="giu-navbar__auth-link">Login</Link>
                                <Link to="/register" className="giu-navbar__auth-link giu-navbar__auth-link--outline">Register</Link>
                            </>
                        )}

                        {/* Mobile hamburger */}
                        <button
                            className="giu-navbar__hamburger"
                            aria-label="Toggle menu"
                            onClick={() => setMobileOpen((o) => !o)}
                        >
                            {mobileOpen ? <XIcon /> : <MenuIcon />}
                        </button>
                    </div>
                </div>

                {/* Mobile dropdown */}
                {mobileOpen && (
                    <nav className="giu-navbar__mobile-menu">
                        {navLinks.map(({ label, to }) => (
                            <Link
                                key={to}
                                to={to}
                                className={`giu-navbar__mobile-link${isActive(to) ? " giu-navbar__mobile-link--active" : ""}`}
                                onClick={() => setMobileOpen(false)}
                            >
                                {label}
                            </Link>
                        ))}
                        {isAuthenticated ? (
                            <button
                                className="giu-navbar__logout-btn"
                                style={{ marginTop: "4px", textAlign: "left" }}
                                onClick={() => { setMobileOpen(false); handleLogout(); }}
                            >
                                Logout
                            </button>
                        ) : (
                            <>
                                <Link to="/login" className="giu-navbar__mobile-link" onClick={() => setMobileOpen(false)}>Login</Link>
                                <Link to="/register" className="giu-navbar__mobile-link" onClick={() => setMobileOpen(false)}>Register</Link>
                            </>
                        )}
                    </nav>
                )}
            </header>
        </>
    );
};

export default Navbar;