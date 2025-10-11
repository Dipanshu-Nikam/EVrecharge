// src/features/owner/pages/StationForm.jsx
import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import http from "../../../utils/http";
import Spinner from "../../../components/Spinner";
import Toast from "../../../components/Toast";

const ACCEPT_TYPES = ["image/jpeg", "image/png", "image/jpg"];
const MAX_SIZE_MB = 5;

export default function StationForm() {
    const navigate = useNavigate();
    const { state } = useLocation();
    const { stationId: stationIdParam } = useParams();

    const editId = state?.editId || stationIdParam || null;

    const [loading, setLoading] = useState(!!editId);
    const [saving, setSaving] = useState(false);
    const [toast, setToast] = useState({ open: false, type: "info", message: "" });
    const onCloseToast = () => setToast((t) => ({ ...t, open: false }));

    const [form, setForm] = useState({
        name: "",
        address: "",
        lat: "",
        lng: "",
        pricePerKwh: "",
        active: true,
        sockets: [{ type: "CCS2", power: 30, count: 1 }],
        amenities: ["Parking"],
        phone: "",
        hours: "",
    });

    const [files, setFiles] = useState([]);
    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        let ignore = false;
        async function load() {
            if (!editId) return;
            try {
                setLoading(true);
                const res = await http.get(`/stations/${encodeURIComponent(editId)}`);
                if (ignore) return;
                const s = res.data || {};
                setForm({
                    name: s.name || s.title || "",
                    address: s.address || s.formattedAddress || s.location?.address || "",
                    lat: s.lat || s.latitude || s.location?.lat || "",
                    lng: s.lng || s.longitude || s.location?.lng || "",
                    pricePerKwh: s.pricePerKwh ?? s.price ?? s.tariff ?? "",
                    active: s.active ?? true,
                    sockets: normalizeSockets(s.sockets || s.connectors || s.ports || []),
                    amenities: Array.isArray(s.amenities) ? s.amenities : [],
                    phone: s.phone || s.contact || "",
                    hours: s.openHours || s.hours || "",
                });
            } catch (err) {
                setToast({ open: true, type: "error", message: err.message || "Failed to load station" });
            } finally {
                setLoading(false);
            }
        }
        load();
        return () => {
            ignore = true;
        };
    }, [editId]);

    const heading = useMemo(() => (editId ? "Edit Station" : "Add Station"), [editId]);

    function onChange(e) {
        const { name, value, type, checked } = e.target;
        setForm((f) => ({ ...f, [name]: type === "checkbox" ? checked : value }));
    }

    function updateSocket(i, key, value) {
        setForm((f) => {
            const sockets = [...f.sockets];
            sockets[i] = { ...sockets[i], [key]: key === "power" || key === "count" ? num(value) : value };
            return { ...f, sockets };
        });
    }
    function addSocket() {
        setForm((f) => ({ ...f, sockets: [...f.sockets, { type: "", power: 7.4, count: 1 }] }));
    }
    function removeSocket(i) {
        setForm((f) => ({ ...f, sockets: f.sockets.filter((_, idx) => idx !== i) }));
    }

    function onAmenitiesChange(e) {
        const val = e.target.value;
        const list = val.split(",").map((s) => s.trim()).filter(Boolean);
        setForm((f) => ({ ...f, amenities: list }));
    }

    function validateAndPreview(file) {
        if (!ACCEPT_TYPES.includes(file.type)) return { ok: false, error: "Only JPG and PNG are allowed." };
        if (file.size > MAX_SIZE_MB * 1024 * 1024) return { ok: false, error: `Max file size ${MAX_SIZE_MB} MB.` };
        const src = URL.createObjectURL(file);
        return { ok: true, src };
    }
    function onPickFiles(e) {
        const list = Array.from(e.target.files || []);
        const next = [];
        list.forEach((f) => {
            const { ok, src, error } = validateAndPreview(f);
            next.push({ file: f, src, progress: 0, error: ok ? null : error });
        });
        setFiles((prev) => [...prev, ...next]);
        e.target.value = "";
    }
    function removeLocalFile(idx) {
        setFiles((prev) => {
            const copy = [...prev];
            const [removed] = copy.splice(idx, 1);
            if (removed?.src) URL.revokeObjectURL(removed.src);
            return copy;
        });
    }

    async function uploadImages(stationId) {
        if (!files.length) return [];
        setUploading(true);
        const uploaded = [];
        for (let i = 0; i < files.length; i++) {
            const item = files[i];
            if (item.error) continue;
            const formData = new FormData();
            formData.append("image", item.file);
            try {
                const res = await http.post(`/stations/${encodeURIComponent(stationId)}/images`, formData, {
                    headers: { "Content-Type": "multipart/form-data" },
                    onUploadProgress: (evt) => {
                        if (!evt.total) return;
                        const pct = Math.round((evt.loaded * 100) / evt.total);
                        setFiles((prev) => {
                            const cp = [...prev];
                            cp[i] = { ...cp[i], progress: pct };
                            return cp;
                        });
                    },
                });
                uploaded.push(res.data?.url);
            } catch (err) {
                setFiles((prev) => {
                    const cp = [...prev];
                    cp[i] = { ...cp[i], error: err.response?.data?.error || err.message || "Upload failed" };
                    return cp;
                });
            }
        }
        setUploading(false);
        return uploaded;
    }

    async function handleSubmit(e) {
        e.preventDefault();
        if (!form.name.trim()) return showErr("Name is required");
        if (!form.address.trim()) return showErr("Address is required");
        if (!isNum(form.lat) || !isNum(form.lng)) return showErr("Latitude and longitude must be numbers");
        if (form.pricePerKwh === "" || isNaN(Number(form.pricePerKwh))) return showErr("Tariff (price per kWh) must be a number");

        const payload = {
            name: form.name.trim(),
            address: form.address.trim(),
            lat: Number(form.lat),
            lng: Number(form.lng),
            pricePerKwh: Number(form.pricePerKwh),
            active: !!form.active,
            sockets: form.sockets.map((s) => ({
                type: s.type,
                power: Number(s.power),
                count: Number(s.count || 1),
            })),
            amenities: form.amenities,
            phone: form.phone?.trim() || undefined,
            openHours: form.hours?.trim() || undefined,
        };

        try {
            setSaving(true);
            let stationId = editId;

            if (editId) {
                await http.patch(`/stations/${encodeURIComponent(editId)}`, payload);
            } else {
                const res = await http.post("/stations", payload);
                const created = res.data || {};
                stationId = created.id || created._id || created.stationId;
                if (!stationId) setToast({ open: true, type: "warning", message: "Station created but ID not returned; images skipped." });
            }

            if (stationId) {
                const urls = await uploadImages(stationId);
                if (urls.length) setToast({ open: true, type: "success", message: `Uploaded ${urls.length} image(s)` });
            }

            setToast({ open: true, type: "success", message: editId ? "Station updated" : "Station created" });
            setTimeout(() => navigate("/owner/stations"), 500);
        } catch (err) {
            showErr(err.response?.data?.error || err.message || "Save failed");
        } finally {
            setSaving(false);
        }
    }

    function showErr(message) {
        setToast({ open: true, type: "error", message });
    }

    const text = "var(--oc-text)";
    const muted = "var(--oc-muted)";
    const card = "var(--oc-card)";
    const border = "var(--oc-border)";

    return (
        <div className="page" style={{ maxWidth: 900, margin: "0 auto", padding: 24 }}>
            <header
                className="card glass"
                style={{
                    padding: 18,
                    borderRadius: 16,
                    border: `1px solid ${border}`,
                    background:
                        `linear-gradient(180deg, ${card}, #0f1a12),` +
                        `radial-gradient(560px 220px at 6% -20%, rgba(255,252,48,.12), transparent 70%)`,
                    color: text,
                }}
            >
                <h1 className="title-xl" style={{ margin: 0 }}>{heading}</h1>
                <p className="muted" style={{ marginTop: 6, color: muted }}>
                    Enter accurate location and connector details to help drivers find this station easily.
                </p>
            </header>

            {loading ? (
                <div style={{ display: "flex", gap: 10, alignItems: "center", marginTop: 12 }}>
                    <Spinner /> <span>Loading…</span>
                </div>
            ) : (
                <form onSubmit={handleSubmit} className="form form--mint" style={{ marginTop: 12 }}>
                    <div
                        className="card glass"
                        style={{
                            padding: 16,
                            borderRadius: 14,
                            border: `1px solid ${border}`,
                            background:
                                `linear-gradient(180deg, ${card}, #0f1a12),` +
                                `radial-gradient(520px 200px at 8% -20%, rgba(79,224,203,.08), transparent 70%)`,
                            color: text,
                        }}
                    >
                        <SectionTitle title="Station Basics" hint="Name and address that users will see in search results." />
                        <label htmlFor="name">Station Name</label>
                        <input id="name" name="name" type="text" value={form.name} onChange={onChange} required style={inputStyle()} placeholder="e.g., Mumbai EV Hub" />

                        <label htmlFor="address" style={{ marginTop: 12 }}>Address</label>
                        <input id="address" name="address" type="text" value={form.address} onChange={onChange} required style={inputStyle()} placeholder="Street, Area, City, State" />

                        <SectionTitle title="Location" hint="Provide coordinates for accurate map placement." />
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                            <div>
                                <label htmlFor="lat">Latitude</label>
                                <input id="lat" name="lat" type="number" step="any" value={form.lat} onChange={onChange} required style={inputStyle()} placeholder="19.0760" />
                            </div>
                            <div>
                                <label htmlFor="lng">Longitude</label>
                                <input id="lng" name="lng" type="number" step="any" value={form.lng} onChange={onChange} required style={inputStyle()} placeholder="72.8777" />
                            </div>
                        </div>

                        <SectionTitle title="Pricing & Status" hint="Set tariff per kWh and availability." />
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                            <div>
                                <label htmlFor="pricePerKwh">Tariff (₹ / kWh)</label>
                                <input
                                    id="pricePerKwh"
                                    name="pricePerKwh"
                                    type="number"
                                    step="0.01"
                                    value={form.pricePerKwh}
                                    onChange={onChange}
                                    required
                                    style={inputStyle()}
                                    placeholder="29.00"
                                />
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 22 }}>
                                <input id="active" name="active" type="checkbox" checked={form.active} onChange={onChange} />
                                <label htmlFor="active">Active</label>
                            </div>
                        </div>

                        <SectionTitle title="Connectors" hint="Add each connector type with power and count." />
                        <div className="card" style={{ padding: 12, border: `1px solid ${border}`, borderRadius: 12, background: card, color: text }}>
                            {form.sockets.map((s, i) => (
                                <div
                                    key={i}
                                    style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr auto", gap: 8, alignItems: "center", marginBottom: 8 }}
                                >
                                    <input
                                        type="text"
                                        placeholder="Type (e.g., CCS2, Type2, CHAdeMO)"
                                        value={s.type}
                                        onChange={(e) => updateSocket(i, "type", e.target.value)}
                                        style={inputStyle()}
                                    />
                                    <input
                                        type="number"
                                        step="0.1"
                                        placeholder="Power (kW)"
                                        value={s.power}
                                        onChange={(e) => updateSocket(i, "power", e.target.value)}
                                        style={inputStyle()}
                                    />
                                    <input
                                        type="number"
                                        step="1"
                                        placeholder="Count"
                                        value={s.count || 1}
                                        onChange={(e) => updateSocket(i, "count", e.target.value)}
                                        style={inputStyle()}
                                    />
                                    <button type="button" className="btn-danger" onClick={() => removeSocket(i)} style={btnDanger()}>
                                        Remove
                                    </button>
                                </div>
                            ))}
                            <button type="button" onClick={addSocket} className="btn-secondary" style={btnGhost()}>
                                + Add connector
                            </button>
                        </div>

                        <SectionTitle title="Amenities & Contact" hint="Useful extras and how drivers can reach the site." />
                        <label htmlFor="amenities">Amenities (comma‑separated)</label>
                        <input
                            id="amenities"
                            type="text"
                            value={form.amenities.join(", ")}
                            onChange={onAmenitiesChange}
                            placeholder="Parking, Restroom, Café"
                            style={inputStyle()}
                        />

                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 12 }}>
                            <div>
                                <label htmlFor="phone">Contact Phone (optional)</label>
                                <input id="phone" name="phone" type="tel" value={form.phone} onChange={onChange} style={inputStyle()} placeholder="+91 9xxxxxxxxx" />
                            </div>
                            <div>
                                <label htmlFor="hours">Open Hours (optional)</label>
                                <input
                                    id="hours"
                                    name="hours"
                                    type="text"
                                    value={form.hours}
                                    onChange={onChange}
                                    placeholder="e.g., 24x7 or 9am–9pm"
                                    style={inputStyle()}
                                />
                            </div>
                        </div>

                        <SectionTitle title="Photos" hint={`JPG/PNG up to ${MAX_SIZE_MB} MB each to showcase the site.`} />
                        <input type="file" accept="image/png,image/jpeg" multiple onChange={onPickFiles} style={{ display: "block" }} />

                        {!!files.length && (
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))", gap: 12, marginTop: 12 }}>
                                {files.map((item, idx) => (
                                    <div key={idx} className="card" style={{ padding: 8, position: "relative", border: `1px solid ${border}`, borderRadius: 12, background: card }}>
                                        {item.src ? (
                                            <img src={item.src} alt="" style={{ width: "100%", height: 90, objectFit: "cover", borderRadius: 8 }} />
                                        ) : (
                                            <div style={{ height: 90, display: "grid", placeItems: "center", color: muted }} className="muted">
                                                No preview
                                            </div>
                                        )}
                                        {item.error ? (
                                            <div className="small" style={{ color: "var(--danger,#fda4af)", marginTop: 6 }}>{item.error}</div>
                                        ) : (
                                            item.progress > 0 && <div className="small" style={{ marginTop: 6, color: muted }}>Upload: {item.progress}%</div>
                                        )}
                                        <button
                                            type="button"
                                            className="btn-secondary"
                                            onClick={() => removeLocalFile(idx)}
                                            disabled={uploading}
                                            style={{ position: "absolute", top: 6, right: 6, ...btnGhost(), padding: "4px 8px" }}
                                        >
                                            ✕
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}

                        <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
                            <button type="submit" disabled={saving || uploading} style={btnPrimary()}>
                                {saving ? <Spinner size={16} /> : editId ? "Save Changes" : "Create Station"}
                            </button>
                            <button type="button" className="btn-secondary" onClick={() => navigate("/owner/stations")} style={btnGhost()}>
                                Cancel
                            </button>
                        </div>
                    </div>

                    {/* Lightest green placeholders + lighter input BG for contrast */}
                    <style jsx>{`
            .form--mint input,
            .form--mint textarea {
              background: #18341f; /* slightly lighter than #162b1b for better contrast */
              border-color: rgba(137,243,54,.30);
              color: var(--oc-text);
            }

            .form--mint input::placeholder,
            .form--mint textarea::placeholder {
              color: #dbffd1; /* lightest green */
              opacity: 1;
            }
            .form--mint input::-webkit-input-placeholder,
            .form--mint textarea::-webkit-input-placeholder { color: #dbffd1; }
            .form--mint input:-ms-input-placeholder,
            .form--mint textarea:-ms-input-placeholder { color: #dbffd1; }
            .form--mint input::-ms-input-placeholder,
            .form--mint textarea::-ms-input-placeholder { color: #dbffd1; }

            .form--mint input:focus,
            .form--mint textarea:focus {
              box-shadow: 0 0 0 3px rgba(79,224,203,.24);
              border-color: var(--spring-aqua,#4FE0CB);
              outline: none;
            }
          `}</style>
                </form>
            )}

            {toast.open && (
                <Toast type={toast.type} onClose={onCloseToast}>
                    {toast.message}
                </Toast>
            )}
        </div>
    );
}

