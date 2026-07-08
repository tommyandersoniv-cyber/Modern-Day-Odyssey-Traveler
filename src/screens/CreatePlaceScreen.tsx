// ============================================================================
// CreatePlaceScreen — build out the world: create a custom region and/or a
// city (with optional zones) that the Map and Create Quest then recognise.
// ============================================================================

import React, { useMemo, useState } from 'react';
import { ScrollView, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { RootStackParamList } from '../types';
import { RouteProp, useRoute } from '@react-navigation/native';
import { COLORS, SIZES } from '../utils/constants';
import { builtInRegions, customRegionMetas } from '../utils/world';
import { useAppNavigation } from '../navigation/hooks';
import { useWorldStore } from '../store/useWorldStore';

import { PixelText } from '../components/ui/PixelText';
import { PixelButton } from '../components/ui/PixelButton';
import { ScreenHeader } from '../components/ui/ScreenHeader';

const ACCENTS = [COLORS.GOLD, COLORS.BLUE, COLORS.PURPLE, COLORS.GREEN, COLORS.TEAL, COLORS.ORANGE, COLORS.RED];

const inputStyle = {
  backgroundColor: COLORS.BG_SURFACE,
  borderWidth: SIZES.borderWidth,
  borderColor: COLORS.BG_BORDER,
  color: COLORS.TEXT_PRIMARY,
  paddingHorizontal: SIZES.spacingMd,
  paddingVertical: SIZES.spacingSm,
  fontSize: 14,
} as const;

const Label: React.FC<{ text: string; required?: boolean }> = ({ text, required }) => (
  <PixelText size={8} color={COLORS.GREEN} style={{ marginTop: SIZES.spacingMd, marginBottom: 6 }}>
    {text}
    {required ? ' *' : ''}
  </PixelText>
);

export default function CreatePlaceScreen() {
  const navigation = useAppNavigation();
  const route = useRoute<RouteProp<RootStackParamList, 'CreatePlace'>>();
  const presetRegion = route.params?.region;

  // Region selection: pick an existing region OR create a new one.
  const existingRegions = useMemo(
    () => [...builtInRegions(), ...customRegionMetas()].map((r) => ({ key: r.region, name: r.name, accent: r.accent })),
    [],
  );
  const [mode, setMode] = useState<'existing' | 'new'>(presetRegion ? 'existing' : 'existing');
  const [regionKey, setRegionKey] = useState<string>(presetRegion ?? existingRegions[0]?.key ?? '');
  const [newRegionName, setNewRegionName] = useState('');
  const [accent, setAccent] = useState<string>(COLORS.TEAL);

  const [cityName, setCityName] = useState('');
  const [zonesText, setZonesText] = useState('');

  const zones = zonesText
    .split(',')
    .map((z) => z.trim())
    .filter(Boolean);

  const canSave =
    (mode === 'existing' ? !!regionKey : newRegionName.trim().length > 0) && cityName.trim().length > 0;

  const save = () => {
    if (!canSave) return;
    let targetRegionKey = regionKey;
    if (mode === 'new') {
      const r = useWorldStore.getState().addRegion(newRegionName.trim(), accent);
      targetRegionKey = r.name;
    }
    useWorldStore.getState().addCity(cityName.trim(), targetRegionKey, zones);
    navigation.goBack();
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.BG_DARK }}>
      <ScreenHeader title="ADD A PLACE" onBack={() => navigation.goBack()} accent={COLORS.GREEN} />
      <ScrollView contentContainerStyle={{ padding: SIZES.spacingLg, paddingBottom: 60 }} keyboardShouldPersistTaps="handled">
        <PixelText size={9} variant="body" color={COLORS.TEXT_SECONDARY} lineHeight={16}>
          Create a city anywhere — inside an existing region, or in a brand-new region of your own. Then add quests to it from Create Quest.
        </PixelText>

        {/* Region mode toggle */}
        <Label text="REGION" required />
        <View style={{ flexDirection: 'row', marginBottom: SIZES.spacingSm }}>
          <PixelButton
            label="EXISTING"
            size="sm"
            color={mode === 'existing' ? COLORS.GREEN : COLORS.BG_BORDER}
            textColor={mode === 'existing' ? COLORS.BG_DARK : COLORS.TEXT_SECONDARY}
            onPress={() => setMode('existing')}
            style={{ marginRight: 6 }}
          />
          <PixelButton
            label="NEW REGION"
            size="sm"
            color={mode === 'new' ? COLORS.GREEN : COLORS.BG_BORDER}
            textColor={mode === 'new' ? COLORS.BG_DARK : COLORS.TEXT_SECONDARY}
            onPress={() => setMode('new')}
          />
        </View>

        {mode === 'existing' ? (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
            {existingRegions.map((r) => (
              <PixelButton
                key={r.key}
                label={r.name}
                size="sm"
                color={r.key === regionKey ? r.accent : COLORS.BG_BORDER}
                textColor={r.key === regionKey ? COLORS.BG_DARK : COLORS.TEXT_SECONDARY}
                onPress={() => setRegionKey(r.key)}
                style={{ marginRight: 6, marginBottom: 6 }}
              />
            ))}
          </View>
        ) : (
          <View>
            <TextInput
              value={newRegionName}
              onChangeText={setNewRegionName}
              placeholder="New region name (e.g. Vietnam, Patagonia)"
              placeholderTextColor={COLORS.TEXT_DISABLED}
              style={inputStyle}
            />
            <PixelText size={7} color={COLORS.TEXT_SECONDARY} style={{ marginTop: SIZES.spacingSm, marginBottom: 6 }}>
              REGION COLOR
            </PixelText>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
              {ACCENTS.map((a) => (
                <View
                  key={a}
                  style={{
                    width: 30,
                    height: 30,
                    backgroundColor: a,
                    marginRight: 8,
                    marginBottom: 8,
                    borderWidth: accent === a ? 3 : SIZES.borderWidth,
                    borderColor: accent === a ? COLORS.TEXT_PRIMARY : COLORS.BG_DARK,
                  }}
                  onTouchEnd={() => setAccent(a)}
                />
              ))}
            </View>
          </View>
        )}

        {/* City */}
        <Label text="CITY / PLACE NAME" required />
        <TextInput
          value={cityName}
          onChangeText={setCityName}
          placeholder="e.g. Hoi An"
          placeholderTextColor={COLORS.TEXT_DISABLED}
          style={inputStyle}
        />

        <Label text="ZONES (comma-separated, optional)" />
        <TextInput
          value={zonesText}
          onChangeText={setZonesText}
          placeholder="Old Town, Riverside, Beaches"
          placeholderTextColor={COLORS.TEXT_DISABLED}
          style={inputStyle}
        />
        <PixelText size={7} variant="body" color={COLORS.TEXT_DISABLED} style={{ marginTop: 6 }}>
          {zones.length > 0
            ? `${zones.length} zone${zones.length > 1 ? 's' : ''} - this place gets an explorable zone map.`
            : 'No zones - this place shows as a simple quest list.'}
        </PixelText>

        <PixelButton
          label="CREATE PLACE"
          color={COLORS.GREEN}
          size="lg"
          fullWidth
          disabled={!canSave}
          onPress={save}
          style={{ marginTop: SIZES.spacingXl }}
        />
      </ScrollView>
    </SafeAreaView>
  );
}
