/**
 * Zod schemas for validating all API route inputs.
 * Rejects oversized, malformed, or missing payloads.
 */

import { z } from 'zod';

// Max string lengths to prevent abuse
const MAX_MESSAGE = 2_000;
const MAX_LOCATION = 500;
const MAX_CONCERNS = 1_000;
const MAX_SPEECH = 1_000;
const MAX_HISTORY = 50;

/* ------------------------------------------------------------------ */
/*  /api/chat                                                          */
/* ------------------------------------------------------------------ */

export const chatSchema = z.object({
  message: z
    .string()
    .min(1, 'Message is required')
    .max(MAX_MESSAGE, `Message must be under ${MAX_MESSAGE} characters`),
  history: z
    .array(
      z.object({
        role: z.enum(['user', 'assistant']),
        content: z.string().max(MAX_MESSAGE),
      })
    )
    .max(MAX_HISTORY, `History must be under ${MAX_HISTORY} messages`)
    .optional()
    .default([]),
});

/* ------------------------------------------------------------------ */
/*  /api/find-help                                                     */
/* ------------------------------------------------------------------ */

export const findHelpSchema = z.object({
  location: z.string().max(MAX_LOCATION).optional().default(''),
  childAge: z
    .number()
    .int()
    .min(1, 'Age must be at least 1')
    .max(18, 'Age must be at most 18')
    .optional(),
  concerns: z.string().max(MAX_CONCERNS).optional().default(''),
  country: z
    .string()
    .min(2, 'Country code too short')
    .max(5, 'Country code too long')
    .regex(/^[A-Z]{2,5}$/, 'Invalid country code')
    .optional()
    .default('US'),
});

/* ------------------------------------------------------------------ */
/*  /api/story-studio                                                  */
/* ------------------------------------------------------------------ */

const VALID_SCENARIOS = ['restaurant', 'park', 'school', 'space-adventure'] as const;

export const storyStudioSchema = z.object({
  scenario: z.enum(VALID_SCENARIOS).optional().default('restaurant'),
  childSpeech: z.string().max(MAX_SPEECH).optional(),
  conversationHistory: z
    .array(
      z.object({
        role: z.enum(['child', 'character']),
        text: z.string().max(MAX_SPEECH),
      })
    )
    .max(MAX_HISTORY)
    .optional()
    .default([]),
  childAge: z.number().int().min(2).max(14).optional().default(5),
  getOpener: z.boolean().optional().default(false),
});

/* ------------------------------------------------------------------ */
/*  /api/screening/analyze                                             */
/* ------------------------------------------------------------------ */

const phonemeSchema = z.object({
  sound: z.string().max(5),
  score: z.number().min(0).max(1),
  skipped: z.boolean(),
  stimulable: z.boolean().optional(),
  preHintScore: z.number().min(0).max(1).optional(),
  postHintScore: z.number().min(0).max(1).optional(),
  hintProvided: z.boolean().optional(),
});

const categorySchema = z.object({
  id: z.string().max(50),
  name: z.string().max(100),
  averageScore: z.number().min(0).max(1),
  riskLevel: z.enum(['on-track', 'monitor', 'consult']),
  phonemes: z.array(phonemeSchema).max(30),
});

export const screeningAnalyzeSchema = z.object({
  categories: z.array(categorySchema).min(1).max(10),
  childAge: z.number().int().min(2, 'Age must be at least 2').max(14, 'Age must be at most 14'),
  overallRisk: z.enum(['on-track', 'monitor', 'consult']),
});

/* ------------------------------------------------------------------ */
/*  /api/clinician                                                     */
/* ------------------------------------------------------------------ */

const clinicianPhonemeSchema = z.object({
  sound: z.string().max(5),
  score: z.number().min(0).max(1),
  skipped: z.boolean(),
  attempts: z.number().int().min(0),
  stimulable: z.boolean().optional(),
  preHintScore: z.number().min(0).max(1).optional(),
  postHintScore: z.number().min(0).max(1).optional(),
  hintProvided: z.boolean().optional(),
});

const clinicianCategorySchema = z.object({
  id: z.string().max(50),
  name: z.string().max(100),
  averageScore: z.number().min(0).max(1),
  riskLevel: z.string().max(20),
  phonemes: z.array(clinicianPhonemeSchema).max(30),
});

const cycleTargetSchema = z.object({
  phoneme: z.string().max(10),
  score: z.number().min(0).max(1),
});

export const clinicianSchema = z.object({
  code: z
    .string()
    .min(1, 'Access code is required')
    .max(20, 'Access code too long')
    .regex(/^[A-Z0-9]{4,8}$/, 'Invalid access code format'),
  assessmentData: z
    .object({
      id: z.string(),
      childAge: z.number().int().min(2).max(14),
      completedAt: z.string(),
      categories: z.array(clinicianCategorySchema).max(10),
      overallRisk: z.string(),
      overallScore: z.number(),
    })
    .optional(),
  cycleData: z
    .object({
      currentCycleIndex: z.number().int().min(0),
      dayWithinCycle: z.number().int().min(0),
      trialCount: z.number().int().min(0),
      cycles: z.array(z.array(cycleTargetSchema).max(30)).max(50),
      startDate: z.string(),
      clinicianTargets: z.array(z.string()).optional(),
    })
    .optional(),
});

/* ------------------------------------------------------------------ */
/*  Helper: parse & return 400 on failure                              */
/* ------------------------------------------------------------------ */

import { NextResponse } from 'next/server';

export function validateBody<T>(
  schema: z.ZodType<T>,
  data: unknown
): { ok: true; data: T } | { ok: false; response: NextResponse } {
  const result = schema.safeParse(data);
  if (!result.success) {
    const firstError = result.error.issues[0];
    return {
      ok: false,
      response: NextResponse.json(
        {
          error: 'Validation failed',
          details: firstError?.message || 'Invalid input',
          field: firstError?.path?.join('.') || undefined,
        },
        { status: 400 }
      ),
    };
  }
  return { ok: true, data: result.data };
}
