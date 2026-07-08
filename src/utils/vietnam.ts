// ============================================================================
// Vietnam — the fourth playable country. Mirrors Cambodia/Laos exactly:
// world map → country → regions → cities/zones → quests.
//
// Regions, cities, and their zone maps are derived DIRECTLY from the quest data
// (src/data/vietnam_regular_quests.json) so nothing is invented: region keys
// match each city's `region` field, city zone lists match the source `zones`
// arrays, and quests slot in by city + zone exactly as provided.
//
// Region keys are the renamed, globally-unique forms (the raw data's bare
// "North"/"South" collided with Laos's "South"); see the data-file transform.
// ============================================================================

import type { CityMeta, RegionMeta } from '../types';
import { gridZoneLayout } from './constants';
import vietnamData from '../data/vietnam_regular_quests.json';

type RawAny = Record<string, any>;
const VIETNAM_CITY_DATA = (vietnamData as RawAny).cities ?? [];

// Vietnam's five macro-regions, laid out N→S as a 2-2-1 grid (rows 1-3); the
// Food Hall + Legendary Quests halls form row 4, added in MapScreen. Y-extents
// fill the map container top-to-bottom. Red palette mirrors the flag and keeps
// Vietnam visually distinct from Thailand (gold), Laos (green), Cambodia (orange).
const VIETNAM_REGION_DEFS: Array<{
  id: string;
  name: string;
  key: string;
  layout: { x: number; y: number; w: number; h: number };
  accent: string;
}> = [
  { id: 'vn_north', name: 'Northern Vietnam', key: 'Northern Vietnam', layout: { x: 6, y: 3, w: 42, h: 19 }, accent: '#E53935' },
  { id: 'vn_north_central', name: 'North-Central Coast', key: 'North-Central Coast', layout: { x: 52, y: 3, w: 42, h: 19 }, accent: '#D32F2F' },
  { id: 'vn_highlands', name: 'Central Highlands', key: 'Central Highlands', layout: { x: 6, y: 26, w: 42, h: 19 }, accent: '#EF5350' },
  { id: 'vn_south', name: 'Southern Vietnam', key: 'Southern Vietnam', layout: { x: 52, y: 26, w: 42, h: 19 }, accent: '#C62828' },
  { id: 'vn_mekong', name: 'Mekong Delta', key: 'Mekong Delta', layout: { x: 29, y: 49, w: 42, h: 19 }, accent: '#B71C1C' },
];

/** City names belonging to a region, in source order. */
function citiesInRegion(regionKey: string): string[] {
  return VIETNAM_CITY_DATA.filter((c: RawAny) => c.region === regionKey).map((c: RawAny) => String(c.name));
}

/** The Vietnam region overworld (same RegionMeta shape the others use). */
export const VIETNAM_REGIONS: RegionMeta[] = VIETNAM_REGION_DEFS.map((r) => ({
  id: r.id,
  name: r.name,
  region: r.key,
  active: true,
  cities: citiesInRegion(r.key),
  layout: r.layout,
  accent: r.accent,
}));

/** Every Vietnam city as a detailed CityMeta with a computed zone map, so each
 *  city drills down to its zones exactly as grouped in the source data. */
export const VIETNAM_CITIES: CityMeta[] = VIETNAM_CITY_DATA.map((c: RawAny) => {
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
