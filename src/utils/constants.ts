// ============================================================================
// Modern Day Odyssey — Design system + game configuration constants
// ============================================================================

import type { CardCategory, FoodTier, LevelDef, MarkerType, QuestRarity, QuestType } from '../types';

// ---------------------------------------------------------------------------
// Colour palette
// ---------------------------------------------------------------------------

export const COLORS = {
  // Backgrounds
  BG_DARK: '#0f0f1a',
  BG_SURFACE: '#1a1a2e',
  BG_CARD: '#16213e',
  BG_BORDER: '#0f3460',

  // Accents
  GOLD: '#FFD700',
  BLUE: '#2196F3',
  PURPLE: '#9C27B0',
  GREEN: '#4CAF50',
  RED: '#E53935',
  ORANGE: '#FF9800',
  TEAL: '#00BCD4',
  LIME: '#cdf27e', // pastel lime — header date / clock accents

  // Text
  TEXT_PRIMARY: '#e8e8f0',
  TEXT_SECONDARY: '#a0a0b8',
  TEXT_DISABLED: '#505068',

  // Quest type colours
  QUEST_MAIN: '#FFD700',
  QUEST_SIDE: '#2196F3',
  QUEST_LEGACY: '#9C27B0',
  QUEST_CHAOS: '#E53935',
  QUEST_BOSS: '#FF3300',
  QUEST_CHARACTER: '#00BCD4',
  QUEST_USER: '#4CAF50',
  // Mythic — generic palette accent for the tier above legendary (RARITY_COLOR
  // owns the actual card color). NOTE: src/data/offbeat_seasia_destinations.json
  // is still NOT wired into the quest pipeline — kept as possible future content.
  MYTHIC: '#89CFF0',

  // Misc
  BLACK: '#000000',
  WHITE: '#ffffff',
  SHADOW: '#000000',
  OVERLAY: 'rgba(8,8,16,0.88)',
} as const;

export const QUEST_TYPE_COLOR: Record<QuestType, string> = {
  main: COLORS.QUEST_MAIN,
  side: COLORS.QUEST_SIDE,
  legacy: COLORS.QUEST_LEGACY,
  chaos: COLORS.QUEST_CHAOS,
  boss: COLORS.QUEST_BOSS,
  user_created: COLORS.QUEST_USER,
};

// Location-based quests (regular/legacy/chaos) use rare/epic/legendary/mythic;
// 'common'/'unique' only ever appear via the separate food-dish tier system
// (dish-pool quests reuse this field directly — see FOOD_TIER_XP/PALETTE below
// for the actual food-hall color/XP source of truth).
export const RARITY_COLOR: Record<QuestRarity, string> = {
  common: COLORS.TEXT_SECONDARY,
  rare: COLORS.BLUE,
  epic: COLORS.GOLD,
  legendary: '#4B2E7A', // dark purple
  mythic: COLORS.WHITE,
  unique: COLORS.GOLD,
};

export const RARITY_LABEL: Record<QuestRarity, string> = {
  common: 'COMMON',
  rare: 'RARE',
  epic: 'EPIC',
  legendary: 'LEGENDARY',
  mythic: 'MYTHIC',
  unique: 'UNIQUE',
};

/**
 * Rarity for location-based quests (regular/legacy/chaos), computed from xp —
 * replaces the old hand-authored common/rare/epic/legendary tiers. Applied
 * retroactively to every quest at load time (see `baseNormalise` in quests.ts),
 * not just new ones. Does NOT apply to the food-dish pools (Thai food regions,
 * Laos dish tiers), which keep their own independent xp→rarity scheme.
 */
export function rarityFromXP(xp: number): QuestRarity {
  if (xp > 10000) return 'mythic';
  if (xp > 5000) return 'legendary';
  if (xp >= 1000) return 'epic';
  return 'rare';
}

// ---------------------------------------------------------------------------
// Food-dish tier — Common/Rare/Unique. The source of truth for food-hall
// colors + per-dish XP (replaces the old Must-Try/Nice-to-Try/If-You-Have-
// Time/One-of-One labels and the xp-threshold Gengar-purple/baby-blue split).
// ---------------------------------------------------------------------------

