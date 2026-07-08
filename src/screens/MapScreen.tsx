// ============================================================================
// MapScreen — THE HUB. region overworld - region detail (cities + quests) -
// city zone map - zone quest sheet. Plus "My Places" for player-built regions.
// ============================================================================

import React, { useMemo, useState } from 'react';
import { Dimensions, Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { CityMeta, CountryMeta, MapSprite, MarkerType, Quest, RegionMeta } from '../types';
import {
  COLORS,
  COUNTRY_UNLOCK_REGIONS,
  ODYSSEY_REGION_ORDER,
  SIZES,
  odysseyCostForLevel,
} from '../utils/constants';
import { projectCoords } from '../utils/geo';
import { markerFor } from '../utils/quests';
import {
  customRegionMetas,
  getRegionCities,
  isCustomRegion,
  worldCityMeta,
  WorldCity,
} from '../utils/world';
import { COUNTRIES, availableCountries, countryForRegionKey, geographicRegionsOf, getCountryRegions } from '../utils/countries';
import { getLevelProgress } from '../utils/xp';
import { formatNumber } from '../utils/helpers';
import { useAppNavigation, useTabPressReset } from '../navigation/hooks';
import { useGameStore } from '../store/useGameStore';
import { useQuestStore } from '../store/useQuestStore';
import { useWorldStore } from '../store/useWorldStore';
import { useCodexStore } from '../store/useCodexStore';

import { PixelText } from '../components/ui/PixelText';
import { PixelAvatar } from '../components/codex/PixelAvatar';
import { SpriteToken } from '../components/codex/SpriteToken';
import { PixelButton } from '../components/ui/PixelButton';
import { PixelModal } from '../components/ui/PixelModal';
import { XPBar } from '../components/quests/XPBar';
import { QuestCard } from '../components/quests/QuestCard';
import { QuestCollectibleCard } from '../components/quests/QuestCollectibleCard';
import { QuestBadge } from '../components/quests/QuestBadge';
import { RegionMap, OdysseyTile } from '../components/map/RegionMap';
import { WorldMap } from '../components/map/WorldMap';
import { CityMap } from '../components/map/CityMap';
import { ZoneOverlay } from '../components/map/ZoneOverlay';
import { PlayerSprite } from '../components/map/PlayerSprite';
import { FoodHallView } from './map/FoodHallView';

// The Food Hall is a special place-tile on the Thailand region map (bottom-right
// corner), mirroring the Legendary Quests hall. Its sentinel region key is
// intercepted in onPressRegion to open the foodHall view (no real region data).
const FOOD_HALL_KEY = '__food_hall__';
const FOOD_HALL_TILE: RegionMeta = {
  id: 'food_hall',
  name: 'Food Hall',
  region: FOOD_HALL_KEY,
  active: true,
  cities: [],
  layout: { x: 64, y: 72, w: 30, h: 18 },
  accent: '#b18ce0',
  // Purple outline marks it as a hall, not a region.
  outline: '#b18ce0',
};
// Laos gets its own Food Hall tile too (its food quests live in the regular
// data as category "Food"). Placed bottom-right, clear of the Laos regions.
const LAOS_FOOD_HALL_TILE: RegionMeta = {
  ...FOOD_HALL_TILE,
  layout: { x: 80, y: 64, w: 18, h: 28 },
};
// ---------------------------------------------------------------------------
// MY WORLD — the globe view above Southeast Asia. Every continent (plus a few
// extra travel regions) laid out as tiles; only Southeast Asia is open today.
// Tapping it drops into the Southeast Asia country board. Reuses WorldMap, so
// locked continents render exactly like "coming soon" countries.
// ---------------------------------------------------------------------------
const SEA_CONTINENT_ID = 'southeast_asia';
const CONTINENTS: CountryMeta[] = [
  { id: 'north_america', name: 'North America', code: 'NAM', flag: '🌎', available: false, accent: COLORS.BLUE, layout: { x: 2, y: 6, w: 24, h: 22 }, regions: [] },
  { id: 'central_america', name: 'Central America', code: 'CAM', flag: '🌋', available: false, accent: COLORS.GREEN, layout: { x: 3, y: 31, w: 17, h: 14 }, regions: [] },
  { id: 'caribbean', name: 'Caribbean', code: 'CAR', flag: '🏝️', available: false, accent: COLORS.TEAL, layout: { x: 21, y: 31, w: 18, h: 14 }, regions: [] },
  { id: 'south_america', name: 'South America', code: 'SAM', flag: '🌎', available: false, accent: COLORS.ORANGE, layout: { x: 14, y: 48, w: 19, h: 28 }, regions: [] },
  { id: 'europe', name: 'Europe', code: 'EUR', flag: '🌍', available: false, accent: COLORS.BLUE, layout: { x: 42, y: 6, w: 16, h: 17 }, regions: [] },
  { id: 'africa', name: 'Africa', code: 'AFR', flag: '🌍', available: false, accent: COLORS.GOLD, layout: { x: 40, y: 27, w: 18, h: 31 }, regions: [] },
  { id: 'middle_east', name: 'Middle East', code: 'MEA', flag: '🌍', available: false, accent: COLORS.ORANGE, layout: { x: 61, y: 25, w: 15, h: 14 }, regions: [] },
  { id: 'asia', name: 'Asia', code: 'ASI', flag: '🌏', available: false, accent: COLORS.RED, layout: { x: 62, y: 4, w: 32, h: 18 }, regions: [] },
  { id: SEA_CONTINENT_ID, name: 'Southeast Asia', code: 'SEA', flag: '🌏', available: true, accent: COLORS.GOLD, layout: { x: 66, y: 41, w: 23, h: 19 }, regions: [] },
  { id: 'oceania', name: 'Oceania', code: 'OCE', flag: '🌏', available: false, accent: COLORS.TEAL, layout: { x: 72, y: 63, w: 22, h: 16 }, regions: [] },
  { id: 'antarctica', name: 'Antarctica', code: 'ANT', flag: '🧊', available: false, accent: COLORS.TEXT_SECONDARY, layout: { x: 24, y: 84, w: 52, h: 12 }, regions: [] },
];

// The MY WORLD globe (continent picker) is a mandatory step today only because
// Southeast Asia is the sole populated continent — picking it is a foregone
// conclusion. Skip straight to the Southeast Asia board while that's true; the
// moment a second continent flips `available: true` this re-enables itself
// (condition-based, not hardcoded away — the globe/back-button/route all still
// exist and work if navigated to directly, see the "< MY WORLD" button below).
const AVAILABLE_CONTINENTS = CONTINENTS.filter((c) => c.available);
const SKIP_CONTINENT_PICKER = AVAILABLE_CONTINENTS.length === 1 && AVAILABLE_CONTINENTS[0].id === SEA_CONTINENT_ID;

// Laos Legendary Quests hall — mirrors Thailand's Cross-Region bucket tile, but
// scoped to Laos legendary quests. Rendered by RegionDetailView's bucket branch.
const LAOS_LEGENDARY_KEY = '__laos_legendary__';
const LAOS_LEGENDARY_TILE: RegionMeta = {
  id: 'laos_legendary',
  name: 'Legendary Quests',
  region: LAOS_LEGENDARY_KEY,
  active: true,
  cities: [],
  // Left of the Central Belt region (shifted to x26 to make room here).
  layout: { x: 2, y: 43, w: 21, h: 16 },
  accent: COLORS.PURPLE,
  // Green outline marks it as a hall, not a region.
  outline: COLORS.GREEN,
};

// Cambodia's two halls replace the old "Nationwide" region: a Food Hall and a
// Legendary Quests hall. The Food Hall uses the shared FOOD_HALL_KEY so it opens
// the same FoodHallView (banner + region/rarity chips + grouped sections) that
// Thailand and Laos use; the Legendary hall is a cross-cutting bucket view
// rendered by RegionDetailView. Both quests still live in their home cities.
const CAMBODIA_LEGENDARY_KEY = '__cambodia_legendary__';
const CAMBODIA_FOOD_HALL_TILE: RegionMeta = {
  id: 'cambodia_food',
  name: 'Food Hall',
  region: FOOD_HALL_KEY,
  active: true,
  cities: [],
  // Bottom row, right column — aligned under the South Coast tile above it.
  layout: { x: 57, y: 75, w: 30, h: 20 },
  accent: COLORS.ORANGE,
  // Purple outline marks it as a hall, not a region.
  outline: '#b18ce0',
};
const CAMBODIA_LEGENDARY_TILE: RegionMeta = {
  id: 'cambodia_legendary',
  name: 'Legendary Quests',
  region: CAMBODIA_LEGENDARY_KEY,
  active: true,
  cities: [],
  // Bottom row, left column — aligned under the Southwest tile above it.
  layout: { x: 13, y: 75, w: 30, h: 20 },
  accent: COLORS.PURPLE,
  // Green outline marks it as a hall — matches every other country's
  // Legendary Quests tile (Thailand's Cross-Region, Laos's) regardless of
  // that country's own accent theme.
  outline: COLORS.GREEN,
};

// Vietnam's two halls, mirroring Cambodia: Legendary Quests (left) + Food Hall
// (right) on the bottom row of the region board. Same pattern — Food Hall via
// the shared FOOD_HALL_KEY (FoodHallView), Legendary as a bucket view.
const VIETNAM_LEGENDARY_KEY = '__vietnam_legendary__';
const VIETNAM_LEGENDARY_TILE: RegionMeta = {
  id: 'vietnam_legendary',
  name: 'Legendary Quests',
  region: VIETNAM_LEGENDARY_KEY,
  active: true,
  cities: [],
  layout: { x: 13, y: 72, w: 30, h: 19 },
  accent: COLORS.PURPLE,
  // Green outline — every country's Legendary Quests tile is green.
  outline: COLORS.GREEN,
};
const VIETNAM_FOOD_HALL_TILE: RegionMeta = {
  id: 'vietnam_food',
  name: 'Food Hall',
  region: FOOD_HALL_KEY,
  active: true,
  cities: [],
  layout: { x: 57, y: 72, w: 30, h: 19 },
  accent: COLORS.RED,
  // Purple outline marks it as a hall, not a region.
  outline: '#b18ce0',
};

// Cross-cutting "bucket" halls rendered by RegionDetailView as a read-only
// filtered list (not a place you stand in, and never running the boss wheel).
// The Food Halls (all countries) are handled separately via FOOD_HALL_KEY.
const BUCKET_HALL_KEYS = new Set<string>([
  'Cross-Region',
  LAOS_LEGENDARY_KEY,
  CAMBODIA_LEGENDARY_KEY,
  VIETNAM_LEGENDARY_KEY,
]);

export default function MapScreen() {
  const navigation = useAppNavigation();
  const player = useGameStore((s) => s.player);
  const currentRegion = useGameStore((s) => s.current_region);
  const setCurrentLocation = useGameStore((s) => s.setCurrentLocation);
  const hasEnteredRegion = useGameStore((s) => s.hasEnteredRegion);
  const characters = useCodexStore((s) => s.characters);

  // Game mode + Odyssey progression (subscribed so the map reacts to unlocks).
  const gameMode = useGameStore((s) => s.game_mode);
  const odysseyLevel = useGameStore((s) => s.odyssey_level);
  const odysseyUnlocked = useGameStore((s) => s.odyssey_unlocked);
  const odysseyRegionXp = useGameStore((s) => s.odyssey_region_xp);
  const unlockRegion = useGameStore((s) => s.unlockRegion);

  // Subscribe so "My Places" + region detail react to new custom places.
  const customRegions = useWorldStore((s) => s.customRegions);
  useWorldStore((s) => s.customCities);

  // Geography drill-down: MY WORLD globe → world (Southeast Asia) → country
  // region overworld → region detail → city. The globe step is skipped by
  // default while Southeast Asia is the only populated continent (see
  // SKIP_CONTINENT_PICKER above) — land straight on the Southeast Asia board.
  const [mode, setMode] = useState<'myworld' | 'world' | 'region' | 'regionDetail' | 'city' | 'foodHall'>(
    SKIP_CONTINENT_PICKER ? 'world' : 'myworld',
  );
  const [country, setCountry] = useState<CountryMeta | null>(null);
  const [region, setRegion] = useState<RegionMeta | null>(null);
  const [city, setCity] = useState<CityMeta | null>(null);
  const [sheetZone, setSheetZone] = useState<string | null>(null);
  // Region detail can be reached from the country overworld OR from "My Places"
  // on the world view — remember which so BACK returns to the right place.
  const [regionDetailFrom, setRegionDetailFrom] = useState<'world' | 'region'>('region');

  // Tapping the Map tab returns to the tab's start screen — the MY WORLD globe,
  // or straight to Southeast Asia while it's the only populated continent.
  useTabPressReset(() => {
    setMode(SKIP_CONTINENT_PICKER ? 'world' : 'myworld');
    setCountry(null);
    setRegion(null);
    setCity(null);
    setSheetZone(null);
  });

  const regions = useMemo(() => (country ? getCountryRegions(country) : []), [country]);
  // Each country appends its own hall tiles (Food Hall / Legendary Quests).
  const mapRegions = useMemo(() => {
    if (country?.id === 'thailand') return [...regions, FOOD_HALL_TILE];
    if (country?.id === 'laos') return [...regions, LAOS_FOOD_HALL_TILE, LAOS_LEGENDARY_TILE];
    if (country?.id === 'cambodia') return [...regions, CAMBODIA_FOOD_HALL_TILE, CAMBODIA_LEGENDARY_TILE];
    if (country?.id === 'vietnam') return [...regions, VIETNAM_FOOD_HALL_TILE, VIETNAM_LEGENDARY_TILE];
    return regions;
  }, [country, regions]);
  const myPlaces = useMemo(() => customRegionMetas(), [customRegions]);

  // Odyssey progression (player-directed): each unlocked region accrues its own
  // XP toward a threshold; when every unlocked region is complete the player may
  // CHOOSE which locked region to open next (tap it on the map). With nothing
  // unlocked yet, every region is choosable — that first tap is the start.
  const threshold = odysseyLevel ? odysseyCostForLevel(odysseyLevel) : Infinity;
  const isComplete = (rk: string) => (odysseyRegionXp[rk] ?? 0) >= threshold;
  const geographic = (rk: string) => ODYSSEY_REGION_ORDER.includes(rk);

  // Odyssey country gate: you progress one country at a time — the next country
  // stays locked until COUNTRY_UNLOCK_REGIONS regions of the previous country are
  // complete (at the chosen level). Generalizes across all available countries.
  const completedRegionsOf = (c: CountryMeta) =>
    geographicRegionsOf(c).filter((r) => (odysseyRegionXp[r.region] ?? 0) >= threshold).length;
  const { lockedCountryIds, countryHints } = useMemo(() => {
    const ids: string[] = [];
    const hints: Record<string, string> = {};
    if (gameMode === 'odyssey') {
      const avail = availableCountries();
      for (let i = 1; i < avail.length; i++) {
        const prev = avail[i - 1];
        const done = completedRegionsOf(prev);
        if (ids.includes(prev.id) || done < COUNTRY_UNLOCK_REGIONS) {
          ids.push(avail[i].id);
          hints[avail[i].id] = `${Math.min(done, COUNTRY_UNLOCK_REGIONS)}/${COUNTRY_UNLOCK_REGIONS} ${prev.name.toUpperCase()} REGIONS`;
        }
      }
    }
    return { lockedCountryIds: ids, countryHints: hints };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameMode, odysseyRegionXp, threshold]);
  const canChoose = gameMode === 'odyssey' && odysseyUnlocked.every(isComplete);
  const lockedExist = regions.some((r) => geographic(r.region) && !odysseyUnlocked.includes(r.region));
  // Odyssey progression is a Thailand-chain concept; only show its hints for a
  // country that actually has chain regions (Laos is free-roam, no hints).
  const showOdysseyHints = gameMode === 'odyssey' && regions.some((r) => geographic(r.region));

  const odysseyInfo = useMemo(() => {
    if (gameMode !== 'odyssey') return undefined;
    const m: Record<string, OdysseyTile> = {};
    regions.forEach((r) => {
      if (!geographic(r.region)) return; // Cross-Region / custom always open
      const unlocked = odysseyUnlocked.includes(r.region);
      if (unlocked) {
        m[r.region] = {
          state: isComplete(r.region) ? 'complete' : 'active',
          xp: odysseyRegionXp[r.region] ?? 0,
          threshold,
        };
      } else {
        m[r.region] = { state: canChoose ? 'choosable' : 'locked' };
      }
    });
    return m;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameMode, regions, odysseyUnlocked, odysseyRegionXp, threshold, canChoose]);

  // Where each pixel character stands on the overworld. The player appears in
  // their current region (falling back to the first real region so they are
  // always somewhere on the map); met characters appear in their region.
  const occupants = useMemo(() => {
    const map: Record<string, MapSprite[]> = {};
    characters.forEach((c) => {
      (map[c.region] ||= []).push({
        id: c.id,
        appearance: c.appearance,
        photoUri: c.pixel_avatar_uri || undefined,
        label: c.name,
      });
    });
    const fallback = regions.find((r) => r.active && r.region !== 'Cross-Region')?.region;
    const here = currentRegion && currentRegion !== 'Cross-Region' ? currentRegion : fallback;
    if (here) {
      (map[here] ||= []).unshift({
        id: 'player',
        isPlayer: true,
        appearance: player.appearance,
        label: player.name,
      });
    }
    return map;
  }, [characters, currentRegion, player.appearance, player.name, regions]);

  const selectCountry = (c: CountryMeta) => {
    if (!c.available || lockedCountryIds.includes(c.id)) return;
    setCountry(c);
    setMode('region');
  };

  const openRegionDetail = (r: RegionMeta, from: 'world' | 'region' = 'region') => {
    setRegion(r);
    setRegionDetailFrom(from);
    // The bucket halls are cross-cutting views, not a place you are — don't
    // hijack the player's current region (it drives Today's scope label).
    if (!BUCKET_HALL_KEYS.has(r.region)) {
      setCurrentLocation(r.region);
    }
    setMode('regionDetail');
  };

  const onPressRegion = (r: RegionMeta) => {
    if (!r.active) return;
    // The Food Hall tile opens the night-market view, not a region detail.
    if (r.region === FOOD_HALL_KEY) {
      setMode('foodHall');
      return;
    }
    // Custom regions and the bucket halls (all countries) are meta/free-roam:
    // enter directly, never running the boss-wheel sequence.
    if (isCustomRegion(r.region) || BUCKET_HALL_KEYS.has(r.region)) {
      openRegionDetail(r);
      return;
    }
    // Exploration mode: browse freely — every region open, no boss/chaos.
    if (gameMode !== 'odyssey') {
      openRegionDetail(r);
      return;
    }
    // Thailand's geographic chain: player-directed unlock, then the boss wheel.
    if (geographic(r.region)) {
      if (!odysseyUnlocked.includes(r.region)) {
        // Locked — only enterable when the player has earned a choice (start or
        // after completing the current region). Choosing it unlocks + enters.
        if (canChoose) {
          unlockRegion(r.region);
          setCurrentLocation(r.region);
          navigation.navigate('BossWheel', { region: r.region });
        }
        return;
      }
      // Unlocked: spin the boss wheel on first entry, else open the detail.
      if (!hasEnteredRegion(r.region)) {
        setCurrentLocation(r.region);
        navigation.navigate('BossWheel', { region: r.region });
        return;
      }
      openRegionDetail(r);
      return;
    }
    // Other country regions (e.g. Laos) are free-roam — no unlock chain — but
    // still run the shared boss wheel + chaos roll on first entry (the chaos /
    // boss pool is generic, not country-specific).
    if (!hasEnteredRegion(r.region)) {
      setCurrentLocation(r.region);
      navigation.navigate('BossWheel', { region: r.region });
      return;
    }
    openRegionDetail(r);
  };

  const openCity = (wc: WorldCity) => {
    const meta = worldCityMeta(wc.name);
    if (!meta) return; // no zones - handled inline as a quest list
    setCity(meta);
    setCurrentLocation(meta.region, meta.name);
    setMode('city');
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.BG_DARK }} edges={['top']}>
      {/* HUD — MDO wordmark left, XP bar center, avatar/level chip right
          (tap the chip to customize the player). */}
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: SIZES.spacingMd, paddingVertical: SIZES.spacingSm }}>
        <PixelText size={14} color={COLORS.GOLD}>MDO</PixelText>
        <View style={{ flex: 1, marginHorizontal: SIZES.spacingMd }}>
          <XPBar progress={getLevelProgress(player.xp_total)} label={`${formatNumber(player.xp_total)} XP`} color={COLORS.GOLD} />
        </View>
        <Pressable
          onPress={() => navigation.navigate('CustomizePlayer')}
          style={{ flexDirection: 'row', alignItems: 'center', borderWidth: SIZES.borderWidth, borderColor: COLORS.GOLD, paddingHorizontal: SIZES.spacingSm, paddingVertical: 4 }}
        >
          <PixelAvatar appearance={player.appearance} size={17} />
          <View style={{ marginLeft: SIZES.spacingSm }}>
            <PixelText size={8} color={COLORS.GOLD}>{`LV ${player.level}`}</PixelText>
            <PixelText size={7} color={COLORS.TEXT_SECONDARY} style={{ marginTop: 2 }}>{player.name}</PixelText>
          </View>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ padding: SIZES.spacingMd, paddingBottom: 48 }}>
        {mode === 'myworld' ? (
          <>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: SIZES.spacingMd }}>
              {/* Title centered across the full row; CODEX floats at the right. */}
              <PixelText size={12} color={COLORS.TEXT_PRIMARY} align="center" style={{ position: 'absolute', left: 0, right: 0 }}>
                🌏 MY WORLD
              </PixelText>
              <PixelButton label="CODEX" size="sm" color={COLORS.TEAL} onPress={() => navigation.navigate('Codex')} style={{ marginLeft: 'auto' }} />
            </View>
            <WorldMap
              countries={CONTINENTS}
              onPressCountry={(c) => {
                if (c.id === SEA_CONTINENT_ID) setMode('world');
              }}
            />
            <PixelText size={7} variant="body" color={COLORS.TEXT_SECONDARY} style={{ marginTop: SIZES.spacingSm }}>
              Your odyssey starts in Southeast Asia. New corners of the world unlock as the journey grows.
            </PixelText>
          </>
        ) : null}

        {mode === 'world' ? (
          <>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: SIZES.spacingMd }}>
              {/* Back to the globe on the left, title centered, CODEX right. */}
              <PixelText size={12} color={COLORS.TEXT_PRIMARY} align="center" style={{ position: 'absolute', left: 0, right: 0 }}>
                SOUTHEAST ASIA
              </PixelText>
              <PixelButton label="< MY WORLD" size="sm" variant="outline" color={COLORS.TEXT_SECONDARY} onPress={() => setMode('myworld')} />
              <PixelButton label="CODEX" size="sm" color={COLORS.TEAL} onPress={() => navigation.navigate('Codex')} style={{ marginLeft: 'auto' }} />
            </View>
            <WorldMap countries={COUNTRIES} onPressCountry={selectCountry} lockedIds={lockedCountryIds} hints={countryHints} />
            <PixelText size={7} variant="body" color={COLORS.TEXT_SECONDARY} style={{ marginTop: SIZES.spacingSm }}>
              Tap a country to explore its regions.
            </PixelText>
          </>
        ) : null}

        {mode === 'region' ? (
          <>
            {/* BACK to world · centered country name · CODEX. (Mode switching
                lives in the Travel-Dex now.) */}
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: SIZES.spacingMd }}>
              <PixelButton label="< WORLD" size="sm" variant="outline" color={COLORS.TEXT_SECONDARY} onPress={() => { setMode('world'); setCountry(null); }} />
              <PixelText size={12} color={COLORS.TEXT_PRIMARY} align="center" style={{ flex: 1 }}>{(country?.name ?? 'THAILAND').toUpperCase()}</PixelText>
              <PixelButton label="CODEX" size="sm" color={COLORS.TEAL} onPress={() => navigation.navigate('Codex')} />
            </View>
            <RegionMap regions={mapRegions} onPressRegion={onPressRegion} occupants={occupants} odyssey={odysseyInfo} />
            {showOdysseyHints && odysseyUnlocked.length === 0 ? (
              <PixelText size={7} variant="body" color={COLORS.GOLD} style={{ marginTop: SIZES.spacingSm }}>
                Tap any region to choose your starting point.
              </PixelText>
            ) : showOdysseyHints && canChoose && lockedExist ? (
              <PixelText size={7} variant="body" color={COLORS.PURPLE} style={{ marginTop: SIZES.spacingSm }}>
                Region complete! Tap a locked region to explore next.
              </PixelText>
            ) : showOdysseyHints && !lockedExist ? (
              <PixelText size={7} variant="body" color={COLORS.PURPLE} style={{ marginTop: SIZES.spacingSm }}>
                Every region unlocked — you are a true Nomad.
              </PixelText>
            ) : showOdysseyHints ? (
              <PixelText size={7} variant="body" color={COLORS.TEXT_SECONDARY} style={{ marginTop: SIZES.spacingSm }}>
                {`Earn ${formatNumber(threshold)} XP in a region to complete it, then choose where to go next.`}
              </PixelText>
            ) : null}

            {/* MY PLACES — your own regions/cities, scoped to where you explore. */}
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: SIZES.spacingLg, marginBottom: SIZES.spacingSm }}>
              <PixelText size={10} color={COLORS.GREEN}>MY PLACES</PixelText>
              <PixelButton label="+ ADD A PLACE" size="sm" color={COLORS.GREEN} onPress={() => navigation.navigate('CreatePlace')} style={{ marginLeft: 'auto' }} />
            </View>
            {myPlaces.length === 0 ? (
              <PixelText size={8} variant="body" color={COLORS.TEXT_DISABLED}>
                Build out your own regions and cities as you travel beyond the map.
              </PixelText>
            ) : (
              myPlaces.map((r) => (
                <Pressable
                  key={r.id}
                  onPress={() => openRegionDetail(r)}
                  style={{ backgroundColor: COLORS.BG_CARD, borderWidth: SIZES.borderWidth, borderColor: COLORS.BG_BORDER, borderLeftWidth: SIZES.cardAccentWidth, borderLeftColor: r.accent, padding: SIZES.spacingMd, marginBottom: SIZES.spacingSm }}
                >
                  <PixelText size={10} color={r.accent}>{r.name}</PixelText>
                  <PixelText size={7} color={COLORS.TEXT_SECONDARY} style={{ marginTop: 4 }}>
                    {`${getRegionCities(r.region).length} place(s)`}
                  </PixelText>
                </Pressable>
              ))
            )}
          </>
        ) : null}

        {mode === 'foodHall' ? (
          <View>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: SIZES.spacingMd }}>
              <PixelButton label="BACK" size="sm" variant="outline" color={COLORS.TEXT_SECONDARY} onPress={() => setMode('region')} />
              <PixelText size={12} color="#b18ce0" align="right" style={{ flex: 1, marginLeft: SIZES.spacingMd }}>FOOD HALL</PixelText>
            </View>
            <FoodHallView country={country?.id === 'laos' ? 'laos' : country?.id === 'cambodia' ? 'cambodia' : country?.id === 'vietnam' ? 'vietnam' : 'thailand'} />
          </View>
        ) : null}

        {mode === 'regionDetail' && region ? (
          <RegionDetailView
            region={region}
            onBack={() => setMode(regionDetailFrom)}
            onOpenCity={openCity}
            onAddCity={() => navigation.navigate('CreatePlace', { region: region.region })}
            onAddQuest={() => navigation.navigate('CreateQuest', { region: region.region })}
            onAddCharacter={(city) => {
              setCurrentLocation(region.region, city ?? null);
              navigation.navigate('AddCharacter', { region: region.region, city });
            }}
            onOpenCharacter={(id) => navigation.navigate('CharacterDetail', { characterId: id })}
            onOpenQuest={(q) => navigation.navigate('QuestDetail', { questId: q.id })}
          />
        ) : null}

        {mode === 'city' && city ? (
          <CityModeView
            city={city}
            onBack={() => setMode('regionDetail')}
            onOpenZone={(z) => {
              setSheetZone(z);
              setCurrentLocation(city.region, city.name, z);
            }}
            onAddCharacter={() => {
              setCurrentLocation(city.region, city.name);
              navigation.navigate('AddCharacter', { region: city.region, city: city.name });
            }}
          />
        ) : null}
      </ScrollView>

      <ZoneSheet
        city={city}
        zone={sheetZone}
        onClose={() => setSheetZone(null)}
        onAddQuest={(r, c, z) => {
          setSheetZone(null);
          navigation.navigate('CreateQuest', { region: r, city: c, zone: z });
        }}
        onOpenQuest={(q) => {
          setSheetZone(null);
          navigation.navigate('QuestDetail', { questId: q.id });
        }}
      />

    </SafeAreaView>
  );
}

