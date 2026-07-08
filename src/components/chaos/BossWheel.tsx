// ============================================================================
// BossWheel — a react-native-svg spin wheel of N equal segments.
//   Parent supplies segments + onSpinEnd. A "SPIN" PixelButton is rendered
//   inside and starts the rotation animation exactly once. We pre-compute a
//   random target index, animate the rotation with Reanimated withTiming
//   (~3s, decelerating), then runOnJS(onSpinEnd)(index). Pointer sits at top.
// ============================================================================

import React, { useMemo, useState } from 'react';
import { View } from 'react-native';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, G, Line, Path, Polygon, Text as SvgText } from 'react-native-svg';
import { COLORS, SIZES } from '../../utils/constants';
import { randInt } from '../../utils/chaos';
import { PixelButton } from '../ui/PixelButton';
import { PixelText } from '../ui/PixelText';

export interface BossWheelProps {
  segments: { id: string; label: string }[];
  onSpinEnd: (index: number) => void;
  /** Externally-driven spinning hint (purely cosmetic disable). */
  spinning?: boolean;
}

const WHEEL = 280; // svg viewBox size
const R = WHEEL / 2;
const CX = R;
const CY = R;

// Alternating pixel-art slice fills so adjacent segments are distinguishable.
const SLICE_FILLS = [
  COLORS.BG_CARD,
  COLORS.BG_SURFACE,
  COLORS.BG_BORDER,
  '#2a1f3a',
  COLORS.BG_CARD,
  COLORS.BG_SURFACE,
  COLORS.BG_BORDER,
  '#2a1f3a',
];

/** Point on the wheel circle for a given angle (degrees, 0 = top, clockwise). */
function pointFor(angleDeg: number, radius: number): { x: number; y: number } {
  // Convert so 0° is at the top and angles increase clockwise.
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: CX + radius * Math.cos(rad), y: CY + radius * Math.sin(rad) };
}

/** SVG wedge path for the slice spanning [startDeg, endDeg]. */
function wedgePath(startDeg: number, endDeg: number): string {
  const a = pointFor(startDeg, R - 4);
  const b = pointFor(endDeg, R - 4);
  const large = endDeg - startDeg > 180 ? 1 : 0;
  return `M ${CX} ${CY} L ${a.x} ${a.y} A ${R - 4} ${R - 4} 0 ${large} 1 ${b.x} ${b.y} Z`;
}

export const BossWheel: React.FC<BossWheelProps> = ({ segments, onSpinEnd, spinning }) => {
  const count = Math.max(segments.length, 1);
  const seg = 360 / count;
  const rotation = useSharedValue(0);
  const [hasSpun, setHasSpun] = useState(false);
  const [animating, setAnimating] = useState(false);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  const finish = (index: number) => {
    setAnimating(false);
    onSpinEnd(index);
  };

  const spin = () => {
    if (hasSpun || animating) return;
    setHasSpun(true);
    setAnimating(true);

    // Pre-compute the winning index, then the rotation that lands its centre
    // under the fixed pointer at the top (12 o'clock).
    const index = randInt(0, count - 1);
    const sliceCentre = index * seg + seg / 2;
    const turns = 5; // full spins for drama
    // We rotate the wheel clockwise; to bring sliceCentre to the top pointer we
    // must rotate by (360 - sliceCentre) plus whole turns.
    const target = turns * 360 + (360 - sliceCentre);

    rotation.value = withTiming(
      target,
      { duration: 3000, easing: Easing.out(Easing.cubic) },
      (finished) => {
        if (finished) {
          runOnJS(finish)(index);
        }
      },
    );
  };

  // Pre-render slices once per segment set.
  const slices = useMemo(
    () =>
      segments.map((s, i) => {
        const start = i * seg;
        const end = start + seg;
        const mid = start + seg / 2;
        const labelPos = pointFor(mid, R * 0.6);
        // Trim long labels so they stay inside the slice.
        const short = s.label.length > 14 ? `${s.label.slice(0, 13)}…` : s.label;
        return (
          <G key={s.id}>
            <Path
              d={wedgePath(start, end)}
              fill={SLICE_FILLS[i % SLICE_FILLS.length]}
              stroke={COLORS.RED}
              strokeWidth={2}
            />
            <Line
              x1={CX}
              y1={CY}
              x2={pointFor(start, R - 4).x}
              y2={pointFor(start, R - 4).y}
              stroke={COLORS.RED}
              strokeWidth={2}
            />
            <SvgText
              x={labelPos.x}
              y={labelPos.y}
              fill={COLORS.TEXT_PRIMARY}
              fontSize={7}
              fontFamily={undefined}
              textAnchor="middle"
              transform={`rotate(${mid}, ${labelPos.x}, ${labelPos.y})`}
            >
              {short}
            </SvgText>
          </G>
        );
      }),
    [segments, seg],
  );

  return (
    <View style={{ alignItems: 'center' }}>
      <View
        style={{
          width: WHEEL,
          height: WHEEL + 24,
          alignItems: 'center',
          justifyContent: 'flex-start',
        }}
      >
        {/* Fixed pointer at the top (12 o'clock) */}
        <View style={{ width: WHEEL, height: 24, alignItems: 'center', zIndex: 2 }}>
          <Svg width={28} height={24} viewBox="0 0 28 24">
            <Polygon points="14,24 4,2 24,2" fill={COLORS.RED} stroke={COLORS.GOLD} strokeWidth={2} />
          </Svg>
        </View>

        <Animated.View style={[{ width: WHEEL, height: WHEEL }, animatedStyle]}>
          <Svg width={WHEEL} height={WHEEL} viewBox={`0 0 ${WHEEL} ${WHEEL}`}>
            <Circle cx={CX} cy={CY} r={R - 2} fill={COLORS.BG_DARK} stroke={COLORS.RED} strokeWidth={3} />
            {slices}
            <Circle cx={CX} cy={CY} r={14} fill={COLORS.RED} stroke={COLORS.GOLD} strokeWidth={2} />
          </Svg>
        </Animated.View>
      </View>

      <View style={{ marginTop: SIZES.spacingLg, alignItems: 'center' }}>
        <PixelButton
          label={animating ? 'SPINNING…' : hasSpun ? 'SPUN' : 'SPIN'}
          color={COLORS.RED}
          size="lg"
          disabled={hasSpun || animating || !!spinning}
          onPress={spin}
        />
        {!hasSpun ? (
          <PixelText size={7} color={COLORS.TEXT_SECONDARY} align="center" style={{ marginTop: SIZES.spacingSm }}>
            FATE DECIDES YOUR BOSS
          </PixelText>
        ) : null}
      </View>
    </View>
  );
};

export default BossWheel;
