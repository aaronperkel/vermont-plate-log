import { z } from 'zod';
import { SPOTTERS } from '@/db/schema';
import { parse, validate } from '@/lib/plate';

/*
 * The plate rules live in lib/plate.ts, not in a Zod refinement, so the browser
 * and the server enforce exactly the same thing — and so the error message the
 * API returns is the one the log screen was already showing as you typed.
 */
export const sightingCreateSchema = z.object({
  plate: z
    .string()
    .transform((raw) => parse(raw))
    .refine((p): p is string => p !== null, {
      message: 'A Vermont plate is three letters then three digits, like LAX 123.',
    })
    .superRefine((p, ctx) => {
      const result = validate(p);
      if (!result.ok) ctx.addIssue({ code: 'custom', message: result.message });
    }),
  spottedBy: z.enum(SPOTTERS),
  spottedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use a date like 2026-09-09.'),
  location: z.string().trim().max(120).optional().or(z.literal('')),
  notes: z.string().trim().max(500).optional().or(z.literal('')),
});

export type SightingCreate = z.infer<typeof sightingCreateSchema>;
