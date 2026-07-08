// ============================================================================
// BadgeUnlockModal — celebratory badge reveal. The badge swoops in from above
//   (spring) with a brief shake, then the player taps CLAIM to dismiss.
// ============================================================================

import React, { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { COLORS, SIZES } from '../../utils/constants';
import type { BadgeUnlockNotice } from '../../store/useGameStore';
import { PixelButton } from './PixelButton';
import { PixelModal } from './PixelModal';
import { PixelText } from './PixelText';

export interface BadgeUnlockModalProps {
  visible: boolean;
  notice: BadgeUnlockNotice | null;
  onClose: () => void;
}

const KIND_ACCENT: Record<BadgeUnlockNotice['kind'], string> = {
  region: COLORS.PURPLE,
  country: COLORS.GOLD,
};

const KIND_LABEL: Record<BadgeUnlockNotice['kind'], string> = {
  region: 'REGION BADGE',
  country: 'COUNTRY BADGE',
};

export const BadgeUnlockModal: React.FC<BadgeUnlockModalProps> = ({
  visible,
  notice,
  onClose,
}) => {
  // Swoop in from above; a small rotation wobble adds a celebratory shake.
  const drop = useSharedValue(-120);
  const rot = useSharedValue(0);

  useEffect(() => {
    if (visible && notice) {
      drop.value = -120;
      rot.value = 0;
      drop.value = withSpring(0, { damping: 9, stiffness: 140 });
      rot.value = withSequence(
        withTiming(-0.08, { duration: 90, easing: Easing.linear }),
        withRepeat(withTiming(0.08, { duration: 110, easing: Easing.linear }), 4, true),
        withTiming(0, { duration: 90, easing: Easing.linear }),
      );
    }
    // Restart the swoop each time a new notice is shown.
  }, [visible, notice, drop, rot]);

  const swoopStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: drop.value }, { rotate: `${rot.value}rad` }],
  }));

  const accent = notice ? KIND_ACCENT[notice.kind] : COLORS.GOLD;

  return (
    <PixelModal
      visible={visible}
      onClose={onClose}
      accent={accent}
      dismissOnBackdrop={false}
      maxWidthPct={86}
    >
      <View style={{ alignItems: 'center', paddingVertical: SIZES.spacingSm }}>
        <PixelText size={SIZES.fontLg} color={accent} align="center" spacing={1}>
          BADGE UNLOCKED!
        </PixelText>

        <Animated.View
          style={[
            {
              marginTop: SIZES.spacingLg,
              width: 96,
              height: 96,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: COLORS.BG_SURFACE,
              borderWidth: SIZES.borderWidth + 1,
              borderColor: accent,
              borderRadius: SIZES.borderRadius,
            },
            swoopStyle,
          ]}
        >
          <PixelText size={SIZES.fontXxl} color={accent} align="center">
            *
          </PixelText>
        </Animated.View>

        {notice ? (
          <>
            <PixelText
              size={SIZES.fontMd}
              color={COLORS.TEXT_PRIMARY}
              align="center"
              spacing={1}
              style={{ marginTop: SIZES.spacingLg }}
            >
              {notice.label.toUpperCase()}
            </PixelText>

            {notice.sublabel ? (
              <PixelText
                variant="body"
                size={SIZES.fontMd}
                color={COLORS.TEXT_SECONDARY}
                align="center"
                style={{ marginTop: SIZES.spacingXs }}
              >
                {notice.sublabel}
              </PixelText>
            ) : null}

            <View
              style={{
                marginTop: SIZES.spacingSm,
                paddingVertical: SIZES.spacingXs,
                paddingHorizontal: SIZES.spacingSm,
                borderWidth: SIZES.borderWidth,
                borderColor: accent,
                borderRadius: SIZES.borderRadius,
              }}
            >
              <PixelText size={SIZES.fontXs} color={accent} align="center">
                {KIND_LABEL[notice.kind]}
              </PixelText>
            </View>
          </>
        ) : null}

        <View style={{ marginTop: SIZES.spacingLg }}>
          <PixelButton label="CLAIM" color={accent} onPress={onClose} size="md" />
        </View>
      </View>
    </PixelModal>
  );
};

export default BadgeUnlockModal;
