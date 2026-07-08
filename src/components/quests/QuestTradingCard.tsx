// ============================================================================
// QuestTradingCard — a completed quest rendered as a collectible card. The
// material (bronze / silver / gold / platinum / rare) is set by the XP earned.
// ============================================================================

import React from 'react';
import { Image, Pressable, StyleProp, View, ViewStyle } from 'react-native';
import type { ArchiveEntry } from '../../types';
import { CARD_TIER, COLORS, SIZES, cardTier } from '../../utils/constants';
import { formatDate, formatNumber } from '../../utils/helpers';
import { foodEmoji, foodTierPalette } from '../../utils/food';
import { PixelText } from '../ui/PixelText';
import { QuestBadge } from './QuestBadge';

export interface QuestTradingCardProps {
  entry: ArchiveEntry;
  onPress?: () => void;
  width?: number;
  style?: StyleProp<ViewStyle>;
}

/** Foodie variant — collectible food card, colored by Common/Rare/Unique tier. */
const FoodTradingCard: React.FC<QuestTradingCardProps> = ({ entry, onPress, width, style }) => {
  const p = foodTierPalette(entry.food_tier);
  const cover = entry.cover_photo_uri || entry.photo_uris[0];
  return (
    <Pressable
      onPress={onPress}
      style={[{ width, backgroundColor: p.bg, borderWidth: SIZES.cardAccentWidth, borderColor: p.edge, padding: 4 }, style]}
    >
      <View style={{ backgroundColor: p.band, paddingHorizontal: 6, paddingVertical: 4, flexDirection: 'row', alignItems: 'center' }}>
        <PixelText size={7} color={p.fg}>{`${p.label} · FOODIE`}</PixelText>
        <PixelText size={8} color={p.fg} style={{ marginLeft: 'auto' }}>{`${formatNumber(entry.xp_earned)} XP`}</PixelText>
      </View>
      <View style={{ aspectRatio: 1, marginTop: 4, alignItems: 'center', justifyContent: 'center', borderWidth: SIZES.borderWidth, borderColor: p.edge, overflow: 'hidden' }}>
        {cover ? (
          <Image source={{ uri: cover }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
        ) : (
          <PixelText size={52} align="center">{foodEmoji(entry.food_category)}</PixelText>
        )}
      </View>
      <View style={{ paddingHorizontal: 4, paddingTop: 6, paddingBottom: 2 }}>
        <PixelText size={7} color={p.fg} numberOfLines={2} lineHeight={12}>{entry.quest_title}</PixelText>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6 }}>
          <PixelText size={6} color={p.sub}>{(entry.food_category ?? 'FOOD').toUpperCase()}</PixelText>
          <PixelText size={6} color={p.sub} style={{ marginLeft: 'auto' }}>{formatDate(entry.completed_at)}</PixelText>
        </View>
      </View>
    </Pressable>
  );
};

export const QuestTradingCard: React.FC<QuestTradingCardProps> = (props) => {
  if (props.entry.is_food) return <FoodTradingCard {...props} />;
  const { entry, onPress, width, style } = props;
  const tier = cardTier(entry.xp_earned);
  const t = CARD_TIER[tier];
  const cover = entry.cover_photo_uri || entry.photo_uris[0];

  return (
    <Pressable
      onPress={onPress}
      style={[
        {
          width,
          backgroundColor: COLORS.BG_CARD,
          borderWidth: SIZES.cardAccentWidth,
          borderColor: t.edge,
          padding: 4,
        },
        style,
      ]}
    >
      {/* Material header band */}
      <View style={{ backgroundColor: t.metal, paddingHorizontal: 6, paddingVertical: 4, flexDirection: 'row', alignItems: 'center' }}>
        <PixelText size={7} color={t.sheen}>{t.label}</PixelText>
        <PixelText size={8} color={t.sheen} style={{ marginLeft: 'auto' }}>{`${formatNumber(entry.xp_earned)} XP`}</PixelText>
      </View>

      {/* Art */}
      <View style={{ aspectRatio: 1, backgroundColor: COLORS.BG_SURFACE, marginTop: 4, alignItems: 'center', justifyContent: 'center', borderWidth: SIZES.borderWidth, borderColor: t.metal }}>
        {cover ? (
          <Image source={{ uri: cover }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
        ) : (
          <PixelText size={20} color={t.edge}>{'*'}</PixelText>
        )}
      </View>

      {/* Footer */}
      <View style={{ paddingHorizontal: 4, paddingTop: 6, paddingBottom: 2 }}>
        <PixelText size={7} color={COLORS.TEXT_PRIMARY} numberOfLines={2} lineHeight={12}>
          {entry.quest_title}
        </PixelText>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6 }}>
          <QuestBadge type={entry.quest_type} size={6} />
          <PixelText size={6} color={COLORS.TEXT_DISABLED} style={{ marginLeft: 'auto' }}>
            {formatDate(entry.completed_at)}
          </PixelText>
        </View>
      </View>
    </Pressable>
  );
};

export default QuestTradingCard;
