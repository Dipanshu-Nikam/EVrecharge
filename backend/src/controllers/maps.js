// backend/src/controllers/maps.js - 
"use strict";

// --- Firestore init (uses your config/firebase.js) ---
let db = null;
try {
    const firebase = require("../config/firebase");
    db = firebase.db || null;
} catch (e) {
    console.warn("firebase config not available:", e.message);
}

// ----------------- helpers -----------------
const toNum = (v) =>
    v === undefined || v === null || v === "" ? undefined : Number(v);

const haversineKm = (a, b) => {
    const R = 6371;
    const dLat = ((b.lat - a.lat) * Math.PI) / 180;
    const dLng = ((b.lng - a.lng) * Math.PI) / 180;
    const s1 =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((a.lat * Math.PI) / 180) *
        Math.cos((b.lat * Math.PI) / 180) *
        Math.sin(dLng / 2) * Math.sin(dLng / 2);
    return 2 * R * Math.atan2(Math.sqrt(s1), Math.sqrt(1 - s1));
};

// ✅ ENHANCED: Robust deduplication function
function deduplicateStations(stations) {
    const seen = new Map();
    const deduplicated = [];

    for (const station of stations) {
        // Create multiple keys for deduplication
        const coordKey = `${Number(station.latitude).toFixed(4)}_${Number(station.longitude).toFixed(4)}`;
        const nameKey = station.name?.toLowerCase().trim();
        const addressKey = station.address?.toLowerCase().trim();

        // Primary key: coordinates (most reliable)
        let duplicateKey = coordKey;

        // If coordinates are too close (within 100m), also check name
        if (station.latitude && station.longitude && station.name) {
            duplicateKey = `${coordKey}_${nameKey}`;
        }

        // Check if we've seen this station before
        if (!seen.has(duplicateKey)) {
            seen.set(duplicateKey, true);
            deduplicated.push({
                ...station,
                dedupeKey: duplicateKey // For debugging
            });
        } else {
            console.log(`🔄 Deduplicated: ${station.name} at ${station.latitude}, ${station.longitude}`);
        }
    }

    console.log(`📊 Deduplication: ${stations.length} → ${deduplicated.length} stations`);
    return deduplicated;
}

