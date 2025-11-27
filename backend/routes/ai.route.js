import express from "express";
import { verifyToken } from "../utils/verifyUser.js";
import {
    askItineraryChatbot,
    deleteAiItinerary,
    generateAiItinerary,
    getAiItinerary,
    listAiItineraries,
    updateAiItinerary,
    reorderItineraryStops,
    moveStopBetweenDays,
    copyItineraryToUser,
    shareItinerary
} from "../controllers/aiItinerary.controller.js";

const router = express.Router();

router.post("/itineraries/generate", verifyToken, generateAiItinerary);
router.get("/itineraries", verifyToken, listAiItineraries);
router.get("/itineraries/:id", verifyToken, getAiItinerary);
router.patch("/itineraries/:id", verifyToken, updateAiItinerary);
router.delete("/itineraries/:id", verifyToken, deleteAiItinerary);

// Yeni Eklenen Özellikler
router.patch("/itineraries/:id/reorder", verifyToken, reorderItineraryStops);
router.patch("/itineraries/:id/move", verifyToken, moveStopBetweenDays);
router.post("/itineraries/:id/copy", verifyToken, copyItineraryToUser);
router.post("/itineraries/:id/share", verifyToken, shareItinerary);

router.post("/chatbot", verifyToken, askItineraryChatbot);

export default router;
