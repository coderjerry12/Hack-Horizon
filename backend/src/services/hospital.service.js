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

                return {
                    id: el.id,
                    name: el.tags?.name || "Unknown Hospital",
                    location: { lat: elLat, lng: elLon },
                    phone: el.tags?.phone || el.tags?.["contact:phone"] || null,
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

export { getNearbyHospitals };
