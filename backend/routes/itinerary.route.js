import express from "express";
import { verifyToken } from "../utils/verifyUser.js";
import {
    createItinerary,
    getItineraries,
    getItinerariesByUser,
    updateItinerary,
    deleteItinerary,
    toggleItineraryVisibility
} from "../controllers/itinerary.controller.js";

const router = express.Router();

router.post('/', verifyToken, createItinerary);
router.get('/', verifyToken, getItineraries);
router.get('/user/:userId', verifyToken, getItinerariesByUser);
router.put('/:itineraryId', verifyToken, updateItinerary);
router.delete('/:itineraryId', verifyToken, deleteItinerary);
router.put('/:itineraryId/visibility', verifyToken, toggleItineraryVisibility);

export default router;
