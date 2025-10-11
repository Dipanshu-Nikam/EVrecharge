// src/features/bookings/pages/Booking.jsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useLocation, Link } from "react-router-dom";
import http from "../../../utils/http";
import Spinner from "../../../components/Spinner";
import Toast from "../../../components/Toast";
import { createBooking } from "../../../services/bookingService";
import { startCheckout } from "../../../services/paymentService";

// Green Energy + Ocean accents
const COLORS = {
    // Greens
    forest: "#0f1a12",
    pine: "#132416",
    moss: "#162b1b",
    leaf: "#1b3522",
    border: "rgba(137,243,54,.26)",
    text: "#eaffea",
    textMuted: "rgba(234,255,234,.78)",
    // Accents
    lime: "#89F336",
    lemon: "#FFFC30",
    aqua: "#4FE0CB",
    // Shadows
    shadow: "rgba(0,0,0,0.45)",
};

export default function Booking() {
    const { id } = useParams();
    const nav = useNavigate();
    const location = useLocation();
    const fromState = location.state || {};

    const [station, setStation] = useState(
        fromState?.name
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
    const [loading, setLoading] = useState(!station);
    const [submitting, setSubmitting] = useState(false);
    const [toast, setToast] = useState({ open: false, type: "info", message: "" });
    const onCloseToast = () => setToast((t) => ({ ...t, open: false }));

    // form state
    const [vehicleType, setVehicleType] = useState("car");
    const [durationMins, setDurationMins] = useState(30);
    const [startLocal, setStartLocal] = useState(() => {
        const d = new Date(Date.now() + 15 * 60 * 1000);
        return toLocalInputValue(d);
    });
    const [notes, setNotes] = useState("");

    // Load station if needed
    useEffect(() => {
        let ignore = false;
        async function load() {
            if (station) return;
            try {
                setLoading(true);
                const res = await http.get(`/stations/${encodeURIComponent(id)}`);
                if (ignore) return;
                const data = res.data || {};
                setStation({
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
                        "",
                    lat: data.lat || data.latitude || data.location?.lat,
                    lng: data.lng || data.longitude || data.location?.lng,
                    pricePerKwh: data.pricePerKwh || data.price || data.tariff,
                });
            } catch (err) {
                setToast({
                    open: true,
                    type: "error",
                    message: err?.response?.data?.message || err?.message || "Failed to load station",
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

    const startISO = useMemo(() => {
        try {
            return localInputToISO(startLocal);
        } catch {
            return null;
        }
    }, [startLocal]);

    async function handleSubmit(e) {
        e.preventDefault();
        if (!startISO) {
            setToast({ open: true, type: "error", message: "Choose a valid start time" });
            return;
        }
        const dur = Number(durationMins);
        if (!dur || dur < 15) {
            setToast({
                open: true,
                type: "error",
                message: "Duration must be at least 15 minutes",
            });
            return;
        }

        try {
            setSubmitting(true);
            const payload = {
                stationId: station?.id || id,
                startTime: startISO,
                durationMins: dur,
                vehicleType,
                notes: notes?.trim() || undefined,
            };

            const result = await createBooking(payload);

            if (result?.paymentUrl) {
                window.location.assign(result.paymentUrl);
                return;
            }

            if (result?.paymentRequired && (result?.id || result?._id)) {
                const pay = await startCheckout(result.id || result._id);
                if (pay?.paymentUrl) {
                    window.location.assign(pay.paymentUrl);
                    return;
                }
            }

            nav("/pay/success", { replace: true, state: { booking: result } });
        } catch (err) {
            setToast({
                open: true,
                type: "error",
                message:
                    err?.response?.data?.message ||
                    err?.response?.data?.error ||
                    err?.normalizedMessage ||
                    err?.message ||
                    "Booking failed",
            });
        } finally {
            setSubmitting(false);
        }
    }

    const s = station || {};

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
            {/* Header */}
            <header
                className="card glass"
                style={{
                    padding: 18,
                    borderRadius: 16,
                    border: `1px solid ${COLORS.border}`,
                    background:
                        `linear-gradient(180deg, ${COLORS.pine}, ${COLORS.forest}),` +
                        `radial-gradient(560px 220px at 6% -20%, rgba(79,224,203,.10), transparent 70%)`,
                    color: COLORS.text,
                }}
            >
                <h1
                    style={{
                        margin: 0,
                        background: `linear-gradient(135deg, ${COLORS.lime} 0%, ${COLORS.aqua} 65%)`,
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                    }}
                >
                    Book a Charging Slot
                </h1>
                <p className="muted small" style={{ color: COLORS.textMuted, marginTop: 6 }}>
                    Pick a time and duration to reserve this station in advance.
                </p>
            </header>

            {loading ? (
                <div style={{ display: "flex", gap: 10, alignItems: "center", marginTop: 12, color: COLORS.textMuted }}>
                    <Spinner /> <span>Loading station…</span>
                </div>
            ) : (
                <>
                    {/* Station summary */}
                    <div
                        className="card"
                        style={{
                            padding: 16,
                            background: COLORS.pine,
                            border: `1px solid ${COLORS.border}`,
                            borderRadius: 14,
                            boxShadow: "0 12px 28px rgba(0,0,0,0.35)",
                            color: COLORS.text,
                            marginTop: 12,
                        }}
                    >
                        <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 6 }}>
                            <div style={{ fontWeight: 800, color: COLORS.lime }}>{s.name || "Station"}</div>
                            {s.address && <div className="muted small" style={{ color: COLORS.textMuted }}>{s.address}</div>}
                            {s.lat && s.lng && (
                                <div className="muted small" style={{ color: COLORS.textMuted }}>
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
                            )}
                            {s.pricePerKwh && (
                                <div className="muted small" style={{ color: COLORS.textMuted }}>
                                    Tariff: ₹ {s.pricePerKwh} / kWh
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Booking form */}
                    <form onSubmit={handleSubmit} className="form green-form" style={{ marginTop: 16 }}>
                        <div
                            className="card"
                            style={{
                                padding: 16,
                                background: COLORS.pine,
                                border: `1px solid ${COLORS.border}`,
                                borderRadius: 14,
                                boxShadow: "0 12px 28px rgba(0,0,0,0.35)",
                                color: COLORS.text,
                                display: "grid",
                                gap: 10,
                            }}
                        >
                            <label htmlFor="start">Start time</label>
                            <input
                                id="start"
                                type="datetime-local"
                                value={startLocal}
                                onChange={(e) => setStartLocal(e.target.value)}
                                required
                                style={inputStyle()}
                            />

                            <label htmlFor="duration" style={{ marginTop: 4 }}>
                                Duration (minutes)
                            </label>
                            <input
                                id="duration"
                                type="number"
                                min={15}
                                step={15}
                                value={durationMins}
                                onChange={(e) => setDurationMins(e.target.value)}
                                required
                                placeholder="30"
                                style={inputStyle()}
                            />

                            <label htmlFor="vehicleType" style={{ marginTop: 4 }}>
                                Vehicle Type
                            </label>
                            <select
                                id="vehicleType"
                                value={vehicleType}
                                onChange={(e) => setVehicleType(e.target.value)}
                                style={inputStyle()}
                            >
                                <option value="car">Car</option>
                                <option value="two_wheeler">Two Wheeler</option>
                                <option value="three_wheeler">Three Wheeler</option>
                                <option value="bus">Bus</option>
                            </select>

                            <label htmlFor="notes" style={{ marginTop: 4 }}>
                                Notes (optional)
                            </label>
                            <textarea
                                id="notes"
                                rows={3}
                                placeholder="Any special instructions…"
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                style={inputStyle()}
                            />

                            <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    style={primaryBtn()}
                                    onMouseOver={(e) => {
                                        if (submitting) return;
                                        e.currentTarget.style.transform = "translateY(-2px)";
                                        e.currentTarget.style.boxShadow = "0 16px 32px rgba(79,224,203,0.35)";
                                        e.currentTarget.style.filter = "brightness(1.05)";
                                    }}
                                    onMouseOut={(e) => {
                                        e.currentTarget.style.transform = "translateY(0px)";
                                        e.currentTarget.style.boxShadow = "0 12px 26px rgba(79,224,203,0.25)";
                                        e.currentTarget.style.filter = "brightness(1)";
                                    }}
                                >
                                    {submitting ? <Spinner size={16} /> : "Confirm Booking"}
                                </button>

                                <Link
                                    to={`/stations/${encodeURIComponent(id)}`}
                                    className="btn-secondary"
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
                                    Cancel
                                </Link>
                            </div>
                        </div>

                        {/* High-contrast placeholders and focus visuals for green theme */}
                        <style jsx>{`
              .green-form input::placeholder,
              .green-form textarea::placeholder {
                color: #dbffd1; /* lightest green */
                opacity: 1;
              }
              .green-form input::-webkit-input-placeholder,
              .green-form textarea::-webkit-input-placeholder { color: #dbffd1; }
              .green-form input:-ms-input-placeholder,
              .green-form textarea:-ms-input-placeholder { color: #dbffd1; }
              .green-form input::-ms-input-placeholder,
              .green-form textarea::-ms-input-placeholder { color: #dbffd1; }

              .green-form input,
              .green-form select,
              .green-form textarea {
                background: ${COLORS.moss};
                border: 1px solid ${COLORS.border};
                color: ${COLORS.text};
              }
              .green-form input:focus,
              .green-form select:focus,
              .green-form textarea:focus {
                box-shadow: 0 0 0 3px rgba(79,224,203,0.22);
                border-color: ${COLORS.aqua};
                outline: none;
              }
            `}</style>
                    </form>
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

/** Utilities */
function toLocalInputValue(date) {
    const pad = (n) => String(n).padStart(2, "0");
    const d = new Date(date);
    const yyyy = d.getFullYear();
    const mm = pad(d.getMonth() + 1);
    const dd = pad(d.getDate());
    const hh = pad(d.getHours());
    const mi = pad(d.getMinutes());
    return `${yyyy}-${mm}-${dd}T${hh}:${mi}`;
}

function localInputToISO(localStr) {
    const d = new Date(localStr);
    if (isNaN(d.getTime())) throw new Error("Invalid date");
    return d.toISOString();
}

/* Shared control styles */
function inputStyle() {
    return {
        background: COLORS.moss,
        color: COLORS.text,
        border: `1px solid ${COLORS.border}`,
        borderRadius: 12,
        padding: "10px 12px",
        outline: "none",
        transition: "border-color 0.2s ease, box-shadow 0.2s ease",
    };
}
function primaryBtn() {
    return {
        padding: "10px 14px",
        borderRadius: 12,
        color: "#0b0b0b",
        background: `linear-gradient(135deg, ${COLORS.lemon} 0%, ${COLORS.lime} 85%)`,
        border: "1px solid rgba(0,0,0,.15)",
        cursor: "pointer",
        boxShadow: "0 12px 26px rgba(0,0,0,0.35)",
        transition: "transform 0.15s ease, box-shadow 0.15s ease, filter 0.15s ease",
        minWidth: 150,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        fontWeight: 800,
    };
}
function secondaryBtn() {
    return {
        textDecoration: "none",
        padding: "10px 14px",
        borderRadius: 12,
        color: "#0b0b0b",
        background: `linear-gradient(135deg, ${COLORS.aqua} 0%, ${COLORS.lime} 90%)`,
        border: "1px solid rgba(0,0,0,.15)",
        boxShadow: "0 10px 22px rgba(0,0,0,0.35)",
        transition: "transform 0.15s ease, box-shadow 0.15s ease, filter 0.15s ease",
        minWidth: 120,
        textAlign: "center",
        fontWeight: 700,
    };
}
