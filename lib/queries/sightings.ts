import { asc, eq } from 'drizzle-orm';
import { getDb } from '@/db';
import { type Sighting, sightings } from '@/db/schema';

/*
 * Reads. Server components call these directly; the API routes are for writes.
 * getDb() is called inside each function, never at module scope.
 */

/** Every sighting, oldest position in the sequence first. */
export async function listSightings(): Promise<Sighting[]> {
  return getDb().select().from(sightings).orderBy(asc(sightings.ordinal));
}

export async function findByPlate(plate: string): Promise<Sighting | null> {
  const [row] = await getDb().select().from(sightings).where(eq(sightings.plate, plate)).limit(1);
  return row ?? null;
}

export async function countSightings(): Promise<number> {
  return (await listSightings()).length;
}
