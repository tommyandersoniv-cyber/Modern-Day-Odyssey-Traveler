// ============================================================================
// LevelUpModal — celebratory "LEVEL UP!" overlay shown when the player gains
//   a level. Uses PixelModal (cannot be dismissed by tapping the backdrop).
// ============================================================================

import React from 'react';
import { View } from 'react-native';
import Animated, { ZoomIn } from 'react-native-reanimated';
import { COLORS, SIZES } from '../../utils/constants';
import { PixelButton } from './PixelButton';
import { PixelModal } from './PixelModal';
import { PixelText } from './PixelText';

export interface LevelUpModalProps {
  visible: boolean;
  level: number;
  title: string;
  onClose: () => void;
}

export const LevelUpModal: React.FC<LevelUpModalProps> = ({
  visible,
  level,
  title,
  onClose,
}) => {
  return (
    <PixelModal
      visible={visible}
      onClose={onClose}
      accent={COLORS.GOLD}
      dismissOnBackdrop={false}
      maxWidthPct={86}
    >
      <Animated.View
        // Re-key on level so the ZoomIn replays for each new level.
        key={level}
        entering={ZoomIn.springify().damping(12)}
        style={{ alignItems: 'center', paddingVertical: SIZES.spacingSm }}
      >
        <PixelText size={SIZES.fontXl} color={COLORS.GOLD} align="center" spacing={1}>
          LEVEL UP!
        </PixelText>

        <View
          style={{
            marginTop: SIZES.spacingMd,
            paddingVertical: SIZES.spacingSm,
            paddingHorizontal: SIZES.spacingLg,
            backgroundColor: COLORS.BG_SURFACE,
            borderWidth: SIZES.borderWidth,
            borderColor: COLORS.GOLD,
            borderRadius: SIZES.borderRadius,
          }}
        >
          <PixelText size={SIZES.fontXl} color={COLORS.TEXT_PRIMARY} align="center">
            {`LV ${level}`}
          </PixelText>
        </View>

        <PixelText
          size={SIZES.fontMd}
          color={COLORS.TEXT_PRIMARY}
          align="center"
          spacing={1}
          style={{ marginTop: SIZES.spacingMd }}
        >
          {title.toUpperCase()}
        </PixelText>

        <View style={{ marginTop: SIZES.spacingLg }}>
          <PixelButton label="CONTINUE" color={COLORS.GOLD} onPress={onClose} size="md" />
        </View>
      </Animated.View>
    </PixelModal>
  );
};

export default LevelUpModal;
