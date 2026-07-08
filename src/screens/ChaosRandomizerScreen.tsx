// ============================================================================
// ChaosRandomizerScreen — 1d20 roll for the region chaos requirement. Follows
// the boss wheel on region entry. Full-screen, no dismiss until rolled.
// ============================================================================

import React, { useState } from 'react';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { RootStackParamList } from '../types';
import { RouteProp, useRoute } from '@react-navigation/native';
import { COLORS, SIZES } from '../utils/constants';
import { useAppNavigation } from '../navigation/hooks';
import { useChaosStore } from '../store/useChaosStore';
import { useGameStore } from '../store/useGameStore';

import { PixelText } from '../components/ui/PixelText';
import { PixelButton } from '../components/ui/PixelButton';
import { DiceRoller } from '../components/chaos/DiceRoller';

export default function ChaosRandomizerScreen() {
  const navigation = useAppNavigation();
  const route = useRoute<RouteProp<RootStackParamList, 'ChaosRandomizer'>>();
  const { region } = route.params;
  const [roll, setRoll] = useState<number | null>(null);

  const begin = () => {
    if (roll == null) return;
    const bossId = useChaosStore.getState().active_boss_quest_id ?? '';
    useGameStore.getState().enterRegion(region, bossId, roll);
    useGameStore.getState().setCurrentLocation(region);
    navigation.navigate('MainTabs');
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.BG_DARK }}>
      <View style={{ flex: 1, padding: SIZES.spacingLg, alignItems: 'center', justifyContent: 'center' }}>
        <PixelText size={18} color={COLORS.QUEST_CHAOS} align="center" style={{ marginBottom: SIZES.spacingXl }}>
          CHAOS REQUIREMENT
        </PixelText>

        <DiceRoller onResult={setRoll} />

        {roll != null ? (
          <View style={{ marginTop: SIZES.spacingXl, alignItems: 'center' }}>
            <PixelText size={16} color={COLORS.GOLD} align="center">
              {`YOU NEED ${roll} CHAOS QUESTS`}
            </PixelText>
            <PixelText size={9} variant="body" color={COLORS.TEXT_SECONDARY} align="center" style={{ marginTop: SIZES.spacingSm }}>
              {`to earn the ${region} Region Badge`}
            </PixelText>
            <PixelButton
              label="BEGIN YOUR ODYSSEY"
              color={COLORS.GOLD}
              size="lg"
              fullWidth
              onPress={begin}
              style={{ marginTop: SIZES.spacingXl }}
            />
          </View>
        ) : null}
      </View>
    </SafeAreaView>
  );
}
