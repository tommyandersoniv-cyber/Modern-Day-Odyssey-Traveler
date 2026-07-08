// ============================================================================
// Laos — the second playable country. Mirrors Thailand's structure exactly:
// world map → country → regions → cities/zones → quests.
//
// Regions, cities, and their zone maps are derived DIRECTLY from the quest data
// (src/data/laos_regular_quests.json) so nothing is invented: region keys match
// each city's `region` field, city zone lists match the source `zones` arrays,
// and quests slot in by city + zone exactly as provided.
// ============================================================================

import type { CityMeta, RegionMeta } from '../types';
import { COLORS, gridZoneLayout } from './constants';
import laosData from '../data/laos_regular_quests.json';

type RawAny = Record<string, any>;
const LAOS_CITY_DATA = (laosData as RawAny).cities ?? [];

// The five Laos regions, in north→south order. Region `key` values match the
// `region` field on every Laos city/quest, so the existing region-keyed world
// model (cities, quests, badges) keys off them with no special-casing.
const LAOS_REGION_DEFS: Array<{
  id: string;
  name: string;
  key: string;
  layout: { x: number; y: number; w: number; h: number };
  accent: string;
}> = [
  { id: 'la_far_north', name: 'Far North', key: 'Far North', layout: { x: 16, y: 4, w: 68, h: 15 }, accent: COLORS.GOLD },
  { id: 'la_northwest', name: 'Northwest Corridor', key: 'Northwest Corridor', layout: { x: 6, y: 23, w: 48, h: 16 }, accent: COLORS.BLUE },
  { id: 'la_east_ne', name: 'East & Northeast', key: 'East & Northeast', layout: { x: 56, y: 23, w: 38, h: 16 }, accent: COLORS.ORANGE },
  { id: 'la_central', name: 'Central Belt', key: 'Central Belt', layout: { x: 26, y: 43, w: 56, h: 16 }, accent: COLORS.TEAL },
  // Ends at x=77 so the gap to the Food Hall tile (x=80) matches the
  // Legendary↔Central Belt spacing (3).
  { id: 'la_south', name: 'South', key: 'South', layout: { x: 18, y: 63, w: 59, h: 32 }, accent: COLORS.GREEN },
];

/** City names belonging to a region, in source order. */
function citiesInRegion(regionKey: string): string[] {
  return LAOS_CITY_DATA.filter((c: RawAny) => c.region === regionKey).map((c: RawAny) => String(c.name));
}

/** The Laos region overworld (same RegionMeta shape Thailand uses). */
export const LAOS_REGIONS: RegionMeta[] = LAOS_REGION_DEFS.map((r) => ({
  id: r.id,
  name: r.name,
  region: r.key,
  active: true,
  cities: citiesInRegion(r.key),
  layout: r.layout,
  accent: r.accent,
}));

/** Every Laos city as a detailed CityMeta with a computed zone map, so each
 *  city drills down to its zones exactly as grouped in the source data. */
export const LAOS_CITIES: CityMeta[] = LAOS_CITY_DATA.map((c: RawAny) => {
  const zones: string[] = (c.zones ?? []).map(String);
  return {
    id: String(c.id),
    name: String(c.name),
    region: String(c.region),
    zones,
    total_quests: Number(c.total_quests ?? (c.quests?.length ?? 0)),
    zoneLayout: gridZoneLayout(zones, zones.length >= 5 ? 3 : 2),
  };
});
