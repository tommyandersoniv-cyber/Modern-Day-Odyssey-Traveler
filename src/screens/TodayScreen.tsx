// ============================================================================
// TodayScreen — the daily hub. Your chosen quests + chaos cards in one place,
// plus a "draw from" scope (region → city → zone) so you can work one area at a
// time and draw quests the way you draw chaos cards.
// ============================================================================

import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { FoodTier, MediaDraft, Quest } from '../types';
import { COLORS, INVENTORY, SIZES } from '../utils/constants';
import { customRegionMetas, getRegionCities, worldCityMeta } from '../utils/world';
import { availableCountries, countryForRegionKey, getCountryRegions } from '../utils/countries';
import { FOOD_REGION_ORDER, LAOS_FOOD_REGION_ORDER, CAMBODIA_FOOD_REGION_ORDER, VIETNAM_FOOD_REGION_ORDER, foodEmoji } from '../utils/food';
import { shortDate, tripDay } from '../utils/helpers';
import { KEYS, getString } from '../storage/storage';
import { useAppNavigation } from '../navigation/hooks';
import { useQuestStore } from '../store/useQuestStore';
import { useChaosStore } from '../store/useChaosStore';
import { useGameStore } from '../store/useGameStore';
import { useWorldStore } from '../store/useWorldStore';

import { PixelText } from '../components/ui/PixelText';
import { PixelButton } from '../components/ui/PixelButton';
import { ScreenHeader } from '../components/ui/ScreenHeader';
import { XPBar } from '../components/quests/XPBar';
import { QuestCard } from '../components/quests/QuestCard';
import { ChaosCard } from '../components/chaos/ChaosCard';
import { QuestCompletionModal } from '../components/quests/QuestCompletionModal';

const Chip: React.FC<{ label: string; active: boolean; color: string; onPress: () => void }> = ({ label, active, color, onPress }) => (
  <PixelButton label={label} size="sm" variant={active ? 'solid' : 'outline'} color={active ? color : COLORS.TEXT_SECONDARY} onPress={onPress} style={{ marginRight: 6, marginBottom: 6 }} />
);

