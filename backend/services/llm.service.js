import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config();
const llmConfig = {
  apiKey: process.env.LLM_API_KEY ?? process.env.OPENAI_API_KEY ?? '',
  baseUrl: process.env.LLM_BASE_URL ?? process.env.OPENAI_BASE_URL ?? '',
  model: process.env.LLM_MODEL ?? process.env.OPENAI_MODEL ?? 'gpt-4o-mini',
};

// --- YARDIMCI FONKSİYONLAR ---

const supportsCustomTemperature = (model) => {
  const normalized = model?.toLowerCase() ?? '';
  return !normalized.startsWith('gpt-5');
};

const openAiClient = (() => {
  if (!llmConfig.apiKey) {
    console.warn('[LLM] No API key detected (set LLM_API_KEY or OPENAI_API_KEY). Falling back to offline scaffold.');
    return null;
  }

  try {
    return new OpenAI({
      apiKey: llmConfig.apiKey,
      baseURL: llmConfig.baseUrl || undefined,
    });
  } catch (error) {
    console.error('Failed to initialize OpenAI client', error);
    return null;
  }
})();

const isTemperatureUnsupported = (error) => {
  const param = error?.param ?? error?.error?.param;
  const code = error?.code ?? error?.error?.code;
  if (param === 'temperature') return true;
  if (code === 'unsupported_value' && param === 'temperature') return true;
  const message = error?.message ?? error?.error?.message;
  return typeof message === 'string' && message.toLowerCase().includes('temperature') && message.toLowerCase().includes('supported');
};

const safeChatCompletion = async ({ messages, temperature }) => {
  const allowTemperature = supportsCustomTemperature(llmConfig.model);
  const payload = {
    model: llmConfig.model,
    messages,
    ...(temperature !== undefined && allowTemperature ? { temperature } : {}),
  };

  try {
    return await openAiClient.chat.completions.create(payload);
  } catch (error) {
    if (temperature !== undefined && allowTemperature && isTemperatureUnsupported(error)) {
      console.warn(`[LLM] Model ${llmConfig.model} does not support custom temperature. Retrying with default.`);
      const { temperature: _ignored, ...fallbackPayload } = payload;
      return await openAiClient.chat.completions.create(fallbackPayload);
    }
    throw error;
  }
};

// B planı: API Key yoksa veya hata alınırsa dönecek taslak
const buildFallbackPlan = (prompt, preferences) => {
  const duration = preferences.durationDays ?? 3;
  const stopFor = (day) => [
    {
      id: `poi-${day}-1`,
      name: `Signature Experience Day ${day}`,
      description: `Auto-generated highlight informed by prompt: ${prompt.slice(0, 60)}...`,
    },
    {
      id: `poi-${day}-2`,
      name: `Local Favorite Day ${day}`,
      description: 'Placeholder stop. Replace with POI search results.',
    },
  ];

  return {
    title: 'AI Draft Itinerary',
    summary:
      'This is a scaffold generated locally because no LLM credentials were provided. Plug in a provider to get richer content.',
    durationDays: duration,
    budget: {
      currency: 'USD',
      amount: 150 * duration,
    },
    tags: preferences.travelStyles ?? ['general'],
    days: Array.from({ length: duration }).map((_, idx) => ({
      dayNumber: idx + 1,
      title: `Day ${idx + 1}`,
      summary: 'Replace with AI-proposed narrative.',
      stops: stopFor(idx + 1),
    })),
  };
};

const parseResponseJson = (response) => {
  // OpenAI chat completion standard structure
  const content = response.choices?.[0]?.message?.content;
  
  if (!content) {
     // Fallback for non-standard responses just in case
     const fallback = response?.output_text?.join('\n').trim();
     if (fallback) return JSON.parse(fallback);
     throw new Error('OpenAI response did not include textual content');
  }

  const sanitized = content
    .replace(/```json/gi, '')
    .replace(/```/g, '')
    .trim();
  
  const firstBrace = sanitized.indexOf('{');
  const lastBrace = sanitized.lastIndexOf('}');
  
  if (firstBrace !== -1 && lastBrace !== -1) {
      return JSON.parse(sanitized.slice(firstBrace, lastBrace + 1));
  }
  return JSON.parse(sanitized);
};

// --- PROMPT OLUŞTURUCULAR ---

