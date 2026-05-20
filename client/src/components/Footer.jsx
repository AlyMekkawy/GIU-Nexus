import { Link } from "react-router-dom";

const ShareIcon = () => (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="18" cy="5" r="3"/>
        <circle cx="6" cy="12" r="3"/>
        <circle cx="18" cy="19" r="3"/>
        <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
        <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
    </svg>
);

const GlobeIcon = () => (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/>
        <line x1="2" y1="12" x2="22" y2="12"/>
        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
    </svg>
);

const Footer = () => {
    return (
        <>
            <style>{`
        .giu-footer {
          background: #ffffff;
          border-top: 1px solid #e8eaed;
          font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
        }

        .giu-footer__inner {
          max-width: 1200px;
          margin: 0 auto;
          padding: 48px 24px 32px;
          display: grid;
          grid-template-columns: 1.6fr 1fr 1fr 1.2fr;
          gap: 40px;
        }

        /* Brand column */
        .giu-footer__brand-name {
          font-size: 1.25rem;
          font-weight: 700;
          color: #1a1f2e;
          letter-spacing: -0.3px;
          margin: 0 0 10px;
        }

        .giu-footer__brand-desc {
          font-size: 0.875rem;
          color: #6b7280;
          line-height: 1.6;
          margin: 0;
          max-width: 220px;
        }

        /* Link columns */
        .giu-footer__col-title {
          font-size: 0.875rem;
          font-weight: 600;
          color: #1a1f2e;
          margin: 0 0 14px;
        }

        .giu-footer__col-links {
          list-style: none;
          margin: 0;
          padding: 0;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .giu-footer__col-link {
          text-decoration: none;
          font-size: 0.875rem;
          color: #6b7280;
          transition: color 0.15s ease;
        }

        .giu-footer__col-link:hover {
          color: #1a7a6e;
        }

        /* Copyright column */
        .giu-footer__copyright-col {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 16px;
        }

        .giu-footer__copyright {
          font-size: 0.8125rem;
          color: #6b7280;
          line-height: 1.5;
          text-align: right;
          margin: 0;
        }

        .giu-footer__social {
          display: flex;
          gap: 8px;
        }

        .giu-footer__social-btn {
          width: 34px;
          height: 34px;
          border-radius: 8px;
          border: 1px solid #e8eaed;
          background: transparent;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #6b7280;
          transition: background 0.15s ease, border-color 0.15s ease, color 0.15s ease;
        }

        .giu-footer__social-btn:hover {
          background: #eaf4f2;
          border-color: #1a7a6e;
          color: #1a7a6e;
        }

        /* Responsive */
        @media (max-width: 768px) {
          .giu-footer__inner {
            grid-template-columns: 1fr 1fr;
            gap: 32px;
          }

          .giu-footer__copyright-col {
            align-items: flex-start;
          }

          .giu-footer__copyright {
            text-align: left;
          }
        }

        @media (max-width: 480px) {
          .giu-footer__inner {
            grid-template-columns: 1fr;
            gap: 28px;
            padding: 36px 20px 28px;
          }
        }
      `}</style>

            <footer className="giu-footer">
                <div className="giu-footer__inner">

                    {/* Brand */}
                    <div>
                        <p className="giu-footer__brand-name">GIU Nexus</p>
                        <p className="giu-footer__brand-desc">
                            Connecting top-tier university talent with global career opportunities through AI-driven intelligence.
                        </p>
                    </div>

                    {/* Platform */}
                    <div>
                        <p className="giu-footer__col-title">Platform</p>
                        <ul className="giu-footer__col-links">
                            <li><Link to="/about" className="giu-footer__col-link">About Us</Link></li>
                            <li><Link to="/privacy" className="giu-footer__col-link">Privacy Policy</Link></li>
                        </ul>
                    </div>

                    {/* Support */}
                    <div>
                        <p className="giu-footer__col-title">Support</p>
                        <ul className="giu-footer__col-links">
                            <li><Link to="/terms" className="giu-footer__col-link">Terms of Service</Link></li>
                            <li><Link to="/help" className="giu-footer__col-link">Help Center</Link></li>
                        </ul>
                    </div>

                    {/* Copyright + Social */}
                    <div className="giu-footer__copyright-col">
                        <p className="giu-footer__copyright">
                            © 2024 GIU Nexus. AI-Powered Career Excellence.
                        </p>
                        <div className="giu-footer__social">
                            <button className="giu-footer__social-btn" aria-label="Share">
                                <ShareIcon />
                            </button>
                            <button className="giu-footer__social-btn" aria-label="Website">
                                <GlobeIcon />
                            </button>
                        </div>
                    </div>

                </div>
            </footer>
        </>
    );
};

export default Footer;