function SectionTitle({ title, hint }) {
    const text = "var(--oc-text)";
    const muted = "var(--oc-muted)";
    return (
        <div style={{ margin: "16px 0 8px" }}>
            <div style={{ fontWeight: 800, color: text }}>{title}</div>
            {hint && <div className="small" style={{ color: muted }}>{hint}</div>}
        </div>
    );
}

function inputStyle() {
    return {
        width: "100%",
        padding: "10px 12px",
        borderRadius: 10,
        border: "1px solid var(--oc-border)",
        background: "#18341f", // keep in sync with CSS above
        color: "var(--oc-text)",
        outline: "none",
    };
}
function btnPrimary() {
    return {
        background: "linear-gradient(135deg, var(--spring-lime,#89F336), var(--spring-aqua,#4FE0CB))",
        color: "#0b0b0b",
        border: "1px solid rgba(0,0,0,.15)",
        borderRadius: 10,
        padding: "10px 14px",
        fontWeight: 800,
        cursor: "pointer",
        boxShadow: "0 10px 24px rgba(0,0,0,.35)",
        minWidth: 160,
    };
}
function btnGhost() {
    return {
        background: "linear-gradient(180deg, var(--oc-card), #0f1a12)",
        color: "var(--oc-text)",
        border: "1px solid var(--oc-border)",
        borderRadius: 10,
        padding: "10px 14px",
        fontWeight: 700,
        cursor: "pointer",
    };
}
function btnDanger() {
    return {
        background: "linear-gradient(180deg, #3a2a2a, #4a2f2f)",
        color: "#fda4af",
        border: "1px solid #a04b4b",
        borderRadius: 10,
        padding: "8px 12px",
        fontWeight: 700,
        cursor: "pointer",
    };
}

function isNum(v) {
    return v !== "" && !isNaN(Number(v));
}
function num(v) {
    const n = Number(v);
    return isNaN(n) ? "" : n;
}
function normalizeSockets(arr) {
    if (!Array.isArray(arr) || arr.length === 0) return [{ type: "CCS2", power: 30, count: 1 }];
    return arr.map((x) =>
        typeof x === "string"
            ? { type: x, power: 7.4, count: 1 }
            : { type: x.type || "", power: x.power ?? 7.4, count: x.count ?? 1 }
    );
}
