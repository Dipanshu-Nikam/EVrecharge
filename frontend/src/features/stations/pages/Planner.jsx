// src/features/stations/pages/Planner.jsx - Spring Energy UI, same functionality
import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

export default function Planner() {
    // State
    const [originInput, setOriginInput] = useState('');
    const [destinationInput, setDestinationInput] = useState('');
    const [originCoords, setOriginCoords] = useState(null);
    const [destinationCoords, setDestinationCoords] = useState(null);
    const [isGettingLocation, setIsGettingLocation] = useState(false);
    const [showToast, setShowToast] = useState('');
    const [nearbyStations, setNearbyStations] = useState([]);
    const [isLoadingStations, setIsLoadingStations] = useState(false);

    // Use My Location
    const handleUseMyLocation = async () => {
        if (isGettingLocation) return;
        if (!navigator.geolocation) {
            setShowToast('❌ Geolocation not supported');
            return;
        }
        try {
            setIsGettingLocation(true);
            const position = await new Promise((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(
                    resolve,
                    reject,
                    { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
                );
            });

            const { latitude, longitude } = position.coords;
            const response = await axios.get(`/api/maps/reverse?lat=${latitude}&lng=${longitude}`);
            if (response.data) {
                const cityName = response.data.city || response.data.name || 'Current Location';
                const stateName = response.data.state || '';
                const displayText = stateName ? `${cityName}, ${stateName}` : cityName;

                setOriginInput(displayText);
                setOriginCoords({ lat: latitude, lng: longitude, name: displayText });
                setShowToast(`✅ Location: ${displayText}`);
            } else {
                throw new Error('No data from reverse geocoding');
            }
        } catch (error) {
            const fallbackText = 'Current Location';
            setOriginInput(fallbackText);
            // Attempt to read last known position variables if present
            setOriginCoords((prev) => prev || { lat: undefined, lng: undefined, name: fallbackText });
            setShowToast('⚠️ Location detected, but address lookup failed');
        } finally {
            setIsGettingLocation(false);
        }
    };

    // Search nearby when origin changes
    useEffect(() => {
        if (!originCoords?.lat || !originCoords?.lng) {
            setNearbyStations([]);
            return;
        }

        const searchStations = async () => {
            try {
                setIsLoadingStations(true);
                const response = await axios.get('/api/maps/nearby', {
                    params: {
                        lat: originCoords.lat,
                        lng: originCoords.lng,
                        radius: 25000,
                        q: ''
                    }
                });
                if (response.data && Array.isArray(response.data)) {
                    const stations = response.data.slice(0, 5);
                    setNearbyStations(stations);
                    if (stations.length > 0) setShowToast(`✅ Found ${stations.length} EV stations nearby!`);
                }
            } catch (error) {
                setShowToast('❌ Failed to find nearby stations');
            } finally {
                setIsLoadingStations(false);
            }
        };

        const timer = setTimeout(searchStations, 800);
        return () => clearTimeout(timer);
    }, [originCoords]);

    // Auto-hide toast
    useEffect(() => {
        if (!showToast) return;
        const t = setTimeout(() => setShowToast(''), 4000);
        return () => clearTimeout(t);
    }, [showToast]);

    // Reset
    const handleReset = () => {
        setOriginInput('');
        setDestinationInput('');
        setOriginCoords(null);
        setDestinationCoords(null);
        setNearbyStations([]);
        setShowToast('🔄 Reset complete');
    };

    // Theme helpers
    const cardBg = "linear-gradient(180deg, var(--oc-card, #132416), #0f1a12)";
    const border = "1px solid var(--oc-border, rgba(0,191,51,.26))";
    const text = "var(--oc-text)";
    const muted = "var(--oc-muted)";

    return (
        <div style={{ maxWidth: 980, margin: "0 auto", padding: 20 }}>
            {/* Hero strip */}
            <section
                className="card glass"
                style={{
                    padding: 18,
                    borderRadius: 16,
                    border,
                    background: `${cardBg}, radial-gradient(560px 220px at 6% -20%, rgba(255,252,48,.12), transparent 70%)`
                }}
            >
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                    <span
                        aria-hidden="true"
                        style={{
                            width: 10, height: 10, borderRadius: "50%",
                            background: "var(--spring-lime,#89F336)",
                            boxShadow: "0 0 0 6px rgba(137,243,54,.18)"
                        }}
                    />
                    <span style={{ color: muted, fontSize: 13 }}>Fast routes with smart charging</span>
                </div>

                <h1 className="title-xl" style={{ margin: "4px 0 6px 0", color: text }}>
                    Trip Planner
                </h1>
                <p className="muted" style={{ margin: 0 }}>
                    Choose origin and destination; get nearby chargers and quick directions.
                </p>
            </section>

            {/* Toast */}
            {showToast && (
                <div
                    style={{
                        position: 'fixed',
                        top: 20,
                        right: 20,
                        background: 'linear-gradient(135deg, var(--spring-lime,#89F336), var(--spring-aqua,#4FE0CB))',
                        color: '#0b0b0b',
                        padding: '12px 16px',
                        borderRadius: 10,
                        fontSize: 14,
                        fontWeight: 600,
                        zIndex: 1000,
                        border: '1px solid rgba(0,0,0,.15)',
                        boxShadow: '0 10px 26px rgba(0,0,0,.35)'
                    }}
                >
                    {showToast}
                    <button
                        onClick={() => setShowToast('')}
                        style={{
                            marginLeft: 10, background: 'transparent', border: 'none',
                            color: '#0b0b0b', cursor: 'pointer', fontSize: 16
                        }}
                        aria-label="Close notification"
                    >
                        ×
                    </button>
                </div>
            )}

            {/* Debug */}
            <div
                className="card glass"
                style={{
                    background: cardBg,
                    border,
                    padding: 12,
                    borderRadius: 12,
                    marginTop: 12,
                    fontSize: 12,
                    fontFamily: 'monospace',
                    color: text
                }}
            >
                <strong>DEBUG:</strong> originInput = "{originInput}" | coords = {originCoords ? `${originCoords.lat}, ${originCoords.lng}` : 'null'}
            </div>

            {/* Form */}
            <div
                className="card glass"
                style={{
                    marginTop: 16,
                    background: cardBg,
                    border,
                    borderRadius: 14,
                    padding: 20,
                    color: text
                }}
            >
                {/* Origin */}
                <div style={{ marginBottom: 16 }}>
                    <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, color: text }}>
                        Origin
                    </label>
                    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                        <input
                            type="text"
                            placeholder="Enter origin city, address, or landmark..."
                            value={originInput}
                            onChange={(e) => setOriginInput(e.target.value)}
                            style={{
                                flex: 1,
                                minWidth: 240,
                                padding: '12px 14px',
                                fontSize: 14,
                                borderRadius: 10,
                                border: '1px solid var(--oc-border)',
                                background: 'var(--oc-input,#162b1b)',
                                color: text,
                                outline: 'none',
                                transition: 'border-color .2s'
                            }}
                            onFocus={(e) => (e.target.style.borderColor = 'var(--spring-aqua,#4FE0CB)')}
                            onBlur={(e) => (e.target.style.borderColor = 'var(--oc-border)')}
                        />
                        <button
                            onClick={handleUseMyLocation}
                            disabled={isGettingLocation}
                            style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 8,
                                background: isGettingLocation
                                    ? 'linear-gradient(135deg, #a3a3a3, #9ca3af)'
                                    : 'linear-gradient(135deg, var(--spring-lime,#89F336), var(--spring-aqua,#4FE0CB))',
                                color: '#0b0b0b',
                                border: '1px solid rgba(0,0,0,.15)',
                                borderRadius: 10,
                                padding: '12px 16px',
                                fontSize: 14,
                                fontWeight: 700,
                                cursor: isGettingLocation ? 'not-allowed' : 'pointer',
                                minWidth: 180,
                                boxShadow: '0 10px 24px rgba(0,0,0,.35)'
                            }}
                        >
                            {isGettingLocation ? (
                                <>
                                    <span
                                        style={{
                                            width: 16,
                                            height: 16,
                                            border: '2px solid #0b0b0b',
                                            borderTop: '2px solid transparent',
                                            borderRadius: '50%',
                                            display: 'inline-block',
                                            animation: 'spin 1s linear infinite'
                                        }}
                                    />
                                    Getting...
                                </>
                            ) : (
                                <>📍 Use my location</>
                            )}
                        </button>
                    </div>
                </div>

                {/* Destination */}
                <div style={{ marginBottom: 16 }}>
                    <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, color: text }}>
                        Destination
                    </label>
                    <input
                        type="text"
                        placeholder="Enter destination..."
                        value={destinationInput}
                        onChange={(e) => setDestinationInput(e.target.value)}
                        style={{
                            width: '100%',
                            padding: '12px 14px',
                            fontSize: 14,
                            borderRadius: 10,
                            border: '1px solid var(--oc-border)',
                            background: 'var(--oc-input,#162b1b)',
                            color: text,
                            outline: 'none',
                            transition: 'border-color .2s'
                        }}
                        onFocus={(e) => (e.target.style.borderColor = 'var(--spring-aqua,#4FE0CB)')}
                        onBlur={(e) => (e.target.style.borderColor = 'var(--oc-border)')}
                    />
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                    <button
                        onClick={handleReset}
                        style={{
                            background: 'transparent',
                            color: text,
                            border: '1px solid var(--oc-border)',
                            borderRadius: 10,
                            padding: '10px 14px',
                            fontSize: 14,
                            cursor: 'pointer'
                        }}
                    >
                        Reset
                    </button>

                    {originCoords && destinationInput && (
                        <a
                            href={`https://www.google.com/maps/dir/?api=1&origin=${originCoords.lat},${originCoords.lng}&destination=${encodeURIComponent(destinationInput)}&travelmode=driving`}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                                display: 'inline-block',
                                textDecoration: 'none',
                                color: '#0b0b0b',
                                borderRadius: 10,
                                padding: '10px 14px',
                                fontSize: 14,
                                fontWeight: 700,
                                background: 'linear-gradient(135deg, var(--spring-lemon,#FFFC30), var(--spring-lime,#89F336))',
                                border: '1px solid rgba(0,0,0,.15)',
                                boxShadow: '0 10px 26px rgba(0,0,0,.35)'
                            }}
                        >
                            🗺️ Open in Google Maps
                        </a>
                    )}

                    {originCoords && (
                        <button
                            onClick={() => window.open(`/search?near=${originCoords.lat},${originCoords.lng}`, '_blank')}
                            style={{
                                color: '#0b0b0b',
                                borderRadius: 10,
                                padding: '10px 14px',
                                fontSize: 14,
                                fontWeight: 700,
                                background: 'linear-gradient(135deg, var(--spring-aqua,#4FE0CB), var(--spring-lime,#89F336))',
                                border: '1px solid rgba(0,0,0,.15)',
                                cursor: 'pointer',
                                boxShadow: '0 10px 26px rgba(0,0,0,.35)'
                            }}
                        >
                            🔍 Find Stations Near Origin
                        </button>
                    )}
                </div>
            </div>

            {/* Results */}
            {nearbyStations.length > 0 && (
                <div
                    className="card glass"
                    style={{
                        background: `${cardBg}, radial-gradient(520px 200px at 8% -20%, rgba(79,224,203,.10), transparent 70%)`,
                        border,
                        borderRadius: 14,
                        padding: 20,
                        color: text,
                        marginTop: 10
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                        <h3 style={{ margin: 0, color: text }}>
                            ⚡ EV Charging Stations Near {originCoords?.name}
                        </h3>
                        <span
                            style={{
                                background: 'rgba(255,252,48,.18)',
                                color: '#0b0b0b',
                                padding: '4px 8px',
                                borderRadius: 8,
                                fontSize: 12,
                                fontWeight: 700,
                                border: '1px solid rgba(255,252,48,.45)'
                            }}
                        >
                            {nearbyStations.length} found
                        </span>
                        {isLoadingStations && (
                            <span
                                style={{
                                    width: 16, height: 16, border: '2px solid var(--spring-aqua,#4FE0CB)',
                                    borderTop: '2px solid transparent', borderRadius: '50%',
                                    display: 'inline-block', animation: 'spin 1s linear infinite'
                                }}
                            />
                        )}
                    </div>

                    <div style={{ display: 'grid', gap: 12 }}>
                        {nearbyStations.map((station, index) => (
                            <div
                                key={station.id || index}
                                className="card"
                                style={{
                                    background: 'linear-gradient(180deg, #162b1b, #132416)',
                                    border: '1px solid var(--oc-border)',
                                    borderRadius: 12,
                                    padding: 16,
                                    color: text
                                }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                                    <h4 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: text }}>
                                        {station.name}
                                    </h4>
                                    <div style={{ display: 'flex', gap: 6 }}>
                                        <span
                                            style={{
                                                background: 'rgba(137,243,54,.18)',
                                                color: '#0b0b0b',
                                                padding: '4px 8px',
                                                borderRadius: 8,
                                                fontSize: 11,
                                                fontWeight: 700,
                                                border: '1px solid rgba(137,243,54,.45)'
                                            }}
                                        >
                                            ⚡ Available
                                        </span>
                                        {station.distance && (
                                            <span
                                                style={{
                                                    background: 'rgba(79,224,203,.18)',
                                                    color: '#0b0b0b',
                                                    padding: '4px 8px',
                                                    borderRadius: 8,
                                                    fontSize: 11,
                                                    fontWeight: 700,
                                                    border: '1px solid rgba(79,224,203,.45)'
                                                }}
                                            >
                                                📍 {station.distance.toFixed(1)}km
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <p style={{ margin: '0 0 8px 0', color: muted, fontSize: 14 }}>
                                    📍 {station.address}
                                </p>

                                <div style={{ display: 'flex', gap: 8, fontSize: 12, color: muted }}>
                                    <span>🗄️ Firebase Database</span>
                                    {station.latitude && station.longitude && (
                                        <button
                                            onClick={() => {
                                                const url = `https://www.google.com/maps/dir/${originCoords.lat},${originCoords.lng}/${station.latitude},${station.longitude}`;
                                                window.open(url, '_blank');
                                            }}
                                            style={{
                                                color: '#0b0b0b',
                                                borderRadius: 8,
                                                padding: '6px 10px',
                                                fontSize: 12,
                                                fontWeight: 700,
                                                background: 'linear-gradient(135deg, var(--spring-lemon,#FFFC30), var(--spring-aqua,#4FE0CB))',
                                                border: '1px solid rgba(0,0,0,.15)',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            🧭 Get Directions
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Summary */}
            {(originCoords || destinationInput) && (
                <div
                    className="card glass"
                    style={{
                        background: `${cardBg}, radial-gradient(520px 180px at 6% -20%, rgba(255,252,48,.10), transparent 70%)`,
                        border,
                        borderRadius: 14,
                        padding: 20,
                        color: text,
                        marginTop: 16
                    }}
                >
                    <h3 style={{ margin: '0 0 12px 0', color: text }}>Trip Summary</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                        <div>
                            <div style={{ fontSize: 14, color: muted, marginBottom: 4 }}>Origin</div>
                            {originCoords ? (
                                <>
                                    <div style={{ fontWeight: 700, color: text }}>{originCoords.name}</div>
                                    <div style={{ fontSize: 12, color: muted }}>
                                        {Number.isFinite(originCoords.lat) ? originCoords.lat.toFixed(5) : '—'},
                                        {` `}
                                        {Number.isFinite(originCoords.lng) ? originCoords.lng.toFixed(5) : '—'}
                                    </div>
                                </>
                            ) : (
                                <div style={{ color: muted }}>Not selected</div>
                            )}
                        </div>
                        <div>
                            <div style={{ fontSize: 14, color: muted, marginBottom: 4 }}>Destination</div>
                            {destinationInput ? (
                                <div style={{ fontWeight: 700, color: text }}>{destinationInput}</div>
                            ) : (
                                <div style={{ color: muted }}>Not selected</div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Animations */}
            <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
        </div>
    );
}