export const FOOD_TIER_XP: Record<FoodTier, number> = {
  common: 500,
  rare: 1000,
  unique: 2000,
};

export const FOOD_TIER_LABEL: Record<FoodTier, string> = {
  common: 'COMMON',
  rare: 'RARE',
  unique: 'UNIQUE',
};

/** gray / blue / gold, per spec. */
export const FOOD_TIER_COLOR: Record<FoodTier, string> = {
  common: COLORS.TEXT_SECONDARY,
  rare: COLORS.BLUE,
  unique: COLORS.GOLD,
};

// ---------------------------------------------------------------------------
// Map marker glyphs
// ---------------------------------------------------------------------------

// ASCII-only marker glyphs (no emoji) so they render crisply in the pixel font.
export const MARKER_GLYPH: Record<MarkerType, string> = {
  main: '!',
  side: '?',
  legacy: '*',
  chaos: '%',
  character: '+',
  completed: 'x',
  boss: '#',
};

export const MARKER_COLOR: Record<MarkerType, string> = {
  main: COLORS.GOLD,
  side: COLORS.BLUE,
  legacy: COLORS.PURPLE,
  chaos: COLORS.RED,
  character: COLORS.TEAL,
  completed: COLORS.TEXT_DISABLED,
  boss: COLORS.QUEST_BOSS,
};

// ---------------------------------------------------------------------------
// Typography
// ---------------------------------------------------------------------------

/** Font family name registered by @expo-google-fonts/press-start-2p. */
export const FONT = {
  pixel: 'PressStart2P_400Regular',
  // Body text uses the platform default (best legibility for long copy).
  body: undefined as string | undefined,
} as const;

// ---------------------------------------------------------------------------
// Sizing / spacing — pixel-art rules (no rounded corners, stepped shadows)
// ---------------------------------------------------------------------------

export const SIZES = {
  borderWidth: 2,
  borderRadius: 0,
  cardAccentWidth: 4,
  buttonShadow: 3,
  pixelStep: 3,
  spacingXs: 4,
  spacingSm: 8,
  spacingMd: 16,
  spacingLg: 24,
  spacingXl: 32,
  // Standard pixel font sizes
  fontXs: 8,
  fontSm: 10,
  fontMd: 12,
  fontLg: 16,
  fontXl: 22,
  fontXxl: 32,
  tabBarHeight: 64,
  markerSize: 28,
} as const;

// ---------------------------------------------------------------------------
// XP level thresholds + titles
// ---------------------------------------------------------------------------

export const LEVELS: LevelDef[] = [
  { level: 1, title: 'Wanderer', threshold: 0 },
  { level: 2, title: 'Drifter', threshold: 500 },
  { level: 3, title: 'Traveler', threshold: 1200 },
  { level: 4, title: 'Seeker', threshold: 2500 },
  { level: 5, title: 'Explorer', threshold: 4500 },
  { level: 6, title: 'Pilgrim', threshold: 7500 },
  { level: 7, title: 'Pathfinder', threshold: 12000 },
  { level: 8, title: 'Odyssey Maker', threshold: 18000 },
  { level: 9, title: 'Mythmaker', threshold: 28000 },
  { level: 10, title: 'Legend', threshold: 50000 },
];

export const MAX_LEVEL = LEVELS[LEVELS.length - 1].level;

// ---------------------------------------------------------------------------
// Inventory limits + game rules
// ---------------------------------------------------------------------------

export const INVENTORY = {
  regularSlots: 10, // side + legacy share these
  chaosSlots: 5,
} as const;

export const CHAOS_MULTIPLIER = 2;
export const BOSS_MULTIPLIER = 3;

// Badge thresholds — per PRD badge logic (zone/city/country all 70%).
export const BADGE_THRESHOLD = {
  zone: 0.7,
  city: 0.7,
  country: 0.7,
} as const;

// Region badge composite requirements
export const REGION_REQUIRED_CHARACTERS = 5;

