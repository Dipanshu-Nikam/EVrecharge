// src/features/stations/pages/Search.jsx
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { searchPlaces } from "../../../services/mapService";
import useDebounce from "../../../utils/useDebounce";
import Spinner from "../../../components/Spinner";
import Toast from "../../../components/Toast";

// Spring Energy palette
const COLORS = {
    text: "var(--oc-text, #eaffea)",
    textMuted: "var(--oc-muted, rgba(234,255,234,.78))",
    card: "var(--oc-card, #132416)",
    border: "var(--oc-border, rgba(0,191,51,.26))",
    input: "var(--oc-input, #162b1b)",
    lime: "var(--spring-lime, #89F336)",
    lemon: "var(--spring-lemon, #FFFC30)",
    aqua: "var(--spring-aqua, #4FE0CB)",
    green: "var(--spring-green, #00BF33)",
    surfaceA: "#162b1b",
    surfaceB: "#132416",
};

export default function Search() {
    const [q, setQ] = useState("");
    const debounced = useDebounce(q, 400);
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState([]);
    const [toast, setToast] = useState({ open: false, type: "info", message: "" });

    const onCloseToast = () => setToast((t) => ({ ...t, open: false }));

    useEffect(() => {
        let ignore = false;

        async function run() {
            const trimmed = debounced?.trim();
            if (!trimmed) {
                setResults([]);
                return;
            }

            try {
                setLoading(true);
                const data = await searchPlaces(trimmed);
                if (ignore) return;

                const list = Array.isArray(data) ? data : data?.results || [];
                setResults(list);
            } catch (err) {
                setToast({
                    open: true,
                    type: "error",
                    message: err.message || "Search failed",
                });
            } finally {
                setLoading(false);
            }
        }

        run();
        return () => (ignore = true);
    }, [debounced]);

    const header = useMemo(() => {
        if (!debounced) return "Search EV recharge locations";
        if (loading) return `Searching “${debounced}”…`;
        return `Results for “${debounced}”`;
    }, [debounced, loading]);

    return (
        <div
            className="page"
            style={{
                maxWidth: 860,
                margin: "0 auto",
                padding: 24,
                color: COLORS.text,
            }}
        >
            <h1
                style={{
                    margin: 0,
                    fontSize: 28,
                    background: `linear-gradient(135deg, ${COLORS.lime} 0%, ${COLORS.aqua} 60%)`,
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                }}
            >
                Search Stations
            </h1>
            <p className="muted" style={{ color: COLORS.textMuted, marginTop: 6 }}>
                Enter a city, area, landmark, or station name.
            </p>

            <div
                style={{
                    display: "flex",
                    gap: 8,
                    marginTop: 12,
                    alignItems: "center",
                }}
            >
                <input
                    type="search"
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder="e.g., Mumbai, MG Road, Central Park"
                    style={{
                        flex: 1,
                        background: COLORS.input,
                        color: COLORS.text,
                        border: `1px solid ${COLORS.border}`,
                        borderRadius: 12,
                        padding: "12px 14px",
                        outline: "none",
                        transition: "border-color 0.2s ease, box-shadow 0.2s ease",
                        boxShadow: "0 6px 16px rgba(0,0,0,0.25) inset",
                    }}
                    onFocus={(e) => {
                        e.currentTarget.style.borderColor = COLORS.aqua;
                        e.currentTarget.style.boxShadow = `0 0 0 3px rgba(79,224,203,0.20)`;
                    }}
                    onBlur={(e) => {
                        e.currentTarget.style.borderColor = COLORS.border;
                        e.currentTarget.style.boxShadow = "0 6px 16px rgba(0,0,0,0.25) inset";
                    }}
                />
                {loading ? (
                    <button
                        disabled
                        style={{
                            background: COLORS.input,
                            border: `1px solid ${COLORS.border}`,
                            borderRadius: 12,
                            padding: "10px 14px",
                            color: COLORS.textMuted,
                            cursor: "not-allowed",
                        }}
                    >
                        <Spinner size={16} />
                    </button>
                ) : (
                    <button
                        onClick={() => setQ("")}
                        className="btn-secondary"
                        style={{
                            background: `linear-gradient(135deg, ${COLORS.lemon} 0%, ${COLORS.lime} 100%)`,
                            border: "1px solid rgba(0,0,0,.15)",
                            borderRadius: 12,
                            padding: "10px 14px",
                            color: "#0b0b0b",
                            cursor: "pointer",
                            boxShadow: "0 10px 22px rgba(0,0,0,0.3)",
                            transition: "transform 0.15s ease, box-shadow 0.15s ease, filter 0.15s ease",
                            fontWeight: 700,
                        }}
                        onMouseOver={(e) => {
                            e.currentTarget.style.transform = "translateY(-2px)";
                            e.currentTarget.style.boxShadow = "0 14px 28px rgba(0,0,0,0.4)";
                            e.currentTarget.style.filter = "brightness(1.03)";
                        }}
                        onMouseOut={(e) => {
                            e.currentTarget.style.transform = "translateY(0px)";
                            e.currentTarget.style.boxShadow = "0 10px 22px rgba(0,0,0,0.3)";
                            e.currentTarget.style.filter = "brightness(1)";
                        }}
                    >
                        Clear
                    </button>
                )}
            </div>

            <h3 style={{ marginTop: 16, color: COLORS.text }}>
                {header}
            </h3>

            <div
                className="card glass"
                style={{
                    marginTop: 8,
                    padding: 0,
                    background: `linear-gradient(180deg, ${COLORS.card}, ${COLORS.surfaceB})`,
                    border: `1px solid ${COLORS.border}`,
                    borderRadius: 14,
                    boxShadow: "0 12px 28px rgba(0,0,0,0.35)",
                    overflow: "hidden",
                }}
            >
                {loading && results.length === 0 ? (
                    <div
                        style={{
                            padding: 16,
                            display: "flex",
                            gap: 10,
                            alignItems: "center",
                            color: COLORS.textMuted,
                        }}
                    >
                        <Spinner /> <span>Processing…</span>
                    </div>
                ) : results.length === 0 ? (
                    <div style={{ padding: 16, color: COLORS.textMuted }}>No results yet.</div>
                ) : (
                    <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
                        {results.map((r, i) => {
                            const id = r.id || r.place_id || r._id || String(i);
                            const name = r.name || r.title || r.displayName || "Unnamed place";
                            const address =
                                r.address ||
                                r.formatted_address ||
                                r.vicinity ||
                                r.subtitle ||
                                r.displayAddress ||
                                "";
                            const lat = r.lat ?? r.latitude ?? r.location?.lat;
                            const lng = r.lng ?? r.longitude ?? r.location?.lng;

                            return (
                                <li
                                    key={id}
                                    style={{
                                        padding: "12px 16px",
                                        borderTop: i === 0 ? "none" : `1px solid ${COLORS.border}`,
                                        display: "grid",
                                        gridTemplateColumns: "1fr auto",
                                        gap: 12,
                                        alignItems: "center",
                                        background: i % 2 === 0 ? COLORS.surfaceA : COLORS.surfaceB,
                                        transition: "background 0.2s ease",
                                    }}
                                >
                                    <div>
                                        <div style={{ fontWeight: 700, color: COLORS.text }}>{name}</div>
                                        {address && (
                                            <div className="muted small" style={{ color: COLORS.textMuted }}>
                                                {address}
                                            </div>
                                        )}
                                        {lat != null && lng != null && (
                                            <div className="muted small" style={{ color: COLORS.textMuted }}>
                                                {lat.toFixed ? lat.toFixed(5) : lat},{" "}
                                                {lng.toFixed ? lng.toFixed(5) : lng}
                                            </div>
                                        )}
                                    </div>

                                    {id && (
                                        <Link
                                            to={`/stations/${encodeURIComponent(id)}`}
                                            state={{ name, address, lat, lng }}
                                            className="btn-secondary"
                                            style={{
                                                textDecoration: "none",
                                                padding: "8px 12px",
                                                borderRadius: 10,
                                                color: "#0b0b0b",
                                                background: `linear-gradient(135deg, ${COLORS.aqua} 0%, ${COLORS.lemon} 100%)`,
                                                border: "1px solid rgba(0,0,0,.15)",
                                                boxShadow: "0 10px 22px rgba(0,0,0,0.35)",
                                                transition:
                                                    "transform 0.15s ease, box-shadow 0.15s ease, filter 0.15s ease",
                                                whiteSpace: "nowrap",
                                                fontWeight: 700,
                                            }}
                                            onMouseOver={(e) => {
                                                e.currentTarget.style.transform = "translateY(-2px)";
                                                e.currentTarget.style.boxShadow =
                                                    "0 14px 28px rgba(0,0,0,0.45)";
                                                e.currentTarget.style.filter = "brightness(1.03)";
                                            }}
                                            onMouseOut={(e) => {
                                                e.currentTarget.style.transform = "translateY(0px)";
                                                e.currentTarget.style.boxShadow =
                                                    "0 10px 22px rgba(0,0,0,0.35)";
                                                e.currentTarget.style.filter = "brightness(1)";
                                            }}
                                        >
                                            Next
                                        </Link>
                                    )}
                                </li>
                            );
                        })}
                    </ul>
                )}
            </div>

            {toast.open && (
                <Toast type={toast.type} onClose={onCloseToast}>
                    {toast.message}
                </Toast>
            )}
        </div>
    );
}
