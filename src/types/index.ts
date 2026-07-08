// ============================================================================
// Modern Day Odyssey — Canonical Type Definitions
// Every store, screen, and component imports from here. This is the contract.
// ============================================================================

// ---------------------------------------------------------------------------
// Quests
// ---------------------------------------------------------------------------

export type QuestType =
  | 'main'
  | 'side'
  | 'legacy'
  | 'chaos'
  | 'boss'
  | 'user_created';

// 'common' is retired for location-based quests (regular/legacy/chaos) — it is
// kept only because the separate food-dish tier system (Thai food regions +
// Laos dish tiers) still uses it. See utils/constants.ts `rarityFromXP` for the
// location-quest scale. 'unique' is likewise food-dish-only (see `FoodTier`
// below) — dish-pool quests reuse this field directly since they never render
// through QuestCard/QuestBadge, unlike 'mythic'/'legendary'/'epic'/'rare'.
export type QuestRarity = 'common' | 'rare' | 'epic' | 'legendary' | 'mythic' | 'unique';

/**
 * Food-dish tier — Common/Rare/Unique, the tier system for food-DISH quests
 * (Thailand/Laos's dedicated dish pools, plus Cambodia/Vietnam's Food-category
 * regular quests retrofitted for this one purpose). Separate from `rarity` so
 * retrofitting Cambodia/Vietnam doesn't disturb their location-quest `rarity`
 * (still used by QuestCard's accent color, region XP, etc). Dish-pool quests
 * (is_food:true) mirror this value into `rarity` too, since that field is
 * exclusively theirs and safe to repurpose.
 */
export type FoodTier = 'common' | 'rare' | 'unique';

/** The 8 consolidated category-badge buckets shown as a stamp on quest cards.
 *  Distinct from the 5-bucket `category` field (which drives filters/XP
 *  multipliers/zone tints) — this is purely a display taxonomy. */
export type CardCategory =
  | 'Temple'
  | 'Nature'
  | 'Market'
  | 'Adventure'
  | 'Heritage'
  | 'Culture'
  | 'Museum'
  | 'Food';

export type QuestStatus = 'locked' | 'available' | 'active' | 'completed';

/**
 * Map marker glyph type. The raw JSON uses color strings ('blue', 'purple',
 * 'red') for `map_marker_type`; we normalise those into these semantic kinds
 * on load (see utils/quests normaliser).
 */
export type MarkerType =
  | 'main'
  | 'side'
  | 'legacy'
  | 'chaos'
  | 'character'
  | 'completed'
  | 'boss';

export interface Quest {
  id: string;
  type: QuestType;
  title: string;
  description: string;
  city?: string;
  zone?: string;
  region?: string;
  category: string;
  xp: number;
  /** Chaos quests carry a pre-multiplied value (2x normal, 3x for boss). */
  xp_with_multiplier?: number;
  rarity: QuestRarity;
  is_top_15?: boolean;
  rank?: number | null;
  is_boss_wheel?: boolean;
  /** Chaos draw weight 1-10. */
  weight?: number;
  url?: string | null;
  requires_media: boolean;
  map_marker_type: MarkerType;
  completed: boolean;
  /** Real-world pin location. null = no verified spot yet (shown in the
   *  "More spots (location TBD)" list rather than plotted on the map). */
  coordinates?: Coord | null;

  // Legacy quest fields
  prerequisites?: string[];
  unlock_condition?: string | null;
  seasonal?: boolean;
  season_window?: string | null;

  // Runtime state
  status: QuestStatus;
  completed_at?: string; // ISO timestamp
  archive_entry_id?: string; // links to ArchiveEntry

  // User-created quest provenance
  created_by_user?: boolean;

  // Food Hall — special cross-region food quests
  is_food?: boolean;
  food_category?: string; // e.g. 'Noodles', 'Curry', 'Desserts' (drives the card emoji)
  food_region?: string; // primary Food Hall grouping label (a food region, or 'Nationwide')
  food_regions?: string[]; // every region this dish is available in (multi-region dishes)
  food_country?: string; // which country's Food Hall this dish belongs to ('thailand' | 'laos')
  /** Common/Rare/Unique food-dish tier. Populated for Thailand/Laos dish-pool
   *  quests AND Cambodia/Vietnam's Food-category regular quests (retrofitted
   *  for the Food Hall dice-roll mechanic only) — undefined for everything else. */
  food_tier?: FoodTier;

