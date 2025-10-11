// src/features/bookings/pages/BookSlot.jsx
import { useLocation, useNavigate, useParams, Link } from "react-router-dom";
import { useMemo, useState } from "react";
import Spinner from "../../../components/Spinner";
import Toast from "../../../components/Toast";
import { createBooking } from "../../../services/bookingService";
import { startCheckout } from "../../../services/paymentService";

// Green Energy palette
const COLORS = {
    // Greens
    forest: "#0f1a12",
    pine: "#142417",
    moss: "#18341f",
    leaf: "#1c3d25",
    border: "rgba(137,243,54,.28)",
    // Text
    text: "#eaffea",
    textMuted: "rgba(234,255,234,.78)",
    // Accents
    lime: "#89F336",
    lemon: "#FFFC30",
    aqua: "#4FE0CB",
    // Placeholder
    placeholder: "#dbffd1",
    // Shadow
    shadow: "rgba(0,0,0,0.45)",
};

export default function BookSlot() {
    const { id: stationId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();

    // Station object passed from details
    const station = location.state?.station || {};
    const name = station.name || "EV Station";
    const address = station.address || "";
    const lat = Number(station.lat ?? station.latitude);
    const lng = Number(station.lng ?? station.longitude);

    const coordText = useMemo(() => {
        const laOk = Number.isFinite(lat);
        const lnOk = Number.isFinite(lng);
        if (!laOk || !lnOk) return null;
        return `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
    }, [lat, lng]);

    // Simple local form
    const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
    const [time, setTime] = useState("10:00");
    const [hours, setHours] = useState(1);
    const [vehicleType, setVehicleType] = useState("car"); // optional
    const [busy, setBusy] = useState(false);
    const [toast, setToast] = useState({ open: false, type: "info", message: "" });
    const onCloseToast = () => setToast((t) => ({ ...t, open: false }));

    const toIsoStart = (d, t) => {
        try {
            const iso = new Date(`${d}T${t}:00`).toISOString();
            return iso;
        } catch {
            return null;
        }
    };

    async function handleSubmit(e) {
        e.preventDefault();

        if (!stationId) {
            setToast({ open: true, type: "error", message: "Missing station id" });
            return;
        }
        if (!date || !time) {
            setToast({ open: true, type: "error", message: "Select date and time" });
            return;
        }
        if (hours < 1 || hours > 8) {
            setToast({ open: true, type: "error", message: "Duration must be 1–8 hours" });
            return;
        }

        const startTime = toIsoStart(date, time);
        if (!startTime) {
            setToast({ open: true, type: "error", message: "Invalid date/time" });
            return;
        }

        try {
            setBusy(true);

            const booking = await createBooking({
                stationId,
                startTime,            // ISO string
                durationMins: hours * 60,
                vehicleType,          // optional
            });

            if (booking?.paymentRequired || booking?.paymentUrl) {
                const pay = booking?.paymentUrl
                    ? { paymentUrl: booking.paymentUrl }
                    : await startCheckout(booking.id || booking._id);

                if (pay?.paymentUrl) {
                    window.location.assign(pay.paymentUrl);
                    return;
                }
            }

            setToast({ open: true, type: "success", message: "Booking confirmed" });
            navigate("/pay/success", { replace: true, state: { booking } });
        } catch (err) {
            const msg =
                err?.response?.data?.message ||
                err?.response?.data?.error ||
                err?.normalizedMessage ||
                err?.message ||
                "Failed to book";
            setToast({ open: true, type: "error", message: msg });
        } finally {
            setBusy(false);
        }
    }

    return (
        <div
            className="page"
            style={{
                maxWidth: 900,
                margin: "0 auto",
                padding: 24,
                color: COLORS.text,
            }}
        >
            {/* Header */}
            <div
                className="card"
                style={{
                    padding: 16,
                    borderRadius: 16,
                    border: `1px solid ${COLORS.border}`,
                    background:
                        `linear-gradient(180deg, ${COLORS.leaf}, ${COLORS.forest}),` +
                        `radial-gradient(560px 220px at 6% -20%, rgba(137,243,54,.10), transparent 70%)`,
                    boxShadow: "0 12px 28px rgba(0,0,0,0.35)",
                    marginBottom: 12,
                }}
            >
                <h2
                    style={{
                        margin: 0,
                        background: `linear-gradient(135deg, ${COLORS.lime} 0%, ${COLORS.aqua} 65%)`,
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                    }}
                >
                    Book: {name}
                </h2>
                <p className="muted small" style={{ color: COLORS.textMuted, marginTop: 6 }}>
                    Reserve a time slot and breeze through charging.
                </p>
            </div>

            {/* Station Info */}
            <div
                className="card"
                style={{
                    background: COLORS.pine,
                    border: `1px solid ${COLORS.border}`,
                    borderRadius: 14,
                    padding: 16,
                    boxShadow: "0 12px 28px rgba(0,0,0,0.35)",
                    color: COLORS.text,
                }}
            >
                <div style={{ fontWeight: 800, color: COLORS.lime }}>{name}</div>
                <div className="muted" style={{ color: COLORS.textMuted }}>
                    {address || "—"}
                </div>
                <div className="muted" style={{ color: COLORS.textMuted, marginTop: 4 }}>
                    {coordText ?? "Coordinates unavailable"}
                </div>
            </div>

            {/* Booking Form */}
            <form
                onSubmit={handleSubmit}
                className="green-form"
                style={{
                    marginTop: 12,
                    display: "grid",
                    gap: 12,
                    maxWidth: 560,
                }}
            >
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
                        gap: 12,
                    }}
                >
                    {/* Date */}
                    <div>
                        <label htmlFor="date" className="muted small" style={{ color: COLORS.textMuted }}>
                            Date
                        </label>
                        <input
                            id="date"
                            type="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            required
                            style={inputStyle()}
                        />
                    </div>

                    {/* Time */}
                    <div>
                        <label htmlFor="time" className="muted small" style={{ color: COLORS.textMuted }}>
                            Start time
                        </label>
                        <input
                            id="time"
                            type="time"
                            value={time}
                            onChange={(e) => setTime(e.target.value)}
                            required
                            style={inputStyle()}
                        />
                    </div>

                    {/* Duration */}
                    <div>
                        <label htmlFor="hours" className="muted small" style={{ color: COLORS.textMuted }}>
                            Duration (hours)
                        </label>
                        <input
                            id="hours"
                            type="number"
                            min={1}
                            max={8}
                            value={hours}
                            onChange={(e) => setHours(Number(e.target.value || 1))}
                            placeholder="1"
                            style={inputStyle()}
                        />
                    </div>

                    {/* Vehicle type */}
                    <div>
                        <label htmlFor="vehicleType" className="muted small" style={{ color: COLORS.textMuted }}>
                            Vehicle type
                        </label>
                        <select
                            id="vehicleType"
                            value={vehicleType}
                            onChange={(e) => setVehicleType(e.target.value)}
                            style={inputStyle()}
                        >
                            <option value="car">Car</option>
                            <option value="bike">Bike</option>
                            <option value="suv">SUV</option>
                            <option value="ev">EV</option>
                        </select>
                    </div>

                    {/* Actions */}
                    <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
                        <button
                            type="submit"
                            disabled={busy}
                            style={primaryBtn()}
                            onMouseOver={(e) => {
                                if (busy) return;
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
                            {busy ? (
                                <>
                                    <Spinner size={16} /> &nbsp;Booking…
                                </>
                            ) : (
                                "Confirm Booking"
                            )}
                        </button>

                        <Link
                            to={`/stations/${encodeURIComponent(stationId)}`}
                            className="btn-secondary"
                            state={{ station }}
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
                            Back
                        </Link>
                    </div>
                </div>

                {/* Placeholder and focus styling */}
                <style jsx>{`
          .green-form input::placeholder,
          .green-form textarea::placeholder {
            color: ${COLORS.placeholder};
            opacity: 1;
          }
          .green-form input::-webkit-input-placeholder,
          .green-form textarea::-webkit-input-placeholder { color: ${COLORS.placeholder}; }
          .green-form input:-ms-input-placeholder,
          .green-form textarea:-ms-input-placeholder { color: ${COLORS.placeholder}; }
          .green-form input::-ms-input-placeholder,
          .green-form textarea::-ms-input-placeholder { color: ${COLORS.placeholder}; }

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

            <ToastArea toast={toast} onClose={onCloseToast} />
        </div>
    );
}

function ToastArea({ toast, onClose }) {
    return toast.open ? (
        <Toast type={toast.type} onClose={onClose}>
            {toast.message}
        </Toast>
    ) : null;
}

/* Styles */
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
        minWidth: 160,
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
