import express from "express";
import { verifyToken, verifyOptionalToken } from "../utils/verifyUser.js";
import {
    createRoute,
    createRouteFromItinerary,
    getRoutes,
    updateRoute,
    deleteRoute,
    toggleRouteLike,
    forkRoute
} from "../controllers/route.controller.js";

const router = express.Router();

router.post('/', verifyToken, createRoute);
router.post('/from-itinerary', verifyToken, createRouteFromItinerary);
router.get('/', verifyOptionalToken, getRoutes);
router.put('/:routeId', verifyToken, updateRoute);
router.delete('/:routeId', verifyToken, deleteRoute);
router.post('/:routeId/like', verifyToken, toggleRouteLike);
router.post('/:routeId/fork', verifyToken, forkRoute);

export default router;