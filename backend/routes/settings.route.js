import express from "express";
import { verifyToken } from "../utils/verifyUser.js";
import { defineTimeWarningNew, getAllSettings, getTimeWarningNew, defineTimeBookedBefore } from "../controllers/settings.controller.js";

const router = express.Router();

router.get('/allSettings', verifyToken, getAllSettings);
router.get('/getTimeWarningNew', getTimeWarningNew);
router.post('/defineTimeWarningNew', verifyToken, defineTimeWarningNew);
router.post('/defineTimeBookedBefore', verifyToken, defineTimeBookedBefore);

export default router;