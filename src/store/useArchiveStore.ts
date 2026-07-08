// ============================================================================
// useArchiveStore — the permanent record of completed quests (media + journal).
// ============================================================================

import { create } from 'zustand';
import type { ArchiveEntry } from '../types';
import { KEYS, getJSON, setJSON } from '../storage/storage';

interface ArchiveState {
  entries: ArchiveEntry[];
  hydrate: () => void;
  addEntry: (entry: ArchiveEntry) => void;
  getById: (id: string) => ArchiveEntry | undefined;
  getByQuestId: (questId: string) => ArchiveEntry | undefined;
  getByRegion: (region: string) => ArchiveEntry[];
  getByCity: (city: string) => ArchiveEntry[];
  removeEntry: (id: string) => void;
  reset: () => void;
}

export const useArchiveStore = create<ArchiveState>((set, get) => ({
  entries: [],

  hydrate: () => set({ entries: getJSON<ArchiveEntry[]>(KEYS.ARCHIVE_ENTRIES, []) }),

  addEntry: (entry) => {
    const entries = [entry, ...get().entries];
    set({ entries });
    setJSON(KEYS.ARCHIVE_ENTRIES, entries);
  },

  getById: (id) => get().entries.find((e) => e.id === id),
  getByQuestId: (questId) => get().entries.find((e) => e.quest_id === questId),
  getByRegion: (region) => get().entries.filter((e) => e.region === region),
  getByCity: (city) => get().entries.filter((e) => e.city === city),

  removeEntry: (id) => {
    const entries = get().entries.filter((e) => e.id !== id);
    set({ entries });
    setJSON(KEYS.ARCHIVE_ENTRIES, entries);
  },

  reset: () => {
    set({ entries: [] });
    setJSON(KEYS.ARCHIVE_ENTRIES, []);
  },
}));
