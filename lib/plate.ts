/*
 * Vermont standard passenger plates: the whole domain model.
 *
 * This file has no imports on purpose. It runs unchanged in the browser (the
 * log screen validates and estimates as you type) and on the server (the API
 * route computes the ordinal it stores). Adding a dependency here means the
 * log screen stops being able to answer instantly, so don't.
 *
 * Scope is one format and one format only: three letters, three digits, the
 * standard passenger series. No trucks, trailers, motorcycles or vanity plates.
 */

/*
 * The 22 letters Vermont issues today.
 *
 * I, J, O and Q have never appeared in the sequence and never will — I and O
 * read as 1 and 0, Q reads as O. U, V and Z are recent: they were dormant
 * until late 2023, when Vermont activated them.
 *
 * The critical detail is that the three new letters were slotted into
 * alphabetical order rather than appended to the end. U sits between T and W;
 * Z sits after Y. So the sequence position of a plate containing one of them
 * says nothing about when it was issued — see estimateIssuanceEra.
 */
export const ALPHABET = 'ABCDEFGHKLMNPRSTUVWXYZ';

/*
 * The 19 letters in use before the activation — ALPHABET minus U, V and Z.
 *
 * This is what the sequence actually ran through for the first three decades,
 * and it is the only honest basis for counting how many plates were issued
 * before a pre-2023 plate. See toLegacyOrdinal.
 */
export const LEGACY_ALPHABET = 'ABCDEFGHKLMNPRSTWXY';

/** The letters that did not exist in the sequence before the activation. */
export const POST_ACTIVATION_LETTERS = 'UVZ';

/*
 * Plates per letter block. The numeric run is 001-999 — there is no 000 — so a
 * block holds 999 plates, not 1000. Getting this wrong shifts every ordinal in
 * the database by a growing amount.
 */
export const BLOCK_SIZE = 999;

/** Month the sequence began issuing U, V and Z. Observed, not documented. */
export const ACTIVATION_MONTH = '2023-11';

/*
 * When the ABC 123 series itself began. A plate cannot predate this, which is
 * the one hard bound available to clamp a backwards extrapolation against.
 */
export const SERIES_START_MONTH = '1990-01';

/** Total addressable plates in the modern 22-letter sequence. */
export const SEQUENCE_SIZE = ALPHABET.length ** 3 * BLOCK_SIZE;

const CANONICAL = /^[A-Z]{3}[0-9]{3}$/;
const MS_PER_DAY = 86_400_000;
const ORDINALS = ['first', 'second', 'third'] as const;

/*
 * Why each excluded letter is excluded. Used verbatim in validation messages,
 * because "invalid plate" tells someone standing in a parking lot nothing.
 */
const EXCLUSION_REASONS: Record<string, string> = {
  I: 'it reads as a 1',
  O: 'it reads as a 0',
  Q: 'it reads as an O',
  J: 'Vermont has never issued it',
};

// ---------------------------------------------------------------------------
// Parsing and validation
// ---------------------------------------------------------------------------

/*
 * Normalise anything a person might type into the canonical unspaced form:
 * 'lax123', 'LAX 123', 'LAX-123' and 'lax_123' all become 'LAX123'.
 *
 * This checks shape only, never domain rules — 'ABO123' parses happily and is
 * then rejected by validate. Keeping the two separate is what lets the log
 * screen say "O is not a letter Vermont uses" instead of "invalid".
 */
export function parse(input: string): string | null {
  const stripped = input.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  return CANONICAL.test(stripped) ? stripped : null;
}

export type ValidationResult = { ok: true } | { ok: false; message: string };

/**
 * Enforce the letter and digit rules, naming the specific character at fault.
 * Expects canonical form — run parse first.
 */
export function validate(plate: string): ValidationResult {
  if (!CANONICAL.test(plate)) {
    return { ok: false, message: 'A Vermont plate is three letters then three digits, like LAX 123.' };
  }

  for (let i = 0; i < 3; i += 1) {
    const letter = plate[i];
    if (ALPHABET.includes(letter)) continue;

    const reason = EXCLUSION_REASONS[letter] ?? 'Vermont has never issued it';
    return {
      ok: false,
      message: `The ${ORDINALS[i]} letter, ${letter}, is not used on Vermont plates — ${reason}.`,
    };
  }

  if (digitsOf(plate) === 0) {
    return { ok: false, message: 'The digits run 001 to 999. There is no 000 in the sequence.' };
  }

  return { ok: true };
}

