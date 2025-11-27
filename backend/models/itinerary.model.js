import mongoose from "mongoose";

const waypointSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
        },
        summary: {
            type: String,
            default: "",
        },
        day: {
            type: Number,
            default: 1,
        },
        order: {
            type: Number,
            default: 0,
        },
        location: {
            type: String,
            default: "",
        },
        latitude: {
            type: Number,
        },
        longitude: {
            type: Number,
        },
        startTime: {
            type: String,
            default: "",
        },
        endTime: {
            type: String,
            default: "",
        },
        notes: {
            type: String,
            default: "",
        },
        resources: {
            type: [String],
            default: [],
        },
    },
    { _id: false }
);

const geoSchema = new mongoose.Schema(
    {
        lat: { type: Number },
        lng: { type: Number },
    },
    { _id: false }
);

const locationSchema = new mongoose.Schema(
    {
        city: { type: String, default: "" },
        country: { type: String, default: "" },
        address: { type: String, default: "" },
        geo: { type: geoSchema, default: undefined },
    },
    { _id: false }
);

const stopSchema = new mongoose.Schema(
    {
        externalId: { type: String, default: null },
        name: { type: String, required: true },
        description: { type: String, default: "" },
        address: { type: String, default: "" },
        location: { type: locationSchema, default: undefined },
        startTime: { type: String, default: "" },
        endTime: { type: String, default: "" },
        notes: { type: String, default: "" },
        resources: { type: [String], default: [] },
    },
    { _id: false }
);

const dayPlanSchema = new mongoose.Schema(
    {
        dayNumber: { type: Number, required: true },
        title: { type: String, default: "" },
        summary: { type: String, default: "" },
        stops: { type: [stopSchema], default: [] },
    },
    { _id: false }
);

const budgetSchema = new mongoose.Schema(
    {
        currency: { type: String, default: "USD" },
        amount: { type: Number, default: 0 },
        perPerson: { type: Number },
        notes: { type: String, default: "" },
    },
    { _id: false }
);

const ratingSummarySchema = new mongoose.Schema(
    {
        count: { type: Number, default: 0 },
        average: { type: Number, default: 0 },
    },
    { _id: false }
);

const itinerarySchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true,
        index: true,
    },
    routeId: {
        type: String,
        default: null,
        index: true,
    },
    publishedRouteId: {
        type: String,
        default: null,
        index: true,
    },
    source: {
        type: String,
        enum: ['route', 'ai'],
        default: 'route',
        index: true,
    },
    prompt: {
        type: String,
        default: '',
    },
    preferences: {
        type: mongoose.Schema.Types.Mixed,
        default: {},
    },
    title: {
        type: String,
        required: true,
    },
    summary: {
        type: String,
        default: "",
    },
    notes: {
        type: String,
        default: "",
    },
    durationDays: {
        type: Number,
        default: 0,
    },
    budget: {
        type: budgetSchema,
        default: undefined,
    },
    visibility: {
        type: String,
        enum: ['private', 'shared'],
        default: 'private',
        index: true,
    },
    status: {
        type: String,
        enum: ['draft', 'published', 'archived'],
        default: 'draft',
    },
    coverImage: {
        type: String,
        default: '',
    },
    tags: {
        type: [String],
        default: [],
    },
    days: {
        type: [dayPlanSchema],
        default: [],
    },
    waypointList: {
        type: [waypointSchema],
        default: [],
    },
    sharedWith: {
        type: [String],
        default: [],
    },
    forkedFromRouteId: {
        type: String,
        default: null,
    },
    forkedFromItineraryId: {
        type: String,
        default: null,
    },
    ratingsSummary: {
        type: ratingSummarySchema,
        default: undefined,
    },
    googleMapData: {
        type: mongoose.Schema.Types.Mixed,
        default: null,
    },
}, { timestamps: true });

const Itinerary = mongoose.model('Itinerary', itinerarySchema);

export default Itinerary;