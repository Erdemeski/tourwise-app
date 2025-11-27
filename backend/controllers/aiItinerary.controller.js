import Itinerary from "../models/itinerary.model.js";
import { errorHandler } from "../utils/error.js";
import {
    aiItinerarySchema,
    chatbotSchema,
    generationSchema,
    updateAiItinerarySchema
} from "../utils/aiValidators.js";
import { requestItineraryPlan, requestPoiAnswer } from "../services/llm.service.js";
import { searchPlace, getPlacePhotoUrl } from "../services/places.service.js";
import { mapDaysToWaypointList } from "../utils/itineraryMapper.js";

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

const assertOwnership = (itinerary, user) => {
    if (!itinerary) {
        throw errorHandler(404, "Itinerary not found");
    }
    const isOwner = itinerary.userId === user.id;
    const isAdmin = user?.isAdmin === true;
    if (!isOwner && !isAdmin) {
        throw errorHandler(403, "You are not allowed to access this itinerary");
    }
    return itinerary;
};

// Helper: Mekan verilerini zenginleştirme
const enrichItineraryWithPlaces = async (plan) => {
    const daysPromises = plan.days.map(async (day) => {
        const stopsPromises = day.stops.map(async (stop) => {
            // Eğer zaten zenginleştirilmişse (geo verisi varsa) atla
            if (stop.location && stop.location.geo && stop.location.geo.lat) return stop;

            const cityContext = stop.location?.city || '';
            const placeData = await searchPlace(stop.name, cityContext);

            if (placeData) {
                return {
                    ...stop,
                    name: placeData.name,
                    address: placeData.address,
                    location: {
                        ...stop.location,
                        address: placeData.address,
                        geo: placeData.location,
                    },
                    externalId: placeData.placeId,
                    rating: placeData.rating,
                    // photoUrl yapısını modelinize göre uyarlayın, şimdilik notes veya resources'a ekleyebiliriz
                    // resources: [...(stop.resources || []), getPlacePhotoUrl(placeData.photoReference)].filter(Boolean)
                };
            }
            return stop;
        });

        const enrichedStops = await Promise.all(stopsPromises);
        return { ...day, stops: enrichedStops };
    });

    const enrichedDays = await Promise.all(daysPromises);
    return { ...plan, days: enrichedDays };
};

export const generateAiItinerary = async (req, res, next) => {
    try {
        if (!req.user) {
            return next(errorHandler(401, "You must be signed in to generate an itinerary"));
        }

        const { prompt, preferences } = generationSchema.parse(req.body);
        const plan = await requestItineraryPlan(prompt, preferences);
        
        // Zenginleştirme işlemini burada çağırabilirsiniz
        const enrichedPlan = await enrichItineraryWithPlaces(plan);

        const normalizedPlan = aiItinerarySchema.parse({
            ...enrichedPlan,
            visibility: "private",
        });

        const days = Array.isArray(normalizedPlan.days) ? normalizedPlan.days : [];
        const waypointList = mapDaysToWaypointList(days);

        const itinerary = new Itinerary({
            userId: req.user.id,
            source: "ai",
            title: normalizedPlan.title,
            summary: normalizedPlan.summary,
            prompt,
            preferences,
            durationDays: normalizedPlan.durationDays,
            budget: normalizedPlan.budget,
            tags: sanitizeArray(normalizedPlan.tags),
            days,
            waypointList,
            visibility: "private",
            status: "draft",
        });

        const saved = await itinerary.save();
        res.status(201).json(saved);
    } catch (error) {
        next(error);
    }
};

export const listAiItineraries = async (req, res, next) => {
    try {
        if (!req.user) {
            return next(errorHandler(401, "Authentication required"));
        }

        const view = req.query.view;
        const projection =
            view === "compact"
                ? "title summary tags updatedAt createdAt status visibility durationDays prompt budget publishedRouteId"
                : undefined;

        const itineraries = await Itinerary.find({ userId: req.user.id, source: "ai" })
            .sort({ updatedAt: -1 })
            .select(projection);

        res.json(itineraries);
    } catch (error) {
        next(error);
    }
};

export const getAiItinerary = async (req, res, next) => {
    try {
        if (!req.user) {
            return next(errorHandler(401, "Authentication required"));
        }

        const itinerary = await Itinerary.findById(req.params.id);
        assertOwnership(itinerary, req.user);

        res.json(itinerary);
    } catch (error) {
        next(error);
    }
};

export const updateAiItinerary = async (req, res, next) => {
    try {
        if (!req.user) {
            return next(errorHandler(401, "Authentication required"));
        }

        const itinerary = await Itinerary.findById(req.params.id);
        assertOwnership(itinerary, req.user);

        const patch = updateAiItinerarySchema.parse(req.body);
        const updates = { ...patch };

        if ("tags" in updates) {
            updates.tags = sanitizeArray(updates.tags);
        }

        if ("days" in updates && Array.isArray(updates.days)) {
            updates.waypointList = mapDaysToWaypointList(updates.days);
        }

        Object.assign(itinerary, updates, { updatedAt: new Date() });
        const saved = await itinerary.save();
        res.json(saved);
    } catch (error) {
        next(error);
    }
};

