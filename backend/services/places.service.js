import { errorHandler } from "../utils/error.js";

export const searchPlace = async (query, locationContext = "") => {
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
        console.warn("GOOGLE_MAPS_API_KEY is missing in .env file");
        // API key yoksa mock/boş veri dönmemek daha iyidir, null dönelim.
        // Ama geliştirme sırasında hata almamak için mock data bırakılabilir.
        return null; 
    }

    const searchQuery = `${query} ${locationContext}`.trim();
    const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(searchQuery)}&key=${apiKey}`;

    try {
        const response = await fetch(url);
        const data = await response.json();

        if (data.status !== 'OK' || !data.results || data.results.length === 0) {
            console.log(`Place not found for: ${searchQuery} status: ${data.status}`);
            return null;
        }

        const place = data.results[0];

        return {
            name: place.name,
            address: place.formatted_address,
            location: place.geometry.location,
            placeId: place.place_id,
            rating: place.rating || 0,
            photoReference: place.photos?.[0]?.photo_reference || null,
            types: place.types || []
        };
    } catch (error) {
        console.error("Google Places API Error:", error.message);
        return null;
    }
};

export const getPlacePhotoUrl = (photoReference) => {
    if (!photoReference || !process.env.GOOGLE_MAPS_API_KEY) return null;
    return `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${photoReference}&key=${process.env.GOOGLE_MAPS_API_KEY}`;
};