/** Convenience wrapper for the common "is this usable" check. */
export function isValid(plate: string): boolean {
  return validate(plate).ok;
}

/** 'LAX123' -> 'LAX 123'. Display only; never store the spaced form. */
export function format(plate: string): string {
  return `${plate.slice(0, 3)} ${plate.slice(3)}`;
}

/** The three-letter block a plate belongs to: 'LAX123' -> 'LAX'. */
export function blockOf(plate: string): string {
  return plate.slice(0, 3);
}

function digitsOf(plate: string): number {
  return Number(plate.slice(3));
}

function assertValid(plate: string): void {
  const result = validate(plate);
  if (!result.ok) {
    throw new Error(`Not a Vermont plate: ${plate}. ${result.message}`);
  }
}

// ---------------------------------------------------------------------------
// Ordinals
// ---------------------------------------------------------------------------

/*
 * Ordinal of the last plate before a block starts, so that
 * ordinal(plate) === blockBase(block) + digits. AAA is base 0, so AAA 001 is
 * ordinal 1 and there is no ordinal 0.
 */
function blockBase(block: string, alphabet: string): number | null {
  const radix = alphabet.length;
  let index = 0;

  for (const letter of block) {
    const position = alphabet.indexOf(letter);
    if (position < 0) return null;
    index = index * radix + position;
  }

  return index * BLOCK_SIZE;
}

/**
 * Position in the modern 22-letter sequence. AAA 001 is 1, ZZZ 999 is the last.
 *
 * This is the canonical sort key and the value stored on each sighting. It is
 * NOT a reliable measure of how many plates preceded this one — for a plate
 * issued before 2023 it counts U/V/Z blocks that were skipped at the time.
 * Use toLegacyOrdinal for that.
 */
export function toOrdinal(plate: string): number {
  assertValid(plate);
  return blockBase(blockOf(plate), ALPHABET)! + digitsOf(plate);
}

/**
 * Position in the 19-letter sequence that was actually running before the
 * activation, or null if the plate contains U, V or Z (in which case it has no
 * position in that sequence, because those letters did not exist in it).
 *
 * For a pre-2023 plate this is the real count of plates issued before it.
 */
export function toLegacyOrdinal(plate: string): number | null {
  assertValid(plate);
  const base = blockBase(blockOf(plate), LEGACY_ALPHABET);
  return base === null ? null : base + digitsOf(plate);
}

/** Inverse of toOrdinal. */
export function fromOrdinal(ordinal: number): string {
  if (!Number.isInteger(ordinal) || ordinal < 1 || ordinal > SEQUENCE_SIZE) {
    throw new Error(`Ordinal out of range: ${ordinal}. The sequence runs 1 to ${SEQUENCE_SIZE}.`);
  }

  const zeroBased = ordinal - 1;
  const digits = (zeroBased % BLOCK_SIZE) + 1;
  let blockIndex = Math.floor(zeroBased / BLOCK_SIZE);

  const letters: string[] = [];
  for (let i = 0; i < 3; i += 1) {
    letters.unshift(ALPHABET[blockIndex % ALPHABET.length]);
    blockIndex = Math.floor(blockIndex / ALPHABET.length);
  }

  return `${letters.join('')}${String(digits).padStart(3, '0')}`;
}

/**
 * True when the plate contains U, V or Z — meaning it could not have been
 * issued before the late-2023 activation, however early its ordinal looks.
 */
export function containsPostActivationLetter(plate: string): boolean {
  return [...blockOf(plate)].some((letter) => POST_ACTIVATION_LETTERS.includes(letter));
}

// ---------------------------------------------------------------------------
// Issuance era estimation
// ---------------------------------------------------------------------------

/*
 * An observed position of the sequence at a point in time.
 *
 * Anchored on the BLOCK rather than a specific plate. What actually gets
 * confirmed in the wild is "the sequence was in this block around then" — the
 * exact digits are rarely recorded, and pretending to them would be false
 * precision. The block midpoint is used as the representative ordinal, which
 * bounds the error at +/- 499 plates (about two days at the observed rate).
 *
 * Ordered oldest to newest. Adding an anchor is a one-line change and
 * automatically tightens every estimate that falls near it, because the
 * estimator brackets rather than assuming one long span.
 *
 * Only first-hand observations belong here.
 */
