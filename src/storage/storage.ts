// ============================================================================
// Unified, typed storage interface. All persistence flows through here.
// ============================================================================

import { kv } from './mmkv';

export const KEYS = {
  PLAYER: 'player_state',
  COMPLETED_QUESTS: 'completed_quest_ids',
  // Chaos completions live under their own key (kept as the exact string the
  // store historically composed ad hoc, so existing saves keep working).
  COMPLETED_CHAOS: 'completed_quest_ids_chaos',
  ACTIVE_REGULAR: 'active_regular_quest_ids',
  ACTIVE_CHAOS: 'active_chaos_quest_ids',
  ACTIVE_BOSS: 'active_boss_quest_id',
  REGION_ENTRIES: 'region_entries',
  MEDALS: 'city_medals',
  REGION_BADGES: 'region_badges',
  COUNTRY_BADGES: 'country_badges',
  CHARACTER_CODEX: 'character_codex',
  ARCHIVE_ENTRIES: 'archive_entries',
  ONBOARDING_DONE: 'onboarding_complete',
  USER_QUESTS: 'user_created_quests',
  XP_LOG: 'xp_log',
  CURRENT_LOCATION: 'current_location',
  CUSTOM_REGIONS: 'custom_regions',
  CUSTOM_CITIES: 'custom_cities',
  GAME_MODE: 'game_mode',
  ODYSSEY_REGION_XP: 'odyssey_region_xp',
  ODYSSEY_UNLOCKED: 'odyssey_unlocked',
  ODYSSEY_LEVEL: 'odyssey_level',
  ODYSSEY_START: 'odyssey_start',
  MILESTONES_EARNED: 'milestones_earned',
  TEMPLE_RANKINGS: 'temple_rankings',
  TRIP_START: 'trip_start_iso',
  FOOD_HALL_ROLLS: 'food_hall_rolls',
} as const;

export type StorageKey = (typeof KEYS)[keyof typeof KEYS];

// ---- Generic typed accessors ----------------------------------------------

export function getJSON<T>(key: string, fallback: T): T {
  const raw = kv.getString(key);
  if (raw == null) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function setJSON<T>(key: string, value: T): void {
  try {
    kv.set(key, JSON.stringify(value));
  } catch {
    // Serialisation failures are swallowed — never crash the app on a write.
  }
}

export function getString(key: string, fallback = ''): string {
  return kv.getString(key) ?? fallback;
}

export function setString(key: string, value: string): void {
  kv.set(key, value);
}

export function getBool(key: string, fallback = false): boolean {
  const raw = kv.getString(key);
  if (raw == null) return fallback;
  return raw === 'true' || raw === '1';
}

export function setBool(key: string, value: boolean): void {
  kv.set(key, value ? 'true' : 'false');
}

export function getNumber(key: string, fallback = 0): number {
  const raw = kv.getString(key);
  if (raw == null) return fallback;
  const n = Number(raw);
  return Number.isFinite(n) ? n : fallback;
}

export function setNumber(key: string, value: number): void {
  kv.set(key, String(value));
}

export function remove(key: string): void {
  kv.delete(key);
}

/** Nuke all persisted data (used by a dev/debug reset). */
export function clearAll(): void {
  kv.clearAll();
}

export const Storage = {
  KEYS,
  getJSON,
  setJSON,
  getString,
  setString,
  getBool,
  setBool,
  getNumber,
  setNumber,
  remove,
  clearAll,
};

export default Storage;
