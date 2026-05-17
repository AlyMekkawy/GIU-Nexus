import { Link } from 'react-router-dom';
import '../styles/home.css';

export default function Footer() {
  return (
    <footer>
      <section>
        <div className="footer-grid">
          <div>
            <span className="text-display-mobile font-semibold text-on-surface">GIU Nexus</span>
            <p className="text-caption text-ink-muted mt-4">Empowering university talent through intelligent matching and career insights.</p>
          </div>
          <div>
            <h5>Platform</h5>
            <ul>
              <li><Link to="#">About Us</Link></li>
              <li><Link to="#">Privacy Policy</Link></li>
            </ul>
          </div>
          <div>
            <h5>Resources</h5>
            <ul>
              <li><Link to="#">Terms of Service</Link></li>
              <li><Link to="#">Help Center</Link></li>
            </ul>
          </div>
          <div>
            <h5>Connect</h5>
            <p className="text-caption text-ink-muted">Join the nexus of career excellence.</p>
            <div className="flex gap-4 mt-4">
              <span className="material-symbols-outlined text-on-surface-variant cursor-pointer hover\:text-primary">share</span>
              <span className="material-symbols-outlined text-on-surface-variant cursor-pointer hover\:text-primary">mail</span>
            </div>
          </div>
        </div>
        <div className="footer-divider">
          <p className="footer-copyright">© 2024 GIU Nexus. AI-Powered Career Excellence.</p>
        </div>
      </section>
    </footer>
  );
}