export type Anchor = {
  /** Three-letter block observed to be current. */
  block: string;
  /** Month of the observation, 'YYYY-MM'. Anchors are never finer than a month. */
  observed: string;
  note: string;
};

export const ANCHORS: readonly Anchor[] = [
  {
    block: 'KPZ',
    observed: ACTIVATION_MONTH,
    note: 'KPZ 451 seen, with the KPV series also in circulation — the activation itself',
  },
  {
    block: 'LAX',
    observed: '2026-09',
    note: 'LAX block current; the digits were not recorded',
  },
] as const;

/** Half-width of an anchor's ordinal uncertainty, from using the block midpoint. */
export const ANCHOR_UNCERTAINTY = Math.floor(BLOCK_SIZE / 2);

function anchorOrdinal(anchor: Anchor): number {
  const base = blockBase(anchor.block, ALPHABET);
  if (base === null) throw new Error(`Anchor block is not a valid Vermont block: ${anchor.block}`);
  return base + ANCHOR_UNCERTAINTY + 1;
}

/** Last ordinal inside an anchor's block. */
function anchorHigh(anchor: Anchor): number {
  return anchorOrdinal(anchor) - ANCHOR_UNCERTAINTY - 1 + BLOCK_SIZE;
}

/*
 * Where the sequence had reached when U, V and Z were switched on.
 *
 * The oldest anchor is the activation itself, and it was observed partway
 * through its two-letter prefix (both KPV and KPZ were in circulation), so the
 * prefix as a whole is the activation zone. Anything at or after this point may
 * legitimately contain the new letters; anything before it may not.
 *
 * This, not the anchor's own ordinal, is the line a contradiction is measured
 * against — otherwise the anchor plate itself reads as contradictory, since a
 * block midpoint sits above roughly half the plates in its own block.
 */
function activationZoneStart(): number {
  const prefix = ANCHORS[0].block.slice(0, 2);
  const base = blockBase(`${prefix}A`, ALPHABET);
  if (base === null) throw new Error(`Anchor prefix is not valid: ${prefix}`);
  return base + 1;
}

function monthToMs(month: string): number {
  const [year, m] = month.split('-').map(Number);
  // Mid-month, because a month is the finest resolution any anchor has.
  return Date.UTC(year, m - 1, 15);
}

function msToMonth(ms: number): string {
  const date = new Date(ms);
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;
}

/** Plates per day between two anchors. */
function rateBetween(older: Anchor, newer: Anchor): number {
  const plates = anchorOrdinal(newer) - anchorOrdinal(older);
  const days = (monthToMs(newer.observed) - monthToMs(older.observed)) / MS_PER_DAY;
  return plates / days;
}

/** The issuance rate implied by the newest pair of anchors, in plates per day. */
export function currentRate(): number {
  return rateBetween(ANCHORS[ANCHORS.length - 2], ANCHORS[ANCHORS.length - 1]);
}

/*
 * How many plates had been issued in total when U, V and Z were switched on.
 *
 * The activation happened partway through the first anchor's two-letter prefix,
 * so the legacy ordinal at the start of that prefix is the closest available
 * figure. It runs low by at most one prefix — around 21,000 plates, or roughly
 * 100 days — which is comfortably inside the uncertainty band that any estimate
 * relying on this value already carries.
 *
 * This is the bridge between the two ordinal spaces: everything after the
 * activation is counted in modern ordinals, everything before it in legacy ones.
 */
function legacyOrdinalAtActivation(): number | null {
  const prefix = ANCHORS[0].block.slice(0, 2);
  const base = blockBase(`${prefix}A`, LEGACY_ALPHABET);
  return base === null ? null : base + 1;
}

export type EraConfidence =
  /** Between two anchors. The only case with observations on both sides. */
  | 'interpolated'
  /** Past the newest anchor, projected forward at the observed rate. */
  | 'projected'
  /** Before the oldest anchor. Extrapolated backwards; treat as a guess. */
  | 'speculative'
  /** Ordinal says pre-activation, letters say post-activation. Contradiction. */
  | 'contradictory';

