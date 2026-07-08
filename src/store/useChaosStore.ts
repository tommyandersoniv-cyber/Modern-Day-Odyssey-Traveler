// ============================================================================
// useChaosStore — chaos quest pool, boss wheel, daily/on-demand draws, and the
// separate 5-slot chaos inventory.
// ============================================================================

import { create } from 'zustand';
import type { ArchiveEntry, MediaDraft, Quest } from '../types';
import { CHAOS_MULTIPLIER, INVENTORY } from '../utils/constants';
import { loadChaosQuests, bossWheelQuests } from '../utils/quests';
import { weightedDraw, rollD20, pickRandom } from '../utils/chaos';
import { KEYS, getJSON, setJSON, getString, setString } from '../storage/storage';
import { genId, nowISO } from '../utils/helpers';
import { persistQuestPhotos, persistQuestVideos } from '../utils/media';
import type { CompleteResult } from './useQuestStore';

interface ChaosState {
  chaos_pool: Quest[];
  boss_wheel_quests: Quest[];
  active_chaos_ids: string[];
  completed_chaos_ids: string[];
  active_boss_quest_id: string | null;
  loaded: boolean;

  loadChaosFromJSON: () => void;
  hydrate: () => void;

  getQuestById: (id: string) => Quest | undefined;
  isActive: (id: string) => boolean;
  isCompleted: (id: string) => boolean;

  drawOnDemand: () => Quest | null;
  removeFromActive: (id: string) => void;

  spinBossWheel: () => Quest | null;
  setActiveBoss: (questId: string) => void;
  rollChaosRequirement: () => number;

  completeChaosQuest: (questId: string, draft: MediaDraft) => Promise<CompleteResult | null>;
  reset: () => void;
}

