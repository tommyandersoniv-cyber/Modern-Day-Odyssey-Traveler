// ============================================================================
// CityMap — renders the 800x600 logical city canvas (pixel-grid background)
// scaled to fit the available width. Children (ZoneOverlay, PlayerSprite,
// markers) are authored in the 800x600 space and scaled along with it.
// ============================================================================

import React, { useState } from 'react';
import { LayoutChangeEvent, View, ViewStyle } from 'react-native';
import Svg, { Line, Rect } from 'react-native-svg';
import type { CityMeta } from '../../types';
import { CITY_CANVAS, COLORS, SIZES } from '../../utils/constants';

export interface CityMapProps {
  /** Optional — the canvas is a generic 800x600 grid; callers that only need
   *  the backdrop (e.g. the region "More" map) may omit it. */
  city?: CityMeta;
  children?: React.ReactNode;
}

const W = CITY_CANVAS.width; // 800
const H = CITY_CANVAS.height; // 600
const GRID = 40;

export const CityMap: React.FC<CityMapProps> = ({ children }) => {
  const [width, setWidth] = useState(0);
  const onLayout = (e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width);
  const scale = width > 0 ? width / W : 0;
  const scaledH = H * scale;

  const vLines = [];
  for (let x = GRID; x < W; x += GRID) vLines.push(x);
  const hLines = [];
  for (let y = GRID; y < H; y += GRID) hLines.push(y);

  const innerStyle: ViewStyle = {
    width: W,
    height: H,
    // top-left anchored scale (RN >= 0.74 supports transformOrigin)
    transformOrigin: 'top left',
    transform: [{ scale }],
  } as ViewStyle;

  return (
    <View
      onLayout={onLayout}
      style={{
        width: '100%',
        height: scaledH || undefined,
        aspectRatio: width > 0 ? undefined : W / H,
        backgroundColor: COLORS.BG_DARK,
        borderWidth: SIZES.borderWidth,
        borderColor: COLORS.BG_BORDER,
        overflow: 'hidden',
      }}
    >
      {width > 0 ? (
        <View style={innerStyle} pointerEvents="box-none">
          <Svg width={W} height={H} style={{ position: 'absolute', left: 0, top: 0 }}>
            <Rect x={0} y={0} width={W} height={H} fill={COLORS.BG_DARK} />
            {vLines.map((x) => (
              <Line key={`v${x}`} x1={x} y1={0} x2={x} y2={H} stroke={COLORS.BG_SURFACE} strokeWidth={1} />
            ))}
            {hLines.map((y) => (
              <Line key={`h${y}`} x1={0} y1={y} x2={W} y2={y} stroke={COLORS.BG_SURFACE} strokeWidth={1} />
            ))}
          </Svg>
          {children}
        </View>
      ) : null}
    </View>
  );
};

export default CityMap;
