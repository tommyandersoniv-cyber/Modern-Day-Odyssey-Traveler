// ============================================================================
// MilestonesView — the achievements wall. Shows progress toward the next medal
// on each track, plus every medal already earned (most recent first).
// ============================================================================

import React, { useMemo } from 'react';
import { View } from 'react-native';
import { COLORS, SIZES } from '../../utils/constants';
import { formatNumber, formatDate, clamp } from '../../utils/helpers';
import { getActivityStats } from '../../utils/activity';
import { progressLadders } from '../../utils/milestones';
import { useGameStore } from '../../store/useGameStore';
import { useQuestStore } from '../../store/useQuestStore';
import { useChaosStore } from '../../store/useChaosStore';
import { useCodexStore } from '../../store/useCodexStore';
import { useWorldStore } from '../../store/useWorldStore';
import { PixelText } from '../../components/ui/PixelText';
import { XPBar } from '../../components/quests/XPBar';

export const MilestonesView: React.FC = () => {
  const milestones = useGameStore((s) => s.milestones);
  const level = useGameStore((s) => s.player.level);
  const regionEntries = useGameStore((s) => s.region_entries);
  const completedStd = useQuestStore((s) => s.completed_quest_ids);
  const userQuests = useQuestStore((s) => s.user_quests);
  const completedChaos = useChaosStore((s) => s.completed_chaos_ids);
  const characters = useCodexStore((s) => s.characters);
  const customRegions = useWorldStore((s) => s.customRegions);
  const customCities = useWorldStore((s) => s.customCities);

  const ladders = useMemo(
    () => progressLadders(getActivityStats()),
    [level, regionEntries, completedStd, userQuests, completedChaos, characters, customRegions, customCities],
  );

  const earned = useMemo(
    () => [...milestones].sort((a, b) => (b.earned_at ?? '').localeCompare(a.earned_at ?? '')),
    [milestones],
  );

  const totalBonusXP = useMemo(() => milestones.reduce((sum, m) => sum + (m.xp || 0), 0), [milestones]);

  return (
    <View>
      {/* Summary banner */}
      <View style={{ backgroundColor: COLORS.BG_CARD, borderWidth: SIZES.borderWidth, borderColor: COLORS.BG_BORDER, borderTopWidth: SIZES.cardAccentWidth, borderTopColor: COLORS.GOLD, padding: SIZES.spacingMd, marginBottom: SIZES.spacingLg }}>
        <PixelText size={20} color={COLORS.GOLD}>{formatNumber(milestones.length)}</PixelText>
        <PixelText size={7} color={COLORS.TEXT_SECONDARY} style={{ marginTop: 4 }}>
          {`MEDALS EARNED · ${formatNumber(totalBonusXP)} BONUS XP`}
        </PixelText>
      </View>

      {/* Progress to next medal on each track */}
      <PixelText size={9} color={COLORS.TEAL} style={{ marginBottom: SIZES.spacingSm }}>IN PROGRESS</PixelText>
      {ladders.map((l) => (
        <View key={l.key} style={{ marginBottom: SIZES.spacingMd }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
            <PixelText size={14} style={{ marginRight: 6 }}>{l.glyph}</PixelText>
            <PixelText size={8} color={COLORS.TEXT_PRIMARY} style={{ flex: 1 }}>{l.label.toUpperCase()}</PixelText>
            <PixelText size={7} color={COLORS.TEXT_SECONDARY}>
              {l.target == null ? `${formatNumber(l.current)} · MAX` : `${formatNumber(l.current)} / ${formatNumber(l.target)}`}
            </PixelText>
          </View>
          <XPBar
            progress={l.target == null ? 1 : clamp(l.current / l.target, 0, 1)}
            color={l.color}
            label={l.target == null ? 'All medals earned' : `Next medal: +${formatNumber(l.xp ?? 0)} XP`}
          />
        </View>
      ))}

      {/* Earned medals */}
      <PixelText size={9} color={COLORS.GOLD} style={{ marginTop: SIZES.spacingMd, marginBottom: SIZES.spacingSm }}>
        {`MEDAL CASE (${earned.length})`}
      </PixelText>
      {earned.length === 0 ? (
        <PixelText size={8} variant="body" color={COLORS.TEXT_DISABLED}>
          No medals yet. Complete quests, visit temples, and explore to earn them.
        </PixelText>
      ) : (
        earned.map((m) => (
          <View
            key={m.id}
            style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.BG_CARD, borderWidth: SIZES.borderWidth, borderColor: COLORS.BG_BORDER, borderLeftWidth: SIZES.cardAccentWidth, borderLeftColor: m.color, borderRadius: SIZES.borderRadius, padding: SIZES.spacingSm, marginBottom: SIZES.spacingSm }}
          >
            <View style={{ width: 40, height: 40, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.BG_SURFACE, borderWidth: SIZES.borderWidth, borderColor: m.color, borderRadius: SIZES.borderRadius, marginRight: SIZES.spacingSm }}>
              <PixelText size={20}>{m.glyph}</PixelText>
            </View>
            <View style={{ flex: 1 }}>
              <PixelText size={8} color={m.color} numberOfLines={1}>{m.title}</PixelText>
              <PixelText size={6} variant="body" color={COLORS.TEXT_SECONDARY} numberOfLines={1} style={{ marginTop: 3 }}>{m.description}</PixelText>
              {m.earned_at ? (
                <PixelText size={6} color={COLORS.TEXT_DISABLED} style={{ marginTop: 2 }}>{formatDate(m.earned_at)}</PixelText>
              ) : null}
            </View>
            <PixelText size={8} color={COLORS.GOLD}>{`+${formatNumber(m.xp)}`}</PixelText>
          </View>
        ))
      )}
    </View>
  );
};

export default MilestonesView;