// Character XP rules
export const CHARACTER_BASE_XP = 500;
export const CHARACTER_NOTE_BONUS_XP = 100;
export const CHARACTER_NOTE_BONUS_WORDS = 50;

// User-created quest XP rules
export const USER_QUEST_XP = {
  base: 50,
  perPhoto: 25,
  maxPhotos: 5,
  perVideo: 75,
  maxVideos: 3,
  journalFlat: 50,
  per10Words: 10,
  wordCap: 500,
  hardCap: 5000,
  categoryMultiplier: {
    Spiritual: 1.5,
    Adventure: 1.3,
    Culture: 1.1,
  } as Record<string, number>,
  defaultMultiplier: 1.0,
} as const;

// ---------------------------------------------------------------------------
// Quest categories — condensed to FIVE buckets. The source data uses 34 raw
// category names across regular/legacy/chaos quests; we normalise each one into
// a single bucket at load time so the whole app (display, filtering, zone
// category-spread, user-quest multipliers) speaks the same five-category vocab.
// ---------------------------------------------------------------------------

export const CATEGORY_BUCKETS = ['Adventure', 'Culture', 'Spiritual', 'Food', 'Social'] as const;
export type CategoryBucket = (typeof CATEGORY_BUCKETS)[number];

const CATEGORY_MAP: Record<string, CategoryBucket> = {
  // Adventure — outdoors, physical, thrill
  Adventure: 'Adventure', Nature: 'Adventure', Sport: 'Adventure', Trekking: 'Adventure',
  Diving: 'Adventure', Beach: 'Adventure', Wildlife: 'Adventure', Views: 'Adventure', Body: 'Adventure',
  Trek: 'Adventure', Viewpoint: 'Adventure', Park: 'Adventure', Scenic: 'Adventure',
  // Culture — places, heritage, local life, art, markets
  Cultural: 'Culture', Culture: 'Culture', Historical: 'Culture', History: 'Culture', Art: 'Culture',
  Market: 'Culture', 'Local Life': 'Culture', Unique: 'Culture', Conservation: 'Culture', Museum: 'Culture',
  Heritage: 'Culture', Landmark: 'Culture', Festival: 'Culture',
  // Spiritual — temples, meditation, stillness, inner work, wellness
  Spiritual: 'Spiritual', Wellness: 'Spiritual', Presence: 'Spiritual', Discipline: 'Spiritual',
  Time: 'Spiritual', Observation: 'Spiritual', Temple: 'Spiritual', 'Slow Travel': 'Spiritual',
  // Food — eating, cooking
  Food: 'Food',
  // Social — people, connection, generosity, creativity, play, nightlife
  Social: 'Social', Connection: 'Social', Generosity: 'Social', Creation: 'Social', Creative: 'Social',
  Identity: 'Social', Chaos: 'Social', Fun: 'Social', Nightlife: 'Social', Experience: 'Social',
};

/** Normalise any raw category string into one of the five buckets. */
export function toCategory(raw?: string): CategoryBucket {
  if (!raw) return 'Social';
  return CATEGORY_MAP[raw] ?? CATEGORY_MAP[raw.trim()] ?? 'Social';
}

// ---------------------------------------------------------------------------
// Category badge — 8 consolidated buckets shown as a stamp on location-based
// quest cards (temples, markets, nature, activities, culture, food, etc.).
// Independent of CATEGORY_MAP/toCategory above (which drives filters, zone
// tints, and XP multipliers) — this is purely a display taxonomy, derived
// straight from the raw category string before that 5-bucket collapse.
// ---------------------------------------------------------------------------

export const CARD_CATEGORY_BUCKETS: CardCategory[] = [
  'Temple', 'Nature', 'Market', 'Adventure', 'Heritage', 'Culture', 'Museum', 'Food',
];

