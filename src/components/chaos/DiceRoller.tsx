// ============================================================================
// DiceRoller — a large d20 that flickers through 1-20 for ~2s then lands.
//   Renders a bordered pixel "die" box with the current number. A "ROLL"
//   PixelButton starts it (unless `auto`, which rolls once on mount). Uses
//   setInterval for the flicker with proper cleanup, plus a Reanimated shake.
// ============================================================================

import React, { useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { COLORS, SIZES } from '../../utils/constants';
import { randInt, rollD20 } from '../../utils/chaos';
import { PixelButton } from '../ui/PixelButton';
import { PixelText } from '../ui/PixelText';

export interface DiceRollerProps {
  onResult: (n: number) => void;
  /** Roll automatically once on mount instead of waiting for the button. */
  auto?: boolean;
}

const FLICKER_MS = 70;
const ROLL_DURATION = 2000;

export const DiceRoller: React.FC<DiceRollerProps> = ({ onResult, auto }) => {
  const [value, setValue] = useState(20);
  const [rolling, setRolling] = useState(false);
  const [done, setDone] = useState(false);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const shake = useSharedValue(0);
  const scale = useSharedValue(1);

  const dieStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${shake.value}deg` }, { scale: scale.value }],
  }));

  const clearTimers = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };

  const roll = () => {
    if (rolling || done) return;
    setRolling(true);
    setDone(false);

    // Wobble the die while it spins.
    shake.value = withRepeat(
      withSequence(
        withTiming(-8, { duration: FLICKER_MS, easing: Easing.linear }),
        withTiming(8, { duration: FLICKER_MS, easing: Easing.linear }),
      ),
      -1,
      true,
    );

    intervalRef.current = setInterval(() => {
      setValue(randInt(1, 20));
    }, FLICKER_MS);

    timeoutRef.current = setTimeout(() => {
      clearTimers();
      const final = rollD20();
      setValue(final);
      setRolling(false);
      setDone(true);
      shake.value = withTiming(0, { duration: 120 });
      scale.value = withSequence(
        withTiming(1.25, { duration: 120, easing: Easing.out(Easing.quad) }),
        withTiming(1, { duration: 160, easing: Easing.out(Easing.quad) }),
      );
      onResult(final);
    }, ROLL_DURATION);
  };

  // Auto-roll once on mount when requested.
  useEffect(() => {
    if (auto) roll();
    return clearTimers;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auto]);

  const numberColor = done ? COLORS.GOLD : rolling ? COLORS.RED : COLORS.TEXT_PRIMARY;

  return (
    <View style={{ alignItems: 'center' }}>
      <Animated.View
        style={[
          {
            width: 130,
            height: 130,
            backgroundColor: COLORS.BG_CARD,
            borderWidth: SIZES.borderWidth,
            borderColor: done ? COLORS.GOLD : COLORS.RED,
            alignItems: 'center',
            justifyContent: 'center',
          },
          dieStyle,
        ]}
      >
        <PixelText size={8} color={COLORS.TEXT_SECONDARY} style={{ position: 'absolute', top: 8, left: 8 }}>
          d20
        </PixelText>
        <PixelText size={SIZES.fontXxl} color={numberColor} align="center">
          {value}
        </PixelText>
      </Animated.View>

      {!auto ? (
        <PixelButton
          label={rolling ? 'ROLLING…' : done ? 'ROLLED' : 'ROLL'}
          color={COLORS.RED}
          size="lg"
          disabled={rolling || done}
          onPress={roll}
          style={{ marginTop: SIZES.spacingLg }}
        />
      ) : null}
    </View>
  );
};

export default DiceRoller;
