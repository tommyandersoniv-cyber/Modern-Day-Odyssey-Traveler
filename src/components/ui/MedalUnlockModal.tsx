// ============================================================================
// MedalUnlockModal — celebrates a city medal and shows it slotting into the
// region's gym-badge jigsaw.
// ============================================================================

import React, { useEffect } from 'react';
import { View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withSequence, withTiming } from 'react-native-reanimated';
import type { MedalUnlockNotice } from '../../store/useGameStore';
import { useGameStore } from '../../store/useGameStore';
import { COLORS, SIZES, regionMetaFor } from '../../utils/constants';
import { getRegionCities } from '../../utils/world';
import { PixelModal } from './PixelModal';
import { PixelText } from './PixelText';
import { PixelButton } from './PixelButton';
import { RegionBadgeJigsaw } from './RegionBadgeJigsaw';

export interface MedalUnlockModalProps {
  visible: boolean;
  notice: MedalUnlockNotice | null;
  onClose: () => void;
}

export const MedalUnlockModal: React.FC<MedalUnlockModalProps> = ({ visible, notice, onClose }) => {
  const medals = useGameStore((s) => s.medals);
  const scale = useSharedValue(0.6);

  useEffect(() => {
    if (visible && notice) {
      scale.value = 0.6;
      scale.value = withSequence(
        withTiming(1.12, { duration: 360, easing: Easing.out(Easing.back(2)) }),
        withTiming(1, { duration: 180 }),
      );
    }
  }, [visible, notice, scale]);

  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  if (!notice) return null;
  const accent = regionMetaFor(notice.region)?.accent ?? COLORS.GOLD;
  const cities = getRegionCities(notice.region).map((c) => c.name);
  const medaled = medals.filter((m) => m.region === notice.region && m.earned).map((m) => m.city);
  const complete = cities.length > 0 && medaled.length >= cities.length;

  return (
    <PixelModal visible={visible} onClose={onClose} dismissOnBackdrop={false} accent={accent} title={complete ? 'REGION BADGE COMPLETE' : 'MEDAL EARNED'}>
      <View style={{ alignItems: 'center' }}>
        <Animated.View style={animStyle}>
          <RegionBadgeJigsaw region={notice.region} cities={cities} medaledCities={medaled} accent={accent} size={180} highlightCity={notice.city} />
        </Animated.View>
        <PixelText size={11} color={accent} align="center" style={{ marginTop: SIZES.spacingMd }}>
          {notice.city.toUpperCase()} CLEARED
        </PixelText>
        <PixelText size={8} color={COLORS.TEXT_SECONDARY} align="center" style={{ marginTop: 6 }}>
          {complete
            ? `${notice.region} gym badge assembled!`
            : `${medaled.length} / ${cities.length} medals toward the ${notice.region} badge`}
        </PixelText>
        <PixelButton label="CLAIM" color={accent} size="lg" fullWidth onPress={onClose} style={{ marginTop: SIZES.spacingLg }} />
      </View>
    </PixelModal>
  );
};

export default MedalUnlockModal;
