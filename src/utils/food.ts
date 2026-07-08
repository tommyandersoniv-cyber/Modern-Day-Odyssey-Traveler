// ============================================================================
// Food Hall styling helpers — the foodie collectible card palette + emoji.
//
// Cards are colored by their Common/Rare/Unique food-dish tier (gray/blue/
// gold) — replaces the old xp-threshold Gengar-purple/baby-blue split, which
// would have wrongly lumped Rare (1000 XP) and Unique (2000 XP) into the same
// bucket now that both sit above the old 1000-XP cutoff.
// ============================================================================

import type { FoodTier } from '../types';
import { FOOD_TIER_LABEL } from './constants';

export interface FoodPalette {
  bg: string;
  edge: string;
  band: string; // header band
  fg: string; // primary text on bg
  sub: string; // secondary text
  label: string; // tier word
}

const FOOD_TIER_PALETTE: Record<FoodTier, FoodPalette> = {
  common: { bg: '#2a2a30', edge: '#a0a0b8', band: '#1c1c22', fg: '#e8e8f0', sub: '#8a8a9a', label: FOOD_TIER_LABEL.common },
  rare: { bg: '#16213e', edge: '#2196F3', band: '#0f3460', fg: '#eaf4ff', sub: '#8fb8dd', label: FOOD_TIER_LABEL.rare },
  unique: { bg: '#2b2308', edge: '#FFD700', band: '#4a3b12', fg: '#fff6d9', sub: '#d9bd6a', label: FOOD_TIER_LABEL.unique },
};

/** Palette for a dish's Common/Rare/Unique tier. Falls back to 'rare' (the
 *  middle tier) for the rare pre-migration edge case where food_tier is
 *  somehow missing. */
export function foodTierPalette(tier?: FoodTier): FoodPalette {
  return FOOD_TIER_PALETTE[tier ?? 'rare'];
}

const CATEGORY_EMOJI: Record<string, string> = {
  Noodles: '🍜',
  'Soups & Noodles': '🍜',
  Soups: '🍲',
  'Stews & Braises': '🍲',
  Curry: '🍛',
  'Rice Dishes': '🍚',
  'Grilled & Street Food': '🍢',
  'Street Food': '🍢',
  'Snacks & Appetizers': '🍤',
  'Salads & Larb': '🥗',
  'Vegetables & Sides': '🥬',
  'Insects & Wild Foods': '🦗',
  'Raw & Wild Foods': '🦞',
  'Fermented Foods': '🥢',
  'Dips & Condiments': '🥢',
  Desserts: '🍮',
  'Bread & Pastries': '🥐',
  'Stir Fry': '🍳',
  Breakfast: '🍳',
  Seafood: '🦐',
};

export function foodEmoji(category?: string): string {
  if (!category) return '🍜';
  return CATEGORY_EMOJI[category] ?? '🍜';
}

/** Fixed display order for the Food Hall's per-region sections. */
export const FOOD_REGION_ORDER: string[] = [
  'Northern Thailand',
  'Isaan',
  'Central Thailand',
  'Southern Thailand',
  'Seafood',
  'Desserts',
  'Hidden Foods',
];

/** Laos Food Hall sections — dishes grouped by REGION (Nationwide staples
 *  first, then the five regions north→south). */
export const LAOS_FOOD_REGION_ORDER: string[] = [
  'Nationwide',
  'Far North',
  'Northwest Corridor',
  'East & Northeast',
  'Central Belt',
  'South',
];

/** Cambodia Food Hall sections. Cambodia has no separate dish pool — its food
 *  quests live in the regular data — so the hall groups them by their
 *  geographic region key (north→south), not a food-only region. */
export const CAMBODIA_FOOD_REGION_ORDER: string[] = [
  'Remote Northwest',
  'Northern Cambodia',
  'Northeast Highlands',
  'Northwest Cambodia',
  'Central Cambodia',
  'Mekong Corridor',
  'Southwest Cambodia',
  'South Coast',
];

/** Vietnam Food Hall sections. Like Cambodia, Vietnam has no separate dish pool
 *  — its food quests live in the regular data — so the hall groups them by
 *  geographic region key (north→south). */
export const VIETNAM_FOOD_REGION_ORDER: string[] = [
  'Northern Vietnam',
  'North-Central Coast',
  'Central Highlands',
  'Southern Vietnam',
  'Mekong Delta',
];

/** Guess a food_category (→ emoji) from a Lao dish name + description, since the
 *  source data has no category field. Falls back to a generic street-food bowl. */
export function guessFoodCategory(text: string): string {
  const t = text.toLowerCase();
  // Word-boundary patterns so "eggplant"→ant / "restaurant"→ant don't false-match.
  if (/(\bants?\b|ant egg|weaver ant|\bworm|grasshopper|\bwasp|silkworm|water bug|\binsect|larvae|cricket)/.test(t)) return 'Insects & Wild Foods';
  if (/(\braw\b|\bblood\b|\bbile\b|cobra|snake|\brat\b|embryo|scorpion)/.test(t)) return 'Raw & Wild Foods';
  if (/(coffee|ca fay|oliang|juice|sugarcane|coconut water|wine|whiskey|lao lao|beerlao|beer|tea)/.test(t)) return 'Snacks & Appetizers';
  if (/(dessert|sweet|custard|sang ?kaya|jelly|voon|khanom|mango|pudding|condensed milk|lod song|sakoo)/.test(t)) return 'Desserts';
  if (/(baguette|bread|pate|khao jee|khao ji)/.test(t)) return 'Bread & Pastries';
  if (/(larb|laap|koi|koy|tam mak|salad|miang|soop|som tam)/.test(t)) return 'Salads & Larb';
  if (/(noodle|khao soi|khao piak|khao poon|pho|phor|lod xong|sen)/.test(t)) return 'Noodles';
  if (/(curry|gaeng|or ?lam|galee)/.test(t)) return 'Curry';
  if (/(soup|tom |thom |gaeng som|porridge|khao tom)/.test(t)) return 'Soups';
  if (/(ping|grill|bbq|sin dad|sausage|sai oua|jerky|sien)/.test(t)) return 'Grilled & Street Food';
  if (/(jeow|padaek|dip|condiment|brine|nam phak|maeng da)/.test(t)) return 'Dips & Condiments';
  if (/(fish|pa |catfish|snail|mok pa|koi pa|dolphin|mekong)/.test(t)) return 'Seafood';
  if (/(spring roll|yaw|fried|tod|nam khao)/.test(t)) return 'Snacks & Appetizers';
  if (/(rice|khao niao|khao niew|khao khua|khao gum|khao lam|sticky)/.test(t)) return 'Rice Dishes';
  if (/(stew|mok|braise|thom khem)/.test(t)) return 'Stews & Braises';
  if (/(stir|khua|pak bong|vegetable)/.test(t)) return 'Stir Fry';
  return 'Street Food';
}
