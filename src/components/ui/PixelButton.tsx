// ============================================================================
// PixelButton — flat colour with a 3px stepped bottom shadow (3D pixel feel).
// ============================================================================

import React from 'react';
import { Pressable, StyleProp, View, ViewStyle } from 'react-native';
import { COLORS, SIZES } from '../../utils/constants';
import { PixelText } from './PixelText';

export interface PixelButtonProps {
  label: string;
  onPress?: () => void;
  color?: string; // face colour
  textColor?: string;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  /** A subtle outlined variant for secondary actions. */
  variant?: 'solid' | 'outline';
  style?: StyleProp<ViewStyle>;
}

const PAD: Record<NonNullable<PixelButtonProps['size']>, { v: number; h: number; font: number }> = {
  sm: { v: 8, h: 12, font: 8 },
  md: { v: 12, h: 18, font: 10 },
  lg: { v: 16, h: 24, font: 12 },
};

/** Darken a hex colour for the stepped shadow edge. */
function shade(hex: string, amount = 0.55): string {
  const m = hex.replace('#', '');
  if (m.length !== 6) return COLORS.BLACK;
  const r = Math.round(parseInt(m.slice(0, 2), 16) * amount);
  const g = Math.round(parseInt(m.slice(2, 4), 16) * amount);
  const b = Math.round(parseInt(m.slice(4, 6), 16) * amount);
  return `#${[r, g, b].map((n) => n.toString(16).padStart(2, '0')).join('')}`;
}

export const PixelButton: React.FC<PixelButtonProps> = ({
  label,
  onPress,
  color = COLORS.BLUE,
  textColor,
  disabled = false,
  size = 'md',
  fullWidth = false,
  variant = 'solid',
  style,
}) => {
  const pad = PAD[size];
  const face = disabled ? COLORS.BG_BORDER : color;
  const edge = disabled ? COLORS.BG_DARK : shade(face);
  const isOutline = variant === 'outline';
  const fg = textColor ?? (isOutline ? face : disabled ? COLORS.TEXT_DISABLED : COLORS.BG_DARK);

  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      disabled={disabled}
      style={({ pressed }) => [
        {
          alignSelf: fullWidth ? 'stretch' : 'flex-start',
          backgroundColor: isOutline ? 'transparent' : face,
          borderWidth: SIZES.borderWidth,
          borderColor: isOutline ? face : edge,
          borderRadius: SIZES.borderRadius,
          paddingVertical: pad.v,
          paddingHorizontal: pad.h,
          // Stepped 3D shadow — collapses when pressed for a "press down" feel.
          borderBottomWidth: pressed || isOutline ? SIZES.borderWidth : SIZES.buttonShadow + 2,
          marginBottom: pressed || isOutline ? SIZES.buttonShadow : 0,
          opacity: disabled ? 0.7 : 1,
        },
        style,
      ]}
    >
      <View style={{ alignItems: 'center', justifyContent: 'center' }}>
        <PixelText size={pad.font} color={fg} align="center">
          {label}
        </PixelText>
      </View>
    </Pressable>
  );
};

export default PixelButton;
