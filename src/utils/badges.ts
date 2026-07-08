// ============================================================================
// Badge helpers — completion percentage + zone category spread.
//
// The live badge model is computed in useGameStore.recomputeBadges:
//   City medal   — >=70% of the city's quests complete
//   Region badge — every city in the region medaled (jigsaw complete)
//   Country      — >=70% of that country's own standard quests
// ============================================================================

import type { Quest } from '../types';
import { questsByZone } from './quests';

export interface CategorySpread {
  spread: Record<string, boolean>; // category -> has >=1 completion
  required: string[]; // categories with >=2 quests in the zone
  met: boolean;
}

export function getCompletionPct(quests: Quest[], completedIds: string[]): number {
  if (quests.length === 0) return 0;
  const done = quests.filter((q) => completedIds.includes(q.id)).length;
  return done / quests.length;
}

/**
 * Category spread for a zone. Every category represented by >=2 quests in the
 * zone must have at least one completion.
 */
export function getCategorySpread(
  city: string,
  zone: string,
  completedIds: string[],
  allQuests: Quest[],
): CategorySpread {
  const zoneQuests = questsByZone(allQuests, city, zone);
  const counts: Record<string, number> = {};
  zoneQuests.forEach((q) => {
    counts[q.category] = (counts[q.category] ?? 0) + 1;
  });
  const required = Object.entries(counts)
    .filter(([, n]) => n >= 2)
    .map(([cat]) => cat);

  const completedCats = new Set(
    zoneQuests.filter((q) => completedIds.includes(q.id)).map((q) => q.category),
  );

  const spread: Record<string, boolean> = {};
  Object.keys(counts).forEach((cat) => {
    spread[cat] = completedCats.has(cat);
  });

  const met = required.every((cat) => completedCats.has(cat));
  return { spread, required, met };
}
