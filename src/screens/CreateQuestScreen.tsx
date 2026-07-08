// ============================================================================
// CreateQuestScreen — user-created quest builder with a LIVE XP calculation.
//
// XP model (see USER_QUEST_XP in constants):
//   xp = (base
//         + perPhoto * min(photos, maxPhotos)
//         + perVideo * min(videos, maxVideos)
//         + (journal ? journalFlat : 0)
//         + floor(min(words, wordCap) / 10) * per10Words)
//        * categoryMultiplier
//   …clamped to hardCap.
//
// The builder previews the *planned* reward: the traveller declares how much
// media + writing the quest will involve, the screen scores it live, and the
// quest is stored via useQuestStore.addUserQuest with that xp baked in.
// ============================================================================

import React, { useMemo, useState } from 'react';
import { ScrollView, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { Quest, RootStackParamList } from '../types';
import { RouteProp, useRoute } from '@react-navigation/native';
import { CATEGORY_BUCKETS, COLORS, SIZES, USER_QUEST_XP } from '../utils/constants';
import { builtInRegions, customRegionMetas, getRegionCities, worldCityMeta } from '../utils/world';
import { useAppNavigation } from '../navigation/hooks';
import { useGameStore } from '../store/useGameStore';
import { useQuestStore } from '../store/useQuestStore';
import { useWorldStore } from '../store/useWorldStore';
import { genId, wordCount, clamp, formatNumber } from '../utils/helpers';

import { PixelText } from '../components/ui/PixelText';
import { PixelButton } from '../components/ui/PixelButton';
import { QuestBadge } from '../components/quests/QuestBadge';
import { XPBar } from '../components/quests/XPBar';

const CATEGORY_OPTIONS = [...CATEGORY_BUCKETS];

/** Reusable bordered text field with a pixel label. */
function Field({
  label,
  value,
  onChangeText,
  placeholder,
  multiline,
  required,
}: {
  label: string;
  value: string;
  onChangeText: (t: string) => void;
  placeholder?: string;
  multiline?: boolean;
  required?: boolean;
}) {
  return (
    <View style={{ gap: SIZES.spacingXs }}>
      <PixelText size={SIZES.fontXs} color={COLORS.TEXT_SECONDARY}>
        {label.toUpperCase()}
        {required ? ' *' : ''}
      </PixelText>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={COLORS.TEXT_DISABLED}
        multiline={multiline}
        style={{
          backgroundColor: COLORS.BG_SURFACE,
          borderWidth: SIZES.borderWidth,
          borderColor: COLORS.BG_BORDER,
          borderRadius: SIZES.borderRadius,
          color: COLORS.TEXT_PRIMARY,
          fontSize: SIZES.fontMd,
          padding: SIZES.spacingSm,
          minHeight: multiline ? 88 : undefined,
          textAlignVertical: multiline ? 'top' : 'center',
        }}
      />
    </View>
  );
}

/** A small stepper (− value +) used to declare planned photo / video counts. */
function Counter({
  label,
  value,
  max,
  onChange,
}: {
  label: string;
  value: number;
  max: number;
  onChange: (n: number) => void;
}) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
      <PixelText size={SIZES.fontXs} color={COLORS.TEXT_SECONDARY}>
        {label.toUpperCase()} (MAX {max})
      </PixelText>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: SIZES.spacingSm }}>
        <PixelButton
          label="-"
          size="sm"
          variant="outline"
          color={COLORS.TEXT_SECONDARY}
          disabled={value <= 0}
          onPress={() => onChange(clamp(value - 1, 0, max))}
        />
        <PixelText size={SIZES.fontMd} color={COLORS.TEXT_PRIMARY}>
          {value}
        </PixelText>
        <PixelButton
          label="+"
          size="sm"
          variant="outline"
          color={COLORS.GREEN}
          disabled={value >= max}
          onPress={() => onChange(clamp(value + 1, 0, max))}
        />
      </View>
    </View>
  );
}

