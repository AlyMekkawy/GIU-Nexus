import { useTheme } from "../context/ThemeContext";

const TEAM_MEMBERS = [
    "Aly Moataz Elmekawy",
    "Adham Walaa Elewa 👶",
    "Tarek Wael Aboelsaeoud 🚪",
    "Youssef Amr Soliman 🐧",
    "Mahmoud Wael 🍑",
    "David Ramy 🙂",
    "Khaled Ahmed Elmasry ⚡",
    "Khaled Waleed Abbas 🦇",
    "Samir Waleed 👳‍♂️",
    "Sam Shady Bostawros 🕴",
];

const Footer = () => {
    const { theme } = useTheme();
    const isLight = theme === "light";
    const brandLogo = "/fullLogoB.png";

    return (
        <>
            <style>{`
        .giu-footer {
          background: ${isLight ? "#EDE6D8" : "#181818"};
          border-top: 1px solid ${isLight ? "rgba(18,16,15,0.08)" : "rgba(255,255,255,0.08)"};
          font-family: var(--font-family-body), system-ui, sans-serif;
        }

        .giu-footer__inner {
          max-width: 1320px;
          margin: 0 auto;
          padding: 42px 32px 32px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 34px;
        }

        .giu-footer__brand {
          width: 100%;
          display: flex;
          justify-content: center;
        }

        .giu-footer__brand-logo {
          display: block;
          width: min(760px, 92vw);
          height: auto;
          object-fit: contain;
        }

        .giu-footer__team {
          width: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 14px;
        }

        .giu-footer__team-label {
          margin: 0;
          font-size: 0.78rem;
          font-weight: 800;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: ${isLight ? "#8A6400" : "#C89A3D"};
        }

        .giu-footer__team-list {
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          gap: 10px;
          max-width: 980px;
        }

        .giu-footer__team-chip {
          display: inline-flex;
          align-items: center;
          padding: 7px 12px;
          border-radius: 999px;
          border: 1px solid ${isLight ? "rgba(26,20,16,0.12)" : "rgba(255,255,255,0.1)"};
          background: ${isLight ? "rgba(255,255,255,0.55)" : "rgba(255,255,255,0.045)"};
          color: ${isLight ? "#1A1410" : "#F4EEE6"};
          font-size: 0.86rem;
          font-weight: 600;
          white-space: nowrap;
        }

        @media (max-width: 768px) {
          .giu-footer__inner {
            padding: 34px 20px 28px;
            gap: 26px;
          }

          .giu-footer__brand-logo {
            width: min(560px, 94vw);
          }
        }

        @media (max-width: 480px) {
          .giu-footer__brand-logo {
            width: 94vw;
          }

          .giu-footer__team-chip {
            font-size: 0.78rem;
            padding: 6px 10px;
          }
        }
      `}</style>

            <footer className="giu-footer">
                <div className="giu-footer__inner">
                    <div className="giu-footer__brand">
                        <img
                            className="giu-footer__brand-logo"
                            src={brandLogo}
                            alt="GIU Nexus"
                        />
                    </div>

                    <div className="giu-footer__team">
                        <p className="giu-footer__team-label">Team</p>

                        <div className="giu-footer__team-list" aria-label="Team members">
                            {TEAM_MEMBERS.map((name) => (
                                <span key={name} className="giu-footer__team-chip">
                  {name}
                </span>
                            ))}
                        </div>
                    </div>
                </div>
            </footer>
        </>
    );
};

export default Footer;