// src/features/bookings/pages/BookingDetails.jsx
import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import http from "../../../utils/http";
import Spinner from "../../../components/Spinner";
import Toast from "../../../components/Toast";
import { startCheckout } from "../../../services/paymentService";

// Ocean palette (shared)
const COLORS = {
    navy: "#1f2d3d",
    navyLight: "#27384b",
    slate: "#33465c",
    panel: "#233349",
    border: "#3f5571",
    text: "#e6edf6",
    textMuted: "#b7c5d8",
    aqua: "#9ff6f3",
    sky: "#4cc3e5",
    royal: "#2f58b6",
    sand: "#e9d5c7",
    surface: "#1b2837",
    shadow: "rgba(0,0,0,0.45)",
};

export default function BookingDetails() {
    const { bookingId } = useParams();
    const [booking, setBooking] = useState(null);
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState({ open: false, type: "info", message: "" });

    const onCloseToast = () => setToast((t) => ({ ...t, open: false }));

    useEffect(() => {
        let ignore = false;

        async function load() {
            try {
                setLoading(true);
                const res = await http.get(`/bookings/${encodeURIComponent(bookingId)}`);
                if (ignore) return;

                const data = res.data?.booking || res.data;
                setBooking(data || null);
            } catch (err) {
                setToast({
                    open: true,
                    type: "error",
                    message: err?.response?.data?.message || err?.message || "Failed to load booking",
                });
            } finally {
                setLoading(false);
            }
        }

        load();
        return () => {
            ignore = true;
        };
    }, [bookingId]);

    async function onPay() {
        try {
            if (booking?.paymentUrl) {
                window.location.assign(booking.paymentUrl);
                return;
            }
            const id = booking?.id || booking?._id;
            if (!id) throw new Error("Missing booking id");

            const pay = await startCheckout(id);
            if (pay?.paymentUrl) window.location.assign(pay.paymentUrl);
            else setToast({ open: true, type: "error", message: "No payment URL returned" });
        } catch (e) {
            setToast({
                open: true,
                type: "error",
                message: e?.response?.data?.message || e?.message || "Payment start failed",
            });
        }
    }

    const formatDate = (value) => {
        if (!value) return "-";
        const d = new Date(value);
        return isNaN(d.getTime()) ? String(value) : d.toLocaleString();
    };

    if (loading) {
        return (
            <div
                className="page"
                style={{ maxWidth: 840, margin: "0 auto", padding: 24, color: COLORS.text }}
            >
                <Spinner /> Loading…
            </div>
        );
    }

    if (!booking) {
        return (
            <div
                className="page"
                style={{ maxWidth: 840, margin: "0 auto", padding: 24, color: COLORS.text }}
            >
                <div className="muted" style={{ color: COLORS.textMuted }}>Booking not found.</div>
                <div style={{ marginTop: 8 }}>
                    <Link
                        to="/bookings"
                        className="btn-secondary"
                        style={{
                            textDecoration: "none",
                            padding: "10px 14px",
                            borderRadius: 12,
                            color: "#fff",
                            background: `linear-gradient(135deg, ${COLORS.royal} 0%, ${COLORS.slate} 100%)`,
                            border: "1px solid transparent",
                            boxShadow: "0 10px 22px rgba(0,0,0,0.35)",
                            transition: "transform 0.15s ease, box-shadow 0.15s ease, filter 0.15s ease",
                        }}
                        onMouseOver={(e) => {
                            e.currentTarget.style.transform = "translateY(-2px)";
                            e.currentTarget.style.boxShadow = "0 14px 28px rgba(0,0,0,0.45)";
                        }}
                        onMouseOut={(e) => {
                            e.currentTarget.style.transform = "translateY(0px)";
                            e.currentTarget.style.boxShadow = "0 10px 22px rgba(0,0,0,0.35)";
                        }}
                    >
                        Back to bookings
                    </Link>
                </div>
            </div>
        );
    }

    const st = booking.station || {};
    const name = st.name || st.title || booking.stationName || "EV Charging Station";
    const addr = st.address || booking.stationAddress || "";
    const when = formatDate(booking.startTime || booking.start || booking.createdAt);
    const status = (booking.status || "pending").toLowerCase();
    const paymentStatus = (booking.paymentStatus || "").toLowerCase();
    const canPay =
        ["pending", "awaiting_payment", "pending_payment"].includes(status) ||
        paymentStatus === "pending";

    return (
        <div
            className="page"
            style={{ maxWidth: 840, margin: "0 auto", padding: 24, color: COLORS.text }}
        >
            <h1
                style={{
                    margin: 0,
                    background: `linear-gradient(135deg, ${COLORS.aqua} 0%, ${COLORS.sky} 60%, ${COLORS.royal} 100%)`,
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                }}
            >
                Booking Details
            </h1>

            <div
                className="card"
                style={{
                    padding: 16,
                    marginTop: 12,
                    background: COLORS.panel,
                    border: `1px solid ${COLORS.border}`,
                    borderRadius: 14,
                    boxShadow: "0 12px 28px rgba(0,0,0,0.35)",
                    color: COLORS.text,
                }}
            >
                <div style={{ fontWeight: 700, color: COLORS.sand }}>{name}</div>
                {addr && <div className="muted small" style={{ color: COLORS.textMuted }}>{addr}</div>}
                <div className="muted small" style={{ color: COLORS.textMuted }}>When: {when}</div>
                <div className="muted small" style={{ color: COLORS.textMuted }}>Status: {status}</div>
                {booking.durationMins && (
                    <div className="muted small" style={{ color: COLORS.textMuted }}>
                        Duration: {booking.durationMins} mins
                    </div>
                )}
                {booking.amount && (
                    <div className="muted small" style={{ color: COLORS.textMuted }}>
                        Amount: ₹{Number(booking.amount).toFixed(2)}
                    </div>
                )}
                {booking.paymentStatus && (
                    <div className="muted small" style={{ color: COLORS.textMuted }}>
                        Payment: {paymentStatus}
                    </div>
                )}
            </div>

            <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                <Link
                    to="/bookings"
                    className="btn-secondary"
                    style={{
                        textDecoration: "none",
                        padding: "10px 14px",
                        borderRadius: 12,
                        color: "#fff",
                        background: `linear-gradient(135deg, ${COLORS.royal} 0%, ${COLORS.slate} 100%)`,
                        border: "1px solid transparent",
                        boxShadow: "0 10px 22px rgba(0,0,0,0.35)",
                        transition: "transform 0.15s ease, box-shadow 0.15s ease, filter 0.15s ease",
                    }}
                    onMouseOver={(e) => {
                        e.currentTarget.style.transform = "translateY(-2px)";
                        e.currentTarget.style.boxShadow = "0 14px 28px rgba(0,0,0,0.45)";
                    }}
                    onMouseOut={(e) => {
                        e.currentTarget.style.transform = "translateY(0px)";
                        e.currentTarget.style.boxShadow = "0 10px 22px rgba(0,0,0,0.35)";
                    }}
                >
                    Back
                </Link>

                {canPay && (
                    <button
                        className="btn-primary"
                        onClick={onPay}
                        style={{
                            padding: "10px 14px",
                            borderRadius: 12,
                            color: "#0b1b2a",
                            background: `linear-gradient(135deg, ${COLORS.aqua} 0%, ${COLORS.sky} 70%)`,
                            border: "1px solid transparent",
                            boxShadow: "0 12px 26px rgba(76,195,229,0.45)",
                            transition: "transform 0.15s ease, box-shadow 0.15s ease, filter 0.15s ease",
                            cursor: "pointer",
                            minWidth: 120,
                        }}
                        onMouseOver={(e) => {
                            e.currentTarget.style.transform = "translateY(-2px)";
                            e.currentTarget.style.boxShadow = "0 16px 32px rgba(76,195,229,0.6)";
                            e.currentTarget.style.filter = "brightness(1.05)";
                        }}
                        onMouseOut={(e) => {
                            e.currentTarget.style.transform = "translateY(0px)";
                            e.currentTarget.style.boxShadow = "0 12px 26px rgba(76,195,229,0.45)";
                            e.currentTarget.style.filter = "brightness(1)";
                        }}
                    >
                        Pay
                    </button>
                )}
            </div>

            {toast.open && <Toast type={toast.type} onClose={onCloseToast}>{toast.message}</Toast>}
        </div>
    );
}
