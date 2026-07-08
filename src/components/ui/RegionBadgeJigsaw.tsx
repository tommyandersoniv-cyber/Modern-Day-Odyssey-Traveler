// ============================================================================
// RegionBadgeJigsaw — a region's gym badge, assembled from city medals like a
// jigsaw. Each city is a wedge; earning its medal fills that wedge. When every
// wedge is filled the badge "completes" (gold cog ring + lit hub).
// ============================================================================

import React from 'react';
import Svg, { Circle, G, Path, Polygon, Text as SvgText } from 'react-native-svg';
import { COLORS } from '../../utils/constants';

export interface RegionBadgeJigsawProps {
  region: string;
  cities: string[];
  medaledCities: string[];
  accent: string;
  size?: number;
  /** City whose wedge should be emphasised (e.g. just earned). */
  highlightCity?: string;
}

function pointFor(cx: number, cy: number, angleDeg: number, radius: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + radius * Math.cos(rad), y: cy + radius * Math.sin(rad) };
}

function wedgePath(cx: number, cy: number, start: number, end: number, r: number) {
  const a = pointFor(cx, cy, start, r);
  const b = pointFor(cx, cy, end, r);
  const large = end - start > 180 ? 1 : 0;
  return `M ${cx} ${cy} L ${a.x} ${a.y} A ${r} ${r} 0 ${large} 1 ${b.x} ${b.y} Z`;
}

// A notched cog ring (gym-badge silhouette) as a star polygon.
function cogPoints(cx: number, cy: number, rOuter: number, rInner: number, teeth: number) {
  const pts: string[] = [];
  const steps = teeth * 2;
  for (let i = 0; i < steps; i++) {
    const ang = (360 / steps) * i;
    const r = i % 2 === 0 ? rOuter : rInner;
    const p = pointFor(cx, cy, ang, r);
    pts.push(`${p.x.toFixed(1)},${p.y.toFixed(1)}`);
  }
  return pts.join(' ');
}

export const RegionBadgeJigsaw: React.FC<RegionBadgeJigsawProps> = ({
  region,
  cities,
  medaledCities,
  accent,
  size = 160,
  highlightCity,
}) => {
  const S = size;
  const C = S / 2;
  const R = S * 0.34;
  const count = Math.max(cities.length, 1);
  const seg = 360 / count;
  const complete = cities.length > 0 && medaledCities.length >= cities.length;
  const medalSet = new Set(medaledCities);
  // Teeth count varies the silhouette a touch per region (deterministic).
  const teeth = 8 + (region.length % 5);

  return (
    <Svg width={S} height={S} viewBox={`0 0 ${S} ${S}`}>
      {/* Cog ring */}
      <Polygon
        points={cogPoints(C, C, S * 0.46, S * 0.40, teeth)}
        fill={complete ? accent : COLORS.BG_BORDER}
        stroke={complete ? COLORS.GOLD : COLORS.BG_SURFACE}
        strokeWidth={2}
      />
      {/* Wedges (one per city) */}
      <G>
        {cities.map((city, i) => {
          const start = i * seg;
          const filled = medalSet.has(city);
          const isHi = highlightCity === city;
          return (
            <Path
              key={city}
              d={wedgePath(C, C, start, start + seg, R)}
              fill={filled ? accent : COLORS.BG_DARK}
              opacity={filled ? (isHi ? 1 : 0.92) : 0.5}
              stroke={isHi ? COLORS.GOLD : COLORS.BG_DARK}
              strokeWidth={isHi ? 3 : 1.5}
            />
          );
        })}
      </G>
      {/* Hub */}
      <Circle cx={C} cy={C} r={S * 0.12} fill={complete ? COLORS.GOLD : COLORS.BG_SURFACE} stroke={accent} strokeWidth={2} />
      <SvgText
        x={C}
        y={C + S * 0.045}
        fill={complete ? COLORS.BG_DARK : accent}
        fontSize={S * 0.13}
        fontWeight="bold"
        textAnchor="middle"
      >
        {region.charAt(0).toUpperCase()}
      </SvgText>
    </Svg>
  );
};

export default RegionBadgeJigsaw;
