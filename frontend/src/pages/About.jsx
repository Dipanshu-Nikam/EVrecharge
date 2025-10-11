// src/pages/About.jsx
export default function About() {
    return (
        <div className="page" style={{ maxWidth: 960, margin: "0 auto", padding: 24 }}>
            {/* Header */}
            <header
                className="card glass"
                style={{
                    padding: 20,
                    borderRadius: 16,
                    border: "1px solid var(--oc-border)",
                    background:
                        "linear-gradient(180deg, var(--oc-card), rgba(0,0,0,0))," +
                        "radial-gradient(560px 220px at 6% -20%, rgba(255,252,48,.12), transparent 70%)",
                }}
            >
                <div
                    className="badge-lemon"
                    style={{ display: "inline-flex", alignItems: "center", gap: 8 }}
                >
                    <span
                        aria-hidden="true"
                        style={{
                            width: 8,
                            height: 8,
                            borderRadius: "50%",
                            background: "var(--spring-lemon, #FFFC30)",
                            boxShadow: "0 0 0 4px rgba(255,252,48,.20)",
                        }}
                    />
                    EV Station
                </div>

                <h1 className="title-xl" style={{ margin: "8px 0 4px" }}>
                    About this app
                </h1>
                <p className="muted" style={{ margin: 0 }}>
                    Find nearby EV chargers, plan efficient routes, and manage bookings with ease.
                </p>
            </header>

            {/* Capabilities */}
            <section className="card glass" style={{ padding: 16, marginTop: 16, borderRadius: 14 }}>
                <h2 style={{ marginTop: 0, fontSize: 18, color: "var(--oc-text)" }}>What you can do</h2>
                <ul style={{ margin: "10px 0 0 18px", lineHeight: 1.6 }}>
                    <li>
                        🔍 Find & compare stations — view pricing, charging speed, and connector availability.
                    </li>
                    <li>
                        🗺️ Trip planner — build routes with smart charging stops and reliable ETAs.
                    </li>
                    <li>
                        ⚡ Seamless booking — reserve time slots, pay securely, and track status in real time.
                    </li>
                    <li>
                        ⭐ Favorites — keep frequently used stations handy for quick access.
                    </li>
                </ul>
            </section>

            {/* How it works */}
            <section className="card glass" style={{ padding: 16, marginTop: 16, borderRadius: 14 }}>
                <h2 style={{ marginTop: 0, fontSize: 18, color: "var(--oc-text)" }}>How it works</h2>
                <ol style={{ margin: "10px 0 0 18px", lineHeight: 1.6 }}>
                    <li>
                        Search by city, area, or landmark to locate stations with live availability.
                    </li>
                    <li>
                        Use Trip Planner to add stops and get an efficient route with suggested charging points.
                    </li>
                    <li>
                        Reserve a slot, complete secure payment, and monitor booking progress.
                    </li>
                </ol>
            </section>

            {/* Contact */}
            <section className="card glass" style={{ padding: 16, marginTop: 16, borderRadius: 14 }}>
                <h2 style={{ marginTop: 0, fontSize: 18, color: "var(--oc-text)" }}>Contact</h2>
                <p className="muted small" style={{ marginTop: 4 }}>
                    For support, email{" "}
                    <a
                        href="mailto:supportev@charger.com"
                        style={{ color: "var(--spring-aqua,#4FE0CB)", textDecoration: "none" }}
                    >
                        supportev@charger.com
                    </a>
                    .
                </p>
            </section>
        </div>
    );
}