const CARD_CATEGORY_MAP: Record<string, CardCategory> = {
  // Temple — spiritual/stillness sites (Spiritual folds in, per spec)
  Temple: 'Temple', Spiritual: 'Temple', Wellness: 'Temple',
  // Nature — outdoors, scenery, wildlife (Trek + Viewpoint fold in, per spec)
  Nature: 'Nature', Trek: 'Nature', Trekking: 'Nature', Viewpoint: 'Nature', Park: 'Nature',
  Scenic: 'Nature', Views: 'Nature', Beach: 'Nature', Wildlife: 'Nature', Conservation: 'Nature',
  Diving: 'Nature',
  // Market
  Market: 'Market',
  // Adventure — physical/thrill/nightlife activities
  Adventure: 'Adventure', Sport: 'Adventure', Experience: 'Adventure', Fun: 'Adventure',
  Nightlife: 'Adventure',
  // Heritage — history-flavored sites
  Heritage: 'Heritage', Historical: 'Heritage', History: 'Heritage', Landmark: 'Heritage',
  // Culture — local life, art, general cultural experiences (Slow Travel folds in, per spec)
  Cultural: 'Culture', Culture: 'Culture', 'Slow Travel': 'Culture', Art: 'Culture',
  Festival: 'Culture', Unique: 'Culture', 'Local Life': 'Culture',
  // Museum
  Museum: 'Museum',
  // Food
  Food: 'Food',
};

/** Category badge for a location-based quest's raw category string. Defaults
 *  to 'Culture' for anything outside the mapped vocabulary (e.g. chaos-quest
 *  categories, which never render this badge anyway — see QuestCard). */
export function toCardCategory(raw?: string): CardCategory {
  if (!raw) return 'Culture';
  return CARD_CATEGORY_MAP[raw] ?? CARD_CATEGORY_MAP[raw.trim()] ?? 'Culture';
}

/** One emoji per category badge bucket — the art shown on a quest's collectible
 *  card (see QuestCollectibleCard), same trick the Food Hall uses for dishes. */
const CARD_CATEGORY_EMOJI: Record<CardCategory, string> = {
  Temple: '🛕',
  Nature: '🏞️',
  Market: '🛍️',
  Adventure: '🧗',
  Heritage: '🏛️',
  Culture: '🎭',
  Museum: '🖼️',
  Food: '🍜',
};

export function cardCategoryEmoji(category?: CardCategory): string {
  if (!category) return '⭐';
  return CARD_CATEGORY_EMOJI[category] ?? '⭐';
}

// ---------------------------------------------------------------------------
// Quest collectible card palette — the Food-Hall-style card look for
// location-based quests (used by hall/bucket views like each country's
// Legendary Quests). One palette per rarity tier; 'common'/'unique' are kept
// only for type completeness (they never appear on location-based quests —
// 'unique' is exclusively the food-dish tier's top rank).
// ---------------------------------------------------------------------------

export interface RarityCardPalette {
  bg: string;
  edge: string;
  band: string; // header band
  fg: string; // primary text on bg
  sub: string; // secondary text
}

export const RARITY_CARD_PALETTE: Record<QuestRarity, RarityCardPalette> = {
  common: { bg: COLORS.BG_CARD, edge: COLORS.TEXT_SECONDARY, band: COLORS.BG_SURFACE, fg: COLORS.TEXT_PRIMARY, sub: COLORS.TEXT_SECONDARY },
  rare: { bg: '#16213e', edge: COLORS.BLUE, band: '#0f3460', fg: '#eaf4ff', sub: '#8fb8dd' },
  epic: { bg: '#2b2308', edge: COLORS.GOLD, band: '#4a3b12', fg: '#fff6d9', sub: '#d9bd6a' },
  legendary: { bg: '#1e1230', edge: '#4B2E7A', band: '#150c22', fg: '#f1e6ff', sub: '#b48be0' },
  mythic: { bg: '#f5f5f8', edge: '#ffffff', band: '#e2e2ea', fg: '#141418', sub: '#5a5a66' },
  unique: { bg: '#2b2308', edge: COLORS.GOLD, band: '#4a3b12', fg: '#fff6d9', sub: '#d9bd6a' },
};

