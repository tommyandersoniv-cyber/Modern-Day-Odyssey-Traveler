// ============================================================================
// XPBar — a segmented pixel progress bar. Used in HUD, profile, region/zone UI.
// ============================================================================

import React from 'react';
import { StyleProp, View, ViewStyle } from 'react-native';
import { COLORS, SIZES } from '../../utils/constants';
import { clamp } from '../../utils/helpers';
import { PixelText } from '../ui/PixelText';

export interface XPBarProps {
  /** 0-1 fill fraction. */
  progress: number;
  height?: number;
  color?: string;
  trackColor?: string;
  /** Optional label rendered above the bar (e.g. "1,200 / 2,500 XP"). */
  label?: string;
  labelColor?: string;
  /** Render the fill as discrete pixel segments rather than a smooth bar. */
  segmented?: boolean;
  segments?: number;
  style?: StyleProp<ViewStyle>;
}

export const XPBar: React.FC<XPBarProps> = ({
  progress,
  height = 14,
  color = COLORS.GOLD,
  trackColor = COLORS.BG_DARK,
  label,
  labelColor = COLORS.TEXT_SECONDARY,
  segmented = false,
  segments = 20,
  style,
}) => {
  const p = clamp(progress, 0, 1);
  return (
    <View style={style}>
      {label ? (
        <PixelText size={8} color={labelColor} style={{ marginBottom: 4 }}>
          {label}
        </PixelText>
      ) : null}
      <View
        style={{
          height,
          backgroundColor: trackColor,
          borderWidth: SIZES.borderWidth,
          borderColor: COLORS.BG_BORDER,
          flexDirection: 'row',
          overflow: 'hidden',
        }}
      >
        {segmented ? (
          Array.from({ length: segments }).map((_, i) => {
            const filled = (i + 1) / segments <= p + 1e-6;
            return (
              <View
                key={i}
                style={{
                  flex: 1,
                  marginRight: i === segments - 1 ? 0 : 1,
                  backgroundColor: filled ? color : 'transparent',
                }}
              />
            );
          })
        ) : (
          <View style={{ width: `${p * 100}%`, backgroundColor: color }} />
        )}
      </View>
    </View>
  );
};

export default XPBar;
