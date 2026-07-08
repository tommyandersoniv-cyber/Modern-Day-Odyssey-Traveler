// ============================================================================
// AddCharacterScreen — add a person you met. Everything visual is optional: an
// uploaded photo (stored as-is, no pixelization), a built pixel sprite, both,
// or neither. Only a name + one-thing-learned are required. Can be opened
// pre-scoped to a region/city (e.g. from a city row on the map).
// ============================================================================

import React, { useState } from 'react';
import { Image, ScrollView, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RouteProp, useRoute } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import {
  CHARACTER_BASE_XP,
  CHARACTER_NOTE_BONUS_WORDS,
  CHARACTER_NOTE_BONUS_XP,
  COLORS,
  SIZES,
} from '../utils/constants';
import type { CharacterAppearance, RootStackParamList } from '../types';
import { wordCount } from '../utils/helpers';
import { builtInRegions } from '../utils/world';
import { defaultAppearance } from '../utils/appearance';
import { useAppNavigation } from '../navigation/hooks';
import { useCodexStore } from '../store/useCodexStore';
import { useGameStore } from '../store/useGameStore';

import { PixelText } from '../components/ui/PixelText';
import { PixelButton } from '../components/ui/PixelButton';
import { ScreenHeader } from '../components/ui/ScreenHeader';
import { AvatarCustomizer } from '../components/codex/AvatarCustomizer';

const FieldLabel: React.FC<{ label: string; required?: boolean }> = ({ label, required }) => (
  <PixelText size={8} color={COLORS.TEAL} style={{ marginBottom: 6, marginTop: SIZES.spacingMd }}>
    {label}
    {required ? ' *' : ''}
  </PixelText>
);

const inputStyle = {
  backgroundColor: COLORS.BG_SURFACE,
  borderWidth: SIZES.borderWidth,
  borderColor: COLORS.BG_BORDER,
  color: COLORS.TEXT_PRIMARY,
  paddingHorizontal: SIZES.spacingMd,
  paddingVertical: SIZES.spacingSm,
  fontSize: 14,
} as const;

