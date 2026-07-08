// ============================================================================
// ScreenHeader — title row with an optional back button + right slot.
// ============================================================================

import React from 'react';
import { View } from 'react-native';
import { COLORS, SIZES } from '../../utils/constants';
import { PixelText } from './PixelText';
import { PixelButton } from './PixelButton';

export interface ScreenHeaderProps {
  title: string;
  accent?: string;
  onBack?: () => void;
  right?: React.ReactNode;
  /** Line under the title — a string, or a custom node (e.g. a live clock). */
  subtitle?: React.ReactNode;
  subtitleColor?: string;
}

export const ScreenHeader: React.FC<ScreenHeaderProps> = ({
  title,
  accent = COLORS.GOLD,
  onBack,
  right,
  subtitle,
  subtitleColor = COLORS.TEXT_SECONDARY,
}) => (
  <View
    style={{
      paddingHorizontal: SIZES.spacingMd,
      paddingVertical: SIZES.spacingMd,
      borderBottomWidth: SIZES.borderWidth,
      borderBottomColor: COLORS.BG_BORDER,
      flexDirection: 'row',
      alignItems: 'center',
    }}
  >
    {onBack ? (
      <PixelButton label="BACK" size="sm" variant="outline" color={COLORS.TEXT_SECONDARY} onPress={onBack} style={{ marginRight: SIZES.spacingMd }} />
    ) : null}
    <View style={{ flex: 1 }}>
      <PixelText size={14} color={accent} align={onBack ? 'right' : 'left'}>
        {title}
      </PixelText>
      {subtitle == null ? null : typeof subtitle === 'string' ? (
        <PixelText size={8} color={subtitleColor} align={onBack ? 'right' : 'left'} style={{ marginTop: 4 }}>
          {subtitle}
        </PixelText>
      ) : (
        subtitle
      )}
    </View>
    {right ? <View style={{ marginLeft: SIZES.spacingMd }}>{right}</View> : null}
  </View>
);

export default ScreenHeader;
