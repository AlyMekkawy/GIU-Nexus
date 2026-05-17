import { Link } from "react-router-dom";

const Footer = () => {
    return (
        <>
            <style>{`
                .giu-footer {
                    background: #ffffff;
                    border-top: 1px solid #e8eaed;
                    font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
                    /* Must sit flush — no margin */
                    margin: 0;
                    width: 100%;
                }

                .giu-footer__inner {
                    max-width: 1200px;
                    margin: 0 auto;
                    padding: 48px 28px 40px;
                    display: grid;
                    grid-template-columns: 1.8fr 1fr 1fr 1.4fr;
                    gap: 48px;
                }

                .giu-footer__brand-name {
                    font-size: 1.2rem;
                    font-weight: 700;
                    color: #1a1f2e;
                    letter-spacing: -0.3px;
                    margin: 0 0 12px;
                }

                .giu-footer__brand-desc {
                    font-size: 0.875rem;
                    color: #6b7280;
                    line-height: 1.65;
                    margin: 0;
                    max-width: 230px;
                }

                .giu-footer__col-title {
                    font-size: 0.75rem;
                    font-weight: 700;
                    color: #1a1f2e;
                    letter-spacing: 0.06em;
                    text-transform: uppercase;
                    margin: 0 0 16px;
                }

                .giu-footer__col-links {
                    list-style: none;
                    margin: 0;
                    padding: 0;
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                }

                .giu-footer__col-link {
                    text-decoration: none;
                    font-size: 0.875rem;
                    color: #6b7280;
                    transition: color 0.15s;
                }
                .giu-footer__col-link:hover { color: #1a7a6e; }

                .giu-footer__copyright-col {}

                .giu-footer__copyright {
                    font-size: 0.8125rem;
                    color: #6b7280;
                    line-height: 1.6;
                    margin: 0;
                }

                @media (max-width: 768px) {
                    .giu-footer__inner {
                        grid-template-columns: 1fr 1fr;
                        gap: 32px;
                    }
                }

                @media (max-width: 480px) {
                    .giu-footer__inner {
                        grid-template-columns: 1fr;
                        gap: 28px;
                        padding: 36px 20px 32px;
                    }
                }
            `}</style>

            <footer className="giu-footer">
                <div className="giu-footer__inner">

                    {/* Brand */}
                    <div>
                        <p className="giu-footer__brand-name">GIU Nexus</p>
                        <p className="giu-footer__brand-desc">
                            Empowering the next generation of academic talent with AI-driven career matching.
                        </p>
                    </div>

                    {/* Platform */}
                    <div>
                        <p className="giu-footer__col-title">Platform</p>
                        <ul className="giu-footer__col-links">
                            <li><Link to="/about" className="giu-footer__col-link">About Us</Link></li>
                            <li><Link to="/help" className="giu-footer__col-link">Help Center</Link></li>
                        </ul>
                    </div>

                    {/* Legal */}
                    <div>
                        <p className="giu-footer__col-title">Legal</p>
                        <ul className="giu-footer__col-links">
                            <li><Link to="/privacy" className="giu-footer__col-link">Privacy Policy</Link></li>
                            <li><Link to="/terms" className="giu-footer__col-link">Terms of Service</Link></li>
                        </ul>
                    </div>

                    {/* Nexus Stats / Copyright */}
                    <div className="giu-footer__copyright-col">
                        <p className="giu-footer__col-title">Nexus Stats</p>
                        <p className="giu-footer__copyright">
                            © 2024 GIU Nexus. AI-Powered Career Excellence.
                        </p>
                    </div>

                </div>
            </footer>
        </>
    );
};

export default Footer;
