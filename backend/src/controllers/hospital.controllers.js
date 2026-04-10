import { ApiResponse } from "../utils/api-response.js";
import { ApiError } from "../utils/api-error.js";
import { asyncHandler } from "../utils/async-handler.js";
import { getNearbyHospitals } from "../services/hospital.service.js";

const fetchNearbyHospitals = asyncHandler(async (req, res) => {
    const { lat, lng, radius } = req.query;

    if (!lat || !lng) {
        throw new ApiError(400, "Both 'lat' and 'lng' query parameters are required");
    }

    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);

    if (Number.isNaN(latitude) || Number.isNaN(longitude)) {
        throw new ApiError(400, "'lat' and 'lng' must be valid numbers");
    }

    if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
        throw new ApiError(
            400,
            "Invalid coordinates. Latitude must be between -90 and 90, longitude between -180 and 180."
        );
    }

    const searchRadius = radius ? parseInt(radius, 10) : 5000;

    if (Number.isNaN(searchRadius) || searchRadius < 1 || searchRadius > 50000) {
        throw new ApiError(
            400,
            "Radius must be a number between 1 and 50000 metres"
        );
    }

    const hospitals = await getNearbyHospitals(latitude, longitude, searchRadius);

    return res.status(200).json(
        new ApiResponse(
            200,
            {
                count: hospitals.length,
                hospitals,
            },
            hospitals.length
                ? "Nearby hospitals fetched successfully"
                : "No hospitals found within the specified radius"
        )
    );
});

export { fetchNearbyHospitals };