/**
 * Designated Boss Wheel quests.
 *
 * NOTE: the provided chaos data contains zero quests flagged `is_boss_wheel`,
 * but the PRD requires exactly 8 boss-wheel options spun on region entry with a
 * 3x multiplier. We therefore designate the 2 legendary + 6 highest-impact epic
 * chaos quests as the boss wheel. The chaos store applies `is_boss_wheel = true`
 * and a 3x multiplier to these on load. This is the single source of truth.
 */
export const BOSS_WHEEL_QUEST_IDS: string[] = [
  'TH_CHS_027', // Hire a Local as Your Guide for a Full Day (legendary)
  'TH_CHS_039', // Do Something Today You've Always Been Afraid To (legendary)
  'TH_CHS_015', // Leave Your Phone in Your Room for a Full Day (epic)
  'TH_CHS_026', // Sleep Somewhere You Didn't Plan To (epic)
  'TH_CHS_034', // Ask a Monk for Advice and Listen Until They're Done (epic)
  'TH_CHS_036', // Do Whatever the First Person You Meet Suggests (epic)
  'TH_CHS_040', // Give Your Day Away — Volunteer for Something (epic)
  'TH_CHS_083', // Do Something Physically Difficult That Scares You (epic)
];

// ---------------------------------------------------------------------------
// Overworld structure — 6 regions
// ---------------------------------------------------------------------------

import type { RegionMeta, CityMeta } from '../types';

export const COUNTRY = { name: 'Thailand', code: 'TH', flag: 'TH' } as const;

// ---------------------------------------------------------------------------
// Collectible quest cards — material tier by XP earned (bronze - rare).
// ---------------------------------------------------------------------------

export type CardTier = 'bronze' | 'silver' | 'gold' | 'platinum' | 'rare';

export const CARD_TIER: Record<
  CardTier,
  { label: string; metal: string; edge: string; sheen: string; text: string }
> = {
  bronze: { label: 'BRONZE', metal: '#7a4a25', edge: '#cd7f32', sheen: '#e09a5a', text: '#1a1208' },
  silver: { label: 'SILVER', metal: '#6e7479', edge: '#c0c6cc', sheen: '#eef1f4', text: '#14181c' },
  gold: { label: 'GOLD', metal: '#9c7a10', edge: '#ffd700', sheen: '#fff1a8', text: '#1c1600' },
  platinum: { label: 'PLATINUM', metal: '#8b8f96', edge: '#e5e4e2', sheen: '#ffffff', text: '#15171a' },
  rare: { label: 'RARE', metal: '#5b1f8f', edge: '#b14aff', sheen: '#e3b3ff', text: '#0f0118' },
};

/** Material tier for a completed quest, by the XP it awarded. */
export function cardTier(xp: number): CardTier {
  if (xp >= 6000) return 'rare';
  if (xp >= 2500) return 'platinum';
  if (xp >= 1000) return 'gold';
  if (xp >= 500) return 'silver';
  return 'bronze';
}

