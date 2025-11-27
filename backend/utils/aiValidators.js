import { z } from 'zod';

const geoSchema = z.object({
  lat: z.number(),
  lng: z.number(),
});

const locationSchema = z.object({
  city: z.string().optional(),
  country: z.string().optional(),
  address: z.string().optional(),
  geo: geoSchema.optional(),
});

const stopSchema = z.object({
  id: z.string().optional(),
  name: z.string(),
  description: z.string().optional(),
  address: z.string().optional(),
  location: locationSchema.optional(),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  notes: z.string().optional(),
  resources: z.array(z.string()).optional(),
});

const daySchema = z.object({
  dayNumber: z.number().int().min(1),
  title: z.string().optional(),
  summary: z.string().optional(),
  stops: z.array(stopSchema).default([]),
});

const budgetSchema = z.object({
  currency: z.string().min(3).max(3),
  amount: z.number().min(0),
  perPerson: z.number().min(0).optional(),
  notes: z.string().optional(),
});

export const generationSchema = z.object({
  prompt: z.string().min(10),
  preferences: z
    .object({
      durationDays: z.number().int().min(1).max(30).optional(),
      budgetRange: z.string().optional(),
      travelStyles: z.array(z.string()).optional(),
      travelers: z.number().int().min(1).max(12).optional(),
      mustInclude: z.array(z.string()).optional(),
      exclude: z.array(z.string()).optional(),
      startingCity: z.string().optional(),
    })
    .default({}),
});

export const aiItinerarySchema = z.object({
  title: z.string().min(3),
  summary: z.string().min(10),
  durationDays: z.number().int().min(1),
  budget: budgetSchema.optional(),
  tags: z.array(z.string()).default([]),
  days: z.array(daySchema).min(1),
  visibility: z.enum(['private', 'shared']).default('private'),
  prompt: z.string().optional(),
});

export const updateAiItinerarySchema = aiItinerarySchema.partial().extend({
  status: z.enum(['draft', 'published', 'archived']).optional(),
});

export const chatbotSchema = z.object({
  poiId: z.string().optional(),
  question: z.string().min(5),
  context: z
    .object({
      name: z.string().optional(),
      summary: z.string().optional(),
      location: locationSchema.optional(),
    })
    .optional(),
});


