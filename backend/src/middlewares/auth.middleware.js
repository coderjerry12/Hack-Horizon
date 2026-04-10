import User from '../models/user.models.js';
import { ApiError } from '../utils/api-error.js';
import { asyncHandler } from '../utils/async-handler.js';
import jwt from 'jsonwebtoken';
import { ProjectMember } from '../models/projectmember.models.js';

export const verifyJWT = asyncHandler(async (req, res, next) => {
    const token =
        req.cookies?.accessToken ||
        req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
        throw new ApiError(401, "Unauthorized Request");
    }

    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

    const user = await User.findById(decoded?._id).select(
        "-password -refreshToken -emailVerificationToken -emailVerificationTokenExpires"
    );

    if (!user) {
        throw new ApiError(401, "Invalid Access Token");
    }

    req.user = user;
    next();
});

export const checkProjectRole = (roles) => asyncHandler(async (req, res, next) => {
    const { projectId } = req.params;
    const userId = req.user?._id;

    if (!projectId) {
        throw new ApiError(400, "Project ID is required");
    }

    const member = await ProjectMember.findOne({
        project: projectId,
        user: userId
    });

    if (!member) {
        throw new ApiError(403, "You are not a member of this project");
    }

    if (!roles.includes(member.role)) {
        throw new ApiError(403, "You do not have permission to perform this action");
    }

    req.projectMember = member;
    next();
});