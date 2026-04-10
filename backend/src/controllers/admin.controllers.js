import { ApiResponse } from "../utils/api-response.js";
import { ApiError } from "../utils/api-error.js";
import { asyncHandler } from "../utils/async-handler.js";
import User from "../models/user.models.js";
import SosEvent from "../models/sosEvent.models.js";

/**
 * GET /api/v1/admin/stats
 * Aggregated dashboard statistics
 */
const getAdminStats = asyncHandler(async (_req, res) => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [
        totalUsers,
        totalSosEvents,
        todayEvents,
        last7DaysEvents,
        last30DaysEvents,
        bySource,
        byStatus,
        recentEvents,
    ] = await Promise.all([
        User.countDocuments(),
        SosEvent.countDocuments(),
        SosEvent.countDocuments({ createdAt: { $gte: todayStart } }),
        SosEvent.countDocuments({ createdAt: { $gte: last7Days } }),
        SosEvent.countDocuments({ createdAt: { $gte: last30Days } }),
        SosEvent.aggregate([
            { $group: { _id: "$source", count: { $sum: 1 } } },
        ]),
        SosEvent.aggregate([
            { $group: { _id: "$status", count: { $sum: 1 } } },
        ]),
        SosEvent.find()
            .sort({ createdAt: -1 })
            .limit(5)
            .populate("userId", "username fullName email")
            .lean(),
    ]);

    // Build source breakdown
    const sourceBreakdown = {};
    bySource.forEach((s) => (sourceBreakdown[s._id || "unknown"] = s.count));

    // Build status breakdown
    const statusBreakdown = {};
    byStatus.forEach((s) => (statusBreakdown[s._id || "unknown"] = s.count));

    return res.status(200).json(
        new ApiResponse(200, {
            totalUsers,
            totalSosEvents,
            todayEvents,
            last7DaysEvents,
            last30DaysEvents,
            sourceBreakdown,
            statusBreakdown,
            recentEvents,
        }, "Admin stats fetched")
    );
});

/**
 * GET /api/v1/admin/users
 * Paginated list of all users
 */
const getAllUsers = asyncHandler(async (req, res) => {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 20));
    const skip = (page - 1) * limit;
    const search = req.query.search || "";

    const query = search
        ? {
              $or: [
                  { username: { $regex: search, $options: "i" } },
                  { email: { $regex: search, $options: "i" } },
                  { fullName: { $regex: search, $options: "i" } },
              ],
          }
        : {};

    const [users, total] = await Promise.all([
        User.find(query)
            .select("-password -refreshToken -emailVerificationToken -emailVerificationExpiry -forgotPasswordToken -forgotPasswordExpiry")
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean(),
        User.countDocuments(query),
    ]);

    return res.status(200).json(
        new ApiResponse(200, {
            users,
            pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
        }, "Users fetched")
    );
});

/**
 * GET /api/v1/admin/sos-events
 * Paginated + filterable SOS event log
 */
const getAllSosEvents = asyncHandler(async (req, res) => {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 20));
    const skip = (page - 1) * limit;

    // Build filter
    const filter = {};
    if (req.query.source) filter.source = req.query.source;
    if (req.query.status) filter.status = req.query.status;

    const [events, total] = await Promise.all([
        SosEvent.find(filter)
            .populate("userId", "username fullName email bloodGroup medicalConditions emergencyContactName emergencyContactPhone emergencyContactEmail")
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean(),
        SosEvent.countDocuments(filter),
    ]);

    return res.status(200).json(
        new ApiResponse(200, {
            events,
            pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
        }, "SOS events fetched")
    );
});

/**
 * GET /api/v1/admin/recent-emergencies
 * Last 24h events for the live emergency map
 */
const getRecentEmergencies = asyncHandler(async (_req, res) => {
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const events = await SosEvent.find({ createdAt: { $gte: since } })
        .populate("userId", "username fullName")
        .sort({ createdAt: -1 })
        .lean();

    return res.status(200).json(
        new ApiResponse(200, { events, count: events.length }, "Recent emergencies fetched")
    );
});

/**
 * DELETE /api/v1/admin/users/:id
 * Remove a user by ID
 */
const deleteUser = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const user = await User.findById(id);
    if (!user) {
        throw new ApiError(404, "User not found");
    }

    // Prevent deleting yourself
    if (user._id.toString() === req.user._id.toString()) {
        throw new ApiError(400, "You cannot delete your own admin account");
    }

    await User.findByIdAndDelete(id);

    return res.status(200).json(
        new ApiResponse(200, { deletedUserId: id }, "User deleted successfully")
    );
});

/**
 * PATCH /api/v1/admin/users/:id/role
 * Promote or demote a user
 */
const updateUserRole = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { role } = req.body;

    if (!["user", "admin"].includes(role)) {
        throw new ApiError(400, "Role must be 'user' or 'admin'");
    }

    const user = await User.findById(id);
    if (!user) {
        throw new ApiError(404, "User not found");
    }

    user.role = role;
    await user.save({ validateBeforeSave: false });

    return res.status(200).json(
        new ApiResponse(200, { userId: id, newRole: role }, `User role updated to ${role}`)
    );
});

export {
    getAdminStats,
    getAllUsers,
    getAllSosEvents,
    getRecentEmergencies,
    deleteUser,
    updateUserRole,
};