const buildItineraryPrompt = (prompt, preferences) => {
  const preferenceSummary = JSON.stringify(preferences ?? {}, null, 2);
  const duration = preferences.durationDays;
  const durationConstraint = duration
    ? `DURATION CONSTRAINT: Create an itinerary for EXACTLY ${duration} DAYS. You MUST generate Day 1 through Day ${duration}.`
    : `DURATION INSTRUCTION: Analyze the user prompt carefully for duration keywords (e.g., "one week", "2 days", "weekend").
       - If a duration is explicitly mentioned in the prompt, use that EXACT duration.
       - If NO duration is mentioned, create a highly optimized 1-DAY itinerary.`;

  const lengthInstruction = "IMPORTANT: Keep descriptions concise (max 2 sentences). IF THE TRIP IS 4+ DAYS, LIMIT TO 2-3 STOPS PER DAY to ensure the output fits. You MUST generate an entry for EVERY SINGLE DAY requested.";

  const isMultiDay = (duration ?? 1) > 1;

  // 🔥 GÜNCELLENEN KISIM: İSİM TUZAĞI (NAME TRAP) KURALI EKLENDİ
  return `You are TourWise, an expert AI travel planner known for accuracy and local insights. Create a structured itinerary tailored to the traveler.

  ${durationConstraint}
  ${lengthInstruction}

  USER PROMPT: "${prompt}"

  ⛔ STRICT GEOGRAPHIC BOUNDARIES (CRITICAL):
  1. **CITY LOCK:** If the prompt specifies a city (e.g. "Istanbul"), you MUST NOT suggest places outside that city.
     - Example: If prompt says "Istanbul", do NOT suggest Sapanca, Bursa, or Cappadocia. Stay strictly within Istanbul city limits.
  2. **NAME TRAP WARNING:** Do NOT assume a place is in the target city just because it has the city name in its title.
     - Example: "Erzurum Kumpir" might be a shop located in Istanbul. If the target city is Erzurum, DO NOT suggest "Erzurum Kumpir" unless it is physically in Erzurum.
     - Always verify the implicit physical location.
  3. **CONSISTENCY:** Do not jump between distant locations unless explicitly asked for a multi-city trip.

  CRITICAL RULES FOR GOOGLE PLACES API COMPATIBILITY:
  1. REAL ENTITIES ONLY: Every stop must be a real Google Maps Point of Interest (POI).
  2. EXACT NAMES: Use the exact, official name of the place as it appears on Google Maps.
  3. NO FAKE NAMES: Never invent business names.

  ENRICHMENT RULES:
  1. CULINARY FOCUS: For lunch and dinner stops, the 'name' MUST be a specific, real restaurant or venue name.
  ${isMultiDay ? `2. ACCOMMODATION: Suggest a REAL, specific hotel name in the "accommodation" object.` : ''}

  Respond ONLY with JSON that matches the following shape:
{
  "title": string,
  "summary": string,
  "durationDays": number,
  "budget": { "currency": string, "amount": number, "perPerson"?: number, "notes"?: string },
  "tags": string[],
  "days": [ 
    {
      "dayNumber": number,
      "title": string,
      "summary": string,
      ${isMultiDay ? '"accommodation"?: { "name": string, "location": string, "reason": string },' : ''}
      "stops": [
        {
          "name": string,          
          "description": string,
          "location": { "city": string, "country": string, "address": string, "geo": { "lat": number, "lng": number } }
        }
      ]
    }
  ]
}
Brief: ${prompt}
Preferences JSON: ${preferenceSummary}`;
};


const buildModificationPrompt = (currentItinerary, userRequest) => {
  // 1. Mevcut Şehir Bağlamını Bul (Samsun mu, İstanbul mu?)
  const cityContext = 
    currentItinerary.preferences?.startingCity || 
    currentItinerary.days?.[0]?.stops?.[0]?.location?.city || 
    "the current location";

  // Token tasarrufu için özeti çıkar
  const simplifiedDays = currentItinerary.days.map(d => ({
    dayNumber: d.dayNumber,
    stops: d.stops.map(s => s.name) 
  }));

  return `
  You are an expert travel planner modifying an existing itinerary.
  
  CONTEXT: The trip is currently taking place in/around: **${cityContext}**.
  
  CURRENT ITINERARY STRUCTURE:
  ${JSON.stringify(simplifiedDays)}

  USER MODIFICATION REQUEST:
  "${userRequest}"

  ⛔ STRICT GEOGRAPHIC LOCK RULE ⛔:
  1. **CITY LOCK:** The user is currently in **${cityContext}**. DO NOT suggest places in other cities.
  2. **NAME TRAP:** Beware of places named after the city but located elsewhere (e.g. "Erzurum Cağ Kebapçısı" located in Ankara). Only suggest places physically located in **${cityContext}**.
  3. **DISTRICT LOCK:** If the User Request mentions a specific neighborhood, LOCK yourself to that neighborhood.

  INSTRUCTIONS:
  1. Modify only the parts requested by the user. Keep other days exactly as they are.
  2. Ensure every new stop has a real "name" verifiable on Google Maps.
  3. IMPORTANT: For every stop, you MUST include the "location": { "city": "${cityContext}" } field so we can find it on the map.
  
  Respond ONLY with the complete updated JSON in this format:
  {
    "days": [
      {
        "dayNumber": number,
        "title": string,
        "summary": string,
        "stops": [ 
            { 
                "name": "Place Name", 
                "description": "Short desc", 
                "location": { "city": "${cityContext}" } 
            } 
        ]
      }
    ]
  }
  `;
};