export const REGIONS: RegionMeta[] = [
  {
    id: 'north',
    name: 'Northern Thailand',
    region: 'Northern Thailand',
    active: true,
    cities: ['Chiang Mai', 'Chiang Rai', 'Pai'],
    layout: { x: 30, y: 4, w: 40, h: 22 },
    accent: COLORS.GOLD,
  },
  {
    id: 'central',
    name: 'Central Thailand',
    region: 'Central Thailand',
    active: true,
    cities: ['Bangkok'],
    // Centered in the corridor between the western column (ends x=26) and the
    // Isan/Eastern column (starts x=60).
    layout: { x: 32, y: 28, w: 22, h: 36 },
    accent: COLORS.GOLD,
  },
  {
    id: 'isan',
    name: 'Isan / Northeast',
    region: 'Northeast Thailand',
    active: true,
    cities: ['Ubon Ratchathani', 'Buriram', 'Nong Khai', 'Khon Kaen'],
    layout: { x: 60, y: 26, w: 34, h: 24 },
    accent: COLORS.ORANGE,
  },
  {
    // Repurposed from the former "Gulf Coast" slot — the Gulf islands now live
    // under Southern Thailand (per the merged dataset), so this slot covers the
    // eastern seaboard: Pattaya, Rayong, Chanthaburi, Trat, Koh Chang/Mak/Kood.
    id: 'eastern',
    name: 'Eastern Thailand',
    region: 'Eastern Thailand',
    active: true,
    cities: ['Pattaya & Jomtien', 'Rayong, Ban Phe & Mae Phim', 'Chanthaburi', 'Trat Town', 'Koh Chang', 'Koh Mak', 'Koh Kood', 'Koh Samet'],
    layout: { x: 60, y: 52, w: 34, h: 16 },
    accent: COLORS.TEAL,
  },
  {
    id: 'andaman',
    name: 'Southern Thailand',
    region: 'Southern Thailand',
    active: true,
    cities: ['Krabi & Ao Nang', 'Koh Lanta', 'Koh Lipe', 'Koh Samui', 'Koh Phangan', 'Koh Tao'],
    layout: { x: 26, y: 70, w: 30, h: 26 },
    accent: COLORS.BLUE,
  },
  {
    id: 'western',
    name: 'Western Thailand',
    region: 'Western Thailand',
    active: true,
    cities: ['Kanchanaburi', 'Erawan National Park', 'Sai Yok & River Kwai Corridor', 'Sangkhla Buri', 'Umphang'],
    layout: { x: 4, y: 22, w: 22, h: 18 },
    accent: COLORS.GREEN,
  },
  {
    id: 'bucket',
    name: 'Legendary Quests',
    region: 'Cross-Region',
    active: true,
    cities: [],
    layout: { x: 4, y: 44, w: 22, h: 18 },
    accent: COLORS.PURPLE,
    // Green outline marks it as a hall, not a region.
    outline: COLORS.GREEN,
  },
];

// ---------------------------------------------------------------------------
// Odyssey mode — regions unlock sequentially as you earn XP in each one.
// Four rank tiers gate the four unlocks (after the first, free region).
// ---------------------------------------------------------------------------

export interface OdysseyLevel {
  level: number;
  name: string;
  unlockCost: number; // XP that must accrue in the frontier region to open the next
}

export const ODYSSEY_LEVELS: OdysseyLevel[] = [
  { level: 1, name: 'Tourist', unlockCost: 10_000 },
  { level: 2, name: 'Traveler', unlockCost: 25_000 },
  { level: 3, name: 'Explorer', unlockCost: 50_000 },
  { level: 4, name: 'Nomad', unlockCost: 100_000 },
];

/** Sequential unlock order — the geographic regions only. The Cross-Region
 *  bucket list (and custom places) stay available as cross-cutting views. */
export const ODYSSEY_REGION_ORDER: string[] = REGIONS.filter(
  (r) => r.region !== 'Cross-Region',
).map((r) => r.region);

/** The unlock sequence rotated so `start` is the first region. Lets the player
 *  pick where their Odyssey begins; the chain then wraps around the world. */
export function odysseyOrderFrom(start?: string | null): string[] {
  if (!start) return ODYSSEY_REGION_ORDER;
  const i = ODYSSEY_REGION_ORDER.indexOf(start);
  if (i <= 0) return ODYSSEY_REGION_ORDER;
  return [...ODYSSEY_REGION_ORDER.slice(i), ...ODYSSEY_REGION_ORDER.slice(0, i)];
}

/** Flat XP cost to open EACH new region at the chosen difficulty level (1-4). */
export function odysseyCostForLevel(level: number): number {
  return ODYSSEY_LEVELS[level - 1]?.unlockCost ?? ODYSSEY_LEVELS[0].unlockCost;
}

/** Rank name for the chosen difficulty level (1 = Tourist … 4 = Nomad). */
export function odysseyLevelName(level: number): string {
  return ODYSSEY_LEVELS[level - 1]?.name ?? ODYSSEY_LEVELS[0].name;
}

/** Resolve the display region meta for a raw quest region string. */
export function regionMetaFor(region?: string): RegionMeta | undefined {
  if (!region) return REGIONS.find((r) => r.region === 'Cross-Region');
  return (
    REGIONS.find((r) => r.region === region) ??
    REGIONS.find((r) => r.region === 'Cross-Region')
  );
}