// ---------------------------------------------------------------------------
// Region detail — cities (open map or inline list) + add-city.
// ---------------------------------------------------------------------------

interface RegionDetailProps {
  region: RegionMeta;
  onBack: () => void;
  onOpenCity: (wc: WorldCity) => void;
  onAddCity: () => void;
  onAddQuest: () => void;
  onAddCharacter: (city?: string) => void;
  onOpenCharacter: (id: string) => void;
  onOpenQuest: (q: Quest) => void;
}

const RegionDetailView: React.FC<RegionDetailProps> = ({ region, onBack, onOpenCity, onAddCity, onAddQuest, onAddCharacter, onOpenCharacter, onOpenQuest }) => {
  const customCities = useWorldStore((s) => s.customCities);
  const cities = useMemo(() => getRegionCities(region.region), [region.region, customCities]);
  // Cities with their own zone map (>8 quests) and custom places stay in PLACES;
  // small data cities (<=8 quests) are grouped onto the region "More" map.
  const placesCities = useMemo(() => cities.filter((c) => c.detailed || c.custom), [cities]);
  const moreCities = useMemo(() => cities.filter((c) => !c.detailed && !c.custom), [cities]);
  const regionBadge = useGameStore((s) => s.region_badges.find((b) => b.region === region.region));
  const [expanded, setExpanded] = useState<string | null>(null);
  const [tab, setTab] = useState<'places' | 'more'>('places');

  // The Legendary Quests halls surface every legendary quest in a country as a
  // read-only cross-cutting view — each quest still lives in its home region/city
  // too. Scoped to exactly ONE country so they never leak into each other (e.g.
  // Thailand's hall must not show Cambodia's legendary quests). Chaos excluded.
  // (Food Halls are a separate flow — the FoodHallView 'foodHall' mode.)
  const HALL_COUNTRY: Record<string, string> = {
    'Cross-Region': 'thailand',
    [LAOS_LEGENDARY_KEY]: 'laos',
    [CAMBODIA_LEGENDARY_KEY]: 'cambodia',
    [VIETNAM_LEGENDARY_KEY]: 'vietnam',
  };
  const hallCountry = HALL_COUNTRY[region.region];
  const isBucket = !!hallCountry;
  const completedIds = useQuestStore((s) => s.completed_quest_ids);
  const allQuests = useQuestStore((s) => s.all_quests);
  const characters = useCodexStore((s) => s.characters).filter((c) => c.region === region.region);
  const bucketQuests = useMemo(
    () =>
      hallCountry
        ? allQuests
            // Top-tier hall: with rarity recomputed from xp, 'mythic' is now the
            // tier above 'legendary' — include both so the hall stays meaningful.
            .filter((q) => q.rarity === 'legendary' || q.rarity === 'mythic')
            .filter((q) => countryForRegionKey(q.region)?.id === hallCountry)
            .sort((a, b) => (a.region ?? '~').localeCompare(b.region ?? '~') || b.xp - a.xp)
        : [],
    [hallCountry, allQuests],
  );
  // Two-column collectible-card grid width, matching the Food Hall's layout.
  const bucketCardW = useMemo(
    () => (Dimensions.get('window').width - SIZES.spacingMd * 2 - SIZES.spacingSm) / 2,
    [],
  );

  return (
    <View>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: SIZES.spacingSm }}>
        <PixelButton label="BACK" size="sm" variant="outline" color={COLORS.TEXT_SECONDARY} onPress={onBack} />
        <PixelText size={12} color={region.accent} align="right" style={{ marginLeft: SIZES.spacingMd, flex: 1 }}>
          {region.name.toUpperCase()}
        </PixelText>
      </View>

      {/* Region-level actions. Adding a character now lives on each city row;
          we keep a region-level fallback only when there are no cities yet.
          The Legendary Quests hall is a read-only cross-cutting view. */}
      {!isBucket ? (
        <View style={{ flexDirection: 'row', marginBottom: SIZES.spacingMd }}>
          <PixelButton label="+ QUEST" size="sm" color={COLORS.QUEST_USER} onPress={onAddQuest} style={{ flex: 1, marginRight: cities.length === 0 ? 6 : 0 }} />
          {cities.length === 0 ? (
            <PixelButton label="+ CHARACTER" size="sm" color={COLORS.TEAL} onPress={() => onAddCharacter()} style={{ flex: 1, marginLeft: 6 }} />
          ) : null}
        </View>
      ) : null}

      {/* Characters met in this region */}
      {characters.length > 0 ? (
        <View style={{ marginBottom: SIZES.spacingMd }}>
          <PixelText size={9} color={COLORS.TEAL} style={{ marginBottom: SIZES.spacingSm }}>
            {`CHARACTERS MET (${characters.length})`}
          </PixelText>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
            {characters.map((c) => (
              <Pressable key={c.id} onPress={() => onOpenCharacter(c.id)} style={{ alignItems: 'center', marginRight: 10, marginBottom: 8, width: 56 }}>
                <PixelAvatar uri={c.pixel_avatar_uri} appearance={c.appearance} size={26} />
                <PixelText size={6} color={COLORS.TEXT_SECONDARY} align="center" numberOfLines={1} style={{ marginTop: 2 }}>{c.name}</PixelText>
              </Pressable>
            ))}
          </View>
        </View>
      ) : null}

      {regionBadge && regionBadge.chaos_roll > 0 ? (
        <View style={{ backgroundColor: COLORS.BG_SURFACE, borderWidth: SIZES.borderWidth, borderColor: COLORS.BG_BORDER, padding: SIZES.spacingSm, marginBottom: SIZES.spacingMd }}>
          <PixelText size={7} color={COLORS.TEXT_SECONDARY}>
            {`BADGE: boss ${regionBadge.boss_quest_completed ? 'OK' : '-'} · chaos ${regionBadge.chaos_completed}/${regionBadge.chaos_roll} · chars ${regionBadge.characters_added}/5`}
          </PixelText>
        </View>
      ) : null}

      {isBucket ? (
        <View style={{ marginBottom: SIZES.spacingMd }}>
          <PixelText size={10} color={COLORS.PURPLE} style={{ marginBottom: SIZES.spacingSm }}>
            {`LEGENDARY QUESTS (${bucketQuests.length})`}
          </PixelText>
          {bucketQuests.length === 0 ? (
            <PixelText size={8} variant="body" color={COLORS.TEXT_DISABLED}>No legendary quests loaded.</PixelText>
          ) : (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
              {bucketQuests.map((q) => (
                <QuestCollectibleCard
                  key={q.id}
                  quest={q}
                  completed={completedIds.includes(q.id)}
                  width={bucketCardW}
                  onPress={() => onOpenQuest(q)}
                  style={{ marginBottom: SIZES.spacingSm }}
                />
              ))}
            </View>
          )}
        </View>
      ) : (
        <>
          {/* Big cities (own zone map) + custom places live in PLACES; small
              cities (<=8 quests) are grouped under the MORE map. */}
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: SIZES.spacingSm }}>
            <Pressable onPress={() => setTab('places')} style={{ marginRight: SIZES.spacingMd }}>
              <PixelText size={10} color={tab === 'places' ? COLORS.GOLD : COLORS.TEXT_DISABLED}>
                {`PLACES (${placesCities.length})`}
              </PixelText>
            </Pressable>
            {moreCities.length > 0 ? (
              <Pressable onPress={() => setTab('more')}>
                <PixelText size={10} color={tab === 'more' ? COLORS.GOLD : COLORS.TEXT_DISABLED}>
                  {`MORE (${moreCities.length})`}
                </PixelText>
              </Pressable>
            ) : null}
            <PixelButton label="+ ADD CITY" size="sm" color={COLORS.GREEN} onPress={onAddCity} style={{ marginLeft: 'auto' }} />
          </View>

          {tab === 'more' && moreCities.length > 0 ? (
            <RegionMoreView cities={moreCities} onOpenQuest={onOpenQuest} />
          ) : placesCities.length === 0 ? (
            <PixelText size={8} variant="body" color={COLORS.TEXT_DISABLED}>
              {moreCities.length > 0 ? 'No mapped cities here — check the MORE tab.' : 'No places here yet. Add one to start questing.'}
            </PixelText>
          ) : (
            placesCities.map((wc) => (
              <CityRow
                key={wc.name}
                city={wc}
                expanded={expanded === wc.name}
                onToggle={() => setExpanded(expanded === wc.name ? null : wc.name)}
                onOpenMap={() => onOpenCity(wc)}
                onOpenQuest={onOpenQuest}
                onAddCharacter={() => onAddCharacter(wc.name)}
              />
            ))
          )}
        </>
      )}
    </View>
  );
};

