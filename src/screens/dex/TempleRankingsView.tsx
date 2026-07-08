// ============================================================================
// TempleRankingsView — the player's personal temple leaderboards:
//   • GLOBAL  — rank your top 10 temples across all of Thailand
//   • REGIONAL — rank your top 5 within a chosen region / city / zone
// Only temples the player has VISITED (completed) can be ranked.
// ============================================================================

import React, { useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';
import type { Quest } from '../../types';
import { COLORS, SIZES } from '../../utils/constants';
import { getCompletedTemples } from '../../utils/activity';
import { useGameStore } from '../../store/useGameStore';
import { useQuestStore } from '../../store/useQuestStore';
import { useChaosStore } from '../../store/useChaosStore';
import { PixelText } from '../../components/ui/PixelText';
import { PixelButton } from '../../components/ui/PixelButton';
import { PixelModal } from '../../components/ui/PixelModal';
import { RankableList, type RankableItem } from '../../components/dex/RankableList';

type Mode = 'global' | 'regional';
type ScopeType = 'region' | 'city' | 'zone';

const GLOBAL_MAX = 10;
const REGIONAL_MAX = 5;
const ACCENT = COLORS.GOLD;
const ZONE_SEP = ' :: '; // joins "City :: Zone" for zone scope values

function templeLocation(q: Quest): string {
  const place = q.city || q.region || 'Thailand';
  return q.zone ? `${place} · ${q.zone}` : place;
}

function toItem(q: Quest): RankableItem {
  return { id: q.id, label: q.title, sublabel: templeLocation(q) };
}

/** Split a pool into the ranked slice (in stored order, capped) + the rest. */
function resolve(pool: Quest[], order: string[], max: number): { ranked: Quest[]; available: Quest[] } {
  const byId = new Map(pool.map((q) => [q.id, q]));
  const ranked = order.map((id) => byId.get(id)).filter((q): q is Quest => !!q).slice(0, max);
  const rankedIds = new Set(ranked.map((q) => q.id));
  const available = pool.filter((q) => !rankedIds.has(q.id));
  return { ranked, available };
}

const SectionTitle: React.FC<{ text: string }> = ({ text }) => (
  <PixelText size={9} color={ACCENT} style={{ marginBottom: SIZES.spacingSm }}>{text}</PixelText>
);

const Tab: React.FC<{ label: string; active: boolean; onPress: () => void; color?: string }> = ({ label, active, onPress, color = ACCENT }) => (
  <PixelButton label={label} size="sm" variant={active ? 'solid' : 'outline'} color={active ? color : COLORS.TEXT_SECONDARY} onPress={onPress} style={{ marginRight: 6, marginBottom: 6 }} />
);

export const TempleRankingsView: React.FC = () => {
  const [mode, setMode] = useState<Mode>('global');
  const [scopeType, setScopeType] = useState<ScopeType>('region');
  const [scopeValue, setScopeValue] = useState<string | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);

  const rankings = useGameStore((s) => s.temple_rankings);
  const setGlobal = useGameStore((s) => s.setTempleRankingGlobal);
  const setRegional = useGameStore((s) => s.setTempleRankingRegional);

  // Reactive recompute when any completion set changes.
  const completedStd = useQuestStore((s) => s.completed_quest_ids);
  const completedChaos = useChaosStore((s) => s.completed_chaos_ids);
  const userQuests = useQuestStore((s) => s.user_quests);
  const temples = useMemo(() => getCompletedTemples(), [completedStd, completedChaos, userQuests]);

  // Distinct scope values that actually contain a visited temple.
  const scopeValues = useMemo(() => {
    const set = new Set<string>();
    temples.forEach((t) => {
      if (scopeType === 'region' && t.region) set.add(t.region);
      else if (scopeType === 'city' && t.city) set.add(t.city);
      else if (scopeType === 'zone' && t.city && t.zone) set.add(`${t.city}${ZONE_SEP}${t.zone}`);
    });
    return Array.from(set).sort();
  }, [temples, scopeType]);

  // The pool of temples eligible for the current mode/scope.
  const scopedPool = useMemo<Quest[]>(() => {
    if (mode === 'global') return temples;
    if (!scopeValue) return [];
    if (scopeType === 'region') return temples.filter((t) => t.region === scopeValue);
    if (scopeType === 'city') return temples.filter((t) => t.city === scopeValue);
    const [city, zone] = scopeValue.split(ZONE_SEP);
    return temples.filter((t) => t.city === city && t.zone === zone);
  }, [mode, temples, scopeType, scopeValue]);

  if (temples.length === 0) {
    return (
      <View>
        <PixelText size={8} variant="body" color={COLORS.TEXT_DISABLED}>
          No temples visited yet. Complete temple quests (Wat, shrine, pagoda) and they'll appear here to rank.
        </PixelText>
      </View>
    );
  }

  const scopeKey = scopeValue ? `${scopeType}:${scopeValue}` : null;
  const order = mode === 'global' ? rankings.global : scopeKey ? rankings.regional[scopeKey] ?? [] : [];
  const max = mode === 'global' ? GLOBAL_MAX : REGIONAL_MAX;
  const { ranked, available } = resolve(scopedPool, order, max);

  const commit = (ids: string[]) => {
    if (mode === 'global') setGlobal(ids);
    else if (scopeKey) setRegional(scopeKey, ids);
  };

  const addTemple = (id: string) => {
    if (ranked.length >= max) return;
    commit([...ranked.map((q) => q.id), id]);
    if (available.length <= 1) setPickerOpen(false);
  };

  const scopeLabel = (v: string) => (scopeType === 'zone' ? v.split(ZONE_SEP).join(' · ') : v);

  const showList = mode === 'global' || !!scopeValue;

  return (
    <View>
      {/* Mode tabs */}
      <View style={{ flexDirection: 'row', marginBottom: SIZES.spacingMd }}>
        <Tab label="GLOBAL TOP 10" active={mode === 'global'} onPress={() => setMode('global')} />
        <Tab label="REGIONAL TOP 5" active={mode === 'regional'} onPress={() => setMode('regional')} color={COLORS.TEAL} />
      </View>

      {mode === 'regional' ? (
        <View style={{ marginBottom: SIZES.spacingMd }}>
          <SectionTitle text="RANK WITHIN" />
          <View style={{ flexDirection: 'row', marginBottom: SIZES.spacingSm }}>
            {(['region', 'city', 'zone'] as ScopeType[]).map((t) => (
              <Tab key={t} label={t.toUpperCase()} active={scopeType === t} color={COLORS.TEAL} onPress={() => { setScopeType(t); setScopeValue(null); }} />
            ))}
          </View>
          {scopeValues.length === 0 ? (
            <PixelText size={7} variant="body" color={COLORS.TEXT_DISABLED}>No visited temples have a {scopeType} yet.</PixelText>
          ) : (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
              {scopeValues.map((v) => (
                <Tab key={v} label={scopeLabel(v).toUpperCase()} active={scopeValue === v} color={COLORS.GREEN} onPress={() => setScopeValue(v)} />
              ))}
            </View>
          )}
        </View>
      ) : null}

      {!showList ? (
        <PixelText size={8} variant="body" color={COLORS.TEXT_DISABLED}>
          Pick a {scopeType} above to rank your top 5 temples there.
        </PixelText>
      ) : (
        <View>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <SectionTitle text={`YOUR TOP ${max} (${ranked.length}/${max})`} />
            <PixelButton
              label={ranked.length >= max ? 'FULL' : '+ ADD'}
              size="sm"
              color={COLORS.TEAL}
              disabled={ranked.length >= max || available.length === 0}
              onPress={() => setPickerOpen(true)}
              style={{ marginBottom: 6 }}
            />
          </View>

          {ranked.length === 0 ? (
            <PixelText size={8} variant="body" color={COLORS.TEXT_DISABLED} style={{ marginBottom: SIZES.spacingSm }}>
              No temples ranked yet — tap + ADD to start your list, then drag or use the arrows to order them.
            </PixelText>
          ) : (
            <>
              <PixelText size={6} variant="body" color={COLORS.TEXT_DISABLED} style={{ marginBottom: SIZES.spacingSm }}>
                Drag the handle or tap the arrows to reorder. Tap the X to remove from your ranking.
              </PixelText>
              <RankableList items={ranked.map(toItem)} accent={ACCENT} onReorder={commit} onRemove={(id) => commit(ranked.filter((q) => q.id !== id).map((q) => q.id))} />
            </>
          )}
        </View>
      )}

      {/* Add-temple picker */}
      <PixelModal visible={pickerOpen} onClose={() => setPickerOpen(false)} title="ADD A TEMPLE" accent={ACCENT} scroll>
        {available.length === 0 ? (
          <PixelText size={8} variant="body" color={COLORS.TEXT_DISABLED}>Every visited temple here is already ranked.</PixelText>
        ) : (
          available.map((q) => (
            <Pressable
              key={q.id}
              onPress={() => addTemple(q.id)}
              style={{ backgroundColor: COLORS.BG_SURFACE, borderWidth: SIZES.borderWidth, borderColor: COLORS.BG_BORDER, borderRadius: SIZES.borderRadius, padding: SIZES.spacingSm, marginBottom: SIZES.spacingSm }}
            >
              <PixelText size={8} color={COLORS.TEXT_PRIMARY} numberOfLines={1}>{q.title}</PixelText>
              <PixelText size={6} color={COLORS.TEXT_SECONDARY} numberOfLines={1} style={{ marginTop: 3 }}>{templeLocation(q)}</PixelText>
            </Pressable>
          ))
        )}
      </PixelModal>
    </View>
  );
};

export default TempleRankingsView;
