// ============================================================================
// TravelerDexScreen — the Traveler-Dex. A drill-in console (not a long scroll):
//   HOME → stats / sprite / skills
//   COUNTRIES → regions → cities → zones
//   QUESTS → collectible card gallery (filter by type / region)
//   CHARACTERS → people met (group by region, sort by recency)
// ============================================================================

import React, { useMemo, useState } from 'react';
import { Dimensions, Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { Character, QuestType } from '../types';
import { COLORS, ODYSSEY_LEVELS, SIZES, odysseyCostForLevel } from '../utils/constants';
import { formatDate, formatNumber } from '../utils/helpers';
import { getLevelProgress, getNextLevelDef, getTitle } from '../utils/xp';
import { customRegionMetas, getRegionCities, worldCityMeta } from '../utils/world';
import { availableCountries, countryForRegionKey, getCountryRegions, isOdysseyCountryRegion } from '../utils/countries';
import { useAppNavigation, useTabPressReset, AppNav } from '../navigation/hooks';
import { useGameStore } from '../store/useGameStore';
import { useQuestStore } from '../store/useQuestStore';
import { useChaosStore } from '../store/useChaosStore';
import { useCodexStore } from '../store/useCodexStore';
import { useArchiveStore } from '../store/useArchiveStore';
import { useWorldStore } from '../store/useWorldStore';

import { PixelText } from '../components/ui/PixelText';
import { PixelButton } from '../components/ui/PixelButton';
import { PixelModal } from '../components/ui/PixelModal';
import { ScreenHeader } from '../components/ui/ScreenHeader';
import { LiveClock } from '../components/ui/LiveClock';
import { XPBar } from '../components/quests/XPBar';
import { PlayerSprite } from '../components/map/PlayerSprite';
import { RegionBadgeJigsaw } from '../components/ui/RegionBadgeJigsaw';
import { QuestTradingCard } from '../components/quests/QuestTradingCard';
import { PixelAvatar } from '../components/codex/PixelAvatar';
import { TempleRankingsView } from './dex/TempleRankingsView';
import { MilestonesView } from './dex/MilestonesView';
import { getFacetCounts } from '../utils/activity';

const { width } = Dimensions.get('window');
type DexView = 'home' | 'quests' | 'characters' | 'temples' | 'milestones';

// A tappable stat tile — tapping opens its detail page. Two per row (48%).
const Stat: React.FC<{ label: string; value: string; color: string; onPress?: () => void }> = ({ label, value, color, onPress }) => (
  <Pressable
    onPress={onPress}
    style={{ width: '48%', backgroundColor: COLORS.BG_CARD, borderWidth: SIZES.borderWidth, borderColor: COLORS.BG_BORDER, borderTopWidth: SIZES.cardAccentWidth, borderTopColor: color, padding: SIZES.spacingSm, marginBottom: SIZES.spacingSm }}
  >
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
      <PixelText size={14} color={color} style={{ flex: 1 }}>{value}</PixelText>
      <PixelText size={8} color={COLORS.TEXT_DISABLED}>{'>'}</PixelText>
    </View>
    <PixelText size={6} color={COLORS.TEXT_SECONDARY} style={{ marginTop: 4 }} numberOfLines={2}>{label}</PixelText>
  </Pressable>
);

const Chip: React.FC<{ label: string; active: boolean; color: string; onPress: () => void }> = ({ label, active, color, onPress }) => (
  <PixelButton label={label} size="sm" variant={active ? 'solid' : 'outline'} color={active ? color : COLORS.TEXT_SECONDARY} onPress={onPress} style={{ marginRight: 6, marginBottom: 6 }} />
);

export default function TravelerDexScreen() {
  const navigation = useAppNavigation();
  const [view, setView] = useState<DexView>('home');
  const [selRegion, setSelRegion] = useState<string | null>(null);
  const [selCity, setSelCity] = useState<string | null>(null);

  // Tapping the Dex tab returns to its home screen.
  useTabPressReset(() => {
    setView('home');
    setSelRegion(null);
    setSelCity(null);
  });

  const headerTitle =
    view === 'home' ? 'TRAVEL-DEX'
    : view === 'quests' ? 'QUEST CARDS'
    : view === 'characters' ? 'CHARACTERS'
    : view === 'temples' ? 'TEMPLE RANKINGS'
    : selCity ? selCity.toUpperCase()
    : selRegion ? selRegion.toUpperCase()
    : 'MEDALS & MILESTONES';

  const goBack = () => {
    if (view === 'milestones') {
      if (selCity) return setSelCity(null);
      if (selRegion) return setSelRegion(null);
    }
    setView('home');
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.BG_DARK }} edges={['top']}>
      <ScreenHeader
        title={headerTitle}
        accent={COLORS.GOLD}
        onBack={view === 'home' ? undefined : goBack}
        right={view === 'home' ? <LiveClock size={9} /> : undefined}
      />
      <ScrollView contentContainerStyle={{ padding: SIZES.spacingMd, paddingBottom: 48 }}>
        {view === 'home' ? <HomeView onNav={(v) => { setView(v); setSelRegion(null); setSelCity(null); }} /> : null}
        {view === 'quests' ? <QuestsView nav={navigation} /> : null}
        {view === 'characters' ? <CharactersView nav={navigation} /> : null}
        {view === 'temples' ? <TempleRankingsView /> : null}
        {view === 'milestones' ? (
          <>
            {/* Regions & cities medal collection (drillable) + milestone medals. */}
            <CountriesView selRegion={selRegion} selCity={selCity} onRegion={setSelRegion} onCity={setSelCity} />
            {!selRegion && !selCity ? (
              <View style={{ marginTop: SIZES.spacingLg, borderTopWidth: SIZES.borderWidth, borderTopColor: COLORS.BG_BORDER, paddingTop: SIZES.spacingLg }}>
                <MilestonesView />
              </View>
            ) : null}
          </>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

// ---------------------------------------------------------------------------
// HOME
// ---------------------------------------------------------------------------
const HomeView: React.FC<{ onNav: (v: DexView) => void }> = ({ onNav }) => {
  const player = useGameStore((s) => s.player);
  const gameMode = useGameStore((s) => s.game_mode);
  const setGameMode = useGameStore((s) => s.setGameMode);
  const odysseyLevel = useGameStore((s) => s.odyssey_level);
  const setOdysseyLevel = useGameStore((s) => s.setOdysseyLevel);
  const completedQuests = useQuestStore((s) => s.completed_quest_ids);
  const completedChaos = useChaosStore((s) => s.completed_chaos_ids);
  const characters = useCodexStore((s) => s.characters);
  const entries = useArchiveStore((s) => s.entries);

  const next = getNextLevelDef(player.xp_total);
  const citiesVisited = new Set(entries.map((e) => e.city).filter(Boolean)).size;
  const countriesVisited = new Set(
    entries.map((e) => countryForRegionKey(e.region ?? undefined)?.id).filter(Boolean),
  ).size;
  // "Visited" = at least one completed quest there — same standard as
  // countries/cities above (both read straight off archive entries). A region
  // is marked visited the instant its first quest is logged; it does NOT wait
  // for the region badge (which requires full city-medal completion — a
  // separate, stricter achievement still tracked by regionBadges/unlocked for
  // the jigsaw view). isOdysseyCountryRegion filters out the Cross-Region /
  // hall sentinel keys chaos and legendary-hall completions can carry.
  const regionsVisited = new Set(
    entries.map((e) => e.region).filter((r) => isOdysseyCountryRegion(r)),
  ).size;
  // Temple counter — total temples (Wat / shrine / pagoda…) the player has visited.
  const templesVisited = useMemo(() => getFacetCounts().temple, [completedQuests, completedChaos]);

  // Confirm via a PixelModal — RN's Alert is a no-op on web (the Netlify build).
  const [confirmReset, setConfirmReset] = useState(false);

  const doReset = () => {
    useGameStore.getState().resetGame();
    useQuestStore.getState().reset();
    useChaosStore.getState().reset();
    useCodexStore.getState().reset();
    useArchiveStore.getState().reset();
    useWorldStore.getState().reset();
    useGameStore.getState().recomputeBadges();
    setConfirmReset(false);
  };

  return (
    <View>
      {/* Trainer centered within the padded content, just above name + level. */}
      <View style={{ height: 80, marginBottom: SIZES.spacingSm }}>
        <PlayerSprite x={(width - SIZES.spacingMd * 2) / 2} y={40} size={32} />
      </View>
      <PixelText size={16} color={COLORS.GOLD} align="center">{player.name}</PixelText>
      <PixelText size={9} color={COLORS.TEXT_SECONDARY} align="center" style={{ marginTop: 6 }}>{`LV ${player.level} - ${getTitle(player.xp_total)}`}</PixelText>
      <View style={{ marginTop: SIZES.spacingMd }}>
        <XPBar progress={getLevelProgress(player.xp_total)} color={COLORS.GOLD} label={next ? `${formatNumber(player.xp_total)} / ${formatNumber(next.threshold)} XP` : `${formatNumber(player.xp_total)} XP - MAX`} />
      </View>

      {/* Four tappable stat tiles — each opens its detail page. Regions & cities
          (with medals) live under Milestones. */}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginTop: SIZES.spacingLg }}>
        <Stat label="QUESTS DONE" value={formatNumber(completedQuests.length + completedChaos.length)} color={COLORS.BLUE} onPress={() => onNav('quests')} />
        <Stat label="CHARACTERS" value={formatNumber(characters.length)} color={COLORS.TEAL} onPress={() => onNav('characters')} />
        <Stat label="TEMPLES" value={formatNumber(templesVisited)} color={COLORS.RED} onPress={() => onNav('temples')} />
        <Stat label="COUNTRIES / REGIONS / CITIES" value={`${formatNumber(countriesVisited)} / ${formatNumber(regionsVisited)} / ${formatNumber(citiesVisited)}`} color={COLORS.PURPLE} onPress={() => onNav('milestones')} />
      </View>

      {/* Game mode switcher — Odyssey is the default journey; Exploration is a
          free-roam mode with no boss/chaos and every region open. */}
      <View style={{ marginTop: SIZES.spacingLg, alignItems: 'center' }}>
        <PixelText size={9} color={COLORS.GOLD} align="center" style={{ marginBottom: SIZES.spacingSm }}>GAME MODE</PixelText>
        <View style={{ flexDirection: 'row' }}>
          <PixelButton
            label="ODYSSEY"
            size="sm"
            color={gameMode === 'odyssey' ? COLORS.PURPLE : COLORS.BG_BORDER}
            textColor={gameMode === 'odyssey' ? COLORS.BG_DARK : COLORS.TEXT_SECONDARY}
            onPress={() => setGameMode('odyssey')}
            style={{ marginHorizontal: 4 }}
          />
          <PixelButton
            label="EXPLORATION"
            size="sm"
            color={gameMode === 'exploration' ? COLORS.GOLD : COLORS.BG_BORDER}
            textColor={gameMode === 'exploration' ? COLORS.BG_DARK : COLORS.TEXT_SECONDARY}
            onPress={() => setGameMode('exploration')}
            style={{ marginHorizontal: 4 }}
          />
        </View>
        <PixelText size={6} variant="body" color={COLORS.TEXT_DISABLED} align="center" style={{ marginTop: 4 }}>
          {gameMode === 'odyssey'
            ? 'Regions unlock in sequence as you earn XP. Boss + chaos on entry.'
            : 'Free roam — every region open, no boss or chaos.'}
        </PixelText>
      </View>

      {/* Change your Odyssey level any time, centered above the reset button. */}
      {gameMode === 'odyssey' ? (
        <View style={{ marginTop: SIZES.spacingXl, alignItems: 'center' }}>
          <PixelText size={9} color={COLORS.PURPLE} align="center" style={{ marginBottom: SIZES.spacingSm }}>ODYSSEY LEVEL</PixelText>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center' }}>
            {ODYSSEY_LEVELS.map((lv) => (
              <PixelButton
                key={lv.level}
                label={`${lv.level} · ${lv.name.toUpperCase()}`}
                size="sm"
                color={odysseyLevel === lv.level ? COLORS.PURPLE : COLORS.BG_BORDER}
                textColor={odysseyLevel === lv.level ? COLORS.BG_DARK : COLORS.TEXT_SECONDARY}
                onPress={() => setOdysseyLevel(lv.level)}
                style={{ marginHorizontal: 3, marginBottom: 6 }}
              />
            ))}
          </View>
          <PixelText size={6} variant="body" color={COLORS.TEXT_DISABLED} align="center" style={{ marginTop: 2 }}>
            {`Each new region costs ${formatNumber(odysseyCostForLevel(odysseyLevel ?? 1))} XP at this level.`}
          </PixelText>
        </View>
      ) : null}

      <PixelButton label="RESET GAME" variant="outline" color={COLORS.RED} size="sm" fullWidth onPress={() => setConfirmReset(true)} style={{ marginTop: SIZES.spacingXl }} />

      <PixelModal visible={confirmReset} onClose={() => setConfirmReset(false)} title="RESET GAME" accent={COLORS.RED}>
        <PixelText size={9} color={COLORS.TEXT_PRIMARY} style={{ marginBottom: SIZES.spacingMd }}>
          Erase all progress and start over?
        </PixelText>
        <PixelText size={7} variant="body" color={COLORS.TEXT_SECONDARY} style={{ marginBottom: SIZES.spacingMd }}>
          This wipes your XP, quests, characters, archive, custom places, and Odyssey progress. It can't be undone.
        </PixelText>
        <PixelButton label="ERASE EVERYTHING" color={COLORS.RED} size="md" fullWidth onPress={doReset} style={{ marginBottom: SIZES.spacingSm }} />
        <PixelButton label="CANCEL" variant="outline" color={COLORS.TEXT_SECONDARY} size="md" fullWidth onPress={() => setConfirmReset(false)} />
      </PixelModal>
    </View>
  );
};

// ---------------------------------------------------------------------------
// COUNTRIES -> regions -> cities -> zones
// ---------------------------------------------------------------------------
const CountriesView: React.FC<{ selRegion: string | null; selCity: string | null; onRegion: (r: string | null) => void; onCity: (c: string | null) => void }> = ({ selRegion, selCity, onRegion, onCity }) => {
  const medals = useGameStore((s) => s.medals);
  const regionBadges = useGameStore((s) => s.region_badges);
  const completedQuests = useQuestStore((s) => s.completed_quest_ids);
  const getQuestsByZone = useQuestStore((s) => s.getQuestsByZone);
  const getQuestsByCity = useQuestStore((s) => s.getQuestsByCity);
  const customRegions = useWorldStore((s) => s.customRegions);
  useWorldStore((s) => s.customCities);
  // One section per available country (Thailand, Laos, …) plus "My Places".
  const sections = useMemo(() => {
    const out = availableCountries().map((c) => ({ title: c.name, regions: getCountryRegions(c) }));
    const custom = customRegionMetas();
    return custom.length ? [...out, { title: 'My Places', regions: custom }] : out;
  }, [customRegions]);

  if (selCity) {
    const zones = worldCityMeta(selCity)?.zones ?? [];
    return (
      <View>
        {zones.length === 0 ? (
          <PixelText size={8} variant="body" color={COLORS.TEXT_DISABLED}>This place has no zones - browse its quests from the Map.</PixelText>
        ) : zones.map((z) => {
          const qs = getQuestsByZone(selCity, z);
          const done = qs.filter((q) => completedQuests.includes(q.id)).length;
          return (
            <View key={z} style={{ backgroundColor: COLORS.BG_CARD, borderWidth: SIZES.borderWidth, borderColor: COLORS.BG_BORDER, padding: SIZES.spacingMd, marginBottom: SIZES.spacingSm }}>
              <PixelText size={9} color={COLORS.TEXT_PRIMARY}>{z}</PixelText>
              <XPBar progress={qs.length ? done / qs.length : 0} color={COLORS.GOLD} label={`${done}/${qs.length} quests`} style={{ marginTop: 6 }} />
            </View>
          );
        })}
      </View>
    );
  }

  if (selRegion) {
    const cities = getRegionCities(selRegion);
    return (
      <View>
        {cities.length === 0 ? (
          <PixelText size={8} variant="body" color={COLORS.TEXT_DISABLED}>No cities here yet.</PixelText>
        ) : cities.map((c) => {
          const qs = getQuestsByCity(c.name);
          const done = qs.filter((q) => completedQuests.includes(q.id)).length;
          const medaled = medals.some((m) => m.city === c.name && m.region === selRegion && m.earned);
          return (
            <Pressable key={c.name} onPress={() => onCity(c.name)} style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.BG_CARD, borderWidth: SIZES.borderWidth, borderColor: medaled ? COLORS.GOLD : COLORS.BG_BORDER, padding: SIZES.spacingMd, marginBottom: SIZES.spacingSm }}>
              <View style={{ flex: 1 }}>
                <PixelText size={9} color={COLORS.TEXT_PRIMARY}>{c.name}</PixelText>
                <PixelText size={6} color={medaled ? COLORS.GOLD : COLORS.TEXT_SECONDARY} style={{ marginTop: 4 }}>{`${done}/${qs.length} quests${medaled ? ' - MEDAL' : ''}`}</PixelText>
              </View>
              <PixelText size={9} color={COLORS.TEAL}>{'>'}</PixelText>
            </Pressable>
          );
        })}
      </View>
    );
  }

  return (
    <View>
      {sections.map((section) => (
        <View key={section.title} style={{ marginBottom: SIZES.spacingMd }}>
          <PixelText size={9} color={COLORS.GOLD} style={{ marginBottom: SIZES.spacingSm }}>{section.title.toUpperCase()}</PixelText>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
            {section.regions.map((r) => {
              const rb = regionBadges.find((b) => b.region === r.region);
              const cities = getRegionCities(r.region).map((c) => c.name);
              const medaled = medals.filter((m) => m.region === r.region && m.earned).map((m) => m.city);
              return (
                <Pressable key={r.region} onPress={() => onRegion(r.region)} style={{ width: '48%', backgroundColor: COLORS.BG_CARD, borderWidth: SIZES.borderWidth, borderColor: rb?.unlocked ? COLORS.GOLD : COLORS.BG_BORDER, padding: SIZES.spacingSm, marginBottom: SIZES.spacingSm, alignItems: 'center' }}>
                  <RegionBadgeJigsaw region={r.region} cities={cities} medaledCities={medaled} accent={r.accent} size={92} />
                  <PixelText size={7} color={r.accent} align="center" numberOfLines={2} style={{ marginTop: 6 }}>{r.name.toUpperCase()}</PixelText>
                  <PixelText size={6} color={COLORS.TEXT_SECONDARY} style={{ marginTop: 2 }}>{`${medaled.length}/${cities.length} medals`}</PixelText>
                </Pressable>
              );
            })}
          </View>
        </View>
      ))}
    </View>
  );
};