export type IssuanceEra = {
  /** 'YYYY-MM'. Never a specific date — the model does not support one. */
  earliest: string;
  latest: string;
  /** Human phrasing of the range, e.g. 'roughly mid-2025 to late 2025'. */
  label: string;
  confidence: EraConfidence;
  /** Always populated. Always shown next to the estimate. */
  caveat: string;
};

const SEASONS = ['early', 'early', 'early', 'early', 'mid', 'mid', 'mid', 'mid', 'late', 'late', 'late', 'late'];

function seasonOf(month: string): string {
  return `${SEASONS[Number(month.split('-')[1]) - 1]} ${month.split('-')[0]}`;
}

/** '2023-11' -> 'late 2023'. For anything user-facing; never show the raw month. */
export function describeMonth(month: string): string {
  return seasonOf(month);
}

function monthSpan(earliest: string, latest: string): number {
  const [ey, em] = earliest.split('-').map(Number);
  const [ly, lm] = latest.split('-').map(Number);
  return (ly - ey) * 12 + (lm - em);
}

/*
 * Phrase the range. Seasons ('mid-2025') read naturally over a couple of years
 * but become absurd across decades, so wide ranges drop to bare years.
 */
function labelFor(earliest: string, latest: string): string {
  if (earliest === latest) return `roughly ${seasonOf(earliest)}`;

  if (monthSpan(earliest, latest) > 24) {
    const from = earliest.split('-')[0];
    const to = latest.split('-')[0];
    return from === to ? `roughly ${from}` : `somewhere between ${from} and ${to}`;
  }

  const from = seasonOf(earliest);
  const to = seasonOf(latest);
  if (from === to) return `roughly ${from}`;

  // Same year on both ends reads better without repeating it.
  const [fromSeason, fromYear] = from.split(' ');
  const [toSeason, toYear] = to.split(' ');
  if (fromYear === toYear) return `roughly ${fromSeason} to ${toSeason} ${toYear}`;

  return `roughly ${from} to ${to}`;
}

/*
 * Estimate when a plate was issued.
 *
 * This is interpolation between a handful of first-hand observations, not data
 * from the DMV. It returns a range and a caveat, never a date, and the
 * confidence field says how much of a guess it is. Four regimes:
 *
 *   contradictory  The ordinal lands before the activation but the plate
 *                  contains U, V or Z, which did not exist then. The ordinal is
 *                  meaningless for this plate; all that can be said is "after
 *                  the activation". This is the case the whole two-ordinal
 *                  design exists to catch.
 *   speculative    Before the oldest anchor. Extrapolated backwards in legacy
 *                  ordinal space, because modern ordinals count blocks that
 *                  were skipped at the time. Still unreliable: the historical
 *                  issuance rate is unknown and certainly was not constant.
 *   interpolated   Between two anchors. Trustworthy to within a few months.
 *   projected      Past the newest anchor, at the most recently observed rate.
 */
