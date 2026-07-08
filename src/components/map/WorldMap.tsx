// ============================================================================
// WorldMap — the top-level overworld: clickable COUNTRY tiles laid out on a
// stylized world board. Available countries glow gold (Reanimated pulse) and
// are enterable; "coming soon" countries are greyed with a lock overlay.
// Mirrors RegionMap's look so the two zoom levels feel like one map.
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
import type { CountryMeta } from '../../types';
import { COLORS, SIZES } from '../../utils/constants';
import { PixelText } from '../ui/PixelText';

export interface WorldMapProps {
  countries: CountryMeta[];
  onPressCountry: (country: CountryMeta) => void;
  /** Available countries that are locked by Odyssey progression (not yet open). */
  lockedIds?: string[];
  /** Optional sublabel per country id (e.g. "0/3 REGIONS") when locked. */
  hints?: Record<string, string>;
}

// Wider-than-tall board so the country cluster reads as a world view.
const WORLD_ASPECT = 1.25;

const CountryBox: React.FC<{ country: CountryMeta; onPress: (c: CountryMeta) => void; locked: boolean; hint?: string }> = ({ country, onPress, locked, hint }) => {
  const open = country.available && !locked;
  const glow = useSharedValue(0);

  useEffect(() => {
    if (open) {
      glow.value = withRepeat(withTiming(1, { duration: 1100, easing: Easing.inOut(Easing.ease) }), -1, true);
    } else {
      cancelAnimation(glow);
      glow.value = 0;
    }
    return () => cancelAnimation(glow);
  }, [open, glow]);

  const animStyle = useAnimatedStyle(() => ({
    opacity: open ? 0.7 + glow.value * 0.3 : 1,
    transform: [{ scale: open ? 1 + glow.value * 0.02 : 1 }],
  }));

  const accent = open ? country.accent : COLORS.TEXT_DISABLED;
  const fill = open ? COLORS.BG_CARD : COLORS.BG_SURFACE;

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          left: `${country.layout.x}%`,
          top: `${country.layout.y}%`,
          width: `${country.layout.w}%`,
          height: `${country.layout.h}%`,
        },
        animStyle,
      ]}
    >
      <Pressable
        onPress={open ? () => onPress(country) : undefined}
        disabled={!open}
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
        <Text style={{ fontSize: 26, opacity: open ? 1 : 0.45 }}>{open ? country.flag : '🔒'}</Text>
        <PixelText
          size={SIZES.fontXs}
          color={open ? COLORS.TEXT_PRIMARY : COLORS.TEXT_DISABLED}
          align="center"
          numberOfLines={2}
          style={{ marginTop: 4 }}
        >
          {country.name.toUpperCase()}
        </PixelText>
        <PixelText size={5} color={open ? accent : COLORS.TEXT_DISABLED} align="center" style={{ marginTop: 4 }}>
          {!country.available ? 'COMING SOON' : locked ? (hint ?? 'LOCKED') : 'TAP TO ENTER'}
        </PixelText>
      </Pressable>
    </Animated.View>
  );
};

export const WorldMap: React.FC<WorldMapProps> = ({ countries, onPressCountry, lockedIds, hints }) => {
  return (
    <View
      style={{
        width: '100%',
        aspectRatio: WORLD_ASPECT,
        backgroundColor: COLORS.BG_DARK,
        borderWidth: SIZES.borderWidth,
        borderColor: COLORS.BG_BORDER,
        borderRadius: SIZES.borderRadius,
        overflow: 'hidden',
      }}
    >
      {countries.map((country) => (
        <CountryBox
          key={country.id}
          country={country}
          onPress={onPressCountry}
          locked={!!lockedIds?.includes(country.id)}
          hint={hints?.[country.id]}
        />
      ))}
    </View>
  );
};

export default WorldMap;
