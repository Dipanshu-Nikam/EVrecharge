// src/features/admin/pages/AdminUsers.jsx
import { useEffect, useMemo, useState } from "react";
import http from "../../../utils/http";
import Spinner from "../../../components/Spinner";
import Toast from "../../../components/Toast";

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
    danger: "#fda4af",
    dangerBg: "rgba(253,164,175,.15)",
    dangerBorder: "rgba(253,164,175,.35)",
};

export default function AdminUsers() {
    const [q, setQ] = useState("");
    // Removed dropdowns: keep server-side defaults (no role/status constraints)
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);

    // pagination: limit/offset (controller returns { users, count })
    const LIMIT = 20;
    const [offset, setOffset] = useState(0);
    const [hasMore, setHasMore] = useState(false);

    const [busyId, setBusyId] = useState(null);
    const [toast, setToast] = useState({ open: false, type: "info", message: "" });
    const onCloseToast = () => setToast((t) => ({ ...t, open: false }));

    // backend query params — only paging now
    const listParams = useMemo(() => {
        return { limit: LIMIT, offset };
    }, [offset]);

    async function load({ append = false } = {}) {
        try {
            setLoading(true);
            const res = await http.get("/admin/users", { params: listParams });
            const data = res.data || {};
            const users = Array.isArray(data) ? data : data.users || [];
            const got = users.length;
            setItems((prev) => (append ? [...prev, ...users] : users));
            setHasMore(got === LIMIT);
        } catch (err) {
            setToast({ open: true, type: "error", message: err?.response?.data?.error || err.message || "Failed to load users" });
        } finally {
            setLoading(false);
        }
    }

    // fetch on paging change
    useEffect(() => {
        load({ append: offset > 0 });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [offset]);

    function getId(u) {
        return u.id || u._id;
    }

    // ---- Actions ----
    async function toggleActive(u) {
        const id = getId(u);
        if (!id) return;
        try {
            setBusyId(id);
            const currentStatus = (u.status || (u.active === false ? "inactive" : "active")).toLowerCase();
            const nextStatus = currentStatus === "active" ? "inactive" : "active";
            await http.patch(`/admin/users/${encodeURIComponent(id)}`, { status: nextStatus });
            setItems((prev) => prev.map((x) => (getId(x) === id ? { ...x, status: nextStatus, active: nextStatus === "active" } : x)));
            setToast({ open: true, type: "success", message: nextStatus === "active" ? "User activated" : "User deactivated" });
        } catch (err) {
            setToast({ open: true, type: "error", message: err?.response?.data?.error || err.message || "Update failed" });
        } finally {
            setBusyId(null);
        }
    }

    async function makeRole(u, role) {
        const id = getId(u);
        if (!id) return;
        try {
            setBusyId(id);
            await http.patch(`/admin/users/${encodeURIComponent(id)}`, { role });
            setItems((prev) => prev.map((x) => (getId(x) === id ? { ...x, role } : x)));
            setToast({ open: true, type: "success", message: `Role set to ${role}` });
        } catch (err) {
            setToast({ open: true, type: "error", message: err?.response?.data?.error || err.message || "Role update failed" });
        } finally {
            setBusyId(null);
        }
    }

    async function banUser(u) {
        const id = getId(u);
        if (!id) return;
        if (!confirm("Ban this user?")) return;
        try {
            setBusyId(id);
            await http.post(`/admin/users/${encodeURIComponent(id)}/ban`, { reason: "Policy violation" });
            setItems((prev) => prev.map((x) => (getId(x) === id ? { ...x, status: "banned", active: false } : x)));
            setToast({ open: true, type: "success", message: "User banned" });
        } catch (err) {
            setToast({ open: true, type: "error", message: err?.response?.data?.error || err.message || "Ban failed" });
        } finally {
            setBusyId(null);
        }
    }

    // client-side quick filter for q (name/email)
    const filtered = useMemo(() => {
        if (!q.trim()) return items;
        const s = q.trim().toLowerCase();
        return items.filter((u) => {
            const name = String(u.name || u.fullName || "").toLowerCase();
            const email = String(u.email || "").toLowerCase();
            return name.includes(s) || email.includes(s);
        });
    }, [items, q]);

    function loadMore() {
        if (hasMore && !loading) setOffset((o) => o + LIMIT);
    }

    return (
        <div className="page" style={{ maxWidth: 1200, margin: "0 auto", padding: 24, color: COLORS.text }}>
            {/* Header */}
            <header
                className="card glass"
                style={{
                    padding: 16,
                    borderRadius: 16,
                    border: `1px solid ${COLORS.border}`,
                    background:
                        `linear-gradient(180deg, ${COLORS.leaf}, ${COLORS.forest}),` +
                        `radial-gradient(720px 260px at 6% -20%, rgba(255,252,48,.14), transparent 70%)`,
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
                    Admin · Users
                </h1>
            </header>

            {/* Filters (no dropdowns) */}
            <div
                style={{
                    display: "flex",
                    gap: 8,
                    marginTop: 12,
                    flexWrap: "wrap",
                    background: COLORS.pine,
                    border: `1px solid ${COLORS.border}`,
                    borderRadius: 12,
                    padding: 10,
                }}
            >
                <input
                    type="search"
                    placeholder="Search by name or email… (client-side)"
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && load({ append: false })}
                    style={inputStyle({ minWidth: 280 })}
                    className="ge-input"
                />
                <button
                    onClick={() => { setOffset(0); load({ append: false }); }}
                    disabled={loading}
                    style={primaryBtn()}
                >
                    {loading ? <Spinner size={16} /> : "Apply"}
                </button>

                {/* Input theme */}
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

            {/* Table */}
            <div
                className="card"
                style={{
                    padding: 0,
                    marginTop: 12,
                    background: COLORS.pine,
                    border: `1px solid ${COLORS.border}`,
                    borderRadius: 14,
                    color: COLORS.text,
                    overflow: "hidden",
                }}
            >
                {loading && items.length === 0 ? (
                    <div style={{ padding: 16, display: "flex", gap: 10, alignItems: "center" }}>
                        <Spinner /> <span>Loading…</span>
                    </div>
                ) : filtered.length === 0 ? (
                    <div style={{ padding: 16, color: COLORS.textMuted }}>No users found.</div>
                ) : (
                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                        <thead style={{ background: COLORS.moss }}>
                            <tr style={{ textAlign: "left" }}>
                                <th style={thStyle()}>Name</th>
                                <th style={thStyle()}>Email</th>
                                <th style={thStyle()}>Role</th>
                                <th style={thStyle()}>Status</th>
                                <th style={thStyle()}>Joined</th>
                                <th style={thStyle({ width: 280 })}></th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map((u, i) => {
                                const id = getId(u);
                                const name = u.name || u.fullName || "-";
                                const email = u.email || "-";
                                const role = (u.role || u.type || "user").toLowerCase();
                                const status = (u.status || (u.active === false ? "inactive" : "active")).toLowerCase();
                                const joined =
                                    u.createdAt
                                        ? (typeof u.createdAt === "string" ? new Date(u.createdAt) : new Date(u.createdAt)).toLocaleString()
                                        : "-";

                                const badge = badgeStyles(status);

                                return (
                                    <tr key={id} style={{ borderTop: i === 0 ? "none" : `1px solid ${COLORS.border}` }}>
                                        <td style={tdStyle({ fontWeight: 700 })}>{name}</td>
                                        <td style={tdStyle()}>{email}</td>
                                        <td style={tdStyle({ textTransform: "capitalize" })}>{role}</td>
                                        <td style={tdStyle()}>
                                            <span
                                                className="small"
                                                style={{
                                                    padding: "2px 8px",
                                                    borderRadius: 999,
                                                    background: badge.bg,
                                                    color: badge.color,
                                                    border: badge.border,
                                                    fontWeight: 700,
                                                }}
                                            >
                                                {status}
                                            </span>
                                        </td>
                                        <td style={tdStyle()}>{joined}</td>
                                        <td style={tdStyle()}>
                                            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", flexWrap: "wrap" }}>
                                                <button
                                                    onClick={() => toggleActive(u)}
                                                    disabled={busyId === id || status === "banned"}
                                                    title={status === "active" ? "Deactivate" : "Activate"}
                                                    style={ghostBtn()}
                                                >
                                                    {busyId === id ? <Spinner size={14} /> : status === "active" ? "Deactivate" : "Activate"}
                                                </button>

                                                <RoleMenu u={u} set={(r) => makeRole(u, r)} busy={busyId === id} />

                                                <button
                                                    onClick={() => banUser(u)}
                                                    disabled={busyId === id || status === "banned"}
                                                    title="Ban user"
                                                    style={dangerBtn()}
                                                >
                                                    {busyId === id ? <Spinner size={14} /> : "Ban"}
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                )}
            </div>

            {hasMore && (
                <div style={{ marginTop: 12 }}>
                    <button onClick={loadMore} disabled={loading} style={primaryBtn()}>
                        {loading ? <Spinner size={16} /> : "Load more"}
                    </button>
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

function RoleMenu({ u, set, busy }) {
    const current = (u.role || u.type || "user").toLowerCase();
    const roles = ["user", "owner", "admin"];
    return (
        <div style={{ position: "relative" }}>
            <select
                value={current}
                onChange={(e) => set(e.target.value)}
                disabled={busy}
                aria-label="Change role"
                style={inputStyle()}
                className="ge-input"
            >
                {roles.map((r) => (
                    <option key={r} value={r}>
                        {r}
                    </option>
                ))}
            </select>
        </div>
    );
}

/* UI helpers */
function inputStyle(extra = {}) {
    return {
        padding: "8px 10px",
        borderRadius: 10,
        background: COLORS.moss,
        color: COLORS.text,
        border: `1px solid ${COLORS.border}`,
        outline: "none",
        ...extra,
    };
}
function thStyle(extra = {}) {
    return {
        padding: "10px 16px",
        color: COLORS.textMuted,
        fontWeight: 700,
        ...extra,
    };
}
function tdStyle(extra = {}) {
    return {
        padding: "10px 16px",
        ...extra,
    };
}
function badgeStyles(status) {
    const st = (status || "").toLowerCase();
    if (st === "active")
        return { bg: "rgba(137,243,54,.12)", color: "#1f7a36", border: "1px solid rgba(137,243,54,.45)" };
    if (st === "banned")
        return { bg: COLORS.dangerBg, color: "#991b1b", border: `1px solid ${COLORS.dangerBorder}` };
    if (st === "inactive")
        return { bg: "rgba(255,252,48,.12)", color: "#7a6f00", border: "1px solid rgba(255,252,48,.35)" };
    return { bg: "rgba(79,224,203,.12)", color: "#1a6b63", border: "1px solid rgba(79,224,203,.35)" };
}
function primaryBtn() {
    return {
        padding: "10px 14px",
        borderRadius: 12,
        color: "#0b0b0b",
        background: `linear-gradient(135deg, ${COLORS.yellow} 0%, ${COLORS.lime} 85%)`,
        border: "1px solid rgba(0,0,0,.15)",
        cursor: "pointer",
        boxShadow: "0 12px 26px rgba(0,0,0,0.35)",
        fontWeight: 800,
        transition: "transform 0.15s ease, box-shadow 0.15s ease, filter 0.15s ease",
    };
}
function ghostBtn() {
    return {
        padding: "8px 12px",
        borderRadius: 10,
        color: COLORS.text,
        background: COLORS.moss,
        border: `1px solid ${COLORS.border}`,
        cursor: "pointer",
        fontWeight: 700,
    };
}
function dangerBtn() {
    return {
        padding: "8px 12px",
        borderRadius: 10,
        color: COLORS.danger,
        background: COLORS.dangerBg,
        border: `1px solid ${COLORS.dangerBorder}`,
        cursor: "pointer",
        fontWeight: 800,
    };
}
