// ============================================================================
// BossWheelScreen — mandatory spin on region entry. Cannot dismiss without
// spinning. Chains to ChaosRandomizer on accept.
// ============================================================================

import React, { useEffect, useRef, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { Quest, RootStackParamList } from '../types';
import { RouteProp, useRoute } from '@react-navigation/native';
import { COLORS, SIZES } from '../utils/constants';
import { formatNumber } from '../utils/helpers';
import { useAppNavigation } from '../navigation/hooks';
import { useChaosStore } from '../store/useChaosStore';

import { PixelText } from '../components/ui/PixelText';
import { PixelButton } from '../components/ui/PixelButton';
import { BossWheel } from '../components/chaos/BossWheel';

export default function BossWheelScreen() {
  const navigation = useAppNavigation();
  const route = useRoute<RouteProp<RootStackParamList, 'BossWheel'>>();
  const { region } = route.params;

  const bossQuests = useChaosStore((s) => s.boss_wheel_quests);
  const [winner, setWinner] = useState<Quest | null>(null);
  const scrollRef = useRef<ScrollView>(null);

  const segments = bossQuests.map((q) => ({ id: q.id, label: q.title }));

  const onSpinEnd = (index: number) => {
    const q = bossQuests[index] ?? bossQuests[0];
    if (!q) return;
    useChaosStore.getState().setActiveBoss(q.id);
    setWinner(q);
  };

  // Reveal the result card once a boss is chosen (it sits below the wheel).
  useEffect(() => {
    if (winner) {
      const t = setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 250);
      return () => clearTimeout(t);
    }
  }, [winner]);

  // Safety net: the boss wheel must always have quests. If the pool failed to
  // load, skip straight to the chaos roll rather than presenting a dead wheel.
  if (segments.length === 0) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.BG_DARK }}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: SIZES.spacingLg }}>
          <PixelText size={12} color={COLORS.QUEST_BOSS} align="center" style={{ marginBottom: SIZES.spacingLg }}>
            NO BOSS AVAILABLE
          </PixelText>
          <PixelButton
            label="CONTINUE"
            color={COLORS.GOLD}
            size="lg"
            fullWidth
            onPress={() => navigation.replace('ChaosRandomizer', { region })}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.BG_DARK }}>
      <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
        <ScrollView
          ref={scrollRef}
          style={{ flex: 1 }}
          contentContainerStyle={{
            padding: SIZES.spacingLg,
            paddingBottom: 80,
            alignItems: 'center',
            flexGrow: 1,
          }}
        >
        <PixelText size={18} color={COLORS.QUEST_BOSS} align="center" style={{ marginTop: SIZES.spacingSm, marginBottom: SIZES.spacingMd }}>
          BOSS WHEEL
        </PixelText>
        <PixelText size={8} variant="body" color={COLORS.TEXT_SECONDARY} align="center" style={{ marginBottom: SIZES.spacingMd }}>
          Entering {region}. Spin to receive your mandatory boss challenge — there is no backing out.
        </PixelText>

        <BossWheel segments={segments} onSpinEnd={onSpinEnd} />

        {winner ? (
          <View
            style={{
              marginTop: SIZES.spacingXl,
              width: '100%',
              backgroundColor: COLORS.BG_CARD,
              borderWidth: SIZES.borderWidth,
              borderColor: COLORS.QUEST_BOSS,
              borderTopWidth: SIZES.cardAccentWidth + 2,
              padding: SIZES.spacingMd,
            }}
          >
            <PixelText size={9} color={COLORS.QUEST_BOSS} style={{ marginBottom: 6 }}>
              # YOUR BOSS
            </PixelText>
            <PixelText size={12} color={COLORS.TEXT_PRIMARY} lineHeight={20}>
              {winner.title}
            </PixelText>
            <PixelText size={11} variant="body" color={COLORS.TEXT_SECONDARY} style={{ marginVertical: SIZES.spacingSm }}>
              {winner.description}
            </PixelText>
            <PixelText size={14} color={COLORS.GOLD}>
              {`3× ${formatNumber(winner.xp_with_multiplier ?? winner.xp * 3)} XP`}
            </PixelText>
            <PixelButton
              label="ACCEPT BOSS CHALLENGE"
              color={COLORS.QUEST_BOSS}
              size="lg"
              fullWidth
              onPress={() => navigation.replace('ChaosRandomizer', { region })}
              style={{ marginTop: SIZES.spacingMd }}
            />
          </View>
        ) : null}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
