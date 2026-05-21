// components/Navbar.jsx
import { useState, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { gsap } from "gsap";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import "./Navbar.css";

// ── Icons ──────────────────────────────────────────────────────────────────
const BellIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
    <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
  </svg>
);

const MenuIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <line x1="3" y1="6"  x2="21" y2="6"/>
    <line x1="3" y1="12" x2="21" y2="12"/>
    <line x1="3" y1="18" x2="21" y2="18"/>
  </svg>
);

const XIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <line x1="18" y1="6"  x2="6"  y2="18"/>
    <line x1="6"  y1="6"  x2="18" y2="18"/>
  </svg>
);

const UserIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
    <circle cx="12" cy="7" r="4"/>
  </svg>
);

const EditIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
  </svg>
);

const KeyIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0 3 3L22 7l-3-3m-3.5 3.5L19 4"/>
  </svg>
);

const LogoutIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
    <polyline points="16 17 21 12 16 7"/>
    <line x1="21" y1="12" x2="9" y2="12"/>
  </svg>
);

// ── Helpers ────────────────────────────────────────────────────────────────
function getNavLinks(role) {
  switch (role) {
    case "admin":
      return [
        { label: "Dashboard",  to: "/admin/dashboard"  },
        { label: "Users",      to: "/admin/users"      },
        { label: "Jobs",       to: "/admin/jobs"       },
        { label: "Recruiters", to: "/admin/recruiters" },
      ];
    case "recruiter":
      return [
        { label: "Dashboard",  to: "/recruiter/dashboard"   },
        { label: "Post a Job", to: "/recruiter/jobs/create" },
      ];
    case "jobSeeker":
      return [
        { label: "Home",            to: "/"                 },
        { label: "Jobs",            to: "/jobs"             },
        { label: "Recommended",     to: "/jobs/recommended" },
        { label: "Saved",           to: "/jobs/saved"       },
        { label: "My Applications", to: "/applications/my"  },
      ];
    default:
      return [
        { label: "Home", to: "/" },
        { label: "Jobs", to: "/jobs" },
      ];
  }
}

function getHomeTo(role) {
  if (role === "admin")     return "/admin/dashboard";
  if (role === "recruiter") return "/recruiter/dashboard";
  return "/";
}

function getRoleLabel(role) {
  if (role === "admin")     return "Admin";
  if (role === "recruiter") return "Recruiter";
  if (role === "jobSeeker") return "Job Seeker";
  return null;
}

function toInitials(name = "") {
  return name.trim().split(/\s+/).map((w) => w[0] || "").slice(0, 2).join("").toUpperCase() || "U";
}

// ── AnimatedNavLink ────────────────────────────────────────────────────────
// Color transitions handled by CSS — GSAP only drives the underbar scaleX.
function AnimatedNavLink({ to, label, active }) {
  const barRef = useRef(null);

  function onEnter() {
    if (active) return;
    gsap.to(barRef.current, { scaleX: 1, duration: 0.22, ease: "power2.out" });
  }

  function onLeave() {
    if (active) return;
    gsap.to(barRef.current, { scaleX: 0, duration: 0.18, ease: "power2.in" });
  }

  return (
    <li className="nav__item">
      <Link
        to={to}
        className={`nav__link${active ? " nav__link--active" : ""}`}
        onMouseEnter={onEnter}
        onMouseLeave={onLeave}
      >
        {label}
        <span ref={barRef} className="nav__link-bar" />
      </Link>
    </li>
  );
}