// ---------------------------------------------------------------------------
// QUESTS — collectible card gallery
// ---------------------------------------------------------------------------
const QuestsView: React.FC<{ nav: AppNav }> = ({ nav }) => {
  const entries = useArchiveStore((s) => s.entries);
  const [typeFilter, setTypeFilter] = useState<QuestType | 'all'>('all');
  const [regionFilter, setRegionFilter] = useState<string>('all');
  const regionsPresent = useMemo(() => Array.from(new Set(entries.map((e) => e.region).filter(Boolean))) as string[], [entries]);
  const cardW = (width - SIZES.spacingMd * 2 - SIZES.spacingSm) / 2;
  const TYPES: (QuestType | 'all')[] = ['all', 'side', 'legacy', 'chaos', 'boss', 'user_created'];
  const filtered = entries.filter((e) => (typeFilter === 'all' || e.quest_type === typeFilter) && (regionFilter === 'all' || e.region === regionFilter));

  return (
    <View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 4 }}>
        {TYPES.map((t) => <Chip key={t} label={t === 'all' ? 'ALL' : t === 'user_created' ? 'CUSTOM' : t.toUpperCase()} active={typeFilter === t} color={COLORS.GOLD} onPress={() => setTypeFilter(t)} />)}
      </ScrollView>
      {regionsPresent.length > 1 ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: SIZES.spacingSm }}>
          <Chip label="ALL REGIONS" active={regionFilter === 'all'} color={COLORS.BLUE} onPress={() => setRegionFilter('all')} />
          {regionsPresent.map((r) => <Chip key={r} label={r.toUpperCase()} active={regionFilter === r} color={COLORS.BLUE} onPress={() => setRegionFilter(r)} />)}
        </ScrollView>
      ) : null}

      {filtered.length === 0 ? (
        <PixelText size={8} variant="body" color={COLORS.TEXT_DISABLED} style={{ marginTop: SIZES.spacingMd }}>No cards yet. Complete quests to collect them.</PixelText>
      ) : (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
          {filtered.map((e) => (
            <QuestTradingCard key={e.id} entry={e} width={cardW} style={{ marginBottom: SIZES.spacingSm }} onPress={() => nav.navigate('ArchiveEntry', { entryId: e.id })} />
          ))}
        </View>
      )}
    </View>
  );
};

