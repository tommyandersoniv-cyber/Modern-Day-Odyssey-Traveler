// ============================================================================
// PixelAvatar — a square pixel-art avatar tile.
//   Priority: custom appearance sprite > processed pixel photo > glyph
//   placeholder. Always a flat BG_SURFACE box with a pixel border.
// ============================================================================

import React from 'react';
import { Image, View } from 'react-native';
import type { CharacterAppearance } from '../../types';
import { COLORS, SIZES } from '../../utils/constants';
import { PixelText } from '../ui/PixelText';
import { CustomSprite } from './CustomSprite';

export interface PixelAvatarProps {
  uri?: string;
  appearance?: CharacterAppearance;
  size?: number;
  placeholderGlyph?: string;
}

export const PixelAvatar: React.FC<PixelAvatarProps> = ({
  uri,
  appearance,
  size = 24,
  placeholderGlyph = '+',
}) => {
  const box = {
    width: size,
    height: size,
    borderWidth: SIZES.borderWidth,
    borderColor: COLORS.BG_BORDER,
    borderRadius: SIZES.borderRadius,
    backgroundColor: COLORS.BG_SURFACE,
  } as const;

  if (appearance) {
    return (
      <View style={[box, { alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }]}>
        <CustomSprite appearance={appearance} size={size * 0.86} />
      </View>
    );
  }

  if (uri) {
    return (
      <Image
        source={{ uri }}
        resizeMode="cover"
        style={box}
      />
    );
  }

  return (
    <View
      style={[
        box,
        {
          alignItems: 'center',
          justifyContent: 'center',
        },
      ]}
    >
      <PixelText size={Math.round(size * 0.4)} color={COLORS.TEAL}>
        {placeholderGlyph}
      </PixelText>
    </View>
  );
};

export default PixelAvatar;
