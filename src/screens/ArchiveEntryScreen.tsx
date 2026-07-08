// ============================================================================
// ArchiveEntryScreen — a single archive entry (photos, videos, journal).
// ============================================================================

import React, { useState } from 'react';
import { Dimensions, Image, Modal, Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { RootStackParamList } from '../types';
import { RouteProp, useRoute } from '@react-navigation/native';
import { COLORS, SIZES } from '../utils/constants';
import { formatDate, formatNumber } from '../utils/helpers';
import { useAppNavigation } from '../navigation/hooks';
import { useArchiveStore } from '../store/useArchiveStore';

import { PixelText } from '../components/ui/PixelText';
import { PixelButton } from '../components/ui/PixelButton';
import { ScreenHeader } from '../components/ui/ScreenHeader';
import { QuestBadge } from '../components/quests/QuestBadge';
import { QuestTradingCard } from '../components/quests/QuestTradingCard';
import { PhotoAlbum } from '../components/archive/PhotoAlbum';
import { VideoPlayer } from '../components/archive/VideoPlayer';
import { JournalEntry } from '../components/archive/JournalEntry';

const { width } = Dimensions.get('window');

export default function ArchiveEntryScreen() {
  const navigation = useAppNavigation();
  const route = useRoute<RouteProp<RootStackParamList, 'ArchiveEntry'>>();
  const entry = useArchiveStore((s) => s.getById(route.params.entryId));
  const [viewer, setViewer] = useState<number | null>(null);

  if (!entry) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.BG_DARK }}>
        <ScreenHeader title="ARCHIVE ENTRY" onBack={() => navigation.goBack()} accent={COLORS.PURPLE} />
        <View style={{ padding: SIZES.spacingLg }}>
          <PixelText size={10} color={COLORS.TEXT_SECONDARY}>Entry not found.</PixelText>
        </View>
      </SafeAreaView>
    );
  }

  const tags = [entry.region, entry.city, entry.zone].filter(Boolean) as string[];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.BG_DARK }}>
      <ScreenHeader title="ARCHIVE ENTRY" onBack={() => navigation.goBack()} accent={COLORS.PURPLE} />
      <ScrollView contentContainerStyle={{ padding: SIZES.spacingLg, paddingBottom: 40 }}>
        {/* The collectible card you earned for this quest. */}
        <View style={{ alignItems: 'center', marginBottom: SIZES.spacingLg }}>
          <QuestTradingCard entry={entry} width={Math.min(220, width * 0.6)} />
        </View>
        <PixelText size={14} color={COLORS.TEXT_PRIMARY} lineHeight={22}>
          {entry.quest_title}
        </PixelText>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: SIZES.spacingSm }}>
          <QuestBadge type={entry.quest_type} />
          <PixelText size={7} color={COLORS.TEXT_SECONDARY} style={{ marginLeft: 8 }}>
            {formatDate(entry.completed_at)}
          </PixelText>
          <PixelText size={12} color={COLORS.GOLD} style={{ marginLeft: 'auto' }}>
            {`+${formatNumber(entry.xp_earned)} XP`}
          </PixelText>
        </View>

        {entry.photo_uris.length > 0 ? (
          <View style={{ marginTop: SIZES.spacingLg }}>
            <PixelText size={8} color={COLORS.PURPLE} style={{ marginBottom: SIZES.spacingSm }}>PHOTOS</PixelText>
            <PhotoAlbum photoUris={entry.photo_uris} coverUri={entry.cover_photo_uri} onPressPhoto={(i) => setViewer(i)} />
          </View>
        ) : null}

        {entry.video_uris.length > 0 ? (
          <View style={{ marginTop: SIZES.spacingLg }}>
            <PixelText size={8} color={COLORS.PURPLE} style={{ marginBottom: SIZES.spacingSm }}>VIDEO</PixelText>
            {entry.video_uris.map((u, i) => (
              <View key={i} style={{ marginBottom: SIZES.spacingMd }}>
                <VideoPlayer uri={u} />
              </View>
            ))}
          </View>
        ) : null}

        {entry.journal_entry ? (
          <View style={{ marginTop: SIZES.spacingLg }}>
            <PixelText size={8} color={COLORS.PURPLE} style={{ marginBottom: SIZES.spacingSm }}>JOURNAL</PixelText>
            <JournalEntry text={entry.journal_entry} />
          </View>
        ) : null}

        {tags.length ? (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: SIZES.spacingLg }}>
            {tags.map((t) => (
              <QuestBadge key={t} label={t} color={COLORS.TEXT_SECONDARY} style={{ marginRight: 6, marginBottom: 6 }} />
            ))}
          </View>
        ) : null}
      </ScrollView>

      {/* Full-screen photo swiper */}
      <Modal visible={viewer != null} transparent animationType="fade" onRequestClose={() => setViewer(null)} statusBarTranslucent>
        <View style={{ flex: 1, backgroundColor: 'rgba(8,8,16,0.97)' }}>
          <SafeAreaView style={{ flex: 1 }}>
            <View style={{ alignItems: 'flex-end', padding: SIZES.spacingMd }}>
              <PixelButton label="CLOSE" size="sm" variant="outline" color={COLORS.TEXT_SECONDARY} onPress={() => setViewer(null)} />
            </View>
            <ScrollView
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              contentOffset={{ x: (viewer ?? 0) * width, y: 0 }}
            >
              {entry.photo_uris.map((u, i) => (
                <View key={i} style={{ width, alignItems: 'center', justifyContent: 'center' }}>
                  <Image source={{ uri: u }} style={{ width: width - 32, height: width - 32 }} resizeMode="contain" />
                </View>
              ))}
            </ScrollView>
          </SafeAreaView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
