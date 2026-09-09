# Vermont plate log

A log of standard Vermont passenger plates — the `ABC 123` format — spotted around Burlington
by two people. No truck, trailer, motorcycle or vanity plates, no other states, no photo
recognition.

```
npm install
cp .env.example .env.local     # set APP_PASSWORD and AUTH_SECRET
npm run db:migrate
npm run dev
```

There is no seed step. The app starts empty on purpose, including plates we had already seen
before it existed.

---

## The part that will look like a bug in six months

### Vermont skips letters, and it started skipping fewer of them in 2023

`I`, `J`, `O` and `Q` have never appeared in the sequence. `I` and `O` read as `1` and `0`, and
`Q` reads as `O`. That leaves 22 usable letters.

`U`, `V` and `Z` are recent. They were dormant for the first three decades of the series and
Vermont activated them in **late 2023**, which is why `lib/plate.ts` carries two alphabets:

```ts
ALPHABET        = 'ABCDEFGHKLMNPRSTUVWXYZ'   // 22, today
LEGACY_ALPHABET = 'ABCDEFGHKLMNPRSTWXY'      // 19, before the activation
```

The critical detail — and the reason half this file exists — is that the three new letters were
**slotted into alphabetical order rather than appended to the end**. `U` sits between `T` and
`W`; `Z` sits after `Y`.

So `AAU 001` computes to ordinal 15,985, right at the start of the sequence, and yet it cannot
have been issued before late 2023, because `U` did not exist in the sequence when the `AA` block
was being stamped in the early nineties. Its ordinal is not merely imprecise; it is meaningless.

`estimateIssuanceEra` reports that case as `contradictory` and refuses to give a date beyond
"after the activation". **If you ever find yourself thinking this is a bug and simplifying it
away, this is the paragraph that says it isn't.**

### There are two ordinal functions, and that is deliberate

- `toOrdinal` counts in the modern 22-letter sequence. It is the canonical sort key and the value
  stored on every sighting.
- `toLegacyOrdinal` counts in the 19-letter sequence and returns `null` for any plate containing
  `U`, `V` or `Z`.

For a plate issued before 2023, the modern ordinal **overcounts the past**, because it includes
`U`/`V`/`Z` blocks that were skipped at the time and never issued at all. The drift is large:

```
KPA 001    modern 4,131,865    legacy 3,112,885    ~1.02M plates that never existed
```

Extrapolating backwards from the observed rate in modern space dates the start of the series to
roughly 1969. In legacy space, roughly 1983. The series actually began **1 January 1990**. Both
are wrong, which is the point — but legacy space is the less wrong of the two, so that is what
the backwards estimate uses.

### Era estimation is interpolation between two sightings, not data

Nothing here comes from the DMV. `ANCHORS` holds two first-hand observations of where the
sequence had reached:

| Block | Observed   | Note                                                  |
|-------|------------|-------------------------------------------------------|
| `KPZ` | late 2023  | `KPZ 451` seen, with the `KPV` series also circulating |
| `LAX` | Sept 2026  | the `LAX` block was current; digits not recorded       |

Between them, the sequence advanced about **210 plates a day**, or roughly 77,000 a year. Every
estimate in the app is that one number applied to a distance.

**Anchors are blocks, not plates.** What actually gets confirmed in the wild is which block the
sequence was in at a given time; nobody writes down the digits. Anchoring on the block is the
honest representation, and the block midpoint bounds the error at ±499 plates — about two and a
half days, which is nothing next to every other source of error here. It also means nothing in
`ANCHORS` is a plate string, so an anchor can never be mistaken for, or accidentally seeded as,
a sighting.

The four confidence levels a plate can come back with:

| Confidence      | When                                     | How much to trust it |
|-----------------|------------------------------------------|----------------------|
| `interpolated`  | between two anchors                      | Good to a few months |
| `projected`     | past the newest anchor                   | Softens with distance |
| `speculative`   | before the oldest anchor                 | Decade is a hint, year is noise |
| `contradictory` | early ordinal, but contains `U`/`V`/`Z`  | Only "after late 2023" is knowable |

