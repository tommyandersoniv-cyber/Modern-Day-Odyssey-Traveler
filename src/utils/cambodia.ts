// ============================================================================
// Cambodia — the third playable country. Mirrors Laos's structure exactly:
// world map → country → regions → cities/zones → quests.
//
// Regions, cities, and their zone maps are derived DIRECTLY from the quest data
// (src/data/cambodia_regular_quests.json) so nothing is invented: region keys
// match each city's `region` field, city zone lists match the source `zones`
// arrays, and quests slot in by city + zone exactly as provided.
// ============================================================================

import type { CityMeta, RegionMeta } from '../types';
import { COLORS, gridZoneLayout } from './constants';
import cambodiaData from '../data/cambodia_regular_quests.json';

type RawAny = Record<string, any>;
const CAMBODIA_CITY_DATA = (cambodiaData as RawAny).cities ?? [];

// Cambodia's ten regions. Region `key` values match the `region` field on every
// Cambodia city/quest, so the existing region-keyed world model (cities, quests,
// badges) keys off them with no special-casing. Layouts are 0-100 percentage
// tiles on the country region overworld, arranged roughly geographically.
// `Nationwide` is a cross-region bucket (the "Food & Extreme" collection) — it
// gets a distinct outline so it reads as a hall rather than a place, matching
// the country file's guidance to treat it like the Food Hall.
const CAMBODIA_REGION_DEFS: Array<{
  id: string;
  name: string;
  key: string;
  layout: { x: number; y: number; w: number; h: number };
  accent: string;
  outline?: string;
}> = [
  // Rows 1-2 are 3-column geographic regions; row 3 is the two southern regions
  // centered (South Coast now absorbs the former "South Coast Islands"). Row 4
  // (the Food Hall + Legendary Quests halls) is added in MapScreen. Y-extents
  // fill the map container top-to-bottom so there's no dead space at the bottom.
  { id: 'kh_remote_nw', name: 'Remote Northwest', key: 'Remote Northwest', layout: { x: 6, y: 3, w: 26, h: 20 }, accent: '#FF9800' },
  { id: 'kh_northern', name: 'Northern Cambodia', key: 'Northern Cambodia', layout: { x: 35, y: 3, w: 30, h: 20 }, accent: '#FB8C00' },
  { id: 'kh_northeast', name: 'Northeast Highlands', key: 'Northeast Highlands', layout: { x: 68, y: 3, w: 26, h: 20 }, accent: '#F57C00' },
  { id: 'kh_northwest', name: 'Northwest Cambodia', key: 'Northwest Cambodia', layout: { x: 6, y: 27, w: 26, h: 20 }, accent: '#FFA726' },
  { id: 'kh_central', name: 'Central Cambodia', key: 'Central Cambodia', layout: { x: 35, y: 27, w: 30, h: 20 }, accent: '#FFB300' },
  { id: 'kh_mekong', name: 'Mekong Corridor', key: 'Mekong Corridor', layout: { x: 68, y: 27, w: 26, h: 20 }, accent: '#EF6C00' },
  { id: 'kh_southwest', name: 'Southwest Cambodia', key: 'Southwest Cambodia', layout: { x: 13, y: 51, w: 30, h: 20 }, accent: '#FF7043' },
  { id: 'kh_south_coast', name: 'South Coast', key: 'South Coast', layout: { x: 57, y: 51, w: 30, h: 20 }, accent: '#FFA000' },
];

/** City names belonging to a region, in source order. */
function citiesInRegion(regionKey: string): string[] {
  return CAMBODIA_CITY_DATA.filter((c: RawAny) => c.region === regionKey).map((c: RawAny) => String(c.name));
}

/** The Cambodia region overworld (same RegionMeta shape Thailand/Laos use). */
export const CAMBODIA_REGIONS: RegionMeta[] = CAMBODIA_REGION_DEFS.map((r) => ({
  id: r.id,
  name: r.name,
  region: r.key,
  active: true,
  cities: citiesInRegion(r.key),
  layout: r.layout,
  accent: r.accent,
  ...(r.outline ? { outline: r.outline } : {}),
}));

/** Every Cambodia city as a detailed CityMeta with a computed zone map, so each
 *  city drills down to its zones exactly as grouped in the source data. */
export const CAMBODIA_CITIES: CityMeta[] = CAMBODIA_CITY_DATA.map((c: RawAny) => {
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