// ✅ ENHANCED: Smart Firebase fetcher with proper deduplication
// Stronger Firestore search with text matches and optional geo prefilter.
// Requires Firestore v8 compat or v9 namespaced db.collection / db.collectionGroup to exist.
async function fetchStationsFromFirestore(q, opts = {}) {
    if (!db) {
        console.warn("maps.search: Firestore db not initialized");
        return [];
    }

    const { lat, lng, radius } = opts || {};
    const hasGeo = Number.isFinite(lat) && Number.isFinite(lng) && Number.isFinite(radius) && radius > 0;
    const qLower = String(q || "").trim().toLowerCase();

    console.log(`🔍 Firebase search: q="${qLower}", hasGeo=${hasGeo}, lat=${lat}, lng=${lng}, radius=${radius}`);

    const fetchedIds = new Set();
    const results = [];

    // Helpers
    const norm = (v) => String(v ?? "").trim().toLowerCase();
    const matchText = (docData) => {
        if (!qLower) return true; // if no query, include all
        // Try common fields
        const fields = [
            docData.name,
            docData.title,
            docData.displayName,
            docData.address,
            docData.city,
            docData.state,
            docData.metadata?.city,
            docData.metadata?.address,
            docData.locationName,
        ];
        // Also check connectors array types if present
        if (Array.isArray(docData.connectors)) {
            for (const c of docData.connectors) {
                fields.push(c?.type, c?.standard);
            }
        }
        // Join and test
        return fields.some((f) => norm(f).includes(qLower));
    };

    const toKm = (lat1, lon1, lat2, lon2) => {
        const R = 6371;
        const dLat = ((lat2 - lat1) * Math.PI) / 180;
        const dLon = ((lon2 - lon1) * Math.PI) / 180;
        const a =
            Math.sin(dLat / 2) ** 2 +
            Math.cos((lat1 * Math.PI) / 180) *
            Math.cos((lat2 * Math.PI) / 180) *
            Math.sin(dLon / 2) ** 2;
        return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
    };

    const matchGeo = (docData) => {
        if (!hasGeo) return true;
        const dLat = docData.lat ?? docData.latitude ?? docData.location?.lat ?? docData.coordinates?.lat;
        const dLng = docData.lng ?? docData.longitude ?? docData.location?.lng ?? docData.coordinates?.lng;
        if (!Number.isFinite(dLat) || !Number.isFinite(dLng)) return false;
        return toKm(lat, lng, dLat, dLng) <= radius;
    };

    const pushUnique = (doc, source) => {
        if (!doc) return;
        const id = doc.id || doc._id || doc.__id || `${source}-${Math.random().toString(36).slice(2, 9)}`;
        if (fetchedIds.has(id)) return;
        fetchedIds.add(id);
        results.push({ id, _source: source, ...doc });
    };

    // 1) Top-level collections
    const topLevelCollections = [
        { name: "ev_bunks", source: "ev_bunks/top" },
        { name: "stations", source: "stations/top" },
    ];

    for (const { name, source } of topLevelCollections) {
        try {
            const snap = await db.collection(name).limit(1000).get();
            let added = 0;
            snap.docs.forEach((d) => {
                const data = d.data() || {};
                const candidate = { ...data, id: d.id, collection: name };
                if (matchText(candidate) && matchGeo(candidate)) {
                    pushUnique(candidate, source);
                    added++;
                }
            });
            console.log(`📊 ${name}: considered=${snap.size}, matched=${added}`);
        } catch (e) {
            console.warn(`fetch "${name}" failed:`, e.message);
        }
    }

    // 2) Collection group queries (if subcollections exist)
    const groupTargets = [
        { group: "ev_bunks", source: "ev_bunks/group" },
        { group: "stations", source: "stations/group" },
    ];

    for (const { group, source } of groupTargets) {
        if (!db.collectionGroup) continue;
        try {
            const snap = await db.collectionGroup(group).limit(1000).get();
            let added = 0;
            snap.docs.forEach((d) => {
                const data = d.data() || {};
                const candidate = { ...data, id: d.id, collectionGroup: group };
                if (matchText(candidate) && matchGeo(candidate)) {
                    pushUnique(candidate, source);
                    added++;
                }
            });
            console.log(`📚 group:${group}: considered=${snap.size}, matched=${added}`);
        } catch (e) {
            // Many projects won’t have matching group paths; log quietly
            console.info(`collectionGroup "${group}" skipped:`, e.message);
        }
    }

    console.log(`✅ Final unique stations: ${results.length}`);
    return results;
}


// ----------------- controllers -----------------

// ✅ GET /api/maps/nearby?lat=..&lng=..&q=..&radius=2000
async function nearby(req, res) {
    try {
        const lat = Number(req.query.lat);
        const lng = Number(req.query.lng);
        const keywords = String(req.query.q || "");
        const radius = Number(req.query.radius || 25000); // Default 25km

        if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
            return res.status(400).json({ error: "lat & lng required" });
        }

        console.log(`🔍 Nearby search: lat=${lat}, lng=${lng}, radius=${radius}m, q="${keywords}"`);

        const stations = await fetchStationsFromFirestore(keywords, { lat, lng, radius });

        console.log(`✅ Nearby search completed: ${stations.length} unique stations found`);
        return res.json(stations);

    } catch (err) {
        console.error("❌ nearby error:", err.message);
        return res.status(500).json({ error: "nearby search failed", details: err.message });
    }
}

// ✅ GET /api/maps/search?q=...&lat=..&lng=..&radius=..
async function searchStations(req, res) {
    try {
        const q = String(req.query.q || "").trim();
        const lat = toNum(req.query.lat);
        const lng = toNum(req.query.lng);
        const radius = toNum(req.query.radius);

        if (!q) return res.status(400).json({ error: "q required" });

        console.log(`🔍 Station search: q="${q}", lat=${lat}, lng=${lng}, radius=${radius}`);

        const stations = await fetchStationsFromFirestore(q, { lat, lng, radius });

        console.log(`✅ Station search completed: ${stations.length} unique stations found`);
        return res.json(stations);

    } catch (err) {
        console.error("❌ search error:", err.message);
        return res.status(500).json({ error: "search failed", details: err.message });
    }
}

