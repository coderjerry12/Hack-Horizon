import { Router } from "express";
import { triggerSOS } from "../controllers/sos.controllers.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

/**
 * POST /api/v1/sos/trigger
 * Trigger SOS emergency alert
 * - Finds nearest hospital with traffic consideration
 * - Sends emergency alert to emergency contact
 * - Returns hospital details with ETA
 * 
 * Body:
 * {
 *   "lat": number (user's latitude),
 *   "lng": number (user's longitude)
 * }
 * 
 * Authentication: Optional (but recommended for email dispatch)
 */
router.route("/trigger").post(verifyJWT, triggerSOS);

export default router;
