// ============================================================================
// Quest loading + normalisation.
//
// The provided JSON is loaded *exactly as-is* (structure untouched) and mapped
// into the canonical `Quest` shape the app uses at runtime.
// ============================================================================

import regularData from '../data/thailand_regular_quests.json';
import legacyData from '../data/thailand_legacy_quests.json';
import chaosData from '../data/thailand_chaos_quests.json';
import foodData from '../data/thailand_food_quests.json';
import laosRegularData from '../data/laos_regular_quests.json';
import laosFoodData from '../data/laos_food_quests.json';
import cambodiaRegularData from '../data/cambodia_regular_quests.json';
import vietnamRegularData from '../data/vietnam_regular_quests.json';

import type { Coord, FoodTier, MarkerType, Quest, QuestRarity, QuestStatus, QuestType } from '../types';
import { BOSS_WHEEL_QUEST_IDS, BOSS_MULTIPLIER, FOOD_TIER_XP, rarityFromXP, toCardCategory, toCategory } from './constants';
import { guessFoodCategory } from './food';

type RawAny = Record<string, any>;

/** Coerce a raw `{lat,lng}` into a Coord, or null when missing/invalid. */
export function normaliseCoord(raw: any): Coord | null {
  if (!raw || typeof raw !== 'object') return null;
  const lat = Number(raw.lat);
  const lng = Number(raw.lng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return { lat, lng };
}

/** Map raw `map_marker_type` color strings - semantic marker kinds. */
function markerFromRaw(raw: RawAny): MarkerType {
  const t = String(raw.map_marker_type ?? '').toLowerCase();
  if (t === 'blue') return 'side';
  if (t === 'purple') return 'legacy';
  if (t === 'red') return 'chaos';
  if (t === 'gold' || t === 'yellow') return 'main';
  if (t === 'teal') return 'character';
  // Already a semantic kind? pass through known ones.
  if (['main', 'side', 'legacy', 'chaos', 'character', 'completed', 'boss'].includes(t)) {
    return t as MarkerType;
  }
  return 'side';
}

function baseNormalise(raw: RawAny, fallbackType: QuestType): Quest {
  const category = toCategory(raw.category);
  const xp = Number(raw.xp ?? 0);
  return {
    id: String(raw.id),
    type: (raw.type ?? fallbackType) as QuestType,
    title: String(raw.title ?? ''),
    description: String(raw.description ?? ''),
    city: raw.city ?? undefined,
    zone: raw.zone ?? undefined,
    region: raw.region ?? undefined,
    // Condense the 34 raw category names down to the five canonical buckets.
    category,
    // A separate, finer-grained 8-bucket category used only for the card badge
    // stamp — derived from the raw category string, not the 5-bucket collapse.
    card_category: toCardCategory(raw.category),
    // Food quests get a specific food_category (keyword-guessed from the name +
    // description) so the Food Hall's collectible FoodCard shows a fitting emoji
    // instead of the generic bowl — same trick the Laos dish pool uses.
    food_category:
      category === 'Food' ? guessFoodCategory(`${raw.title ?? ''} ${raw.description ?? ''}`) : undefined,
    xp,
    xp_with_multiplier: raw.xp_with_multiplier != null ? Number(raw.xp_with_multiplier) : undefined,
    // Recomputed from xp — replaces the hand-authored tier from source data.
    // Regular/legacy/chaos quests all funnel through here; the food-dish pools
    // (loadFoodQuests/loadLaosFoodQuests) bypass this function entirely and
    // keep their own separate tier system.
    rarity: rarityFromXP(xp),
    is_top_15: raw.is_top_15 ?? undefined,
    rank: raw.rank ?? null,
    is_boss_wheel: raw.is_boss_wheel ?? false,
    weight: raw.weight != null ? Number(raw.weight) : undefined,
    url: raw.url ?? null,
    requires_media: Boolean(raw.requires_media),
    map_marker_type: markerFromRaw(raw),
    completed: false,
    // Accept either `coordinates` (Thailand/Laos) or `coords` (Cambodia's
    // source shape) so any dataset drops in without a rename.
    coordinates: normaliseCoord(raw.coordinates ?? raw.coords),
    prerequisites: raw.prerequisites ?? undefined,
    unlock_condition: raw.unlock_condition ?? null,
    seasonal: raw.seasonal ?? false,
    season_window: raw.season_window ?? null,
    status: 'available',
  };
}

/** Normalise one `{ cities: [{ region, name, quests }] }` regular dataset. The
 *  region lives on the city, so we push it down onto each quest. */
function loadRegularFrom(data: RawAny): Quest[] {
  const out: Quest[] = [];
  for (const city of data.cities ?? []) {
    for (const q of city.quests ?? []) {
      const quest = baseNormalise(q, 'side');
      quest.region = quest.region ?? city.region;
      quest.city = quest.city ?? city.name;
      out.push(quest);
    }
  }
  return out;
}

/** Flat description of a city straight from the regular quest data — its zones,
 *  centre coordinate, and source quest count. Powers the world model's decision
 *  to give a city its own zone map (>8 quests) and the region "More" map. */
export interface DataCity {
  name: string;
  region: string;
  zones: string[];
  base_coordinates: Coord | null;
  quest_count: number;
}

let _dataCities: DataCity[] | null = null;

/** Every city declared in the regular datasets (Thailand + Laos + Cambodia +
 *  Vietnam), as authored (zones + base_coordinates from the source, quest_count
 *  from its quests). */
export function dataCities(): DataCity[] {
  if (_dataCities) return _dataCities;
  const out: DataCity[] = [];
  for (const data of [regularData, laosRegularData, cambodiaRegularData, vietnamRegularData] as RawAny[]) {
    for (const c of data.cities ?? []) {
      out.push({
        name: String(c.name),
        region: String(c.region),
        zones: (c.zones ?? []).map(String),
        base_coordinates: normaliseCoord(c.base_coordinates),
        quest_count: (c.quests ?? []).length,
      });
    }
  }
  _dataCities = out;
  return out;
}

/**
 * Cambodia and Vietnam have no dedicated food-dish pool — their Food-category
 * quests are regular location quests. They're retrofitted with a `food_tier`
 * (Common/Rare/Unique) so their Food Hall can participate in the same
 * dice-roll mechanic as Thailand/Laos's real dish pools. This ONLY sets
 * `food_tier` — `rarity`/`xp` are left untouched, since those still drive
 * QuestCard styling, region XP, and leveling for these quests elsewhere.
 *
 * Mapping by xp rather than the location-quest rarity (mythic/legendary/epic/
 * rare) deliberately: neither country has a single legendary/mythic Food
 * quest, so a rarity-remap would give 0 Unique dishes and permanently
 * softlock the dice roll's Unique target. These cutoffs are each country's
 * own natural break in its Food-quest xp distribution instead.
 */
function foodTierFromXP(xp: number, cutoffs: { uniqueMin: number; commonMax: number }): FoodTier {
  if (xp >= cutoffs.uniqueMin) return 'unique';
  if (xp <= cutoffs.commonMax) return 'common';
  return 'rare';
}

function applyFoodTierRetrofit(quests: Quest[], cutoffs: { uniqueMin: number; commonMax: number }): void {
  for (const q of quests) {
    if (q.category === 'Food') q.food_tier = foodTierFromXP(q.xp, cutoffs);
  }
}

/** Regular (side) quests across every available country (Thailand + Laos +
 *  Cambodia + Vietnam). The datasets share the identical city/quest shape, so
 *  they merge cleanly; region keys keep them apart everywhere downstream. */
export function loadRegularQuests(): Quest[] {
  const cambodia = loadRegularFrom(cambodiaRegularData as RawAny);
  const vietnam = loadRegularFrom(vietnamRegularData as RawAny);
  applyFoodTierRetrofit(cambodia, { uniqueMin: 2000, commonMax: 600 });
  applyFoodTierRetrofit(vietnam, { uniqueMin: 1500, commonMax: 500 });
  return [
    ...loadRegularFrom(regularData as RawAny),
    ...loadRegularFrom(laosRegularData as RawAny),
    ...cambodia,
    ...vietnam,
  ];
}

export function loadLegacyQuests(): Quest[] {
  return ((legacyData as RawAny).quests ?? []).map((q: RawAny) =>
    baseNormalise(q, 'legacy'),
  );
}

/**
 * Chaos quests. Applies the boss-wheel designation: any quest in
 * BOSS_WHEEL_QUEST_IDS is flagged `is_boss_wheel` and given a 3x multiplier.
 * (The source data ships no boss-wheel flags — see constants.ts.)
 */
export function loadChaosQuests(): Quest[] {
  return ((chaosData as RawAny).quests ?? []).map((q: RawAny) => {
    const quest = baseNormalise(q, 'chaos');
    if (BOSS_WHEEL_QUEST_IDS.includes(quest.id)) {
      quest.is_boss_wheel = true;
      quest.xp_with_multiplier = quest.xp * BOSS_MULTIPLIER;
    }
    return quest;
  });
}

/** Regular + legacy — the set the country badges measure against (scoped
 *  per-country via the region→country map in recomputeBadges). */
export function loadAllStandardQuests(): Quest[] {
  return [...loadRegularQuests(), ...loadLegacyQuests()];
}

// ---- Food Hall -------------------------------------------------------------
// The food dataset is grouped by a "food region" label (Northern Thailand,
// Isaan, Central Thailand, Southern Thailand, Seafood, Desserts, Hidden Foods).
// We keep that label in `food_region` for the Food Hall's per-region sections,
// and canonicalise `region` to a real app region so completion/archive stay
// coherent (the non-geographic groupings fall under Cross-Region).
const FOOD_REGION_CANON: Record<string, string> = {
  'Northern Thailand': 'Northern Thailand',
  Isaan: 'Northeast Thailand',
  'Central Thailand': 'Central Thailand',
  'Southern Thailand': 'Southern Thailand',
  Seafood: 'Cross-Region',
  Desserts: 'Cross-Region',
  'Hidden Foods': 'Cross-Region',
};

/**
 * Thailand's food-dish tier: Common (500xp) / Rare (1000xp) / Unique (2000xp).
 * Migrated from the source data's is_must_try/is_unique flags (confirmed
 * mapping): is_must_try → Common; is_unique (and not must-try) → Unique;
 * everything else → Rare. Both `rarity` and `xp` are overwritten to the flat
 * tier value — this field is exclusively food-dish here, safe to repurpose.
 */
function thailandFoodTier(f: RawAny): FoodTier {
  if (f.is_must_try) return 'common';
  if (f.is_unique) return 'unique';
  return 'rare';
}

/** Food Hall quests. Each food item becomes a completable side-quest flagged
 *  `is_food` so it renders the foodie collectible card and stays out of the
 *  region/city/zone/badge queries (which only look at regular + legacy). */
export function loadFoodQuests(): Quest[] {
  const out: Quest[] = [];
  for (const region of (foodData as RawAny).regions ?? []) {
    const label = String(region.name ?? 'Food');
    const canon = FOOD_REGION_CANON[label] ?? 'Cross-Region';
    for (const f of region.foods ?? []) {
      const tier = thailandFoodTier(f);
      out.push({
        id: `TH_FOOD_${f.id}`,
        type: 'side',
        title: String(f.title ?? ''),
        description: String(f.description ?? ''),
        city: f.city ?? undefined,
        zone: undefined,
        region: canon,
        category: String(f.category ?? 'Food'),
        xp: FOOD_TIER_XP[tier],
        rarity: tier as QuestRarity,
        is_top_15: f.is_top_25 ?? undefined,
        rank: null,
        url: null,
        requires_media: Boolean(f.requires_media ?? true),
        map_marker_type: 'side',
        completed: false,
        status: 'available',
        is_food: true,
        food_country: 'thailand',
        food_category: String(f.category ?? 'Food'),
        food_region: label,
        food_tier: tier,
      });
    }
  }
  return out;
}

// Laos Food Hall — a dedicated 104-dish pool grouped by must-try TIER.
// Migrated (confirmed mapping): tier_1 (Must-Try) → Common; tier_2+tier_3
// (Nice-to-Try / If-You-Have-Time) → Rare; tier_4 (One-of-One, the
// insect/extreme dishes) → Unique.
const LAOS_TIER_TO_FOOD_TIER: Record<string, FoodTier> = {
  tier_1: 'common',
  tier_2: 'rare',
  tier_3: 'rare',
  tier_4: 'unique',
};

export function loadLaosFoodQuests(): Quest[] {
  return ((laosFoodData as RawAny).dishes ?? []).map((d: RawAny) => {
    const tier = LAOS_TIER_TO_FOOD_TIER[String(d.tier)] ?? 'rare';
    // Dishes are grouped in the hall by REGION (primary = first listed);
    // 'Nationwide' staples form their own section.
    const regions: string[] = (d.regions ?? []).map(String);
    return {
      id: String(d.id),
      type: 'side' as QuestType,
      title: String(d.name ?? ''),
      description: String(d.description ?? ''),
      city: undefined,
      zone: undefined,
      region: undefined,
      category: 'Food',
      xp: FOOD_TIER_XP[tier],
      rarity: tier as QuestRarity,
      rank: null,
      url: null,
      requires_media: true,
      map_marker_type: 'side' as MarkerType,
      completed: false,
      status: 'available' as QuestStatus,
      is_food: true,
      food_country: 'laos',
      food_category: guessFoodCategory(`${d.name ?? ''} ${d.description ?? ''}`),
      food_region: regions[0] ?? 'Nationwide',
      food_regions: regions.length ? regions : ['Nationwide'],
      food_tier: tier,
    } as Quest;
  });
}

export function bossWheelQuests(): Quest[] {
  return loadChaosQuests().filter((q) => q.is_boss_wheel);
}

// ---- Lookups --------------------------------------------------------------

export function questsByCity(quests: Quest[], city: string): Quest[] {
  return quests.filter((q) => q.city === city);
}

export function questsByZone(quests: Quest[], city: string, zone: string): Quest[] {
  return quests.filter((q) => q.city === city && q.zone === zone);
}

export function questsByRegion(quests: Quest[], region: string): Quest[] {
  return quests.filter((q) => q.region === region);
}

/** The marker kind to render given completion state. */
export function markerFor(quest: Quest, completed: boolean): MarkerType {
  if (completed) return 'completed';
  if (quest.is_boss_wheel) return 'boss';
  return quest.map_marker_type;
}
