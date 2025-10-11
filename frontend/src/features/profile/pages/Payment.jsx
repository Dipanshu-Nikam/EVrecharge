import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthProvider";
import { getBooking, updateBooking } from "../services/bookingService";
import { createPaymentIntent, confirmPayment } from "../services/paymentService";
import Spinner from "../components/Spinner";
import Toast from "../components/Toast";

export default function Payment() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { user } = useAuth();

    const bookingId = searchParams.get("bookingId");

    const [booking, setBooking] = useState(null);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);
    const [walletBalance, setWalletBalance] = useState(2500.0);
    const [selectedPaymentMethod, setSelectedPaymentMethod] = useState("wallet");
    const [toast, setToast] = useState({ type: "", message: "", open: false });

    const onCloseToast = () => setToast((t) => ({ ...t, open: false }));

    useEffect(() => {
        if (!bookingId) {
            setToast({ type: "error", message: "No booking ID provided", open: true });
            setTimeout(() => navigate("/bookings"), 2000);
            return;
        }
        fetchBookingDetails();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [bookingId]);

    const fetchBookingDetails = async () => {
        try {
            setLoading(true);
            const bookingData = await getBooking(bookingId);
            setBooking(bookingData.booking || bookingData);
        } catch (error) {
            setToast({
                type: "error",
                message: "Failed to load booking details",
                open: true,
            });
        } finally {
            setLoading(false);
        }
    };

    const handleWalletPayment = async () => {
        if (!booking) return;

        if (walletBalance < booking.amount) {
            setToast({
                type: "error",
                message: "Insufficient wallet balance",
                open: true,
            });
            return;
        }

        try {
            setProcessing(true);

            await updateBooking(booking.id, {
                status: "confirmed",
                paymentStatus: "paid",
                paymentMethod: "wallet",
                paidAt: new Date().toISOString(),
            });

            setWalletBalance((prev) => prev - booking.amount);

            setToast({
                type: "success",
                message: "Payment successful! Booking confirmed.",
                open: true,
            });

            setTimeout(() => {
                navigate("/bookings");
            }, 2000);
        } catch (error) {
            setToast({
                type: "error",
                message: "Payment failed. Please try again.",
                open: true,
            });
        } finally {
            setProcessing(false);
        }
    };

    const handleCardPayment = async () => {
        try {
            setProcessing(true);

            const paymentIntent = await createPaymentIntent({
                bookingId: booking.id,
                amount: booking.amount,
                currency: "INR",
            });

            const confirmation = await confirmPayment(paymentIntent.id, {
                paymentMethod: "card",
                bookingId: booking.id,
            });

            if (confirmation.success) {
                await updateBooking(booking.id, {
                    status: "confirmed",
                    paymentStatus: "paid",
                    paymentMethod: "card",
                    paidAt: new Date().toISOString(),
                });

                setToast({
                    type: "success",
                    message: "Payment successful! Booking confirmed.",
                    open: true,
                });

                setTimeout(() => navigate("/bookings"), 2000);
            }
        } catch (error) {
            setToast({
                type: "error",
                message: "Card payment failed. Please try again.",
                open: true,
            });
        } finally {
            setProcessing(false);
        }
    };

    const handlePayment = () => {
        if (selectedPaymentMethod === "wallet") {
            handleWalletPayment();
        } else {
            handleCardPayment();
        }
    };

    if (loading) {
        return (
            <div className="page page--center" style={{ minHeight: "50vh" }}>
                <Spinner size={32} />
                <p className="muted">Loading payment details...</p>
            </div>
        );
    }

    if (!booking) {
        return (
            <div className="page page--center" style={{ minHeight: "50vh" }}>
                <h2>Booking not found</h2>
                <button onClick={() => navigate("/bookings")} className="btn btn--primary">
                    Go to Bookings
                </button>
            </div>
        );
    }

    const text = "var(--oc-text)";
    const muted = "var(--oc-muted)";
    const card = "var(--oc-card)";
    const border = "var(--oc-border)";

    return (
        <div className="page">
            <div className="container" style={{ maxWidth: 640, margin: "0 auto" }}>
                <header
                    className="card glass"
                    style={{
                        border: `1px solid ${border}`,
                        borderRadius: 16,
                        padding: 18,
                        marginBottom: 16,
                        background:
                            `linear-gradient(180deg, ${card}, #0f1a12),` +
                            `radial-gradient(520px 180px at 8% -20%, rgba(255,252,48,.10), transparent 70%)`,
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
                        Secure payment
                    </div>
                    <h1 className="title-xl" style={{ margin: 0, color: text }}>
                        Complete Payment
                    </h1>
                    <p className="muted" style={{ margin: "6px 0 0 0", color: muted }}>
                        Confirm the booking and pay using wallet or card.
                    </p>
                </header>

                {/* Booking Summary */}
                <div
                    className="card glass"
                    style={{
                        marginBottom: 16,
                        border: `1px solid ${border}`,
                        borderRadius: 14,
                        background: `linear-gradient(180deg, ${card}, #0f1a12)`,
                        color: text,
                    }}
                >
                    <h3 style={{ margin: "12px 16px 8px" }}>Booking Summary</h3>
                    <div className="booking-summary" style={{ padding: "0 16px 16px" }}>
                        <div className="summary-row">
                            <span>Booking ID:</span>
                            <span>{booking.id}</span>
                        </div>
                        <div className="summary-row">
                            <span>Duration:</span>
                            <span>{booking.durationMins} minutes</span>
                        </div>
                        <div className="summary-row">
                            <span>Vehicle Type:</span>
                            <span>{booking.vehicleType}</span>
                        </div>
                        <div className="summary-row">
                            <span>Connector Type:</span>
                            <span>{booking.connectorType}</span>
                        </div>
                        <div className="summary-row total">
                            <span>
                                <strong>Total Amount:</strong>
                            </span>
                            <span>
                                <strong>₹{booking.amount}</strong>
                            </span>
                        </div>
                    </div>
                </div>

                {/* Payment Methods */}
                <div
                    className="card glass"
                    style={{
                        marginBottom: 16,
                        border: `1px solid ${border}`,
                        borderRadius: 14,
                        background:
                            `linear-gradient(180deg, ${card}, #0f1a12),` +
                            `radial-gradient(520px 200px at 8% -20%, rgba(79,224,203,.08), transparent 70%)`,
                        color: text,
                    }}
                >
                    <h3 style={{ margin: "12px 16px 8px" }}>Select Payment Method</h3>

                    <div className="payment-methods" style={{ padding: "0 16px 16px" }}>
                        <label
                            className="payment-method"
                            style={{
                                borderColor:
                                    selectedPaymentMethod === "wallet"
                                        ? "rgba(255,252,48,.45)"
                                        : "var(--oc-border)",
                                background:
                                    selectedPaymentMethod === "wallet"
                                        ? "linear-gradient(180deg, rgba(255,252,48,.12), rgba(0,0,0,0))"
                                        : "transparent",
                            }}
                        >
                            <input
                                type="radio"
                                name="paymentMethod"
                                value="wallet"
                                checked={selectedPaymentMethod === "wallet"}
                                onChange={(e) => setSelectedPaymentMethod(e.target.value)}
                            />
                            <div className="payment-method-content">
                                <div className="payment-method-info">
                                    <strong style={{ color: text }}>EV Wallet</strong>
                                    <p>Pay using your EV wallet balance</p>
                                </div>
                                <div className="payment-method-balance">
                                    <span className="balance">Balance: ₹{walletBalance.toFixed(2)}</span>
                                    {walletBalance < booking.amount && (
                                        <span className="insufficient">Insufficient Balance</span>
                                    )}
                                </div>
                            </div>
                        </label>

                        <label
                            className="payment-method"
                            style={{
                                borderColor:
                                    selectedPaymentMethod === "card"
                                        ? "rgba(79,224,203,.45)"
                                        : "var(--oc-border)",
                                background:
                                    selectedPaymentMethod === "card"
                                        ? "linear-gradient(180deg, rgba(79,224,203,.12), rgba(0,0,0,0))"
                                        : "transparent",
                            }}
                        >
                            <input
                                type="radio"
                                name="paymentMethod"
                                value="card"
                                checked={selectedPaymentMethod === "card"}
                                onChange={(e) => setSelectedPaymentMethod(e.target.value)}
                            />
                            <div className="payment-method-content">
                                <div className="payment-method-info">
                                    <strong style={{ color: text }}>Credit/Debit Card</strong>
                                    <p>Pay securely with your card</p>
                                </div>
                                <div className="payment-method-icon">💳</div>
                            </div>
                        </label>
                    </div>
                </div>

                {/* Actions */}
                <div className="payment-actions">
                    <button
                        onClick={() => navigate(-1)}
                        className="btn btn--secondary"
                        disabled={processing}
                    >
                        Cancel
                    </button>

                    <button
                        onClick={handlePayment}
                        className="btn btn--primary"
                        disabled={
                            processing ||
                            (selectedPaymentMethod === "wallet" && walletBalance < booking.amount)
                        }
                        style={{ minWidth: 160 }}
                    >
                        {processing ? (
                            <>
                                <Spinner size={16} /> Processing...
                            </>
                        ) : (
                            `Pay ₹${booking.amount}`
                        )}
                    </button>
                </div>
            </div>

            {toast.open && (
                <Toast type={toast.type} onClose={onCloseToast}>
                    {toast.message}
                </Toast>
            )}

            <style jsx>{`
        .booking-summary .summary-row {
          display: flex;
          justify-content: space-between;
          padding: 8px 0;
          border-bottom: 1px solid var(--oc-border);
        }

        .booking-summary .summary-row.total {
          border-top: 2px solid var(--oc-border);
          margin-top: 12px;
          padding-top: 12px;
          font-size: 1.1em;
        }

        .payment-methods {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .payment-method {
          display: flex;
          align-items: center;
          padding: 16px;
          border: 2px solid var(--oc-border);
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.2s ease;
          background: transparent;
        }

        .payment-method input[type="radio"] {
          margin-right: 12px;
          accent-color: var(--spring-aqua, #4FE0CB);
        }

        .payment-method-content {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex: 1;
        }

        .payment-method-info p {
          margin: 4px 0 0 0;
          color: var(--oc-muted);
          font-size: 0.9em;
        }

        .payment-method-balance {
          text-align: right;
        }

        .balance {
          font-weight: 700;
          color: #0b0b0b;
          background: linear-gradient(135deg, var(--spring-lemon, #FFFC30), #ffe95c);
          padding: 4px 8px;
          border-radius: 8px;
          border: 1px solid rgba(255, 252, 48, 0.45);
        }

        .insufficient {
          display: block;
          color: #dc3545;
          font-size: 0.8em;
          margin-top: 6px;
        }

        .payment-method-icon {
          font-size: 24px;
        }

        .payment-actions {
          display: flex;
          gap: 16px;
          justify-content: flex-end;
          margin-top: 24px;
        }

        .btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 12px 20px;
          border: none;
          border-radius: 10px;
          cursor: pointer;
          font-weight: 700;
          transition: all 0.2s ease;
        }

        .btn--primary {
          background: linear-gradient(135deg, var(--spring-lime, #89F336), var(--spring-aqua, #4FE0CB));
          color: #0b0b0b;
          border: 1px solid rgba(0, 0, 0, 0.15);
          box-shadow: 0 10px 24px rgba(0, 0, 0, 0.35);
        }

        .btn--primary:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 14px 30px rgba(0, 0, 0, 0.45);
        }

        .btn--secondary {
          background: linear-gradient(180deg, var(--oc-card), #0f1a12);
          color: var(--oc-text);
          border: 1px solid var(--oc-border);
        }

        .btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        @media (max-width: 560px) {
          .payment-actions {
            flex-direction: column;
          }
          .btn--primary,
          .btn--secondary {
            width: 100%;
          }
        }
      `}</style>
        </div>
    );
}
