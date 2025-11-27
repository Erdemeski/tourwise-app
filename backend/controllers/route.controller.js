import Route from "../models/route.model.js";
import Comment from "../models/comment.model.js";
import User from "../models/user.model.js";
import Itinerary from "../models/itinerary.model.js";
import { errorHandler } from "../utils/error.js";
import { mapDaysToWaypointList } from "../utils/itineraryMapper.js";

const buildSlug = (title = "") => {
    const base = title
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-");

    const randomSuffix = Math.random().toString(36).substring(2, 7);
    return `${base}-${randomSuffix}`;
};

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

export const createRoute = async (req, res, next) => {
    try {
        if (!req.user) {
            return next(errorHandler(401, "You must be signed in to create a route"));
        }

        const {
            title,
            summary,
            visibility = "private",
            coverImage,
            gallery,
            tags,
            terrainTypes,
            season,
            startLocation,
            endLocation,
            distanceKm,
            durationDays,
            overview,
            itinerary,
            highlights,
            tips,
            waypointList,
            allowForks = true,
            allowComments = true,
            sourceRouteId = null
        } = req.body;

        if (!title || !summary) {
            return next(errorHandler(400, "Title and summary are required"));
        }

        const slugCandidate = buildSlug(title);
        let slug = slugCandidate;
        let collisionCount = 0;
        while (await Route.findOne({ slug })) {
            collisionCount += 1;
            slug = `${slugCandidate}-${collisionCount}`;
        }

        const newRoute = new Route({
            userId: req.user.id,
            title,
            summary,
            visibility,
            slug,
            coverImage,
            gallery: sanitizeArray(gallery),
            tags: sanitizeArray(tags),
            terrainTypes: sanitizeArray(terrainTypes),
            season,
            startLocation,
            endLocation,
            distanceKm,
            durationDays,
            overview,
            itinerary,
            highlights,
            tips,
            waypointList: Array.isArray(waypointList) ? waypointList : [],
            allowForks,
            allowComments,
            sourceRouteId,
        });

        const savedRoute = await newRoute.save();
        res.status(201).json(savedRoute);
    } catch (error) {
        next(error);
    }
};

const buildNarrativeFromDays = (days = []) => {
    if (!Array.isArray(days) || !days.length) {
        return "";
    }

    return days
        .map((day) => {
            const header = `Day ${day?.dayNumber ?? ""}${day?.title ? ` - ${day.title}` : ""}`.trim();
            const summary = day?.summary ? `\n${day.summary}` : "";
            const stops = Array.isArray(day?.stops)
                ? day.stops
                    .map((stop, idx) => {
                        const label = stop?.name ?? `Stop ${idx + 1}`;
                        const city = stop?.location?.city ? ` (${stop.location.city})` : "";
                        const timeWindow =
                            stop?.startTime || stop?.endTime
                                ? ` [${stop?.startTime ?? ""}${stop?.endTime ? ` - ${stop.endTime}` : ""}]`
                                : "";
                        return `  ${idx + 1}. ${label}${city}${timeWindow}`;
                    })
                    .join("\n")
                : "";
            return `${header}${summary}${stops ? `\n${stops}` : ""}`;
        })
        .join("\n\n");
};

