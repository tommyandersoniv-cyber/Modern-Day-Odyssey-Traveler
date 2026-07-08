// ============================================================================
// useGameStore — master game state: player, XP, medals, region gym badges,
// region entries, streak.
//
// Badge model: completing a CITY (>=70% of its quests) earns a MEDAL; medals
// are the jigsaw pieces that assemble a REGION's gym badge. A region badge
// unlocks when every city in it is medaled.
// ============================================================================

import { create } from 'zustand';
import type {
  CityMedal,
  CountryBadge,
  FoodHallRoll,
  LevelUpResult,
  MilestoneRecord,
  PlayerState,
  RegionBadge,
  RegionEntry,
  TempleRankings,
  XPEvent,
} from '../types';
import type { CharacterAppearance, GameMode } from '../types';
import { evaluateMilestones } from '../utils/milestones';
import { getActivityStats } from '../utils/activity';
import {
  BADGE_THRESHOLD,
  ODYSSEY_REGION_ORDER,
  odysseyCostForLevel,
  odysseyLevelName,
  odysseyOrderFrom,
} from '../utils/constants';
import { availableCountries, countryForRegionKey, isOdysseyCountryRegion } from '../utils/countries';
import { DEFAULT_PLAYER_APPEARANCE, normalizeAppearance } from '../utils/appearance';
import { getCompletionPct } from '../utils/badges';
import { getLevel, getTitle, getXPToNext } from '../utils/xp';
import { nowISO, todayKey, dayDiff, genId } from '../utils/helpers';
import { KEYS, getJSON, setJSON } from '../storage/storage';

export interface BadgeUnlockNotice {
  id: string;
  kind: 'region' | 'country';
  label: string;
  sublabel?: string;
}

/** Region progress is derived solely from completed quests in each region —
 *  summed by each quest's home region. Milestones, characters, food, and chaos
 *  never contribute (older saves wrongly banked that XP here). */
function recomputeRegionXp(): Record<string, number> {
  const { useQuestStore } = require('./useQuestStore') as typeof import('./useQuestStore');
  const qs = useQuestStore.getState();
  const completed = new Set(qs.completed_quest_ids);
  const out: Record<string, number> = {};
  [...qs.all_quests, ...qs.user_quests].forEach((q) => {
    if (q.is_food || !completed.has(q.id)) return;
    const r = q.region;
    if (!r || !isOdysseyCountryRegion(r)) return;
    out[r] = (out[r] ?? 0) + q.xp;
  });
  return out;
}

export interface MedalUnlockNotice {
  id: string;
  city: string;
  region: string;
}

export interface OdysseyStatus {
  level: number | null; // chosen difficulty (1-4), null until selected
  rankName: string | null; // name of the chosen level
  unlockedCount: number;
  frontier: string; // newest unlocked region (where XP must accrue next)
  frontierXp: number; // XP earned so far in the frontier region
  nextRegion: string | null; // the region you're working to unlock
  nextCost: number | null; // flat XP needed in the frontier to unlock nextRegion
}

interface GameState {
  player: PlayerState;
  medals: CityMedal[];
  region_badges: RegionBadge[];
  country_badges: CountryBadge[];
  region_entries: RegionEntry[];
  current_region: string | null;
  current_city: string | null;
  current_zone: string | null;
  xp_log: XPEvent[];

  // Odyssey mode
  game_mode: GameMode;
  odyssey_level: number | null; // chosen difficulty (1-4); null = not chosen yet
  odyssey_start: string | null; // chosen starting region; null = default first region
  odyssey_region_xp: Record<string, number>;
  odyssey_unlocked: string[];
  // Food Hall dice roll (Odyssey mode only) — keyed by country id.
  food_hall_rolls: Record<string, FoodHallRoll>;

  // Milestones / achievements
  milestones: MilestoneRecord[];
  temple_rankings: TempleRankings;

  // Transient UI signals (not persisted)
  pendingLevelUp: LevelUpResult | null;
  pendingBadges: BadgeUnlockNotice[];
  pendingMedals: MedalUnlockNotice[];
  pendingMilestones: MilestoneRecord[];
  pendingRegionComplete: string | null; // region whose XP just filled (choose next)
  lastXPGain: { amount: number; source: string; key: number } | null;