// ---------------------------------------------------------------------------
// City overworld metadata + computed zone layouts (800x600 canvas)
// ---------------------------------------------------------------------------

export const CITY_CANVAS = { width: 800, height: 600 } as const;

/** A city with MORE THAN 8 quests (i.e. >= 9) earns its own zone-map screen.
 *  Smaller cities are grouped under their region's "More" map instead. */
export const CITY_MAP_MIN_QUESTS = 9;

/** In Odyssey mode, the next country stays locked until this many regions of the
 *  previous country are completed (at the chosen level). Generalizes to any
 *  number of countries in their available order. */
export const COUNTRY_UNLOCK_REGIONS = 3;

/** Generate a tidy grid of zone boxes across the city canvas. */
export function gridZoneLayout(
  zones: string[],
  cols: number,
): Record<string, { x: number; y: number; w: number; h: number }> {
  const pad = 24;
  const gap = 18;
  const rows = Math.ceil(zones.length / cols);
  const usableW = CITY_CANVAS.width - pad * 2 - gap * (cols - 1);
  const usableH = CITY_CANVAS.height - pad * 2 - gap * (rows - 1);
  const cellW = usableW / cols;
  const cellH = usableH / rows;
  const out: Record<string, { x: number; y: number; w: number; h: number }> = {};
  zones.forEach((zone, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    out[zone] = {
      x: Math.round(pad + col * (cellW + gap)),
      y: Math.round(pad + row * (cellH + gap)),
      w: Math.round(cellW),
      h: Math.round(cellH),
    };
  });
  return out;
}

const CITY_DEFS: Array<Omit<CityMeta, 'zoneLayout'> & { cols: number }> = [
  {
    id: 'chiang_mai',
    name: 'Chiang Mai',
    region: 'Northern Thailand',
    zones: [
      'Old City',
      'Old City Evenings',
      'Mountain Temples',
      'South Quarter',
      'Warorot & East',
      'Highlands & Waterfalls',
      'Food & Markets',
    ],
    total_quests: 30,
    cols: 3,
  },
  {
    id: 'chiang_rai',
    name: 'Chiang Rai',
    region: 'Northern Thailand',
    zones: [
      'City Center',
      'White Temple Loop',
      'Black House Loop',
      'Golden Triangle',
      'Doi Tung',
      'Doi Mae Salong',
    ],
    total_quests: 29,
    cols: 3,
  },
  {
    id: 'pai',
    name: 'Pai',
    region: 'Northern Thailand',
    zones: [
      'Town Center',
      'North Loop',
      'Canyon & Hot Springs',
      'Waterfalls & Jungle',
      'Doi Kiew Lom Ridge',
    ],
    total_quests: 16,
    cols: 3,
  },
  {
    id: 'bangkok',
    name: 'Bangkok',
    region: 'Central Thailand',
    zones: [
      'Rattanakosin',
      'Chinatown & River',
      'Banglamphu',
      'Silom/Sathorn',
      'Weekend Markets',
      'Grand Palace & Rattanakosin',
      'Riverside & Chao Phraya',
      'Chinatown & Yaowarat',
      'Markets & Nightlife',
      'Culture & Museums',
      'East Bangkok',
    ],
    total_quests: 36,
    cols: 3,
  },
];

export const CITIES: CityMeta[] = CITY_DEFS.map(({ cols, ...rest }) => ({
  ...rest,
  zoneLayout: gridZoneLayout(rest.zones, cols),
}));

/** A pleasant per-category tint used for zone fills on the city map. */
export const CATEGORY_TINT: Record<string, string> = {
  Spiritual: '#3a2e5c',
  Nature: '#1f4a3a',
  Adventure: '#5c3a2e',
  Market: '#4a3a1f',
  Food: '#5c2e3a',
  Art: '#3a1f4a',
  Cultural: '#2e4a5c',
  Culture: '#2e4a5c',
  Historical: '#4a4a2e',
  History: '#4a4a2e',
  Social: '#1f3a4a',
};
