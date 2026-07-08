// ============================================================================
// CustomizePlayerScreen — edit the player's name + pixel avatar (the sprite
// that appears on the map and HUD).
// ============================================================================

import React, { useState } from 'react';
import { ScrollView, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { CharacterAppearance } from '../types';
import { COLORS, SIZES } from '../utils/constants';
import { normalizeAppearance } from '../utils/appearance';
import { useAppNavigation } from '../navigation/hooks';
import { useGameStore } from '../store/useGameStore';

import { PixelText } from '../components/ui/PixelText';
import { PixelButton } from '../components/ui/PixelButton';
import { ScreenHeader } from '../components/ui/ScreenHeader';
import { AvatarCustomizer } from '../components/codex/AvatarCustomizer';

const inputStyle = {
  backgroundColor: COLORS.BG_SURFACE,
  borderWidth: SIZES.borderWidth,
  borderColor: COLORS.BG_BORDER,
  color: COLORS.TEXT_PRIMARY,
  paddingHorizontal: SIZES.spacingMd,
  paddingVertical: SIZES.spacingSm,
  fontSize: 14,
} as const;

export default function CustomizePlayerScreen() {
  const navigation = useAppNavigation();
  const player = useGameStore((s) => s.player);

  const [name, setName] = useState(player.name);
  const [appearance, setAppearance] = useState<CharacterAppearance>(normalizeAppearance(player.appearance));

  const save = () => {
    const trimmed = name.trim();
    if (trimmed && trimmed !== player.name) useGameStore.getState().setPlayerName(trimmed);
    useGameStore.getState().setPlayerAppearance(appearance);
    navigation.goBack();
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.BG_DARK }}>
      <ScreenHeader title="CUSTOMIZE PLAYER" onBack={() => navigation.goBack()} accent={COLORS.GOLD} />
      <ScrollView contentContainerStyle={{ padding: SIZES.spacingLg, paddingBottom: 60 }} keyboardShouldPersistTaps="handled">
        <PixelText size={8} color={COLORS.TEAL} style={{ marginBottom: 6 }}>
          NAME
        </PixelText>
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="Traveler"
          placeholderTextColor={COLORS.TEXT_DISABLED}
          style={inputStyle}
        />

        <AvatarCustomizer value={appearance} onChange={setAppearance} />

        <PixelButton
          label="SAVE"
          color={COLORS.GREEN}
          size="lg"
          fullWidth
          onPress={save}
          style={{ marginTop: SIZES.spacingLg }}
        />
      </ScrollView>
    </SafeAreaView>
  );
}
