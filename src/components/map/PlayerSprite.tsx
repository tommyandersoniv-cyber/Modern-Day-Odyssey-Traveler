// ============================================================================
// PlayerSprite — a pixel-art traveler positioned by CENTER on a map canvas,
// with an idle bob + occasional blink so it reads as a living character.
//
// The look is fully driven by a CharacterAppearance (see utils/appearance);
// with no appearance supplied it falls back to the classic red-cap traveler.
// Used for the player on the city map and for any placed character sprite.
// ============================================================================

import React, { useEffect, useMemo, useState } from 'react';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Rect } from 'react-native-svg';
import type { CharacterAppearance } from '../../types';
import { buildSprite, DEFAULT_PLAYER_APPEARANCE } from '../../utils/appearance';

export interface PlayerSpriteProps {
  /** Desired CENTER x within the parent positioning context. */
  x: number;
  /** Desired CENTER y within the parent positioning context. */
  y: number;
  size?: number; // bounding height in px
  appearance?: CharacterAppearance;
  /** Disable the idle bob (e.g. for tightly-packed tokens). */
  animated?: boolean;
}

function Frame({ rows, cols, palette, cell }: { rows: string[]; cols: number; palette: Record<string, string>; cell: number }) {
  const rects: React.ReactNode[] = [];
  rows.forEach((row, ry) => {
    for (let cx = 0; cx < cols; cx++) {
      const ch = row[cx];
      if (ch && ch !== '_') {
        rects.push(
          <Rect
            key={`${ry}-${cx}`}
            x={cx * cell}
            y={ry * cell}
            width={cell + 0.4}
            height={cell + 0.4}
            fill={palette[ch] ?? '#000'}
          />,
        );
      }
    }
  });
  return <>{rects}</>;
}

export const PlayerSprite: React.FC<PlayerSpriteProps> = ({
  x,
  y,
  size = 11,
  appearance = DEFAULT_PLAYER_APPEARANCE,
  animated = true,
}) => {
  const open = useMemo(() => buildSprite(appearance, false), [appearance]);
  const blinkFrame = useMemo(() => buildSprite(appearance, true), [appearance]);

  const cell = size / open.rows.length;
  const w = open.cols * cell;
  const h = open.rows.length * cell;

  const bob = useSharedValue(0);
  const [blink, setBlink] = useState(false);

  useEffect(() => {
    if (!animated) return;
    bob.value = withRepeat(withTiming(-2, { duration: 640, easing: Easing.inOut(Easing.ease) }), -1, true);
    return () => cancelAnimation(bob);
  }, [bob, animated]);

  useEffect(() => {
    if (!animated) return;
    const id = setInterval(() => {
      setBlink(true);
      setTimeout(() => setBlink(false), 140);
    }, 3200);
    return () => clearInterval(id);
  }, [animated]);

  const animStyle = useAnimatedStyle(() => ({ transform: [{ translateY: bob.value }] }));
  const frame = blink ? blinkFrame : open;

  return (
    <Animated.View
      pointerEvents="none"
      style={[{ position: 'absolute', left: x - w / 2, top: y - h / 2, width: w, height: h }, animStyle]}
    >
      <Svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
        <Frame rows={frame.rows} cols={frame.cols} palette={frame.palette} cell={cell} />
      </Svg>
    </Animated.View>
  );
};

export default PlayerSprite;
