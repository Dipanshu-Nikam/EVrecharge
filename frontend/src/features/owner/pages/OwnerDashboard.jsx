import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../../context/AuthProvider";
import http from "../../../utils/http";
import Spinner from "../../../components/Spinner";
import Toast from "../../../components/Toast";

export default function OwnerDashboard() {
    const { user } = useAuth();
    const [owner, setOwner] = useState(user);
    const [stations, setStations] = useState([]);
    const [finance, setFinance] = useState(null);
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState({ open: false, type: "info", message: "" });

    const onCloseToast = () => setToast((t) => ({ ...t, open: false }));

    useEffect(() => {
        let ignore = false;

        async function load() {
            try {
                setLoading(true);

                const [meRes, stRes, finRes] = await Promise.allSettled([
                    http.get("/owners/me"),
                    http.get("/stations/mine"),
                    http.get("/finance/summary"),
                ]);

                if (ignore) return;

                if (meRes.status === "fulfilled") {
                    setOwner(meRes.value.data.owner || meRes.value.data);
                }
                if (stRes.status === "fulfilled") {
                    const list = Array.isArray(stRes.value.data.stations)
                        ? stRes.value.data.stations
                        : stRes.value.data || [];
                    setStations(list);
                }
                if (finRes.status === "fulfilled") {
                    setFinance(finRes.value.data);
                }
            } catch (err) {
                setToast({
                    open: true,
                    type: "error",
                    message: err.message || "Failed to load dashboard",
                });
            } finally {
                setLoading(false);
            }
        }

        load();
        return () => {
            ignore = true;
        };
    }, []);

    const f = finance || {};
    const today = f.today || f.daily || {};
    const month = f.month || f.monthly || {};
    const total = f.total || {};

    const text = "var(--oc-text)";
    const muted = "var(--oc-muted)";
    const card = "var(--oc-card)";
    const border = "var(--oc-border)";

    return (
        <div className="page" style={{ maxWidth: 1100, margin: "0 auto", padding: 24 }}>
            <header
                className="card glass"
                style={{
                    padding: 18,
                    borderRadius: 16,
                    border: `1px solid ${border}`,
                    background:
                        `linear-gradient(180deg, ${card}, #0f1a12),` +
                        `radial-gradient(560px 220px at 6% -20%, rgba(255,252,48,.12), transparent 70%)`,
                    color: text,
                }}
            >
                <div
                    style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 8,
                        padding: "6px 10px",
                        borderRadius: 999,
                        border: `1px solid ${border}`,
                        background: "rgba(79,224,203,.10)",
                        color: muted,
                        fontSize: 12,
                        marginBottom: 6,
                    }}
                >
                    <span
                        aria-hidden="true"
                        style={{
                            width: 8,
                            height: 8,
                            borderRadius: "50%",
                            background: "var(--spring-lime,#89F336)",
                            boxShadow: "0 0 0 4px rgba(137,243,54,.18)",
                        }}
                    />
                    Owner portal
                </div>

                <h1 className="title-xl" style={{ margin: "2px 0 0 0", color: text }}>
                    Owner Dashboard
                </h1>
                <p className="muted small" style={{ color: muted, marginTop: 4 }}>
                    Welcome{owner?.name ? `, ${owner.name}` : ""}. Manage stations, bookings, and payouts.
                </p>
            </header>

            {loading ? (
                <div
                    className="card glass"
                    style={{
                        display: "flex",
                        gap: 10,
                        alignItems: "center",
                        marginTop: 12,
                        padding: 16,
                        border: `1px solid ${border}`,
                        background: `linear-gradient(180deg, ${card}, #0f1a12)`,
                        color: text,
                    }}
                >
                    <Spinner /> <span>Loading dashboard…</span>
                </div>
            ) : (
                <>
                    {/* Stats */}
                    <section
                        className="grid"
                        style={{
                            display: "grid",
                            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                            gap: 12,
                            marginTop: 12,
                        }}
                    >
                        <StatCard
                            accent="var(--spring-aqua,#4FE0CB)"
                            label="Today's Revenue"
                            value={fmtMoney(today.amount || 0)}
                            sub={today.count ? `${today.count} bookings` : ""}
                        />
                        <StatCard
                            accent="var(--spring-lime,#89F336)"
                            label="This Month"
                            value={fmtMoney(month.amount || 0)}
                            sub={month.count ? `${month.count} bookings` : ""}
                        />
                        <StatCard
                            accent="var(--spring-lemon,#FFFC30)"
                            label="All‑time Revenue"
                            value={fmtMoney(total.amount || 0)}
                            sub={total.count ? `${total.count} bookings` : ""}
                        />
                        <StatCard accent="var(--spring-green,#00BF33)" label="Stations" value={stations.length} sub="active" />
                    </section>

                    {/* Stations list (Add Station button removed) */}
                    <section
                        className="card glass"
                        style={{
                            padding: 16,
                            marginTop: 16,
                            borderRadius: 14,
                            border: `1px solid ${border}`,
                            background:
                                `linear-gradient(180deg, ${card}, #0f1a12),` +
                                `radial-gradient(520px 200px at 8% -20%, rgba(79,224,203,.08), transparent 70%)`,
                            color: text,
                        }}
                    >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <h2 style={{ margin: 0, fontSize: 18, color: text }}>Your Stations</h2>
                            {/* Add Station button intentionally removed */}
                        </div>

                        {stations.length === 0 ? (
                            <div className="muted" style={{ marginTop: 12, color: muted }}>
                                No stations yet.
                            </div>
                        ) : (
                            <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
                                {stations.map((s, i) => {
                                    const id = s.id || s._id || `s${i}`;
                                    const name = s.name || s.title || s.stationName || "Station";
                                    const addr = s.address || s.formattedAddress || "";
                                    const status = s.status || (s.active ? "active" : "inactive");

                                    return (
                                        <li
                                            key={id}
                                            style={{
                                                padding: "12px 0",
                                                borderTop: i === 0 ? "none" : `1px solid ${border}`,
                                                display: "grid",
                                                gridTemplateColumns: "1fr auto",
                                                gap: 12,
                                                alignItems: "center",
                                            }}
                                        >
                                            <div>
                                                <div style={{ fontWeight: 700, color: text }}>{name}</div>
                                                {addr && <div className="muted small" style={{ color: muted }}>{addr}</div>}
                                                <div className="muted small" style={{ color: muted }}>Status: {status}</div>
                                            </div>
                                            <div style={{ display: "flex", gap: 8 }}>
                                                <Link
                                                    to={`/stations/${encodeURIComponent(id)}`}
                                                    className="btn-secondary"
                                                    style={{
                                                        textDecoration: "none",
                                                        padding: "8px 12px",
                                                        borderRadius: 10,
                                                        color: text,
                                                        border: `1px solid ${border}`,
                                                        background: "linear-gradient(180deg, var(--oc-card), #0f1a12)",
                                                    }}
                                                >
                                                    View
                                                </Link>
                                                <Link
                                                    to={`/owner/stations/new`}
                                                    state={{ editId: id }}
                                                    className="btn-secondary"
                                                    style={{
                                                        textDecoration: "none",
                                                        padding: "8px 12px",
                                                        borderRadius: 10,
                                                        color: text,
                                                        border: `1px solid ${border}`,
                                                        background: "linear-gradient(180deg, var(--oc-card), #0f1a12)",
                                                    }}
                                                >
                                                    Edit
                                                </Link>
                                            </div>
                                        </li>
                                    );
                                })}
                            </ul>
                        )}
                    </section>

                    <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                        <Link
                            to="/owner/finance"
                            className="btn-secondary"
                            style={{
                                textDecoration: "none",
                                padding: "10px 14px",
                                borderRadius: 10,
                                color: text,
                                border: `1px solid ${border}`,
                                background: "linear-gradient(180deg, var(--oc-card), #0f1a12)",
                            }}
                        >
                            View Finance
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

function StatCard({ label, value, sub, accent = "var(--spring-aqua,#4FE0CB)" }) {
    const border = "var(--oc-border)";
    const card = "var(--oc-card)";
    const text = "var(--oc-text)";
    return (
        <div
            className="card glass"
            style={{
                padding: 16,
                borderRadius: 14,
                border: `1px solid ${border}`,
                background:
                    `linear-gradient(180deg, ${card}, #0f1a12),` +
                    `radial-gradient(420px 160px at 0% -20%, ${accent}22, transparent 70%)`,
                color: text,
            }}
        >
            <div className="muted small" style={{ marginBottom: 4 }}>{label}</div>
            <div style={{ fontSize: 22, fontWeight: 800 }}>{value}</div>
            {sub && <div className="muted small" style={{ marginTop: 4 }}>{sub}</div>}
        </div>
    );
}

function fmtMoney(n) {
    try {
        return new Intl.NumberFormat(undefined, {
            style: "currency",
            currency: "INR",
            maximumFractionDigits: 0,
        }).format(n);
    } catch {
        return `₹ ${Number(n || 0).toLocaleString()}`;
    }
}
