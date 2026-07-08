// ============================================================================
// QuestCard — a tappable quest tile.
//   BG_CARD surface, 2px border, 4px LEFT accent border tinted by quest type.
//   Title (pixel 10) + type/rarity badges + XP (GOLD) + city/zone (body).
//   When `completed`, a OK is shown and the card dims.
//   `compact` trims padding + hides location for dense lists / inventory slots.
//   `rightSlot` lets callers drop an action (e.g. an "ADD" button) on the right.
// ============================================================================

import React from 'react';
import { Pressable, View } from 'react-native';
import type { Quest } from '../../types';
import { COLORS, RARITY_COLOR, SIZES } from '../../utils/constants';
import { formatNumber } from '../../utils/helpers';
import { PixelText } from '../ui/PixelText';
import { QuestBadge } from './QuestBadge';

// Food quests (either the dedicated food-dish pool or a regular quest whose
// category is "Food") wear the night-market pastel purple, regardless of rarity.
const FOOD_ACCENT = '#b18ce0';

export interface QuestCardProps {
  quest: Quest;
  onPress?: () => void;
  completed?: boolean;
  rightSlot?: React.ReactNode;
  compact?: boolean;
  /** When set, a small red ✕ is tucked into the top-right corner — a quiet way
   *  to drop a drawn quest without opening it. Deliberately tiny so it is
   *  never hit by accident. */
  onRemove?: () => void;
}

export const QuestCard: React.FC<QuestCardProps> = ({
  quest,
  onPress,
  completed = false,
  rightSlot,
  compact = false,
  onRemove,
}) => {
  // Pastel purple for anything Food, regardless of rarity; otherwise the
  // rarity tier drives the accent (mythic=white, legendary=dark purple,
  // epic=gold, rare=blue — matches the RARITY badge pill below).
  const isFood = quest.is_food || quest.category === 'Food';
  const accent = isFood ? FOOD_ACCENT : RARITY_COLOR[quest.rarity] ?? COLORS.TEXT_SECONDARY;
  // Category badge is shown only for location-based cards — chaos quests are
  // behavioral prompts, not places, and render via a separate ChaosCard anyway.
  const showCategoryBadge = quest.type !== 'chaos' && !!quest.card_category;
  const xp = quest.xp_with_multiplier ?? quest.xp;
  const pad = compact ? SIZES.spacingSm : SIZES.spacingMd;

  // Prefer city · zone where both exist; fall back to whichever is present.
  const locationParts = [quest.city, quest.zone].filter(Boolean) as string[];
  const location = locationParts.join(' · ');

  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      style={({ pressed }) => [
        {
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: COLORS.BG_CARD,
          borderWidth: SIZES.borderWidth,
          borderColor: COLORS.BG_BORDER,
          borderLeftWidth: SIZES.cardAccentWidth,
          borderLeftColor: accent,
          borderRadius: SIZES.borderRadius,
          paddingVertical: pad,
          paddingHorizontal: pad,
          opacity: completed ? 0.55 : pressed && onPress ? 0.85 : 1,
        },
      ]}
    >
      <View style={{ flex: 1 }}>
        {/* Title row — leaves room for the completed check. */}
        <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
          {completed ? (
            <PixelText size={10} color={COLORS.GREEN} style={{ marginRight: SIZES.spacingSm }}>
              OK
            </PixelText>
          ) : null}
          <PixelText
            size={10}
            color={completed ? COLORS.TEXT_SECONDARY : COLORS.TEXT_PRIMARY}
            style={{ flex: 1, paddingRight: onRemove ? 14 : 0 }}
          >
            {quest.title}
          </PixelText>
        </View>

        {/* Type + rarity badges. Food quests badge as FOOD in purple. */}
        <View
          style={{
            flexDirection: 'row',
            flexWrap: 'wrap',
            marginTop: SIZES.spacingSm,
          }}
        >
          <QuestBadge
            type={quest.type}
            label={quest.is_food ? 'FOOD' : undefined}
            color={quest.is_food ? FOOD_ACCENT : undefined}
            style={{ marginRight: SIZES.spacingXs, marginBottom: SIZES.spacingXs }}
          />
          <QuestBadge rarity={quest.rarity} style={{ marginBottom: SIZES.spacingXs }} />
        </View>

        {/* XP. */}
        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: SIZES.spacingXs }}>
          <PixelText size={8} color={COLORS.GOLD}>
            {`+${formatNumber(xp)} XP`}
          </PixelText>
        </View>

        {/* City / zone — body font, secondary. Hidden in compact mode. */}
        {!compact && location ? (
          <PixelText
            variant="body"
            size={12}
            color={COLORS.TEXT_SECONDARY}
            style={{ marginTop: SIZES.spacingXs }}
          >
            {location}
          </PixelText>
        ) : null}
      </View>

      {rightSlot ? <View style={{ marginLeft: SIZES.spacingMd }}>{rightSlot}</View> : null}

      {/* Category badge stamp — bottom-right corner (top-right is already
          claimed by the remove ✕ above). */}
      {showCategoryBadge ? (
        <View
          style={{
            position: 'absolute',
            bottom: 3,
            right: 5,
            borderWidth: 1,
            borderColor: COLORS.TEXT_DISABLED,
            paddingHorizontal: 4,
            paddingVertical: 1,
          }}
        >
          <PixelText size={6} color={COLORS.TEXT_SECONDARY}>
            {quest.card_category!.toUpperCase()}
          </PixelText>
        </View>
      ) : null}

      {/* Tucked remove ✕ — top-right corner, intentionally small (no hitSlop)
          so it never gets tapped by accident. */}
      {onRemove ? (
        <Pressable
          onPress={onRemove}
          style={({ pressed }) => ({
            position: 'absolute',
            top: 3,
            right: 5,
            padding: 2,
            opacity: pressed ? 1 : 0.7,
          })}
        >
          <PixelText size={7} color={COLORS.RED}>✕</PixelText>
        </Pressable>
      ) : null}
    </Pressable>
  );
};

export default QuestCard;