  // Category badge (location-based quests only — regular/legacy/chaos, not the
  // food-dish pools, which never populate this).
  card_category?: CardCategory;
}

// ---------------------------------------------------------------------------
// Pixel appearance — the customizer model shared by the player and every NPC.
// ---------------------------------------------------------------------------

export type Gender = 'M' | 'F';

export interface CharacterAppearance {
  gender: Gender;
  skin: string; // hex
  hair: string; // HairStyle key (see utils/appearance)
  hairColor: string; // hex
  hat: string; // HatStyle key
  hatColor: string; // hex
  shirt: string; // hex
  pants: string; // hex
  shoes: string; // hex
}

/** A pixel character placed on a map (player or met character). */
export interface MapSprite {
  id: string;
  isPlayer?: boolean;
  appearance?: CharacterAppearance;
  photoUri?: string; // fallback when no custom appearance (pixelised photo)
  label?: string;
}

// ---------------------------------------------------------------------------
// Character Codex
// ---------------------------------------------------------------------------

export interface Character {
  id: string;
  name: string;
  nickname?: string;
  region: string;
  city?: string;
  zone?: string;
  custom_location?: string;
  date_met: string; // ISO timestamp
  photo_uri: string; // original photo local path ('' when sprite-built)
  pixel_avatar_uri: string; // processed pixel photo local path ('' when sprite-built)
  appearance?: CharacterAppearance; // custom pixel sprite (alternative to a photo)
  one_thing_learned: string;
  note?: string; // extended note
  xp_awarded: number;
  counts_toward_region: boolean;
}

// ---------------------------------------------------------------------------
// Archive
// ---------------------------------------------------------------------------

export interface ArchiveEntry {
  id: string;
  quest_id: string;
  quest_title: string;
  quest_type: QuestType;
  region: string;
  city?: string;
  zone?: string;
  completed_at: string;
  xp_earned: number;
  photo_uris: string[];
  cover_photo_uri?: string;
  video_uris: string[];
  journal_entry?: string;

  // Food Hall — set when the completed quest is a food quest, so its archive
  // card renders the foodie collectible design.
  is_food?: boolean;
  food_category?: string;
  food_tier?: FoodTier;
}

// ---------------------------------------------------------------------------
// Badges
// ---------------------------------------------------------------------------

/**
 * A medal earned for completing a city (>=70% of its quests). Medals are the
 * jigsaw pieces that assemble a region's gym badge.
 */
export interface CityMedal {
  city: string;
  region: string;
  earned: boolean;
  earned_at?: string;
}

export interface RegionBadge {
  region: string;
  unlocked: boolean;
  unlocked_at?: string;
  boss_quest_completed: boolean;
  chaos_roll: number; // 1d20 result, locked on region entry
  chaos_completed: number;
  characters_added: number;
  medals_earned: number; // city medals collected toward the jigsaw
  medals_total: number; // cities in the region
}

export interface CountryBadge {
  country: string; // e.g. 'Thailand'
  code: string; // e.g. 'TH'
  unlocked: boolean;
  unlocked_at?: string;
  completion_pct: number;
}

// ---------------------------------------------------------------------------
// Milestones / achievements
// ---------------------------------------------------------------------------

/** A milestone the player has earned — XP awarded + a unique medal, stored in
 *  the profile. `id` is the stable instance id (e.g. 'quests_50', 'food_x45'). */
export interface MilestoneRecord {
  id: string;
  category: string;
  title: string;
  description: string;
  xp: number;
  glyph: string;
  color: string;
  earned_at: string; // ISO timestamp
}

/** Ordered personal temple rankings. Global = top 10 across Thailand; regional
 *  = top 5 per scope (keyed `region:…`, `city:…`, or `zone:City/Zone`). Each
 *  list is an ordered array of completed temple quest ids. */
export interface TempleRankings {
  global: string[];
  regional: Record<string, string[]>;
}

// ---------------------------------------------------------------------------
// Player + game state
// ---------------------------------------------------------------------------

/** Which game mode is active. Exploration = the original free-roam game.
 *  Odyssey = regions unlock sequentially as you earn XP in each one. */
export type GameMode = 'exploration' | 'odyssey';

/**
 * A country's Food Hall dice roll (Odyssey mode only) — rolled once on first
 * entry, one 1-6 die per food-dish tier. Each value is the number of dishes
 * from that tier the player must complete before the country's food quest
 * counts as done. Persisted forever once rolled; never re-rolled.
 */