export const createRouteFromItinerary = async (req, res, next) => {
    try {
        if (!req.user) {
            return next(errorHandler(401, "You must be signed in to publish an itinerary"));
        }

        const {
            itineraryId,
            title,
            summary,
            visibility = "private",
            coverImage,
            gallery,
            tags,
            terrainTypes,
            season,
            startLocation,
            endLocation,
            distanceKm,
            durationDays,
            overview,
            itinerary: itineraryNarrative,
            highlights,
            tips,
            allowForks = true,
            allowComments = true,
            sharePublicly = false,
        } = req.body;

        if (!itineraryId) {
            return next(errorHandler(400, "Itinerary id is required"));
        }

        const baseItinerary = await Itinerary.findById(itineraryId);
        if (!baseItinerary) {
            return next(errorHandler(404, "Itinerary not found"));
        }

        if (baseItinerary.source !== "ai") {
            return next(errorHandler(400, "Only AI itineraries can be published through this endpoint"));
        }

        const isOwner = baseItinerary.userId === req.user.id;
        const isAdmin = req.user?.isAdmin === true;

        if (!isOwner && !isAdmin) {
            return next(errorHandler(403, "You are not allowed to publish this itinerary"));
        }

        const derivedWaypoints =
            Array.isArray(baseItinerary.waypointList) && baseItinerary.waypointList.length
                ? baseItinerary.waypointList
                : mapDaysToWaypointList(baseItinerary.days);

        const derivedTitle = title || baseItinerary.title;
        const derivedSummary = summary || baseItinerary.summary;

        if (!derivedTitle || !derivedSummary) {
            return next(errorHandler(400, "Title and summary are required to publish a route"));
        }

        const slugCandidate = buildSlug(derivedTitle);
        let slug = slugCandidate;
        let collisionCount = 0;
        while (await Route.findOne({ slug })) {
            collisionCount += 1;
            slug = `${slugCandidate}-${collisionCount}`;
        }

        const narrative = itineraryNarrative || buildNarrativeFromDays(baseItinerary.days);
        const sanitizedGallery = sanitizeArray(gallery?.length ? gallery : baseItinerary.gallery);
        const sanitizedTags = sanitizeArray(tags?.length ? tags : baseItinerary.tags);
        const sanitizedTerrain = sanitizeArray(terrainTypes);
        const firstWaypoint = derivedWaypoints[0];
        const lastWaypoint = derivedWaypoints[derivedWaypoints.length - 1];

        const newRoute = new Route({
            userId: req.user.id,
            title: derivedTitle,
            summary: derivedSummary,
            visibility,
            slug,
            coverImage: coverImage || baseItinerary.coverImage,
            gallery: sanitizedGallery,
            tags: sanitizedTags,
            terrainTypes: sanitizedTerrain,
            season: season || baseItinerary.season || "all",
            startLocation: startLocation || firstWaypoint?.location || "",
            endLocation: endLocation || lastWaypoint?.location || "",
            distanceKm: typeof distanceKm === "number" ? distanceKm : 0,
            durationDays:
                durationDays ??
                baseItinerary.durationDays ??
                (Array.isArray(baseItinerary.days) ? baseItinerary.days.length : 0),
            overview: overview || baseItinerary.summary,
            itinerary: narrative,
            highlights: highlights || "",
            tips: tips || "",
            waypointList: derivedWaypoints,
            allowForks,
            allowComments,
            sourceRouteId: null,
            sourceItineraryId: baseItinerary._id.toString(),
        });

        const savedRoute = await newRoute.save();

        baseItinerary.status = "published";
        baseItinerary.publishedRouteId = savedRoute._id.toString();
        if (sharePublicly) {
            baseItinerary.visibility = "shared";
        }
        await baseItinerary.save();

        res.status(201).json(savedRoute);
    } catch (error) {
        next(error);
    }
};

const buildRoutesQuery = (req) => {
    const query = { isArchived: false };
    const viewerId = req.user?.id;
    const isAdmin = req.user?.isAdmin === true;

    if (req.query.slug) {
        query.slug = req.query.slug;
        return query;
    }

    if (req.query.routeId) {
        query._id = req.query.routeId;
    }

    if (req.query.userId) {
        query.userId = req.query.userId;
        if (req.query.userId === viewerId || isAdmin) {
            if (req.query.visibility && req.query.visibility !== "all") {
                query.visibility = req.query.visibility;
            }
        } else {
            query.visibility = "public";
        }
    } else if (!isAdmin && !req.query.routeId) {
        query.visibility = "public";
    }

    if (req.query.visibility && req.query.visibility !== "all") {
        query.visibility = req.query.visibility;
    }

    if (req.query.tag) {
        query.tags = { $in: [req.query.tag] };
    }

    if (req.query.searchTerm) {
        const regex = new RegExp(req.query.searchTerm, "i");
        query.$or = [
            { title: regex },
            { summary: regex },
            { overview: regex },
            { tags: regex },
            { startLocation: regex },
            { endLocation: regex },
        ];
    }

    if (req.query.sourceRouteId) {
        query.sourceRouteId = req.query.sourceRouteId;
    }

    return query;
};