const CityRow: React.FC<{
  city: WorldCity;
  expanded: boolean;
  onToggle: () => void;
  onOpenMap: () => void;
  onOpenQuest: (q: Quest) => void;
  onAddCharacter: () => void;
}> = ({ city, expanded, onToggle, onOpenMap, onOpenQuest, onAddCharacter }) => {
  const completedIds = useQuestStore((s) => s.completed_quest_ids);
  const activeIds = useQuestStore((s) => s.active_regular_ids);
  const getQuestsByCity = useQuestStore((s) => s.getQuestsByCity);
  const quests = getQuestsByCity(city.name);
  const done = quests.filter((q) => completedIds.includes(q.id)).length;

  return (
    <View style={{ marginBottom: SIZES.spacingSm }}>
      <Pressable
        onPress={city.detailed ? onOpenMap : onToggle}
        style={{ backgroundColor: COLORS.BG_CARD, borderWidth: SIZES.borderWidth, borderColor: COLORS.BG_BORDER, padding: SIZES.spacingMd, flexDirection: 'row', alignItems: 'center' }}
      >
        <View style={{ flex: 1 }}>
          <PixelText size={10} color={COLORS.TEXT_PRIMARY}>{city.name}</PixelText>
          <PixelText size={7} color={COLORS.TEXT_SECONDARY} style={{ marginTop: 4 }}>
            {`${done}/${quests.length} quests${city.detailed ? ' · zone map' : ''}${city.custom ? ' · custom' : ''}`}
          </PixelText>
        </View>
        <PixelText size={9} color={city.detailed ? COLORS.GOLD : COLORS.TEAL}>
          {city.detailed ? 'OPEN MAP >' : expanded ? 'v' : '>'}
        </PixelText>
      </Pressable>

      {!city.detailed && expanded ? (
        <View style={{ paddingTop: SIZES.spacingSm }}>
          {/* Add-a-character lives inside the opened city (mirrors the zone map). */}
          <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginBottom: SIZES.spacingSm }}>
            <PixelButton label="+" size="sm" color={COLORS.BLUE} onPress={onAddCharacter} />
          </View>
          {quests.length === 0 ? (
            <PixelText size={7} variant="body" color={COLORS.TEXT_DISABLED}>No quests here yet.</PixelText>
          ) : (
            quests.map((q) => (
              <View key={q.id} style={{ marginBottom: SIZES.spacingSm }}>
                <QuestCard quest={q} completed={completedIds.includes(q.id)} onPress={() => onOpenQuest(q)} rightSlot={<AddSlot quest={q} active={activeIds.includes(q.id)} done={completedIds.includes(q.id)} />} />
              </View>
            ))
          )}
        </View>
      ) : null}
    </View>
  );
};

