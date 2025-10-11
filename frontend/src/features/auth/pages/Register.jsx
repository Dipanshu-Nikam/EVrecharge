// src/features/auth/pages/Register.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Spinner from "../../../components/Spinner";
import Toast from "../../../components/Toast";
import { register } from "../../../services/authService"; // uses /auth/register (user) and /owners/register (owner)

// Green + Yellow palette
const COLORS = {
    forest: "#0f1a12",
    pine: "#142417",
    moss: "#18341f",
    leaf: "#1c3d25",
    border: "rgba(137,243,54,.28)",
    text: "#eaffea",
    textMuted: "rgba(234,255,234,.78)",
    aqua: "#4FE0CB",
    lime: "#89F336",
    yellow: "#FFFC30",
    placeholder: "#dbffd1",
};

export default function Register() {
    const navigate = useNavigate();

    // role: "user" | "owner"
    const [role, setRole] = useState("user");

    const [form, setForm] = useState({
        // common
        email: "",
        password: "",
        // user fields
        name: "",
        phone: "",
        // owner fields
        displayName: "",
        ownerPhone: "",
    });

    const [submitting, setSubmitting] = useState(false);
    const [toast, setToast] = useState({ open: false, type: "info", message: "" });
    const onCloseToast = () => setToast((t) => ({ ...t, open: false }));

    const onChange = (e) => {
        const { name, value } = e.target;
        setForm((f) => ({ ...f, [name]: value }));
    };

    const validate = () => {
        if (!/^\S+@\S+\.\S+$/.test(form.email)) {
            return "Enter a valid email address.";
        }
        if (!form.password) {
            return "Password is required.";
        }
        if (role === "user") {
            if (!form.name.trim()) return "Full name is required.";
            if (form.phone && !/^\+?\d{10,}$/.test(form.phone)) return "Enter a valid phone number.";
        } else {
            if (!form.displayName.trim()) return "Owner name is required.";
            if (!/^\+?\d{10,}$/.test(form.ownerPhone)) return "Owner phone is required and must be valid.";
        }
        return null;
    };

    const onSubmit = async (e) => {
        e.preventDefault();
        const error = validate();
        if (error) {
            setToast({ open: true, type: "error", message: error });
            return;
        }

        setSubmitting(true);
        try {
            if (role === "user") {
                await register("user", {
                    name: form.name.trim(),
                    email: form.email,
                    phone: form.phone || undefined,
                    password: form.password,
                });
                setToast({ open: true, type: "success", message: "Account created. You can now log in." });
                setTimeout(() => navigate("/auth/login"), 1000);
            } else {
                await register("owner", {
                    displayName: form.displayName.trim(),
                    email: form.email,
                    phone: form.ownerPhone,
                    password: form.password,
                });
                setToast({ open: true, type: "success", message: "Owner account created. Please log in." });
                setTimeout(() => navigate("/owner/login"), 1000);
            }
        } catch (err) {
            setToast({ open: true, type: "error", message: err.normalizedMessage || "Registration failed." });
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div
            className="page page--center"
            style={{
                padding: 24,
                color: COLORS.text,
            }}
        >
            <div
                className="card card--auth"
                style={{
                    minWidth: 360,
                    background: COLORS.pine,
                    border: `1px solid ${COLORS.border}`,
                    borderRadius: 14,
                    padding: 18,
                    boxShadow: "0 12px 28px rgba(0,0,0,0.35)",
                }}
            >
                <h1
                    style={{
                        margin: 0,
                        background: `linear-gradient(135deg, ${COLORS.yellow} 0%, ${COLORS.lime} 60%)`,
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                    }}
                >
                    Create {role === "owner" ? "Owner" : "User"} Account
                </h1>
                <p className="muted" style={{ color: COLORS.textMuted, marginTop: 6 }}>
                    Register to {role === "owner" ? "manage stations and payouts." : "start booking stations."}
                </p>

                {/* Role switch */}
                <div
                    style={{
                        display: "flex",
                        gap: 8,
                        marginTop: 8,
                        background: COLORS.moss,
                        border: `1px solid ${COLORS.border}`,
                        borderRadius: 12,
                        padding: 6,
                    }}
                >
                    {["user", "owner"].map((r) => {
                        const active = role === r;
                        return (
                            <button
                                key={r}
                                type="button"
                                onClick={() => setRole(r)}
                                disabled={submitting}
                                style={{
                                    flex: 1,
                                    padding: "0.55rem",
                                    background: active
                                        ? `linear-gradient(135deg, ${COLORS.yellow} 0%, ${COLORS.lime} 80%)`
                                        : COLORS.pine,
                                    color: active ? "#0b0b0b" : COLORS.text,
                                    border: `1px solid ${active ? "transparent" : COLORS.border}`,
                                    borderRadius: 10,
                                    cursor: "pointer",
                                    transition: "transform 0.15s ease, filter 0.15s ease",
                                    fontWeight: 700,
                                }}
                                onMouseOver={(e) => {
                                    e.currentTarget.style.transform = "translateY(-2px)";
                                    e.currentTarget.style.filter = "brightness(1.05)";
                                }}
                                onMouseOut={(e) => {
                                    e.currentTarget.style.transform = "translateY(0px)";
                                    e.currentTarget.style.filter = "brightness(1)";
                                }}
                            >
                                {r === "user" ? "User" : "Owner"}
                            </button>
                        );
                    })}
                </div>

                <form onSubmit={onSubmit} className="form ge-form" style={{ marginTop: 16, display: "grid", gap: 10 }}>
                    {/* Role-specific name */}
                    {role === "user" ? (
                        <>
                            <label htmlFor="name">Full Name</label>
                            <input
                                id="name"
                                name="name"
                                type="text"
                                placeholder="Your name"
                                value={form.name}
                                onChange={onChange}
                                disabled={submitting}
                                required
                                style={inputStyle()}
                                className="ge-input"
                            />
                        </>
                    ) : (
                        <>
                            <label htmlFor="displayName">Owner Name / Business Name</label>
                            <input
                                id="displayName"
                                name="displayName"
                                type="text"
                                placeholder="Demo User / Station Co."
                                value={form.displayName}
                                onChange={onChange}
                                disabled={submitting}
                                required
                                style={inputStyle()}
                                className="ge-input"
                            />
                        </>
                    )}

                    {/* Email */}
                    <label htmlFor="email" style={{ marginTop: 12 }}>
                        Email
                    </label>
                    <input
                        id="email"
                        name="email"
                        type="email"
                        placeholder={role === "owner" ? "owner@example.com" : "you@example.com"}
                        value={form.email}
                        onChange={onChange}
                        disabled={submitting}
                        required
                        autoComplete="email"
                        style={inputStyle()}
                        className="ge-input"
                    />

                    {/* Phone */}
                    {role === "user" ? (
                        <>
                            <label htmlFor="phone" style={{ marginTop: 12 }}>
                                Phone (optional)
                            </label>
                            <input
                                id="phone"
                                name="phone"
                                type="tel"
                                placeholder="+911234567890"
                                value={form.phone}
                                onChange={onChange}
                                disabled={submitting}
                                style={inputStyle()}
                                className="ge-input"
                            />
                        </>
                    ) : (
                        <>
                            <label htmlFor="ownerPhone" style={{ marginTop: 12 }}>
                                Phone Number
                            </label>
                            <input
                                id="ownerPhone"
                                name="ownerPhone"
                                type="tel"
                                placeholder="+911234567890"
                                value={form.ownerPhone}
                                onChange={onChange}
                                disabled={submitting}
                                required
                                style={inputStyle()}
                                className="ge-input"
                            />
                        </>
                    )}

                    {/* Password */}
                    <label htmlFor="password" style={{ marginTop: 12 }}>
                        Password
                    </label>
                    <input
                        id="password"
                        name="password"
                        type="password"
                        placeholder="Choose a secure password"
                        value={form.password}
                        onChange={onChange}
                        disabled={submitting}
                        required
                        autoComplete="new-password"
                        style={inputStyle()}
                        className="ge-input"
                    />

                    <button
                        type="submit"
                        disabled={submitting}
                        style={{
                            marginTop: 16,
                            padding: "10px 14px",
                            borderRadius: 12,
                            color: "#0b0b0b",
                            background: `linear-gradient(135deg, ${COLORS.yellow} 0%, ${COLORS.lime} 85%)`,
                            border: "1px solid rgba(0,0,0,.15)",
                            cursor: submitting ? "not-allowed" : "pointer",
                            boxShadow: "0 12px 26px rgba(0,0,0,0.35)",
                            transition: "transform 0.15s ease, box-shadow 0.15s ease, filter 0.15s ease",
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: 8,
                            fontWeight: 800,
                        }}
                        onMouseOver={(e) => {
                            if (submitting) return;
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
                        {submitting ? <Spinner size={16} /> : `Create ${role === "owner" ? "Owner" : "User"} Account`}
                    </button>

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
                </form>
            </div>

            {toast.open && (
                <Toast type={toast.type} onClose={onCloseToast}>
                    {toast.message}
                </Toast>
            )}
        </div>
    );
}

// Shared input style helper
function inputStyle() {
    return {
        width: "100%",
        padding: 10,
        background: COLORS.moss,
        color: COLORS.text,
        border: `1px solid ${COLORS.border}`,
        borderRadius: 12,
        outline: "none",
    };
}