// ✅ GET /api/maps/reverse?lat=20.0367&lng=73.7847
async function reverseGeocode(req, res) {
    try {
        const lat = Number(req.query.lat);
        const lng = Number(req.query.lng);

        if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
            return res.status(400).json({ error: "lat & lng required" });
        }

        console.log(`🔍 Reverse geocoding: ${lat}, ${lng}`);

        const locationResult = getLocationFromCoordinates(lat, lng);

        console.log(`✅ Location detected: ${locationResult.address}`);
        return res.json(locationResult);

    } catch (err) {
        console.error("❌ reverse geocoding error:", err.message);

        const lat = Number(req.query.lat) || 20.0367;
        const lng = Number(req.query.lng) || 73.7847;

        const safeResult = {
            name: 'Location',
            address: `Location at ${lat.toFixed(3)}, ${lng.toFixed(3)}`,
            latitude: lat,
            longitude: lng,
            city: 'Unknown City',
            state: 'Maharashtra',
            country: 'India'
        };

        return res.json(safeResult);
    }
}

// ✅ Enhanced location detection
function getLocationFromCoordinates(lat, lng) {
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
        return {
            name: 'Unknown Location',
            address: 'Unknown Location, India',
            latitude: lat || 20.0,
            longitude: lng || 73.0,
            city: 'Unknown City',
            state: 'India',
            country: 'India'
        };
    }

    const regions = [
        {
            name: 'Jalgaon',
            bounds: { north: 21.15, south: 20.85, east: 75.75, west: 75.45 },
            state: 'Maharashtra'
        },
        {
            name: 'Nashik',
            bounds: { north: 20.05, south: 19.95, east: 73.85, west: 73.75 },
            state: 'Maharashtra'
        },
        {
            name: 'Mumbai',
            bounds: { north: 19.25, south: 18.95, east: 72.90, west: 72.80 },
            state: 'Maharashtra'
        },
        {
            name: 'Pune',
            bounds: { north: 18.60, south: 18.45, east: 73.90, west: 73.80 },
            state: 'Maharashtra'
        }
    ];

    for (const region of regions) {
        const { bounds } = region;
        if (lat >= bounds.south && lat <= bounds.north &&
            lng >= bounds.west && lng <= bounds.east) {

            console.log(`📍 Detected city: ${region.name}, ${region.state}`);
            return {
                name: region.name,
                address: `${region.name}, ${region.state}`,
                latitude: lat,
                longitude: lng,
                city: region.name,
                state: region.state,
                country: 'India'
            };
        }
    }

    let detectedState = 'Maharashtra';
    let detectedCity = 'Maharashtra Region';

    if (lat >= 15.60 && lat <= 22.0 && lng >= 72.60 && lng <= 80.90) {
        if (lat >= 20.5 && lat <= 21.5 && lng >= 75.0 && lng <= 76.0) {
            detectedCity = 'Jalgaon Area';
        } else if (lat >= 19.8 && lat <= 20.2 && lng >= 73.6 && lng <= 74.0) {
            detectedCity = 'Nashik Area';
        }
    }

    console.log(`📍 Detected region: ${detectedCity}, ${detectedState}`);

    return {
        name: detectedCity,
        address: `${detectedCity}, ${detectedState}`,
        latitude: lat,
        longitude: lng,
        city: detectedCity,
        state: detectedState,
        country: 'India'
    };
}