// ── Navbar ─────────────────────────────────────────────────────────────────
export default function Navbar() {
  const [mobileOpen,   setMobileOpen]   = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const navRef        = useRef(null);
  const logoRef       = useRef(null);
  const dropWrapRef   = useRef(null);
  const dropdownRef   = useRef(null);
  const mobileRef     = useRef(null);
  const themeIconRef  = useRef(null);

  const role   = user?.role;
  const links  = getNavLinks(role);
  const homeTo = getHomeTo(role);

  const isActive = (path) =>
    path === "/" ? location.pathname === "/" : location.pathname.startsWith(path);

  // Navbar slides down from y:-62 on mount
  useEffect(() => {
    gsap.fromTo(
      navRef.current,
      { y: -62, opacity: 0 },
      { y: 0,   opacity: 1, duration: 0.55, ease: "power3.out" }
    );
  }, []);

  // Logo dot bounce on mount
  useEffect(() => {
    const dot = logoRef.current?.querySelector(".nav__logo-dot");
    if (!dot) return;
    gsap.fromTo(dot,
      { scale: 0 },
      { scale: 1, duration: 0.5, delay: 0.4, ease: "back.out(2)" }
    );
  }, []);

  // Dropdown fade + scale in
  useEffect(() => {
    if (!dropdownRef.current) return;
    if (dropdownOpen) {
      gsap.fromTo(dropdownRef.current,
        { opacity: 0, scale: 0.92, y: -6 },
        { opacity: 1, scale: 1,    y: 0, duration: 0.22, ease: "power3.out" }
      );
    }
  }, [dropdownOpen]);

  // Mobile menu GSAP height animation
  useEffect(() => {
    if (!mobileRef.current) return;
    if (mobileOpen) {
      gsap.fromTo(mobileRef.current,
        { height: 0, opacity: 0 },
        { height: "auto", opacity: 1, duration: 0.3, ease: "power3.out" }
      );
    } else {
      gsap.to(mobileRef.current,
        { height: 0, opacity: 0, duration: 0.2, ease: "power2.in" }
      );
    }
  }, [mobileOpen]);

  // Click-outside handler for dropdown
  useEffect(() => {
    function handleMouseDown(e) {
      if (
        dropWrapRef.current && !dropWrapRef.current.contains(e.target) &&
        dropdownRef.current && !dropdownRef.current.contains(e.target)
      ) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleMouseDown);
    return () => document.removeEventListener("mousedown", handleMouseDown);
  }, []);

  async function handleLogout() {
    setDropdownOpen(false);
    setMobileOpen(false);
    await logout();
    navigate("/");
  }

  // Logo dot — scale only (color handled by CSS)
  function handleLogoHover(entering) {
    const dot = logoRef.current?.querySelector(".nav__logo-dot");
    if (!dot) return;
    gsap.to(dot, {
      scale: entering ? 1.4 : 1,
      duration: 0.2,
      ease: entering ? "back.out(2)" : "power2.out",
    });
  }

  // Theme toggle — flip animation on the icon
  function handleThemeToggle() {
    const icon = themeIconRef.current;
    if (icon) {
      gsap.to(icon, {
        scale: 0, rotate: 90, duration: 0.15, ease: "power2.in",
        onComplete: () => {
          toggleTheme();
          gsap.fromTo(icon,
            { scale: 0, rotate: -90 },
            { scale: 1, rotate: 0, duration: 0.25, ease: "back.out(2)" }
          );
        },
      });
    } else {
      toggleTheme();
    }
  }

  return (
    <header className="nav" ref={navRef}>
      <div className="nav__inner">

        {/* Logo */}
        <Link
          ref={logoRef}
          to={homeTo}
          className="nav__logo"
          onMouseEnter={() => handleLogoHover(true)}
          onMouseLeave={() => handleLogoHover(false)}
        >
          <span className="nav__logo-dot" />
          GIU Nexus
        </Link>

        {/* Desktop nav links */}
        <ul className="nav__links">
          {links.map(({ label, to }) => (
            <AnimatedNavLink key={to} to={to} label={label} active={isActive(to)} />
          ))}
        </ul>

        {/* Right actions */}
        <div className="nav__actions">
          {isAuthenticated ? (
            <>
              {/* Bell */}
              <button className="nav__icon-btn" aria-label="Notifications">
                <BellIcon />
                <span className="nav__notif-dot" aria-hidden="true" />
              </button>

              <div className="nav__divider" />

              {/* Greeting + role pill */}
              <span className="nav__greeting">
                Hi, <strong>{user?.name?.split(" ")[0]}</strong>
              </span>
              {getRoleLabel(role) && (
                <span className={`nav__role-pill nav__role-pill--${role}`}>
                  {getRoleLabel(role)}
                </span>
              )}

              {/* Avatar → dropdown */}
              <div className="nav__dropdown-wrap" ref={dropWrapRef}>
                <button
                  className={`nav__avatar-btn${dropdownOpen ? " nav__avatar-btn--open" : ""}`}
                  onClick={() => setDropdownOpen((o) => !o)}
                  aria-label="User menu"
                  aria-expanded={dropdownOpen}
                >
                  {toInitials(user?.name)}
                </button>

                {dropdownOpen && (
                  <div
                    ref={dropdownRef}
                    className="nav__dropdown"
                    role="menu"
                  >
                    {/* Header */}
                    <div className="nav__dropdown-header">
                      <div className="nav__dropdown-name">{user?.name}</div>
                      <div className="nav__dropdown-email">{user?.email}</div>
                    </div>

                    {/* Profile — job seeker only */}
                    {role === "jobSeeker" && (
                      <Link
                        to="/profile"
                        className="nav__dropdown-item"
                        onClick={() => setDropdownOpen(false)}
                        role="menuitem"
                      >
                        <UserIcon /> Profile
                      </Link>
                    )}

                    {/* Edit Profile — all authenticated */}
                    <Link
                      to="/profile/edit"
                      className="nav__dropdown-item"
                      onClick={() => setDropdownOpen(false)}
                      role="menuitem"
                    >
                      <EditIcon /> Edit Profile
                    </Link>

                    {/* Change Password — all authenticated */}
                    <Link
                      to="/profile/change-password"
                      className="nav__dropdown-item"
                      onClick={() => setDropdownOpen(false)}
                      role="menuitem"
                    >
                      <KeyIcon /> Change Password
                    </Link>

                    <div className="nav__dropdown-sep" />

                    {/* Log Out */}
                    <button
                      className="nav__dropdown-item nav__dropdown-item--danger"
                      onClick={handleLogout}
                      role="menuitem"
                    >
                      <LogoutIcon /> Log Out
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <Link to="/login"    className="nav__auth-login">Log In</Link>
              <Link to="/register" className="nav__auth-register">Get Started</Link>
            </>
          )}

          {/* ── Theme toggle ── */}
          <button
            className="nav__icon-btn nav__theme-btn"
            aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            onClick={handleThemeToggle}
            title={theme === "dark" ? "Light mode" : "Dark mode"}
          >
            <span
              ref={themeIconRef}
              className="material-symbols-outlined"
              style={{ fontSize: "18px", fontVariationSettings: "'FILL' 1", display: "block" }}
            >
              {theme === "dark" ? "light_mode" : "dark_mode"}
            </span>
          </button>

          {/* Hamburger */}
          <button
            className="nav__hamburger"
            aria-label="Toggle menu"
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen((o) => !o)}
          >
            {mobileOpen ? <XIcon /> : <MenuIcon />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <nav ref={mobileRef} className="nav__mobile" style={{ height: 0, opacity: 0 }} aria-label="Mobile navigation">
        <div className="nav__mobile-inner">
          {links.map(({ label, to }) => (
            <Link
              key={to}
              to={to}
              className={`nav__mobile-link${isActive(to) ? " nav__mobile-link--active" : ""}`}
              onClick={() => setMobileOpen(false)}
            >
              {label}
            </Link>
          ))}

          {isAuthenticated ? (
            <>
              <div className="nav__mobile-sep" />
              {role === "jobSeeker" && (
                <Link
                  to="/profile"
                  className="nav__mobile-link"
                  onClick={() => setMobileOpen(false)}
                >
                  Profile
                </Link>
              )}
              <Link
                to="/profile/edit"
                className="nav__mobile-link"
                onClick={() => setMobileOpen(false)}
              >
                Edit Profile
              </Link>
              <Link
                to="/profile/change-password"
                className="nav__mobile-link"
                onClick={() => setMobileOpen(false)}
              >
                Change Password
              </Link>
              <div className="nav__mobile-sep" />
              <button
                className="nav__logout-btn"
                style={{ marginTop: 4 }}
                onClick={handleLogout}
              >
                Log Out
              </button>
            </>
          ) : (
            <>
              <div className="nav__mobile-sep" />
              <Link to="/login"    className="nav__mobile-link" onClick={() => setMobileOpen(false)}>Log In</Link>
              <Link to="/register" className="nav__mobile-link" onClick={() => setMobileOpen(false)}>Get Started</Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
