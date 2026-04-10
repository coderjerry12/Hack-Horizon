import { ApiResponse } from "../utils/api-response.js";
import { asyncHandler } from "../utils/async-handler.js";
import SosEvent from "../models/sosEvent.models.js";

/**
 * Get SOS event history for the authenticated user
 * Supports pagination via ?page=1&limit=10
 */
const getHistory = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 15));
    const skip = (page - 1) * limit;

    const [events, total] = await Promise.all([
        SosEvent.find({ userId })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean(),
        SosEvent.countDocuments({ userId }),
    ]);

    return res.status(200).json(
        new ApiResponse(
            200,
            {
                events,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit),
                },
            },
            events.length
                ? "SOS history fetched successfully"
                : "No SOS events found"
        )
    );
});

export { getHistory };