// ✅ GET /api/maps/locate?q=jalgaon
async function locate(req, res) {
    try {
        const q = String(req.query.q || "").trim();
        if (!q) return res.status(400).json({ error: "q required" });

        console.log(`🔍 Locating: "${q}"`);

        // First try to find location from Firebase stations
        if (q.length >= 3) {
            try {
                const stations = await fetchStationsFromFirestore(q, {});
                if (stations.length > 0) {
                    const station = stations[0];
                    const result = {
                        name: extractCityFromStation(station),
                        address: station.address || `${station.name} area`,
                        lat: station.latitude,
                        lng: station.longitude,
                        bbox: null,
                        stationsFound: stations.length
                    };
                    console.log(`✅ Found location from Firebase: ${result.name} (${stations.length} stations)`);
                    return res.json(result);
                }
            } catch (e) {
                console.warn('Firebase location search failed:', e.message);
            }
        }

        // Static dictionary fallback
        const FALLBACKS = {
            jalgaon: { lat: 21.0077, lng: 75.5626, name: "Jalgaon, Maharashtra" },
            mumbai: { lat: 19.076, lng: 72.8777, name: "Mumbai, Maharashtra" },
            pune: { lat: 18.5204, lng: 73.8567, name: "Pune, Maharashtra" },
            delhi: { lat: 28.6139, lng: 77.209, name: "New Delhi, Delhi" },
            nashik: { lat: 20.0112, lng: 73.7902, name: "Nashik, Maharashtra" },
            nagpur: { lat: 21.1458, lng: 79.0882, name: "Nagpur, Maharashtra" },
            aurangabad: { lat: 19.8762, lng: 75.3433, name: "Aurangabad, Maharashtra" },
            bangalore: { lat: 12.9716, lng: 77.5946, name: "Bangalore, Karnataka" },
            chennai: { lat: 13.0827, lng: 80.2707, name: "Chennai, Tamil Nadu" },
            hyderabad: { lat: 17.3850, lng: 78.4867, name: "Hyderabad, Telangana" }
        };

        let found = FALLBACKS[q.toLowerCase()];
        if (!found) {
            for (const [key, value] of Object.entries(FALLBACKS)) {
                if (key.startsWith(q.toLowerCase()) || q.toLowerCase().startsWith(key.substring(0, 3))) {
                    found = value;
                    break;
                }
            }
        }

        if (found) {
            console.log(`✅ Found in fallback dictionary: ${found.name}`);
            return res.json({
                name: found.name,
                address: found.name,
                lat: found.lat,
                lng: found.lng,
                bbox: null,
            });
        }

        console.log(`❌ Location not found: "${q}"`);
        return res.status(404).json({
            error: "location not found",
            suggestion: "Try 'Jalgaon', 'Mumbai', 'Pune', etc."
        });

    } catch (err) {
        console.error("❌ locate error:", err.message);
        return res.status(500).json({ error: "locate failed", details: err.message });
    }
}

// Helper to extract city name from station data
function extractCityFromStation(station) {
    if (station.city) return station.city;
    if (station.address) {
        const parts = station.address.split(',');
        if (parts.length > 1) {
            return parts[parts.length - 1].trim();
        }
    }
    return station.name || 'Unknown City';
}

// ✅ Other controller functions (simplified)
async function distanceMatrix(req, res) {
    try {
        const parseLL = (s) =>
            String(s || "")
                .split(";")
                .map((p) => p.trim())
                .filter(Boolean)
                .map((p) => p.split(",").map((n) => Number(n.trim())))
                .filter(([a, b]) => Number.isFinite(a) && Number.isFinite(b));

        const origins = parseLL(req.query.origins);
        const destinations = parseLL(req.query.destinations);

        if (!origins.length || !destinations.length) {
            return res.status(400).json({ error: "origins and destinations required" });
        }

        const results = [];
        for (let i = 0; i < origins.length; i++) {
            const row = [];
            for (let j = 0; j < destinations.length; j++) {
                const [olat, olng] = origins[i];
                const [dlat, dlng] = destinations[j];
                const distance = haversineKm({ lat: olat, lng: olng }, { lat: dlat, lng: dlng });
                const duration = (distance / 40) * 60;

                row.push({
                    distance: Math.round(distance * 1000),
                    duration: Math.round(duration * 60),
                    status: 'OK'
                });
            }
            results.push(row);
        }

        return res.json({
            origin_addresses: origins.map(([lat, lng]) => `${lat}, ${lng}`),
            destination_addresses: destinations.map(([lat, lng]) => `${lat}, ${lng}`),
            rows: results.map(row => ({ elements: row }))
        });

    } catch (err) {
        console.error("❌ distanceMatrix error:", err.message);
        return res.status(500).json({ error: "distance matrix failed" });
    }
}