export const useChaosStore = create<ChaosState>((set, get) => ({
  chaos_pool: [],
  boss_wheel_quests: [],
  active_chaos_ids: [],
  completed_chaos_ids: [],
  active_boss_quest_id: null,
  loaded: false,

  loadChaosFromJSON: () => {
    if (get().loaded) return;
    const pool = loadChaosQuests();
    const completed = getJSON<string[]>(KEYS.COMPLETED_CHAOS, []);
    set({
      chaos_pool: pool.map((q) => ({ ...q, completed: completed.includes(q.id) })),
      boss_wheel_quests: bossWheelQuests(),
      active_chaos_ids: getJSON<string[]>(KEYS.ACTIVE_CHAOS, []),
      completed_chaos_ids: completed,
      active_boss_quest_id: getString(KEYS.ACTIVE_BOSS, '') || null,
      loaded: true,
    });
  },

  hydrate: () => get().loadChaosFromJSON(),

  getQuestById: (id) => get().chaos_pool.find((q) => q.id === id),
  isActive: (id) => get().active_chaos_ids.includes(id),
  isCompleted: (id) => get().completed_chaos_ids.includes(id),

  drawOnDemand: () => {
    // Draw freely up to the 5-slot chaos limit.
    if (get().active_chaos_ids.length >= INVENTORY.chaosSlots) return null;
    const exclude = [...get().active_chaos_ids, ...get().completed_chaos_ids];
    let drawn = weightedDraw(get().chaos_pool.filter((q) => !q.is_boss_wheel), exclude);
    // Pool exhausted (everything active/completed) - allow re-draw.
    if (!drawn) drawn = weightedDraw(get().chaos_pool.filter((q) => !q.is_boss_wheel));
    if (!drawn) return null;
    const active_chaos_ids = [...get().active_chaos_ids, drawn.id];
    set({ active_chaos_ids });
    setJSON(KEYS.ACTIVE_CHAOS, active_chaos_ids);
    return drawn;
  },

  removeFromActive: (id) => {
    const active_chaos_ids = get().active_chaos_ids.filter((x) => x !== id);
    set({ active_chaos_ids });
    setJSON(KEYS.ACTIVE_CHAOS, active_chaos_ids);
  },

  spinBossWheel: () => {
    const pool = get().boss_wheel_quests;
    const winner = pickRandom(pool);
    if (winner) {
      set({ active_boss_quest_id: winner.id });
      setString(KEYS.ACTIVE_BOSS, winner.id);
    }
    return winner;
  },

  setActiveBoss: (questId) => {
    set({ active_boss_quest_id: questId });
    setString(KEYS.ACTIVE_BOSS, questId);
  },

  rollChaosRequirement: () => rollD20(),

  completeChaosQuest: async (questId, draft) => {
    const quest = get().getQuestById(questId);
    if (!quest) return null;
    if (get().completed_chaos_ids.includes(questId)) return null;

    const photo_uris = await persistQuestPhotos(questId, draft.photo_uris);
    const video_uris = await persistQuestVideos(questId, draft.video_uris);
    const cover_photo_uri =
      draft.cover_photo_uri && photo_uris.length
        ? photo_uris[Math.max(0, draft.photo_uris.indexOf(draft.cover_photo_uri))]
        : photo_uris[0];

    const xpEarned = quest.xp_with_multiplier ?? quest.xp * CHAOS_MULTIPLIER;
    const isBoss = quest.is_boss_wheel || questId === get().active_boss_quest_id;

    const { useGameStore } = require('./useGameStore') as typeof import('./useGameStore');
    const g0 = useGameStore.getState();
    // Attribute to the active region, falling back to the most recently entered
    // region so a chaos quest completed without a live current_region still has
    // location context (and counts toward that region's quota below).
    const lastEntry = g0.region_entries[g0.region_entries.length - 1];
    const attributedRegion = g0.current_region ?? lastEntry?.region ?? null;
    const region = attributedRegion ?? 'Cross-Region';

    const entry: ArchiveEntry = {
      id: genId('arch'),
      quest_id: quest.id,
      quest_title: quest.title,
      quest_type: isBoss ? 'boss' : 'chaos',
      region,
      city: g0.current_city ?? undefined,
      zone: g0.current_zone ?? undefined,
      completed_at: nowISO(),
      xp_earned: xpEarned,
      photo_uris,
      cover_photo_uri,
      video_uris,
      journal_entry: draft.journal_entry || undefined,
    };
    const { useArchiveStore } = require('./useArchiveStore') as typeof import('./useArchiveStore');
    useArchiveStore.getState().addEntry(entry);

    const completed_chaos_ids = [...get().completed_chaos_ids, quest.id];
    const active_chaos_ids = get().active_chaos_ids.filter((id) => id !== quest.id);
    const chaos_pool = get().chaos_pool.map((q) =>
      q.id === quest.id ? { ...q, completed: true } : q,
    );
    const clearBoss = get().active_boss_quest_id === quest.id;

    set({
      completed_chaos_ids,
      active_chaos_ids,
      chaos_pool,
      active_boss_quest_id: clearBoss ? null : get().active_boss_quest_id,
    });
    setJSON(KEYS.COMPLETED_CHAOS, completed_chaos_ids);
    setJSON(KEYS.ACTIVE_CHAOS, active_chaos_ids);
    if (clearBoss) setString(KEYS.ACTIVE_BOSS, '');

    // Boss completion - mark the owning region's boss as done.
    const game = useGameStore.getState();
    const owningEntry = game.region_entries.find((e) => e.boss_quest_id === quest.id);
    if (isBoss && owningEntry) {
      game.setBossCompleted(owningEntry.region);
    }

    // Count toward the active region's chaos quota (non-boss chaos), falling
    // back to the most recently entered region when no current region is set.
    const quotaRegion = game.current_region ?? attributedRegion;
    if (!isBoss && quotaRegion) {
      game.incrementRegionChaos(quotaRegion);
    }

    const levelUp = game.addXP(xpEarned, `chaos:${quest.id}`);
    game.recomputeBadges();
    game.checkMilestones();

    return { entry, levelUp };
  },

  reset: () => {
    const chaos_pool = get().chaos_pool.map((q) => ({ ...q, completed: false }));
    set({
      chaos_pool,
      active_chaos_ids: [],
      completed_chaos_ids: [],
      active_boss_quest_id: null,
    });
    setJSON(KEYS.COMPLETED_CHAOS, []);
    setJSON(KEYS.ACTIVE_CHAOS, []);
    setString(KEYS.ACTIVE_BOSS, '');
  },
}));
