// ============================================================================
// JournalEntry — renders an archive entry's journal text in full (no truncation)
// inside a flat dark bordered surface. Empty text - muted placeholder.
// ============================================================================

import React from 'react';
import { View } from 'react-native';
import { COLORS, SIZES } from '../../utils/constants';
import { PixelText } from '../ui/PixelText';

export interface JournalEntryProps {
  text?: string;
}

export const JournalEntry: React.FC<JournalEntryProps> = ({ text }) => {
  const trimmed = text?.trim() ?? '';

  if (trimmed.length === 0) {
    return (
      <View
        style={{
          backgroundColor: COLORS.BG_SURFACE,
          borderWidth: SIZES.borderWidth,
          borderColor: COLORS.BG_BORDER,
          borderRadius: SIZES.borderRadius,
          padding: SIZES.spacingMd,
        }}
      >
        <PixelText variant="body" size={SIZES.fontMd} color={COLORS.TEXT_DISABLED}>
          No journal entry.
        </PixelText>
      </View>
    );
  }

  return (
    <View
      style={{
        backgroundColor: COLORS.BG_SURFACE,
        borderWidth: SIZES.borderWidth,
        borderColor: COLORS.BG_BORDER,
        borderRadius: SIZES.borderRadius,
        padding: SIZES.spacingMd,
      }}
    >
      <PixelText variant="body" size={SIZES.fontLg} color={COLORS.TEXT_PRIMARY}>
        {trimmed}
      </PixelText>
    </View>
  );
};

export default JournalEntry;
