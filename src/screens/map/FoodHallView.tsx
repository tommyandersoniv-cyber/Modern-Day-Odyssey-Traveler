// ============================================================================
// FoodHallView — the Food Hall: a night-market hub of every food quest, split
// into per-region sections. Filter by rarity ("rare type"). Tap a dish to open
// its quest; completing it mints a foodie collectible card.
//
// Thailand/Laos use the dedicated `food_quests` dish pool (split by
// `food_country`; Laos dishes carry real regions, 'Nationwide' staples form
// their own section). Cambodia/Vietnam have no dish pool — their Food-category
// quests come from the regular data, grouped by geographic region.
// ============================================================================

import React, { useMemo, useState } from 'react';
import { Dimensions, ScrollView, View } from 'react-native';
import type { FoodTier, Quest } from '../../types';
import { COLORS, FOOD_TIER_COLOR, FOOD_TIER_LABEL, SIZES } from '../../utils/constants';
import { FOOD_REGION_ORDER, LAOS_FOOD_REGION_ORDER, CAMBODIA_FOOD_REGION_ORDER, VIETNAM_FOOD_REGION_ORDER } from '../../utils/food';
import { countryForRegionKey } from '../../utils/countries';
import { useAppNavigation } from '../../navigation/hooks';
import { useQuestStore } from '../../store/useQuestStore';
import { PixelText } from '../../components/ui/PixelText';
import { PixelButton } from '../../components/ui/PixelButton';
import { FoodCard } from '../../components/quests/FoodCard';
import { FoodHallDiceBanner } from '../../components/quests/FoodHallDiceBanner';

const { width } = Dimensions.get('window');
// All 4 countries' food-hall quests carry `food_tier` now — Thailand/Laos from
// their dish pools, Cambodia/Vietnam retrofitted from their regular Food quests.
const FOOD_TIERS: (FoodTier | 'all')[] = ['all', 'common', 'rare', 'unique'];

export interface FoodHallViewProps {
  /** Which country's food hall to render. Defaults to Thailand. */
  country?: 'thailand' | 'laos' | 'cambodia' | 'vietnam';
}