// ---------------------------------------------------------------------------

const AddSlot: React.FC<{ quest: Quest; active: boolean; done: boolean }> = ({ quest, active, done }) => {
  const addToInventory = useQuestStore((s) => s.addToInventory);
  const canAdd = useQuestStore((s) => s.canAddToInventory);
  if (done) return <PixelText size={14} color={COLORS.GREEN}>OK</PixelText>;
  if (active) return <QuestBadge label="ACTIVE" color={COLORS.GREEN} />;
  return (
    <PixelButton
      label="ADD"
      size="sm"
      color={COLORS.GREEN}
      onPress={() => {
        if (canAdd('regular')) addToInventory(quest);
      }}
    />
  );
};

// ---------------------------------------------------------------------------
// Region "More" map — small cities (<=8 quests) as markers at their centre
// coordinate. Tapping a city drills into its quest list below the map.
// ---------------------------------------------------------------------------

const RegionMoreView: React.FC<{ cities: WorldCity[]; onOpenQuest: (q: Quest) => void }> = ({ cities, onOpenQuest }) => {
  const [selected, setSelected] = useState<string | null>(null);
  const withCoords = useMemo(() => cities.filter((c) => c.base_coordinates), [cities]);
  const noCoords = useMemo(() => cities.filter((c) => !c.base_coordinates), [cities]);
  const points = useMemo(
    () => projectCoords(withCoords.map((c) => c.base_coordinates!), { pad: 120 }),
    [withCoords],
  );

  return (
    <View>
      {withCoords.length > 0 ? (
        <>
          <CityMap>
            {withCoords.map((c, i) => {
              const p = points[i];
              if (!p) return null;
              return (
                <CityMarker
                  key={c.name}
                  x={p.x}
                  y={p.y}
                  label={c.name}
                  count={c.questCount}
                  selected={selected === c.name}
                  onPress={() => setSelected(selected === c.name ? null : c.name)}
                />
              );
            })}
          </CityMap>
          <PixelText size={8} variant="body" color={COLORS.TEXT_SECONDARY} style={{ marginTop: SIZES.spacingSm }}>
            Tap a city to drill into its quests.
          </PixelText>
        </>
      ) : null}

      {noCoords.length > 0 ? (
        <View style={{ marginTop: SIZES.spacingMd }}>
          <PixelText size={9} color={COLORS.ORANGE} style={{ marginBottom: SIZES.spacingSm }}>
            LOCATION TBD
          </PixelText>
          {noCoords.map((c) => (
            <Pressable
              key={c.name}
              onPress={() => setSelected(selected === c.name ? null : c.name)}
              style={{ backgroundColor: COLORS.BG_CARD, borderWidth: SIZES.borderWidth, borderColor: selected === c.name ? COLORS.GOLD : COLORS.BG_BORDER, padding: SIZES.spacingMd, marginBottom: SIZES.spacingSm, flexDirection: 'row', alignItems: 'center' }}
            >
              <PixelText size={9} color={COLORS.TEXT_PRIMARY} style={{ flex: 1 }}>{c.name}</PixelText>
              <PixelText size={7} color={COLORS.TEAL}>{`${c.questCount} quests >`}</PixelText>
            </Pressable>
          ))}
        </View>
      ) : null}

      {selected ? (
        <SmallCityQuests cityName={selected} onOpenQuest={onOpenQuest} onClose={() => setSelected(null)} />
      ) : null}
    </View>
  );
};

