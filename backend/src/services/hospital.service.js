import { ApiError } from "../utils/api-error.js";

const OVERPASS_ENDPOINTS = [
    "https://overpass-api.de/api/interpreter",
    "https://maps.mail.ru/osm/tools/overpass/api/interpreter",
    "https://overpass.kumi.systems/api/interpreter",
    "https://overpass.openstreetmap.ru/api/interpreter",
];

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const getNearbyHospitals = async (lat, lng, radius = 5000) => {
    const query = `[out:json][timeout:15];(node["amenity"="hospital"](around:${radius},${lat},${lng});way["amenity"="hospital"](around:${radius},${lat},${lng}););out center;`;

    let lastError = null;

    for (let i = 0; i < OVERPASS_ENDPOINTS.length; i++) {
        const endpoint = OVERPASS_ENDPOINTS[i];
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 20000);

            console.log(`[Hospital Service] Trying ${endpoint}...`);

            const response = await fetch(endpoint, {
                method: "POST",
                headers: { "Content-Type": "application/x-www-form-urlencoded" },
                body: `data=${encodeURIComponent(query)}`,
                signal: controller.signal,
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                lastError = new Error(`${endpoint} → HTTP ${response.status}`);
                console.warn(`[Hospital Service] ${lastError.message}`);
                if (i < OVERPASS_ENDPOINTS.length - 1) await sleep(1000);
                continue;
            }

            const data = await response.json();

            const hospitals = (data.elements || []).map((el) => {
                const elLat = el.lat ?? el.center?.lat;
                const elLon = el.lon ?? el.center?.lon;
                const phone =
                    el.tags?.phone ||
                    el.tags?.["contact:phone"] ||
                    el.tags?.["contact:mobile"] ||
                    el.tags?.mobile ||
                    el.tags?.telephone ||
                    null;
                const email =
                    el.tags?.email ||
                    el.tags?.["contact:email"] ||
                    el.tags?.["contact:mail"] ||
                    null;

                return {
                    id: el.id,
                    name: el.tags?.name || "Unknown Hospital",
                    location: { lat: elLat, lng: elLon },
                    phone,
                    email,
                    website: el.tags?.website || el.tags?.["contact:website"] || null,
                    address: [
                        el.tags?.["addr:housenumber"],
                        el.tags?.["addr:street"],
                        el.tags?.["addr:city"],
                        el.tags?.["addr:postcode"],
                    ]
                        .filter(Boolean)
                        .join(", ") || null,
                    emergency: el.tags?.emergency || null,
                    operator: el.tags?.operator || null,
                    openingHours: el.tags?.opening_hours || null,
                };
            });

            if (process.env.DEBUG_HOSPITALS === "true") {
                console.log("[Hospital Service] Overpass hospital details (up to first 10):");
                hospitals.slice(0, 10).forEach((hospital, index) => {
                    console.log(`[Hospital Service] #${index + 1}`, {
                        id: hospital.id,
                        name: hospital.name,
                        location: hospital.location,
                        address: hospital.address,
                        phone: hospital.phone,
                        email: hospital.email,
                        website: hospital.website,
                        emergency: hospital.emergency,
                    });
                });
            }

            console.log(`[Hospital Service] ✓ Found ${hospitals.length} hospitals via ${endpoint}`);
            return hospitals;
        } catch (error) {
            lastError = error;
            const reason = error.name === "AbortError" ? "timeout" : error.message;
            console.warn(`[Hospital Service] ${endpoint} failed: ${reason}`);
            if (i < OVERPASS_ENDPOINTS.length - 1) await sleep(1000);
            continue;
        }
    }

    throw new ApiError(
        502,
        `Failed to fetch nearby hospitals: ${lastError?.message}. Overpass servers may be busy — please retry in a few seconds.`
    );
};

const toRad = (value) => (value * Math.PI) / 180;

const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Radius of the Earth in km
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(lat1)) *
            Math.cos(toRad(lat2)) *
            Math.sin(dLon / 2) *
            Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in km
};

/**
 * Finds the absolute fastest hospital to reach by calculating live traffic travel times
 * via the TomTom Routing API for the closest matching hospitals.
 */
const findFastestHospital = async (userId, userLat, userLng) => {
    // 1. Get raw hospitals via existing Overpass method (e.g. 5km radius)
    const hospitals = await getNearbyHospitals(userLat, userLng, 5000);

    if (!hospitals.length) {
        throw new ApiError(404, "No hospitals found within emergency range.");
    }

    // 2. Sort by straight-line distance (Haversine formula) to get top 5
    const hospitalsWithDistances = hospitals
        .filter((h) => h.location?.lat && h.location?.lng)
        .map((h) => ({
            ...h,
            directDistanceKm: calculateDistance(userLat, userLng, h.location.lat, h.location.lng),
        }))
        .sort((a, b) => a.directDistanceKm - b.directDistanceKm);

    const top5 = hospitalsWithDistances.slice(0, 5);

    // 3. Setup TomTom Routing check
    const TOMTOM_KEY = process.env.TOMTOM_API_KEY;
    
    // If no TomTom key exists, fallback to just returning the mathematically closest hospital
    if (!TOMTOM_KEY) {
        console.warn("[Hospital Service] TOMTOM_API_KEY missing - falling back to Haversine distance");
        return {
            ...top5[0],
            travelTimeSeconds: Math.round((top5[0].directDistanceKm / 40) * 3600), // Mock 40km/h
            isMockTraffic: true
        };
    }

    // 4. Concurrently request TomTom travel times
    const routingPromises = top5.map(async (hospital) => {
        try {
            const url = `https://api.tomtom.com/routing/1/calculateRoute/${userLat},${userLng}:${hospital.location.lat},${hospital.location.lng}/json?key=${TOMTOM_KEY}&computeTravelTimeFor=all&routeType=fastest`;
            
            const req = await fetch(url);
            const data = await req.json();

            // The summary object holds lengthInMeters and travelTimeInSeconds
            if (data.routes && data.routes[0]?.summary) {
                return {
                    ...hospital,
                    travelTimeSeconds: data.routes[0].summary.travelTimeInSeconds,
                    routeDistanceMeters: data.routes[0].summary.lengthInMeters,
                    isMockTraffic: false
                };
            }
            return null;
        } catch (err) {
            console.error(`Failed to route hospital ${hospital.name}:`, err.message);
            return null;
        }
    });

    const routedHospitals = (await Promise.all(routingPromises)).filter(Boolean);

    if (!routedHospitals.length) {
        throw new ApiError(502, "TomTom API failed to calculate any emergency routes.");
    }

    // 5. Select the hospital with minimum driving time
    routedHospitals.sort((a, b) => a.travelTimeSeconds - b.travelTimeSeconds);

    return routedHospitals[0];
};

export { getNearbyHospitals, findFastestHospital, calculateDistance };
