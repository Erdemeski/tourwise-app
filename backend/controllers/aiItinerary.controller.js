import Itinerary from "../models/itinerary.model.js";
import { errorHandler } from "../utils/error.js";
import {
    aiItinerarySchema,
    chatbotSchema,
    generationSchema,
    updateAiItinerarySchema
} from "../utils/aiValidators.js";
// BURAYA DİKKAT: requestItineraryModification eklendi 👇
import { requestItineraryPlan, requestPoiAnswer, analyzeItineraryBudget, requestItineraryModification } from "../services/llm.service.js";
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
    console.log(">>> ENRICHMENT PROCESS STARTED <<<");
    
    if (!plan.days || !Array.isArray(plan.days)) {
        console.log("Plan structure invalid or no days found.");
        return plan;
    }

    const daysPromises = plan.days.map(async (day) => {
        if (!day.stops || !Array.isArray(day.stops)) return day;

        const stopsPromises = day.stops.map(async (stop) => {
            if (stop.externalId) {
                return stop;
            }

            const cityContext = stop.location?.city || '';
            console.log(`API Call: Searching place for '${stop.name}' in '${cityContext}'...`);
            
            const placeData = await searchPlace(stop.name, cityContext);

            if (placeData) {
                console.log(`✅ Found: ${placeData.name} (ID: ${placeData.placeId})`);
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
                };
            } else {
                console.log(`❌ Not Found: ${stop.name}`);
            }
            return stop;
        });

        const enrichedStops = await Promise.all(stopsPromises);
        return { ...day, stops: enrichedStops };
    });

    const enrichedDays = await Promise.all(daysPromises);
    console.log(">>> ENRICHMENT PROCESS FINISHED <<<");
    return { ...plan, days: enrichedDays };
};

export const generateAiItinerary = async (req, res, next) => {
    try {
        if (!req.user) {
            return next(errorHandler(401, "You must be signed in to generate an itinerary"));
        }

        const { prompt, preferences } = generationSchema.parse(req.body);
        
        console.log("1. Requesting plan from LLM...");
        const plan = await requestItineraryPlan(prompt, preferences);
        
        console.log("2. Enriching plan with Google Places data...");
        const enrichedPlan = await enrichItineraryWithPlaces(plan);

        console.log("3. Analyzing budget...");
        const budgetAnalysis = await analyzeItineraryBudget(enrichedPlan);

        console.log("4. Saving itinerary to database...");
        const normalizedPlan = aiItinerarySchema.parse({
            ...enrichedPlan,
            budget: budgetAnalysis,
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
        console.log(`4. Itinerary saved successfully (ID: ${saved._id})`);
        res.status(201).json(saved);
    } catch (error) {
        console.error("Error in generateAiItinerary:", error);
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

        const [movedItem] = day.stops.splice(oldIndex, 1);
        day.stops.splice(newIndex, 0, movedItem);

        itinerary.markModified('days');
        itinerary.waypointList = mapDaysToWaypointList(itinerary.days);

        const saved = await itinerary.save();
        res.json(saved);
    } catch (error) {
        next(error);
    }
};

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

        const [movedItem] = sourceDay.stops.splice(fromIndex, 1);

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

export const copyItineraryToUser = async (req, res, next) => {
    try {
        const { id } = req.params;
        if (!req.user) return next(errorHandler(401, "Authentication required"));

        const source = await Itinerary.findById(id);
        if (!source) return next(errorHandler(404, "Itinerary not found"));

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
            days: source.days,
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

export const shareItinerary = async (req, res, next) => {
    try {
        const { id } = req.params;
        if (!req.user) return next(errorHandler(401, "Authentication required"));

        const itinerary = await Itinerary.findById(id);
        assertOwnership(itinerary, req.user);

        itinerary.visibility = 'shared'; 
        itinerary.status = 'published';

        const saved = await itinerary.save();
        res.json(saved);
    } catch (error) {
        next(error);
    }
};

// DÜZELTİLDİ: modifyAiItinerary fonksiyonu temizlendi ve route kodu kaldırıldı
export const modifyAiItinerary = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { prompt } = req.body;

        if (!req.user) return next(errorHandler(401, "Authentication required"));

        const itinerary = await Itinerary.findById(id);
        assertOwnership(itinerary, req.user);

        console.log(`Modifying itinerary ${id} with prompt: ${prompt}`);

        const modifiedPlanData = await requestItineraryModification(itinerary, prompt);
        const enrichedPlan = await enrichItineraryWithPlaces(modifiedPlanData);

        itinerary.days = enrichedPlan.days;
        itinerary.waypointList = mapDaysToWaypointList(enrichedPlan.days);
        
        if (enrichedPlan.summary) itinerary.summary = enrichedPlan.summary;

        itinerary.markModified('days');
        itinerary.updatedAt = new Date();

        const saved = await itinerary.save();
        
        console.log("Itinerary modified successfully");
        res.json(saved);

    } catch (error) {
        next(error);
    }
};