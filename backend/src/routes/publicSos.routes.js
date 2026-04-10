import { Router } from "express";
import { triggerPublicSOS } from "../controllers/publicSos.controllers.js";

const router = Router();

/**
 * POST /api/v1/public-sos
 * Report an emergency without authentication (bystander mode)
 * Body: { lat, lng, description?, reporterPhone? }
 */
router.route("/").post(triggerPublicSOS);

export default router;
