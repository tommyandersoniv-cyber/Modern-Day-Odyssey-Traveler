// ============================================================================
// PixelText — the single text primitive.
//   variant="pixel"  - Press Start 2P (titles, XP, labels, buttons)
//   variant="body"   - system font (descriptions, journals, long copy)
// ============================================================================

import React from 'react';
import { StyleProp, Text, TextProps, TextStyle } from 'react-native';
import { COLORS, FONT } from '../../utils/constants';

export interface PixelTextProps extends TextProps {
  children?: React.ReactNode;
  variant?: 'pixel' | 'body';
  size?: number;
  color?: string;
  align?: TextStyle['textAlign'];
  /** Extra letter spacing — pixel fonts read better with a touch of air. */
  spacing?: number;
  lineHeight?: number;
  style?: StyleProp<TextStyle>;
}

export const PixelText: React.FC<PixelTextProps> = ({
  children,
  variant = 'pixel',
  size = 12,
  color = COLORS.TEXT_PRIMARY,
  align,
  spacing,
  lineHeight,
  style,
  ...rest
}) => {
  // Press Start 2P has no emoji / symbol glyphs, so a pixel-font string made up
  // entirely of symbols (* % + OK #  # flags…) renders as tofu — especially on
  // web. Detect symbol-only content and fall back to the system font so it shows.
  const raw = typeof children === 'string' ? children : '';
  const stripped = raw.replace(/\s/g, '');
  const symbolOnly = stripped.length > 0 && !/[\x20-\x7E]/.test(stripped);
  const isPixel = variant === 'pixel' && !symbolOnly;
  return (
    <Text
      {...rest}
      style={[
        {
          fontFamily: isPixel ? FONT.pixel : FONT.body,
          fontSize: size,
          color,
          textAlign: align,
          letterSpacing: spacing ?? (isPixel ? 0.5 : 0),
          // Pixel font needs generous line height or glyphs clip.
          lineHeight: lineHeight ?? (isPixel ? size * 1.6 : size * 1.45),
        },
        style,
      ]}
    >
      {children}
    </Text>
  );
};

export default PixelText;
