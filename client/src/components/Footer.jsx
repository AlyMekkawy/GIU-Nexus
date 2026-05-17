// components/Footer.jsx
// Static platform footer used on all pages.
// Import and place at the bottom of any page component.

import { Link } from "react-router-dom";
import "./Footer.css";

function Footer() {
  return (
    <footer className="nexus-footer" role="contentinfo">
      <div className="nexus-footer-grid">

        {/* Brand column */}
        <div>
          <span className="nexus-footer-brand-name">GIU Nexus</span>
          <p className="nexus-footer-brand-sub">
            AI-powered career and talent platform connecting students,
            recruiters, and admins at GIU.
          </p>
        </div>

        {/* Platform links */}
        <div className="nexus-footer-col">
          <h4>Platform</h4>
          <ul>
            <li><Link to="/jobs">Browse Jobs</Link></li>
            <li><Link to="/profile">My Profile</Link></li>
            <li><Link to="/recruiter/dashboard">Recruiter Dashboard</Link></li>
            <li><Link to="/admin/dashboard">Admin Dashboard</Link></li>
          </ul>
        </div>

        {/* Resources */}
        <div className="nexus-footer-col">
          <h4>Resources</h4>
          <ul>
            <li><a href="#">About Us</a></li>
            <li><a href="#">Privacy Policy</a></li>
            <li><a href="#">Terms of Service</a></li>
            <li><a href="#">Help Center</a></li>
          </ul>
        </div>

        {/* Support */}
        <div className="nexus-footer-col">
          <h4>Support</h4>
          <ul>
            <li><a href="#">Internal Support</a></li>
            <li><a href="#">Security Reports</a></li>
            <li><a href="#">System Status</a></li>
          </ul>
        </div>

      </div>

      <div className="nexus-footer-bottom">
        <p>© {new Date().getFullYear()} GIU Nexus. AI-Powered Career Excellence.</p>
      </div>
    </footer>
  );
}

export default Footer;
