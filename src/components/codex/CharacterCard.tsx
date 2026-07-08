// ============================================================================
// CharacterCard — a tappable card summarising a met character for the codex.
//   Pixel avatar + name + location + XP awarded.
// ============================================================================

import React from 'react';
import { Pressable, View } from 'react-native';
import type { Character } from '../../types';
import { COLORS, SIZES } from '../../utils/constants';
import { formatNumber } from '../../utils/helpers';
import { PixelText } from '../ui/PixelText';
import { PixelAvatar } from './PixelAvatar';

export interface CharacterCardProps {
  character: Character;
  onPress?: () => void;
}

export const CharacterCard: React.FC<CharacterCardProps> = ({ character, onPress }) => {
  const location =
    character.custom_location ?? character.city ?? character.zone ?? character.region;

  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      style={({ pressed }) => [
        {
          backgroundColor: COLORS.BG_CARD,
          borderWidth: SIZES.borderWidth,
          borderColor: COLORS.BG_BORDER,
          borderRadius: SIZES.borderRadius,
          padding: SIZES.spacingSm,
          alignItems: 'center',
          opacity: pressed ? 0.85 : 1,
        },
      ]}
    >
      <PixelAvatar uri={character.pixel_avatar_uri} appearance={character.appearance} size={36} />

      <PixelText
        size={SIZES.fontSm}
        color={COLORS.TEXT_PRIMARY}
        align="center"
        style={{ marginTop: SIZES.spacingSm }}
        numberOfLines={1}
      >
        {character.name}
      </PixelText>

      {location ? (
        <PixelText
          variant="body"
          size={SIZES.fontMd}
          color={COLORS.TEXT_SECONDARY}
          align="center"
          style={{ marginTop: SIZES.spacingXs }}
          numberOfLines={1}
        >
          {location}
        </PixelText>
      ) : null}

      <View style={{ marginTop: SIZES.spacingXs }}>
        <PixelText size={SIZES.fontXs} color={COLORS.GOLD} align="center">
          {`+${formatNumber(character.xp_awarded)} XP`}
        </PixelText>
      </View>
    </Pressable>
  );
};

export default CharacterCard;
