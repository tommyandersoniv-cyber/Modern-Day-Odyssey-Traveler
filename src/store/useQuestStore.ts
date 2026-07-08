// ============================================================================
// useQuestStore — standard (side + legacy) + user-created quest inventory,
// completion, and progress queries.
//
// Inventory rules:
//   • Side + legacy + user-created quests share a 10-slot inventory.
//   • Chaos quests live in useChaosStore (separate 5-slot inventory).
//   • Boss quests are pinned state in useChaosStore (not in inventory).
// ============================================================================

import { create } from 'zustand';
import type { ArchiveEntry, LevelUpResult, MediaDraft, Quest } from '../types';
import { INVENTORY } from '../utils/constants';
import { loadRegularQuests, loadLegacyQuests, loadFoodQuests, loadLaosFoodQuests } from '../utils/quests';
import { getCategorySpread, getCompletionPct } from '../utils/badges';
import { KEYS, getJSON, setJSON } from '../storage/storage';
import { genId, nowISO } from '../utils/helpers';
import { persistQuestPhotos, persistQuestVideos } from '../utils/media';

export interface CompleteResult {
  entry: ArchiveEntry;
  levelUp: LevelUpResult;
}

interface QuestState {
  all_quests: Quest[]; // regular + legacy
  user_quests: Quest[];
  food_quests: Quest[]; // Food Hall — special cross-region food quests
  completed_quest_ids: string[];
  active_regular_ids: string[];
  loaded: boolean;

  loadQuestsFromJSON: () => void;
  hydrate: () => void;

  getQuestById: (id: string) => Quest | undefined;
  getQuestsByZone: (city: string, zone: string) => Quest[];
  getQuestsByCity: (city: string) => Quest[];
  getCompletionPct: (city: string, zone?: string) => number;
  getCategorySpread: (city: string, zone: string) => Record<string, boolean>;

  isActive: (questId: string) => boolean;
  isCompleted: (questId: string) => boolean;
  canAddToInventory: (type: 'regular' | 'chaos') => boolean;
  addToInventory: (quest: Quest) => boolean;
  removeFromInventory: (questId: string) => void;

  addUserQuest: (quest: Quest) => void;
  completeQuest: (questId: string, draft: MediaDraft) => Promise<CompleteResult | null>;
  drawRandomQuest: (scope?: { region?: string; city?: string; zone?: string }) => Quest | null;
  availableInScope: (scope?: { region?: string; city?: string; zone?: string }) => Quest[];
  reset: () => void;
}

