// src/pages/Home.jsx
import { Link, useSearchParams } from "react-router-dom";
import { useEffect, useMemo, useRef, useState } from "react";
import "../styles/immersive.css";

export default function Home() {
    const [params, setParams] = useSearchParams();

    // URL-synced query
    const qFromUrl = params.get("q") || "";
    const [q, setQ] = useState(qFromUrl);

    // keep q in sync with external URL changes
    useEffect(() => {
        if (qFromUrl !== q) setQ(qFromUrl);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [qFromUrl]);

    const applySearch = useMemo(
        () => () => {
            const next = new URLSearchParams(params);
            const val = q.trim();
            if (val) next.set("q", val);
            else next.delete("q");
            setParams(next, { replace: true });
        },
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [q, params]
    );

    // debounce typing before updating URL
    const debounceRef = useRef(null);
    useEffect(() => {
        clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => applySearch(), 400);
        return () => clearTimeout(debounceRef.current);
    }, [q, applySearch]);

    const textColor = "var(--oc-text)";

    return (
        <div className="page" style={{ color: textColor }}>
            {/* FULL-BLEED HERO */}
            <section
                aria-label="Hero"
                style={{
                    position: "relative",
                    padding: "64px 16px 40px",
                    overflow: "hidden",
                }}
            >
                {/* Dynamic background */}
                <div
                    aria-hidden="true"
                    style={{
                        position: "absolute",
                        inset: 0,
                        background:
                            "radial-gradient(900px 400px at 10% -10%, rgba(79,224,203,.18), transparent 60%)," +
                            "radial-gradient(900px 420px at 110% 10%, rgba(255,252,48,.18), transparent 60%)," +
                            "linear-gradient(180deg, rgba(0,0,0,.2), rgba(0,0,0,0))",
                    }}
                />
                <div
                    style={{
                        position: "absolute",
                        inset: 0,
                        background:
                            "linear-gradient(180deg, rgba(0,0,0,.25) 0%, rgba(0,0,0,0) 40%)",
                        pointerEvents: "none",
                    }}
                />

                <div style={{ maxWidth: 1100, margin: "0 auto", position: "relative" }}>
                    <div style={{ textAlign: "center" }}>
                        <div
                            style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 8,
                                fontSize: 12,
                                padding: "6px 10px",
                                borderRadius: 999,
                                border: "1px solid var(--oc-border)",
                                background: "rgba(255,255,255,.06)",
                                color: "var(--oc-muted, #b7c5d8)",
                            }}
                        >
                            EV Station · Live availability · Smart routing
                        </div>

                        <h1
                            className="title-xl"
                            style={{
                                margin: "12px auto 8px",
                                lineHeight: 1.05,
                                letterSpacing: "-0.02em",
                                maxWidth: 800,
                            }}
                        >
                            Find, book, and charge — in moments.
                        </h1>

                        <p className="muted lead" style={{ margin: "0 auto 18px", maxWidth: 740 }}>
                            Search nearby chargers, plan multi-stop trips, and manage bookings seamlessly.
                        </p>

                        {/* Centered search control */}
                        <div
                            className="card glass"
                            style={{
                                display: "grid",
                                gridTemplateColumns: "1fr auto",
                                gap: 8,
                                padding: 10,
                                borderRadius: 14,
                                border: "1px solid var(--oc-border)",
                                background:
                                    "linear-gradient(180deg, var(--oc-card), rgba(0,0,0,0))",
                                maxWidth: 720,
                                margin: "0 auto",
                            }}
                            aria-label="Quick search"
                        >
                            <input
                                type="text"
                                value={q}
                                onChange={(e) => setQ(e.target.value)}
                                placeholder="Enter city, neighborhood, or landmark"
                                style={{
                                    padding: "12px 14px",
                                    borderRadius: 10,
                                    border: "1px solid var(--oc-border)",
                                    background: "var(--oc-card)",
                                    color: textColor,
                                    outline: "none",
                                }}
                            />
                            <Link
                                to={`/search${q ? `?q=${encodeURIComponent(q.trim())}` : ""}`}
                                className="btn-primary btn-raise"
                                aria-label="Search stations"
                                style={{
                                    padding: "12px 16px",
                                    borderRadius: 10,
                                    color: "#0b0b0b",
                                    textDecoration: "none",
                                    border: "1px solid rgba(0,191,51,.45)",
                                    background:
                                        "linear-gradient(135deg, var(--spring-lime,#89F336), var(--spring-aqua,#4FE0CB))",
                                }}
                            >
                                Search
                            </Link>
                        </div>

                        {/* Primary actions */}
                        <div style={{ display: "flex", gap: 12, justifyContent: "center", marginTop: 14 }}>
                            <Link
                                to="/planner"
                                className="btn-secondary btn-ghost"
                                aria-label="Open trip planner"
                                style={{ borderColor: "rgba(0,191,51,.45)" }}
                            >
                                Plan a trip
                            </Link>
                            <Link
                                to="/bookings"
                                className="btn-secondary btn-ghost"
                                aria-label="Open bookings"
                                style={{ borderColor: "rgba(0,191,51,.45)" }}
                            >
                                My bookings
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* MOSAIC GRID */}
            <section
                aria-label="Highlights"
                style={{
                    maxWidth: 1100,
                    margin: "0 auto",
                    padding: "0 16px 16px",
                }}
            >
                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns: "1.2fr 0.8fr",
                        gap: 14,
                    }}
                >
                    {/* Big left card */}
                    <Tile
                        title="Nearby chargers"
                        text="Quickly scan areas and filter by connector type."
                        accent="var(--spring-aqua,#4FE0CB)"
                    >
                        <Link to="/search" className="btn-secondary btn-ghost" aria-label="Locate chargers">
                            Explore map
                        </Link>
                    </Tile>

                    {/* Tall right stack */}
                    <div style={{ display: "grid", gridTemplateRows: "1fr 1fr", gap: 14 }}>
                        <Tile
                            title="Trip planner"
                            text="Smart routes with suggested stops along the way."
                            accent="var(--spring-lime,#89F336)"
                        >
                            <Link to="/planner" className="btn-secondary btn-ghost" aria-label="Open trip planner">
                                Start planning
                            </Link>
                        </Tile>
                        <Tile
                            title="Owner tools"
                            text="List stations and track performance."
                            accent="var(--spring-lemon,#FFFC30)"
                        >
                            <Link to="/owner/dashboard" className="btn-secondary btn-ghost" aria-label="Owner portal">
                                Owner portal
                            </Link>
                        </Tile>
                    </div>
                </div>
            </section>

            {/* INFO MARQUEE */}
            <section
                aria-label="Info band"
                style={{ marginTop: 8, borderTop: "1px solid var(--oc-border)" }}
            >
                <div
                    style={{
                        maxWidth: 1100,
                        margin: "0 auto",
                        padding: "12px 16px 18px",
                    }}
                >
                    <div
                        className="card glass"
                        style={{
                            border: "1px solid var(--oc-border)",
                            borderRadius: 14,
                            overflow: "hidden",
                        }}
                    >
                        <Marquee />
                    </div>
                </div>
            </section>
        </div>
    );
}