export default function AddCharacterScreen() {
  const navigation = useAppNavigation();
  const route = useRoute<RouteProp<RootStackParamList, 'AddCharacter'>>();
  const currentRegion = useGameStore((s) => s.current_region);

  const [useSprite, setUseSprite] = useState(false);
  const [appearance, setAppearance] = useState<CharacterAppearance>(defaultAppearance('F'));

  const [photo, setPhoto] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [permMsg, setPermMsg] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [nickname, setNickname] = useState('');
  const [city, setCity] = useState(route.params?.city ?? '');
  const [location, setLocation] = useState(route.params?.zone ?? '');
  const [learned, setLearned] = useState('');
  const [note, setNote] = useState('');
  const [region, setRegion] = useState(
    route.params?.region ?? currentRegion ?? builtInRegions().find((r) => r.active)?.region ?? 'Northern Thailand',
  );

  const xpPreview = CHARACTER_BASE_XP + (wordCount(note) > CHARACTER_NOTE_BONUS_WORDS ? CHARACTER_NOTE_BONUS_XP : 0);

  const pickFromLibrary = async () => {
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        setPermMsg('Library access denied. Enable photo access in Settings to upload.');
        return;
      }
      const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.9 });
      if (!res.canceled && res.assets[0]) {
        setPhoto(res.assets[0].uri);
        setPermMsg(null);
      }
    } catch {
      setPermMsg('Could not open the photo library.');
    }
  };

  const takePhoto = async () => {
    try {
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (!perm.granted) {
        setPermMsg('Camera access denied. Enable camera access in Settings to take a photo.');
        return;
      }
      const res = await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.9 });
      if (!res.canceled && res.assets[0]) {
        setPhoto(res.assets[0].uri);
        setPermMsg(null);
      }
    } catch {
      setPermMsg('Could not open the camera.');
    }
  };

  // Photo + sprite are both optional — only the text fields gate saving.
  const canSave = !!name.trim() && !!learned.trim() && !saving;

  const save = async () => {
    if (!canSave) return;
    setSaving(true);
    try {
      await useCodexStore.getState().addCharacter({
        name: name.trim(),
        nickname: nickname.trim() || undefined,
        region,
        city: city.trim() || undefined,
        custom_location: location.trim() || undefined,
        photo_uri: photo ?? undefined,
        appearance: useSprite ? appearance : undefined,
        one_thing_learned: learned.trim(),
        note: note.trim() || undefined,
      });
      navigation.goBack();
    } catch {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.BG_DARK }}>
      <ScreenHeader title="ADD CHARACTER" onBack={() => navigation.goBack()} accent={COLORS.TEAL} />
      <ScrollView contentContainerStyle={{ padding: SIZES.spacingLg, paddingBottom: 60 }} keyboardShouldPersistTaps="handled">
        {/* Photo — optional, stored as-is. */}
        <FieldLabel label="PHOTO (OPTIONAL)" />
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <PixelButton label="TAKE PHOTO" color={COLORS.TEAL} size="md" onPress={takePhoto} style={{ flex: 1, marginRight: 6 }} />
          <PixelButton label="UPLOAD" color={COLORS.BLUE} size="md" onPress={pickFromLibrary} style={{ flex: 1, marginLeft: 6 }} />
        </View>
        {permMsg ? (
          <PixelText size={8} variant="body" color={COLORS.RED} style={{ marginTop: SIZES.spacingSm }}>
            {permMsg}
          </PixelText>
        ) : null}
        {photo ? (
          <View style={{ alignItems: 'center', marginTop: SIZES.spacingMd }}>
            <Image source={{ uri: photo }} style={{ width: 140, height: 140, borderWidth: 2, borderColor: COLORS.BG_BORDER }} resizeMode="cover" />
            <PixelButton
              label="REMOVE PHOTO"
              variant="outline"
              color={COLORS.RED}
              size="sm"
              onPress={() => setPhoto(null)}
              style={{ marginTop: SIZES.spacingSm }}
            />
          </View>
        ) : null}

        {/* Pixel sprite — optional, can coexist with a photo. */}
        <FieldLabel label="PIXEL SPRITE (OPTIONAL)" />
        <PixelButton
          label={useSprite ? 'REMOVE SPRITE' : '+ BUILD A PIXEL SPRITE'}
          size="sm"
          color={useSprite ? COLORS.BG_BORDER : COLORS.PURPLE}
          textColor={useSprite ? COLORS.TEXT_SECONDARY : COLORS.BG_DARK}
          onPress={() => setUseSprite((v) => !v)}
        />
        {useSprite ? (
          <View style={{ marginTop: SIZES.spacingSm }}>
            <AvatarCustomizer value={appearance} onChange={setAppearance} />
          </View>
        ) : null}

        {/* Region picker */}
        <FieldLabel label="REGION" />
        <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
          {builtInRegions().filter((r) => r.active || r.region === region).map((r) => (
            <PixelButton
              key={r.id}
              label={r.name}
              size="sm"
              color={r.region === region ? r.accent : COLORS.BG_BORDER}
              textColor={r.region === region ? COLORS.BG_DARK : COLORS.TEXT_SECONDARY}
              onPress={() => setRegion(r.region)}
              style={{ marginRight: 6, marginBottom: 6 }}
            />
          ))}
        </View>

        <FieldLabel label="NAME" required />
        <TextInput value={name} onChangeText={setName} placeholder="Their name" placeholderTextColor={COLORS.TEXT_DISABLED} style={inputStyle} />

        <FieldLabel label="NICKNAME" />
        <TextInput value={nickname} onChangeText={setNickname} placeholder="Optional" placeholderTextColor={COLORS.TEXT_DISABLED} style={inputStyle} />

        <FieldLabel label="CITY" />
        <TextInput value={city} onChangeText={setCity} placeholder="e.g. Chiang Mai" placeholderTextColor={COLORS.TEXT_DISABLED} style={inputStyle} />

        <FieldLabel label="ZONE / CUSTOM LOCATION" />
        <TextInput value={location} onChangeText={setLocation} placeholder="Where you met" placeholderTextColor={COLORS.TEXT_DISABLED} style={inputStyle} />

        <FieldLabel label="ONE THING I LEARNED" required />
        <TextInput value={learned} onChangeText={setLearned} placeholder="The one thing you'll carry" placeholderTextColor={COLORS.TEXT_DISABLED} style={[inputStyle, { height: 70 }]} multiline />

        <FieldLabel label="EXTENDED NOTE" />
        <TextInput value={note} onChangeText={setNote} placeholder="More about them (50+ words = +100 XP)" placeholderTextColor={COLORS.TEXT_DISABLED} style={[inputStyle, { height: 100 }]} multiline />

        <PixelText size={10} color={COLORS.GOLD} align="center" style={{ marginTop: SIZES.spacingLg }}>
          {`THIS CHARACTER WILL EARN: ${xpPreview} XP`}
        </PixelText>

        <PixelButton
          label={saving ? 'SAVING…' : 'ADD TO CODEX'}
          color={COLORS.GREEN}
          size="lg"
          fullWidth
          disabled={!canSave}
          onPress={save}
          style={{ marginTop: SIZES.spacingMd }}
        />
      </ScrollView>
    </SafeAreaView>
  );
}
