import { createId } from '@paralleldrive/cuid2';
import { type InferInsertModel, type InferSelectModel } from 'drizzle-orm';
import { index, integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';

/*
 * One table. Two people log plates; there is nothing else to model.
 *
 * Every row is a plate somebody actually saw. There is no flag separating kinds
 * of row because there is only one kind — the sequence anchors used for era
 * estimation live in lib/plate.ts as domain constants and are deliberately
 * never written here. Seeding them would skew the counts and pollute the
 * collection to solve what is really a charting problem.
 */

export const SPOTTERS = ['aaron', 'riley'] as const;
export type Spotter = (typeof SPOTTERS)[number];

const now = () => new Date().toISOString();

export const sightings = sqliteTable(
  'sightings',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => createId()),

    /** Canonical unspaced form, e.g. 'LAX123'. Never store the spaced version. */
    plate: text('plate').notNull(),

    /*
     * Denormalised from toOrdinal(). The collection sorts by this and the gaps
     * view scans ranges over it, neither of which SQL can derive: sorting the
     * plate string lexically orders over all 26 ASCII letters, while Vermont's
     * sequence runs through 22. lib/plate.ts remains the source of truth; this
     * column is written on insert and never edited by hand.
     */
    ordinal: integer('ordinal').notNull(),

    spottedBy: text('spotted_by', { enum: SPOTTERS }).notNull(),

    /** ISO date. Timestamps are text here, matching the rest of the schema. */
    spottedAt: text('spotted_at').notNull(),

    location: text('location'),
    notes: text('notes'),

    createdAt: text('created_at').notNull().$defaultFn(now),
  },
  (t) => [
    /*
     * A plate is spotted once. Re-entering a known plate should surface who
     * logged it and when, not create a second row — see the duplicate handling
     * in app/api/sightings/route.ts.
     */
    uniqueIndex('sightings_plate_idx').on(t.plate),
    index('sightings_ordinal_idx').on(t.ordinal),
  ],
);

export type Sighting = InferSelectModel<typeof sightings>;
export type NewSighting = InferInsertModel<typeof sightings>;
