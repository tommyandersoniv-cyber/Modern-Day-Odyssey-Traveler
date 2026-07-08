// ============================================================================
// CharacterDetailScreen — a single character card, full view.
// ============================================================================

import React, { useState } from 'react';
import { Alert, Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { RootStackParamList } from '../types';
import { RouteProp, useRoute } from '@react-navigation/native';
import { COLORS, SIZES } from '../utils/constants';
import { formatDate, formatNumber } from '../utils/helpers';
import { useAppNavigation } from '../navigation/hooks';
import { useCodexStore } from '../store/useCodexStore';

import { PixelText } from '../components/ui/PixelText';
import { PixelButton } from '../components/ui/PixelButton';
import { ScreenHeader } from '../components/ui/ScreenHeader';
import { QuestBadge } from '../components/quests/QuestBadge';
import { PixelAvatar } from '../components/codex/PixelAvatar';

const Tag: React.FC<{ label: string }> = ({ label }) => (
  <QuestBadge label={label} color={COLORS.TEAL} style={{ marginRight: 6, marginBottom: 6 }} />
);

export default function CharacterDetailScreen() {
  const navigation = useAppNavigation();
  const route = useRoute<RouteProp<RootStackParamList, 'CharacterDetail'>>();
  const character = useCodexStore((s) => s.getById(route.params.characterId));

  if (!character) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.BG_DARK }}>
        <ScreenHeader title="CHARACTER" onBack={() => navigation.goBack()} accent={COLORS.TEAL} />
        <View style={{ padding: SIZES.spacingLg }}>
          <PixelText size={10} color={COLORS.TEXT_SECONDARY}>Character not found.</PixelText>
        </View>
      </SafeAreaView>
    );
  }

  const confirmDelete = () => {
    Alert.alert('Remove Character', `Remove ${character.name} from your codex?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => {
          useCodexStore.getState().removeCharacter(character.id);
          navigation.goBack();
        },
      },
    ]);
  };

  const where = character.custom_location || [character.city, character.zone].filter(Boolean).join(' · ');

  // The avatar can flip between the available representations (pixel sprite and
  // uploaded photo). Tapping cycles through whichever ones this character has.
  const faces: Array<'sprite' | 'photo'> = [
    ...(character.appearance ? (['sprite'] as const) : []),
    ...(character.pixel_avatar_uri ? (['photo'] as const) : []),
  ];
  const [faceIdx, setFaceIdx] = useState(0);
  const face = faces[faceIdx % faces.length] ?? null;
  const canFlip = faces.length > 1;
  const flip = () => canFlip && setFaceIdx((i) => (i + 1) % faces.length);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.BG_DARK }}>
      <ScreenHeader title="CHARACTER" onBack={() => navigation.goBack()} accent={COLORS.TEAL} />
      <ScrollView contentContainerStyle={{ padding: SIZES.spacingLg, paddingBottom: 40 }}>
        <View style={{ alignItems: 'center', marginBottom: SIZES.spacingLg }}>
          <Pressable onPress={flip} disabled={!canFlip}>
            <PixelAvatar
              uri={face === 'photo' ? character.pixel_avatar_uri : undefined}
              appearance={face === 'sprite' ? character.appearance : undefined}
              size={90}
            />
          </Pressable>
          {canFlip ? (
            <PixelText size={6} color={COLORS.TEXT_DISABLED} align="center" style={{ marginTop: 6 }}>
              {`TAP TO FLIP · ${face === 'sprite' ? 'SPRITE' : 'PHOTO'}`}
            </PixelText>
          ) : null}
          <PixelText size={16} color={COLORS.TEXT_PRIMARY} align="center" style={{ marginTop: SIZES.spacingMd }}>
            {character.name}
          </PixelText>
          {character.nickname ? (
            <PixelText size={9} color={COLORS.TEAL} align="center" style={{ marginTop: 4 }}>
              {`"${character.nickname}"`}
            </PixelText>
          ) : null}
          <PixelText size={11} color={COLORS.GOLD} style={{ marginTop: SIZES.spacingSm }}>
            {`+${formatNumber(character.xp_awarded)} XP`}
          </PixelText>
        </View>

        <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: SIZES.spacingMd }}>
          <Tag label={character.region} />
          {where ? <Tag label={where} /> : null}
          <Tag label={formatDate(character.date_met)} />
        </View>

        <Section title="ONE THING I LEARNED" body={character.one_thing_learned} />
        {character.note ? <Section title="NOTES" body={character.note} /> : null}

        <PixelButton
          label="REMOVE FROM CODEX"
          variant="outline"
          color={COLORS.RED}
          size="md"
          fullWidth
          onPress={confirmDelete}
          style={{ marginTop: SIZES.spacingLg }}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const Section: React.FC<{ title: string; body: string }> = ({ title, body }) => (
  <View
    style={{
      backgroundColor: COLORS.BG_SURFACE,
      borderWidth: SIZES.borderWidth,
      borderColor: COLORS.BG_BORDER,
      padding: SIZES.spacingMd,
      marginBottom: SIZES.spacingMd,
    }}
  >
    <PixelText size={8} color={COLORS.TEAL} style={{ marginBottom: SIZES.spacingSm }}>
      {title}
    </PixelText>
    <PixelText size={12} variant="body" color={COLORS.TEXT_PRIMARY} lineHeight={20}>
      {body}
    </PixelText>
  </View>
);
