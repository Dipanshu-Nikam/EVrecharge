// src/features/users/pages/Profile.jsx
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../../context/AuthProvider";
import http from "../../../utils/http";
import Spinner from "../../../components/Spinner";
import Toast from "../../../components/Toast";

// Timestamp helpers
function toISO(v) {
    if (!v) return null;
    try {
        if (typeof v === "object") {
            if ("_seconds" in v) return new Date(v._seconds * 1000).toISOString();
            if ("seconds" in v) return new Date(v.seconds * 1000).toISOString();
        }
        const d =
            typeof v === "string" || typeof v === "number" ? new Date(v) : v;
        return d instanceof Date && !isNaN(d) ? d.toISOString() : null;
    } catch {
        return null;
    }
}
function formatWhen(v) {
    const iso = toISO(v);
    return iso ? new Date(iso).toLocaleString() : "-";
}
const pick = (...vals) => {
    for (const v of vals) if (v !== undefined && v !== null && v !== "") return v;
    return null;
};

// Normalize API payloads to one UI shape (user paths)
function normalizeMePayload(payload) {
    if (!payload) return null;

    // /api/users/me => { success, user: {..., profile:{...}} }
    if ("success" in payload && payload.user) {
        const u = payload.user;
        const p = u.profile || {};
        const role = (u.isOwner ? "owner" : (u.role || p.role || "user")).toLowerCase();
        return {
            uid: u.uid || p.uid || null,
            email: pick(u.email, p.email, "-"),
            name: pick(p.name, u.displayName, "-"),
            role,
            isOwner: role === "owner",
            createdAt: toISO(p.createdAt) || toISO(u.createdAt),
            photoURL: p.photoURL || null,
            phone: pick(p.phone, u.phoneNumber),
            raw: payload,
        };
    }

    // /api/auth/me => { ok, uid, email, profile }
    if ("ok" in payload) {
        const p = payload.profile || {};
        const role = (payload.role || p.role || "user").toLowerCase();
        return {
            uid: payload.uid || p.uid || null,
            email: pick(payload.email, p.email, "-"),
            name: pick(p.name, p.displayName, "-"),
            role,
            isOwner: role === "owner",
            createdAt: toISO(p.createdAt),
            photoURL: p.photoURL || null,
            phone: p.phone || null,
            raw: payload,
        };
    }

    // Fallback
    const role = (payload.role || "user").toLowerCase();
    return {
        uid: payload.uid || null,
        email: payload.email || "-",
        name: pick(payload.name, payload.displayName, "-"),
        role,
        isOwner: role === "owner",
        createdAt: toISO(payload.createdAt),
        photoURL: payload.photoURL || null,
        phone: payload.phone || null,
        raw: payload,
    };
}

