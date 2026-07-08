// ============================================================================
// QuestDetailScreen — full detail for a single standard / user-created quest.
//   route params: { questId }
//   • Resolves the quest from useQuestStore.
//   • Shows type + rarity badges, title, description, XP, location/category tags.
//   • Opens an external URL via Linking when present.
//   • Button states: completed - disabled; active - COMPLETE QUEST + REMOVE;
//     otherwise - ADD TO INVENTORY (guarded by canAddToInventory).
//   • Completion runs through QuestCompletionModal - completeQuest(draft).
// ============================================================================

import React, { useCallback, useMemo, useState } from 'react';
import { Alert, Linking, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, RouteProp } from '@react-navigation/native';

import type { MediaDraft, Quest, RootStackParamList } from '../types';
import { COLORS, QUEST_TYPE_COLOR, SIZES } from '../utils/constants';
import { formatNumber } from '../utils/helpers';
import { useAppNavigation } from '../navigation/hooks';
import { useQuestStore } from '../store/useQuestStore';

import { PixelText } from '../components/ui/PixelText';
import { PixelButton } from '../components/ui/PixelButton';
import { QuestBadge } from '../components/quests/QuestBadge';
import { QuestCompletionModal } from '../components/quests/QuestCompletionModal';

/** A small bordered tag used for location / category metadata. */
function MetaTag({ label, value, tint }: { label: string; value: string; tint?: string }) {
  return (
    <View
      style={{
        borderWidth: SIZES.borderWidth,
        borderColor: COLORS.BG_BORDER,
        borderLeftWidth: SIZES.cardAccentWidth,
        borderLeftColor: tint ?? COLORS.BG_BORDER,
        backgroundColor: COLORS.BG_SURFACE,
        paddingVertical: SIZES.spacingSm,
        paddingHorizontal: SIZES.spacingMd,
        marginRight: SIZES.spacingSm,
        marginBottom: SIZES.spacingSm,
      }}
    >
      <PixelText size={6} color={COLORS.TEXT_DISABLED}>
        {label.toUpperCase()}
      </PixelText>
      <PixelText size={8} color={COLORS.TEXT_PRIMARY} style={{ marginTop: 3 }}>
        {value}
      </PixelText>
    </View>
  );
}

