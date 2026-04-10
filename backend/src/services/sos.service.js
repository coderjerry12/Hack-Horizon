import axios from "axios";
import { ApiError } from "../utils/api-error.js";
import { getNearbyHospitals, calculateDistance } from "./hospital.service.js";

/**
 * Calculate top 5 nearest hospitals by straight-line distance
 */
const filterTopHospitalsByDistance = (hospitals, userLat, userLng) => {
  const hospitalsWithDistance = hospitals
    .map((hospital) => ({
      ...hospital,
      straightLineDistance: calculateDistance(
        userLat,
        userLng,
        hospital.location.lat,
        hospital.location.lng
      ),
    }))
    .sort((a, b) => a.straightLineDistance - b.straightLineDistance)
    .slice(0, 5);

  return hospitalsWithDistance;
};

/**
 * Get actual travel time from TomTom Routing API
 * Returns travel time in seconds
 */
const getTravelTimeFromTomTom = async (userLat, userLng, hospitalLat, hospitalLng) => {
  const TOMTOM_API_KEY = process.env.TOMTOM_API_KEY;

  if (!TOMTOM_API_KEY) {
    throw new ApiError(503, "TomTom API key not configured");
  }

  try {
    const url = `https://api.tomtom.com/routing/1/calculateRoute/${userLat},${userLng}:${hospitalLat},${hospitalLng}/json`;

    const response = await axios.get(url, {
      params: {
        key: TOMTOM_API_KEY,
        routeType: "fastest", // Accounts for current traffic
        computeTravelTimeFor: "all", // Get all time estimates
        traffic: "true", // Include live traffic
      },
      timeout: 10000,
    });

    if (!response.data?.routes || response.data.routes.length === 0) {
      return null;
    }

    const route = response.data.routes[0];
    const travelTimeInSeconds = Math.round(route.summary.travelTimeInSeconds);

    return {
      travelTimeInSeconds,
      travelTimeInMinutes: Math.round(travelTimeInSeconds / 60),
      distance: Math.round(route.summary.lengthInMeters / 1000), // in km
    };
  } catch (error) {
    console.error(
      `[TomTom Service] Error for hospital (${hospitalLat}, ${hospitalLng}):`,
      error.message
    );
    return null;
  }
};

/**
 * Get traffic-aware travel times for all top 5 hospitals
 * Makes concurrent requests to TomTom
 */
const getTrafficAwareRoutingForTopHospitals = async (
  topHospitals,
  userLat,
  userLng
) => {
  console.log(
    `[SOS Service] Fetching TomTom routing for ${topHospitals.length} hospitals...`
  );

  // Make concurrent requests
  const responses = await Promise.all(
    topHospitals.map(async (hospital) => {
      const routingData = await getTravelTimeFromTomTom(
        userLat,
        userLng,
        hospital.location.lat,
        hospital.location.lng
      );

      return {
        ...hospital,
        routing: routingData,
      };
    })
  );

  // Filter out hospitals where TomTom failed and return valid ones
  return responses.filter((h) => h.routing !== null);
};

/**
 * Find the closest hospital considering both distance and traffic
 * Returns the hospital with minimum travel time
 */
const findBestHospitalForSOS = async (userLat, userLng, radius = 8000) => {
  console.log(
    `[SOS Service] Starting SOS sequence for location: ${userLat}, ${userLng}`
  );

  // Step 1: Get all hospitals within 8km using Overpass API
  console.log("[SOS Service] Step 1: Querying Overpass API...");
  const allHospitals = await getNearbyHospitals(userLat, userLng, radius);

  if (allHospitals.length === 0) {
    throw new ApiError(404, "No hospitals found within 8 kilometers");
  }

  console.log("[SOS Service] Hospital details from Overpass (up to first 10):");
  allHospitals.slice(0, 10).forEach((hospital, index) => {
    console.log(
      `[SOS Service] #${index + 1}`,
      {
        id: hospital.id,
        name: hospital.name,
        location: hospital.location,
        address: hospital.address,
        phone: hospital.phone,
        email: hospital.email,
        website: hospital.website,
        emergency: hospital.emergency,
      }
    );
  });

  console.log(
    `[SOS Service] Found ${allHospitals.length} hospitals via Overpass API`
  );

  // Step 2: Filter top 5 by Haversine distance
  console.log("[SOS Service] Step 2: Filtering top 5 by straight-line distance...");
  const top5Hospitals = filterTopHospitalsByDistance(
    allHospitals,
    userLat,
    userLng
  );

  console.log(`[SOS Service] Top 5 hospitals by distance:`, 
    top5Hospitals.map((h) => `${h.name} (${h.straightLineDistance.toFixed(2)} km)`)
  );

  // Step 3: Get traffic-aware routing for top 5
  console.log("[SOS Service] Step 3: Fetching real-time traffic data from TomTom...");
  const hospitalsWithRouting = await getTrafficAwareRoutingForTopHospitals(
    top5Hospitals,
    userLat,
    userLng
  );

  if (hospitalsWithRouting.length > 0) {
    console.log("[SOS Service] Top hospitals with traffic routing details:");
    hospitalsWithRouting.forEach((hospital, index) => {
      console.log(
        `[SOS Service] Candidate #${index + 1}`,
        {
          id: hospital.id,
          name: hospital.name,
          straightLineDistanceKm: Number(hospital.straightLineDistance?.toFixed(2)),
          travelTimeInMinutes: hospital.routing?.travelTimeInMinutes,
          travelTimeInSeconds: hospital.routing?.travelTimeInSeconds,
          routeDistanceKm: hospital.routing?.distance,
          address: hospital.address,
          phone: hospital.phone,
          email: hospital.email,
        }
      );
    });
  }

  if (hospitalsWithRouting.length === 0) {
    // Fallback to straight-line distance if TomTom fails
    console.warn("[SOS Service] TomTom routing failed for all hospitals. Using Haversine distance.");
    return top5Hospitals[0];
  }

  // Step 4: Select hospital with minimum travel time (accounting for traffic)
  const bestHospital = hospitalsWithRouting.reduce((best, current) => {
    return current.routing.travelTimeInSeconds < best.routing.travelTimeInSeconds
      ? current
      : best;
  });

  console.log(
    `[SOS Service] ✓ Selected hospital: ${bestHospital.name} (${bestHospital.routing.travelTimeInMinutes} min drive)`
  );

  return bestHospital;
};

export {
  findBestHospitalForSOS,
  filterTopHospitalsByDistance,
  getTravelTimeFromTomTom,
};
