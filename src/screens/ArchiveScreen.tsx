// ============================================================================
// ArchiveScreen — the permanent record, grouped Region - City - entries.
// ============================================================================

import React, { useMemo } from 'react';
import { Image, Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { ArchiveEntry, Character } from '../types';
import { COLORS, SIZES } from '../utils/constants';
import { formatDate, formatNumber } from '../utils/helpers';
import { useAppNavigation } from '../navigation/hooks';
import { useArchiveStore } from '../store/useArchiveStore';
import { useCodexStore } from '../store/useCodexStore';

import { PixelText } from '../components/ui/PixelText';
import { ScreenHeader } from '../components/ui/ScreenHeader';
import { QuestBadge } from '../components/quests/QuestBadge';
import { PixelAvatar } from '../components/codex/PixelAvatar';

type Grouped = Record<string, Record<string, ArchiveEntry[]>>;

export default function ArchiveScreen() {
  const navigation = useAppNavigation();
  const entries = useArchiveStore((s) => s.entries);
  const characters = useCodexStore((s) => s.characters);

  const grouped = useMemo<Grouped>(() => {
    const g: Grouped = {};
    entries.forEach((e) => {
      const region = e.region || 'Cross-Region';
      const city = e.city || 'Wandering';
      g[region] = g[region] || {};
      g[region][city] = g[region][city] || [];
      g[region][city].push(e);
    });
    return g;
  }, [entries]);

  const charsByCity = useMemo(() => {
    const m: Record<string, Character[]> = {};
    characters.forEach((c) => {
      const key = c.city || c.region || 'Elsewhere';
      m[key] = m[key] || [];
      m[key].push(c);
    });
    return m;
  }, [characters]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.BG_DARK }} edges={['top']}>
      <ScreenHeader title="ARCHIVE" accent={COLORS.PURPLE} subtitle={`${entries.length} entries`} onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={{ padding: SIZES.spacingMd, paddingBottom: 40 }}>
        {entries.length === 0 ? (
          <View style={{ paddingVertical: SIZES.spacingXl, alignItems: 'center' }}>
            <PixelText size={32} color={COLORS.PURPLE}>#</PixelText>
            <PixelText size={10} color={COLORS.TEXT_SECONDARY} align="center" style={{ marginTop: SIZES.spacingMd }}>
              Your archive is empty
            </PixelText>
            <PixelText size={8} variant="body" color={COLORS.TEXT_DISABLED} align="center" style={{ marginTop: 6 }}>
              Complete a quest with photos, video, or a journal entry to begin your permanent record.
            </PixelText>
          </View>
        ) : null}

        {Object.entries(grouped).map(([region, cities]) => (
          <View key={region} style={{ marginBottom: SIZES.spacingLg }}>
            <PixelText size={11} color={COLORS.GOLD} style={{ marginBottom: SIZES.spacingSm }}>
              {region.toUpperCase()}
            </PixelText>
            {Object.entries(cities).map(([city, list]) => (
              <View key={city} style={{ marginBottom: SIZES.spacingMd }}>
                <PixelText size={8} color={COLORS.TEXT_SECONDARY} style={{ marginBottom: 6 }}>
                  {city.toUpperCase()}
                </PixelText>
                {list.map((e) => (
                  <ArchiveCard key={e.id} entry={e} onPress={() => navigation.navigate('ArchiveEntry', { entryId: e.id })} />
                ))}
                {charsByCity[city]?.length ? (
                  <View style={{ marginTop: SIZES.spacingSm }}>
                    <PixelText size={7} color={COLORS.TEAL} style={{ marginBottom: 4 }}>
                      CHARACTERS MET
                    </PixelText>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                      {charsByCity[city].map((c) => (
                        <Pressable key={c.id} onPress={() => navigation.navigate('CharacterDetail', { characterId: c.id })} style={{ marginRight: 8, marginBottom: 8, alignItems: 'center' }}>
                          <PixelAvatar uri={c.pixel_avatar_uri} appearance={c.appearance} size={24} />
                          <PixelText size={6} color={COLORS.TEXT_SECONDARY} style={{ marginTop: 2 }}>{c.name}</PixelText>
                        </Pressable>
                      ))}
                    </View>
                  </View>
                ) : null}
              </View>
            ))}
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const ArchiveCard: React.FC<{ entry: ArchiveEntry; onPress: () => void }> = ({ entry, onPress }) => {
  const cover = entry.cover_photo_uri || entry.photo_uris[0];
  return (
    <Pressable
      onPress={onPress}
      style={{
        flexDirection: 'row',
        backgroundColor: COLORS.BG_CARD,
        borderWidth: SIZES.borderWidth,
        borderColor: COLORS.BG_BORDER,
        marginBottom: SIZES.spacingSm,
      }}
    >
      {cover ? (
        <Image source={{ uri: cover }} style={{ width: 64, height: 64 }} resizeMode="cover" />
      ) : (
        <View style={{ width: 64, height: 64, backgroundColor: COLORS.BG_SURFACE, alignItems: 'center', justifyContent: 'center' }}>
          <PixelText size={18} color={COLORS.TEXT_DISABLED}>#</PixelText>
        </View>
      )}
      <View style={{ flex: 1, padding: SIZES.spacingSm, justifyContent: 'center' }}>
        <PixelText size={9} color={COLORS.TEXT_PRIMARY} numberOfLines={2} lineHeight={15}>
          {entry.quest_title}
        </PixelText>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
          <QuestBadge type={entry.quest_type} />
          <PixelText size={7} color={COLORS.TEXT_SECONDARY} style={{ marginLeft: 8 }}>
            {formatDate(entry.completed_at)}
          </PixelText>
          <PixelText size={8} color={COLORS.GOLD} style={{ marginLeft: 'auto' }}>
            {`+${formatNumber(entry.xp_earned)}`}
          </PixelText>
        </View>
      </View>
    </Pressable>
  );
};
