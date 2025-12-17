import mongoose from "mongoose";

// --- YARDIMCI ŞEMALAR ---

const waypointSchema = new mongoose.Schema(
    {
        title: { type: String, required: true },
        summary: { type: String, default: "" },
        day: { type: Number, default: 1 },
        order: { type: Number, default: 0 },
        location: { type: String, default: "" },
        latitude: { type: Number },
        longitude: { type: Number },
        startTime: { type: String, default: "" },
        endTime: { type: String, default: "" },
        notes: { type: String, default: "" },
        resources: { type: [String], default: [] },
    },
    { _id: false } // Waypoint'ler için ID'ye gerek yok, bu kalabilir
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

// --- KRİTİK DEĞİŞİKLİK BURADA ---
// Arkadaşının alanlarını koruduk ama { _id: false } kısmını SİLDİK.
// Artık her durağın bir ID'si olacak, böylece silebileceğiz.
const stopSchema = new mongoose.Schema(
    {
        externalId: { type: String, default: null }, // Google Place ID
        placeId: { type: String }, // Bizim AI controller uyumluluğu için ekledik
        name: { type: String, required: true },
        description: { type: String, default: "" },
        address: { type: String, default: "" },
        location: { type: locationSchema, default: undefined },
        rating: { type: Number }, // AI controller uyumluluğu için
        startTime: { type: String, default: "" },
        endTime: { type: String, default: "" },
        notes: { type: String, default: "" },
        resources: { type: [String], default: [] },
    }
    // { _id: false } -> BURAYI KALDIRDIK. Artık otomatik _id oluşacak.
);

// Gün Planı Şeması
const dayPlanSchema = new mongoose.Schema(
    {
        dayNumber: { type: Number, required: true },
        title: { type: String, default: "" },
        summary: { type: String, default: "" },
        theme: { type: String }, // AI için ekledik (opsiyonel)
        stops: { type: [stopSchema], default: [] },
    }
    // { _id: false } -> BURAYI DA KALDIRDIK. Günlerin de ID'si olması iyidir.
);

const budgetSchema = new mongoose.Schema(
    {
        currency: { type: String, default: "USD" },
        amount: { type: Number, default: 0 }, // Arkadaşının yapısı (Number)
        // AI Controller String gönderebilir ama Mongoose cast eder, sorun olmaz.
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

// --- ANA ŞEMA ---
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
        // Hem arkadaşının 'route'u hem bizim 'manual' ve 'fork'u kapsayan enum
        enum: ['route', 'ai', 'manual', 'fork'], 
        default: 'route',
        index: true,
    },
    prompt: {
        type: String,
        default: '',
    },
    preferences: {
        type: mongoose.Schema.Types.Mixed, // Esnek yapı, ikinizinkini de kapsar
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
    status: {
        type: String,
        enum: ['draft', 'finished', 'archived'],
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
    // Günler
    days: {
        type: [dayPlanSchema],
        default: [],
    },
    waypointList: {
        type: [waypointSchema],
        default: [],
    },
    // Arkadaşının eklediği ekstra alanlar
    sharedWith: {
        type: [String],
        default: [],
    },
    forkedFromRouteId: {
        type: String,
        default: null,
    },
    // Bizim eklediğimiz referans
    forkedFromItineraryId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Itinerary',
        default: null
    },
    ratingsSummary: {
        type: ratingSummarySchema,
        default: undefined,
    },
    googleMapData: {
        type: mongoose.Schema.Types.Mixed,
        default: null,
    },
    // Beğeni sayısı (AI controller kullanıyor olabilir)
    likes: {
        type: Number,
        default: 0
    },
    // Gizlilik ayarı
    visibility: {
        type: String,
        enum: ['private', 'public', 'shared'],
        default: 'private'
    },
}, { timestamps: true });

const Itinerary = mongoose.model('Itinerary', itinerarySchema);

export default Itinerary;