/* Components */

function Tile({ title, text, children, accent = "var(--spring-aqua,#4FE0CB)" }) {
    return (
        <div
            className="card glass"
            style={{
                padding: 18,
                borderRadius: 14,
                border: "1px solid var(--oc-border)",
                background: "var(--oc-card)",
                position: "relative",
                overflow: "hidden",
                minHeight: 150,
            }}
        >
            <div
                aria-hidden="true"
                style={{
                    position: "absolute",
                    inset: 0,
                    background: `radial-gradient(380px 160px at 0% -20%, ${accent}22, transparent 70%)`,
                    pointerEvents: "none",
                }}
            />
            <div style={{ fontWeight: 800, color: "var(--oc-text)" }}>{title}</div>
            <div className="muted small" style={{ marginTop: 6 }}>{text}</div>
            <div style={{ marginTop: 12 }}>{children}</div>
        </div>
    );
}

function Marquee() {
    const itemStyle = {
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        padding: "10px 14px",
        marginRight: 12,
        borderRadius: 999,
        border: "1px solid var(--oc-border)",
        background: "linear-gradient(180deg, rgba(255,255,255,.06), rgba(0,0,0,0))",
        whiteSpace: "nowrap",
    };
    return (
        <div
            style={{
                overflow: "hidden",
                display: "flex",
                alignItems: "center",
                padding: 8,
                position: "relative",
            }}
        >
            <div
                style={{
                    display: "inline-block",
                    whiteSpace: "nowrap",
                    animation: "scroll-x 28s linear infinite",
                }}
            >
                <span style={{ ...itemStyle }}>
                    <Dot color="var(--spring-aqua,#4FE0CB)" /> Live availability
                </span>
                <span style={{ ...itemStyle }}>
                    <Dot color="var(--spring-lime,#89F336)" /> Secure payments
                </span>
                <span style={{ ...itemStyle }}>
                    <Dot color="var(--spring-lemon,#FFFC30)" /> Real-time navigation
                </span>
                <span style={{ ...itemStyle }}>
                    <Dot color="var(--spring-aqua,#4FE0CB)" /> Owner analytics
                </span>
                <span style={{ ...itemStyle }}>
                    <Dot color="var(--spring-lime,#89F336)" /> Favorites & history
                </span>
            </div>

            {/* keyframes inline to avoid extra files */}
            <style>{`
        @keyframes scroll-x {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
        </div>
    );
}

function Dot({ color = "var(--spring-aqua,#4FE0CB)" }) {
    return (
        <span
            aria-hidden="true"
            style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: color,
                boxShadow: `0 0 0 4px ${color}33`,
                display: "inline-block",
            }}
        />
    );
}