const CityMarker: React.FC<{ x: number; y: number; label: string; count: number; selected: boolean; onPress: () => void }> = ({ x, y, label, count, selected, onPress }) => (
  <Pressable onPress={onPress} style={{ position: 'absolute', left: x - 50, top: y - 14, width: 100, alignItems: 'center' }}>
    <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: selected ? COLORS.GOLD : COLORS.TEAL, borderWidth: 3, borderColor: COLORS.BG_DARK }} />
    <PixelText size={7} color={selected ? COLORS.GOLD : COLORS.TEXT_PRIMARY} align="center" numberOfLines={2} style={{ marginTop: 3 }}>
      {`${label} (${count})`}
    </PixelText>
  </Pressable>
);

const SmallCityQuests: React.FC<{ cityName: string; onOpenQuest: (q: Quest) => void; onClose: () => void }> = ({ cityName, onOpenQuest, onClose }) => {
  const getQuestsByCity = useQuestStore((s) => s.getQuestsByCity);
  const allQuests = useQuestStore((s) => s.all_quests);
  const completedIds = useQuestStore((s) => s.completed_quest_ids);
  const activeIds = useQuestStore((s) => s.active_regular_ids);
  const quests = useMemo(() => getQuestsByCity(cityName), [getQuestsByCity, cityName, allQuests]);

  return (
    <View style={{ marginTop: SIZES.spacingMd, borderTopWidth: SIZES.borderWidth, borderTopColor: COLORS.BG_BORDER, paddingTop: SIZES.spacingMd }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: SIZES.spacingSm }}>
        <PixelText size={11} color={COLORS.GOLD} style={{ flex: 1 }}>{`${cityName.toUpperCase()} · ${quests.length}`}</PixelText>
        <PixelButton label="CLOSE" size="sm" variant="outline" color={COLORS.TEXT_SECONDARY} onPress={onClose} />
      </View>
      {quests.length === 0 ? (
        <PixelText size={7} variant="body" color={COLORS.TEXT_DISABLED}>No quests here yet.</PixelText>
      ) : (
        quests.map((q) => (
          <View key={q.id} style={{ marginBottom: SIZES.spacingSm }}>
            <QuestCard quest={q} completed={completedIds.includes(q.id)} onPress={() => onOpenQuest(q)} rightSlot={<AddSlot quest={q} active={activeIds.includes(q.id)} done={completedIds.includes(q.id)} />} />
          </View>
        ))
      )}
    </View>
  );
};

