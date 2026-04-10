import { Router } from "express";
import { getHistory } from "../controllers/history.controllers.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

/**
 * GET /api/v1/history
 * Get authenticated user's SOS event history
 * Query params: page, limit
 */
router.route("/").get(verifyJWT, getHistory);

export default router;
