// ============================================================================
// QuestCompletionModal — the "media log" capture flow shown when a player
// completes a quest. Inside a scrollable PixelModal the player can:
//   • Add photos from the library (multi-select) or the camera
//   • Tap a photo thumbnail to crown it the cover (*)
//   • Import a video from the library
//   • Write a journal entry (multiline body text)
// Confirming emits a MediaDraft via onComplete. Everything is offline-first:
// permission/native calls are wrapped in try/catch and never crash on denial.
// ============================================================================

import React, { useEffect, useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { Image, Pressable, TextInput, View } from 'react-native';
import type { MediaDraft, Quest } from '../../types';
import { COLORS, QUEST_TYPE_COLOR, SIZES } from '../../utils/constants';
import { wordCount } from '../../utils/helpers';
import { PixelButton } from '../ui/PixelButton';
import { PixelModal } from '../ui/PixelModal';
import { PixelText } from '../ui/PixelText';

export interface QuestCompletionModalProps {
  visible: boolean;
  quest: Quest | null;
  onCancel: () => void;
  onComplete: (draft: MediaDraft) => void;
}

const THUMB = 78;

export const QuestCompletionModal: React.FC<QuestCompletionModalProps> = ({
  visible,
  quest,
  onCancel,
  onComplete,
}) => {
  const [photoUris, setPhotoUris] = useState<string[]>([]);
  const [coverUri, setCoverUri] = useState<string | undefined>(undefined);
  const [videoUris, setVideoUris] = useState<string[]>([]);
  const [journal, setJournal] = useState('');
  const [notice, setNotice] = useState<string | null>(null);

  // Reset the draft whenever the modal (re)opens or targets a new quest.
  useEffect(() => {
    if (visible) {
      setPhotoUris([]);
      setCoverUri(undefined);
      setVideoUris([]);
      setJournal('');
      setNotice(null);
    }
  }, [visible, quest?.id]);

  const accent = quest ? QUEST_TYPE_COLOR[quest.type] ?? COLORS.GOLD : COLORS.GOLD;

  // ---- Media handlers (all guarded; never throw out of the component) -------

  const addPhotosFromLibrary = async () => {
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        setNotice('Photo library access denied. Enable it in Settings to attach photos.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsMultipleSelection: true,
      });
      if (result.canceled || !result.assets) return;
      const picked = result.assets.map((a) => a.uri).filter(Boolean);
      if (picked.length === 0) return;
      setPhotoUris((prev) => {
        const next = [...prev];
        for (const uri of picked) if (!next.includes(uri)) next.push(uri);
        return next;
      });
      setCoverUri((prev) => prev ?? picked[0]);
      setNotice(null);
    } catch {
      setNotice('Could not open the photo library.');
    }
  };

  const takePhoto = async () => {
    try {
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (!perm.granted) {
        setNotice('Camera access denied. Enable it in Settings to take a photo.');
        return;
      }
      const result = await ImagePicker.launchCameraAsync({ mediaTypes: ['images'] });
      if (result.canceled || !result.assets) return;
      const uri = result.assets[0]?.uri;
      if (!uri) return;
      setPhotoUris((prev) => (prev.includes(uri) ? prev : [...prev, uri]));
      setCoverUri((prev) => prev ?? uri);
      setNotice(null);
    } catch {
      setNotice('Could not open the camera.');
    }
  };

  const importVideo = async () => {
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        setNotice('Media library access denied. Enable it in Settings to attach a video.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['videos'],
      });
      if (result.canceled || !result.assets) return;
      const uri = result.assets[0]?.uri;
      if (!uri) return;
      setVideoUris((prev) => (prev.includes(uri) ? prev : [...prev, uri]));
      setNotice(null);
    } catch {
      setNotice('Could not import the video.');
    }
  };

  const removePhoto = (uri: string) => {
    // Compute the survivors once from the current render's state, then update
    // both pieces of state from that single value (no stale closure across calls).
    const remaining = photoUris.filter((u) => u !== uri);
    setPhotoUris(remaining);
    setCoverUri((prev) => (prev === uri ? remaining[0] : prev));
  };

  const removeVideo = (uri: string) => {
    setVideoUris((prev) => prev.filter((u) => u !== uri));
  };

  const confirm = () => {
    const draft: MediaDraft = {
      photo_uris: photoUris,
      cover_photo_uri: coverUri,
      video_uris: videoUris,
      journal_entry: journal.trim(),
    };
    onComplete(draft);
  };

  // --------------------------------------------------------------------------

  return (
    <PixelModal
      visible={visible}
      onClose={onCancel}
      title="COMPLETE QUEST"
      accent={accent}
      scroll
      dismissOnBackdrop={false}
    >
      {/* Quest being logged. */}
      {quest ? (
        <PixelText size={10} color={accent} style={{ marginBottom: SIZES.spacingMd }}>
          {quest.title}
        </PixelText>
      ) : null}

      {/* ---- Photos ---------------------------------------------------- */}
      <PixelText size={9} color={COLORS.TEXT_PRIMARY} style={{ marginBottom: SIZES.spacingSm }}>
        PHOTOS
      </PixelText>
      <PixelText
        variant="body"
        size={12}
        color={COLORS.TEXT_SECONDARY}
        style={{ marginBottom: SIZES.spacingSm }}
      >
        Tap a photo to set it as the cover (*).
      </PixelText>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: SIZES.spacingSm }}>
        {photoUris.map((uri) => {
          const isCover = uri === coverUri;
          return (
            <View
              key={uri}
              style={{ marginRight: SIZES.spacingSm, marginBottom: SIZES.spacingSm }}
            >
              <Pressable
                onPress={() => setCoverUri(uri)}
                onLongPress={() => removePhoto(uri)}
                style={{
                  width: THUMB,
                  height: THUMB,
                  borderWidth: SIZES.borderWidth,
                  borderColor: isCover ? COLORS.GOLD : COLORS.BG_BORDER,
                  borderRadius: SIZES.borderRadius,
                  overflow: 'hidden',
                  backgroundColor: COLORS.BG_SURFACE,
                }}
              >
                <Image
                  source={{ uri }}
                  resizeMode="cover"
                  style={{ width: '100%', height: '100%' }}
                />
                {isCover ? (
                  <View
                    style={{
                      position: 'absolute',
                      top: 2,
                      left: 2,
                      backgroundColor: COLORS.OVERLAY,
                      paddingHorizontal: 3,
                      paddingVertical: 1,
                    }}
                  >
                    <PixelText size={9} color={COLORS.GOLD}>
                      *
                    </PixelText>
                  </View>
                ) : null}
              </Pressable>
              {/* Explicit remove control (long-press also works). */}
              <Pressable
                onPress={() => removePhoto(uri)}
                style={{
                  position: 'absolute',
                  top: 2,
                  right: 2,
                  backgroundColor: COLORS.OVERLAY,
                  paddingHorizontal: 4,
                  paddingVertical: 1,
                }}
              >
                <PixelText size={9} color={COLORS.RED}>
                  X
                </PixelText>
              </Pressable>
            </View>
          );
        })}
      </View>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: SIZES.spacingMd }}>
        <PixelButton
          label="ADD PHOTOS"
          size="sm"
          color={COLORS.BLUE}
          onPress={addPhotosFromLibrary}
          style={{ marginRight: SIZES.spacingSm, marginBottom: SIZES.spacingSm }}
        />
        <PixelButton
          label="TAKE PHOTO"
          size="sm"
          color={COLORS.TEAL}
          onPress={takePhoto}
          style={{ marginBottom: SIZES.spacingSm }}
        />
      </View>

      {/* ---- Video ----------------------------------------------------- */}
      <PixelText size={9} color={COLORS.TEXT_PRIMARY} style={{ marginBottom: SIZES.spacingSm }}>
        VIDEO
      </PixelText>

      {videoUris.length > 0 ? (
        <View style={{ marginBottom: SIZES.spacingSm }}>
          {videoUris.map((uri, i) => (
            <View
              key={uri}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderWidth: SIZES.borderWidth,
                borderColor: COLORS.BG_BORDER,
                backgroundColor: COLORS.BG_SURFACE,
                paddingVertical: SIZES.spacingSm,
                paddingHorizontal: SIZES.spacingSm,
                marginBottom: SIZES.spacingXs,
              }}
            >
              <PixelText
                variant="body"
                size={12}
                color={COLORS.TEXT_SECONDARY}
                style={{ flex: 1, marginRight: SIZES.spacingSm }}
                numberOfLines={1}
              >
                {` Video ${i + 1}`}
              </PixelText>
              <Pressable onPress={() => removeVideo(uri)} hitSlop={8}>
                <PixelText size={9} color={COLORS.RED}>
                  X
                </PixelText>
              </Pressable>
            </View>
          ))}
        </View>
      ) : null}

      <PixelButton
        label="IMPORT VIDEO"
        size="sm"
        color={COLORS.PURPLE}
        onPress={importVideo}
        style={{ marginBottom: SIZES.spacingMd }}
      />

      {/* ---- Journal --------------------------------------------------- */}
      <PixelText size={9} color={COLORS.TEXT_PRIMARY} style={{ marginBottom: SIZES.spacingSm }}>
        JOURNAL
      </PixelText>
      <TextInput
        value={journal}
        onChangeText={setJournal}
        multiline
        placeholder="What happened on this quest?"
        placeholderTextColor={COLORS.TEXT_DISABLED}
        textAlignVertical="top"
        style={{
          minHeight: 96,
          color: COLORS.TEXT_PRIMARY,
          backgroundColor: COLORS.BG_SURFACE,
          borderWidth: SIZES.borderWidth,
          borderColor: COLORS.BG_BORDER,
          borderRadius: SIZES.borderRadius,
          padding: SIZES.spacingSm,
          fontSize: 14,
        }}
      />
      <PixelText
        variant="body"
        size={12}
        color={COLORS.TEXT_DISABLED}
        align="right"
        style={{ marginTop: SIZES.spacingXs }}
      >
        {`${wordCount(journal)} words`}
      </PixelText>

      {/* ---- Permission / error notice -------------------------------- */}
      {notice ? (
        <View
          style={{
            borderWidth: SIZES.borderWidth,
            borderColor: COLORS.RED,
            backgroundColor: COLORS.BG_SURFACE,
            padding: SIZES.spacingSm,
            marginTop: SIZES.spacingMd,
          }}
        >
          <PixelText variant="body" size={12} color={COLORS.RED}>
            {notice}
          </PixelText>
        </View>
      ) : null}

      {/* ---- Actions --------------------------------------------------- */}
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'flex-end',
          marginTop: SIZES.spacingLg,
        }}
      >
        <PixelButton
          label="CANCEL"
          size="sm"
          variant="outline"
          color={COLORS.TEXT_SECONDARY}
          onPress={onCancel}
          style={{ marginRight: SIZES.spacingSm }}
        />
        <PixelButton label="CONFIRM" size="sm" color={COLORS.GREEN} onPress={confirm} />
      </View>
    </PixelModal>
  );
};

export default QuestCompletionModal;
