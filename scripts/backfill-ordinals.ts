import './load-env';
import { createClient } from '@libsql/client';
import { eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/libsql';
import { resolveDatabaseConnection } from '../db/connection';
import { sightings } from '../db/schema';
import { format, toOrdinal } from '../lib/plate';

/*
 * Rewrite sightings.ordinal from toOrdinal().
 *
 * The column is denormalised on insert and never edited by hand, so changing
 * the ordinal arithmetic leaves every stored value describing the old sequence.
 * Nothing warns about that: the numbers stay plausible, the collection just
 * sorts and spans subtly wrong. BLOCK_SIZE moving from 999 to 1000 — when 000
 * turned out to be a real plate — is exactly such a change.
 *
 * Run once per database after any change to the arithmetic. Idempotent: rows
 * that already agree are left alone, so a second run reports nothing.
 *
 *   npm run db:backfill -- --check   list what would change, write nothing
 *   npm run db:backfill              apply it
 */

async function main() {
  const check = process.argv.includes('--check');
  const { url, authToken, isLocalFile } = resolveDatabaseConnection();
  const client = createClient({ url, authToken });
  const db = drizzle(client);
  const where = isLocalFile ? url : 'the remote Turso database';

  const rows = await db.select().from(sightings);
  const stale = rows
    .map((row) => ({ row, ordinal: toOrdinal(row.plate) }))
    .filter(({ row, ordinal }) => row.ordinal !== ordinal);

  if (stale.length === 0) {
    console.log(`All ${rows.length} sightings in ${where} already agree with toOrdinal.`);
    client.close();
    return;
  }

  for (const { row, ordinal } of stale) {
    console.log(`  ${format(row.plate)}  ${row.ordinal} -> ${ordinal}`);
  }

  if (check) {
    console.log(`\n${stale.length} of ${rows.length} would change in ${where}. Nothing written.`);
    client.close();
    return;
  }

  /*
   * One transaction. A half-applied backfill is worse than none: the table ends
   * up with some rows counted in the old sequence and some in the new, which
   * sorts wrongly and looks like nothing is wrong.
   */
  await db.transaction(async (tx) => {
    for (const { row, ordinal } of stale) {
      await tx.update(sightings).set({ ordinal }).where(eq(sightings.id, row.id));
    }
  });

  console.log(`\n${stale.length} of ${rows.length} rewritten in ${where}.`);
  client.close();
}

main().catch((error: unknown) => {
  console.error('Backfill failed:', error);
  process.exit(1);
});