// ---------------------------------------------------------------------------
// City zone map
// ---------------------------------------------------------------------------

const CityModeView: React.FC<{ city: CityMeta; onBack: () => void; onOpenZone: (zone: string) => void; onAddCharacter: () => void }> = ({ city, onBack, onOpenZone, onAddCharacter }) => {
  const completedIds = useQuestStore((s) => s.completed_quest_ids);
  const getQuestsByZone = useQuestStore((s) => s.getQuestsByZone);
  const playerAppearance = useGameStore((s) => s.player.appearance);
  const cityCharacters = useCodexStore((s) => s.characters).filter((c) => c.city === city.name);

  const completedPctByZone: Record<string, number> = {};
  const unlockedZones: Record<string, boolean> = {};
  const markersByZone: Record<string, MarkerType[]> = {};
  city.zones.forEach((z) => {
    const quests = getQuestsByZone(city.name, z);
    const done = quests.filter((q) => completedIds.includes(q.id)).length;
    completedPctByZone[z] = quests.length ? done / quests.length : 0;
    unlockedZones[z] = true;
    markersByZone[z] = quests.slice(0, 4).map((q) => markerFor(q, completedIds.includes(q.id)));
  });
  const firstBox = city.zoneLayout[city.zones[0]];

  // Resolve the zone box a character was met in (by zone or custom location),
  // falling back to a stable zone so everyone has a spot on the map.
  const boxForCharacter = (zone?: string, custom?: string, idx = 0) => {
    const match = city.zones.find((z) => z === zone || z === custom);
    const z = match ?? city.zones[idx % city.zones.length];
    return city.zoneLayout[z];
  };

  return (
    <View>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: SIZES.spacingSm }}>
        <PixelButton label="BACK" size="sm" variant="outline" color={COLORS.TEXT_SECONDARY} onPress={onBack} />
        <PixelText size={12} color={COLORS.GOLD} align="right" style={{ flex: 1, marginLeft: SIZES.spacingMd }}>{city.name.toUpperCase()}</PixelText>
        <PixelButton label="+" size="sm" color={COLORS.BLUE} onPress={onAddCharacter} style={{ marginLeft: SIZES.spacingMd }} />
      </View>
      <CityMap city={city}>
        <ZoneOverlay city={city} completedPctByZone={completedPctByZone} unlockedZones={unlockedZones} markersByZone={markersByZone} onPressZone={onOpenZone} />
        {cityCharacters.map((c, i) => {
          const box = boxForCharacter(c.zone, c.custom_location, i + 1);
          if (!box) return null;
          // Offset a touch from the zone centre so the marker stays legible.
          const cx = box.x + box.w / 2 + 40;
          const cy = box.y + box.h / 2;
          if (c.appearance) {
            return <PlayerSprite key={c.id} x={cx} y={cy} size={35} appearance={c.appearance} animated={false} />;
          }
          return (
            <View key={c.id} pointerEvents="none" style={{ position: 'absolute', left: cx - 14, top: cy - 17.5 }}>
              <SpriteToken sprite={{ id: c.id, photoUri: c.pixel_avatar_uri || undefined, label: c.name }} size={35} />
            </View>
          );
        })}
        {firstBox ? <PlayerSprite x={firstBox.x + firstBox.w / 2} y={firstBox.y + firstBox.h / 2} size={35} appearance={playerAppearance} /> : null}
      </CityMap>
      <PixelText size={8} variant="body" color={COLORS.TEXT_SECONDARY} style={{ marginTop: SIZES.spacingSm }}>
        Tap a zone to see its quests. You and the people you've met here stand on the map.
      </PixelText>
    </View>
  );
};

