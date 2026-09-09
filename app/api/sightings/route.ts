import { getDb } from '@/db';
import { type Sighting, sightings } from '@/db/schema';
import { jsonError, jsonOk, parseJsonBody, withErrorHandling } from '@/lib/api';
import { toOrdinal } from '@/lib/plate';
import { findByPlate, listSightings } from '@/lib/queries/sightings';
import { sightingCreateSchema } from '@/lib/validation';

export async function GET() {
  return withErrorHandling(async () => jsonOk({ sightings: await listSightings() }));
}

/** 409 with the row that already exists, so the form can say who logged it. */
function duplicate(existing: Sighting) {
  return jsonError('That plate is already in the log.', 409, { existing });
}

export async function POST(request: Request) {
  return withErrorHandling(async () => {
    const body = await parseJsonBody(request, sightingCreateSchema);
    if (!body.ok) return body.response;

    const { plate, spottedBy, spottedAt, location, notes } = body.data;

    /*
     * Checked before inserting so the response can name who logged it and
     * when. That check races — two phones logging the same plate at the same
     * moment both pass it — so the insert below also handles the constraint
     * violation. The unique index is what guarantees correctness here; this
     * lookup only exists to produce a better message.
     */
    const existing = await findByPlate(plate);
    if (existing) return duplicate(existing);

    try {
      const [created] = await getDb()
        .insert(sightings)
        .values({
          plate,
          // Denormalised here, from the one function that knows how. Never by hand.
          ordinal: toOrdinal(plate),
          spottedBy,
          spottedAt,
          location: location || null,
          notes: notes || null,
        })
        .returning();

      return jsonOk({ sighting: created }, 201);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : '';
      if (!message.includes('UNIQUE constraint failed')) throw error;

      // Lost the race. Report it the same way as if the pre-check had caught it.
      const winner = await findByPlate(plate);
      return winner ? duplicate(winner) : jsonError('That plate is already in the log.', 409);
    }
  });
}
