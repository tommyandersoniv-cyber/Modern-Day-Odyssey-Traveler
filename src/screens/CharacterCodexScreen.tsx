// ============================================================================
// CharacterCodexScreen — the cast, grouped by region with badge progress.
// ============================================================================

import React from 'react';
import { ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, REGION_REQUIRED_CHARACTERS, SIZES } from '../utils/constants';
import { builtInRegions } from '../utils/world';
import { useAppNavigation } from '../navigation/hooks';
import { useCodexStore } from '../store/useCodexStore';

import { PixelText } from '../components/ui/PixelText';
import { PixelButton } from '../components/ui/PixelButton';
import { ScreenHeader } from '../components/ui/ScreenHeader';
import { XPBar } from '../components/quests/XPBar';
import { CodexGrid } from '../components/codex/CodexGrid';

export default function CharacterCodexScreen() {
  const navigation = useAppNavigation();
  const characters = useCodexStore((s) => s.characters);

  const open = (id: string) => navigation.navigate('CharacterDetail', { characterId: id });
  const allRegions = builtInRegions();
  const regionsWithChars = allRegions.filter(
    (r) => r.active || characters.some((c) => c.region === r.region),
  );
  const ungrouped = characters.filter((c) => !allRegions.some((r) => r.region === c.region));

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.BG_DARK }} edges={['top']}>
      <ScreenHeader title="CHARACTER CODEX" accent={COLORS.TEAL} subtitle={`${characters.length} met`} onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={{ padding: SIZES.spacingMd, paddingBottom: 96 }}>
        {characters.length === 0 ? (
          <View style={{ paddingVertical: SIZES.spacingXl, alignItems: 'center' }}>
            <PixelText size={32} color={COLORS.TEAL}>+</PixelText>
            <PixelText size={10} color={COLORS.TEXT_SECONDARY} align="center" style={{ marginTop: SIZES.spacingMd }}>
              No characters yet
            </PixelText>
            <PixelText size={8} variant="body" color={COLORS.TEXT_DISABLED} align="center" style={{ marginTop: 6 }}>
              Meet someone real on your travels, then add them here.
            </PixelText>
          </View>
        ) : null}

        {regionsWithChars.map((r) => {
          const inRegion = characters.filter((c) => c.region === r.region);
          const count = useCodexStore.getState().charactersInRegion(r.region);
          return (
            <View key={r.id} style={{ marginBottom: SIZES.spacingLg }}>
              <PixelText size={10} color={r.accent} style={{ marginBottom: 4 }}>
                {r.name.toUpperCase()}
              </PixelText>
              <PixelText size={7} color={COLORS.TEXT_SECONDARY} style={{ marginBottom: 6 }}>
                {`${count} / ${REGION_REQUIRED_CHARACTERS} characters`}
              </PixelText>
              <XPBar
                progress={Math.min(1, count / REGION_REQUIRED_CHARACTERS)}
                color={r.accent}
                segmented
                segments={REGION_REQUIRED_CHARACTERS}
                style={{ marginBottom: SIZES.spacingSm }}
              />
              {inRegion.length > 0 ? (
                <CodexGrid characters={inRegion} onPressCharacter={open} />
              ) : (
                <PixelText size={7} variant="body" color={COLORS.TEXT_DISABLED}>
                  None yet in this region.
                </PixelText>
              )}
            </View>
          );
        })}

        {ungrouped.length > 0 ? (
          <View style={{ marginBottom: SIZES.spacingLg }}>
            <PixelText size={10} color={COLORS.TEXT_SECONDARY} style={{ marginBottom: 6 }}>
              ELSEWHERE
            </PixelText>
            <CodexGrid characters={ungrouped} onPressCharacter={open} />
          </View>
        ) : null}
      </ScrollView>

      <View style={{ position: 'absolute', right: SIZES.spacingMd, bottom: SIZES.spacingLg }}>
        <PixelButton label="+ ADD" color={COLORS.TEAL} size="lg" onPress={() => navigation.navigate('AddCharacter')} />
      </View>
    </SafeAreaView>
  );
}
