// ============================================================================
// CustomSprite — renders a CharacterAppearance as a static pixel-art SVG.
//   The single source of truth for drawing a customized character anywhere
//   (customizer preview, codex avatars, map tokens). Portrait aspect (~0.8:1).
// ============================================================================

import React, { useMemo } from 'react';
import Svg, { Rect } from 'react-native-svg';
import type { CharacterAppearance } from '../../types';
import { buildSprite } from '../../utils/appearance';

export interface CustomSpriteProps {
  appearance: CharacterAppearance;
  /** Bounding HEIGHT in px. Width is ~0.8x this (12x15 grid). */
  size?: number;
  blink?: boolean;
}

export const CustomSprite: React.FC<CustomSpriteProps> = ({ appearance, size = 24, blink = false }) => {
  const { rows, cols, palette } = useMemo(() => buildSprite(appearance, blink), [appearance, blink]);
  const cell = size / rows.length;
  const w = cols * cell;
  const h = rows.length * cell;

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

  return (
    <Svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
      {rects}
    </Svg>
  );
};

export default CustomSprite;
