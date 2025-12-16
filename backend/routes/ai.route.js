import express from 'express';
import { verifyToken } from '../utils/verifyUser.js'; 
import {
    generateAiItinerary,
    listAiItineraries,
    getAiItinerary,
    updateAiItinerary,
    deleteAiItinerary,
    modifyAiItinerary,
    askItineraryChatbot,
    reorderItineraryStops,
    moveStopBetweenDays,
    copyItineraryToUser,
    shareItinerary,
    addItineraryStop,    
    removeItineraryStop  
} from '../controllers/aiItinerary.controller.js';

const router = express.Router();

// --- GENEL ROTALAR ---
router.post('/itineraries/generate', verifyToken, generateAiItinerary);
router.get('/itineraries', verifyToken, listAiItineraries);
router.post('/chatbot', verifyToken, askItineraryChatbot);
router.get('/itineraries/:id', verifyToken, getAiItinerary);
router.patch('/itineraries/:id', verifyToken, updateAiItinerary);
router.delete('/itineraries/:id', verifyToken, deleteAiItinerary);
router.post('/itineraries/:id/modify', verifyToken, modifyAiItinerary);
router.post('/itineraries/:id/stops', verifyToken, addItineraryStop);
router.delete('/itineraries/:id/stops/:stopId', verifyToken, removeItineraryStop);
router.patch('/itineraries/:id/reorder', verifyToken, reorderItineraryStops);
router.patch('/itineraries/:id/move', verifyToken, moveStopBetweenDays);
router.post('/itineraries/:id/copy', verifyToken, copyItineraryToUser);
router.patch('/itineraries/:id/share', verifyToken, shareItinerary); // Status update için

export default router;

