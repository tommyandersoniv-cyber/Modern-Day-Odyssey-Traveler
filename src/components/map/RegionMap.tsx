// ============================================================================
// RegionMap — a stylized Thailand overview. Each region is a Pressable box
// positioned by region.layout (0-100 percent coordinate space) inside a fixed
// aspect-ratio container. Active regions glow gold (Reanimated pulse); inactive
// regions are greyed with a .
// ============================================================================

import React, { useEffect } from 'react';
import { Pressable, Text, View } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import type { MapSprite, RegionMeta } from '../../types';
import { COLORS, SIZES } from '../../utils/constants';
import { formatNumber } from '../../utils/helpers';
import { PixelText } from '../ui/PixelText';
import { SpriteToken } from '../codex/SpriteToken';

/** Odyssey-mode tile state for a region, keyed by region.region.
 *   locked    — not yet reachable (complete your current region first)
 *   choosable — you may unlock this one now (tap to start / explore next)
 *   active    — unlocked, in progress (shows accruing XP toward threshold)
 *   complete  — unlocked and filled to the threshold
 */
export interface OdysseyTile {
  state: 'locked' | 'choosable' | 'active' | 'complete';
  xp?: number;
  threshold?: number;
}

export interface RegionMapProps {
  regions: RegionMeta[];
  onPressRegion: (region: RegionMeta) => void;
  /** Pixel characters standing in each region, keyed by region.region. */
  occupants?: Record<string, MapSprite[]>;
  /** Odyssey tile state per region (omitted in Exploration mode). */
  odyssey?: Record<string, OdysseyTile>;
}

const MAX_TOKENS = 4;

const OccupantStrip: React.FC<{ sprites: MapSprite[] }> = ({ sprites }) => {
  const shown = sprites.slice(0, MAX_TOKENS);
  const extra = sprites.length - shown.length;
  return (
    <View
      pointerEvents="none"
      style={{
        position: 'absolute',
        bottom: 4,
        left: 0,
        right: 0,
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        alignItems: 'flex-end',
      }}
    >
      {shown.map((s) => (
        <View
          key={s.id}
          style={{
            marginHorizontal: 1,
            paddingHorizontal: 1,
            borderBottomWidth: s.isPlayer ? 2 : 0,
            borderColor: COLORS.GOLD,
          }}
        >
          <SpriteToken sprite={s} size={s.isPlayer ? 22 : 18} />
        </View>
      ))}
      {extra > 0 ? (
        <PixelText size={7} color={COLORS.TEXT_SECONDARY} style={{ marginLeft: 2, alignSelf: 'center' }}>
          {`+${extra}`}
        </PixelText>
      ) : null}
    </View>
  );
};

// Logical aspect of the Thailand "map" container (taller than wide).
const MAP_ASPECT = 0.62;

const RegionBox: React.FC<{
  region: RegionMeta;
  onPress: (r: RegionMeta) => void;
  occupants?: MapSprite[];
  tile?: OdysseyTile;
}> = ({ region, onPress, occupants, tile }) => {
  const state = tile?.state; // undefined in Exploration mode
  const locked = state === 'locked';
  const choosable = state === 'choosable';
  const complete = state === 'complete';
  // "Alive" tiles pulse: choosable invitations + in-progress regions (and all
  // regions in Exploration mode, where there's no tile state).
  const alive = !state || state === 'active' || choosable;
  const pressable = region.active && !locked;

  const glow = useSharedValue(0);
  useEffect(() => {
    if (alive) {
      glow.value = withRepeat(withTiming(1, { duration: 1100, easing: Easing.inOut(Easing.ease) }), -1, true);
    } else {
      cancelAnimation(glow);
      glow.value = 0;
    }
    return () => cancelAnimation(glow);
  }, [alive, glow]);

  const animStyle = useAnimatedStyle(() => ({
    opacity: alive ? 0.7 + glow.value * 0.3 : 1,
    transform: [{ scale: alive ? 1 + glow.value * 0.02 : 1 }],
  }));

  // Hall tiles (Food Hall / Legendary Quests) carry a custom outline so they
  // read as special places rather than regions; Odyssey states still win.
  const accent = locked
    ? COLORS.TEXT_DISABLED
    : choosable
      ? COLORS.TEAL
      : complete
        ? COLORS.GREEN
        : region.outline ?? COLORS.GOLD;
  const fill = locked ? COLORS.BG_SURFACE : COLORS.BG_CARD;
  const pct = tile?.threshold ? Math.max(0, Math.min(1, (tile.xp ?? 0) / tile.threshold)) : 0;

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          left: `${region.layout.x}%`,
          top: `${region.layout.y}%`,
          width: `${region.layout.w}%`,
          height: `${region.layout.h}%`,
        },
        animStyle,
      ]}
    >
      <Pressable
        onPress={pressable ? () => onPress(region) : undefined}
        disabled={!pressable}
        style={{
          flex: 1,
          backgroundColor: fill,
          borderWidth: SIZES.borderWidth,
          borderColor: accent,
          borderRadius: SIZES.borderRadius,
          padding: SIZES.spacingXs,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <PixelText
          size={SIZES.fontXs}
          color={locked ? COLORS.TEXT_DISABLED : COLORS.TEXT_PRIMARY}
          align="center"
          numberOfLines={3}
        >
          {region.name.toUpperCase()}
        </PixelText>

        {/* Per-region XP progress on unlocked tiles (the card "fills up"). */}
        {state === 'active' || complete ? (
          <View style={{ width: '82%', marginTop: 5, alignItems: 'center' }}>
            <View style={{ width: '100%', height: 6, backgroundColor: COLORS.BG_DARK, borderWidth: 1, borderColor: COLORS.BG_BORDER }}>
              <View style={{ width: `${(complete ? 1 : pct) * 100}%`, height: '100%', backgroundColor: complete ? COLORS.GREEN : COLORS.PURPLE }} />
            </View>
            <PixelText size={5} color={complete ? COLORS.GREEN : COLORS.TEXT_SECONDARY} align="center" style={{ marginTop: 3 }}>
              {complete ? 'COMPLETE' : `${formatNumber(tile?.xp ?? 0)} / ${formatNumber(tile?.threshold ?? 0)} XP`}
            </PixelText>
          </View>
        ) : null}

        {choosable ? (
          <PixelText size={5} color={COLORS.TEAL} align="center" style={{ marginTop: 4 }}>
            TAP TO UNLOCK
          </PixelText>
        ) : null}

        {occupants && occupants.length > 0 ? <OccupantStrip sprites={occupants} /> : null}

        {locked ? (
          <View
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(8,8,16,0.8)',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text style={{ fontSize: 18 }}>🔒</Text>
            <PixelText size={6} color={COLORS.TEXT_DISABLED} align="center" style={{ marginTop: 4 }}>
              LOCKED
            </PixelText>
          </View>
        ) : null}
      </Pressable>
    </Animated.View>
  );
};

export const RegionMap: React.FC<RegionMapProps> = ({ regions, onPressRegion, occupants, odyssey }) => {
  return (
    <View
      style={{
        width: '100%',
        aspectRatio: MAP_ASPECT,
        backgroundColor: COLORS.BG_DARK,
        borderWidth: SIZES.borderWidth,
        borderColor: COLORS.BG_BORDER,
        borderRadius: SIZES.borderRadius,
        overflow: 'hidden',
      }}
    >
      {regions.map((region) => (
        <RegionBox
          key={region.id}
          region={region}
          onPress={onPressRegion}
          occupants={occupants?.[region.region]}
          tile={odyssey?.[region.region]}
        />
      ))}
    </View>
  );
};

export default RegionMap;
