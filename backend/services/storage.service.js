import dotenv from "dotenv";
import { randomUUID } from "crypto";
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getStorage } from "firebase-admin/storage";
import sharp from "sharp";

// Load env vars as early as possible so imports depending on them work.
dotenv.config();

const firebaseConfig = {
    serviceAccountJson: process.env.FIREBASE_SERVICE_ACCOUNT_JSON,
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
};

let storageBucket = null;
let triedToInitialize = false;

const parseServiceAccount = (value) => {
    if (!value) return null;

    try {
        return JSON.parse(value);
    } catch (jsonError) {
        try {
            const decoded = Buffer.from(value, "base64").toString("utf8");
            return JSON.parse(decoded);
        } catch (parseError) {
            console.error("[Firebase] Failed to parse FIREBASE_SERVICE_ACCOUNT_JSON", parseError);
            return null;
        }
    }
};

const initStorage = () => {
    if (storageBucket || triedToInitialize) {
        return storageBucket;
    }

    triedToInitialize = true;

    const credentials = parseServiceAccount(firebaseConfig.serviceAccountJson);
    if (!credentials || !firebaseConfig.storageBucket) {
        console.warn(
            "[Firebase] Missing credentials or FIREBASE_STORAGE_BUCKET; skipping Firebase Storage initialization."
        );
        return null;
    }

    try {
        if (!getApps().length) {
            initializeApp({
                credential: cert(credentials),
                storageBucket: firebaseConfig.storageBucket,
            });
        }

        storageBucket = getStorage().bucket(firebaseConfig.storageBucket);
        console.log("[Firebase] Storage initialized for bucket:", firebaseConfig.storageBucket);
    } catch (error) {
        console.error("[Firebase] Failed to initialize storage", error);
        storageBucket = null;
    }

    return storageBucket;
};

const convertBufferToJpeg = async (buffer) => {
    try {
        return await sharp(buffer)
            .jpeg({ quality: 82, mozjpeg: true })
            .toBuffer();
    } catch (error) {
        console.error("[Firebase] Failed to transcode image to JPEG; uploading original instead.", error);
        return buffer;
    }
};

const convertBufferToWebp = async (buffer, quality = 80) => {
    try {
        return await sharp(buffer)
            .webp({ quality })
            .toBuffer();
    } catch (error) {
        console.error("[Firebase] Failed to transcode image to WebP; uploading original instead.", error);
        return buffer;
    }
};

export const uploadImageDataUri = async (dataUri, options = {}) => {
    const bucket = initStorage();
    if (!bucket) return null;

    const match = /^data:(image\/[^;]+);base64,(.+)$/i.exec(dataUri || "");
    if (!match) {
        console.warn("[Firebase] Provided data URI is not valid; skipping upload.");
        return null;
    }

    const [, contentType, base64Data] = match;
    let buffer = Buffer.from(base64Data, "base64");

    const shouldForceWebp = options.forceWebp === true;
    const shouldForceJpeg = options.forceJpeg === true && !shouldForceWebp;
    const targetContentType = shouldForceWebp
        ? "image/webp"
        : shouldForceJpeg
            ? "image/jpeg"
            : contentType;
    const extension = shouldForceWebp
        ? "webp"
        : shouldForceJpeg
            ? "jpg"
            : (contentType.split("/")[1] || "png").split("+")[0];
    const folder = options.folder || "generated";
    const fileName =
        options.fileName ||
        `${folder}/image-${Date.now()}-${randomUUID()}.${extension || "png"}`;

    if (shouldForceWebp) {
        const quality = Number.isFinite(options.webpQuality) ? options.webpQuality : 80;
        buffer = await convertBufferToWebp(buffer, quality);
    } else if (shouldForceJpeg) {
        buffer = await convertBufferToJpeg(buffer);
    }

    const file = bucket.file(fileName);

    try {
        await file.save(buffer, {
            resumable: false,
            metadata: {
                contentType: targetContentType,
                cacheControl: "public,max-age=31536000,immutable",
            },
        });

        await file.makePublic();
        return `https://storage.googleapis.com/${bucket.name}/${file.name}`;
    } catch (error) {
        console.error("[Firebase] Failed to upload image to storage", error);
        return null;
    }
};
