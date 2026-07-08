// ============================================================================
// QuestLogScreen — browse / filter the full quest catalogue.
//   • route params: { addMode?: boolean; inventoryType?: 'regular' | 'chaos' }
//   • filter by category + status across all_quests + user_quests
//     (and the chaos pool when inventoryType === 'chaos')
//   • group rows under city / category headers
//   • addMode - each card gets an "ADD" button that respects slot limits
//   • "CREATE QUEST" button - navigate('CreateQuest')
// ============================================================================

import React, { useMemo, useState } from 'react';
import { Alert, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, RouteProp } from '@react-navigation/native';

import type { Quest, RootStackParamList } from '../types';
import { COLORS, SIZES } from '../utils/constants';
import { useAppNavigation } from '../navigation/hooks';
import { useQuestStore } from '../store/useQuestStore';
import { useChaosStore } from '../store/useChaosStore';
import { useWorldStore } from '../store/useWorldStore';
import { builtInRegions, customRegionMetas, getRegionCities, worldCityMeta } from '../utils/world';

import { PixelText } from '../components/ui/PixelText';
import { PixelButton } from '../components/ui/PixelButton';
import { QuestCard } from '../components/quests/QuestCard';

type StatusFilter = 'all' | 'available' | 'active' | 'completed';

/** A simple horizontal pill row used for category + status filters. */
function FilterRow({
  options,
  value,
  onChange,
}: {
  options: { key: string; label: string }[];
  value: string;
  onChange: (key: string) => void;
}) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ gap: SIZES.spacingSm, paddingVertical: SIZES.spacingXs }}
    >
      {options.map((opt) => {
        const selected = opt.key === value;
        return (
          <PixelButton
            key={opt.key}
            label={opt.label}
            size="sm"
            variant={selected ? 'solid' : 'outline'}
            color={selected ? COLORS.GOLD : COLORS.TEXT_SECONDARY}
            onPress={() => onChange(opt.key)}
          />
        );
      })}
    </ScrollView>
  );
}