  // Actions
  addXP: (amount: number, source: string) => LevelUpResult;
  consumePendingLevelUp: () => void;
  consumePendingBadge: () => void;
  consumePendingMedal: () => void;
  consumePendingMilestone: () => void;
  consumePendingRegionComplete: () => void;
  /** Player-directed unlock: open a chosen (locked) region. The first call also
   *  records it as the starting region. */
  unlockRegion: (region: string) => void;
  clearLastXPGain: () => void;

  /** Re-evaluate milestones from current activity; award XP + medals for any
   *  newly crossed. `silent` (used at bootstrap) reconciles medals without
   *  granting XP or queuing celebration modals. */
  checkMilestones: (opts?: { silent?: boolean }) => void;
  setTempleRankingGlobal: (ids: string[]) => void;
  setTempleRankingRegional: (scopeKey: string, ids: string[]) => void;

  hasEnteredRegion: (region: string) => boolean;
  getRegionEntry: (region: string) => RegionEntry | undefined;
  enterRegion: (region: string, bossQuestId: string, chaosRequirement: number) => RegionEntry;
  setBossCompleted: (region: string) => void;
  incrementRegionChaos: (region: string) => void;

  setCurrentLocation: (region: string | null, city?: string | null, zone?: string | null) => void;
  setPlayerName: (name: string) => void;
  setPlayerAppearance: (appearance: CharacterAppearance) => void;
  updateStreak: () => void;

  setGameMode: (mode: GameMode) => void;
  setOdysseyLevel: (level: number) => void;
  isRegionUnlocked: (region: string) => boolean;
  odysseyStatus: () => OdysseyStatus;

  /** Idempotent: rolls once per country and persists forever. Re-calling for
   *  an already-rolled country just returns the existing roll — never re-rolls
   *  (which would silently wipe the player's progress toward it). */
  rollFoodHallDice: (country: string) => FoodHallRoll;

  recomputeBadges: () => void;
  hydrate: () => void;
  resetGame: () => void;
}

const initialPlayer: PlayerState = {
  name: 'Traveler',
  level: 1,
  xp_total: 0,
  xp_to_next: 500,
  streak_days: 0,
  last_activity_date: '',
  prestige_countries: [],
  appearance: DEFAULT_PLAYER_APPEARANCE,
};

function buildInitialRegionBadges(): RegionBadge[] {
  return availableCountries()
    .flatMap((c) => c.regions)
    .map((r) => ({
      region: r.region,
      unlocked: false,
      boss_quest_completed: false,
      chaos_roll: 0,
      chaos_completed: 0,
      characters_added: 0,
      medals_earned: 0,
      medals_total: 0,
    }));
}

/** One country badge per available country (Thailand, Laos, …). */
function buildInitialCountryBadges(): CountryBadge[] {
  return availableCountries().map((c) => ({
    country: c.name,
    code: c.code,
    unlocked: false,
    completion_pct: 0,
  }));
}

