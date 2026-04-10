import { ApiError } from "../utils/api-error.js";
import { asyncHandler } from "../utils/async-handler.js";

/**
 * Middleware to verify admin role.
 * Must be used AFTER verifyJWT middleware.
 */
export const verifyAdmin = asyncHandler(async (req, _res, next) => {
    if (!req.user) {
        throw new ApiError(401, "Authentication required");
    }

    if (req.user.role !== "admin") {
        throw new ApiError(403, "Access denied. Admin privileges required.");
    }

    next();
});
