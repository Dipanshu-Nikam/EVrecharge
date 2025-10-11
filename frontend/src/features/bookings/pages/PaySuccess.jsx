// src/features/bookings/pages/PaySuccess.jsx
import { useEffect, useMemo, useState } from "react";
import { useLocation, Link } from "react-router-dom";
import { getBooking } from "../../../services/bookingService";
import { getPayment } from "../../../services/paymentService";

/* Green Energy palette */
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
};

export default function PaySuccess() {
    const { state, search } = useLocation();
    const bookingFromState = state?.booking;

    const params = useMemo(() => new URLSearchParams(search), [search]);
    const paymentId = params.get("paymentId") || params.get("payment_id");
    const bookingId = params.get("bookingId") || params.get("booking_id");

    const [booking, setBooking] = useState(bookingFromState || null);
    const [loading, setLoading] = useState(!bookingFromState && !!bookingId);
    const [error, setError] = useState(null);

    useEffect(() => {
        let mounted = true;
        (async () => {
            if (bookingFromState || !bookingId) return;
            try {
                setLoading(true);
                setError(null);
                if (paymentId) {
                    await getPayment(paymentId).catch(() => null);
                }
                const data = await getBooking(bookingId);
                if (mounted) setBooking(data);
            } catch (e) {
                if (mounted) setError(e?.message || "Unable to load booking");
            } finally {
                if (mounted) setLoading(false);
            }
        })();
        return () => { mounted = false; };
    }, [bookingFromState, bookingId, paymentId]);

    return (
        <div className="page" style={{ maxWidth: 760, margin: "0 auto", padding: 24, color: COLORS.text }}>
            {/* Header */}
            <header
                className="card glass"
                style={{
                    padding: 18,
                    borderRadius: 16,
                    border: `1px solid ${COLORS.border}`,
                    background:
                        `linear-gradient(180deg, ${COLORS.leaf}, ${COLORS.forest}),` +
                        `radial-gradient(560px 200px at 6% -20%, rgba(137,243,54,.12), transparent 70%)`,
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
                    Payment Successful
                </h1>
                <p className="muted small" style={{ color: COLORS.textMuted, marginTop: 6 }}>
                    The booking is confirmed. A receipt has been sent to the registered email if available.
                </p>
            </header>

            {/* Content */}
            {loading && (
                <div
                    className="card"
                    style={{
                        padding: 16,
                        marginTop: 12,
                        background: COLORS.pine,
                        border: `1px solid ${COLORS.border}`,
                        borderRadius: 14,
                        color: COLORS.text,
                    }}
                >
                    Loading booking…
                </div>
            )}

            {error && (
                <div
                    className="card"
                    style={{
                        padding: 16,
                        marginTop: 12,
                        background: COLORS.moss,
                        border: `1px solid ${COLORS.border}`,
                        borderRadius: 14,
                        color: "#ffe0e0",
                    }}
                >
                    {error}
                </div>
            )}

            {!loading && !error && (
                booking ? (
                    <section
                        className="card"
                        style={{
                            padding: 16,
                            marginTop: 12,
                            background: COLORS.pine,
                            border: `1px solid ${COLORS.border}`,
                            borderRadius: 14,
                            color: COLORS.text,
                        }}
                    >
                        <div style={{ display: "grid", gap: 8 }}>
                            <div>
                                <span style={{ color: COLORS.textMuted }}>Booking ID</span>
                                <div style={{ fontWeight: 800 }}>{booking.id || booking._id}</div>
                            </div>

                            <div>
                                <span style={{ color: COLORS.textMuted }}>Station</span>
                                <div>{booking.station?.name || booking.stationName || "—"}</div>
                            </div>

                            <div>
                                <span style={{ color: COLORS.textMuted }}>When</span>
                                <div>{booking.startTime ? new Date(booking.startTime).toLocaleString() : "—"}</div>
                            </div>

                            <div>
                                <span style={{ color: COLORS.textMuted }}>Status</span>
                                <div
                                    style={{
                                        display: "inline-block",
                                        padding: "2px 10px",
                                        borderRadius: 999,
                                        fontSize: 12,
                                        background: "#ecfdf5",
                                        color: "#065f46",
                                        border: "1px solid #a7f3d0",
                                        fontWeight: 700,
                                    }}
                                >
                                    {booking.status || "confirmed"}
                                </div>
                            </div>
                        </div>
                    </section>
                ) : (
                    <div
                        className="card"
                        style={{
                            padding: 16,
                            marginTop: 12,
                            background: COLORS.pine,
                            border: `1px solid ${COLORS.border}`,
                            borderRadius: 14,
                            color: COLORS.text,
                        }}
                    >
                        <div className="muted" style={{ color: COLORS.textMuted }}>
                            We could not find booking details.
                        </div>
                    </div>
                )
            )}

            {/* Actions */}
            <div style={{ display: "flex", gap: 8, marginTop: 16, flexWrap: "wrap" }}>
                <Link
                    to="/bookings"
                    className="btn-primary"
                    style={{
                        textDecoration: "none",
                        padding: "10px 14px",
                        borderRadius: 12,
                        color: "#0b0b0b",
                        background: `linear-gradient(135deg, ${COLORS.lemon} 0%, ${COLORS.lime} 85%)`,
                        border: "1px solid rgba(0,0,0,.15)",
                        boxShadow: "0 12px 26px rgba(0,0,0,0.35)",
                        transition: "transform 0.15s ease, box-shadow 0.15s ease, filter 0.15s ease",
                        minWidth: 160,
                        textAlign: "center",
                        fontWeight: 800,
                    }}
                    onMouseOver={(e) => {
                        e.currentTarget.style.transform = "translateY(-2px)";
                        e.currentTarget.style.boxShadow = "0 16px 32px rgba(0,0,0,0.45)";
                        e.currentTarget.style.filter = "brightness(1.05)";
                    }}
                    onMouseOut={(e) => {
                        e.currentTarget.style.transform = "translateY(0px)";
                        e.currentTarget.style.boxShadow = "0 12px 26px rgba(0,0,0,0.35)";
                        e.currentTarget.style.filter = "brightness(1)";
                    }}
                >
                    View my bookings
                </Link>

                <Link
                    to="/search"
                    className="btn-secondary"
                    style={{
                        textDecoration: "none",
                        padding: "10px 14px",
                        borderRadius: 12,
                        color: "#0b0b0b",
                        background: `linear-gradient(135deg, ${COLORS.aqua} 0%, ${COLORS.lime} 90%)`,
                        border: "1px solid rgba(0,0,0,.15)",
                        boxShadow: "0 10px 22px rgba(0,0,0,0.35)",
                        transition: "transform 0.15s ease, box-shadow 0.15s ease, filter 0.15s ease",
                        minWidth: 200,
                        textAlign: "center",
                        fontWeight: 700,
                    }}
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
                    Find another station
                </Link>
            </div>
        </div>
    );
}