export const deleteAiItinerary = async (req, res, next) => {
    try {
        if (!req.user) {
            return next(errorHandler(401, "Authentication required"));
        }

        const itinerary = await Itinerary.findById(req.params.id);
        assertOwnership(itinerary, req.user);

        await itinerary.deleteOne();
        res.status(204).end();
    } catch (error) {
        next(error);
    }
};

export const askItineraryChatbot = async (req, res, next) => {
    try {
        if (!req.user) {
            return next(errorHandler(401, "Authentication required"));
        }

        const payload = chatbotSchema.parse(req.body);
        const response = await requestPoiAnswer(payload.question, {
            ...payload.context,
            poiId: payload.poiId,
        });
        res.json(response);
    } catch (error) {
        next(error);
    }
};

// === YENİ EKLENEN ÖZELLİKLER ===

// Bir gün içindeki durakların sırasını değiştirme
export const reorderItineraryStops = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { dayNumber, oldIndex, newIndex } = req.body;

        if (!req.user) return next(errorHandler(401, "Authentication required"));

        const itinerary = await Itinerary.findById(id);
        assertOwnership(itinerary, req.user);

        const day = itinerary.days.find((d) => d.dayNumber === dayNumber);
        if (!day) return next(errorHandler(404, "Day not found"));

        if (oldIndex < 0 || oldIndex >= day.stops.length || newIndex < 0 || newIndex >= day.stops.length) {
            return next(errorHandler(400, "Index out of bounds"));
        }

        // Array'den çıkar ve yeni yere ekle
        const [movedItem] = day.stops.splice(oldIndex, 1);
        day.stops.splice(newIndex, 0, movedItem);

        // Mongoose'a 'days' alanının değiştiğini bildir (Nested array olduğu için önemli)
        itinerary.markModified('days');
        
        // Opsiyonel: WaypointList'i de güncellemek gerekebilir
        itinerary.waypointList = mapDaysToWaypointList(itinerary.days);

        const saved = await itinerary.save();
        res.json(saved);
    } catch (error) {
        next(error);
    }
};

// Durakları günler arasında taşıma
export const moveStopBetweenDays = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { fromDay, toDay, fromIndex, toIndex } = req.body;

        if (!req.user) return next(errorHandler(401, "Authentication required"));

        const itinerary = await Itinerary.findById(id);
        assertOwnership(itinerary, req.user);

        const sourceDay = itinerary.days.find((d) => d.dayNumber === fromDay);
        const targetDay = itinerary.days.find((d) => d.dayNumber === toDay);

        if (!sourceDay || !targetDay) return next(errorHandler(404, "Source or target day not found"));

        if (fromIndex < 0 || fromIndex >= sourceDay.stops.length) {
            return next(errorHandler(400, "Source index out of bounds"));
        }

        // Kaynaktan al
        const [movedItem] = sourceDay.stops.splice(fromIndex, 1);

        // Hedefe ekle
        const safeToIndex = (toIndex !== undefined && toIndex >= 0 && toIndex <= targetDay.stops.length)
            ? toIndex
            : targetDay.stops.length;
        
        targetDay.stops.splice(safeToIndex, 0, movedItem);

        itinerary.markModified('days');
        itinerary.waypointList = mapDaysToWaypointList(itinerary.days);
        
        const saved = await itinerary.save();
        res.json(saved);
    } catch (error) {
        next(error);
    }
};

// Itinerary kopyalama
export const copyItineraryToUser = async (req, res, next) => {
    try {
        const { id } = req.params;
        if (!req.user) return next(errorHandler(401, "Authentication required"));

        const source = await Itinerary.findById(id);
        if (!source) return next(errorHandler(404, "Itinerary not found"));

        // Eğer 'shared' değilse ve sahibi biz değilsek kopyalayamayız
        if (source.visibility === 'private' && source.userId !== req.user.id && !req.user.isAdmin) {
            return next(errorHandler(403, "Cannot copy private itinerary"));
        }

        const newItinerary = new Itinerary({
            userId: req.user.id,
            title: `${source.title} (Copy)`,
            summary: source.summary,
            prompt: source.prompt,
            preferences: source.preferences,
            durationDays: source.durationDays,
            budget: source.budget,
            tags: source.tags,
            days: source.days, // Deep copy gerekebilir, Mongoose create anında halleder
            waypointList: source.waypointList,
            visibility: 'private',
            status: 'draft',
            source: 'ai',
            forkedFromItineraryId: source._id.toString()
        });

        const saved = await newItinerary.save();
        res.status(201).json(saved);
    } catch (error) {
        next(error);
    }
};

// Paylaşma (Visibility Toggle + Community Logic)
export const shareItinerary = async (req, res, next) => {
    try {
        const { id } = req.params;
        if (!req.user) return next(errorHandler(401, "Authentication required"));

        const itinerary = await Itinerary.findById(id);
        assertOwnership(itinerary, req.user);

        // Basit toggle mantığı. İsterseniz body'den gelen veriye göre 'shared' yapabilirsiniz.
        itinerary.visibility = 'shared'; 
        // Status'u published yapabiliriz
        itinerary.status = 'published';

        const saved = await itinerary.save();
        res.json(saved);
    } catch (error) {
        next(error);
    }
};
