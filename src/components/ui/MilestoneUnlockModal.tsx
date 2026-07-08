// ============================================================================
// MilestoneUnlockModal — celebrates an earned milestone: the medal pops in,
// then the player claims the XP bonus.
// ============================================================================

import React, { useEffect } from 'react';
import { View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withSequence, withTiming } from 'react-native-reanimated';
import type { MilestoneRecord } from '../../types';
import { COLORS, SIZES } from '../../utils/constants';
import { formatNumber } from '../../utils/helpers';
import { PixelModal } from './PixelModal';
import { PixelText } from './PixelText';
import { PixelButton } from './PixelButton';

export interface MilestoneUnlockModalProps {
  visible: boolean;
  notice: MilestoneRecord | null;
  onClose: () => void;
}

export const MilestoneUnlockModal: React.FC<MilestoneUnlockModalProps> = ({ visible, notice, onClose }) => {
  const scale = useSharedValue(0.5);

  useEffect(() => {
    if (visible && notice) {
      scale.value = 0.5;
      scale.value = withSequence(
        withTiming(1.15, { duration: 340, easing: Easing.out(Easing.back(2.2)) }),
        withTiming(1, { duration: 160 }),
      );
    }
  }, [visible, notice, scale]);

  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  if (!notice) return null;
  const accent = notice.color || COLORS.GOLD;

  return (
    <PixelModal visible={visible} onClose={onClose} dismissOnBackdrop={false} accent={accent} title="MILESTONE REACHED">
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
            animStyle,
          ]}
        >
          <PixelText size={44} align="center">
            {notice.glyph}
          </PixelText>
        </Animated.View>

        <PixelText size={13} color={accent} align="center" spacing={1} style={{ marginTop: SIZES.spacingLg }}>
          {notice.title.toUpperCase()}
        </PixelText>
        <PixelText variant="body" size={11} color={COLORS.TEXT_SECONDARY} align="center" style={{ marginTop: SIZES.spacingXs }}>
          {notice.description}
        </PixelText>

        <View
          style={{
            marginTop: SIZES.spacingMd,
            paddingVertical: SIZES.spacingXs,
            paddingHorizontal: SIZES.spacingMd,
            borderWidth: SIZES.borderWidth,
            borderColor: COLORS.GOLD,
            borderRadius: SIZES.borderRadius,
          }}
        >
          <PixelText size={11} color={COLORS.GOLD} align="center">
            {`+${formatNumber(notice.xp)} XP`}
          </PixelText>
        </View>

        <PixelButton label="CLAIM MEDAL" color={accent} size="lg" fullWidth onPress={onClose} style={{ marginTop: SIZES.spacingLg }} />
      </View>
    </PixelModal>
  );
};

export default MilestoneUnlockModal;
