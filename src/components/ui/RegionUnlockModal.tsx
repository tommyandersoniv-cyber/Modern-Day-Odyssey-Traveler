// ============================================================================
// RegionUnlockModal — the celebratory beat when an Odyssey region unlocks.
// A map pin drops in with a shimmer, then the player taps to continue (and can
// then enter the newly-opened region).
// ============================================================================

import React, { useEffect } from 'react';
import { Text, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withRepeat, withSequence, withSpring, withTiming } from 'react-native-reanimated';
import { COLORS, SIZES, regionMetaFor } from '../../utils/constants';
import { PixelModal } from './PixelModal';
import { PixelText } from './PixelText';
import { PixelButton } from './PixelButton';

export interface RegionUnlockModalProps {
  visible: boolean;
  region: string | null;
  onClose: () => void;
}

export const RegionUnlockModal: React.FC<RegionUnlockModalProps> = ({ visible, region, onClose }) => {
  const drop = useSharedValue(-90);
  const shimmer = useSharedValue(0);

  useEffect(() => {
    if (visible && region) {
      drop.value = -90;
      shimmer.value = 0;
      drop.value = withSpring(0, { damping: 8, stiffness: 130 });
      shimmer.value = withRepeat(withSequence(withTiming(1, { duration: 700, easing: Easing.inOut(Easing.ease) }), withTiming(0, { duration: 700, easing: Easing.inOut(Easing.ease) })), -1, false);
    }
  }, [visible, region, drop, shimmer]);

  const pinStyle = useAnimatedStyle(() => ({ transform: [{ translateY: drop.value }] }));
  const glowStyle = useAnimatedStyle(() => ({ opacity: 0.4 + shimmer.value * 0.6 }));

  if (!region) return null;
  const accent = regionMetaFor(region)?.accent ?? COLORS.PURPLE;

  return (
    <PixelModal visible={visible} onClose={onClose} dismissOnBackdrop={false} accent={accent} title="REGION COMPLETE">
      <View style={{ alignItems: 'center', paddingVertical: SIZES.spacingSm }}>
        <Animated.View
          style={[
            {
              width: 96,
              height: 96,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: COLORS.BG_SURFACE,
              borderWidth: SIZES.borderWidth + 1,
              borderColor: accent,
              borderRadius: SIZES.borderRadius,
            },
            glowStyle,
          ]}
        >
          <Animated.View style={pinStyle}>
            <Text style={{ fontSize: 46 }}>🏆</Text>
          </Animated.View>
        </Animated.View>

        <PixelText size={14} color={accent} align="center" spacing={1} style={{ marginTop: SIZES.spacingLg }}>
          {region.toUpperCase()}
        </PixelText>
        <PixelText variant="body" size={11} color={COLORS.TEXT_SECONDARY} align="center" style={{ marginTop: SIZES.spacingXs }}>
          Region complete! Choose your next destination — tap any locked region on the map to unlock it.
        </PixelText>

        <PixelButton label="CHOOSE NEXT" color={accent} size="lg" fullWidth onPress={onClose} style={{ marginTop: SIZES.spacingLg }} />
      </View>
    </PixelModal>
  );
};

export default RegionUnlockModal;
