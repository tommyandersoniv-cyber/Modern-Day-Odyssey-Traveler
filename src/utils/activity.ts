// ============================================================================
// Activity aggregation — the single place that reads across all stores to
// answer "what has the player actually done?". Used by the Dex stats, the
// temple-ranking pickers, and the milestone evaluator.
//
// Stores are pulled lazily via require() (the same pattern useGameStore uses)
// so this module stays free of static import cycles.
// ============================================================================

import type { Quest } from '../types';
import { countFacets, isTemple, type Facet } from './facets';

export interface ActivityStats {
  quests: number; // total completed quests (standard + user + chaos/boss)
  temples: number;
  foods: number;
  markets: number;
  islands: number;
  beaches: number;
  level: number;
  bossWins: number;
  chaosDone: number; // non-boss chaos completed
  customQuestsCreated: number;
  characters: number;
  placesSaved: number; // custom regions + cities
  regionsEntered: number;
}

/** Every COMPLETED quest as a full Quest object, across all three pools. */
export function getCompletedQuests(): Quest[] {
  const { useQuestStore } = require('../store/useQuestStore') as typeof import('../store/useQuestStore');
  const { useChaosStore } = require('../store/useChaosStore') as typeof import('../store/useChaosStore');

  const qs = useQuestStore.getState();
  const cs = useChaosStore.getState();

  const completedStd = new Set(qs.completed_quest_ids);
  const completedChaos = new Set(cs.completed_chaos_ids);

  const standard = [...qs.all_quests, ...qs.user_quests, ...qs.food_quests].filter((q) => completedStd.has(q.id));
  const chaos = cs.chaos_pool.filter((q) => completedChaos.has(q.id));
  return [...standard, ...chaos];
}

/** Completed temple quests, most-recent first (for ranking pickers). */
export function getCompletedTemples(): Quest[] {
  return getCompletedQuests()
    .filter(isTemple)
    .sort((a, b) => (b.completed_at ?? '').localeCompare(a.completed_at ?? ''));
}

/** Facet counts over every completed quest. */
export function getFacetCounts(): Record<Facet, number> {
  return countFacets(getCompletedQuests());
}

/** Roll up the full activity snapshot the milestone evaluator consumes. */
export function getActivityStats(): ActivityStats {
  const { useGameStore } = require('../store/useGameStore') as typeof import('../store/useGameStore');
  const { useQuestStore } = require('../store/useQuestStore') as typeof import('../store/useQuestStore');
  const { useChaosStore } = require('../store/useChaosStore') as typeof import('../store/useChaosStore');
  const { useCodexStore } = require('../store/useCodexStore') as typeof import('../store/useCodexStore');
  const { useWorldStore } = require('../store/useWorldStore') as typeof import('../store/useWorldStore');

  const g = useGameStore.getState();
  const qs = useQuestStore.getState();
  const cs = useChaosStore.getState();
  const codex = useCodexStore.getState();
  const world = useWorldStore.getState();

  const facets = getFacetCounts();
  const quests = qs.completed_quest_ids.length + cs.completed_chaos_ids.length;

  // Boss wins = regions whose boss challenge is marked complete.
  const bossWins = g.region_entries.filter((e) => e.boss_completed).length;
  // Non-boss chaos completions: count completed chaos quests that aren't boss-wheel.
  const bossWheelCompleted = cs.chaos_pool.filter(
    (q) => q.is_boss_wheel && cs.completed_chaos_ids.includes(q.id),
  ).length;
  const chaosDone = Math.max(0, cs.completed_chaos_ids.length - bossWheelCompleted);

  return {
    quests,
    temples: facets.temple,
    foods: facets.food,
    markets: facets.market,
    islands: facets.island,
    beaches: facets.beach,
    level: g.player.level,
    bossWins,
    chaosDone,
    customQuestsCreated: qs.user_quests.length,
    characters: codex.characters.length,
    placesSaved: world.customRegions.length + world.customCities.length,
    regionsEntered: g.region_entries.length,
  };
}