**Adding an anchor tightens everything automatically.** `ANCHORS` is an ordered array and the
estimator brackets against the nearest pair, so appending a new confirmed block improves every
estimate near it without touching the estimator. Only put first-hand observations in there.

### Other things that look wrong and are not

- **A block is 999 plates, not 1,000.** The numeric run is `001`–`999`; there is no `000`.
- **Issuance is not perfectly dense.** Vermont reportedly leaves multi-thousand gaps for vanity
  reservations and administrative buffers, so the difference between two ordinals overstates the
  number of plates actually issued between them. The derived daily rate absorbs this, but any
  reasoning about exact counts should not.
- **Wikipedia disagrees about `U`.** It currently claims `U` is still unused and dates the `V`/`Z`
  activation to January 2024 rather than late 2023. This app follows first-hand observation.
  `ALPHABET` is a single exported constant, so correcting it is a one-line change — but be aware
  that doing so **changes every ordinal already stored in the database**, and the `ordinal` column
  would need rewriting from `toOrdinal`.
- **Some notable combinations can never be found.** States run blocklists against sequential
  issuance. Entries in `lib/notable.ts` flagged `theoretical` are tracked as unstampable rather
  than as "not yet spotted". Separately, `SQL`, `API` and `LOL` are absent because they contain
  `Q`, `I` and `O` — a test enforces that every entry is a combination Vermont can actually issue.

---

## How it fits together

```
lib/plate.ts        the domain model — no imports, runs identically in both places
lib/notable.ts      curated three-letter combinations
lib/plate-style.ts  the plate's colours and proportions, shared by two renderers
db/schema.ts        one table
proxy.ts            the password gate (Next 16's renamed middleware)
```

`lib/plate.ts` deliberately has **zero imports**. The log screen validates, computes the ordinal
and estimates the era as you type, with no round trip; the API route then computes the same
ordinal server-side from the same function. Adding a dependency to that file breaks the first
half of that.

**The plate exists twice.** `components/plate.tsx` renders it with Tailwind and CSS custom
properties. `app/plate/[plate]/opengraph-image.tsx` renders it again with inline styles, because
`ImageResponse` runs through satori, which supports neither. Both read their numbers from
`lib/plate-style.ts`, and `lib/plate-style.test.ts` asserts those still match the tokens in
`globals.css`. That test is the only thing keeping the two from drifting apart silently.

Every ratio in `lib/plate-style.ts` is labelled with its unit. Vertical offsets are fractions of
the plate's **height** and must be CSS percentages; an `em` there resolves against the element's
own font size, which the serial overrides, and the serial ends up several plate-widths off the
plate. This has already happened once.

### Access

Everything sits behind one shared password, except `/plate/[plate]` and its Open Graph image,
which are public so shared links preview and open. A plate page shows one plate, its era
estimate and the first name of whoever logged it. It renders for any valid plate whether or not
anyone has spotted it, so the URL space reveals nothing about the collection, and there is no
navigation from it into the gated views.

Two people, one password, so there is no user table. `spotted_by` is a choice on the form, not
an identity.

### The `ordinal` column

Denormalised from `toOrdinal` on insert. SQL cannot derive it — sorting the plate string
lexically orders over all 26 ASCII letters while Vermont's sequence runs through 22 — and both
the collection ordering and the gaps view's range scans need it. `lib/plate.ts` stays the source
of truth; nothing writes that column by hand.

## Commands

```
npm run dev          npm run build         npm start
npm test             vitest, once
npm run lint         eslint
npm run db:generate  write a migration from db/schema.ts
npm run db:migrate   apply migrations
npm run db:studio    drizzle studio
npm run icons        regenerate the home-screen PNGs from the plate artwork
```

Locally `DATABASE_URL="file:./local.db"` needs no Turso account. In production the Turso
integration on the Vercel Marketplace injects its own variables and nothing needs setting by
hand; see `db/connection.ts`.
