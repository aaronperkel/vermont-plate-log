/*
 * Three-letter combinations worth pointing at from a passenger seat.
 *
 * A curated map rather than detection logic. Cleverness here would produce a
 * stream of false positives (every third plate "spells" something if you squint)
 * and would still miss the ones that actually matter locally. Adding an entry is
 * one line; that is the intended way to grow this.
 *
 * Every key must be three letters drawn from the 22 Vermont issues, which rules
 * out a lot of the obvious candidates — LOL, API, JFK, SFO, BOS, ORD, FYI, IDK,
 * GIT and ZIP all contain a letter that has never appeared on a Vermont plate.
 * A test in notable.test.ts enforces this against ALPHABET, because a typo here
 * produces an entry that can never be matched by anything.
 *
 * Three combinations that feel like obvious inclusions are absent for exactly
 * that reason and should not be re-added: SQL (Q), API (I) and LOL (O). They
 * are not oversights and they are not "not yet found" — Vermont has no way to
 * stamp them.
 */

export type NotableCategory = 'airport' | 'tech' | 'slang' | 'initials' | 'other';

export type Notable = {
  /** Short gloss — what you would say out loud on spotting it. */
  label: string;
  category: NotableCategory;
  /*
   * States run a blocklist against sequential issuance, so some combinations
   * are never stamped at all and cannot be found however long you look. Those
   * are tracked as theoretical rather than sitting in the collection forever as
   * "not yet found".
   *
   * Vermont does not publish its list, so these are informed guesses. If one
   * turns up in the wild, delete the flag — that is a genuinely notable find.
   */
  theoretical?: boolean;
};