export function estimateIssuanceEra(plate: string, now: Date = new Date()): IssuanceEra {
  assertValid(plate);

  const ordinal = toOrdinal(plate);
  const newest = ANCHORS[ANCHORS.length - 1];
  const activation = activationZoneStart();

  if (ordinal < activation && containsPostActivationLetter(plate)) {
    return clampToSeries({
      earliest: ACTIVATION_MONTH,
      latest: msToMonth(now.getTime()),
      confidence: 'contradictory',
      caveat:
        `This plate contains ${[...blockOf(plate)].filter((l) => POST_ACTIVATION_LETTERS.includes(l)).join(' and ')}, ` +
        `which Vermont did not issue until ${seasonOf(ACTIVATION_MONTH)}. Its sequence position looks early, but that ` +
        'position was passed decades ago, so the ordinal says nothing about when this plate was made. All that can be ' +
        'said is that it came after the activation.',
    });
  }

  if (ordinal < activation) {
    return clampToSeries(estimateBackwards(ordinal, plate));
  }

  if (ordinal > anchorHigh(newest)) {
    const rate = currentRate();
    const days = Math.max(0, (ordinal - anchorOrdinal(newest)) / rate);
    const centre = monthToMs(newest.observed) + days * MS_PER_DAY;
    // Three months of baseline slack, widening by a month for every year out.
    const slack = (90 + (days / 365) * 30) * MS_PER_DAY;

    return clampToSeries({
      earliest: msToMonth(centre - slack),
      latest: msToMonth(centre + slack),
      confidence: 'projected',
      caveat:
        `Past the newest confirmed sighting (the ${newest.block} block, ${seasonOf(newest.observed)}), so this is the ` +
        `observed rate of about ${Math.round(rate)} plates a day carried forward. The further past the last anchor, ` +
        'the softer the estimate.',
    });
  }

  // Between anchors: find the bracketing pair and interpolate across it.
  let older = ANCHORS[0];
  let newer = ANCHORS[ANCHORS.length - 1];
  for (let i = 0; i < ANCHORS.length - 1; i += 1) {
    if (ordinal >= anchorOrdinal(ANCHORS[i]) && ordinal <= anchorOrdinal(ANCHORS[i + 1])) {
      older = ANCHORS[i];
      newer = ANCHORS[i + 1];
      break;
    }
  }

  const rate = rateBetween(older, newer);
  const days = (ordinal - anchorOrdinal(older)) / rate;
  const centre = monthToMs(older.observed) + days * MS_PER_DAY;
  const slack = 90 * MS_PER_DAY;

  return clampToSeries({
    earliest: msToMonth(centre - slack),
    latest: msToMonth(centre + slack),
    confidence: 'interpolated',
    caveat:
      `Interpolated between two confirmed sightings, the ${older.block} block in ${seasonOf(older.observed)} and the ` +
      `${newer.block} block in ${seasonOf(newer.observed)}. That assumes a steady rate of about ${Math.round(rate)} ` +
      'plates a day across the gap, which is an assumption, not a record.',
  });
}

function estimateBackwards(ordinal: number, plate: string): Omit<IssuanceEra, 'label'> {
  const legacy = toLegacyOrdinal(plate);
  const atActivation = legacyOrdinalAtActivation();
  const rate = currentRate();
  const oldest = ANCHORS[0];

  /*
   * Fall back to modern ordinals only if the legacy bridge cannot be computed,
   * which would mean an anchor block outside the legacy alphabet. The estimate
   * is much worse in that space; say so rather than hiding it.
   */
  const behind =
    legacy !== null && atActivation !== null
      ? atActivation - legacy
      : anchorOrdinal(oldest) - ordinal;

  const days = behind / rate;
  const centre = monthToMs(oldest.observed) - days * MS_PER_DAY;

  /*
   * A quarter of the extrapolated distance, floored at a year. The pre-2023
   * issuance rate is genuinely unknown, so the band has to grow with how far
   * back the guess reaches.
   */
  const slack = Math.max(365, days * 0.25) * MS_PER_DAY;

  return {
    earliest: msToMonth(centre - slack),
    latest: msToMonth(centre + slack),
    confidence: 'speculative',
    caveat:
      'Extrapolated backwards past the oldest confirmed sighting, using the recent issuance rate as a stand-in for a ' +
      'historical one that was never recorded. Counted in the pre-2023 19-letter sequence, since the modern ordinal ' +
      'includes U, V and Z blocks that were skipped when this plate was issued. Treat the decade as a hint and the ' +
      'year as noise.',
  };
}

/*
 * No plate predates the series, so the range is clamped to its start. This is a
 * hard domain bound rather than a fudge — but a backwards estimate that hits
 * the clamp has demonstrably run past what the model can support, and the
 * caveat says so.
 */
function clampToSeries(era: Omit<IssuanceEra, 'label'>): IssuanceEra {
  const clamped = (month: string) => (month < SERIES_START_MONTH ? SERIES_START_MONTH : month);
  const earliest = clamped(era.earliest);
  const latest = clamped(era.latest);

  const hitFloor = era.earliest < SERIES_START_MONTH;
  const caveat = hitFloor
    ? `${era.caveat} The estimate ran past ${SERIES_START_MONTH.split('-')[0]}, when the three-letter series began, so it has been cut off there.`
    : era.caveat;

  return { ...era, earliest, latest, caveat, label: labelFor(earliest, latest) };
}