// ---------------------------------------------------------------------------
// CHARACTERS
// ---------------------------------------------------------------------------
const CharactersView: React.FC<{ nav: AppNav }> = ({ nav }) => {
  const characters = useCodexStore((s) => s.characters);
  const [sort, setSort] = useState<'region' | 'recent'>('region');

  if (characters.length === 0) {
    return <PixelText size={8} variant="body" color={COLORS.TEXT_DISABLED}>No characters met yet.</PixelText>;
  }

  const card = (c: Character) => (
    <Pressable key={c.id} onPress={() => nav.navigate('CharacterDetail', { characterId: c.id })} style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.BG_CARD, borderWidth: SIZES.borderWidth, borderColor: COLORS.BG_BORDER, padding: SIZES.spacingSm, marginBottom: SIZES.spacingSm }}>
      <PixelAvatar uri={c.pixel_avatar_uri} appearance={c.appearance} size={22} />
      <View style={{ flex: 1, marginLeft: SIZES.spacingSm }}>
        <PixelText size={8} color={COLORS.TEXT_PRIMARY}>{c.name}</PixelText>
        <PixelText size={6} color={COLORS.TEXT_SECONDARY} style={{ marginTop: 4 }}>{`${c.custom_location || c.city || c.region} - ${formatDate(c.date_met)}`}</PixelText>
      </View>
    </Pressable>
  );

  return (
    <View>
      <View style={{ flexDirection: 'row', marginBottom: SIZES.spacingSm }}>
        <Chip label="BY REGION" active={sort === 'region'} color={COLORS.TEAL} onPress={() => setSort('region')} />
        <Chip label="MOST RECENT" active={sort === 'recent'} color={COLORS.TEAL} onPress={() => setSort('recent')} />
      </View>
      {sort === 'recent'
        ? [...characters].sort((a, b) => (a.date_met < b.date_met ? 1 : -1)).map(card)
        : Array.from(new Set(characters.map((c) => c.region))).map((region) => (
            <View key={region} style={{ marginBottom: SIZES.spacingMd }}>
              <PixelText size={9} color={COLORS.TEAL} style={{ marginBottom: SIZES.spacingSm }}>{region.toUpperCase()}</PixelText>
              {characters.filter((c) => c.region === region).map(card)}
            </View>
          ))}
    </View>
  );
};