export const FoodHallView: React.FC<FoodHallViewProps> = ({ country = 'thailand' }) => {
  const navigation = useAppNavigation();
  const isLaos = country === 'laos';
  // Cambodia and Vietnam have no dedicated dish pool — their food quests live in
  // the regular data and are grouped by their geographic region, so they source
  // from `all_quests` and key sections off `region` instead of `food_region`.
  const usesRegularData = country === 'cambodia' || country === 'vietnam';
  const regionOrder =
    country === 'vietnam' ? VIETNAM_FOOD_REGION_ORDER
    : country === 'cambodia' ? CAMBODIA_FOOD_REGION_ORDER
    : isLaos ? LAOS_FOOD_REGION_ORDER
    : FOOD_REGION_ORDER;

  /** The region key(s) a quest belongs to for this hall. */
  const regionsOf = useMemo(
    () =>
      usesRegularData
        ? (q: Quest): string[] => (q.region ? [q.region] : [])
        : (q: Quest): string[] => q.food_regions ?? (q.food_region ? [q.food_region] : []),
    [usesRegularData],
  );
  /** The primary region key used to bucket a quest into a section. */
  const primaryRegionOf = useMemo(
    () => (usesRegularData ? (q: Quest) => q.region : (q: Quest) => q.food_region),
    [usesRegularData],
  );

  // Thailand/Laos draw from the dedicated dish pool (split by food_country);
  // Cambodia/Vietnam draw their Food-category quests from the shared regular pool.
  const dishPool = useQuestStore((s) => s.food_quests);
  const allQuests = useQuestStore((s) => s.all_quests);
  const foodQuests = useMemo(
    () =>
      usesRegularData
        ? allQuests.filter((q) => q.category === 'Food' && countryForRegionKey(q.region)?.id === country)
        : dishPool.filter((q) => (q.food_country ?? 'thailand') === country),
    [usesRegularData, allQuests, dishPool, country],
  );

  const completedIds = useQuestStore((s) => s.completed_quest_ids);
  const [tier, setTier] = useState<FoodTier | 'all'>('all');
  const [region, setRegion] = useState<string>('all');

  const cardW = (width - SIZES.spacingMd * 2 - SIZES.spacingSm) / 2;
  const completed = useMemo(() => new Set(completedIds), [completedIds]);

  // Region chips — every region present in this country's dishes, in order.
  const regionChips = useMemo(() => {
    const present = new Set(foodQuests.flatMap(regionsOf));
    const ordered = regionOrder.filter((r) => present.has(r));
    const extras = [...present].filter((r) => !regionOrder.includes(r));
    return [...ordered, ...extras];
  }, [foodQuests, regionOrder, regionsOf]);

  const filtered = useMemo(
    () =>
      foodQuests.filter(
        (q) =>
          (tier === 'all' || q.food_tier === tier) &&
          (region === 'all' || regionsOf(q).includes(region)),
      ),
    [foodQuests, tier, region, regionsOf],
  );

  // Group into sections. With a region selected, everything sits under that one
  // header (multi-region dishes included); otherwise group by primary region.
  const sections = useMemo(() => {
    if (region !== 'all') return filtered.length ? [{ region, quests: filtered }] : [];
    const byRegion: Record<string, Quest[]> = {};
    filtered.forEach((q) => {
      const key = primaryRegionOf(q) ?? 'Other';
      (byRegion[key] ||= []).push(q);
    });
    const ordered = regionOrder.filter((r) => byRegion[r]?.length);
    const extras = Object.keys(byRegion).filter((r) => !regionOrder.includes(r));
    return [...ordered, ...extras].map((r) => ({ region: r, quests: byRegion[r] }));
  }, [filtered, region, regionOrder, primaryRegionOf]);

  const collectedCount = foodQuests.filter((q) => completed.has(q.id)).length;
  const placeName = country === 'vietnam' ? 'Vietnam' : country === 'cambodia' ? 'Cambodia' : isLaos ? 'Laos' : 'Thailand';

  return (
    <View>
      {/* Night-market banner */}
      <View
        style={{
          backgroundColor: '#2a1742',
          borderWidth: SIZES.cardAccentWidth,
          borderColor: '#b18ce0',
          borderRadius: SIZES.borderRadius,
          padding: SIZES.spacingMd,
          marginBottom: SIZES.spacingMd,
        }}
      >
        <PixelText size={16} color="#ffd9f0">🏮 FOOD HALL</PixelText>
        <PixelText size={7} variant="body" color="#cdb8ec" style={{ marginTop: 6 }}>
          {`Every must-try dish in ${placeName}, all in one night market. ${collectedCount}/${foodQuests.length} collected.`}
        </PixelText>
      </View>

      <FoodHallDiceBanner country={country} foodQuests={foodQuests} completed={completed} />

      {/* Region filter — same sorting the Today tab offers */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 2 }}>
        <PixelButton
          label="ALL REGIONS"
          size="sm"
          variant={region === 'all' ? 'solid' : 'outline'}
          color={region === 'all' ? '#b18ce0' : COLORS.TEXT_SECONDARY}
          onPress={() => setRegion('all')}
          style={{ marginRight: 6, marginBottom: 6 }}
        />
        {regionChips.map((r) => (
          <PixelButton
            key={r}
            label={r}
            size="sm"
            variant={region === r ? 'solid' : 'outline'}
            color={region === r ? '#b18ce0' : COLORS.TEXT_SECONDARY}
            onPress={() => setRegion(r)}
            style={{ marginRight: 6, marginBottom: 6 }}
          />
        ))}
      </ScrollView>

      {/* Tier (Common/Rare/Unique) filter */}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: SIZES.spacingSm }}>
        {FOOD_TIERS.map((t) => (
          <PixelButton
            key={t}
            label={t === 'all' ? 'ALL' : FOOD_TIER_LABEL[t]}
            size="sm"
            variant={tier === t ? 'solid' : 'outline'}
            color={tier === t ? (t === 'all' ? COLORS.PURPLE : FOOD_TIER_COLOR[t]) : COLORS.TEXT_SECONDARY}
            onPress={() => setTier(t)}
            style={{ marginRight: 6, marginBottom: 6 }}
          />
        ))}
      </View>

      {sections.length === 0 ? (
        <PixelText size={8} variant="body" color={COLORS.TEXT_DISABLED}>No dishes at this tier.</PixelText>
      ) : (
        sections.map(({ region, quests }) => (
          <View key={region} style={{ marginBottom: SIZES.spacingLg }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: SIZES.spacingSm }}>
              <PixelText size={10} color="#b18ce0">{region.toUpperCase()}</PixelText>
              <PixelText size={7} color={COLORS.TEXT_DISABLED} style={{ marginLeft: 'auto' }}>{`${quests.length}`}</PixelText>
            </View>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
              {quests.map((q) => (
                <FoodCard
                  key={q.id}
                  quest={q}
                  completed={completed.has(q.id)}
                  width={cardW}
                  onPress={() => navigation.navigate('QuestDetail', { questId: q.id })}
                  style={{ marginBottom: SIZES.spacingSm }}
                />
              ))}
            </View>
          </View>
        ))
      )}
    </View>
  );
};

export default FoodHallView;
