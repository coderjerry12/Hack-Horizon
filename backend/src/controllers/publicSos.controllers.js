import { ApiResponse } from "../utils/api-response.js";
import { ApiError } from "../utils/api-error.js";
import { asyncHandler } from "../utils/async-handler.js";
import { findBestHospitalForSOS } from "../services/sos.service.js";
import { sendEmail, sosEmergencyAlertMailgenContent } from "../utils/mail.js";
import SosEvent from "../models/sosEvent.models.js";

/**
 * Public SOS — no auth required
 * For bystanders reporting an emergency on behalf of a victim
 */
const triggerPublicSOS = asyncHandler(async (req, res) => {
    const { lat, lng, description, reporterPhone } = req.body;

    // Validate coordinates
    if (lat === undefined || lng === undefined) {
        throw new ApiError(400, "Location coordinates (lat, lng) are required");
    }

    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);

    if (Number.isNaN(latitude) || Number.isNaN(longitude)) {
        throw new ApiError(400, "Coordinates must be valid numbers");
    }

    if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
        throw new ApiError(400, "Invalid coordinates range");
    }

    // Find nearest hospital
    console.log(`[Public SOS] Bystander report at: ${latitude}, ${longitude}`);
    const bestHospital = await findBestHospitalForSOS(latitude, longitude);

    // Send alert to default emergency email from env
    const recipientEmail = process.env.SOS_TEST_EMAIL;

    if (recipientEmail) {
        try {
            const emergencyDetails = {
                lat: latitude,
                lng: longitude,
                bloodGroup: "Unknown (Bystander Report)",
                medicalConditions: description || "Not specified",
                emergencyContactName: "Emergency Services",
                userId: "Bystander",
            };

            const mailContent = sosEmergencyAlertMailgenContent(
                `Bystander Report${reporterPhone ? ` (${reporterPhone})` : ""}`,
                emergencyDetails,
                bestHospital,
                bestHospital.routing || {
                    travelTimeInMinutes: Math.round((bestHospital.straightLineDistance * 60) / 50),
                    distance: bestHospital.straightLineDistance.toFixed(1),
                }
            );

            await sendEmail({
                email: recipientEmail,
                subject: "🚨 BYSTANDER REPORT: Emergency at Location",
                mailgenContent: mailContent,
            });

            console.log("[Public SOS] ✓ Alert email sent");
        } catch (emailError) {
            console.error("[Public SOS] Email failed:", emailError.message);
        }
    }

    // Build response
    const sosResponse = {
        status: "DISPATCHED",
        timestamp: new Date(),
        hospital: {
            id: bestHospital.id,
            name: bestHospital.name,
            address: bestHospital.address,
            phone: bestHospital.phone,
            website: bestHospital.website,
            emergency: bestHospital.emergency,
            location: bestHospital.location,
        },
        routing: bestHospital.routing || {
            travelTimeInMinutes: Math.round((bestHospital.straightLineDistance * 60) / 50),
            distance: bestHospital.straightLineDistance.toFixed(1),
            note: "Estimated based on straight-line distance",
        },
        userLocation: { lat: latitude, lng: longitude },
    };

    // Persist to database
    try {
        await SosEvent.create({
            location: { lat: latitude, lng: longitude },
            hospital: sosResponse.hospital,
            routing: sosResponse.routing,
            status: "DISPATCHED",
            emergencyContactNotified: !!recipientEmail,
            source: "bystander",
            bystanderInfo: {
                phone: reporterPhone || null,
                description: description || null,
            },
        });
    } catch (dbError) {
        console.error("[Public SOS] DB save failed:", dbError.message);
    }

    return res.status(200).json(
        new ApiResponse(200, sosResponse, "🚨 Emergency reported. Nearest hospital has been identified.")
    );
});

export { triggerPublicSOS };
