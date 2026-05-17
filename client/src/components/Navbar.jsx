import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

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
        { label: "Recommended", to: "/jobs/recommended" },
    ];

    const isActive = (path) => location.pathname === path;

    return (
        <>
            <style>{`
                .giu-navbar {
                    position: sticky;
                    top: 0;
                    left: 0;
                    right: 0;
                    z-index: 100;
                    background: #ffffff;
                    border-bottom: 1px solid #e8eaed;
                    font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
                    /* No margin — must touch the very top edge */
                    margin: 0;
                }

                .giu-navbar__inner {
                    max-width: 1200px;
                    margin: 0 auto;
                    padding: 0 28px;
                    height: 60px;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    gap: 32px;
                }

                .giu-navbar__logo {
                    text-decoration: none;
                    font-size: 1.25rem;
                    font-weight: 700;
                    color: #1a7a6e;
                    letter-spacing: -0.3px;
                    white-space: nowrap;
                    flex-shrink: 0;
                }
                .giu-navbar__logo:hover { color: #15685d; }

                .giu-navbar__links {
                    display: flex;
                    align-items: center;
                    gap: 2px;
                    list-style: none;
                    margin: 0;
                    padding: 0;
                    flex: 1;
                    justify-content: center;
                }

                .giu-navbar__link {
                    text-decoration: none;
                    padding: 6px 14px;
                    font-size: 0.9375rem;
                    font-weight: 500;
                    color: #5a6270;
                    transition: color 0.15s;
                    white-space: nowrap;
                    position: relative;
                }

                .giu-navbar__link:hover { color: #1a1f2e; }

                .giu-navbar__link--active {
                    color: #1a1f2e;
                    font-weight: 600;
                }

                /* Bottom underline on active link, like the reference */
                .giu-navbar__link--active::after {
                    content: '';
                    position: absolute;
                    bottom: -20px;
                    left: 14px;
                    right: 14px;
                    height: 2px;
                    background: #1a7a6e;
                    border-radius: 2px 2px 0 0;
                }

                .giu-navbar__actions {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    flex-shrink: 0;
                }

                .giu-navbar__avatar {
                    width: 36px;
                    height: 36px;
                    border-radius: 50%;
                    background: #4a7c7a;
                    color: #ffffff;
                    font-size: 0.875rem;
                    font-weight: 600;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    border: 2px solid #e8eaed;
                    transition: box-shadow 0.15s;
                }
                .giu-navbar__avatar:hover {
                    box-shadow: 0 0 0 3px rgba(29, 122, 110, 0.15);
                }

                .giu-navbar__logout-btn {
                    padding: 6px 14px;
                    border-radius: 8px;
                    border: 1.5px solid #d1d5db;
                    background: transparent;
                    cursor: pointer;
                    font-size: 0.875rem;
                    font-weight: 500;
                    color: #5a6270;
                    transition: border-color 0.15s, color 0.15s, background 0.15s;
                    white-space: nowrap;
                }
                .giu-navbar__logout-btn:hover {
                    border-color: #e53e3e;
                    color: #e53e3e;
                    background: #fff5f5;
                }

                .giu-navbar__auth-link {
                    text-decoration: none;
                    padding: 6px 14px;
                    border-radius: 8px;
                    font-size: 0.9rem;
                    font-weight: 500;
                    color: #3c4048;
                    transition: color 0.15s;
                    white-space: nowrap;
                }
                .giu-navbar__auth-link:hover { color: #1a7a6e; }
                .giu-navbar__auth-link--outline {
                    border: 1.5px solid #1a7a6e;
                    color: #1a7a6e;
                }
                .giu-navbar__auth-link--outline:hover { background: #eaf4f2; }

                .giu-navbar__hamburger {
                    display: none;
                    width: 36px;
                    height: 36px;
                    border-radius: 8px;
                    border: none;
                    background: transparent;
                    cursor: pointer;
                    align-items: center;
                    justify-content: center;
                    color: #5a6270;
                }
                .giu-navbar__hamburger:hover { background: #f0f4f3; }

                .giu-navbar__mobile-menu {
                    display: none;
                    flex-direction: column;
                    padding: 10px 16px 14px;
                    border-top: 1px solid #e8eaed;
                    gap: 2px;
                    background: #fff;
                }

                .giu-navbar__mobile-link {
                    text-decoration: none;
                    padding: 10px 14px;
                    border-radius: 8px;
                    font-size: 0.9375rem;
                    font-weight: 500;
                    color: #3c4048;
                    transition: background 0.15s, color 0.15s;
                }
                .giu-navbar__mobile-link:hover,
                .giu-navbar__mobile-link--active {
                    background: #eaf4f2;
                    color: #1a7a6e;
                }

                @media (max-width: 640px) {
                    .giu-navbar__links { display: none; }
                    .giu-navbar__hamburger { display: flex; }
                    .giu-navbar__mobile-menu { display: flex; }
                }
            `}</style>

            <header className="giu-navbar">
                <div className="giu-navbar__inner">
                    <Link to="/" className="giu-navbar__logo">GIU Nexus</Link>

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

                    <div className="giu-navbar__actions">
                        {isAuthenticated ? (
                            <>
                                <button className="giu-navbar__avatar" aria-label="User menu">
                                    {user?.name?.charAt(0).toUpperCase() || "U"}
                                </button>
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

                        <button
                            className="giu-navbar__hamburger"
                            aria-label="Toggle menu"
                            onClick={() => setMobileOpen((o) => !o)}
                        >
                            {mobileOpen ? <XIcon /> : <MenuIcon />}
                        </button>
                    </div>
                </div>

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