// ============================================================================
// Countries — the top of the geography hierarchy that sits ABOVE regions.
//
//   World map → COUNTRY → its region overworld → region → city/zone
//
// Adding a new country is intentionally a one-stop edit: append a CountryMeta
// to COUNTRIES with `available: true` and its `regions` array (the same
// RegionMeta shape Thailand uses). Everything downstream — region overworld,
// city maps, quests — already keys off the region string, so a fully-populated
// country "just works". Countries with `available: false` render as a
// "coming soon" tile and carry no data.
// ============================================================================

import type { CountryMeta } from '../types';
import { COLORS, COUNTRY, REGIONS } from './constants';
import { LAOS_REGIONS } from './laos';
import { CAMBODIA_REGIONS } from './cambodia';
import { VIETNAM_REGIONS } from './vietnam';

// All four active country tiles share one uniform size (w32 x h40) laid out as
// a symmetric 2x2 grid — country tiles differ only in label/flag/accent, never
// in shape. (Vietnam previously had a one-off tall layout box, h:82 vs the
// others' ~44-46, which rendered as an oversized strip; keep every entry here
// on the same w/h going forward — only x/y should ever vary between them.)
const COUNTRY_TILE_W = 32;
const COUNTRY_TILE_H = 40;

export const COUNTRIES: CountryMeta[] = [
  // ---- Available: Thailand — top-left. -------------------------------------
  {
    id: 'thailand',
    name: COUNTRY.name,
    code: COUNTRY.code,
    flag: '🇹🇭',
    available: true,
    accent: COLORS.GOLD,
    layout: { x: 14, y: 5, w: COUNTRY_TILE_W, h: COUNTRY_TILE_H },
    regions: REGIONS,
  },

  // ---- Available: Laos — top-right. ----------------------------------------
  {
    id: 'laos',
    name: 'Laos',
    code: 'LA',
    flag: '🇱🇦',
    available: true,
    accent: COLORS.GREEN,
    layout: { x: 54, y: 5, w: COUNTRY_TILE_W, h: COUNTRY_TILE_H },
    regions: LAOS_REGIONS,
  },

  // ---- Available: Cambodia — bottom-left. ----------------------------------
  {
    id: 'cambodia',
    name: 'Cambodia',
    code: 'KH',
    flag: '🇰🇭',
    available: true,
    accent: COLORS.ORANGE,
    layout: { x: 14, y: 55, w: COUNTRY_TILE_W, h: COUNTRY_TILE_H },
    regions: CAMBODIA_REGIONS,
  },

  // ---- Available: Vietnam — bottom-right. ----------------------------------
  {
    id: 'vietnam',
    name: 'Vietnam',
    code: 'VN',
    flag: '🇻🇳',
    available: true,
    accent: COLORS.RED,
    layout: { x: 54, y: 55, w: COUNTRY_TILE_W, h: COUNTRY_TILE_H },
    regions: VIETNAM_REGIONS,
  },
];

export function countryByCode(code: string): CountryMeta | undefined {
  return COUNTRIES.find((c) => c.code === code);
}

export function countryById(id: string): CountryMeta | undefined {
  return COUNTRIES.find((c) => c.id === id);
}

export function availableCountries(): CountryMeta[] {
  return COUNTRIES.filter((c) => c.available);
}

/** The default country to land in (first available). */
export function defaultCountry(): CountryMeta | undefined {
  return availableCountries()[0];
}

/** The region overworld for a country (active regions only). */
export function getCountryRegions(country: CountryMeta): CountryMeta['regions'] {
  return country.regions.map((r) => ({ ...r, active: true }));
}

/** Every region across all available countries (flat list, active). Used by the
 *  flat region pickers/dex that span the whole built-in world. */
export function allBuiltInRegions(): CountryMeta['regions'] {
  return availableCountries().flatMap(getCountryRegions);
}

/** The available country that owns a region key, or undefined (custom region). */
export function countryForRegionKey(regionKey?: string): CountryMeta | undefined {
  if (!regionKey) return undefined;
  return availableCountries().find((c) => c.regions.some((r) => r.region === regionKey));
}

/** A real geographic region of an available country — the unit Odyssey progress
 *  and the per-country completion gate are measured in. Excludes the cross-cutting
 *  Legendary Quests hall (Cross-Region) and any custom/sentinel region. */
export function isOdysseyCountryRegion(regionKey?: string): boolean {
  if (!regionKey || regionKey === 'Cross-Region') return false;
  return !!countryForRegionKey(regionKey);
}

/** A country's gateable geographic regions (excludes the Legendary hall). */
export function geographicRegionsOf(country: CountryMeta): CountryMeta['regions'] {
  return country.regions.filter((r) => r.region !== 'Cross-Region');
}
