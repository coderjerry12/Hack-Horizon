/**
 * TomTom Routing Service
 * Provides optimal routes with real-time traffic for emergency vehicles
 */

const TOMTOM_BASE = 'https://api.tomtom.com';

/**
 * Get optimal route between two points with live traffic
 * @param {number} fromLat - Origin latitude
 * @param {number} fromLng - Origin longitude
 * @param {number} toLat - Destination latitude
 * @param {number} toLng - Destination longitude
 * @param {string} travelMode - 'car' | 'ambulance' (uses car routing)
 */
export const getOptimalRoute = async (fromLat, fromLng, toLat, toLng, travelMode = 'car') => {
    const apiKey = process.env.TOMTOM_API_KEY;
    if (!apiKey) {
        console.warn('[Routing] TOMTOM_API_KEY not set — returning straight-line estimate');
        return buildFallbackRoute(fromLat, fromLng, toLat, toLng);
    }

    const url = `${TOMTOM_BASE}/routing/1/calculateRoute/${fromLat},${fromLng}:${toLat},${toLng}/json` +
        `?key=${apiKey}` +
        `&traffic=true` +
        `&travelMode=${travelMode}` +
        `&routeType=fastest` +
        `&instructionsType=text` +
        `&language=en-GB` +
        `&computeBestOrder=false`;

    try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 10000);
        const res = await fetch(url, { signal: controller.signal });
        clearTimeout(timeout);

        if (!res.ok) {
            console.warn(`[Routing] TomTom returned ${res.status}`);
            return buildFallbackRoute(fromLat, fromLng, toLat, toLng);
        }

        const data = await res.json();
        const route = data.routes?.[0];
        if (!route) return buildFallbackRoute(fromLat, fromLng, toLat, toLng);

        const summary = route.summary;
        const legs = route.legs || [];
        const instructions = legs.flatMap(leg =>
            (leg.instructions || []).map(i => ({
                text: i.message,
                distance: i.routeOffsetInMeters,
                maneuver: i.maneuver
            }))
        );

        // Extract polyline points
        const points = route.legs?.flatMap(leg =>
            leg.points?.map(p => [p.latitude, p.longitude]) || []
        ) || [];

        return {
            success: true,
            distanceMeters: summary.lengthInMeters,
            durationSeconds: summary.travelTimeInSeconds,
            trafficDelaySeconds: summary.trafficDelayInSeconds || 0,
            etaMinutes: Math.ceil(summary.travelTimeInSeconds / 60),
            instructions: instructions.slice(0, 10),
            polyline: points,
            trafficUrl: `https://api.tomtom.com/map/1/tile/traffic/flow/absolute/10/0/0.png?key=${apiKey}`
        };
    } catch (err) {
        console.error('[Routing] Error:', err.message);
        return buildFallbackRoute(fromLat, fromLng, toLat, toLng);
    }
};

/**
 * Find nearest hospitals with routing info
 */
export const getNearestHospitalsWithRoutes = async (fromLat, fromLng, hospitals, maxCount = 3) => {
    const results = [];
    const limited = hospitals.slice(0, maxCount);

    for (const hospital of limited) {
        const hLat = hospital.location?.lat ?? hospital.location?.coordinates?.[1];
        const hLng = hospital.location?.lng ?? hospital.location?.coordinates?.[0];
        if (!hLat || !hLng) continue;

        const route = await getOptimalRoute(fromLat, fromLng, hLat, hLng);
        results.push({
            hospital,
            route,
            score: route.durationSeconds + (route.trafficDelaySeconds * 0.5)
        });
    }

    return results.sort((a, b) => a.score - b.score);
};

function buildFallbackRoute(fromLat, fromLng, toLat, toLng) {
    const R = 6371000;
    const dLat = (toLat - fromLat) * Math.PI / 180;
    const dLng = (toLng - fromLng) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(fromLat * Math.PI / 180) * Math.cos(toLat * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
    const distanceMeters = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const durationSeconds = Math.round(distanceMeters / 8); // ~30 km/h avg

    return {
        success: false,
        distanceMeters: Math.round(distanceMeters),
        durationSeconds,
        trafficDelaySeconds: 0,
        etaMinutes: Math.ceil(durationSeconds / 60),
        instructions: [],
        polyline: [[fromLat, fromLng], [toLat, toLng]],
        fallback: true
    };
}
