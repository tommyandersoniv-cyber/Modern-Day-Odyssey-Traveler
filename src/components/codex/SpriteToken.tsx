// ============================================================================
// SpriteToken — renders a MapSprite (player or met character) as a small,
// unpositioned pixel token. Prefers a custom appearance sprite; falls back to
// a pixelised photo, then a glyph. Callers handle positioning.
// ============================================================================

import React from 'react';
import { Image, View } from 'react-native';
import type { MapSprite } from '../../types';
import { COLORS } from '../../utils/constants';
import { PixelText } from '../ui/PixelText';
import { CustomSprite } from './CustomSprite';

export interface SpriteTokenProps {
  sprite: MapSprite;
  /** Bounding HEIGHT in px. */
  size?: number;
}

export const SpriteToken: React.FC<SpriteTokenProps> = ({ sprite, size = 14 }) => {
  if (sprite.appearance) {
    return <CustomSprite appearance={sprite.appearance} size={size} />;
  }
  if (sprite.photoUri) {
    return (
      <Image
        source={{ uri: sprite.photoUri }}
        resizeMode="cover"
        style={{ width: size * 0.8, height: size, borderWidth: 1, borderColor: COLORS.BG_BORDER }}
      />
    );
  }
  return (
    <View style={{ width: size * 0.8, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <PixelText size={Math.round(size * 0.5)} color={COLORS.TEAL}>
        +
      </PixelText>
    </View>
  );
};

export default SpriteToken;
