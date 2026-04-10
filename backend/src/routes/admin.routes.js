import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { verifyAdmin } from "../middlewares/admin.middleware.js";
import {
    getAdminStats,
    getAllUsers,
    getAllSosEvents,
    getRecentEmergencies,
    deleteUser,
    updateUserRole,
} from "../controllers/admin.controllers.js";

const router = Router();

// All admin routes require JWT + admin role
router.use(verifyJWT, verifyAdmin);

router.route("/stats").get(getAdminStats);
router.route("/users").get(getAllUsers);
router.route("/users/:id").delete(deleteUser);
router.route("/users/:id/role").patch(updateUserRole);
router.route("/sos-events").get(getAllSosEvents);
router.route("/recent-emergencies").get(getRecentEmergencies);

export default router;