export interface FoodHallRoll {
  common: number;
  rare: number;
  unique: number;
  rolledAt: string; // ISO timestamp
}

export interface PlayerState {
  name: string;
  level: number;
  xp_total: number;
  xp_to_next: number;
  streak_days: number;
  last_activity_date: string;
  prestige_countries: string[]; // e.g. ['TH']
  appearance?: CharacterAppearance; // customizable pixel avatar
}

export interface RegionEntry {
  region: string;
  entered_at: string;
  boss_quest_id: string;
  chaos_requirement: number; // 1d20 roll result
  boss_completed: boolean;
}

/** A single XP gain event, kept for the activity feed / debugging. */
export interface XPEvent {
  amount: number;
  source: string;
  at: string; // ISO timestamp
  new_total: number;
}

export interface LevelUpResult {
  leveled_up: boolean;
  new_level: number;
  title: string;
  previous_level: number;
}

// ---------------------------------------------------------------------------
// Level definitions
// ---------------------------------------------------------------------------

export interface LevelDef {
  level: number;
  title: string;
  threshold: number; // cumulative XP required to reach this level
}

// ---------------------------------------------------------------------------
// Region / city static map metadata (overworld structure)
// ---------------------------------------------------------------------------

/** A country on the world map — the top of the geography hierarchy. Each
 *  country owns a set of RegionMeta (its region overworld). New countries slot
 *  in by adding a CountryMeta with `regions` populated; `available: false`
 *  renders a "coming soon" tile with no data behind it. */
export interface CountryMeta {
  id: string;
  name: string; // e.g. 'Thailand'
  code: string; // ISO-ish code, e.g. 'TH'
  flag: string; // emoji flag, e.g. '🇹🇭'
  available: boolean; // has data + is enterable, vs. "coming soon"
  accent: string; // hex accent colour
  /** Layout box on the world map (0-100 percentage coordinate space). */
  layout: { x: number; y: number; w: number; h: number };
  /** The country's region overworld. Empty for not-yet-built countries. */
  regions: RegionMeta[];
}

export interface RegionMeta {
  id: string;
  name: string; // e.g. 'Northern Thailand'
  region: string; // canonical region key matching quest.region
  active: boolean; // MVP-active vs locked
  cities: string[]; // city names belonging to this region
  /** Layout box on the region map (0-100 percentage coordinate space). */
  layout: { x: number; y: number; w: number; h: number };
  accent: string; // hex accent colour
  /** Override tile border colour on the region map — marks non-region tiles
   *  (Food Hall, Legendary Quests hall) so they read as special places. */
  outline?: string;
}

/** A real-world geographic coordinate (decimal degrees). */
export interface Coord {
  lat: number;
  lng: number;
}

export interface CityMeta {
  id: string;
  name: string;
  region: string;
  zones: string[];
  total_quests: number;
  /** Zone layout boxes on the 800x600 city map (absolute px). */
  zoneLayout: Record<string, { x: number; y: number; w: number; h: number }>;
  /** City centre, used to place the city as a marker on the region "More" map. */
  base_coordinates?: Coord;
}

// ---------------------------------------------------------------------------
// Navigation param lists (React Navigation typed routes)
// ---------------------------------------------------------------------------

export type RootStackParamList = {
  Onboarding: undefined;
  MainTabs: undefined;
  QuestDetail: { questId: string };
  QuestLog:
    | { addMode?: boolean; inventoryType?: 'regular' | 'chaos'; region?: string; city?: string; zone?: string }
    | undefined;
  BossWheel: { region: string };
  ChaosRandomizer: { region: string };
  AddCharacter: { region?: string; city?: string; zone?: string } | undefined;
  CustomizePlayer: undefined;
  CharacterDetail: { characterId: string };
  ArchiveEntry: { entryId: string };
  CreateQuest: { region?: string; city?: string; zone?: string } | undefined;
  CreatePlace: { region?: string } | undefined;
  Archive: undefined;
  Codex: undefined;
};

export type MainTabParamList = {
  Map: undefined;
  Today: undefined;
  TravelerDex: undefined;
};

// ---------------------------------------------------------------------------
// Media draft used by completion / creation flows before persistence
// ---------------------------------------------------------------------------

export interface MediaDraft {
  photo_uris: string[];
  cover_photo_uri?: string;
  video_uris: string[];
  journal_entry: string;
}
