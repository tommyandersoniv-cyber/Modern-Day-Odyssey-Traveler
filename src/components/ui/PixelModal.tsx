// ============================================================================
// PixelModal — a game-style modal overlay with a bordered surface card.
// ============================================================================

import React from 'react';
import { Modal, Pressable, ScrollView, StyleProp, View, ViewStyle } from 'react-native';
import { COLORS, SIZES } from '../../utils/constants';
import { PixelText } from './PixelText';

export interface PixelModalProps {
  visible: boolean;
  onClose?: () => void;
  title?: string;
  accent?: string; // top border accent colour
  children?: React.ReactNode;
  /** Tapping the dimmed backdrop closes the modal (default true). */
  dismissOnBackdrop?: boolean;
  scroll?: boolean;
  maxWidthPct?: number;
  contentStyle?: StyleProp<ViewStyle>;
}

export const PixelModal: React.FC<PixelModalProps> = ({
  visible,
  onClose,
  title,
  accent = COLORS.GOLD,
  children,
  dismissOnBackdrop = true,
  scroll = false,
  maxWidthPct = 92,
  contentStyle,
}) => {
  const Inner = scroll ? ScrollView : View;
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <Pressable
        style={{
          flex: 1,
          backgroundColor: COLORS.OVERLAY,
          alignItems: 'center',
          justifyContent: 'center',
          padding: SIZES.spacingLg,
        }}
        onPress={dismissOnBackdrop ? onClose : undefined}
      >
        {/* Stop propagation so taps inside the card don't dismiss. */}
        <Pressable
          onPress={() => {}}
          style={{
            width: `${maxWidthPct}%`,
            maxWidth: 520,
            backgroundColor: COLORS.BG_CARD,
            borderWidth: SIZES.borderWidth,
            borderColor: COLORS.BG_BORDER,
            borderTopWidth: SIZES.cardAccentWidth + 2,
            borderTopColor: accent,
            borderRadius: SIZES.borderRadius,
          }}
        >
          {title ? (
            <View
              style={{
                borderBottomWidth: SIZES.borderWidth,
                borderBottomColor: COLORS.BG_BORDER,
                paddingVertical: SIZES.spacingMd,
                paddingHorizontal: SIZES.spacingMd,
              }}
            >
              <PixelText size={12} color={accent}>
                {title}
              </PixelText>
            </View>
          ) : null}
          <Inner
            style={{ maxHeight: scroll ? 520 : undefined }}
            contentContainerStyle={scroll ? { padding: SIZES.spacingMd } : undefined}
          >
            <View style={[scroll ? undefined : { padding: SIZES.spacingMd }, contentStyle]}>
              {children}
            </View>
          </Inner>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

export default PixelModal;
