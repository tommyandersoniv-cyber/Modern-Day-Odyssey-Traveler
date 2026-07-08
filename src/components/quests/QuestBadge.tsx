// ============================================================================
// QuestBadge — a small pill showing quest type and/or rarity.
// ============================================================================

import React from 'react';
import { StyleProp, View, ViewStyle } from 'react-native';
import type { QuestRarity, QuestType } from '../../types';
import { COLORS, QUEST_TYPE_COLOR, RARITY_COLOR, RARITY_LABEL, SIZES } from '../../utils/constants';
import { PixelText } from '../ui/PixelText';

export interface QuestBadgeProps {
  type?: QuestType;
  rarity?: QuestRarity;
  /** Override the displayed label entirely. */
  label?: string;
  /** Override colour. */
  color?: string;
  size?: number;
  style?: StyleProp<ViewStyle>;
}

const TYPE_LABEL: Record<QuestType, string> = {
  main: 'MAIN',
  side: 'SIDE',
  legacy: 'LEGACY',
  chaos: 'CHAOS',
  boss: 'BOSS',
  user_created: 'CUSTOM',
};

export const QuestBadge: React.FC<QuestBadgeProps> = ({
  type,
  rarity,
  label,
  color,
  size = 7,
  style,
}) => {
  const text = label ?? (rarity ? RARITY_LABEL[rarity] : type ? TYPE_LABEL[type] : '');
  const tint =
    color ?? (rarity ? RARITY_COLOR[rarity] : type ? QUEST_TYPE_COLOR[type] : COLORS.TEXT_SECONDARY);
  return (
    <View
      style={[
        {
          alignSelf: 'flex-start',
          backgroundColor: 'transparent',
          borderWidth: SIZES.borderWidth,
          borderColor: tint,
          paddingVertical: 3,
          paddingHorizontal: 6,
        },
        style,
      ]}
    >
      <PixelText size={size} color={tint}>
        {text}
      </PixelText>
    </View>
  );
};

export default QuestBadge;
