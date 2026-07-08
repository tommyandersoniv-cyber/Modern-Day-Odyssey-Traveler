// ============================================================================
// VideoPlayer — plays a single archived video clip via expo-video.
//   Offline-first: if the player can't be created or the view fails to mount,
//   fall back to a muted placeholder rather than crashing.
// ============================================================================

import React from 'react';
import { View } from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';
import { COLORS, SIZES } from '../../utils/constants';
import { PixelText } from '../ui/PixelText';

export interface VideoPlayerProps {
  uri: string;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({ uri }) => {
  // useVideoPlayer is a hook - must be called unconditionally. Guard the body
  // so a malformed/missing source can't throw during setup.
  const player = useVideoPlayer(uri, (p) => {
    try {
      p.loop = false;
    } catch {
      // ignore — player setup is best-effort
    }
  });

  if (!uri || !player) {
    return <VideoFallback />;
  }

  try {
    return (
      <View
        style={{
          width: '100%',
          aspectRatio: 16 / 9,
          borderWidth: SIZES.borderWidth,
          borderColor: COLORS.BG_BORDER,
          borderRadius: SIZES.borderRadius,
          backgroundColor: COLORS.BLACK,
          overflow: 'hidden',
        }}
      >
        <VideoView
          player={player}
          style={{ width: '100%', height: '100%' }}
          nativeControls
          contentFit="contain"
        />
      </View>
    );
  } catch {
    return <VideoFallback />;
  }
};

const VideoFallback: React.FC = () => (
  <View
    style={{
      width: '100%',
      aspectRatio: 16 / 9,
      borderWidth: SIZES.borderWidth,
      borderColor: COLORS.BG_BORDER,
      borderRadius: SIZES.borderRadius,
      backgroundColor: COLORS.BG_SURFACE,
      alignItems: 'center',
      justifyContent: 'center',
      padding: SIZES.spacingMd,
    }}
  >
    <PixelText size={SIZES.fontMd} color={COLORS.TEXT_DISABLED} align="center">
      VIDEO UNAVAILABLE
    </PixelText>
  </View>
);

export default VideoPlayer;