export default function Profile() {
    const { user: authUser, logout } = useAuth();
    const [profile, setProfile] = useState(null);
    const [owner, setOwner] = useState(null);
    const [loading, setLoading] = useState(false);
    const [toast, setToast] = useState({ open: false, type: "info", message: "" });

    const [editing, setEditing] = useState(false);
    const [form, setForm] = useState({ name: "", phone: "" });
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);

    const onCloseToast = () => setToast((t) => ({ ...t, open: false }));

    const ui = useMemo(() => {
        const base =
            profile ||
            (authUser && {
                uid: authUser.uid,
                email: authUser.email || "-",
                name: pick(authUser.name, authUser.displayName, "-"),
                role: (authUser.role || "user").toLowerCase(),
                isOwner: (authUser.role || "user").toLowerCase() === "owner",
                createdAt: toISO(authUser.createdAt),
                photoURL: authUser.photoURL || null,
                phone: authUser.phoneNumber || null,
            }) ||
            null;

        if (!base) return null;
        if (owner) {
            return {
                ...base,
                name: pick(owner.displayName, base.name),
                phone: pick(owner.phone, base.phone),
                ownerVerified: !!owner.verified,
                ownerTotals: owner.totals || null,
                ownerCreatedAt: toISO(owner.createdAt),
            };
        }
        return base;
    }, [profile, owner, authUser]);

    async function fetchMe() {
        try {
            setLoading(true);

            // Owners: use /owners/me
            const sessionRole = (authUser?.role || (authUser?.isOwner ? "owner" : "user")).toLowerCase();
            if (sessionRole === "owner") {
                const o = await http.get("/owners/me");
                setOwner({
                    displayName: pick(o.data?.displayName, o.data?.name),
                    phone: o.data?.phone ?? null,
                    verified: !!o.data?.verified,
                    totals: o.data?.totals || null,
                    createdAt: toISO(o.data?.createdAt),
                });
                setProfile({
                    uid: o.data?.uid || null,
                    email: o.data?.email || "-",
                    name: pick(o.data?.displayName, o.data?.name, "-"),
                    role: "owner",
                    isOwner: true,
                    createdAt: toISO(o.data?.createdAt),
                    photoURL: null,
                    phone: o.data?.phone ?? null,
                    raw: o.data,
                });
                setForm({
                    name: pick(o.data?.displayName, o.data?.name, ""),
                    phone: o.data?.phone ?? "",
                });
                localStorage.setItem(
                    "auth_user",
                    JSON.stringify({
                        uid: o.data?.uid || null,
                        email: o.data?.email || "-",
                        name: pick(o.data?.displayName, o.data?.name, "-"),
                        role: "owner",
                        isOwner: true,
                        createdAt: toISO(o.data?.createdAt),
                        phone: o.data?.phone ?? null,
                    })
                );
                return;
            }

            // Users: /users/me else /auth/me
            let res;
            try {
                res = await http.get("/users/me");
            } catch {
                res = await http.get("/auth/me");
            }
            let norm = normalizeMePayload(res.data);

            if ("ok" in res.data && !res.data.profile) {
                try {
                    const u = await http.get("/users/me");
                    norm = normalizeMePayload(u.data) || norm;
                } catch { }
            }

            setProfile(norm);
            setForm({ name: norm?.name ?? "", phone: norm?.phone ?? "" });
            localStorage.setItem("auth_user", JSON.stringify(norm));
            setOwner(null);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                await fetchMe();
            } catch (err) {
                if (!cancelled) {
                    setToast({
                        open: true,
                        type: "error",
                        message: err?.response?.data?.error || err?.message || "Failed to load profile",
                    });
                }
            }
        })();
        return () => {
            cancelled = true;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleRefresh = async () => {
        try {
            await fetchMe();
            setToast({ open: true, type: "success", message: "Profile refreshed" });
        } catch (err) {
            setToast({
                open: true,
                type: "error",
                message: err?.response?.data?.error || err?.message || "Refresh failed",
            });
        }
    };

    const handleSave = async (e) => {
        e?.preventDefault?.();
        try {
            setSaving(true);
            const updates = {};
            if ((form.name || "") !== (ui?.name || "")) updates.name = form.name || null;
            if ((form.phone || "") !== (ui?.phone || "")) updates.phone = form.phone || null;

            if (Object.keys(updates).length === 0) {
                setEditing(false);
                return;
            }

            if (ui?.isOwner) {
                const ownerPatch = {};
                if ("name" in updates) ownerPatch.displayName = updates.name;
                if ("phone" in updates) ownerPatch.phone = updates.phone;
                await http.put("/owners/profile", ownerPatch);
            } else {
                try {
                    await http.put("/auth/profile", updates);
                } catch {
                    await http.patch("/users/me", updates);
                }
            }

            await handleRefresh();
            setEditing(false);
            setToast({ open: true, type: "success", message: "Profile updated" });
        } catch (err) {
            setToast({
                open: true,
                type: "error",
                message: err?.response?.data?.error || err?.message || "Update failed",
            });
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!ui || ui.role !== "user") return;
        if (!confirm("Are you sure you want to delete your account? This cannot be undone.")) return;
        try {
            setDeleting(true);
            await http.delete("/auth/account");
            await logout();
            setToast({ open: true, type: "success", message: "Account deleted" });
        } catch (err) {
            setToast({
                open: true,
                type: "error",
                message: err?.response?.data?.error || err?.message || "Delete failed",
            });
        } finally {
            setDeleting(false);
        }
    };

    const handleLogout = async () => {
        await logout();
        setToast({ open: true, type: "success", message: "Logged out" });
    };

    // UI
    const text = "var(--oc-text)";
    const muted = "var(--oc-muted)";
    const card = "var(--oc-card)";
    const border = "var(--oc-border)";

    if (!ui) {
        return (
            <div className="page" style={{ maxWidth: 720, margin: "0 auto", padding: 24 }}>
                <h1 className="title-xl" style={{ color: text, marginTop: 0 }}>My Profile</h1>
                <div className="card glass" style={{
                    padding: 16, marginTop: 12, border: `1px solid ${border}`,
                    background: `linear-gradient(180deg, ${card}, #0f1a12)`
                }}>
                    <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                        <Spinner />
                        <span>Loading profile…</span>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="page" style={{ maxWidth: 720, margin: "0 auto", padding: 24 }}>
            <h1 className="title-xl" style={{ color: text, marginTop: 0 }}>My Profile</h1>

            <div className="card glass" style={{
                padding: 16, marginTop: 12, borderRadius: 14,
                border: `1px solid ${border}`,
                background:
                    `linear-gradient(180deg, ${card}, #0f1a12),` +
                    `radial-gradient(520px 200px at 8% -20%, rgba(255,252,48,.10), transparent 70%)`
            }}>
                {loading ? (
                    <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                        <Spinner />
                        <span>Loading profile…</span>
                    </div>
                ) : (
                    <>
                        {!editing ? (
                            <>
                                <div style={{ display: "grid", gridTemplateColumns: "160px 1fr", gap: 12 }}>
                                    <div className="muted" style={{ color: muted }}>Name</div>
                                    <div style={{ color: text }}>{ui.name || "-"}</div>

                                    <div className="muted" style={{ color: muted }}>Email</div>
                                    <div style={{ color: text }}>{ui.email || "-"}</div>

                                    <div className="muted" style={{ color: muted }}>Role</div>
                                    <div style={{ color: text }}>{ui.isOwner ? "owner" : ui.role || "user"}</div>

                                    <div className="muted" style={{ color: muted }}>Member since</div>
                                    <div style={{ color: text }}>{formatWhen(ui.createdAt || ui.ownerCreatedAt)}</div>

                                    <div className="muted" style={{ color: muted }}>Phone</div>
                                    <div style={{ color: text }}>{ui.phone || "-"}</div>

                                    {ui.isOwner && (
                                        <>
                                            <div className="muted" style={{ color: muted }}>Owner Verified</div>
                                            <div style={{ color: text }}>{ui.ownerVerified ? "Yes" : "No"}</div>

                                            {ui.ownerTotals && (
                                                <>
                                                    <div className="muted" style={{ color: muted }}>Total Income</div>
                                                    <div style={{ color: text }}>{ui.ownerTotals.totalIncome ?? 0}</div>

                                                    <div className="muted" style={{ color: muted }}>Total Expense</div>
                                                    <div style={{ color: text }}>{ui.ownerTotals.totalExpense ?? 0}</div>

                                                    <div className="muted" style={{ color: muted }}>Balance</div>
                                                    <div style={{ color: text }}>{ui.ownerTotals.balance ?? 0}</div>
                                                </>
                                            )}
                                        </>
                                    )}
                                </div>

                                <div style={{ display: "flex", gap: 8, marginTop: 16, flexWrap: "wrap" }}>
                                    <button
                                        onClick={() => setEditing(true)}
                                        className="btn-secondary"
                                        style={{
                                            color: "#0b0b0b",
                                            background: "linear-gradient(135deg, var(--spring-aqua,#4FE0CB), var(--spring-lime,#89F336))",
                                            border: "1px solid rgba(0,0,0,.15)",
                                            fontWeight: 700,
                                            borderRadius: 10,
                                            padding: "8px 14px"
                                        }}
                                    >
                                        Edit
                                    </button>
                                    <button className="btn-secondary" onClick={handleRefresh}>
                                        Refresh
                                    </button>
                                    <button onClick={handleLogout}>Logout</button>
                                    {ui.role === "user" && (
                                        <button onClick={handleDelete} className="btn-danger" disabled={deleting}>
                                            {deleting ? "Deleting…" : "Delete Account"}
                                        </button>
                                    )}
                                </div>
                            </>
                        ) : (
                            <form onSubmit={handleSave}>
                                <div style={{ display: "grid", gridTemplateColumns: "160px 1fr", gap: 12 }}>
                                    <label className="muted" htmlFor="name" style={{ color: muted }}>
                                        Name
                                    </label>
                                    <input
                                        id="name"
                                        type="text"
                                        value={form.name}
                                        onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                                        placeholder="Your name"
                                        style={{
                                            padding: "10px 12px",
                                            borderRadius: 10,
                                            border: `1px solid ${border}`,
                                            background: "var(--oc-input,#162b1b)",
                                            color: text
                                        }}
                                    />

                                    <label className="muted" htmlFor="phone" style={{ color: muted }}>
                                        Phone
                                    </label>
                                    <input
                                        id="phone"
                                        type="tel"
                                        value={form.phone}
                                        onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                                        placeholder="Optional phone number"
                                        style={{
                                            padding: "10px 12px",
                                            borderRadius: 10,
                                            border: `1px solid ${border}`,
                                            background: "var(--oc-input,#162b1b)",
                                            color: text
                                        }}
                                    />
                                </div>

                                <div style={{ display: "flex", gap: 8, marginTop: 16, flexWrap: "wrap" }}>
                                    <button type="submit" disabled={saving} className="btn-primary" style={{ fontWeight: 700 }}>
                                        {saving ? <Spinner size={14} /> : "Save"}
                                    </button>
                                    <button
                                        type="button"
                                        className="btn-secondary"
                                        onClick={() => setEditing(false)}
                                    >
                                        Cancel
                                    </button>
                                    <button type="button" className="btn-secondary" onClick={handleRefresh}>
                                        Refresh
                                    </button>
                                </div>
                            </form>
                        )}
                    </>
                )}
            </div>

            {toast.open && (
                <Toast type={toast.type} onClose={onCloseToast}>
                    {toast.message}
                </Toast>
            )}
        </div>
    );
}