const enrichRoutesWithMeta = async (routesDocs = []) => {
    if (!routesDocs.length) return [];

    const plainRoutes = routesDocs.map((route) => route.toObject());
    const userIds = [...new Set(plainRoutes.map((route) => route.userId).filter(Boolean))];
    const routeIds = plainRoutes.map((route) => route._id.toString());

    const [users, commentsGroup] = await Promise.all([
        userIds.length
            ? User.find({ _id: { $in: userIds } })
                .select("_id username firstName lastName profilePicture")
                .lean()
            : [],
        routeIds.length
            ? Comment.aggregate([
                { $match: { routeId: { $in: routeIds } } },
                { $group: { _id: "$routeId", count: { $sum: 1 } } },
            ])
            : [],
    ]);

    const userMap = new Map(
        users.map((user) => [
            user._id.toString(),
            {
                _id: user._id.toString(),
                username: user.username,
                firstName: user.firstName,
                lastName: user.lastName,
                profilePicture: user.profilePicture,
                fullName: `${user.firstName} ${user.lastName}`,
            },
        ])
    );

    const commentCountMap = commentsGroup.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
    }, {});

    return plainRoutes.map((route) => ({
        ...route,
        owner: userMap.get(route.userId) || null,
        commentsCount: commentCountMap[route._id.toString()] || 0,
        likesCount: Array.isArray(route.likes) ? route.likes.length : 0,
    }));
};

export const getRoutes = async (req, res, next) => {
    try {
        const startIndex = parseInt(req.query.startIndex, 10) || 0;
        const limit = parseInt(req.query.limit, 10) || 10;
        const sortField = req.query.sortBy || "createdAt";
        const sortDirection = req.query.order === "asc" ? 1 : -1;

        const query = buildRoutesQuery(req);

        let routes;
        let totalRoutes;

        if (req.query.slug) {
            const route = await Route.findOne(query);
            routes = route ? [route] : [];
            totalRoutes = routes.length;
        } else {
            routes = await Route.find(query)
                .sort({ [sortField]: sortDirection })
                .skip(startIndex)
                .limit(limit);
            totalRoutes = await Route.countDocuments(query);
        }

        const now = new Date();
        const oneMonthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());

        const lastMonthQuery = {
            ...query,
            createdAt: { $gte: oneMonthAgo },
        };

        const lastMonthRoutes = await Route.countDocuments(lastMonthQuery);

        if (req.query.routeId && routes.length === 1) {
            const viewerId = req.user?.id;
            const isAdmin = req.user?.isAdmin === true;
            const route = routes[0];
            const isOwner = viewerId && route.userId === viewerId;
            if (!isOwner && !isAdmin && route.visibility !== 'public') {
                routes = [];
                totalRoutes = 0;
            }
        }

        const enrichedRoutes = await enrichRoutesWithMeta(routes);

        res.status(200).json({
            routes: enrichedRoutes,
            totalRoutes,
            lastMonthRoutes,
        });
    } catch (error) {
        next(error);
    }
};

export const updateRoute = async (req, res, next) => {
    try {
        if (!req.user) {
            return next(errorHandler(401, "You must be signed in to update a route"));
        }

        const { routeId } = req.params;

        const existingRoute = await Route.findById(routeId);
        if (!existingRoute) {
            return next(errorHandler(404, "Route not found"));
        }

        const isOwner = existingRoute.userId === req.user.id;
        const isAdmin = req.user?.isAdmin === true;

        if (!isOwner && !isAdmin) {
            return next(errorHandler(403, "You are not allowed to update this route"));
        }

        const updates = { ...req.body };

        if (updates.title && updates.title !== existingRoute.title) {
            const slugCandidate = buildSlug(updates.title);
            let slug = slugCandidate;
            let collisionCount = 0;
            while (await Route.findOne({ slug, _id: { $ne: routeId } })) {
                collisionCount += 1;
                slug = `${slugCandidate}-${collisionCount}`;
            }
            updates.slug = slug;
        }

        if ("gallery" in updates) {
            updates.gallery = sanitizeArray(updates.gallery);
        }
        if ("tags" in updates) {
            updates.tags = sanitizeArray(updates.tags);
        }
        if ("terrainTypes" in updates) {
            updates.terrainTypes = sanitizeArray(updates.terrainTypes);
        }
        if ("waypointList" in updates && !Array.isArray(updates.waypointList)) {
            updates.waypointList = [];
        }

        const updatedRoute = await Route.findByIdAndUpdate(
            routeId,
            { $set: updates },
            { new: true }
        );

        res.status(200).json(updatedRoute);
    } catch (error) {
        next(error);
    }
};