export function QuestDetailScreen() {
  const navigation = useAppNavigation();
  const route = useRoute<RouteProp<RootStackParamList, 'QuestDetail'>>();
  const { questId } = route.params;

  // Subscribe to store slices so the screen re-renders on completion / add / remove.
  const completedIds = useQuestStore((s) => s.completed_quest_ids);
  const activeIds = useQuestStore((s) => s.active_regular_ids);

  const quest: Quest | undefined = useMemo(
    () => useQuestStore.getState().getQuestById(questId),
    [questId, completedIds, activeIds],
  );

  const isCompleted = !!quest && completedIds.includes(quest.id);
  const isActive = !!quest && activeIds.includes(quest.id);

  const [modalVisible, setModalVisible] = useState(false);
  const accent = quest ? QUEST_TYPE_COLOR[quest.type] : COLORS.GOLD;

  const handleAdd = useCallback(() => {
    if (!quest) return;
    if (!useQuestStore.getState().canAddToInventory('regular')) {
      Alert.alert('INVENTORY FULL', 'Complete or remove a quest to free a slot.');
      return;
    }
    const ok = useQuestStore.getState().addToInventory(quest);
    if (!ok) {
      Alert.alert('CANNOT ADD', 'This quest could not be added to your inventory.');
    }
  }, [quest]);

  const handleRemove = useCallback(() => {
    if (!quest) return;
    useQuestStore.getState().removeFromInventory(quest.id);
  }, [quest]);

  const handleOpenLink = useCallback(async () => {
    if (!quest?.url) return;
    try {
      await Linking.openURL(quest.url);
    } catch {
      Alert.alert('LINK UNAVAILABLE', 'Could not open this link on your device.');
    }
  }, [quest]);

  const handleComplete = useCallback(
    async (draft: MediaDraft) => {
      if (!quest) return;
      setModalVisible(false);
      try {
        // The global LevelUpModal listens to pendingLevelUp; we just persist here.
        await useQuestStore.getState().completeQuest(quest.id, draft);
      } catch {
        Alert.alert('COMPLETION FAILED', 'Something went wrong saving this quest.');
        return;
      }
      navigation.goBack();
    },
    [quest, navigation],
  );

  // ---- Missing quest fallback ---------------------------------------------
  if (!quest) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.BG_DARK }}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: SIZES.spacingMd,
          }}
        >
          <PixelButton label="BACK" size="sm" variant="outline" onPress={() => navigation.goBack()} />
          <PixelText size={12} color={COLORS.TEXT_PRIMARY}>
            QUEST
          </PixelText>
        </View>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: SIZES.spacingLg }}>
          <PixelText size={10} color={COLORS.TEXT_SECONDARY} align="center">
            Quest not found.
          </PixelText>
        </View>
      </SafeAreaView>
    );
  }

  const xpValue = quest.xp_with_multiplier ?? quest.xp;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.BG_DARK }}>
      {/* Header */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: SIZES.spacingMd,
          paddingVertical: SIZES.spacingSm,
          borderBottomWidth: SIZES.borderWidth,
          borderBottomColor: COLORS.BG_BORDER,
        }}
      >
        <PixelButton label="BACK" size="sm" variant="outline" onPress={() => navigation.goBack()} />
        <PixelText size={12} color={accent}>
          QUEST
        </PixelText>
      </View>

      <ScrollView contentContainerStyle={{ padding: SIZES.spacingMd, paddingBottom: SIZES.spacingXl }}>
        {/* Badges */}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: SIZES.spacingMd }}>
          <View style={{ marginRight: SIZES.spacingSm }}>
            <QuestBadge type={quest.type} />
          </View>
          <QuestBadge rarity={quest.rarity} />
        </View>

        {/* Title */}
        <PixelText size={14} color={COLORS.TEXT_PRIMARY} lineHeight={22}>
          {quest.title}
        </PixelText>

        {/* XP */}
        <View style={{ marginTop: SIZES.spacingMd, marginBottom: SIZES.spacingMd }}>
          <PixelText size={6} color={COLORS.TEXT_DISABLED}>
            REWARD
          </PixelText>
          <PixelText size={22} color={COLORS.GOLD} style={{ marginTop: SIZES.spacingXs }}>
            +{formatNumber(xpValue)} XP
          </PixelText>
        </View>

        {/* Description */}
        {quest.description ? (
          <View
            style={{
              backgroundColor: COLORS.BG_SURFACE,
              borderWidth: SIZES.borderWidth,
              borderColor: COLORS.BG_BORDER,
              padding: SIZES.spacingMd,
              marginBottom: SIZES.spacingMd,
            }}
          >
            <PixelText variant="body" size={14} color={COLORS.TEXT_SECONDARY} lineHeight={20}>
              {quest.description}
            </PixelText>
          </View>
        ) : null}

        {/* Location / category tags */}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: SIZES.spacingMd }}>
          {quest.category ? <MetaTag label="Category" value={quest.category} tint={accent} /> : null}
          {quest.zone ? <MetaTag label="Zone" value={quest.zone} /> : null}
          {quest.city ? <MetaTag label="City" value={quest.city} /> : null}
          {quest.region ? <MetaTag label="Region" value={quest.region} /> : null}
        </View>

        {/* External link */}
        {quest.url ? (
          <View style={{ marginBottom: SIZES.spacingMd }}>
            <PixelButton
              label="OPEN LINK"
              color={COLORS.TEAL}
              size="md"
              fullWidth
              onPress={handleOpenLink}
            />
          </View>
        ) : null}

        {/* Action buttons */}
        <View style={{ marginTop: SIZES.spacingSm }}>
          {isCompleted ? (
            <PixelButton label="COMPLETED OK" color={COLORS.GREEN} size="lg" fullWidth disabled />
          ) : isActive ? (
            <View>
              <PixelButton
                label="COMPLETE QUEST"
                color={COLORS.GOLD}
                size="lg"
                fullWidth
                onPress={() => setModalVisible(true)}
              />
              <View style={{ marginTop: SIZES.spacingMd }}>
                <PixelButton
                  label="REMOVE"
                  color={COLORS.RED}
                  size="md"
                  variant="outline"
                  fullWidth
                  onPress={handleRemove}
                />
              </View>
            </View>
          ) : (
            <PixelButton
              label="ADD TO INVENTORY"
              color={QUEST_TYPE_COLOR[quest.type]}
              size="lg"
              fullWidth
              onPress={handleAdd}
            />
          )}
        </View>
      </ScrollView>

      <QuestCompletionModal
        visible={modalVisible}
        quest={quest}
        onCancel={() => setModalVisible(false)}
        onComplete={handleComplete}
      />
    </SafeAreaView>
  );
}

export default QuestDetailScreen;
