// ============================================================================
// World model — merges the built-in Thailand regions/cities with data-derived
// cities (places that appear in quest data but have no detailed zone map) and
// player-authored custom places. Single source of truth for the Map screen.
// ============================================================================

import type { CityMeta, Coord, Quest, RegionMeta } from '../types';
import { CITIES, CITY_MAP_MIN_QUESTS, gridZoneLayout } from './constants';
import { LAOS_CITIES } from './laos';
import { CAMBODIA_CITIES } from './cambodia';
import { VIETNAM_CITIES } from './vietnam';
import { allBuiltInRegions } from './countries';
import { DataCity, dataCities, loadAllStandardQuests } from './quests';
import { useWorldStore } from '../store/useWorldStore';

/** Every hand-authored detailed city (with a bespoke zone map) across all
 *  available countries. These always win over data-derived layouts. */
const DETAILED_CITIES: CityMeta[] = [...CITIES, ...LAOS_CITIES, ...CAMBODIA_CITIES, ...VIETNAM_CITIES];

export interface WorldCity {
  name: string;
  region: string;
  detailed: boolean; // has a real zone map
  zones: string[];
  custom: boolean;
  /** Number of quests in this city (drives the >8 own-map threshold). */
  questCount: number;
  /** City centre, when known — used to place small cities on the "More" map. */
  base_coordinates?: Coord;
}

let _standard: Quest[] | null = null;
function standard(): Quest[] {
  if (!_standard) _standard = loadAllStandardQuests();
  return _standard;
}

/** cityName → its authored DataCity record (zones, centre, quest count). */
let _dataByName: Map<string, DataCity> | null = null;
function dataByName(): Map<string, DataCity> {
  if (!_dataByName) _dataByName = new Map(dataCities().map((c) => [c.name, c]));
  return _dataByName;
}

/** Live quest count per city across the loaded standard datasets. */
let _countByCity: Map<string, number> | null = null;
function countByCity(): Map<string, number> {
  if (!_countByCity) {
    const m = new Map<string, number>();
    standard().forEach((q) => {
      if (q.city) m.set(q.city, (m.get(q.city) ?? 0) + 1);
    });
    _countByCity = m;
  }
  return _countByCity;
}

/** How many quests a city has (for the own-map threshold). */
export function cityQuestCount(name: string): number {
  return countByCity().get(name) ?? dataByName().get(name)?.quest_count ?? 0;
}

/** A data-derived city qualifies for its own zone map when it has >8 quests and
 *  carries a zone breakdown to lay out. */
function dataCityIsDetailed(name: string): boolean {
  const dc = dataByName().get(name);
  return !!dc && dc.zones.length > 0 && cityQuestCount(name) >= CITY_MAP_MIN_QUESTS;
}

/** Build a CityMeta (with a generated zone layout) from authored city data. */
function dataCityMeta(dc: DataCity): CityMeta {
  return {
    id: dc.name.toLowerCase().replace(/[^a-z0-9]+/g, '_'),
    name: dc.name,
    region: dc.region,
    zones: dc.zones,
    total_quests: cityQuestCount(dc.name),
    zoneLayout: gridZoneLayout(dc.zones, dc.zones.length >= 5 ? 3 : 2),
    base_coordinates: dc.base_coordinates ?? undefined,
  };
}

/** Every built-in region across all available countries (Thailand + Laos +
 *  Cambodia), fully unlocked (incl. Thailand's Cross-Region Bucket List). */
export function builtInRegions(): RegionMeta[] {
  return allBuiltInRegions().map((r) => ({ ...r, active: true }));
}

/** Player-created regions, rendered as RegionMeta for the "My Places" section. */
export function customRegionMetas(): RegionMeta[] {
  return useWorldStore.getState().customRegions.map((cr, i) => ({
    id: cr.id,
    name: cr.name,
    region: cr.name,
    active: true,
    cities: [],
    layout: { x: 6 + (i % 2) * 48, y: 6 + Math.floor(i / 2) * 30, w: 40, h: 24 },
    accent: cr.accent,
  }));
}

export function regionByKey(key: string): RegionMeta | undefined {
  return [...builtInRegions(), ...customRegionMetas()].find((r) => r.region === key);
}

export function isCustomRegion(key: string): boolean {
  return useWorldStore.getState().customRegions.some((r) => r.name === key);
}

/** Every city in a region: detailed (zone map) + data-derived + custom. */
export function getRegionCities(regionKey: string): WorldCity[] {
  const out: WorldCity[] = [];
  const seen = new Set<string>();

  DETAILED_CITIES.filter((c) => c.region === regionKey).forEach((c) => {
    out.push({
      name: c.name,
      region: regionKey,
      detailed: true,
      zones: c.zones,
      custom: false,
      questCount: cityQuestCount(c.name),
      base_coordinates: c.base_coordinates ?? dataByName().get(c.name)?.base_coordinates ?? undefined,
    });
    seen.add(c.name);
  });

  standard()
    .filter((q) => q.region === regionKey && q.city)
    .forEach((q) => {
      const n = q.city as string;
      if (!seen.has(n)) {
        seen.add(n);
        const dc = dataByName().get(n);
        out.push({
          name: n,
          region: regionKey,
          // >8 quests with a zone breakdown → its own zone map; else it lives
          // on the region "More" map as a single city marker.
          detailed: dataCityIsDetailed(n),
          zones: dc?.zones ?? [],
          custom: false,
          questCount: cityQuestCount(n),
          base_coordinates: dc?.base_coordinates ?? undefined,
        });
      }
    });

  useWorldStore
    .getState()
    .customCities.filter((c) => c.region === regionKey)
    .forEach((c) => {
      if (!seen.has(c.name)) {
        seen.add(c.name);
        out.push({
          name: c.name,
          region: regionKey,
          detailed: c.zones.length > 0,
          zones: c.zones,
          custom: true,
          questCount: cityQuestCount(c.name),
        });
      }
    });

  return out;
}

/** A CityMeta (with a zone layout) for any mappable city, or undefined if the
 *  city has no zones (then it's shown as a flat quest list, not a zone map). */
export function worldCityMeta(cityName: string): CityMeta | undefined {
  const detailed = DETAILED_CITIES.find((c) => c.name === cityName);
  if (detailed) {
    // Enrich hand-authored cities with a data centre coordinate when available.
    const base = detailed.base_coordinates ?? dataByName().get(cityName)?.base_coordinates;
    return base ? { ...detailed, base_coordinates: base } : detailed;
  }
  // Data-derived city with >8 quests → generated zone map.
  if (dataCityIsDetailed(cityName)) {
    return dataCityMeta(dataByName().get(cityName)!);
  }
  const custom = useWorldStore.getState().customCities.find((c) => c.name === cityName);
  if (custom && custom.zones.length) {
    return {
      id: custom.id,
      name: custom.name,
      region: custom.region,
      zones: custom.zones,
      total_quests: 0,
      zoneLayout: gridZoneLayout(custom.zones, custom.zones.length > 4 ? 3 : 2),
    };
  }
  return undefined;
}

/** All region keys that exist as targets for new quests/places. */
export function allRegionKeys(): string[] {
  return [...builtInRegions(), ...customRegionMetas()].map((r) => r.region);
}
