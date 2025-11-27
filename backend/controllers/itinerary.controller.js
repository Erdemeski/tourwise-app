import Itinerary from "../models/itinerary.model.js";
import Route from "../models/route.model.js";
import { errorHandler } from "../utils/error.js";

const sanitizeArray = (value) => {
    if (!value) return [];
    if (Array.isArray(value)) {
        return value.filter(Boolean).map((item) => String(item).trim()).filter(Boolean);
    }
    return String(value)
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);
};

export const createItinerary = async (req, res, next) => {
    try {
        if (!req.user) {
            return next(errorHandler(401, "You must be signed in to create an itinerary"));
        }

        const {
            routeId,
            title,
            summary,
            notes,
            visibility = "private",
            waypointList,
            tags,
            coverImage,
        } = req.body;

        if (!routeId || !title) {
            return next(errorHandler(400, "Route and title are required"));
        }

        const baseRoute = await Route.findById(routeId);
        if (!baseRoute) {
            return next(errorHandler(404, "Route not found"));
        }

        const tagsToUse = (Array.isArray(tags) && tags.length > 0) || (typeof tags === 'string' && tags.trim().length > 0)
            ? tags
            : baseRoute.tags;

        const itinerary = new Itinerary({
            userId: req.user.id,
            routeId,
            source: 'route',
            title,
            summary: summary || baseRoute.summary,
            notes: notes || "",
            visibility,
            coverImage: coverImage || baseRoute.coverImage,
            tags: sanitizeArray(tagsToUse),
            waypointList: Array.isArray(waypointList) && waypointList.length > 0 ? waypointList : baseRoute.waypointList,
            forkedFromRouteId: baseRoute._id.toString(),
            durationDays: baseRoute.durationDays || (Array.isArray(waypointList) ? waypointList.length : 0),
        });

        const savedItinerary = await itinerary.save();
        res.status(201).json(savedItinerary);
    } catch (error) {
        next(error);
    }
};

const buildItineraryQuery = (req) => {
    const query = {};
    const viewerId = req.user?.id;
    const isAdmin = req.user?.isAdmin === true;

    if (req.query.userId) {
        query.userId = req.query.userId;
        if (req.query.userId !== viewerId && !isAdmin) {
            query.visibility = 'shared';
        }
    } else if (!isAdmin) {
        query.visibility = 'shared';
    }

    if (req.query.routeId) {
        query.routeId = req.query.routeId;
    }

    if (req.query.status) {
        query.status = req.query.status;
    }

    if (req.query.tag) {
        query.tags = { $in: [req.query.tag] };
    }

    if (req.query.source) {
        query.source = req.query.source;
    }

    return query;
};

export const getItineraries = async (req, res, next) => {
    if (!req.user?.isAdmin) {
        return next(errorHandler(403, "Only admins can access all itineraries"));
    }

    try {
        const startIndex = parseInt(req.query.startIndex, 10) || 0;
        const limit = parseInt(req.query.limit, 10) || 10;
        const sortDirection = req.query.order === "asc" ? 1 : -1;
        const sortField = req.query.sortBy || "createdAt";

        const query = buildItineraryQuery(req);

        const itineraries = await Itinerary.find(query)
            .sort({ [sortField]: sortDirection })
            .skip(startIndex)
            .limit(limit);

        const totalItineraries = await Itinerary.countDocuments(query);

        const now = new Date();
        const oneMonthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
        const lastMonthItineraries = await Itinerary.countDocuments({
            ...query,
            createdAt: { $gte: oneMonthAgo },
        });

        res.status(200).json({
            itineraries,
            totalItineraries,
            lastMonthItineraries,
        });
    } catch (error) {
        next(error);
    }
};

export const getItinerariesByUser = async (req, res, next) => {
    try {
        if (!req.user) {
            return next(errorHandler(401, "You must be signed in to view itineraries"));
        }

        const { userId } = req.params;
        const isOwner = req.user.id === userId;
        const isAdmin = req.user?.isAdmin === true;

        if (!isOwner && !isAdmin) {
            return next(errorHandler(403, "You are not allowed to view these itineraries"));
        }

        const query = buildItineraryQuery({ ...req, query: { ...req.query, userId } });

        const itineraries = await Itinerary.find(query).sort({ createdAt: -1 });
        res.status(200).json(itineraries);
    } catch (error) {
        next(error);
    }
};

export const updateItinerary = async (req, res, next) => {
    try {
        if (!req.user) {
            return next(errorHandler(401, "You must be signed in to update an itinerary"));
        }

        const { itineraryId } = req.params;
        const itinerary = await Itinerary.findById(itineraryId);

        if (!itinerary) {
            return next(errorHandler(404, "Itinerary not found"));
        }

        const isOwner = itinerary.userId === req.user.id;
        const isAdmin = req.user?.isAdmin === true;

        if (!isOwner && !isAdmin) {
            return next(errorHandler(403, "You are not allowed to update this itinerary"));
        }

        const updates = { ...req.body };

        if ("tags" in updates) {
            updates.tags = sanitizeArray(updates.tags);
        }

        if ("waypointList" in updates && !Array.isArray(updates.waypointList)) {
            updates.waypointList = [];
        }

        const updatedItinerary = await Itinerary.findByIdAndUpdate(
            itineraryId,
            { $set: updates },
            { new: true }
        );

        res.status(200).json(updatedItinerary);
    } catch (error) {
        next(error);
    }
};

export const deleteItinerary = async (req, res, next) => {
    try {
        if (!req.user) {
            return next(errorHandler(401, "You must be signed in to delete an itinerary"));
        }

        const { itineraryId } = req.params;
        const itinerary = await Itinerary.findById(itineraryId);

        if (!itinerary) {
            return next(errorHandler(404, "Itinerary not found"));
        }

        const isOwner = itinerary.userId === req.user.id;
        const isAdmin = req.user?.isAdmin === true;

        if (!isOwner && !isAdmin) {
            return next(errorHandler(403, "You are not allowed to delete this itinerary"));
        }

        await Itinerary.findByIdAndDelete(itineraryId);
        res.status(200).json({ message: "Itinerary deleted successfully" });
    } catch (error) {
        next(error);
    }
};

export const toggleItineraryVisibility = async (req, res, next) => {
    try {
        if (!req.user) {
            return next(errorHandler(401, "You must be signed in to update visibility"));
        }

        const { itineraryId } = req.params;
        const itinerary = await Itinerary.findById(itineraryId);

        if (!itinerary) {
            return next(errorHandler(404, "Itinerary not found"));
        }

        const isOwner = itinerary.userId === req.user.id;
        const isAdmin = req.user?.isAdmin === true;

        if (!isOwner && !isAdmin) {
            return next(errorHandler(403, "You are not allowed to update this itinerary"));
        }

        itinerary.visibility = itinerary.visibility === "private" ? "shared" : "private";

        await itinerary.save();
        res.status(200).json(itinerary);
    } catch (error) {
        next(error);
    }
};
