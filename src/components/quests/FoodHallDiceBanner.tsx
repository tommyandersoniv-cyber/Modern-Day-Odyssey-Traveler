// ============================================================================
// FoodHallDiceBanner — Odyssey-mode-only Food Hall completion mechanic.
// On first visit to a country's Food Hall, auto-rolls 3 dice (1-6), one per
// food-dish tier (Common/Rare/Unique) — each result is how many dishes of
// that tier must be completed before the country's food quest counts as
// done. The roll is persisted forever once generated; re-entering the hall
// never re-rolls (would silently wipe progress), it just shows live progress
// against the same targets.
// ============================================================================

import React, { useEffect, useMemo } from 'react';
import { View } from 'react-native';
import type { FoodTier, Quest } from '../../types';
import { COLORS, FOOD_TIER_COLOR, FOOD_TIER_LABEL, SIZES } from '../../utils/constants';
import { useGameStore } from '../../store/useGameStore';
import { PixelText } from '../ui/PixelText';

const TIERS: FoodTier[] = ['common', 'rare', 'unique'];

export interface FoodHallDiceBannerProps {
  country: string;
  /** This country's full Food Hall quest set (unfiltered by region/tier UI). */
  foodQuests: Quest[];
  completed: Set<string>;
}

const Die: React.FC<{ tier: FoodTier; target: number; progress: number }> = ({ tier, target, progress }) => {
  const color = FOOD_TIER_COLOR[tier];
  const met = progress >= target;
  return (
    <View
      style={{
        flex: 1,
        alignItems: 'center',
        backgroundColor: COLORS.BG_SURFACE,
        borderWidth: SIZES.borderWidth,
        borderColor: color,
        borderRadius: SIZES.borderRadius,
        paddingVertical: SIZES.spacingSm,
        marginHorizontal: 3,
        opacity: met ? 1 : 0.9,
      }}
    >
      <PixelText size={16} color={color}>{`🎲${target}`}</PixelText>
      <PixelText size={6} color={color} style={{ marginTop: 4 }}>{FOOD_TIER_LABEL[tier]}</PixelText>
      <PixelText size={7} color={met ? COLORS.GREEN : COLORS.TEXT_SECONDARY} style={{ marginTop: 2 }}>
        {met ? 'DONE' : `${progress}/${target}`}
      </PixelText>
    </View>
  );
};

/** Odyssey mode only — renders nothing (and never rolls) in Exploration mode. */
export const FoodHallDiceBanner: React.FC<FoodHallDiceBannerProps> = ({ country, foodQuests, completed }) => {
  const gameMode = useGameStore((s) => s.game_mode);
  const isOdyssey = gameMode === 'odyssey';
  const rollFoodHallDice = useGameStore((s) => s.rollFoodHallDice);
  // Idempotent — the store returns the existing roll for a country that
  // already has one, so re-entering the hall never re-rolls or wipes progress.
  const roll = useGameStore((s) => s.food_hall_rolls[country]);

  useEffect(() => {
    if (isOdyssey) rollFoodHallDice(country);
  }, [isOdyssey, country, rollFoodHallDice]);

  const progressByTier = useMemo(() => {
    const out: Record<FoodTier, number> = { common: 0, rare: 0, unique: 0 };
    foodQuests.forEach((q) => {
      if (q.food_tier && completed.has(q.id)) out[q.food_tier]++;
    });
    return out;
  }, [foodQuests, completed]);

  if (!isOdyssey || !roll) return null;

  const allMet = TIERS.every((t) => progressByTier[t] >= roll[t]);

  return (
    <View style={{ marginBottom: SIZES.spacingMd }}>
      <View style={{ flexDirection: 'row', marginHorizontal: -3, marginBottom: SIZES.spacingSm }}>
        {TIERS.map((t) => (
          <Die key={t} tier={t} target={roll[t]} progress={progressByTier[t]} />
        ))}
      </View>
      {allMet ? (
        <PixelText size={8} color={COLORS.GREEN} align="center">FOOD QUEST COMPLETE</PixelText>
      ) : null}
    </View>
  );
};

export default FoodHallDiceBanner;