export default function QuestLogScreen() {
  const navigation = useAppNavigation();
  const route = useRoute<RouteProp<RootStackParamList, 'QuestLog'>>();
  const params = route.params ?? {};
  const addMode = params.addMode ?? false;
  const inventoryType = params.inventoryType ?? 'regular';
  const chaosMode = inventoryType === 'chaos';

  // Subscribe so the list re-renders as quests are added / completed.
  const allQuests = useQuestStore((s) => s.all_quests);
  const userQuests = useQuestStore((s) => s.user_quests);
  const completedIds = useQuestStore((s) => s.completed_quest_ids);
  const activeRegularIds = useQuestStore((s) => s.active_regular_ids);
  const chaosPool = useChaosStore((s) => s.chaos_pool);
  const activeChaosIds = useChaosStore((s) => s.active_chaos_ids);

  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  // Area scope (regular quests only) — defaults from the Today "draw from" scope.
  const customCities = useWorldStore((s) => s.customCities);
  const [regionFilter, setRegionFilter] = useState<string>(params.region ?? 'all');
  const [cityFilter, setCityFilter] = useState<string>(params.city ?? 'all');
  const [zoneFilter, setZoneFilter] = useState<string>(params.zone ?? 'all');
  const regionOptions = useMemo(() => ['all', ...[...builtInRegions(), ...customRegionMetas()].map((r) => r.region)], []);
  const cityOptions = useMemo(
    () => (regionFilter === 'all' ? [] : ['all', ...getRegionCities(regionFilter).map((c) => c.name)]),
    [regionFilter, customCities],
  );
  const zoneOptions = useMemo(
    () => (cityFilter === 'all' ? [] : ['all', ...(worldCityMeta(cityFilter)?.zones ?? [])]),
    [cityFilter, customCities],
  );

  // The base pool depends on which inventory we are browsing for.
  const pool: Quest[] = useMemo(
    () => (chaosMode ? chaosPool : [...allQuests, ...userQuests]),
    [chaosMode, chaosPool, allQuests, userQuests],
  );

  const categories = useMemo(() => {
    const set = new Set<string>();
    pool.forEach((q) => set.add(q.category));
    return ['all', ...Array.from(set).sort()];
  }, [pool]);

  const isCompleted = (q: Quest): boolean =>
    chaosMode
      ? useChaosStore.getState().completed_chaos_ids.includes(q.id)
      : completedIds.includes(q.id);

  const isActive = (q: Quest): boolean =>
    chaosMode ? activeChaosIds.includes(q.id) : activeRegularIds.includes(q.id);

  const filtered = useMemo(() => {
    return pool.filter((q) => {
      if (categoryFilter !== 'all' && q.category !== categoryFilter) return false;
      if (!chaosMode) {
        if (regionFilter !== 'all' && q.region !== regionFilter) return false;
        if (cityFilter !== 'all' && q.city !== cityFilter) return false;
        if (zoneFilter !== 'all' && q.zone !== zoneFilter) return false;
      }
      if (statusFilter === 'all') return true;
      const done = chaosMode
        ? useChaosStore.getState().completed_chaos_ids.includes(q.id)
        : completedIds.includes(q.id);
      const active = chaosMode ? activeChaosIds.includes(q.id) : activeRegularIds.includes(q.id);
      if (statusFilter === 'completed') return done;
      if (statusFilter === 'active') return active && !done;
      // 'available' - neither active nor completed.
      return !done && !active;
    });
  }, [pool, categoryFilter, statusFilter, chaosMode, completedIds, activeChaosIds, activeRegularIds, regionFilter, cityFilter, zoneFilter]);

  // Group rows under city headers (falling back to category for region-less quests).
  const groups = useMemo(() => {
    const map = new Map<string, Quest[]>();
    filtered.forEach((q) => {
      const key = q.city ?? q.region ?? q.category ?? 'Other';
      const arr = map.get(key);
      if (arr) arr.push(q);
      else map.set(key, [q]);
    });
    return Array.from(map.entries());
  }, [filtered]);

  const handleAdd = (quest: Quest) => {
    if (chaosMode) {
      Alert.alert('CHAOS', 'Chaos quests are drawn from the Chaos screen.');
      return;
    }
    const store = useQuestStore.getState();
    if (store.isActive(quest.id)) return;
    if (!store.canAddToInventory('regular')) {
      Alert.alert('INVENTORY FULL', 'Your regular inventory is full (10/10).');
      return;
    }
    const ok = store.addToInventory(quest);
    if (!ok) Alert.alert('CANNOT ADD', 'This quest could not be added.');
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.BG_DARK }} edges={['top', 'left', 'right']}>
      {/* Header */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: SIZES.spacingMd,
          paddingVertical: SIZES.spacingMd,
        }}
      >
        <PixelButton label="BACK" size="sm" variant="outline" onPress={() => navigation.goBack()} />
        <PixelText size={SIZES.fontLg} color={COLORS.GOLD}>
          {addMode ? 'ADD QUEST' : 'QUEST LOG'}
        </PixelText>
      </View>

      {/* Filters */}
      <View style={{ paddingHorizontal: SIZES.spacingMd }}>
        <PixelText size={SIZES.fontXs} color={COLORS.TEXT_SECONDARY} style={{ marginBottom: 2 }}>
          STATUS
        </PixelText>
        <FilterRow
          options={[
            { key: 'all', label: 'ALL' },
            { key: 'available', label: 'AVAILABLE' },
            { key: 'active', label: 'ACTIVE' },
            { key: 'completed', label: 'DONE' },
          ]}
          value={statusFilter}
          onChange={(k) => setStatusFilter(k as StatusFilter)}
        />
        <PixelText
          size={SIZES.fontXs}
          color={COLORS.TEXT_SECONDARY}
          style={{ marginTop: SIZES.spacingXs, marginBottom: 2 }}
        >
          CATEGORY
        </PixelText>
        <FilterRow
          options={categories.map((c) => ({ key: c, label: c === 'all' ? 'ALL' : c.toUpperCase() }))}
          value={categoryFilter}
          onChange={setCategoryFilter}
        />

        {!chaosMode ? (
          <>
            <PixelText size={SIZES.fontXs} color={COLORS.TEXT_SECONDARY} style={{ marginTop: SIZES.spacingXs, marginBottom: 2 }}>AREA - REGION</PixelText>
            <FilterRow
              options={regionOptions.map((r) => ({ key: r, label: r === 'all' ? 'ALL' : r.toUpperCase() }))}
              value={regionFilter}
              onChange={(k) => { setRegionFilter(k); setCityFilter('all'); setZoneFilter('all'); }}
            />
            {cityOptions.length > 0 ? (
              <>
                <PixelText size={SIZES.fontXs} color={COLORS.TEXT_SECONDARY} style={{ marginTop: SIZES.spacingXs, marginBottom: 2 }}>CITY</PixelText>
                <FilterRow
                  options={cityOptions.map((c) => ({ key: c, label: c === 'all' ? 'ALL' : c.toUpperCase() }))}
                  value={cityFilter}
                  onChange={(k) => { setCityFilter(k); setZoneFilter('all'); }}
                />
              </>
            ) : null}
            {zoneOptions.length > 0 ? (
              <>
                <PixelText size={SIZES.fontXs} color={COLORS.TEXT_SECONDARY} style={{ marginTop: SIZES.spacingXs, marginBottom: 2 }}>ZONE</PixelText>
                <FilterRow
                  options={zoneOptions.map((z) => ({ key: z, label: z === 'all' ? 'ALL' : z.toUpperCase() }))}
                  value={zoneFilter}
                  onChange={setZoneFilter}
                />
              </>
            ) : null}
          </>
        ) : null}
      </View>

      {/* Quest list grouped by city / category */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          padding: SIZES.spacingMd,
          paddingBottom: SIZES.spacingXl * 2,
          gap: SIZES.spacingMd,
        }}
      >
        {groups.length === 0 ? (
          <View style={{ paddingVertical: SIZES.spacingXl, alignItems: 'center' }}>
            <PixelText size={SIZES.fontSm} color={COLORS.TEXT_DISABLED} align="center">
              No quests match these filters.
            </PixelText>
          </View>
        ) : (
          groups.map(([groupKey, quests]) => (
            <View key={groupKey} style={{ gap: SIZES.spacingSm }}>
              <View
                style={{
                  borderBottomWidth: SIZES.borderWidth,
                  borderBottomColor: COLORS.BG_BORDER,
                  paddingBottom: SIZES.spacingXs,
                }}
              >
                <PixelText size={SIZES.fontSm} color={COLORS.TEXT_PRIMARY}>
                  {groupKey.toUpperCase()} · {quests.length}
                </PixelText>
              </View>
              {quests.map((quest) => {
                const done = isCompleted(quest);
                const active = isActive(quest);
                const showAdd = addMode && !chaosMode && !done && !active;
                return (
                  <QuestCard
                    key={quest.id}
                    quest={quest}
                    completed={done}
                    onPress={() => navigation.navigate('QuestDetail', { questId: quest.id })}
                    rightSlot={
                      showAdd ? (
                        <PixelButton
                          label="ADD"
                          size="sm"
                          color={COLORS.GREEN}
                          onPress={() => handleAdd(quest)}
                        />
                      ) : active ? (
                        <PixelText size={SIZES.fontXs} color={COLORS.TEAL}>
                          IN BAG
                        </PixelText>
                      ) : undefined
                    }
                  />
                );
              })}
            </View>
          ))
        )}
      </ScrollView>

      {/* Create-quest action */}
      <View
        style={{
          padding: SIZES.spacingMd,
          borderTopWidth: SIZES.borderWidth,
          borderTopColor: COLORS.BG_BORDER,
          backgroundColor: COLORS.BG_SURFACE,
        }}
      >
        <PixelButton
          label="+ CREATE QUEST"
          color={COLORS.QUEST_USER}
          fullWidth
          onPress={() => navigation.navigate('CreateQuest')}
        />
      </View>
    </SafeAreaView>
  );
}

export { QuestLogScreen };
