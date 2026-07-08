// ============================================================================
// ZoneOverlay — draws each city zone as a tinted, bordered box inside the
// 800x600 city canvas. Each box shows the zone name, a small completion bar,
// and a few quest-marker glyphs. Cleared zones (pct >= 0.7) render greyed with
// a OK. The caller scales the 800x600 space; we position with the absolute
// x/y/w/h from city.zoneLayout directly.
// ============================================================================

import React from 'react';
import { Pressable, View } from 'react-native';
import type { CityMeta, MarkerType } from '../../types';
import {
  BADGE_THRESHOLD,
  CATEGORY_TINT,
  COLORS,
  MARKER_GLYPH,
  SIZES,
} from '../../utils/constants';
import { clamp } from '../../utils/helpers';
import { PixelText } from '../ui/PixelText';

export interface ZoneOverlayProps {
  city: CityMeta;
  /** zone name - completion fraction 0..1. */
  completedPctByZone: Record<string, number>;
  /** zone name - whether the zone is unlocked / accessible. */
  unlockedZones: Record<string, boolean>;
  /** @deprecated quest-marker glyphs are no longer rendered inside zone boxes. */
  markersByZone?: Record<string, MarkerType[]>;
  onPressZone: (zone: string) => void;
}

const ZONE_TINTS = [
  CATEGORY_TINT.Spiritual,
  CATEGORY_TINT.Nature,
  CATEGORY_TINT.Adventure,
  CATEGORY_TINT.Market,
  CATEGORY_TINT.Cultural,
  CATEGORY_TINT.Art,
];

export const ZoneOverlay: React.FC<ZoneOverlayProps> = ({
  city,
  completedPctByZone,
  unlockedZones,
  onPressZone,
}) => {
  return (
    <View
      style={{ position: 'absolute', left: 0, top: 0, width: 800, height: 600 }}
      pointerEvents="box-none"
    >
      {city.zones.map((zone, i) => {
        const box = city.zoneLayout[zone];
        if (!box) return null;

        const pct = clamp(completedPctByZone[zone] ?? 0, 0, 1);
        const cleared = pct >= BADGE_THRESHOLD.zone;
        const unlocked = unlockedZones[zone] !== false;
        const tint = cleared
          ? COLORS.BG_SURFACE
          : ZONE_TINTS[i % ZONE_TINTS.length] ?? COLORS.BG_SURFACE;
        const borderColor = cleared
          ? COLORS.GREEN
          : unlocked
            ? COLORS.BG_BORDER
            : COLORS.TEXT_DISABLED;

        return (
          <Pressable
            key={zone}
            onPress={() => onPressZone(zone)}
            style={{
              position: 'absolute',
              left: box.x,
              top: box.y,
              width: box.w,
              height: box.h,
              backgroundColor: tint,
              borderWidth: SIZES.borderWidth,
              borderColor,
              borderRadius: SIZES.borderRadius,
              padding: SIZES.spacingSm,
              justifyContent: 'space-between',
              opacity: unlocked ? 1 : 0.55,
            }}
          >
            {/* Header row: zone name + cleared check */}
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
              }}
            >
              <PixelText
                size={SIZES.fontXs}
                color={cleared ? COLORS.TEXT_SECONDARY : COLORS.TEXT_PRIMARY}
                style={{ flex: 1, marginRight: SIZES.spacingXs }}
                numberOfLines={2}
              >
                {zone.toUpperCase()}
              </PixelText>
              {cleared ? (
                <PixelText size={SIZES.fontSm} color={COLORS.GREEN}>
                  {MARKER_GLYPH.completed}
                </PixelText>
              ) : !unlocked ? (
                <PixelText size={SIZES.fontSm} color={COLORS.TEXT_DISABLED}>
                  {''}
                </PixelText>
              ) : null}
            </View>

            {/* Completion bar */}
            <View>
              <View
                style={{
                  height: 8,
                  backgroundColor: COLORS.BG_DARK,
                  borderWidth: SIZES.borderWidth,
                  borderColor: COLORS.BG_BORDER,
                  flexDirection: 'row',
                  overflow: 'hidden',
                }}
              >
                <View
                  style={{
                    width: `${pct * 100}%`,
                    backgroundColor: cleared ? COLORS.GREEN : COLORS.GOLD,
                  }}
                />
              </View>
            </View>
          </Pressable>
        );
      })}
    </View>
  );
};

export default ZoneOverlay;
