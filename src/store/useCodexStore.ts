// ============================================================================
// useCodexStore — Character Codex (people met - pixel character cards).
// ============================================================================

import { create } from 'zustand';
import type { Character, CharacterAppearance, LevelUpResult } from '../types';
import {
  CHARACTER_BASE_XP,
  CHARACTER_NOTE_BONUS_WORDS,
  CHARACTER_NOTE_BONUS_XP,
} from '../utils/constants';
import { KEYS, getJSON, setJSON } from '../storage/storage';
import { genId, nowISO, wordCount } from '../utils/helpers';
import { persistCharacterOriginal } from '../utils/media';

export interface CharacterDraft {
  name: string;
  nickname?: string;
  region: string;
  city?: string;
  zone?: string;
  custom_location?: string;
  photo_uri?: string; // raw uploaded/captured photo — optional (no pixelization)
  appearance?: CharacterAppearance; // custom pixel sprite — optional, can coexist with a photo
  one_thing_learned: string;
  note?: string;
}

export interface AddCharacterResult {
  character: Character;
  levelUp: LevelUpResult;
}

interface CodexState {
  characters: Character[];
  hydrate: () => void;
  getById: (id: string) => Character | undefined;
  getByRegion: (region: string) => Character[];
  getByCity: (city: string) => Character[];
  charactersInRegion: (region: string) => number;
  addCharacter: (draft: CharacterDraft) => Promise<AddCharacterResult>;
  removeCharacter: (id: string) => void;
  reset: () => void;
}

export const useCodexStore = create<CodexState>((set, get) => ({
  characters: [],

  hydrate: () => set({ characters: getJSON<Character[]>(KEYS.CHARACTER_CODEX, []) }),

  getById: (id) => get().characters.find((c) => c.id === id),
  getByRegion: (region) => get().characters.filter((c) => c.region === region),
  getByCity: (city) => get().characters.filter((c) => c.city === city),
  charactersInRegion: (region) =>
    get().characters.filter((c) => c.region === region && c.counts_toward_region).length,

  addCharacter: async (draft) => {
    const id = genId('char');
    // Photos are stored as-is (no pixelization); a character may have a photo,
    // a custom sprite, both, or neither. The avatar image mirrors the photo.
    const photo_uri = draft.photo_uri ? await persistCharacterOriginal(id, draft.photo_uri) : '';
    const pixel_avatar_uri = photo_uri;

    const noteWords = wordCount(draft.note);
    const xp_awarded =
      CHARACTER_BASE_XP + (noteWords > CHARACTER_NOTE_BONUS_WORDS ? CHARACTER_NOTE_BONUS_XP : 0);

    const character: Character = {
      id,
      name: draft.name,
      nickname: draft.nickname,
      region: draft.region,
      city: draft.city,
      zone: draft.zone,
      custom_location: draft.custom_location,
      date_met: nowISO(),
      photo_uri,
      pixel_avatar_uri,
      appearance: draft.appearance,
      one_thing_learned: draft.one_thing_learned,
      note: draft.note,
      xp_awarded,
      counts_toward_region: true,
    };

    const characters = [character, ...get().characters];
    set({ characters });
    setJSON(KEYS.CHARACTER_CODEX, characters);

    const { useGameStore } = require('./useGameStore') as typeof import('./useGameStore');
    const levelUp = useGameStore.getState().addXP(xp_awarded, `character:${id}`);
    useGameStore.getState().recomputeBadges();
    useGameStore.getState().checkMilestones();

    return { character, levelUp };
  },

  removeCharacter: (id) => {
    const characters = get().characters.filter((c) => c.id !== id);
    set({ characters });
    setJSON(KEYS.CHARACTER_CODEX, characters);
    const { useGameStore } = require('./useGameStore') as typeof import('./useGameStore');
    useGameStore.getState().recomputeBadges();
  },

  reset: () => {
    set({ characters: [] });
    setJSON(KEYS.CHARACTER_CODEX, []);
  },
}));