// ---------------------------------------------------------------------------

const ZoneSheet: React.FC<{ city: CityMeta | null; zone: string | null; onClose: () => void; onAddQuest: (region: string, city: string, zone: string) => void; onOpenQuest: (q: Quest) => void }> = ({ city, zone, onClose, onAddQuest, onOpenQuest }) => {
  const getQuestsByZone = useQuestStore((s) => s.getQuestsByZone);
  const completedIds = useQuestStore((s) => s.completed_quest_ids);
  const activeIds = useQuestStore((s) => s.active_regular_ids);
  const getCategorySpread = useQuestStore((s) => s.getCategorySpread);

  if (!city || !zone) return null;
  const quests = getQuestsByZone(city.name, zone);
  const done = quests.filter((q) => completedIds.includes(q.id)).length;
  const cats = Object.keys(getCategorySpread(city.name, zone)).length;

  return (
    <PixelModal visible={!!zone} onClose={onClose} title={zone.toUpperCase()} accent={COLORS.BLUE} scroll>
      <PixelText size={8} color={COLORS.TEXT_SECONDARY} style={{ marginBottom: SIZES.spacingSm }}>
        {`${done} of ${quests.length} quests · ${cats} categories`}
      </PixelText>
      {quests.map((q) => (
        <View key={q.id} style={{ marginBottom: SIZES.spacingSm }}>
          <QuestCard quest={q} completed={completedIds.includes(q.id)} onPress={() => onOpenQuest(q)} rightSlot={<AddSlot quest={q} active={activeIds.includes(q.id)} done={completedIds.includes(q.id)} />} />
        </View>
      ))}
      <PixelButton label="+ ADD A QUEST HERE" size="sm" color={COLORS.QUEST_USER} fullWidth onPress={() => onAddQuest(city.region, city.name, zone)} style={{ marginTop: SIZES.spacingSm }} />
      <PixelButton label="CLOSE" size="md" variant="outline" color={COLORS.TEXT_SECONDARY} fullWidth onPress={onClose} style={{ marginTop: SIZES.spacingSm }} />
    </PixelModal>
  );
};