export const NOTABLE: Record<string, Notable> = {
  // ── Airports ──────────────────────────────────────────────────────────────
  // Vermont and the surrounding region first: these are the ones you might
  // actually have a reason to care about.
  BTV: { label: 'Burlington', category: 'airport' },
  MPV: { label: 'Montpelier', category: 'airport' },
  RUT: { label: 'Rutland', category: 'airport' },
  YUL: { label: 'Montréal', category: 'airport' },
  ALB: { label: 'Albany', category: 'airport' },
  PWM: { label: 'Portland, Maine', category: 'airport' },
  MHT: { label: 'Manchester', category: 'airport' },
  SYR: { label: 'Syracuse', category: 'airport' },
  LAX: { label: 'Los Angeles', category: 'airport' },
  ATL: { label: 'Atlanta', category: 'airport' },
  DCA: { label: 'Washington National', category: 'airport' },
  DEN: { label: 'Denver', category: 'airport' },
  LAS: { label: 'Las Vegas', category: 'airport' },
  PHL: { label: 'Philadelphia', category: 'airport' },
  SEA: { label: 'Seattle', category: 'airport' },
  PDX: { label: 'Portland, Oregon', category: 'airport' },
  LGA: { label: 'LaGuardia', category: 'airport' },
  EWR: { label: 'Newark', category: 'airport' },
  MSP: { label: 'Minneapolis', category: 'airport' },
  HNL: { label: 'Honolulu', category: 'airport' },
  YYZ: { label: 'Toronto', category: 'airport' },
  CDG: { label: 'Paris', category: 'airport' },

  // ── Tech ──────────────────────────────────────────────────────────────────
  GPT: { label: 'The chatbot', category: 'tech' },
  LLM: { label: 'Large language model', category: 'tech' },
  RAG: { label: 'Retrieval-augmented generation', category: 'tech' },
  AWS: { label: "Amazon's cloud", category: 'tech' },
  FTP: { label: 'File transfer protocol', category: 'tech' },
  CSS: { label: 'Stylesheets', category: 'tech' },
  SVG: { label: 'Vector graphics', category: 'tech' },
  PNG: { label: 'Image format', category: 'tech' },
  SSH: { label: 'Secure shell', category: 'tech' },
  DNS: { label: 'Domain name system', category: 'tech' },
  VPN: { label: 'Virtual private network', category: 'tech' },
  CDN: { label: 'Content delivery network', category: 'tech' },
  TCP: { label: 'The protocol underneath everything', category: 'tech' },
  CPU: { label: 'Processor', category: 'tech' },
  GPU: { label: 'Graphics card', category: 'tech' },
  SSD: { label: 'Solid-state drive', category: 'tech' },
  USB: { label: 'The cable that is always upside down', category: 'tech' },
  RAM: { label: 'Memory', category: 'tech' },
  LED: { label: 'Light-emitting diode', category: 'tech' },
  SDK: { label: 'Software development kit', category: 'tech' },
  NPM: { label: 'Package manager', category: 'tech' },
  ENV: { label: 'Environment file', category: 'tech' },
  PWA: { label: 'Progressive web app — this app, in fact', category: 'tech' },

  // ── Slang ─────────────────────────────────────────────────────────────────
  SMH: { label: 'Shaking my head', category: 'slang' },
  TBH: { label: 'To be honest', category: 'slang' },
  NGL: { label: 'Not gonna lie', category: 'slang' },
  BRB: { label: 'Be right back', category: 'slang' },
  AFK: { label: 'Away from keyboard', category: 'slang' },
  BTW: { label: 'By the way', category: 'slang' },
  FTW: { label: 'For the win', category: 'slang' },
  LMK: { label: 'Let me know', category: 'slang' },
  THX: { label: 'Thanks', category: 'slang' },
  SUS: { label: 'Suspicious', category: 'slang' },
  MEH: { label: 'Unimpressed', category: 'slang' },
  NAH: { label: 'No thank you', category: 'slang' },
  WTF: { label: 'What the…', category: 'slang', theoretical: true },
  KYS: { label: 'Unrepeatable', category: 'slang', theoretical: true },
  FML: { label: 'Also unrepeatable', category: 'slang', theoretical: true },
  ASS: { label: 'Blocked in every state that has a list', category: 'slang', theoretical: true },
  SEX: { label: 'Likewise', category: 'slang', theoretical: true },

  // ── Initials ──────────────────────────────────────────────────────────────
  UVM: { label: 'University of Vermont', category: 'initials' },
  NEK: { label: 'Northeast Kingdom', category: 'initials' },
  GMC: { label: 'Green Mountain Club', category: 'initials' },
  VPR: { label: 'Vermont Public Radio', category: 'initials' },
  DMV: { label: 'Where the plate came from', category: 'initials' },
  NPR: { label: 'National Public Radio', category: 'initials' },
  BBC: { label: 'British Broadcasting Corporation', category: 'initials' },
  CNN: { label: 'Cable News Network', category: 'initials' },
  MTV: { label: 'Music Television', category: 'initials' },
  NBA: { label: 'Basketball', category: 'initials' },
  NFL: { label: 'Football', category: 'initials' },
  NHL: { label: 'Hockey', category: 'initials' },
  MLB: { label: 'Baseball', category: 'initials' },
  PGA: { label: 'Golf', category: 'initials' },
  NSA: { label: 'National Security Agency', category: 'initials' },
  EPA: { label: 'Environmental Protection Agency', category: 'initials' },
  FDA: { label: 'Food and Drug Administration', category: 'initials' },
  UPS: { label: 'The brown truck', category: 'initials' },
  VHS: { label: 'Videotape', category: 'initials' },
  DVD: { label: 'The one after videotape', category: 'initials' },
  USA: { label: 'The country', category: 'initials' },

  // ── Other words ───────────────────────────────────────────────────────────
  SAP: { label: 'What the maples give up in March', category: 'other' },
  MUD: { label: 'Mud season', category: 'other' },
  ELK: { label: 'Large deer', category: 'other' },
  EMU: { label: 'Large bird', category: 'other' },
  YAK: { label: 'Large cow', category: 'other' },
  AXE: { label: 'Axe', category: 'other' },
  FLY: { label: 'Fly', category: 'other' },
  SKY: { label: 'Sky', category: 'other' },
  ZEN: { label: 'Calm', category: 'other' },
  MAX: { label: 'Maximum', category: 'other' },
  CAT: { label: 'Cat', category: 'other' },
  BAT: { label: 'Bat', category: 'other' },
  PUP: { label: 'Puppy', category: 'other' },
  BUG: { label: 'Bug', category: 'other' },
  EGG: { label: 'Egg', category: 'other' },
  ELF: { label: 'Elf', category: 'other' },
  APE: { label: 'Ape', category: 'other' },
  ACE: { label: 'Ace', category: 'other' },
  ART: { label: 'Art', category: 'other' },
  KEY: { label: 'Key', category: 'other' },
  SPY: { label: 'Spy', category: 'other' },
  VAN: { label: 'Van', category: 'other' },
  TAX: { label: 'Tax', category: 'other' },
  FAX: { label: 'Fax', category: 'other' },
  WAX: { label: 'Wax', category: 'other' },
  HUG: { label: 'Hug', category: 'other' },
};

/** The notable entry for a plate's letters, or null. Accepts a full plate or a block. */
export function notableFor(plateOrBlock: string): Notable | null {
  return NOTABLE[plateOrBlock.slice(0, 3)] ?? null;
}

/** True when the plate's letters spell something curated. */
export function isNotable(plateOrBlock: string): boolean {
  return notableFor(plateOrBlock) !== null;
}

export const NOTABLE_CATEGORIES: readonly NotableCategory[] = [
  'airport',
  'tech',
  'slang',
  'initials',
  'other',
] as const;

/** Sentence-case category names for the interface. */
export const CATEGORY_LABELS: Record<NotableCategory, string> = {
  airport: 'Airport',
  tech: 'Tech',
  slang: 'Slang',
  initials: 'Initials',
  other: 'Word',
};
