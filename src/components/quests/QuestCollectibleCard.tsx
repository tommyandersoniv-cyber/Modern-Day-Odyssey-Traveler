// ============================================================================
// QuestCollectibleCard — a location-based quest rendered as a Food-Hall-style
// collectible card: full-bleed rarity palette, a header band with rarity +
// xp, a big category emoji in the middle, and a title/category footer.
// Used by cross-cutting hall/bucket views (e.g. each country's Legendary
// Quests hall) where the browsing-list QuestCard is too dense.
// ============================================================================

import React from 'react';
import { Pressable, StyleProp, View, ViewStyle } from 'react-native';
import type { Quest } from '../../types';
import { COLORS, RARITY_CARD_PALETTE, RARITY_LABEL, SIZES, cardCategoryEmoji } from '../../utils/constants';
import { formatNumber } from '../../utils/helpers';
import { PixelText } from '../ui/PixelText';

export interface QuestCollectibleCardProps {
  quest: Quest;
  completed: boolean;
  width?: number;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
}

export const QuestCollectibleCard: React.FC<QuestCollectibleCardProps> = ({
  quest,
  completed,
  width,
  onPress,
  style,
}) => {
  const p = RARITY_CARD_PALETTE[quest.rarity];
  const emoji = cardCategoryEmoji(quest.card_category);

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
      {/* Rarity band */}
      <View style={{ backgroundColor: p.band, paddingHorizontal: 6, paddingVertical: 4, flexDirection: 'row', alignItems: 'center' }}>
        <PixelText size={6} color={p.fg}>{RARITY_LABEL[quest.rarity]}</PixelText>
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
          {completed ? 'COLLECTED' : (quest.card_category ?? 'QUEST').toUpperCase()}
        </PixelText>
      </View>
    </Pressable>
  );
};

export default QuestCollectibleCard;