export default function CreateQuestScreen() {
  const navigation = useAppNavigation();
  const route = useRoute<RouteProp<RootStackParamList, 'CreateQuest'>>();
  const currentRegion = useGameStore((s) => s.current_region);
  const currentCity = useGameStore((s) => s.current_city);
  const currentZone = useGameStore((s) => s.current_zone);
  // Subscribe so newly-created places appear in the pickers immediately.
  const customCities = useWorldStore((s) => s.customCities);
  const customRegions = useWorldStore((s) => s.customRegions);

  const allRegions = useMemo(() => [...builtInRegions(), ...customRegionMetas()], [customRegions]);
  const [regionSel, setRegionSel] = useState<string>(route.params?.region ?? currentRegion ?? allRegions[0]?.region ?? '');
  const [citySel, setCitySel] = useState<string>(route.params?.city ?? currentCity ?? '');
  const [zoneSel, setZoneSel] = useState<string>(route.params?.zone ?? currentZone ?? '');

  const regionCities = useMemo(() => getRegionCities(regionSel), [regionSel, customCities]);
  const cityZones = useMemo(() => worldCityMeta(citySel)?.zones ?? [], [citySel, customCities]);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<string>('Adventure');
  const [photos, setPhotos] = useState(0);
  const [videos, setVideos] = useState(0);
  const [planJournal, setPlanJournal] = useState(true);
  const [journalDraft, setJournalDraft] = useState('');
  const [xpManual, setXpManual] = useState(''); // blank - auto-calculate

  // ---- Live XP calculation --------------------------------------------------
  const xpBreakdown = useMemo(() => {
    const C = USER_QUEST_XP;
    const photoCount = clamp(photos, 0, C.maxPhotos);
    const videoCount = clamp(videos, 0, C.maxVideos);
    const words = Math.min(wordCount(journalDraft), C.wordCap);
    // The flat journal bonus applies when the traveller commits to journaling
    // this quest (the toggle), matching the "planned proof" model of the builder.
    const hasJournal = planJournal;

    const photoXP = photoCount * C.perPhoto;
    const videoXP = videoCount * C.perVideo;
    const journalXP = hasJournal ? C.journalFlat : 0;
    const wordXP = Math.floor(words / 10) * C.per10Words;
    const subtotal = C.base + photoXP + videoXP + journalXP + wordXP;

    const multiplier = C.categoryMultiplier[category] ?? C.defaultMultiplier;
    const total = clamp(Math.round(subtotal * multiplier), 0, C.hardCap);

    return { base: C.base, photoXP, videoXP, journalXP, wordXP, subtotal, multiplier, total };
  }, [photos, videos, planJournal, journalDraft, category]);

  // Manual override: a blank field uses the auto-calculated amount.
  const manualParsed = xpManual.trim() === '' ? null : clamp(parseInt(xpManual, 10) || 0, 0, USER_QUEST_XP.hardCap);
  const effectiveXP = manualParsed ?? xpBreakdown.total;

  const canSave = title.trim().length > 0 && description.trim().length > 0;

  const handleSave = () => {
    if (!canSave) return;
    const quest: Quest = {
      id: genId('uq'),
      type: 'user_created',
      title: title.trim(),
      description: description.trim(),
      category,
      xp: effectiveXP,
      rarity: 'common',
      is_boss_wheel: false,
      url: null,
      requires_media: photos > 0 || videos > 0,
      map_marker_type: 'side',
      completed: false,
      status: 'available',
      created_by_user: true,
      region: regionSel || undefined,
      city: citySel || undefined,
      zone: zoneSel || undefined,
    };
    useQuestStore.getState().addUserQuest(quest);
    navigation.goBack();
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.BG_DARK }} edges={['top', 'left', 'right']}>
      {/* Header */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: SIZES.spacingMd,
          paddingVertical: SIZES.spacingMd,
        }}
      >
        <PixelButton label="BACK" size="sm" variant="outline" onPress={() => navigation.goBack()} />
        <PixelText size={SIZES.fontLg} color={COLORS.QUEST_USER}>
          CREATE QUEST
        </PixelText>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          padding: SIZES.spacingMd,
          paddingBottom: SIZES.spacingXl * 2,
          gap: SIZES.spacingMd,
        }}
        keyboardShouldPersistTaps="handled"
      >
        <Field label="Title" value={title} onChangeText={setTitle} placeholder="Name your quest" required />
        <Field
          label="Description"
          value={description}
          onChangeText={setDescription}
          placeholder="What must be done?"
          multiline
          required
        />

        {/* Category picker */}
        <View style={{ gap: SIZES.spacingXs }}>
          <PixelText size={SIZES.fontXs} color={COLORS.TEXT_SECONDARY}>
            CATEGORY
          </PixelText>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: SIZES.spacingSm, paddingVertical: SIZES.spacingXs }}
          >
            {CATEGORY_OPTIONS.map((c) => {
              const selected = c === category;
              const mult = USER_QUEST_XP.categoryMultiplier[c] ?? USER_QUEST_XP.defaultMultiplier;
              return (
                <PixelButton
                  key={c}
                  label={mult !== 1 ? `${c.toUpperCase()} ${mult}x` : c.toUpperCase()}
                  size="sm"
                  variant={selected ? 'solid' : 'outline'}
                  color={selected ? COLORS.GOLD : COLORS.TEXT_SECONDARY}
                  onPress={() => setCategory(c)}
                />
              );
            })}
          </ScrollView>
        </View>

        {/* Location pickers */}
        <View style={{ gap: SIZES.spacingXs }}>
          <PixelText size={SIZES.fontXs} color={COLORS.TEXT_SECONDARY}>REGION</PixelText>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: SIZES.spacingSm, paddingVertical: SIZES.spacingXs }}>
            {allRegions.map((r) => (
              <PixelButton
                key={r.region}
                label={r.name}
                size="sm"
                variant={r.region === regionSel ? 'solid' : 'outline'}
                color={r.region === regionSel ? r.accent : COLORS.TEXT_SECONDARY}
                onPress={() => {
                  setRegionSel(r.region);
                  setCitySel('');
                  setZoneSel('');
                }}
              />
            ))}
          </ScrollView>
        </View>
        {regionCities.length > 0 ? (
          <View style={{ gap: SIZES.spacingXs }}>
            <PixelText size={SIZES.fontXs} color={COLORS.TEXT_SECONDARY}>CITY</PixelText>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: SIZES.spacingSm, paddingVertical: SIZES.spacingXs }}>
              {regionCities.map((c) => (
                <PixelButton
                  key={c.name}
                  label={c.name}
                  size="sm"
                  variant={c.name === citySel ? 'solid' : 'outline'}
                  color={c.name === citySel ? COLORS.BLUE : COLORS.TEXT_SECONDARY}
                  onPress={() => {
                    setCitySel(c.name);
                    setZoneSel('');
                  }}
                />
              ))}
            </ScrollView>
          </View>
        ) : null}
        {cityZones.length > 0 ? (
          <View style={{ gap: SIZES.spacingXs }}>
            <PixelText size={SIZES.fontXs} color={COLORS.TEXT_SECONDARY}>ZONE</PixelText>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: SIZES.spacingSm, paddingVertical: SIZES.spacingXs }}>
              {cityZones.map((z) => (
                <PixelButton
                  key={z}
                  label={z}
                  size="sm"
                  variant={z === zoneSel ? 'solid' : 'outline'}
                  color={z === zoneSel ? COLORS.PURPLE : COLORS.TEXT_SECONDARY}
                  onPress={() => setZoneSel(z)}
                />
              ))}
            </ScrollView>
          </View>
        ) : null}

        {/* Planned reward inputs */}
        <View
          style={{
            backgroundColor: COLORS.BG_CARD,
            borderWidth: SIZES.borderWidth,
            borderColor: COLORS.BG_BORDER,
            padding: SIZES.spacingMd,
            gap: SIZES.spacingMd,
          }}
        >
          <PixelText size={SIZES.fontSm} color={COLORS.TEXT_PRIMARY}>
            PLANNED PROOF
          </PixelText>
          <Counter label="Photos" value={photos} max={USER_QUEST_XP.maxPhotos} onChange={setPhotos} />
          <Counter label="Videos" value={videos} max={USER_QUEST_XP.maxVideos} onChange={setVideos} />
          <View
            style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
          >
            <PixelText size={SIZES.fontXs} color={COLORS.TEXT_SECONDARY}>
              JOURNAL ENTRY
            </PixelText>
            <PixelButton
              label={planJournal ? 'YES' : 'NO'}
              size="sm"
              variant={planJournal ? 'solid' : 'outline'}
              color={planJournal ? COLORS.GREEN : COLORS.TEXT_SECONDARY}
              onPress={() => setPlanJournal((v) => !v)}
            />
          </View>
          {planJournal ? (
            <Field
              label={`Journal draft (${wordCount(journalDraft)} words)`}
              value={journalDraft}
              onChangeText={setJournalDraft}
              placeholder="Optional — words add bonus XP (10 XP / 10 words, cap 500)"
              multiline
            />
          ) : null}
        </View>

        {/* Live XP readout */}
        <View
          style={{
            backgroundColor: COLORS.BG_SURFACE,
            borderWidth: SIZES.borderWidth,
            borderColor: COLORS.GOLD,
            padding: SIZES.spacingMd,
            gap: SIZES.spacingSm,
          }}
        >
          <View
            style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
          >
            <PixelText size={SIZES.fontSm} color={COLORS.TEXT_PRIMARY}>
              REWARD
            </PixelText>
            <PixelText size={SIZES.fontLg} color={COLORS.GOLD}>
              {formatNumber(effectiveXP)} XP
            </PixelText>
          </View>

          <XPBar
            progress={effectiveXP / USER_QUEST_XP.hardCap}
            color={COLORS.GOLD}
            label={manualParsed != null ? 'Manual XP' : `Auto · ${formatNumber(USER_QUEST_XP.hardCap)} XP max`}
          />

          {/* Manual XP override */}
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: SIZES.spacingXs }}>
            <PixelText size={SIZES.fontXs} color={COLORS.TEXT_SECONDARY} style={{ flex: 1 }}>
              SET XP (blank = auto)
            </PixelText>
            <TextInput
              value={xpManual}
              onChangeText={(t) => setXpManual(t.replace(/[^0-9]/g, ''))}
              placeholder={String(xpBreakdown.total)}
              placeholderTextColor={COLORS.TEXT_DISABLED}
              keyboardType="number-pad"
              style={{
                width: 90,
                backgroundColor: COLORS.BG_DARK,
                borderWidth: SIZES.borderWidth,
                borderColor: COLORS.GOLD,
                color: COLORS.GOLD,
                paddingHorizontal: SIZES.spacingSm,
                paddingVertical: 4,
                fontSize: 14,
                textAlign: 'center',
              }}
            />
          </View>

          <View style={{ gap: 2, marginTop: SIZES.spacingXs }}>
            <BreakdownRow label="Base" value={xpBreakdown.base} />
            <BreakdownRow label={`Photos (${clamp(photos, 0, USER_QUEST_XP.maxPhotos)})`} value={xpBreakdown.photoXP} />
            <BreakdownRow label={`Videos (${clamp(videos, 0, USER_QUEST_XP.maxVideos)})`} value={xpBreakdown.videoXP} />
            <BreakdownRow label="Journal" value={xpBreakdown.journalXP} />
            <BreakdownRow label="Words" value={xpBreakdown.wordXP} />
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 2 }}>
              <PixelText size={SIZES.fontXs} color={COLORS.TEXT_SECONDARY}>
                CATEGORY x
              </PixelText>
              <PixelText size={SIZES.fontXs} color={COLORS.GOLD}>
                {xpBreakdown.multiplier}x
              </PixelText>
            </View>
          </View>

          <View style={{ flexDirection: 'row', gap: SIZES.spacingSm, marginTop: SIZES.spacingXs }}>
            <QuestBadge type="user_created" />
            <QuestBadge rarity="common" />
          </View>
        </View>

        <PixelButton
          label="SAVE QUEST"
          color={COLORS.QUEST_USER}
          fullWidth
          disabled={!canSave}
          onPress={handleSave}
        />
        {!canSave ? (
          <PixelText size={SIZES.fontXs} color={COLORS.TEXT_DISABLED} align="center">
            Add a title and description to save.
          </PixelText>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

function BreakdownRow({ label, value }: { label: string; value: number }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
      <PixelText size={SIZES.fontXs} color={COLORS.TEXT_SECONDARY}>
        {label.toUpperCase()}
      </PixelText>
      <PixelText size={SIZES.fontXs} color={value > 0 ? COLORS.TEXT_PRIMARY : COLORS.TEXT_DISABLED}>
        +{value}
      </PixelText>
    </View>
  );
}

export { CreateQuestScreen };
