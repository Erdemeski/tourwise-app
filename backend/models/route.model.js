import mongoose from "mongoose";

const waypointSchema = new mongoose.Schema({
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
}, { _id: false });

const routeSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true,
        index: true,
    },
    visibility: {
        type: String,
        enum: ['public', 'private', 'unlisted'],
        default: 'private',
        index: true,
    },
    title: {
        type: String,
        required: true,
        trim: true,
    },
    slug: {
        type: String,
        required: true,
        unique: true,
        index: true,
    },
    summary: {
        type: String,
        required: true,
        maxlength: 240,
    },
    coverImage: {
        type: String,
        default: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80',
    },
    gallery: {
        type: [String],
        default: [],
    },
    tags: {
        type: [String],
        default: [],
        index: true,
    },
    terrainTypes: {
        type: [String],
        default: [],
    },
    season: {
        type: String,
        default: 'all',
    },
    startLocation: {
        type: String,
        default: '',
    },
    endLocation: {
        type: String,
        default: '',
    },
    distanceKm: {
        type: Number,
        default: 0,
    },
    durationDays: {
        type: Number,
        default: 1,
    },
    overview: {
        type: String,
        default: '',
    },
    itinerary: {
        type: String,
        default: '',
    },
    highlights: {
        type: String,
        default: '',
    },
    tips: {
        type: String,
        default: '',
    },
    allowForks: {
        type: Boolean,
        default: true,
    },
    allowComments: {
        type: Boolean,
        default: true,
    },
    isArchived: {
        type: Boolean,
        default: false,
        index: true,
    },
    sourceRouteId: {
        type: String,
        default: null,
        index: true,
    },
    sourceItineraryId: {
        type: String,
        default: null,
        index: true,
    },
    waypointList: {
        type: [waypointSchema],
        default: [],
    },
    likes: {
        type: [String],
        default: [],
    },
    forksCount: {
        type: Number,
        default: 0,
    },
}, { timestamps: true });

const Route = mongoose.model('Route', routeSchema);

export default Route;