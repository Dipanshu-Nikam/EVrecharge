// src/features/payment/pages/Checkout.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import http from "../../../utils/http";
import Spinner from "../../../components/Spinner";
import Toast from "../../../components/Toast";

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
    placeholder: "#dbffd1",
};

function formatINR(n) {
    if (!Number.isFinite(Number(n))) return "—";
    try {
        return new Intl.NumberFormat("en-IN", {
            style: "currency",
            currency: "INR",
            maximumFractionDigits: 2,
        }).format(Number(n));
    } catch {
        return `₹${Number(n).toFixed(2)}`;
    }
}

export default function Checkout() {
    const navigate = useNavigate();
    const { bookingId } = useParams();
    const location = useLocation();

    // Optional state from previous page: amount, customerEmail, customerName
    const state = location.state || {};
    const initialAmount = Number(state.amount ?? 0);

    const [loading, setLoading] = useState(false);
    const [toast, setToast] = useState({ open: false, type: "info", message: "" });
    const onCloseToast = () => setToast((t) => ({ ...t, open: false }));

    const [amount, setAmount] = useState(initialAmount || "");
    const [paymentMethod, setPaymentMethod] = useState("card");
    const [email, setEmail] = useState(state.customerEmail || "");
    const [name, setName] = useState(state.customerName || "");
    const [intent, setIntent] = useState(null);

    // Print only the invoice area
    const invoiceRef = useRef(null);
    const handlePrint = () => {
        if (!invoiceRef.current) return window.print();
        const content = invoiceRef.current.innerHTML;
        const printWin = window.open("", "PRINT", "height=650,width=900,top=100,left=150");
        if (!printWin) return window.print();
        printWin.document.write(`
      <html>
        <head>
          <title>Payment Receipt</title>
          <style>
            * { box-sizing: border-box; }
            body { font-family: system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell, 'Helvetica Neue', Arial; margin: 0; padding: 24px; color: #111; }
            .invoice { max-width: 720px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 12px; padding: 24px; }
            .row { display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; }
            .muted { color: #6b7280; }
            .hr { height: 1px; background: #e5e7eb; margin: 16px 0; }
            .totals { display: grid; gap: 8px; }
            .totals .line { display: flex; justify-content: space-between; }
            .badge { display: inline-block; padding: 2px 8px; border-radius: 999px; font-size: 12px; }
            .success { background: #ecfdf5; color: #065f46; border: 1px solid #a7f3d0; }
            .pending { background: #fff7ed; color: #9a3412; border: 1px solid #fed7aa; }
            .failed  { background: #fef2f2; color: #991b1b; border: 1px solid #fecaca; }
            .small { font-size: 12px; }
            .right { text-align: right; }
          </style>
        </head>
        <body onload="window.print(); setTimeout(()=>window.close(), 300);">
          <div class="invoice">${content}</div>
        </body>
      </html>
    `);
        printWin.document.close();
    };

    // If amount not provided, try to fetch booking to compute price (optional)
    useEffect(() => {
        let ignore = false;
        async function prefill() {
            if (initialAmount || !bookingId) return;
            try {
                setLoading(true);
                const res = await http.get(`/bookings/${encodeURIComponent(bookingId)}`);
                if (ignore) return;
                const b = res.data || {};
                const a = Number(b.amount ?? b.total ?? b.totalAmount ?? 0);
                if (a > 0) setAmount(a);
                if (b.user?.email && !email) setEmail(b.user.email);
                if (b.user?.name && !name) setName(b.user.name);
            } catch {
                // silent
            } finally {
                setLoading(false);
            }
        }
        prefill();
        return () => { ignore = true; };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [bookingId]);

    async function createIntent() {
        try {
            if (!amount || Number(amount) <= 0) {
                setToast({ open: true, type: "error", message: "Enter a valid amount" });
                return;
            }
            setLoading(true);
            // POST /payments/create-intent
            const res = await http.post("/payments/create-intent", {
                bookingId,
                amount: Number(amount),
                currency: "INR",
                paymentMethod,
                customerEmail: email || undefined,
                customerName: name || undefined,
            });
            const pi = res.data || {};
            setIntent(pi);
            setToast({ open: true, type: "success", message: "Payment intent created" });
        } catch (err) {
            setToast({
                open: true,
                type: "error",
                message: err?.response?.data?.error || err?.message || "Failed to create payment",
            });
        } finally {
            setLoading(false);
        }
    }

    async function confirmIntent() {
        const id =
            intent?.paymentIntent?.id ||
            intent?.id ||
            intent?.paymentIntentId;

        if (!id) {
            setToast({ open: true, type: "error", message: "No payment intent to confirm" });
            return;
        }
        try {
            setLoading(true);
            // POST /payments/confirm/:paymentIntentId
            const res = await http.post(`/payments/confirm/${encodeURIComponent(id)}`);
            const out = res.data || {};
            const status =
                (out?.paymentIntent?.status ||
                    out?.status ||
                    out?.result ||
                    "").toLowerCase();

            if (status === "success" || status === "succeeded" || status === "completed" || status === "paid") {
                navigate("/pay/success", { replace: true, state: { payment: out, intent } });
            } else if (status === "pending" || status === "requires_action") {
                await simulate3ds(id);
            } else {
                navigate("/pay/failed", { replace: true, state: { payment: out, intent } });
            }
        } catch (err) {
            setToast({
                open: true,
                type: "error",
                message: err?.response?.data?.error || err?.message || "Confirmation failed",
            });
        } finally {
            setLoading(false);
        }
    }

    async function simulate3ds(id) {
        try {
            const res = await http.post(`/payments/3ds/${encodeURIComponent(id)}`);
            const out = res.data || {};
            const status = (out.status || "").toLowerCase();
            if (status === "success" || status === "succeeded" || status === "completed" || status === "paid") {
                navigate("/pay/success", { replace: true, state: { payment: out, intent } });
            } else {
                navigate("/pay/failed", { replace: true, state: { payment: out, intent } });
            }
        } catch (e) {
            navigate("/pay/failed", { replace: true, state: { error: e?.message, intent } });
        }
    }

    const paymentIntent = useMemo(() => {
        if (!intent) return null;
        if (intent.paymentIntent) return intent.paymentIntent;
        return intent;
    }, [intent]);

    const breakdown = paymentIntent?.breakdown || {};
    const status = (paymentIntent?.status || "").toLowerCase();

    const statusBadgeClass =
        status === "succeeded" || status === "success"
            ? "success"
            : status === "requires_action" || status === "pending"
                ? "pending"
                : status === "failed"
                    ? "failed"
                    : "pending";

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
                    Checkout
                </h1>
                <p className="muted small" style={{ color: COLORS.textMuted, marginTop: 6 }}>
                    Complete secure payment for booking {bookingId || "—"}.
                </p>
            </header>

            {/* Form */}
            <div
                className="card"
                style={{
                    padding: 16,
                    marginTop: 12,
                    background: COLORS.pine,
                    border: `1px solid ${COLORS.border}`,
                    borderRadius: 14,
                    boxShadow: "0 12px 28px rgba(0,0,0,0.35)",
                    color: COLORS.text,
                    display: "grid",
                    gap: 12,
                }}
            >
                <label className="muted small" style={{ color: COLORS.textMuted }}>
                    Amount (₹)
                    <input
                        type="number"
                        step="0.01"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="0.00"
                        className="ge-input"
                        style={inputStyle()}
                    />
                </label>

                <label className="muted small" style={{ color: COLORS.textMuted }}>
                    Payment method
                    <select
                        value={paymentMethod}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        className="ge-input"
                        style={inputStyle()}
                    >
                        <option value="card">Card</option>
                        <option value="upi">UPI</option>
                        <option value="netbanking">Netbanking</option>
                    </select>
                </label>

                <label className="muted small" style={{ color: COLORS.textMuted }}>
                    Email (optional)
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="name@example.com"
                        className="ge-input"
                        style={inputStyle()}
                    />
                </label>

                <label className="muted small" style={{ color: COLORS.textMuted }}>
                    Name (optional)
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Full name"
                        className="ge-input"
                        style={inputStyle()}
                    />
                </label>

                {!paymentIntent ? (
                    <button className="btn-primary" disabled={loading} onClick={createIntent} style={primaryBtn()}>
                        {loading ? "Creating…" : "Create Payment"}
                    </button>
                ) : (
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                        <button className="btn-primary" disabled={loading} onClick={confirmIntent} style={primaryBtn()}>
                            {loading ? "Confirming…" : "Confirm Payment"}
                        </button>
                        <button className="btn-secondary" type="button" onClick={handlePrint} style={secondaryBtn()}>
                            Print Receipt
                        </button>
                    </div>
                )}

                {/* Input theme CSS */}
                <style jsx>{`
          .ge-input::placeholder { color: ${COLORS.placeholder}; opacity: 1; }
          .ge-input::-webkit-input-placeholder { color: ${COLORS.placeholder}; }
          .ge-input:-ms-input-placeholder { color: ${COLORS.placeholder}; }
          .ge-input::-ms-input-placeholder { color: ${COLORS.placeholder}; }
          .ge-input:focus {
            box-shadow: 0 0 0 3px rgba(79,224,203,0.22);
            border-color: ${COLORS.aqua};
            outline: none;
          }
        `}</style>
            </div>

            {/* Invoice / Receipt */}
            {paymentIntent && (
                <div
                    className="card"
                    ref={invoiceRef}
                    style={{
                        padding: 16,
                        marginTop: 16,
                        borderRadius: 14,
                        background: COLORS.moss,
                        border: `1px solid ${COLORS.border}`,
                        color: COLORS.text,
                        boxShadow: "0 12px 28px rgba(0,0,0,0.35)",
                    }}
                >
                    <div className="row" style={{ display: "flex", justifyContent: "space-between", gap: 16 }}>
                        <div>
                            <div style={{ fontSize: 18, fontWeight: 800 }}>Payment Receipt</div>
                            <div className="muted small" style={{ color: COLORS.textMuted }}>Booking: {bookingId}</div>
                            <div className="muted small" style={{ color: COLORS.textMuted }}>
                                Intent ID: {paymentIntent.id || "—"}
                            </div>
                        </div>
                        <div
                            className={`badge ${statusBadgeClass}`}
                            style={{
                                alignSelf: "flex-start",
                                padding: "2px 10px",
                                borderRadius: 999,
                                fontSize: 12,
                                border: "1px solid transparent",
                                background:
                                    statusBadgeClass === "success"
                                        ? "#ecfdf5"
                                        : statusBadgeClass === "failed"
                                            ? "#fef2f2"
                                            : "#fff7ed",
                                color:
                                    statusBadgeClass === "success"
                                        ? "#065f46"
                                        : statusBadgeClass === "failed"
                                            ? "#991b1b"
                                            : "#9a3412",
                            }}
                        >
                            {paymentIntent.status || "requires_payment_method"}
                        </div>
                    </div>

                    <div className="hr" style={{ height: 1, background: "rgba(234,255,234,.15)", margin: "12px 0" }} />

                    <div className="row" style={{ display: "flex", justifyContent: "space-between", gap: 16 }}>
                        <div>
                            <div style={{ fontWeight: 700 }}>Billed To</div>
                            <div>{(paymentIntent.customer && paymentIntent.customer.name) || name || "—"}</div>
                            <div className="muted small" style={{ color: COLORS.textMuted }}>
                                {(paymentIntent.customer && paymentIntent.customer.email) || email || "—"}
                            </div>
                        </div>
                        <div className="right" style={{ textAlign: "right" }}>
                            <div style={{ fontWeight: 700 }}>Merchant</div>
                            <div>EV Recharge Network</div>
                            <div className="muted small" style={{ color: COLORS.textMuted }}>
                                Invoice Date: {new Date().toLocaleString()}
                            </div>
                        </div>
                    </div>

                    <div className="hr" style={{ height: 1, background: "rgba(234,255,234,.15)", margin: "12px 0" }} />

                    <div>
                        <div style={{ fontWeight: 700, marginBottom: 8 }}>Details</div>
                        <div className="row" style={{ display: "flex", justifyContent: "space-between" }}>
                            <div>Charging Session</div>
                            <div className="muted small" style={{ color: COLORS.textMuted }}>{bookingId}</div>
                        </div>
                        <div className="row" style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
                            <div>Payment Method</div>
                            <div className="muted small" style={{ color: COLORS.textMuted }}>
                                {paymentIntent.paymentMethod?.type || "—"}
                            </div>
                        </div>
                    </div>

                    <div className="hr" style={{ height: 1, background: "rgba(234,255,234,.15)", margin: "12px 0" }} />

                    <div className="totals" style={{ display: "grid", gap: 8 }}>
                        <div className="line" style={{ display: "flex", justifyContent: "space-between" }}>
                            <div>Subtotal</div>
                            <div>{formatINR(breakdown.totalAmount ?? paymentIntent.amount)}</div>
                        </div>
                        <div className="line" style={{ display: "flex", justifyContent: "space-between" }}>
                            <div>Platform Fee (10%)</div>
                            <div>{formatINR(breakdown.platformFee)}</div>
                        </div>
                        <div className="line" style={{ display: "flex", justifyContent: "space-between" }}>
                            <div>Payable to Station Owner</div>
                            <div>{formatINR(breakdown.ownerAmount)}</div>
                        </div>
                        <div className="line" style={{ display: "flex", justifyContent: "space-between", fontWeight: 800 }}>
                            <div>Total</div>
                            <div>{formatINR(breakdown.totalAmount ?? paymentIntent.amount)}</div>
                        </div>
                    </div>

                    <div className="hr" style={{ height: 1, background: "rgba(234,255,234,.15)", margin: "12px 0" }} />

                    <div className="small muted" style={{ color: COLORS.textMuted }}>
                        Gateway: {paymentIntent.gateway || "—"} &nbsp;|&nbsp; Currency: {paymentIntent.currency || "INR"}
                    </div>
                </div>
            )}

            {/* Advanced / Raw JSON (collapsible) */}
            {paymentIntent && (
                <details className="card" style={{ padding: 12, marginTop: 12, background: COLORS.pine, border: `1px solid ${COLORS.border}`, borderRadius: 12, color: COLORS.text }}>
                    <summary className="muted" style={{ color: COLORS.textMuted }}>Advanced (raw JSON)</summary>
                    <pre style={{ margin: 0, whiteSpace: "pre-wrap" }}>
                        {JSON.stringify(intent, null, 2)}
                    </pre>
                </details>
            )}

            {loading && (
                <div style={{ marginTop: 12 }}>
                    <Spinner />
                </div>
            )}
            {toast.open && (
                <Toast type={toast.type} onClose={onCloseToast}>
                    {toast.message}
                </Toast>
            )}
        </div>
    );
}

/* Input/button styles */
function inputStyle() {
    return {
        width: "100%",
        padding: "10px 12px",
        borderRadius: 10,
        border: `1px solid ${COLORS.border}`,
        background: COLORS.moss,
        color: COLORS.text,
        outline: "none",
    };
}
function primaryBtn() {
    return {
        background: `linear-gradient(135deg, ${COLORS.lemon} 0%, ${COLORS.lime} 85%)`,
        color: "#0b0b0b",
        border: "1px solid rgba(0,0,0,.15)",
        borderRadius: 10,
        padding: "10px 14px",
        fontWeight: 800,
        cursor: "pointer",
        boxShadow: "0 12px 24px rgba(0,0,0,.35)",
        minWidth: 160,
    };
}
function secondaryBtn() {
    return {
        background: `linear-gradient(135deg, ${COLORS.aqua} 0%, ${COLORS.lime} 90%)`,
        color: "#0b0b0b",
        border: "1px solid rgba(0,0,0,.15)",
        borderRadius: 10,
        padding: "10px 14px",
        fontWeight: 700,
        cursor: "pointer",
    };
}
