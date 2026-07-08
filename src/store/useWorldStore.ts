// ============================================================================
// useWorldStore — player-authored places (custom regions + cities/zones) that
// extend the built-in Thailand world. Quests created via Create Quest can be
// attached to these, and they appear on the Map under "MY PLACES".
// ============================================================================

import { create } from 'zustand';
import { KEYS, getJSON, setJSON } from '../storage/storage';
import { genId } from '../utils/helpers';

export interface CustomRegion {
  id: string;
  name: string; // also used as the region key
  accent: string;
}

export interface CustomCity {
  id: string;
  name: string;
  region: string; // region key (built-in region or a custom region name)
  zones: string[];
}

interface WorldState {
  customRegions: CustomRegion[];
  customCities: CustomCity[];
  hydrate: () => void;
  addRegion: (name: string, accent: string) => CustomRegion;
  addCity: (name: string, region: string, zones: string[]) => CustomCity;
  removeCity: (id: string) => void;
  removeRegion: (id: string) => void;
  reset: () => void;
}

export const useWorldStore = create<WorldState>((set, get) => ({
  customRegions: [],
  customCities: [],

  hydrate: () =>
    set({
      customRegions: getJSON<CustomRegion[]>(KEYS.CUSTOM_REGIONS, []),
      customCities: getJSON<CustomCity[]>(KEYS.CUSTOM_CITIES, []),
    }),

  addRegion: (name, accent) => {
    const existing = get().customRegions.find((r) => r.name.toLowerCase() === name.toLowerCase());
    if (existing) return existing;
    const region: CustomRegion = { id: genId('region'), name, accent };
    const customRegions = [...get().customRegions, region];
    set({ customRegions });
    setJSON(KEYS.CUSTOM_REGIONS, customRegions);
    const { useGameStore } = require('./useGameStore') as typeof import('./useGameStore');
    useGameStore.getState().checkMilestones();
    return region;
  },

  addCity: (name, region, zones) => {
    const city: CustomCity = {
      id: genId('city'),
      name,
      region,
      zones: zones.length ? zones : ['Highlights'],
    };
    const customCities = [...get().customCities, city];
    set({ customCities });
    setJSON(KEYS.CUSTOM_CITIES, customCities);
    const { useGameStore } = require('./useGameStore') as typeof import('./useGameStore');
    useGameStore.getState().checkMilestones();
    return city;
  },

  removeCity: (id) => {
    const customCities = get().customCities.filter((c) => c.id !== id);
    set({ customCities });
    setJSON(KEYS.CUSTOM_CITIES, customCities);
  },

  removeRegion: (id) => {
    const region = get().customRegions.find((r) => r.id === id);
    const customRegions = get().customRegions.filter((r) => r.id !== id);
    const customCities = region
      ? get().customCities.filter((c) => c.region !== region.name)
      : get().customCities;
    set({ customRegions, customCities });
    setJSON(KEYS.CUSTOM_REGIONS, customRegions);
    setJSON(KEYS.CUSTOM_CITIES, customCities);
  },

  reset: () => {
    set({ customRegions: [], customCities: [] });
    setJSON(KEYS.CUSTOM_REGIONS, []);
    setJSON(KEYS.CUSTOM_CITIES, []);
  },
}));
