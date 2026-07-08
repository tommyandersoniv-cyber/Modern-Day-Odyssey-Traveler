// ============================================================================
// XPPopup — a floating "+{amount} XP" that rises and fades, then calls onDone.
//   Re-triggers its animation whenever `sourceKey` changes.
// ============================================================================

import React, { useEffect } from 'react';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { COLORS, SIZES } from '../../utils/constants';
import { formatNumber } from '../../utils/helpers';
import { PixelText } from './PixelText';

export interface XPPopupProps {
  amount: number;
  /** Bump this (e.g. a timestamp) to replay the rise+fade animation. */
  sourceKey: number;
  onDone?: () => void;
}

const RISE_PX = 60;
const DURATION_MS = 1800;

export const XPPopup: React.FC<XPPopupProps> = ({ amount, sourceKey, onDone }) => {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = 0;
    progress.value = withTiming(
      1,
      { duration: DURATION_MS, easing: Easing.out(Easing.quad) },
      (finished) => {
        'worklet';
        if (finished && onDone) {
          runOnJS(onDone)();
        }
      },
    );
    // Re-run whenever the source key changes (a fresh XP gain).
  }, [sourceKey, onDone, progress]);

  const style = useAnimatedStyle(() => ({
    // Fade in quickly, hold, then fade out over the back half.
    opacity: progress.value < 0.15 ? progress.value / 0.15 : 1 - (progress.value - 0.15) / 0.85,
    transform: [{ translateY: -RISE_PX * progress.value }],
  }));

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        {
          alignSelf: 'center',
          paddingHorizontal: SIZES.spacingSm,
        },
        style,
      ]}
    >
      <PixelText size={SIZES.fontLg} color={COLORS.GOLD} align="center" spacing={1}>
        {`+${formatNumber(amount)} XP`}
      </PixelText>
    </Animated.View>
  );
};

export default XPPopup;