export const deleteRoute = async (req, res, next) => {
    try {
        if (!req.user) {
            return next(errorHandler(401, "You must be signed in to delete a route"));
        }

        const { routeId } = req.params;
        const route = await Route.findById(routeId);

        if (!route) {
            return next(errorHandler(404, "Route not found"));
        }

        const isOwner = route.userId === req.user.id;
        const isAdmin = req.user?.isAdmin === true;

        if (!isOwner && !isAdmin) {
            return next(errorHandler(403, "You are not allowed to delete this route"));
        }

        await Comment.deleteMany({ routeId });
        await Route.findByIdAndDelete(routeId);

        res.status(200).json({ message: "Route has been deleted" });
    } catch (error) {
        next(error);
    }
};

export const toggleRouteLike = async (req, res, next) => {
    try {
        if (!req.user) {
            return next(errorHandler(401, "You must be signed in to like a route"));
        }

        const { routeId } = req.params;
        const route = await Route.findById(routeId);

        if (!route) {
            return next(errorHandler(404, "Route not found"));
        }

        const alreadyLikedIndex = route.likes.indexOf(req.user.id);
        if (alreadyLikedIndex === -1) {
            route.likes.push(req.user.id);
        } else {
            route.likes.splice(alreadyLikedIndex, 1);
        }

        await route.save();
        res.status(200).json(route);
    } catch (error) {
        next(error);
    }
};

export const forkRoute = async (req, res, next) => {
    try {
        if (!req.user) {
            return next(errorHandler(401, "You must be signed in to fork a route"));
        }

        const { routeId } = req.params;
        const templateRoute = await Route.findById(routeId);

        if (!templateRoute) {
            return next(errorHandler(404, "Route not found"));
        }

        if (!templateRoute.allowForks && !req.user?.isAdmin) {
            return next(errorHandler(403, "This route cannot be forked"));
        }

        const forkTitle = `${templateRoute.title} (Copy)`;
        const slugCandidate = buildSlug(forkTitle);
        let slug = slugCandidate;
        let collisionCount = 0;
        while (await Route.findOne({ slug })) {
            collisionCount += 1;
            slug = `${slugCandidate}-${collisionCount}`;
        }

        const forkedRoute = new Route({
            userId: req.user.id,
            title: forkTitle,
            summary: templateRoute.summary,
            visibility: "private",
            slug,
            coverImage: templateRoute.coverImage,
            gallery: templateRoute.gallery,
            tags: templateRoute.tags,
            terrainTypes: templateRoute.terrainTypes,
            season: templateRoute.season,
            startLocation: templateRoute.startLocation,
            endLocation: templateRoute.endLocation,
            distanceKm: templateRoute.distanceKm,
            durationDays: templateRoute.durationDays,
            overview: templateRoute.overview,
            itinerary: templateRoute.itinerary,
            highlights: templateRoute.highlights,
            tips: templateRoute.tips,
            waypointList: templateRoute.waypointList,
            sourceRouteId: templateRoute._id.toString(),
            allowForks: templateRoute.allowForks,
            allowComments: templateRoute.allowComments,
        });

        const savedFork = await forkedRoute.save();

        templateRoute.forksCount += 1;
        await templateRoute.save();

        res.status(201).json(savedFork);
    } catch (error) {
        next(error);
    }
};