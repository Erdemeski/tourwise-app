import OpenAI from "openai";
import dotenv from "dotenv";
import { uploadImageDataUri } from "./storage.service.js";

dotenv.config();

const imageConfig = {
    apiKey: process.env.IMAGE_API_KEY || process.env.LLM_API_KEY || process.env.OPENAI_API_KEY || "",
    baseUrl: process.env.IMAGE_BASE_URL || process.env.LLM_BASE_URL || process.env.OPENAI_BASE_URL || "",
    model: process.env.IMAGE_MODEL || process.env.LLM_IMAGE_MODEL || "dall-e-3",
    size: process.env.IMAGE_SIZE || "1024x1024",
    quality: process.env.IMAGE_QUALITY || "standard", // standard, hd (per OpenAI spec)
    responseFormat: process.env.IMAGE_RESPONSE_FORMAT || "b64_json", // b64_json or url
    webpQuality: process.env.IMAGE_WEBP_QUALITY || "80",
};

const forceImageGeneration = process.env.IMAGE_FORCE_GENERATION === "true";
const modelLikelyNeedsVerification = imageConfig.model === "gpt-image-1";

const FALLBACK_IMAGES = [
    "https://images.unsplash.com/photo-1505761671935-60b3a7427bad?auto=format&fit=crop&w=1600&q=80",
    "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1600&q=80",
    "https://images.unsplash.com/photo-1493558103817-58b2924bce98?auto=format&fit=crop&w=1600&q=80",
    "https://images.unsplash.com/photo-1473625247510-8ceb1760943f?auto=format&fit=crop&w=1600&q=80",
];

const pickFallbackImage = () => {
    const index = Math.floor(Math.random() * FALLBACK_IMAGES.length);
    return FALLBACK_IMAGES[index];
};

const isVerificationError = (error) => {
    const status = error?.status ?? error?.statusCode;
    const message = error?.error?.message ?? error?.message ?? "";
    return status === 403 && message.toLowerCase().includes("must be verified");
};

const normalizeQuality = (quality) => {
    const normalized = (quality || "").toLowerCase();
    const supported = new Set(["standard", "hd"]);
    if (supported.has(normalized)) return normalized;
    if (quality) console.warn(`[Image] Unsupported quality "${quality}", defaulting to "standard".`);
    return "standard";
};

const resolvedQuality = normalizeQuality(imageConfig.quality);
const resolvedResponseFormat =
    (imageConfig.responseFormat || "").toLowerCase() === "url" ? "url" : "b64_json";
const resolvedWebpQuality = (() => {
    const num = Number(imageConfig.webpQuality);
    return Number.isFinite(num) && num > 0 && num <= 100 ? num : 80;
})();

const imageClient = (() => {
    if (!imageConfig.apiKey) {
        console.warn("[Image] No API key detected. Falling back to stock photos.");
        return null;
    }

    try {
        return new OpenAI({
            apiKey: imageConfig.apiKey,
            baseURL: imageConfig.baseUrl || undefined,
        });
    } catch (error) {
        console.error("[Image] Failed to initialize OpenAI client", error);
        return null;
    }
})();

let imageGenerationBlocked = !forceImageGeneration && modelLikelyNeedsVerification;

if (imageGenerationBlocked) {
    console.warn(
        `[Image] Skipping generation with model "${imageConfig.model}" because organization verification is required. ` +
        'Set IMAGE_FORCE_GENERATION="true" or use a different IMAGE_MODEL to enable.'
    );
}

const buildImagePrompt = ({
    title,
    summary,
    city,
    country,
    tags,
    travelStyles,
    durationDays,
    userPrompt,
}) => {
    const locationLine = city
        ? `${city}${country ? `, ${country}` : ""}`
        : "the highlighted destination";

    const stylesLine = [
        ...(Array.isArray(travelStyles) ? travelStyles : []),
        ...(Array.isArray(tags) ? tags : []),
    ]
        .filter(Boolean)
        .slice(0, 4)
        .join(", ");

    const durationText = durationDays ? `${durationDays}-day trip` : "multi-day escape";

    return [
        `Cinematic wide-angle travel photo for a ${durationText} in ${locationLine}.`,
        title ? `Theme: ${title}.` : "",
        summary ? `Story: ${summary}` : "",
        stylesLine ? `Style hints: ${stylesLine}.` : "",
        userPrompt ? `Visitor asked for: ${userPrompt}` : "",
        "Show iconic landmarks and atmosphere, golden hour lighting, vibrant yet realistic colors, no text or typography.",
    ]
        .filter(Boolean)
        .join(" ");
};

export const generateItineraryCoverImage = async (context = {}) => {
    const prompt = buildImagePrompt(context);

    if (!imageClient || imageGenerationBlocked) {
        return {
            url: pickFallbackImage(),
            usedFallback: true,
            prompt,
        };
    }

    try {
        const response = await imageClient.images.generate({
            model: imageConfig.model,
            prompt,
            size: imageConfig.size,
            quality: resolvedQuality,
            n: 1,
            response_format: resolvedResponseFormat,
        });

        const image = response.data?.[0];
        let url = null;

        if (image?.b64_json) {
            const dataUri = `data:image/png;base64,${image.b64_json}`;
            const uploadedUrl = await uploadImageDataUri(dataUri, {
                folder: "covers",
                forceWebp: true,
                webpQuality: resolvedWebpQuality,
            });
            url = uploadedUrl || dataUri;
        }

        if (!url && image?.url) {
            url = image.url;
        }

        // Fallback: if the API ignored response_format and only returned a URL,
        // use it as-is (PNG) rather than failing entirely.

        return {
            url: url || pickFallbackImage(),
            usedFallback: !url,
            prompt,
        };
    } catch (error) {
        if (isVerificationError(error)) {
            imageGenerationBlocked = true;
            console.warn("[Image] Model requires verified organization. Skipping generation and using fallback image.");
        } else {
            console.error("[Image] Generation failed, using fallback", error);
        }
        return {
            url: pickFallbackImage(),
            usedFallback: true,
            prompt,
        };
    }
};
