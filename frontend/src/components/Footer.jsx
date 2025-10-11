// src/components/Footer.jsx
import { Link } from "react-router-dom";

// Spring Energy palette
// From image: #89F336, #FFFC30, #4FE0CB, #00BF33
const COLORS = {
    lime: "#89F336",
    lemon: "#FFFC30",
    aqua: "#4FE0CB",
    green: "#00BF33",

    // Theme neutrals for contrast (no behavior change)
    surface: "#0f1a12",
    surfaceSoft: "#132416",
    border: "rgba(0,191,51,0.45)", // derived from green
    text: "#eaffea",
    textMuted: "rgba(234,255,234,0.72)",
};

export default function Footer() {
    const year = new Date().getFullYear();

    return (
        <footer
            style={{
                marginTop: "auto",
                padding: "28px 16px",
                background: `linear-gradient(180deg, ${COLORS.surfaceSoft} 0%, ${COLORS.surface} 100%)`,
                borderTop: `1px solid ${COLORS.border}`,
                color: COLORS.text,
                boxShadow: "0 -10px 24px rgba(0,0,0,0.35)",
            }}
        >
            <div
                style={{
                    maxWidth: 1200,
                    margin: "0 auto",
                    display: "flex",
                    flexWrap: "wrap",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    gap: 16,
                    fontSize: 14,
                }}
            >
                {/* Brand & copyright */}
                <div>
                    <div
                        style={{
                            fontWeight: 800,
                            fontSize: 18,
                            marginBottom: 6,
                            background: `linear-gradient(135deg, ${COLORS.lime} 0%, ${COLORS.aqua} 60%, ${COLORS.green} 100%)`,
                            WebkitBackgroundClip: "text",
                            WebkitTextFillColor: "transparent",
                        }}
                    >
                        EV Station
                    </div>
                    <div
                        style={{
                            color: COLORS.textMuted,
                            fontSize: 13,
                        }}
                    >
                        © {year} EV Recharge Station
                    </div>
                </div>

                {/* Contact */}
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    <div style={{ color: COLORS.lemon, fontWeight: 600 }}>Contact</div>
                    <a
                        href="mailto:supportev@charger.com"
                        style={{
                            color: COLORS.textMuted,
                            textDecoration: "none",
                        }}
                        onMouseOver={(e) => (e.currentTarget.style.color = COLORS.lime)}
                        onMouseOut={(e) => (e.currentTarget.style.color = COLORS.textMuted)}
                    >
                        mailto:supportev@charger.com
                    </a>
                    <a
                        href="tel:+911234567890"
                        style={{
                            color: COLORS.textMuted,
                            textDecoration: "none",
                        }}
                        onMouseOver={(e) => (e.currentTarget.style.color = COLORS.aqua)}
                        onMouseOut={(e) => (e.currentTarget.style.color = COLORS.textMuted)}
                    >
                        +91 94561xxx
                    </a>
                </div>
            </div>
        </footer>
    );
}

function FooterLink({ to, children }) {
    const COLORS = {
        text: "#eaffea",
        textMuted: "rgba(234,255,234,0.72)",
        lime: "#89F336",
        aqua: "#4FE0CB",
    };

    const base = {
        textDecoration: "none",
        color: COLORS.textMuted,
        fontSize: 14,
        transition: "color 0.2s ease, transform 0.2s ease",
    };

    return (
        <Link
            to={to}
            style={base}
            onMouseOver={(e) => {
                e.currentTarget.style.color = COLORS.lime;
                e.currentTarget.style.transform = "translateX(2px)";
            }}
            onMouseOut={(e) => {
                e.currentTarget.style.color = COLORS.textMuted;
                e.currentTarget.style.transform = "translateX(0px)";
            }}
        >
            {children}
        </Link>
    );
}
