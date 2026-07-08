// ============================================================================
// Store bootstrap — hydrate persisted state, load quest data, sync badges.
// Call AFTER storage.hydrate() has resolved (see App.tsx).
// ============================================================================

import { useGameStore } from './useGameStore';
import { useQuestStore } from './useQuestStore';
import { useChaosStore } from './useChaosStore';
import { useCodexStore } from './useCodexStore';
import { useArchiveStore } from './useArchiveStore';
import { useWorldStore } from './useWorldStore';
import { KEYS, getString, setString } from '../storage/storage';
import { nowISO } from '../utils/helpers';

export function bootstrapStores(): void {
  // 0. Stamp the start of the trip on first-ever launch — drives the "DAY N"
  //    counter on the Today header (day 1 is the ICT calendar date this falls
  //    on; the counter rolls at ICT midnight — see tripDay in utils/helpers).
  if (!getString(KEYS.TRIP_START)) setString(KEYS.TRIP_START, nowISO());

  // 1. Quest data + persisted progress.
  useQuestStore.getState().loadQuestsFromJSON();
  useChaosStore.getState().loadChaosFromJSON();

  // 2. Persisted player + codex + archive + custom-world state.
  useGameStore.getState().hydrate();
  useCodexStore.getState().hydrate();
  useArchiveStore.getState().hydrate();
  useWorldStore.getState().hydrate();

  // 3. Reconcile derived state (streak decay + badge recompute).
  useGameStore.getState().updateStreak();
  useGameStore.getState().recomputeBadges();

  // 4. Reconcile milestone medals silently (no retroactive XP dump / modal
  //    storm at launch). New milestones earned during play award XP + a medal.
  useGameStore.getState().checkMilestones({ silent: true });
}
