// components/Navbar.jsx
// Role-aware frosted sticky navigation bar.
// Reads user/role from AuthContext and shows the correct nav links.
// Used by all pages — import and drop in at the top.

import { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./Navbar.css";

// Nav link sets per role
const NAV_LINKS = {
  admin: [
    { to: "/admin/dashboard",   label: "Dashboard" },
    { to: "/admin/recruiters",  label: "Recruiters" },
    { to: "/admin/jobs",        label: "Jobs" },
    { to: "/admin/users",       label: "Users" },
  ],
  recruiter: [
    { to: "/recruiter/dashboard",     label: "Dashboard" },
    { to: "/recruiter/jobs/create",   label: "Create Job" },
    { to: "/profile/edit",            label: "Profile" },
  ],
  jobSeeker: [
    { to: "/",                  label: "Home" },
    { to: "/jobs",              label: "Jobs" },
    { to: "/jobs/recommended",  label: "Recommended" },
    { to: "/jobs/saved",        label: "Saved" },
    { to: "/applications/my",   label: "Applications" },
    { to: "/profile",           label: "Profile" },
  ],
  public: [
    { to: "/",         label: "Home" },
    { to: "/jobs",     label: "Jobs" },
  ],
};

// Returns the first character of a name in uppercase
const initial = (str = "") => (str.trim()[0] || "?").toUpperCase();

function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const links = isAuthenticated && user?.role
    ? (NAV_LINKS[user.role] || NAV_LINKS.public)
    : NAV_LINKS.public;

  async function handleLogout() {
    setDrawerOpen(false);
    await logout();
    navigate("/login", { replace: true });
  }

  return (
    <header className="nexus-nav" role="banner">
      <div className="nexus-nav-inner">

        {/* Brand */}
        <Link to="/" className="nexus-nav-brand" aria-label="GIU Nexus home">
          GIU Nexus
        </Link>

        {/* Desktop nav links */}
        <nav className="nexus-nav-links" aria-label="Main navigation">
          {links.map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) => isActive ? "nav-active" : ""}
              end={to === "/"}
            >
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Right-side actions */}
        <div className="nexus-nav-actions">
          {isAuthenticated && user ? (
            <>
              <div
                className="nexus-nav-user-chip"
                aria-label={`Logged in as ${user.name}`}
              >
                <div className="nexus-nav-avatar" aria-hidden="true">
                  {initial(user.name)}
                </div>
                <span>{user.name}</span>
              </div>
              <button
                className="nexus-nav-logout"
                onClick={handleLogout}
                aria-label="Log out"
              >
                Log out
              </button>
            </>
          ) : (
            <>
              <Link to="/login"    className="nexus-nav-login">    Sign in  </Link>
              <Link to="/register" className="nexus-nav-register"> Join     </Link>
            </>
          )}

          {/* Hamburger */}
          <button
            className="nexus-nav-hamburger"
            onClick={() => setDrawerOpen((o) => !o)}
            aria-label={drawerOpen ? "Close menu" : "Open menu"}
            aria-expanded={drawerOpen}
          >
            <span />
            <span />
            <span />
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      <nav
        className={`nexus-nav-drawer${drawerOpen ? " open" : ""}`}
        aria-label="Mobile navigation"
      >
        {links.map(({ to, label }) => (
          <Link key={to} to={to} onClick={() => setDrawerOpen(false)}>
            {label}
          </Link>
        ))}
        {isAuthenticated ? (
          <button onClick={handleLogout}>Log out</button>
        ) : (
          <>
            <Link to="/login"    onClick={() => setDrawerOpen(false)}>Sign in</Link>
            <Link to="/register" onClick={() => setDrawerOpen(false)}>Join</Link>
          </>
        )}
      </nav>
    </header>
  );
}

export default Navbar;
