import { eq } from 'drizzle-orm';
import { getDb } from '@/db';
import { sightings } from '@/db/schema';
import { jsonError, jsonOk, parseJsonBody, withErrorHandling } from '@/lib/api';
import { sightingUpdateSchema } from '@/lib/validation';

/*
 * Editing and removing one row.
 *
 * No auth check here. proxy.ts denies by default and /api/sightings is not one
 * of its holes, so an unauthenticated call never reaches this file. spotted_by
 * is whoever signed in, but the log belongs to both people, so there is no
 * "did you log this" question to ask before a note is edited or a row removed.
 *
 * Both verbs use .returning() to tell a real row from a stale id, which saves
 * the read that would otherwise come first.
 */

type Context = { params: Promise<{ id: string }> };

const missing = () => jsonError('That sighting is not in the log.', 404);

/** The note, and only the note. Changing the plate would strand `ordinal`. */
export async function PATCH(request: Request, { params }: Context) {
  return withErrorHandling(async () => {
    const body = await parseJsonBody(request, sightingUpdateSchema);
    if (!body.ok) return body.response;

    const { id } = await params;
    const [updated] = await getDb()
      .update(sightings)
      // Empty means cleared, stored the way an untouched note already is.
      .set({ notes: body.data.notes || null })
      .where(eq(sightings.id, id))
      .returning();

    return updated ? jsonOk({ sighting: updated }) : missing();
  });
}

/*
 * Deleting frees the plate: the unique index is what stops a second row, so
 * removing the first one is how a misread plate gets logged again correctly.
 */
export async function DELETE(_request: Request, { params }: Context) {
  return withErrorHandling(async () => {
    const { id } = await params;
    const [removed] = await getDb().delete(sightings).where(eq(sightings.id, id)).returning();

    return removed ? jsonOk({ plate: removed.plate }) : missing();
  });
}
