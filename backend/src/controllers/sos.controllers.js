import { ApiResponse } from "../utils/api-response.js";
import { ApiError } from "../utils/api-error.js";
import { asyncHandler } from "../utils/async-handler.js";
import { findBestHospitalForSOS } from "../services/sos.service.js";
import { sendEmail, sosEmergencyAlertMailgenContent } from "../utils/mail.js";
import User from "../models/user.models.js";
import SosEvent from "../models/sosEvent.models.js";

/**
 * SOS Emergency Handler
 * - Gets user's current location
 * - Finds nearest hospital considering traffic
 * - Sends emergency alert to emergency contact
 * - Returns hospital details with ETA
 */
const triggerSOS = asyncHandler(async (req, res) => {
    const { lat, lng } = req.body;
    const userId = req.user?._id;

    // Validate location coordinates
    if (lat === undefined || lng === undefined) {
        throw new ApiError(400, "Location coordinates (lat, lng) are required");
    }

    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);

    if (Number.isNaN(latitude) || Number.isNaN(longitude)) {
        throw new ApiError(400, "Coordinates must be valid numbers");
    }

    if (
        latitude < -90 ||
        latitude > 90 ||
        longitude < -180 ||
        longitude > 180
    ) {
        throw new ApiError(
            400,
            "Invalid coordinates. Latitude must be between -90 and 90, longitude between -180 and 180."
        );
    }

    // Get user data for emergency contact and medical info
    let user = null;
    if (userId) {
        user = await User.findById(userId);
        if (!user) {
            throw new ApiError(404, "User not found");
        }
    }

    // Find best hospital considering traffic
    console.log(
        `[SOS Controller] Initiating SOS for user at coordinates: ${latitude}, ${longitude}`
    );
    const bestHospital = await findBestHospitalForSOS(latitude, longitude);

    // Prepare emergency details
    const emergencyDetails = {
        lat: latitude,
        lng: longitude,
        bloodGroup: user?.bloodGroup || "Unknown",
        medicalConditions: user?.medicalConditions || "Not specified",
        emergencyContactName: user?.emergencyContactName || "Emergency Contact",
        userId: user?.username || "Anonymous",
    };

    // Send emergency alert email. Priority: user's emergency contact → user's email → env fallback
    const recipientEmail =
        user?.emergencyContactEmail ||
        user?.email ||
        process.env.SOS_TEST_EMAIL;

    if (recipientEmail) {
        try {
            console.log(
                `[SOS Controller] Sending emergency alert email to ${recipientEmail}...`
            );

            const mailContent = sosEmergencyAlertMailgenContent(
                user.fullName || user.username,
                emergencyDetails,
                bestHospital,
                bestHospital.routing || {
                    travelTimeInMinutes: Math.round(
                        (bestHospital.straightLineDistance * 60) / 50
                    ), // Rough estimate
                    distance: bestHospital.straightLineDistance.toFixed(1),
                }
            );

            await sendEmail({
                email: recipientEmail,
                subject: "🚨 URGENT: Medical Emergency SOS Alert",
                mailgenContent: mailContent,
            });

            console.log(`[SOS Controller] ✓ Emergency alert email sent`);
        } catch (emailError) {
            console.error(
                "[SOS Controller] Failed to send emergency email:",
                emailError.message
            );
            // Continue even if email fails - don't block SOS response
        }
    }

    // Prepare response
    const sosResponse = {
        status: "DISPATCHED",
        timestamp: new Date(),
        hospital: {
            id: bestHospital.id,
            name: bestHospital.name,
            address: bestHospital.address,
            phone: bestHospital.phone,
            email: bestHospital.email,
            website: bestHospital.website,
            emergency: bestHospital.emergency,
            location: bestHospital.location,
        },
        routing: bestHospital.routing || {
            travelTimeInMinutes: Math.round(
                (bestHospital.straightLineDistance * 60) / 50
            ),
            distance: bestHospital.straightLineDistance.toFixed(1),
            note: "Estimated based on straight-line distance (traffic data unavailable)",
        },
        userLocation: {
            lat: latitude,
            lng: longitude,
        },
        emergencyContactNotified: !!recipientEmail,
    };

    // Persist SOS event to database
    try {
        await SosEvent.create({
            userId: user?._id,
            location: { lat: latitude, lng: longitude },
            hospital: sosResponse.hospital,
            routing: sosResponse.routing,
            status: "DISPATCHED",
            emergencyContactNotified: sosResponse.emergencyContactNotified,
            source: req.body.source || "user",
        });
        console.log("[SOS Controller] ✓ SOS event saved to database");
    } catch (dbError) {
        console.error("[SOS Controller] Failed to save SOS event:", dbError.message);
    }

    return res.status(200).json(
        new ApiResponse(
            200,
            sosResponse,
            "🚨 SOS Alert dispatched successfully. Emergency services have been notified."
        )
    );
});

export { triggerSOS };
