// src/features/stations/pages/BunkDetails.jsx
import { useEffect, useState } from "react";
import { useLocation, useParams, Link } from "react-router-dom";
import http from "../../../utils/http";
import Spinner from "../../../components/Spinner";
import Toast from "../../../components/Toast";

/**
 * Station details page.
 * - If navigated from Search with router `state`, it uses that immediately.
 * - Otherwise it fetches from backend: GET /api/stations/:id
 */

// Green Energy palette
const COLORS = {
    forest: "#0f1a12",
    pine: "#142417",
    moss: "#18341f",
    leaf: "#1c3d25",
    border: "rgba(137,243,54,.28)",
    text: "#eaffea",
    textMuted: "rgba(234,255,234,.78)",
    lime: "#89F336",
    lemon: "#FFFC30",
    aqua: "#4FE0CB",
    shadow: "rgba(0,0,0,0.45)",
};

export default function BunkDetails() {
    const { id } = useParams();
    const location = useLocation();
    const fromState = location.state || {};
    const [loading, setLoading] = useState(false);
    const [toast, setToast] = useState({ open: false, type: "info", message: "" });
    const onCloseToast = () => setToast((t) => ({ ...t, open: false }));

    const [station, setStation] = useState(
        fromState?.name || fromState?.address || fromState?.lat
            ? {
                id,
                name: fromState.name,
                address: fromState.address,
                lat: fromState.lat,
                lng: fromState.lng,
                pricePerKwh: fromState.pricePerKwh,
            }
            : null
    );

    useEffect(() => {
        let ignore = false;
        async function load() {
            if (station) return; // already have from state
            try {
                setLoading(true);
                const res = await http.get(`/stations/${encodeURIComponent(id)}`);
                if (ignore) return;
                const data = res.data || {};
                const s = {
                    id: data.id || data._id || id,
                    name:
                        data.name ||
                        data.title ||
                        data.stationName ||
                        data.displayName ||
                        "Station",
                    address:
                        data.address ||
                        data.formattedAddress ||
                        data.location?.address ||
                        data.vicinity ||
                        "",
                    lat: data.lat || data.latitude || data.location?.lat,
                    lng: data.lng || data.longitude || data.location?.lng,
                    pricePerKwh: data.pricePerKwh || data.price || data.tariff,
                    sockets: data.sockets || data.connectors || data.ports,
                    openHours: data.openHours || data.hours || data.timings,
                    phone: data.phone || data.contact || data.phoneNumber,
                    amenities: data.amenities || [],
                    images: data.images || data.photos || [],
                    rating: data.rating,
                    available: data.available,
                };
                setStation(s);
            } catch (err) {
                setToast({
                    open: true,
                    type: "error",
                    message:
                        err?.response?.data?.message || err?.message || "Failed to load station",
                });
            } finally {
                setLoading(false);
            }
        }
        load();
        return () => {
            ignore = true;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    const s = station || {};

    return (
        <div
            className="page"
            style={{
                maxWidth: 960,
                margin: "0 auto",
                padding: 24,
                background: "transparent",
                color: COLORS.text,
            }}
        >
            {/* Header */}
            <header
                className="card glass"
                style={{
                    padding: 18,
                    borderRadius: 16,
                    border: `1px solid ${COLORS.border}`,
                    background:
                        `linear-gradient(180deg, ${COLORS.leaf}, ${COLORS.forest}),` +
                        `radial-gradient(560px 220px at 6% -20%, rgba(79,224,203,.10), transparent 70%)`,
                    color: COLORS.text,
                }}
            >
                <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                    <h1
                        style={{
                            margin: 0,
                            background: `linear-gradient(135deg, ${COLORS.lime} 0%, ${COLORS.aqua} 65%)`,
                            WebkitBackgroundClip: "text",
                            WebkitTextFillColor: "transparent",
                        }}
                    >
                        {s.name || "Station"}
                    </h1>
                    {typeof s.rating === "number" && (
                        <span className="muted small" style={{ color: COLORS.lemon }}>
                            ★ {s.rating.toFixed(1)}
                        </span>
                    )}
                </div>
                {s.address && (
                    <div className="small" style={{ color: COLORS.textMuted, marginTop: 6 }}>
                        {s.address}
                    </div>
                )}
            </header>

            {loading && !station ? (
                <div
                    style={{
                        display: "flex",
                        gap: 10,
                        alignItems: "center",
                        marginTop: 12,
                        color: COLORS.textMuted,
                    }}
                >
                    <Spinner /> <span>Loading station…</span>
                </div>
            ) : (
                <>
                    {/* Core details */}
                    <section
                        className="card"
                        style={{
                            marginTop: 12,
                            padding: 16,
                            background: COLORS.pine,
                            border: `1px solid ${COLORS.border}`,
                            borderRadius: 14,
                            boxShadow: "0 12px 28px rgba(0,0,0,0.35)",
                        }}
                    >
                        {s.lat && s.lng && (
                            <div style={{ marginBottom: 10 }}>
                                <div className="muted" style={{ color: COLORS.textMuted }}>Location</div>
                                <div className="small" style={{ color: COLORS.textMuted }}>
                                    {s.lat}, {s.lng} ·{" "}
                                    <a
                                        href={`https://www.google.com/maps?q=${s.lat},${s.lng}`}
                                        target="_blank"
                                        rel="noreferrer"
                                        style={{ color: COLORS.aqua, textDecoration: "none" }}
                                        onMouseOver={(e) => (e.currentTarget.style.color = COLORS.lemon)}
                                        onMouseOut={(e) => (e.currentTarget.style.color = COLORS.aqua)}
                                    >
                                        Open in Maps
                                    </a>
                                </div>
                            </div>
                        )}

                        {s.pricePerKwh && (
                            <div style={{ marginBottom: 10 }}>
                                <div className="muted" style={{ color: COLORS.textMuted }}>Tariff</div>
                                <div style={{ color: COLORS.text }}>₹ {s.pricePerKwh} / kWh</div>
                            </div>
                        )}

                        {Array.isArray(s.sockets) && s.sockets.length > 0 && (
                            <div style={{ marginBottom: 10 }}>
                                <div className="muted" style={{ color: COLORS.textMuted }}>Connectors</div>
                                <ul style={{ margin: "6px 0 0 16px", color: COLORS.text }}>
                                    {s.sockets.map((c, i) => (
                                        <li key={i}>
                                            {typeof c === "string" ? c : c?.type || c?.name || `Connector ${i + 1}`}
                                            {c?.power && ` — ${c.power} kW`}
                                            {c?.status && ` (${c.status})`}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {s.openHours && (
                            <div style={{ marginBottom: 10 }}>
                                <div className="muted" style={{ color: COLORS.textMuted }}>Hours</div>
                                <div style={{ color: COLORS.text }}>
                                    {typeof s.openHours === "string" ? s.openHours : "Open hours available"}
                                </div>
                            </div>
                        )}

                        {s.phone && (
                            <div style={{ marginBottom: 10 }}>
                                <div className="muted" style={{ color: COLORS.textMuted }}>Contact</div>
                                <div style={{ color: COLORS.text }}>{s.phone}</div>
                            </div>
                        )}

                        {Array.isArray(s.amenities) && s.amenities.length > 0 && (
                            <div style={{ marginBottom: 10 }}>
                                <div className="muted" style={{ color: COLORS.textMuted }}>Amenities</div>
                                <div className="small" style={{ color: COLORS.text }}>
                                    {s.amenities.join(" • ")}
                                </div>
                            </div>
                        )}
                    </section>

                    {/* Actions */}
                    <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
                        <Link
                            to={`/booking/${encodeURIComponent(s.id || id)}`}
                            className="btn-primary"
                            state={{
                                name: s.name,
                                address: s.address,
                                lat: s.lat,
                                lng: s.lng,
                                pricePerKwh: s.pricePerKwh,
                            }}
                            style={primaryBtn()}
                            onMouseOver={(e) => {
                                e.currentTarget.style.transform = "translateY(-2px)";
                                e.currentTarget.style.boxShadow = "0 16px 32px rgba(137,243,54,.25)";
                                e.currentTarget.style.filter = "brightness(1.05)";
                            }}
                            onMouseOut={(e) => {
                                e.currentTarget.style.transform = "translateY(0px)";
                                e.currentTarget.style.boxShadow = "0 12px 26px rgba(0,0,0,.35)";
                                e.currentTarget.style.filter = "brightness(1)";
                            }}
                        >
                            Book a Slot
                        </Link>

                        <Link
                            to={`/stations/${encodeURIComponent(s.id || id)}/book`}
                            className="btn-secondary"
                            state={{
                                station: {
                                    name: s.name,
                                    address: s.address,
                                    lat: s.lat,
                                    lng: s.lng,
                                    pricePerKwh: s.pricePerKwh,
                                },
                            }}
                            style={secondaryBtn()}
                            onMouseOver={(e) => {
                                e.currentTarget.style.transform = "translateY(-2px)";
                                e.currentTarget.style.boxShadow = "0 14px 28px rgba(0,0,0,0.45)";
                                e.currentTarget.style.filter = "brightness(1.05)";
                            }}
                            onMouseOut={(e) => {
                                e.currentTarget.style.transform = "translateY(0px)";
                                e.currentTarget.style.boxShadow = "0 10px 22px rgba(0,0,0,0.35)";
                                e.currentTarget.style.filter = "brightness(1)";
                            }}
                        >
                            Quick book
                        </Link>

                        <Link
                            to="/search"
                            className="btn-tertiary"
                            style={tertiaryBtn()}
                            onMouseOver={(e) => {
                                e.currentTarget.style.transform = "translateY(-2px)";
                                e.currentTarget.style.boxShadow = "0 10px 22px rgba(0,0,0,0.35)";
                            }}
                            onMouseOut={(e) => {
                                e.currentTarget.style.transform = "translateY(0px)";
                                e.currentTarget.style.boxShadow = "none";
                            }}
                        >
                            Back to Search
                        </Link>
                    </div>
                </>
            )}

            {toast.open && (
                <Toast type={toast.type} onClose={onCloseToast}>
                    {toast.message}
                </Toast>
            )}
        </div>
    );
}

/* Buttons */
function primaryBtn() {
    return {
        textDecoration: "none",
        padding: "10px 14px",
        borderRadius: 12,
        color: "#0b0b0b",
        background: `linear-gradient(135deg, ${COLORS.lemon} 0%, ${COLORS.lime} 85%)`,
        border: "1px solid rgba(0,0,0,.15)",
        boxShadow: "0 12px 26px rgba(0,0,0,0.35)",
        transition: "transform 0.15s ease, box-shadow 0.15s ease, filter 0.15s ease",
        whiteSpace: "nowrap",
        fontWeight: 800,
    };
}
function secondaryBtn() {
    return {
        textDecoration: "none",
        padding: "10px 14px",
        borderRadius: 12,
        color: COLORS.text,
        background: `linear-gradient(135deg, ${COLORS.aqua} 0%, ${COLORS.lime} 90%)`,
        border: "1px solid rgba(0,0,0,.15)",
        boxShadow: "0 10px 22px rgba(0,0,0,0.35)",
        transition: "transform 0.15s ease, box-shadow 0.15s ease, filter 0.15s ease",
        whiteSpace: "nowrap",
        fontWeight: 700,
    };
}
function tertiaryBtn() {
    return {
        textDecoration: "none",
        padding: "10px 14px",
        borderRadius: 12,
        color: COLORS.text,
        background: COLORS.moss,
        border: `1px solid ${COLORS.border}`,
        transition: "transform 0.15s ease, box-shadow 0.15s ease",
        whiteSpace: "nowrap",
        fontWeight: 700,
    };
}
