// ============================================================================
// ChaosCard — a chaos/boss quest card (red accent, % glyph, 2x/3x XP badge).
// ============================================================================

import React from 'react';
import { Pressable, StyleProp, View, ViewStyle } from 'react-native';
import type { Quest } from '../../types';
import { CHAOS_MULTIPLIER, COLORS, RARITY_LABEL, SIZES } from '../../utils/constants';
import { formatNumber } from '../../utils/helpers';
import { PixelText } from '../ui/PixelText';
import { QuestBadge } from '../quests/QuestBadge';

export interface ChaosCardProps {
  quest: Quest;
  onPress?: () => void;
  active?: boolean;
  completed?: boolean;
  style?: StyleProp<ViewStyle>;
}

export const ChaosCard: React.FC<ChaosCardProps> = ({
  quest,
  onPress,
  active = false,
  completed = false,
  style,
}) => {
  const isBoss = !!quest.is_boss_wheel;
  const accent = isBoss ? COLORS.QUEST_BOSS : COLORS.QUEST_CHAOS;
  const xp = quest.xp_with_multiplier ?? quest.xp * CHAOS_MULTIPLIER;
  const mult = isBoss ? '3×' : `${CHAOS_MULTIPLIER}×`;

  return (
    <Pressable
      onPress={onPress}
      style={[
        {
          backgroundColor: COLORS.BG_CARD,
          borderWidth: SIZES.borderWidth,
          borderColor: active ? accent : COLORS.BG_BORDER,
          borderLeftWidth: SIZES.cardAccentWidth,
          borderLeftColor: accent,
          padding: SIZES.spacingMd,
          opacity: completed ? 0.55 : 1,
        },
        style,
      ]}
    >
      <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
        <PixelText size={16} color={accent} style={{ marginRight: SIZES.spacingSm }}>
          {completed ? 'OK' : isBoss ? '#' : '%'}
        </PixelText>
        <View style={{ flex: 1 }}>
          <PixelText size={10} color={COLORS.TEXT_PRIMARY} lineHeight={18}>
            {quest.title}
          </PixelText>
          <View style={{ flexDirection: 'row', marginTop: SIZES.spacingSm, alignItems: 'center' }}>
            <QuestBadge label={isBoss ? 'BOSS' : 'CHAOS'} color={accent} />
            <QuestBadge label={RARITY_LABEL[quest.rarity]} color={COLORS.TEXT_SECONDARY} style={{ marginLeft: 6 }} />
          </View>
          <View style={{ flexDirection: 'row', marginTop: SIZES.spacingSm, alignItems: 'center' }}>
            <PixelText size={8} color={COLORS.TEXT_DISABLED}>{quest.category}</PixelText>
            <PixelText size={11} color={COLORS.GOLD} style={{ marginLeft: 'auto' }}>
              {mult} {formatNumber(xp)} XP
            </PixelText>
          </View>
        </View>
      </View>
    </Pressable>
  );
};

export default ChaosCard;
