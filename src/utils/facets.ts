// ============================================================================
// Quest "facets" — classify a quest by what kind of place/experience it is:
//   temple · food · market · island · beach
//
// The runtime Quest only keeps a condensed 5-bucket `category`, so the raw
// sub-category (Temple / Beach / …) is gone by the time we see a quest. We
// instead classify off the TITLE, which is the most reliable, low-noise signal
// in the data (e.g. "Wat …", "Koh …", "… Night Market"). Title-only keeps the
// classifier deterministic and easy to reason about; it can undercount places
// whose name doesn't say what they are (a handful of beaches), but it never
// mis-counts a mountain ("Khao …") as food, which broader matching does.
//
// A quest can carry MORE THAN ONE facet (a night market is both market + food).
// ============================================================================

import type { Quest } from '../types';

export type Facet = 'temple' | 'food' | 'market' | 'island' | 'beach';

export const FACETS: Facet[] = ['temple', 'food', 'market', 'island', 'beach'];

// Tight, title-scoped keyword sets. Word-boundaried and case-insensitive.
const FACET_PATTERNS: Record<Facet, RegExp> = {
  temple: /\b(wat|temple|temples|shrine|shrines|pagoda|stupa|chedi|monastery|sanctuary of truth)\b/i,
  island: /\b(island|islands|koh)\b/i,
  beach: /\bbeach(es)?\b/i,
  market: /\bmarket(s)?\b/i,
  food: /\b(food|eat|eating|street food|cuisine|noodle|noodles|curry|pad thai|som tam|sticky rice|cooking class|restaurant|breakfast|brunch|dinner|feast|meal|meals|dessert|cafe|michelin|hawker)\b/i,
};

/** Every facet a quest qualifies for. Food Hall quests are food by flag, not
 *  by title keyword (a dish like "Khao Soi" has no food keyword in its name). */
export function questFacets(quest: Quest): Facet[] {
  const title = quest.title ?? '';
  return FACETS.filter((f) => (f === 'food' && quest.is_food) || FACET_PATTERNS[f].test(title));
}

export function hasFacet(quest: Quest, facet: Facet): boolean {
  if (facet === 'food' && quest.is_food) return true;
  return FACET_PATTERNS[facet].test(quest.title ?? '');
}

export function isTemple(quest: Quest): boolean {
  return hasFacet(quest, 'temple');
}

/** Count how many quests in a list carry each facet. */
export function countFacets(quests: Quest[]): Record<Facet, number> {
  const counts: Record<Facet, number> = { temple: 0, food: 0, market: 0, island: 0, beach: 0 };
  for (const q of quests) {
    for (const f of FACETS) {
      if (hasFacet(q, f)) counts[f] += 1;
    }
  }
  return counts;
}
