import './Footer.css';

function Footer() {
    return (
        <footer className="footer">
            <div className="footer-inner">
                <div>
                    <span className="footer-logo">GIU Nexus</span>
                    <p className="footer-tagline">AI-Powered Career Excellence.</p>
                    <p className="footer-copy">© 2026 GIU Nexus. All rights reserved.</p>
                </div>
                <div className="footer-links">
                    <div>
                        <h4 className="footer-heading">Platform</h4>
                        <a href="#" className="footer-link">About Us</a>
                        <a href="#" className="footer-link">Help Center</a>
                    </div>
                    <div>
                        <h4 className="footer-heading">Legal</h4>
                        <a href="#" className="footer-link">Privacy Policy</a>
                        <a href="#" className="footer-link">Terms of Service</a>
                    </div>
                </div>
            </div>
        </footer>
    );
}

export default Footer;
