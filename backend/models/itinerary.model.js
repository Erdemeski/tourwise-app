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
    notes: {
        type: String,
        default: "",
    },
    resources: {
        type: [String],
        default: [],
    },
}, { _id: false });

const itinerarySchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true,
        index: true,
    },
    routeId: {
        type: String,
        required: true,
        index: true,
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
}, { timestamps: true });

const Itinerary = mongoose.model('Itinerary', itinerarySchema);

export default Itinerary;