export default function TodayScreen() {
  const navigation = useAppNavigation();

  const activeRegularIds = useQuestStore((s) => s.active_regular_ids);
  const allQuests = useQuestStore((s) => s.all_quests);
  const userQuests = useQuestStore((s) => s.user_quests);
  const foodQuests = useQuestStore((s) => s.food_quests);
  const completedIds = useQuestStore((s) => s.completed_quest_ids);
  const getQuestById = useQuestStore((s) => s.getQuestById);

  const activeChaosIds = useChaosStore((s) => s.active_chaos_ids);
  const bossId = useChaosStore((s) => s.active_boss_quest_id);
  const getChaosById = useChaosStore((s) => s.getQuestById);

  const currentRegion = useGameStore((s) => s.current_region);
  const currentCity = useGameStore((s) => s.current_city);
  const currentZone = useGameStore((s) => s.current_zone);
  const setCurrentLocation = useGameStore((s) => s.setCurrentLocation);
  const regionBadge = useGameStore((s) =>
    currentRegion ? s.region_badges.find((b) => b.region === currentRegion) : undefined,
  );
  const customRegions = useWorldStore((s) => s.customRegions);
  const customCities = useWorldStore((s) => s.customCities);

  const gameMode = useGameStore((s) => s.game_mode);
  const isOdyssey = gameMode === 'odyssey';

  // ---- Draw scope: Country → Region → City → Zone ------------------------
  // A current_region that is a real place (not the Legendary hall / a sentinel).
  const liveRegion = currentRegion && currentRegion !== 'Cross-Region' && !currentRegion.startsWith('__') ? currentRegion : '';
  const CUSTOM = '__custom__';

  // Country/region pickers (Exploration only). Custom places are a pseudo-country.
  const scopeCountries = useMemo(() => {
    const list = availableCountries().map((c) => ({ id: c.id, name: c.name }));
    if (customRegionMetas().length) list.push({ id: CUSTOM, name: 'My Places' });
    return list;
  }, [customRegions]);

  const [scopeCountry, setScopeCountry] = useState<string>(
    countryForRegionKey(currentRegion ?? undefined)?.id ?? availableCountries()[0]?.id ?? '',
  );
  const [scopeRegion, setScopeRegion] = useState<string>(liveRegion);
  const [scopeCity, setScopeCity] = useState<string>(currentCity ?? '');
  const [scopeZone, setScopeZone] = useState<string>(currentZone ?? '');

  // Regions selectable under the chosen country (or your custom places).
  const regionsForCountry = useMemo(() => {
    if (scopeCountry === CUSTOM) return customRegionMetas();
    const c = availableCountries().find((x) => x.id === scopeCountry);
    return c ? getCountryRegions(c) : [];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scopeCountry, customRegions]);

  // In Odyssey the scope follows WHERE YOU ARE on the map — only city/zone can be
  // refined. In Exploration you freely pick country → region → city → zone.
  const activeRegion = isOdyssey ? liveRegion : scopeRegion;
  const scopeCities = useMemo(() => (activeRegion ? getRegionCities(activeRegion) : []), [activeRegion, customCities]);
  const scopeZones = useMemo(() => worldCityMeta(scopeCity)?.zones ?? [], [scopeCity, customCities]);

  const scope = {
    region: activeRegion || undefined,
    city: scopeCity || undefined,
    zone: scopeZone || undefined,
  };
  const scopeLabel = scopeZone || scopeCity || activeRegion || 'anywhere';
  const available = [...allQuests, ...userQuests, ...foodQuests].filter(
    (q) =>
      !completedIds.includes(q.id) &&
      !activeRegularIds.includes(q.id) &&
      (!scope.region || q.region === scope.region) &&
      (!scope.city || q.city === scope.city) &&
      (!scope.zone || q.zone === scope.zone),
  );

  const pickCountry = (id: string) => {
    setScopeCountry(id);
    const first = id === CUSTOM ? customRegionMetas()[0]?.region : availableCountries().find((x) => x.id === id)?.regions[0]?.region;
    setScopeRegion(first ?? '');
    setScopeCity('');
    setScopeZone('');
    if (first) setCurrentLocation(first);
  };
  const pickRegion = (r: string) => {
    setScopeRegion(r);
    setScopeCity('');
    setScopeZone('');
    setCurrentLocation(r);
  };
  const pickCity = (c: string) => {
    setScopeCity(c);
    setScopeZone('');
    setCurrentLocation(activeRegion, c || null);
  };
  const pickZone = (z: string) => {
    setScopeZone(z);
    setCurrentLocation(activeRegion, scopeCity || null, z || null);
  };

  const [target, setTarget] = useState<Quest | null>(null);
  const [scopeOpen, setScopeOpen] = useState(false);

  // ---- Food: the Thailand/Laos dish-pool (tagged food_country) PLUS the
  // Food-category regular quests of any country that has no separate dish pool
  // (Cambodia, Vietnam — their food lives directly in the regular city data,
  // same source the Map's per-country Food Hall reads from). Generalized so a
  // future dish-pool-less country is picked up automatically: we take every
  // Food quest whose country ISN'T already represented in the dish pool.
  // foodCountryOf/foodRegionOf fall back to the real region/city fields for
  // quests that don't carry the food-pool-specific tags.
  const regularFood = useMemo(() => {
    const dishPoolCountries = new Set(foodQuests.map((q) => q.food_country ?? 'thailand'));
    return allQuests.filter((q) => {
      if (q.category !== 'Food') return false;
      const c = countryForRegionKey(q.region)?.id;
      return !!c && !dishPoolCountries.has(c);
    });
  }, [allQuests, foodQuests]);
  const allFood = useMemo(() => [...foodQuests, ...regularFood], [foodQuests, regularFood]);
  const foodCountryOf = (q: Quest) => q.food_country ?? countryForRegionKey(q.region)?.id ?? 'thailand';
  const foodRegionOf = (q: Quest) => q.food_region ?? q.region ?? 'Other';
  const foodRegionsOf = (q: Quest) => q.food_regions ?? [foodRegionOf(q)];
  const REGION_ORDER = useMemo(() => [...FOOD_REGION_ORDER, ...LAOS_FOOD_REGION_ORDER, ...CAMBODIA_FOOD_REGION_ORDER, ...VIETNAM_FOOD_REGION_ORDER], []);

  const [foodOpen, setFoodOpen] = useState(false);
  const [foodBrowse, setFoodBrowse] = useState(false);
  const [foodCountry, setFoodCountry] = useState<string>('all');
  const [foodRegion, setFoodRegion] = useState<string>('all');
  const [foodTier, setFoodTier] = useState<FoodTier | 'all'>('all');

  const foodCountries = useMemo(
    () => ['all', ...availableCountries().map((c) => c.id).filter((id) => allFood.some((q) => foodCountryOf(q) === id))],
    [allFood],
  );
  const foodRegionsForCountry = useMemo(() => {
    const present = new Set(
      allFood.filter((q) => foodCountry === 'all' || foodCountryOf(q) === foodCountry).flatMap(foodRegionsOf),
    );
    const ordered = REGION_ORDER.filter((r) => present.has(r));
    const extras = [...present].filter((r) => !REGION_ORDER.includes(r));
    return [...ordered, ...extras];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allFood, foodCountry]);
  const filteredFood = useMemo(
    () =>
      allFood.filter(
        (q) =>
          (foodCountry === 'all' || foodCountryOf(q) === foodCountry) &&
          (foodRegion === 'all' || foodRegionsOf(q).includes(foodRegion)) &&
          (foodTier === 'all' || q.food_tier === foodTier),
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [allFood, foodCountry, foodRegion, foodTier],
  );
  const pickFoodCountry = (id: string) => { setFoodCountry(id); setFoodRegion('all'); };

  // Draw a food quest exactly like a regular quest — random from the filtered
  // area, straight into the MY QUESTS inventory.
  const availableFood = filteredFood.filter(
    (q) => !completedIds.includes(q.id) && !activeRegularIds.includes(q.id),
  );
  const drawFood = () => {
    if (!availableFood.length) return;
    const pick = availableFood[Math.floor(Math.random() * availableFood.length)];
    useQuestStore.getState().addToInventory(pick);
  };

  const quests = activeRegularIds.map((id) => getQuestById(id)).filter(Boolean) as Quest[];
  const questsFull = activeRegularIds.length >= INVENTORY.regularSlots;

  const chaosQuests = activeChaosIds.map((id) => getChaosById(id)).filter(Boolean) as Quest[];
  const chaosFull = activeChaosIds.length >= INVENTORY.chaosSlots;
  const boss = bossId ? getChaosById(bossId) : undefined;
  // All 4 countries' food quests carry food_tier now (Thailand/Laos from their
  // dish pools, Cambodia/Vietnam retrofitted from their regular Food quests).
  const FOOD_TIERS: (FoodTier | 'all')[] = ['all', 'common', 'rare', 'unique'];
  const countryName = (id: string) => availableCountries().find((c) => c.id === id)?.name ?? (id === CUSTOM ? 'My Places' : id);

  const completeChaos = async (draft: MediaDraft) => {
    if (!target) return;
    const t = target;
    setTarget(null);
    await useChaosStore.getState().completeChaosQuest(t.id, draft);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.BG_DARK }} edges={['top']}>
      <ScreenHeader
        title="TODAY"
        accent={COLORS.GOLD}
        subtitle={shortDate()}
        subtitleColor={COLORS.LIME}
        right={
          <PixelText size={10} color={COLORS.LIME}>
            {`DAY ${tripDay(getString(KEYS.TRIP_START))}`}
          </PixelText>
        }
      />
      <ScrollView contentContainerStyle={{ padding: SIZES.spacingMd, paddingBottom: 48 }}>
        {/* Boss */}
        {boss ? (
          <View style={{ marginBottom: SIZES.spacingLg }}>
            <PixelText size={9} color={COLORS.QUEST_BOSS} style={{ marginBottom: 6 }}># ACTIVE BOSS</PixelText>
            <ChaosCard quest={boss} active onPress={() => setTarget(boss)} />
          </View>
        ) : null}

        {/* Quests */}
        <PixelText size={10} color={COLORS.QUEST_SIDE} style={{ marginBottom: SIZES.spacingSm }}>{`MY QUESTS  ${quests.length} / ${INVENTORY.regularSlots}`}</PixelText>

        {/* Draw-from scope — collapsed by default; tap to refine the area. */}
        <Pressable
          onPress={() => setScopeOpen((o) => !o)}
          style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.BG_SURFACE, borderWidth: SIZES.borderWidth, borderColor: COLORS.BG_BORDER, padding: SIZES.spacingSm, marginBottom: scopeOpen ? 0 : SIZES.spacingSm }}
        >
          <PixelText size={7} color={COLORS.TEXT_SECONDARY}>DRAW FROM</PixelText>
          <PixelText size={8} color={COLORS.GOLD} style={{ flex: 1, marginLeft: SIZES.spacingSm }} numberOfLines={1}>{scopeLabel.toUpperCase()}</PixelText>
          <PixelText size={7} color={COLORS.TEXT_SECONDARY} style={{ marginRight: 6 }}>{`${available.length} avail`}</PixelText>
          <PixelText size={9} color={COLORS.TEXT_SECONDARY}>{scopeOpen ? 'v' : '>'}</PixelText>
        </Pressable>
        {scopeOpen ? (
          <View style={{ backgroundColor: COLORS.BG_SURFACE, borderWidth: SIZES.borderWidth, borderTopWidth: 0, borderColor: COLORS.BG_BORDER, padding: SIZES.spacingSm, marginBottom: SIZES.spacingSm }}>
            {isOdyssey ? (
              // Odyssey: scope is pinned to where you are on the map; only the
              // city/zone can be narrowed. Country/region are not free to pick.
              <PixelText size={7} color={COLORS.GOLD} style={{ marginBottom: 6 }}>
                {activeRegion ? `ODYSSEY · ${activeRegion.toUpperCase()} — narrow the city/zone below` : 'Enter a region on the Map to start drawing here.'}
              </PixelText>
            ) : (
              <>
                <PixelText size={7} color={COLORS.TEXT_SECONDARY} style={{ marginBottom: 6 }}>COUNTRY</PixelText>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {scopeCountries.map((c) => <Chip key={c.id} label={c.name} active={scopeCountry === c.id} color={COLORS.GOLD} onPress={() => pickCountry(c.id)} />)}
                </ScrollView>

                <PixelText size={7} color={COLORS.TEXT_SECONDARY} style={{ marginTop: 4, marginBottom: 6 }}>REGION</PixelText>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {regionsForCountry.map((r) => <Chip key={r.region} label={r.name} active={scopeRegion === r.region} color={r.accent} onPress={() => pickRegion(r.region)} />)}
                </ScrollView>
              </>
            )}

            <PixelText size={7} color={COLORS.TEXT_SECONDARY} style={{ marginTop: 4, marginBottom: 6 }}>CITY</PixelText>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <Chip label="ANY" active={scopeCity === ''} color={COLORS.BLUE} onPress={() => pickCity('')} />
              {scopeCities.map((c) => <Chip key={c.name} label={c.name} active={scopeCity === c.name} color={COLORS.BLUE} onPress={() => pickCity(c.name)} />)}
            </ScrollView>

            {scopeZones.length > 0 ? (
              <>
                <PixelText size={7} color={COLORS.TEXT_SECONDARY} style={{ marginTop: 4, marginBottom: 6 }}>AREA / ZONE</PixelText>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <Chip label="ANY" active={scopeZone === ''} color={COLORS.PURPLE} onPress={() => pickZone('')} />
                  {scopeZones.map((z) => <Chip key={z} label={z} active={scopeZone === z} color={COLORS.PURPLE} onPress={() => pickZone(z)} />)}
                </ScrollView>
              </>
            ) : null}
          </View>
        ) : null}

        <View style={{ flexDirection: 'row', marginBottom: SIZES.spacingSm }}>
          <PixelButton
            label={questsFull ? 'QUESTS FULL' : available.length === 0 ? 'NONE HERE' : 'DRAW FROM AREA'}
            color={COLORS.QUEST_SIDE}
            size="md"
            disabled={questsFull || available.length === 0}
            onPress={() => useQuestStore.getState().drawRandomQuest(scope)}
            style={{ flex: 1, marginRight: 6 }}
          />
          <PixelButton
            label="BROWSE"
            variant="outline"
            color={COLORS.TEXT_SECONDARY}
            size="md"
            onPress={() => navigation.navigate('QuestLog', { addMode: true, inventoryType: 'regular', region: scope.region, city: scope.city, zone: scope.zone })}
            style={{ flex: 1, marginLeft: 6 }}
          />
        </View>

        {quests.length === 0 ? (
          <PixelText size={8} variant="body" color={COLORS.TEXT_DISABLED} style={{ marginBottom: SIZES.spacingMd }}>
            No quests chosen yet. Set an area above and draw, or pick from the Map.
          </PixelText>
        ) : (
          quests.map((q) => (
            <View key={q.id} style={{ marginBottom: SIZES.spacingSm }}>
              <QuestCard
                quest={q}
                onPress={() => navigation.navigate('QuestDetail', { questId: q.id })}
                onRemove={() => useQuestStore.getState().removeFromInventory(q.id)}
              />
            </View>
          ))
        )}

        {/* Food quests — one night-market box; expand for region + rarity filters. */}
        <Pressable
          onPress={() => setFoodOpen((o) => !o)}
          style={{ marginTop: SIZES.spacingLg, backgroundColor: '#2a1742', borderWidth: SIZES.cardAccentWidth, borderColor: '#b18ce0', borderRadius: SIZES.borderRadius, padding: SIZES.spacingMd, flexDirection: 'row', alignItems: 'center' }}
        >
          <PixelText size={12} color="#ffd9f0" style={{ flex: 1 }}>🍜 FOOD QUESTS</PixelText>
          {/* Mirrors the regular quests' "DRAW FROM" badge above — scoped to the
              current country/region/tier filter rather than a flat grand total. */}
          <PixelText size={7} color="#cdb8ec" style={{ marginRight: SIZES.spacingSm }}>{`${availableFood.length} avail`}</PixelText>
          <PixelText size={10} color="#ffd9f0">{foodOpen ? 'v' : '>'}</PixelText>
        </Pressable>
        {foodOpen ? (
          <View style={{ marginTop: SIZES.spacingSm }}>
            {/* Country filter */}
            {foodCountries.length > 2 ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 2 }}>
                {foodCountries.map((id) => <Chip key={id} label={id === 'all' ? 'ALL' : countryName(id).toUpperCase()} active={foodCountry === id} color={COLORS.GOLD} onPress={() => pickFoodCountry(id)} />)}
              </ScrollView>
            ) : null}
            {/* Region filter */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 2 }}>
              <Chip label="ALL REGIONS" active={foodRegion === 'all'} color="#b18ce0" onPress={() => setFoodRegion('all')} />
              {foodRegionsForCountry.map((r) => <Chip key={r} label={r} active={foodRegion === r} color="#b18ce0" onPress={() => setFoodRegion(r)} />)}
            </ScrollView>
            {/* Tier (Common/Rare/Unique) filter */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: SIZES.spacingSm }}>
              {FOOD_TIERS.map((t) => <Chip key={t} label={t === 'all' ? 'ALL TIERS' : t.toUpperCase()} active={foodTier === t} color={COLORS.PURPLE} onPress={() => setFoodTier(t)} />)}
            </ScrollView>
          </View>
        ) : null}

        {/* Same flow as regular quests — the buttons live OUTSIDE the dropdown,
            always visible; the dropdown above only refines the area. */}
        <View style={{ flexDirection: 'row', marginTop: SIZES.spacingSm, marginBottom: SIZES.spacingSm }}>
          <PixelButton
            label={questsFull ? 'QUESTS FULL' : availableFood.length === 0 ? 'NONE HERE' : 'DRAW FROM AREA'}
            color="#b18ce0"
            size="md"
            disabled={questsFull || availableFood.length === 0}
            onPress={drawFood}
            style={{ flex: 1, marginRight: 6 }}
          />
          <PixelButton
            label={foodBrowse ? 'HIDE' : 'BROWSE'}
            variant="outline"
            color={COLORS.TEXT_SECONDARY}
            size="md"
            onPress={() => setFoodBrowse((b) => !b)}
            style={{ flex: 1, marginLeft: 6 }}
          />
        </View>
        <PixelText size={7} color="#cdb8ec" style={{ marginBottom: SIZES.spacingSm }}>
          {`${availableFood.length} dish${availableFood.length === 1 ? '' : 'es'} available in this area`}
        </PixelText>

        {!foodBrowse ? null : filteredFood.length === 0 ? (
          <PixelText size={8} variant="body" color={COLORS.TEXT_DISABLED} style={{ marginBottom: SIZES.spacingSm }}>No dishes match these filters.</PixelText>
        ) : (
          filteredFood.map((q) => {
            const isDone = completedIds.includes(q.id);
            return (
              <Pressable
                key={q.id}
                onPress={() => navigation.navigate('QuestDetail', { questId: q.id })}
                style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.BG_SURFACE, borderWidth: SIZES.borderWidth, borderColor: COLORS.BG_BORDER, padding: SIZES.spacingSm, marginBottom: 6 }}
              >
                <PixelText size={16} style={{ marginRight: SIZES.spacingSm }}>{foodEmoji(q.food_category)}</PixelText>
                <View style={{ flex: 1 }}>
                  <PixelText size={8} color={isDone ? COLORS.GREEN : COLORS.TEXT_PRIMARY} numberOfLines={1}>{q.title}</PixelText>
                  <PixelText size={6} color={COLORS.TEXT_SECONDARY} style={{ marginTop: 2 }}>{`${foodRegionOf(q)} · ${(q.food_tier ?? 'rare').toUpperCase()} · ${q.xp} XP`}</PixelText>
                </View>
                {isDone ? <PixelText size={8} color={COLORS.GREEN}>OK</PixelText> : null}
              </Pressable>
            );
          })
        )}

        {/* Chaos */}
        <PixelText size={10} color={COLORS.QUEST_CHAOS} style={{ marginTop: SIZES.spacingLg, marginBottom: SIZES.spacingSm }}>
          {`CHAOS  ${chaosQuests.length} / ${INVENTORY.chaosSlots}`}
        </PixelText>
        <View style={{ flexDirection: 'row', marginBottom: SIZES.spacingSm }}>
          <PixelButton
            label={chaosFull ? 'CHAOS FULL (5/5)' : `DRAW A CHAOS QUEST  (${activeChaosIds.length}/5)`}
            color={COLORS.PURPLE}
            size="md"
            disabled={chaosFull}
            onPress={() => useChaosStore.getState().drawOnDemand()}
            style={{ flex: 1, marginRight: 6 }}
          />
          <PixelButton
            label="BROWSE"
            variant="outline"
            color={COLORS.TEXT_SECONDARY}
            size="md"
            onPress={() => navigation.navigate('QuestLog', { inventoryType: 'chaos' })}
            style={{ flex: 1, marginLeft: 6 }}
          />
        </View>
        {chaosQuests.map((q) => (
          <View key={q.id} style={{ marginBottom: SIZES.spacingSm }}>
            <ChaosCard quest={q} active onPress={() => setTarget(q)} />
          </View>
        ))}

        {/* Region chaos progress */}
        {regionBadge && regionBadge.chaos_roll > 0 ? (
          <View style={{ marginTop: SIZES.spacingLg }}>
            <PixelText size={9} color={COLORS.GOLD} style={{ marginBottom: 6 }}>{`${currentRegion} CHAOS QUOTA`}</PixelText>
            <PixelText size={8} color={COLORS.TEXT_SECONDARY} style={{ marginBottom: 6 }}>{`${regionBadge.chaos_completed} / ${regionBadge.chaos_roll} completed`}</PixelText>
            <XPBar progress={regionBadge.chaos_completed / regionBadge.chaos_roll} color={COLORS.QUEST_CHAOS} segmented segments={Math.max(1, regionBadge.chaos_roll)} />
          </View>
        ) : null}
      </ScrollView>

      <QuestCompletionModal visible={!!target} quest={target} onCancel={() => setTarget(null)} onComplete={completeChaos} />
    </SafeAreaView>
  );
}
