// ============================================================================
// FoodCard — a single food quest rendered as a collectible foodie card in the
// Food Hall. Colored by its Common/Rare/Unique tier (gray/blue/gold).
// Completed foods read at full saturation with a COLLECTED stamp; uncollected
// ones are dimmed.
// ============================================================================

import React from 'react';
import { Pressable, StyleProp, View, ViewStyle } from 'react-native';
import type { Quest } from '../../types';
import { COLORS, SIZES } from '../../utils/constants';
import { formatNumber } from '../../utils/helpers';
import { foodEmoji, foodTierPalette } from '../../utils/food';
import { PixelText } from '../ui/PixelText';

export interface FoodCardProps {
  quest: Quest;
  completed: boolean;
  width?: number;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
}

export const FoodCard: React.FC<FoodCardProps> = ({ quest, completed, width, onPress, style }) => {
  const p = foodTierPalette(quest.food_tier);
  const emoji = foodEmoji(quest.food_category);

  return (
    <Pressable
      onPress={onPress}
      style={[
        {
          width,
          backgroundColor: p.bg,
          borderWidth: SIZES.cardAccentWidth,
          borderColor: p.edge,
          borderRadius: SIZES.borderRadius,
          padding: 4,
          opacity: completed ? 1 : 0.82,
        },
        style,
      ]}
    >
      {/* Tier band */}
      <View style={{ backgroundColor: p.band, paddingHorizontal: 6, paddingVertical: 4, flexDirection: 'row', alignItems: 'center' }}>
        <PixelText size={6} color={p.fg}>{p.label}</PixelText>
        <PixelText size={7} color={p.fg} style={{ marginLeft: 'auto' }}>{`${formatNumber(quest.xp)} XP`}</PixelText>
      </View>

      {/* Emoji art */}
      <View style={{ aspectRatio: 1.3, alignItems: 'center', justifyContent: 'center', marginTop: 4 }}>
        <PixelText size={44} align="center">{emoji}</PixelText>
        {completed ? (
          <View style={{ position: 'absolute', top: 4, right: 4, backgroundColor: COLORS.GREEN, paddingHorizontal: 5, paddingVertical: 2, borderRadius: SIZES.borderRadius }}>
            <PixelText size={6} color={COLORS.BG_DARK}>OK</PixelText>
          </View>
        ) : null}
      </View>

      {/* Title + category */}
      <View style={{ paddingHorizontal: 4, paddingTop: 4, paddingBottom: 2 }}>
        <PixelText size={7} color={p.fg} numberOfLines={2} lineHeight={12}>{quest.title}</PixelText>
        <PixelText size={6} color={p.sub} numberOfLines={1} style={{ marginTop: 4 }}>
          {completed ? 'COLLECTED' : (quest.food_category ?? 'FOOD').toUpperCase()}
        </PixelText>
      </View>
    </Pressable>
  );
};

export default FoodCard;
