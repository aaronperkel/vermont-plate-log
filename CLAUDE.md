# Plate log

A two-person log of standard Vermont passenger plates (`ABC 123`), spotted around Burlington.
Next 16 App Router, Drizzle over Turso, Tailwind v4, deployed on Vercel.

## Commands

```bash
npm run dev
npm test             # vitest, once
npm run lint         # eslint, no prettier in this repo
npm run build        # applies pending migrations first, then builds
npm run db:generate  # write a migration after editing db/schema.ts
npm run db:migrate   # on its own; the build does this too, so Vercel deploys migrate
npm run icons        # regenerate home-screen PNGs from the plate artwork
```

Locally `DATABASE_URL="file:./local.db"` needs no Turso account.

## Invariants

**`lib/plate.ts` has no imports and must keep it that way.** The log screen validates, computes
ordinals and estimates eras as you type with no round trip, and the server computes the stored
ordinal from the same functions. A dependency there breaks the first half of that.

**Two alphabets, not one.** Vermont slotted `U`, `V` and `Z` into alphabetical order when it
activated them in late 2023 rather than appending them, so a plate containing one computes to an
early ordinal but cannot predate the activation. `estimateIssuanceEra` reports that as
`contradictory` and refuses a date. This is not a bug and must not be simplified away — the
README explains it at length.

**Anchors are blocks, never plates**, and they live in code, never in the database. The sightings
table only ever holds plates somebody actually saw; there is no reference-row flag because there
is no second kind of row. Charts get their scale from `ANCHORS` as reference lines.

**A block is 999 plates.** The numeric run is `001`–`999`; there is no `000`.

**The plate exists twice.** `components/plate.tsx` uses Tailwind and custom properties;
`app/plate/[plate]/opengraph-image.tsx` re-implements it with inline styles because satori
supports neither. Both read `lib/plate-style.ts`, and `lib/plate-style.test.ts` asserts those
values still match `globals.css`. Change a plate colour or proportion in `lib/plate-style.ts`
and `globals.css` together, then run the tests.

Every ratio in `lib/plate-style.ts` is labelled with its unit. Vertical offsets are fractions of
**height** and must be CSS percentages — an `em` resolves against the element's own font size,
which the serial overrides, putting it several plate-widths off the plate.

**`sightings.ordinal` is denormalised** from `toOrdinal` on insert and never written by hand. SQL
cannot derive it, because sorting the plate string lexically orders over 26 ASCII letters while
the sequence uses 22.

## Conventions

Matches `../funko`, the newest project in this folder.

- npm. No `src/`. Top-level `app/ components/ lib/ db/ scripts/ assets/`, `proxy.ts` at the root
  (Next 16's renamed middleware).
- kebab-case filenames, PascalCase named exports. Only `page.tsx`/`layout.tsx` default-export.
- Tailwind v4, no config file: `:root` tokens in `app/globals.css` with contrast ratios in the
  comments, then `@theme inline`.
- Single quotes in hand-written code; scaffolded configs stay double-quoted as generated.
- API routes, not server actions. Server components read `lib/queries/*` directly; mutations go
  client → `fetch` → `app/api/*/route.ts` through the helpers in `lib/api.ts`.
- Never read `process.env` or construct a DB client at module scope — `next build` imports every
  route, so an eager read turns a missing variable into a build failure on an unrelated page.
  Use `env` getters and `getDb()`.
- Fonts are committed in `assets/fonts/` and loaded with `next/font/local`, so builds never
  depend on reaching Google. Each face ships as woff2 for the browser and TTF for satori.

## Design

Light mode only. No dark theme and no toggle — do not add one.

The plate is the only place colour is spent. Nothing else casts a shadow and nothing else has a
meaningful corner radius, which is what keeps it reading as an object rather than a UI accent.
Structure comes from hairline rules, not cards.

Deliberately avoided, because they read as generated: tracked-out all-caps eyebrow labels,
identical rounded cards with soft grey shadows, meta strings joined with middle dots, `→` in link
text, monospace for small data labels, and entrance animations. Motion appears in exactly two
places, both answering an action: confirming a save and revealing a duplicate.

Sentence case throughout. Numbers use `.tnum` for tabular figures rather than a monospace face.
