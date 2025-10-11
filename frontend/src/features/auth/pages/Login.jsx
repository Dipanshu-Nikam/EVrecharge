// src/features/auth/pages/Login.jsx
import React, { useState } from "react";
import { useAuth } from "../../../context/AuthProvider";
import { useNavigate, Link } from "react-router-dom";

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

const Login = () => {
    const { login, loading, error } = useAuth();
    const navigate = useNavigate();

    const [form, setForm] = useState({ email: "", password: "" });
    const [role, setRole] = useState("user"); // "user" | "owner" | "admin"

    const handleChange = (e) => {
        setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const ok = await login(role, form);
        if (!ok) return;
        // login() handles redirect based on role
    };

    // Role-aware links
    const registerHref = role === "owner" ? "/auth/register" : role === "user" ? "/auth/register" : null;

    // Forgot password (only user)
    const resetEnabled = role === "user";
    const resetHref = resetEnabled ? "/auth/forgot-password" : null;

    return (
        <div
            className="login-page"
            style={{
                padding: "2rem",
                maxWidth: 460,
                margin: "56px auto",
                color: COLORS.text,
            }}
        >
            {/* Header */}
            <header
                className="card glass"
                style={{
                    padding: 16,
                    borderRadius: 16,
                    border: `1px solid ${COLORS.border}`,
                    background:
                        `linear-gradient(180deg, ${COLORS.leaf}, ${COLORS.forest}),` +
                        `radial-gradient(480px 180px at 6% -20%, rgba(255,252,48,.14), transparent 70%)`,
                    color: COLORS.text,
                    marginBottom: 14,
                }}
            >
                <h2
                    style={{
                        margin: 0,
                        background: `linear-gradient(135deg, ${COLORS.yellow} 0%, ${COLORS.lime} 60%)`,
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                    }}
                >
                    Login
                </h2>
                <p className="muted small" style={{ color: COLORS.textMuted, marginTop: 6 }}>
                    Choose a role and sign in to continue.
                </p>
            </header>

            {/* Role Switch */}
            <div
                style={{
                    display: "flex",
                    gap: 8,
                    marginBottom: 16,
                    background: COLORS.pine,
                    border: `1px solid ${COLORS.border}`,
                    borderRadius: 12,
                    padding: 6,
                    boxShadow: "0 10px 24px rgba(0,0,0,0.35)",
                }}
            >
                {["user", "owner", "admin"].map((r) => {
                    const active = role === r;
                    return (
                        <button
                            key={r}
                            onClick={() => setRole(r)}
                            style={{
                                flex: 1,
                                padding: "0.6rem 0.5rem",
                                background: active
                                    ? `linear-gradient(135deg, ${COLORS.yellow} 0%, ${COLORS.lime} 70%)`
                                    : COLORS.moss,
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
                            {r.charAt(0).toUpperCase() + r.slice(1)}
                        </button>
                    );
                })}
            </div>

            <form
                onSubmit={handleSubmit}
                className="ge-form"
                style={{
                    background: COLORS.pine,
                    border: `1px solid ${COLORS.border}`,
                    borderRadius: 14,
                    padding: 16,
                    boxShadow: "0 12px 28px rgba(0,0,0,0.35)",
                }}
            >
                <div style={{ marginBottom: 12 }}>
                    <label style={{ display: "block", marginBottom: 6, color: COLORS.textMuted }}>Email</label>
                    <input
                        type="email"
                        name="email"
                        value={form.email}
                        onChange={handleChange}
                        required
                        placeholder="name@example.com"
                        style={inputStyle()}
                        className="ge-input"
                    />
                </div>

                <div style={{ marginBottom: 12 }}>
                    <label style={{ display: "block", marginBottom: 6, color: COLORS.textMuted }}>Password</label>
                    <input
                        type="password"
                        name="password"
                        value={form.password}
                        onChange={handleChange}
                        required
                        placeholder="••••••••"
                        style={inputStyle()}
                        className="ge-input"
                    />
                </div>

                {error && (
                    <div style={{ marginBottom: 12, color: "#fca5a5" }}>
                        {typeof error === "string" ? error : error?.message}
                    </div>
                )}

                <button
                    type="submit"
                    disabled={loading}
                    style={{
                        width: "100%",
                        padding: "0.85rem",
                        background: `linear-gradient(135deg, ${COLORS.yellow} 0%, ${COLORS.lime} 85%)`,
                        color: "#0b0b0b",
                        border: "1px solid rgba(0,0,0,.15)",
                        borderRadius: 12,
                        cursor: loading ? "not-allowed" : "pointer",
                        boxShadow: "0 12px 26px rgba(0,0,0,0.35)",
                        transition: "transform 0.15s ease, box-shadow 0.15s ease, filter 0.15s ease",
                        fontWeight: 800,
                    }}
                    onMouseOver={(e) => {
                        if (loading) return;
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
                    {loading ? "Logging in…" : `Login as ${role}`}
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

            {/* Footer links */}
            <div style={{ marginTop: 20, textAlign: "center" }}>
                {registerHref ? (
                    <Link
                        to={registerHref}
                        style={{ color: COLORS.aqua, textDecoration: "none", fontWeight: 600 }}
                        onMouseOver={(e) => (e.currentTarget.style.color = COLORS.lime)}
                        onMouseOut={(e) => (e.currentTarget.style.color = COLORS.aqua)}
                    >
                        Don’t have an account?
                    </Link>
                ) : (
                    <span style={{ opacity: 0.5, cursor: "not-allowed", color: COLORS.textMuted }}>
                        Don’t have an account?
                    </span>
                )}
                <br />
                {resetEnabled ? (
                    <Link
                        to={resetHref}
                        style={{ color: COLORS.aqua, textDecoration: "none", fontWeight: 600 }}
                        onMouseOver={(e) => (e.currentTarget.style.color = COLORS.lime)}
                        onMouseOut={(e) => (e.currentTarget.style.color = COLORS.aqua)}
                    >
                        Forgot password?
                    </Link>
                ) : (
                    <span style={{ opacity: 0.5, cursor: "not-allowed", color: COLORS.textMuted }}>
                        Forgot password?
                    </span>
                )}
            </div>
        </div>
    );
};

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

export default Login;
