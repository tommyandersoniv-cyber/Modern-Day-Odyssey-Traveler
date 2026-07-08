// ============================================================================
// LoadingScreen — full-screen boot/loading state with an animated "..." pulse.
//   ({ message? }) — centred pixel title + animated dots + optional message.
// ============================================================================

import React, { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { COLORS, SIZES } from '../../utils/constants';
import { PixelText } from './PixelText';

export interface LoadingScreenProps {
  message?: string;
}

/** A single bobbing/fading dot, phase-offset by `index`. */
const Dot: React.FC<{ index: number }> = ({ index }) => {
  const t = useSharedValue(0);

  useEffect(() => {
    // Each dot pulses on a loop, staggered so they cascade left - right.
    t.value = withDelay(
      index * 180,
      withRepeat(
        withTiming(1, { duration: 540, easing: Easing.inOut(Easing.ease) }),
        -1,
        true,
      ),
    );
  }, [index, t]);

  const style = useAnimatedStyle(() => ({
    opacity: 0.25 + t.value * 0.75,
    transform: [{ translateY: -4 * t.value }],
  }));

  return (
    <Animated.View style={style}>
      <PixelText size={SIZES.fontXl} color={COLORS.GOLD}>
        .
      </PixelText>
    </Animated.View>
  );
};

export const LoadingScreen: React.FC<LoadingScreenProps> = ({ message }) => {
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: COLORS.BG_DARK,
        alignItems: 'center',
        justifyContent: 'center',
        padding: SIZES.spacingLg,
      }}
    >
      <PixelText
        size={SIZES.fontLg}
        color={COLORS.TEXT_PRIMARY}
        align="center"
        spacing={1}
        style={{ marginBottom: SIZES.spacingMd }}
      >
        MODERN DAY{'\n'}ODYSSEY
      </PixelText>

      <View
        style={{
          flexDirection: 'row',
          alignItems: 'flex-end',
          height: SIZES.fontXl + SIZES.spacingSm,
          marginBottom: SIZES.spacingMd,
        }}
      >
        {[0, 1, 2].map((i) => (
          <Dot key={i} index={i} />
        ))}
      </View>

      {message ? (
        <PixelText
          variant="body"
          size={SIZES.fontMd}
          color={COLORS.TEXT_SECONDARY}
          align="center"
        >
          {message}
        </PixelText>
      ) : null}
    </View>
  );
};

export default LoadingScreen;