export const useQuestStore = create<QuestState>((set, get) => ({
  all_quests: [],
  user_quests: [],
  food_quests: [],
  completed_quest_ids: [],
  active_regular_ids: [],
  loaded: false,

  loadQuestsFromJSON: () => {
    if (get().loaded) return;
    const base = [...loadRegularQuests(), ...loadLegacyQuests()];
    const completed = getJSON<string[]>(KEYS.COMPLETED_QUESTS, []);
    const userQuests = getJSON<Quest[]>(KEYS.USER_QUESTS, []);
    const activeRegular = getJSON<string[]>(KEYS.ACTIVE_REGULAR, []);
    // completed_at lives on the archive entry; restore it onto the quest so
    // recency ordering (e.g. the temple-ranking picker) survives a restart.
    const archive = getJSON<ArchiveEntry[]>(KEYS.ARCHIVE_ENTRIES, []);
    const completedAt = new Map(archive.map((e) => [e.quest_id, e.completed_at]));

    const markCompleted = (q: Quest): Quest => ({
      ...q,
      completed: completed.includes(q.id),
      status: completed.includes(q.id) ? ('completed' as const) : q.status,
      completed_at: completed.includes(q.id) ? completedAt.get(q.id) : undefined,
    });

    set({
      all_quests: base.map(markCompleted),
      user_quests: userQuests,
      food_quests: [...loadFoodQuests(), ...loadLaosFoodQuests()].map(markCompleted),
      completed_quest_ids: completed,
      active_regular_ids: activeRegular,
      loaded: true,
    });
  },

  hydrate: () => get().loadQuestsFromJSON(),

  getQuestById: (id) =>
    get().all_quests.find((q) => q.id === id) ??
    get().user_quests.find((q) => q.id === id) ??
    get().food_quests.find((q) => q.id === id),

  getQuestsByZone: (city, zone) =>
    [...get().all_quests, ...get().user_quests].filter((q) => q.city === city && q.zone === zone),

  getQuestsByCity: (city) =>
    [...get().all_quests, ...get().user_quests].filter((q) => q.city === city),

  getCompletionPct: (city, zone) => {
    const pool = get().all_quests.filter(
      (q) => q.city === city && (zone ? q.zone === zone : true),
    );
    return getCompletionPct(pool, get().completed_quest_ids);
  },

  getCategorySpread: (city, zone) =>
    getCategorySpread(city, zone, get().completed_quest_ids, get().all_quests).spread,

  isActive: (questId) => get().active_regular_ids.includes(questId),
  isCompleted: (questId) => get().completed_quest_ids.includes(questId),

  canAddToInventory: (type) => {
    if (type === 'chaos') {
      const { useChaosStore } = require('./useChaosStore') as typeof import('./useChaosStore');
      return useChaosStore.getState().active_chaos_ids.length < INVENTORY.chaosSlots;
    }
    return get().active_regular_ids.length < INVENTORY.regularSlots;
  },

  addToInventory: (quest) => {
    if (get().active_regular_ids.includes(quest.id)) return true;
    if (get().completed_quest_ids.includes(quest.id)) return false;
    if (get().active_regular_ids.length >= INVENTORY.regularSlots) return false;
    const active_regular_ids = [...get().active_regular_ids, quest.id];
    set({ active_regular_ids });
    setJSON(KEYS.ACTIVE_REGULAR, active_regular_ids);
    return true;
  },

  removeFromInventory: (questId) => {
    const active_regular_ids = get().active_regular_ids.filter((id) => id !== questId);
    set({ active_regular_ids });
    setJSON(KEYS.ACTIVE_REGULAR, active_regular_ids);
  },

  addUserQuest: (quest) => {
    const user_quests = [quest, ...get().user_quests];
    set({ user_quests });
    setJSON(KEYS.USER_QUESTS, user_quests);
    const { useGameStore } = require('./useGameStore') as typeof import('./useGameStore');
    useGameStore.getState().checkMilestones();
  },

  completeQuest: async (questId, draft) => {
    const quest = get().getQuestById(questId);
    if (!quest) return null;
    if (get().completed_quest_ids.includes(questId)) return null;

    // 1. Persist media into the document directory.
    const photo_uris = await persistQuestPhotos(questId, draft.photo_uris);
    const video_uris = await persistQuestVideos(questId, draft.video_uris);
    const cover_photo_uri =
      draft.cover_photo_uri && photo_uris.length
        ? photo_uris[Math.max(0, draft.photo_uris.indexOf(draft.cover_photo_uri))]
        : photo_uris[0];

    const xpEarned = quest.xp;

    // 2. Build + store the archive entry.
    const entry: ArchiveEntry = {
      id: genId('arch'),
      quest_id: quest.id,
      quest_title: quest.title,
      quest_type: quest.type,
      region: quest.region ?? 'Cross-Region',
      city: quest.city,
      zone: quest.zone,
      completed_at: nowISO(),
      xp_earned: xpEarned,
      photo_uris,
      cover_photo_uri,
      video_uris,
      journal_entry: draft.journal_entry || undefined,
      is_food: quest.is_food || undefined,
      food_category: quest.food_category,
      food_tier: quest.food_tier,
    };
    const { useArchiveStore } = require('./useArchiveStore') as typeof import('./useArchiveStore');
    useArchiveStore.getState().addEntry(entry);

    // 3. Mark completed + remove from inventory.
    const completed_quest_ids = [...get().completed_quest_ids, quest.id];
    const active_regular_ids = get().active_regular_ids.filter((id) => id !== quest.id);
    const markDone = (q: Quest): Quest =>
      q.id === quest.id
        ? { ...q, completed: true, status: 'completed', completed_at: entry.completed_at, archive_entry_id: entry.id }
        : q;
    const all_quests = get().all_quests.map(markDone);
    const user_quests = get().user_quests.map(markDone);
    const food_quests = get().food_quests.map(markDone);

    set({ completed_quest_ids, active_regular_ids, all_quests, user_quests, food_quests });
    setJSON(KEYS.COMPLETED_QUESTS, completed_quest_ids);
    setJSON(KEYS.ACTIVE_REGULAR, active_regular_ids);
    setJSON(KEYS.USER_QUESTS, user_quests);

    // 4. Award XP + recompute badges.
    const { useGameStore } = require('./useGameStore') as typeof import('./useGameStore');
    const levelUp = useGameStore.getState().addXP(xpEarned, `quest:${quest.id}`);
    useGameStore.getState().recomputeBadges();
    useGameStore.getState().checkMilestones();

    return { entry, levelUp };
  },

  availableInScope: (scope) => {
    const exclude = new Set([...get().active_regular_ids, ...get().completed_quest_ids]);
    // Food quests are drawable too (they carry a region + city, no zone).
    return [...get().all_quests, ...get().user_quests, ...get().food_quests].filter(
      (q) =>
        !exclude.has(q.id) &&
        (!scope?.region || q.region === scope.region) &&
        (!scope?.city || q.city === scope.city) &&
        (!scope?.zone || q.zone === scope.zone),
    );
  },

  drawRandomQuest: (scope) => {
    if (get().active_regular_ids.length >= INVENTORY.regularSlots) return null;
    let pool = get().availableInScope(scope);
    // With no explicit scope, prefer the region currently being explored.
    if (!scope) {
      const { useGameStore } = require('./useGameStore') as typeof import('./useGameStore');
      const region = useGameStore.getState().current_region;
      if (region) {
        const regional = pool.filter((q) => q.region === region);
        if (regional.length) pool = regional;
      }
    }
    if (pool.length === 0) return null;
    const pick = pool[Math.floor(Math.random() * pool.length)];
    get().addToInventory(pick);
    return pick;
  },

  reset: () => {
    const clearDone = (q: Quest): Quest => ({
      ...q,
      completed: false,
      status: 'available' as const,
      completed_at: undefined,
      archive_entry_id: undefined,
    });
    const all_quests = get().all_quests.map(clearDone);
    const food_quests = get().food_quests.map(clearDone);
    set({ all_quests, food_quests, user_quests: [], completed_quest_ids: [], active_regular_ids: [] });
    setJSON(KEYS.COMPLETED_QUESTS, []);
    setJSON(KEYS.ACTIVE_REGULAR, []);
    setJSON(KEYS.USER_QUESTS, []);
  },
}));
