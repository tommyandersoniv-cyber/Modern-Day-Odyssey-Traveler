// ============================================================================
// CodexGrid — a 2-column wrapping grid of CharacterCards for the codex.
//   Renders an empty-state message when no characters have been met yet.
// ============================================================================

import React from 'react';
import { View } from 'react-native';
import type { Character } from '../../types';
import { COLORS, SIZES } from '../../utils/constants';
import { PixelText } from '../ui/PixelText';
import { CharacterCard } from './CharacterCard';

export interface CodexGridProps {
  characters: Character[];
  onPressCharacter: (id: string) => void;
}

export const CodexGrid: React.FC<CodexGridProps> = ({ characters, onPressCharacter }) => {
  if (characters.length === 0) {
    return (
      <View
        style={{
          paddingVertical: SIZES.spacingXl,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <PixelText size={SIZES.fontSm} color={COLORS.TEXT_DISABLED} align="center">
          No characters yet
        </PixelText>
      </View>
    );
  }

  return (
    <View
      style={{
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginHorizontal: -SIZES.spacingXs,
      }}
    >
      {characters.map((character) => (
        <View
          key={character.id}
          style={{
            width: '50%',
            paddingHorizontal: SIZES.spacingXs,
            marginBottom: SIZES.spacingSm,
          }}
        >
          <CharacterCard
            character={character}
            onPress={() => onPressCharacter(character.id)}
          />
        </View>
      ))}
    </View>
  );
};

export default CodexGrid;