async function city(req, res) {
    try {
        const q = String(req.query.q || "").trim();
        if (!q) return res.status(400).json({ error: "q required" });

        console.log(`🔍 City search: "${q}"`);

        const stations = await fetchStationsFromFirestore(q, {});

        return res.json({
            query: q,
            available: stations.length > 0,
            totalStations: stations.length,
            stations: stations,
        });

    } catch (err) {
        console.error("❌ city error:", err.message);
        return res.status(500).json({ error: "city search failed" });
    }
}

async function findFirestoreOnly(req, res) {
    try {
        const q = String(req.query.q || "").trim();
        const city = String(req.query.city || "").trim();
        const address = String(req.query.address || "").trim();

        const searchQuery = q || city || address;
        if (!searchQuery) {
            return res.status(400).json({ error: "Provide q, city, or address" });
        }

        console.log(`🔍 Firestore-only search: "${searchQuery}"`);

        const stations = await fetchStationsFromFirestore(searchQuery, {});

        return res.json({
            count: stations.length,
            stations: stations
        });

    } catch (err) {
        console.error("❌ findFirestoreOnly error:", err.message);
        return res.status(500).json({ error: "find failed" });
    }
}

// ✅ DEBUG endpoint to check Firebase data
async function debugFirebase(req, res) {
    try {
        if (!db) {
            return res.json({ error: 'Firebase not initialized' });
        }

        const debug = {
            collections: {},
            sampleDocs: {},
            totalCount: 0,
            duplicateCheck: {}
        };

        // Check each collection
        const collections = ['stations', 'ev_bunks'];

        for (const collName of collections) {
            try {
                const snap = await db.collection(collName).limit(10).get();
                debug.collections[collName] = snap.size;
                debug.totalCount += snap.size;

                if (!snap.empty) {
                    debug.sampleDocs[collName] = snap.docs.map(d => ({
                        id: d.id,
                        name: d.data().name,
                        location: d.data().location,
                        address: d.data().address
                    }));
                }
            } catch (e) {
                debug.collections[collName] = `Error: ${e.message}`;
            }
        }

        // Check collection groups
        try {
            const stationsCG = await db.collectionGroup('stations').limit(10).get();
            debug.collections['stations_collectionGroup'] = stationsCG.size;
            debug.totalCount += stationsCG.size;
        } catch (e) {
            debug.collections['stations_collectionGroup'] = `Error: ${e.message}`;
        }

        try {
            const evBunksCG = await db.collectionGroup('ev_bunks').limit(10).get();
            debug.collections['ev_bunks_collectionGroup'] = evBunksCG.size;
            debug.totalCount += evBunksCG.size;
        } catch (e) {
            debug.collections['ev_bunks_collectionGroup'] = `Error: ${e.message}`;
        }

        // Test deduplication with Jalgaon search
        try {
            const testStations = await fetchStationsFromFirestore('jalgaon', {});
            debug.duplicateCheck = {
                jalgaonStations: testStations.length,
                sample: testStations.slice(0, 3).map(s => ({
                    id: s.id,
                    name: s.name,
                    coordinates: `${s.latitude}, ${s.longitude}`,
                    dedupeKey: s.dedupeKey
                }))
            };
        } catch (e) {
            debug.duplicateCheck = { error: e.message };
        }

        return res.json(debug);

    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
}

// ✅ Export all handlers
module.exports = {
    nearby,
    reverseGeocode,
    locate,
    distanceMatrix,
    searchStations,
    findFirestoreOnly,
    city,
    debugFirebase, // ✅ Add debug endpoint
};