const buildPoiPrompt = (question, context) => {
  const contextBlock = context ? JSON.stringify(context, null, 2) : 'No additional context provided.';
  return `You are TourWise's travel concierge. Answer the travel question clearly and concisely. Respond ONLY with JSON like { "answer": string, "sources"?: string[] }.
Question: ${question}
Context: ${contextBlock}`;
};

// --- ANA SERVİSLER ---

export const requestItineraryPlan = async (prompt, preferences) => {
  if (!openAiClient) {
    return buildFallbackPlan(prompt, preferences);
  }

  try {
    const response = await safeChatCompletion({
      messages: [{ role: 'system', content: buildItineraryPrompt(prompt, preferences) }],
      temperature: 0.7,
    });

    return parseResponseJson(response);
  } catch (error) {
    console.error('LLM request failed, returning fallback plan', error);
    return buildFallbackPlan(prompt, preferences);
  }
};

export const requestItineraryModification = async (currentItinerary, userRequest) => {
  if (!openAiClient) {
    throw new Error("LLM Client not initialized");
  }

  try {
    // Şehir bağlamını prompt'a enjekte ediyoruz
    const prompt = buildModificationPrompt(currentItinerary, userRequest);
    
    const response = await safeChatCompletion({
      messages: [{ role: 'system', content: prompt }],
      temperature: 0.7, 
    });
    return parseResponseJson(response);
  } catch (error) {
    console.error('Itinerary modification failed', error);
    throw error;
  }
};

export const requestPoiAnswer = async (question, context) => {
  if (!openAiClient) {
    return {
      answer: `Placeholder answer for: "${question}". Configure LLM credentials to enable real responses.`,
    };
  }

  try {
    const response = await safeChatCompletion({
      messages: [{ role: 'system', content: buildPoiPrompt(question, context) }],
      temperature: 0.7,
    });

    return parseResponseJson(response);
  } catch (error) {
    console.error('Chatbot request failed', error);
    return {
      answer: 'We could not contact the AI assistant right now. Please try again in a few minutes.',
    };
  }
};

export const analyzeItineraryBudget = async (enrichedPlan) => {
  if (!openAiClient) {
    return {
      currency: 'USD',
      amount: 0,
      perPerson: 0,
      notes: 'Budget analysis unavailable (LLM offline).',
    };
  }

  const prompt = `
  You are a travel budget expert. Analyze this itinerary and estimate a realistic budget.
  
  INPUT DATA:
  - Duration: ${enrichedPlan.durationDays} days
  - Travelers: 1 person
  - Itinerary JSON: ${JSON.stringify(enrichedPlan.days).slice(0, 3000)}... (truncated for token limits)
  
  CRITICAL INSTRUCTIONS FOR COST OF LIVING ADJUSTMENT:
  1. Identify the City/Country Economic Tier.
  2. Estimate Costs for Accommodation, Food, Transport, Tickets.

  OUTPUT JSON ONLY:
  {
    "currency": "USD",
    "amount": number,
    "perPerson": number,
    "notes": "Explain the calculation logic."
  }
  `;

  try {
    const response = await safeChatCompletion({
      messages: [{ role: 'system', content: prompt }],
      temperature: 0.5,
    });
    return parseResponseJson(response);
  } catch (error) {
    console.error('Budget analysis failed', error);
    return {
      currency: 'USD',
      amount: 0,
      perPerson: 0,
      notes: 'Budget estimation failed due to service error.',
    };
  }
};
