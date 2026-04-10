import { Router } from "express";
import { fetchNearbyHospitals } from "../controllers/hospital.controllers.js";

const router = Router();

router.route("/nearby").get(fetchNearbyHospitals);

export default router;