export const useGameStore = create<GameState>((set, get) => ({
  player: initialPlayer,
  medals: [],
  region_badges: buildInitialRegionBadges(),
  country_badges: buildInitialCountryBadges(),
  region_entries: [],
  current_region: null,
  current_city: null,
  current_zone: null,
  xp_log: [],

  // Odyssey is the default journey. Tourist (level 1) is the starting
  // difficulty; the player can change it in the Travel-Dex.
  game_mode: 'odyssey',
  odyssey_level: 1,
  odyssey_start: null, // set to the first region the player chooses
  odyssey_region_xp: {},
  odyssey_unlocked: [], // empty until the player picks a starting region
  food_hall_rolls: {},

  milestones: [],
  temple_rankings: { global: [], regional: {} },

  pendingLevelUp: null,
  pendingBadges: [],
  pendingMedals: [],
  pendingMilestones: [],
  pendingRegionComplete: null,
  lastXPGain: null,

  addXP: (amount, source) => {
    const prev = get().player;
    const prevLevel = getLevel(prev.xp_total);
    const newTotal = prev.xp_total + amount;
    const newLevel = getLevel(newTotal);
    const title = getTitle(newTotal);

    const today = todayKey();
    let streak = prev.streak_days;
    if (prev.last_activity_date) {
      const diff = dayDiff(prev.last_activity_date, today);
      if (diff === 0) streak = prev.streak_days || 1;
      else if (diff === 1) streak = prev.streak_days + 1;
      else if (diff > 1) streak = 1;
    } else {
      streak = 1;
    }

    const player: PlayerState = {
      ...prev,
      xp_total: newTotal,
      level: newLevel,
      xp_to_next: getXPToNext(newTotal),
      streak_days: streak,
      last_activity_date: today,
    };

    const event: XPEvent = { amount, source, at: nowISO(), new_total: newTotal };
    const leveled = newLevel > prevLevel;
    const result: LevelUpResult = {
      leveled_up: leveled,
      new_level: newLevel,
      title,
      previous_level: prevLevel,
    };

    // Odyssey: progress toward completing a region comes SOLELY from completing
    // that region's own quests — never milestones, characters, food, or chaos.
    // So we credit region XP only for a `quest:` completion, attributed to the
    // quest's home region (not where the player happens to stand).
    // (Bug fix: milestone XP used to inflate region progress.)
    const cur = get();
    const odyssey_region_xp = { ...cur.odyssey_region_xp };
    const threshold = cur.odyssey_level ? odysseyCostForLevel(cur.odyssey_level) : Infinity;
    let attributeTo: string | null = null;
    if (source.startsWith('quest:')) {
      const { useQuestStore } = require('./useQuestStore') as typeof import('./useQuestStore');
      const q = useQuestStore.getState().getQuestById(source.slice('quest:'.length));
      const r = q && !q.is_food ? q.region ?? null : null;
      // Credit any available country's geographic region (powers the per-country
      // completion gate); the Legendary hall and custom regions don't count.
      if (r && isOdysseyCountryRegion(r)) attributeTo = r;
    }
    let justCompleted: string | null = null;
    if (attributeTo) {
      const before = odyssey_region_xp[attributeTo] ?? 0;
      const after = before + amount;
      odyssey_region_xp[attributeTo] = after;
      // Only the Thailand chain shows the "choose your next region" modal; other
      // countries (e.g. Laos) are free-roam, so they accrue XP silently.
      if (before < threshold && after >= threshold && ODYSSEY_REGION_ORDER.includes(attributeTo)) {
        justCompleted = attributeTo;
      }
    }

    set((s) => ({
      player,
      xp_log: [event, ...s.xp_log].slice(0, 200),
      lastXPGain: { amount, source, key: Date.now() },
      pendingLevelUp: leveled ? result : s.pendingLevelUp,
      // Celebrate a freshly-completed region (Odyssey mode only) → choose next.
      pendingRegionComplete:
        justCompleted && cur.game_mode === 'odyssey' ? justCompleted : s.pendingRegionComplete,
      odyssey_region_xp,
    }));

    setJSON(KEYS.PLAYER, player);
    setJSON(KEYS.XP_LOG, get().xp_log);
    setJSON(KEYS.ODYSSEY_REGION_XP, odyssey_region_xp);
    return result;
  },

  consumePendingLevelUp: () => set({ pendingLevelUp: null }),
  consumePendingBadge: () => set((s) => ({ pendingBadges: s.pendingBadges.slice(1) })),
  consumePendingMedal: () => set((s) => ({ pendingMedals: s.pendingMedals.slice(1) })),
  consumePendingMilestone: () => set((s) => ({ pendingMilestones: s.pendingMilestones.slice(1) })),
  consumePendingRegionComplete: () => set({ pendingRegionComplete: null }),

  unlockRegion: (region) => {
    const s = get();
    if (s.odyssey_unlocked.includes(region)) return;
    const odyssey_unlocked = [...s.odyssey_unlocked, region];
    const odyssey_start = s.odyssey_start ?? region; // first choice = starting region
    set({ odyssey_unlocked, odyssey_start });
    setJSON(KEYS.ODYSSEY_UNLOCKED, odyssey_unlocked);
    setJSON(KEYS.ODYSSEY_START, odyssey_start);
  },

  clearLastXPGain: () => set({ lastXPGain: null }),

  checkMilestones: (opts) => {
    const silent = opts?.silent ?? false;
    const stamp = nowISO();

    let earnedRecords = get().milestones;
    const earnedIds = new Set(earnedRecords.map((m) => m.id));
    const newly: MilestoneRecord[] = [];

    // Fixpoint loop: awarding milestone XP can push the player over a level
    // threshold, which unlocks a *level* milestone — so we re-evaluate until
    // nothing new appears (bounded). Silent mode never grants XP, so one pass.
    for (let iter = 0; iter < 20; iter++) {
      const stats = getActivityStats();
      const fresh = evaluateMilestones(stats).filter((e) => !earnedIds.has(e.id));
      if (fresh.length === 0) break;
      // Award lower-XP tiers first for a tidy notification order.
      fresh.sort((a, b) => a.xp - b.xp);
      for (const e of fresh) {
        earnedIds.add(e.id);
        const rec: MilestoneRecord = { ...e, earned_at: stamp };
        earnedRecords = [...earnedRecords, rec];
        newly.push(rec);
        if (!silent && e.xp > 0) get().addXP(e.xp, `milestone:${e.id}`);
      }
      if (silent) break;
    }

    if (newly.length === 0) return;
    set((s) => ({
      milestones: earnedRecords,
      pendingMilestones: silent ? s.pendingMilestones : [...s.pendingMilestones, ...newly],
    }));
    setJSON(KEYS.MILESTONES_EARNED, earnedRecords);
  },

  setTempleRankingGlobal: (ids) => {
    const temple_rankings = { ...get().temple_rankings, global: ids.slice(0, 10) };
    set({ temple_rankings });
    setJSON(KEYS.TEMPLE_RANKINGS, temple_rankings);
  },

  setTempleRankingRegional: (scopeKey, ids) => {
    const cur = get().temple_rankings;
    const regional = { ...cur.regional, [scopeKey]: ids.slice(0, 5) };
    const temple_rankings = { ...cur, regional };
    set({ temple_rankings });
    setJSON(KEYS.TEMPLE_RANKINGS, temple_rankings);
  },

  hasEnteredRegion: (region) => get().region_entries.some((e) => e.region === region),
  getRegionEntry: (region) => get().region_entries.find((e) => e.region === region),

  enterRegion: (region, bossQuestId, chaosRequirement) => {
    const existing = get().region_entries.find((e) => e.region === region);
    if (existing) return existing;
    const entry: RegionEntry = {
      region,
      entered_at: nowISO(),
      boss_quest_id: bossQuestId,
      chaos_requirement: chaosRequirement,
      boss_completed: false,
    };
    const region_entries = [...get().region_entries, entry];
    const region_badges = get().region_badges.map((b) =>
      b.region === region ? { ...b, chaos_roll: chaosRequirement } : b,
    );
    set({ region_entries, region_badges });
    setJSON(KEYS.REGION_ENTRIES, region_entries);
    setJSON(KEYS.REGION_BADGES, region_badges);
    get().checkMilestones();
    return entry;
  },

  setBossCompleted: (region) => {
    const region_entries = get().region_entries.map((e) =>
      e.region === region ? { ...e, boss_completed: true } : e,
    );
    set({ region_entries });
    setJSON(KEYS.REGION_ENTRIES, region_entries);
    get().recomputeBadges();
    get().checkMilestones();
  },

  incrementRegionChaos: (region) => {
    const region_badges = get().region_badges.map((b) =>
      b.region === region ? { ...b, chaos_completed: b.chaos_completed + 1 } : b,
    );
    set({ region_badges });
    setJSON(KEYS.REGION_BADGES, region_badges);
    get().recomputeBadges();
  },

  setCurrentLocation: (region, city = null, zone = null) => {
    set({ current_region: region, current_city: city, current_zone: zone });
    setJSON(KEYS.CURRENT_LOCATION, { region, city, zone });
  },

  setPlayerName: (name) => {
    const player = { ...get().player, name };
    set({ player });
    setJSON(KEYS.PLAYER, player);
  },

  setPlayerAppearance: (appearance) => {
    const player = { ...get().player, appearance };
    set({ player });
    setJSON(KEYS.PLAYER, player);
  },

  setGameMode: (mode) => {
    set({ game_mode: mode });
    setJSON(KEYS.GAME_MODE, mode);
  },

  setOdysseyLevel: (level) => {
    // Difficulty just sets the per-region XP threshold; unlocking is manual.
    set({ odyssey_level: level });
    setJSON(KEYS.ODYSSEY_LEVEL, level);
  },

  isRegionUnlocked: (region) => {
    const s = get();
    if (s.game_mode !== 'odyssey') return true;
    // Regions outside the sequential chain (Cross-Region, custom places) stay open.
    if (!ODYSSEY_REGION_ORDER.includes(region)) return true;
    return s.odyssey_unlocked.includes(region);
  },

  odysseyStatus: () => {
    const s = get();
    const unlocked = s.odyssey_unlocked;
    const unlockedCount = unlocked.length;
    const frontier = unlocked[unlockedCount - 1];
    const level = s.odyssey_level;
    return {
      level,
      rankName: level ? odysseyLevelName(level) : null,
      unlockedCount,
      frontier,
      frontierXp: s.odyssey_region_xp[frontier] ?? 0,
      nextRegion: odysseyOrderFrom(s.odyssey_start)[unlockedCount] ?? null,
      nextCost: level ? odysseyCostForLevel(level) : null,
    };
  },

  rollFoodHallDice: (country) => {
    const existing = get().food_hall_rolls[country];
    if (existing) return existing;
    const d6 = () => 1 + Math.floor(Math.random() * 6);
    const roll: FoodHallRoll = { common: d6(), rare: d6(), unique: d6(), rolledAt: nowISO() };
    const food_hall_rolls = { ...get().food_hall_rolls, [country]: roll };
    set({ food_hall_rolls });
    setJSON(KEYS.FOOD_HALL_ROLLS, food_hall_rolls);
    return roll;
  },

  updateStreak: () => {
    const prev = get().player;
    if (!prev.last_activity_date) return;
    const diff = dayDiff(prev.last_activity_date, todayKey());
    if (diff > 1 && prev.streak_days !== 0) {
      const player = { ...prev, streak_days: 0 };
      set({ player });
      setJSON(KEYS.PLAYER, player);
    }
  },

  recomputeBadges: () => {
    const { useQuestStore } = require('./useQuestStore') as typeof import('./useQuestStore');
    const { useCodexStore } = require('./useCodexStore') as typeof import('./useCodexStore');
    const { getRegionCities } = require('../utils/world') as typeof import('../utils/world');

    const allQuests = useQuestStore.getState().all_quests;
    const completedIds = useQuestStore.getState().completed_quest_ids;
    const characters = useCodexStore.getState().characters;

    const prev = get();
    const stamp = nowISO();
    const medalNotices: MedalUnlockNotice[] = [];
    const badgeNotices: BadgeUnlockNotice[] = [];
    const prevMedals = prev.medals;
    const medals: CityMedal[] = [];

    const region_badges: RegionBadge[] = prev.region_badges.map((rb) => {
      const cities = getRegionCities(rb.region);
      let earnedCount = 0;
      cities.forEach((c) => {
        const cityQuests = allQuests.filter((q) => q.city === c.name);
        const earned =
          cityQuests.length > 0 && getCompletionPct(cityQuests, completedIds) >= BADGE_THRESHOLD.city;
        const prevMedal = prevMedals.find((m) => m.city === c.name && m.region === rb.region);
        if (earned) earnedCount++;
        if (earned && !prevMedal?.earned) {
          medalNotices.push({ id: genId('medal'), city: c.name, region: rb.region });
        }
        medals.push({
          city: c.name,
          region: rb.region,
          earned,
          earned_at: earned ? prevMedal?.earned_at ?? stamp : prevMedal?.earned_at,
        });
      });

      const entry = prev.region_entries.find((e) => e.region === rb.region);
      const boss_quest_completed = entry?.boss_completed ?? rb.boss_quest_completed;
      const chaos_roll = entry?.chaos_requirement ?? rb.chaos_roll;
      const charsInRegion = characters.filter(
        (c) => c.region === rb.region && c.counts_toward_region,
      ).length;
      const medals_total = cities.length;
      const medals_earned = earnedCount;
      const unlocked = medals_total > 0 && medals_earned === medals_total;
      if (unlocked && !rb.unlocked) {
        badgeNotices.push({ id: genId('badge'), kind: 'region', label: rb.region, sublabel: 'Region Badge' });
      }
      return {
        ...rb,
        boss_quest_completed,
        chaos_roll,
        characters_added: charsInRegion,
        medals_earned,
        medals_total,
        unlocked: unlocked || rb.unlocked,
        unlocked_at: unlocked && !rb.unlocked ? stamp : rb.unlocked_at,
      };
    });

    // Each country's badge measures only ITS OWN standard quests (scoped by the
    // region→country map) so countries never dilute one another's completion.
    let prestige = prev.player.prestige_countries;
    const country_badges: CountryBadge[] = buildInitialCountryBadges().map((base) => {
      const prevCountry = prev.country_badges.find((c) => c.code === base.code) ?? base;
      const countryQuests = allQuests.filter(
        (q) => countryForRegionKey(q.region)?.code === base.code,
      );
      const countryPct = getCompletionPct(countryQuests, completedIds);
      const countryUnlocked = countryPct >= BADGE_THRESHOLD.country;
      if (countryUnlocked && !prevCountry.unlocked) {
        badgeNotices.push({ id: genId('badge'), kind: 'country', label: base.country, sublabel: 'Country Conquered' });
        if (!prestige.includes(base.code)) prestige = [...prestige, base.code];
      }
      return {
        ...prevCountry,
        completion_pct: countryPct,
        unlocked: countryUnlocked || prevCountry.unlocked,
        unlocked_at: countryUnlocked && !prevCountry.unlocked ? stamp : prevCountry.unlocked_at,
      };
    });
    const player =
      prestige !== prev.player.prestige_countries
        ? { ...prev.player, prestige_countries: prestige }
        : prev.player;

    set((s) => ({
      medals,
      region_badges,
      country_badges,
      player,
      pendingMedals: [...s.pendingMedals, ...medalNotices],
      pendingBadges: [...s.pendingBadges, ...badgeNotices],
    }));

    setJSON(KEYS.MEDALS, medals);
    setJSON(KEYS.REGION_BADGES, region_badges);
    setJSON(KEYS.COUNTRY_BADGES, country_badges);
    setJSON(KEYS.PLAYER, player);
  },

  hydrate: () => {
    const stored = getJSON<PlayerState>(KEYS.PLAYER, initialPlayer);
    const player: PlayerState = { ...stored, appearance: normalizeAppearance(stored.appearance) };
    const medals = getJSON<CityMedal[]>(KEYS.MEDALS, []);
    // Reconcile persisted region badges against the CURRENT region model so a
    // changed region set (e.g. Gulf repurposed to Eastern, Western added)
    // picks up new regions and drops removed ones while preserving progress.
    const persistedRegionBadges = getJSON<RegionBadge[]>(KEYS.REGION_BADGES, []);
    const region_badges = buildInitialRegionBadges().map((base) => {
      const prev = persistedRegionBadges.find((p) => p.region === base.region);
      return prev ? { ...base, ...prev } : base;
    });
    // Reconcile persisted country badges against the current country set so a
    // newly-added country (e.g. Laos) appears and progress is preserved.
    const persistedCountryBadges = getJSON<CountryBadge[]>(KEYS.COUNTRY_BADGES, []);
    const country_badges = buildInitialCountryBadges().map((base) => {
      const prev = persistedCountryBadges.find((p) => p.code === base.code);
      return prev ? { ...base, ...prev } : base;
    });
    const region_entries = getJSON<RegionEntry[]>(KEYS.REGION_ENTRIES, []);
    const xp_log = getJSON<XPEvent[]>(KEYS.XP_LOG, []);
    const loc = getJSON<{ region: string | null; city: string | null; zone: string | null }>(
      KEYS.CURRENT_LOCATION,
      { region: null, city: null, zone: null },
    );
    const game_mode = getJSON<GameMode>(KEYS.GAME_MODE, 'odyssey');
    const odyssey_level = getJSON<number | null>(KEYS.ODYSSEY_LEVEL, 1);
    const odyssey_start = getJSON<string | null>(KEYS.ODYSSEY_START, null);
    // Recompute from completed quests so any legacy milestone/bonus XP banked
    // under a region is discarded; persist the cleaned value.
    const odyssey_region_xp = recomputeRegionXp();
    setJSON(KEYS.ODYSSEY_REGION_XP, odyssey_region_xp);
    // Empty until the player picks a starting region (player-directed unlock).
    const odyssey_unlocked = getJSON<string[]>(KEYS.ODYSSEY_UNLOCKED, []);
    const food_hall_rolls = getJSON<Record<string, FoodHallRoll>>(KEYS.FOOD_HALL_ROLLS, {});
    const milestones = getJSON<MilestoneRecord[]>(KEYS.MILESTONES_EARNED, []);
    const temple_rankings = getJSON<TempleRankings>(KEYS.TEMPLE_RANKINGS, { global: [], regional: {} });
    set({
      player,
      medals,
      region_badges,
      country_badges,
      region_entries,
      xp_log,
      current_region: loc.region,
      current_city: loc.city,
      current_zone: loc.zone,
      game_mode,
      odyssey_level,
      odyssey_start,
      odyssey_region_xp,
      odyssey_unlocked,
      food_hall_rolls,
      milestones,
      temple_rankings: {
        global: temple_rankings.global ?? [],
        regional: temple_rankings.regional ?? {},
      },
    });
  },

  resetGame: () => {
    set({
      player: initialPlayer,
      medals: [],
      region_badges: buildInitialRegionBadges(),
      country_badges: buildInitialCountryBadges(),
      region_entries: [],
      current_region: null,
      current_city: null,
      current_zone: null,
      xp_log: [],
      game_mode: 'odyssey',
      odyssey_level: 1,
      odyssey_start: null,
      odyssey_region_xp: {},
      odyssey_unlocked: [],
      food_hall_rolls: {},
      milestones: [],
      temple_rankings: { global: [], regional: {} },
      pendingLevelUp: null,
      pendingBadges: [],
      pendingMedals: [],
      pendingMilestones: [],
      pendingRegionComplete: null,
      lastXPGain: null,
    });
    setJSON(KEYS.PLAYER, initialPlayer);
    setJSON(KEYS.MEDALS, []);
    setJSON(KEYS.REGION_BADGES, buildInitialRegionBadges());
    setJSON(KEYS.COUNTRY_BADGES, buildInitialCountryBadges());
    setJSON(KEYS.REGION_ENTRIES, []);
    setJSON(KEYS.XP_LOG, []);
    // Without this, the next launch rehydrates the stale pre-reset location.
    setJSON(KEYS.CURRENT_LOCATION, { region: null, city: null, zone: null });
    setJSON(KEYS.GAME_MODE, 'odyssey');
    setJSON(KEYS.ODYSSEY_LEVEL, 1);
    setJSON(KEYS.ODYSSEY_START, null);
    setJSON(KEYS.ODYSSEY_REGION_XP, {});
    setJSON(KEYS.ODYSSEY_UNLOCKED, []);
    setJSON(KEYS.FOOD_HALL_ROLLS, {});
    setJSON(KEYS.MILESTONES_EARNED, []);
    setJSON(KEYS.TEMPLE_RANKINGS, { global: [], regional: {} });
  },
}));
