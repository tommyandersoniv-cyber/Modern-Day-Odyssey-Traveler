// ============================================================================
// PhotoAlbum — a 3-column grid of photo thumbnails for an archive entry.
//   The cover photo (if matched) gets a gold star overlay. Tapping a tile
//   fires onPressPhoto(index). Empty album - flat placeholder box with glyph.
// ============================================================================

import React from 'react';
import { Image, Pressable, View } from 'react-native';
import { COLORS, SIZES } from '../../utils/constants';
import { PixelText } from '../ui/PixelText';

export interface PhotoAlbumProps {
  photoUris: string[];
  coverUri?: string;
  onPressPhoto?: (index: number) => void;
}

const COLUMNS = 3;
const GAP = SIZES.spacingSm;

export const PhotoAlbum: React.FC<PhotoAlbumProps> = ({
  photoUris,
  coverUri,
  onPressPhoto,
}) => {
  if (!photoUris || photoUris.length === 0) {
    return (
      <View
        style={{
          width: '100%',
          aspectRatio: 16 / 9,
          backgroundColor: COLORS.BG_SURFACE,
          borderWidth: SIZES.borderWidth,
          borderColor: COLORS.BG_BORDER,
          borderRadius: SIZES.borderRadius,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <PixelText size={SIZES.fontXl} color={COLORS.TEXT_DISABLED}>
          #
        </PixelText>
        <PixelText
          size={SIZES.fontXs}
          color={COLORS.TEXT_DISABLED}
          align="center"
          style={{ marginTop: SIZES.spacingSm }}
        >
          NO PHOTOS
        </PixelText>
      </View>
    );
  }

  return (
    <View
      style={{
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginHorizontal: -GAP / 2,
      }}
    >
      {photoUris.map((uri, index) => {
        const isCover = !!coverUri && uri === coverUri;
        return (
          <View
            key={`${uri}-${index}`}
            style={{
              width: `${100 / COLUMNS}%`,
              padding: GAP / 2,
            }}
          >
            <Pressable
              onPress={onPressPhoto ? () => onPressPhoto(index) : undefined}
              style={{
                aspectRatio: 1,
                borderWidth: SIZES.borderWidth,
                borderColor: isCover ? COLORS.GOLD : COLORS.BG_BORDER,
                borderRadius: SIZES.borderRadius,
                backgroundColor: COLORS.BG_SURFACE,
                overflow: 'hidden',
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
                    borderWidth: SIZES.borderWidth,
                    borderColor: COLORS.GOLD,
                    borderRadius: SIZES.borderRadius,
                    paddingHorizontal: 4,
                    paddingVertical: 2,
                  }}
                >
                  <PixelText size={SIZES.fontXs} color={COLORS.GOLD}>
                    *
                  </PixelText>
                </View>
              ) : null}
            </Pressable>
          </View>
        );
      })}
    </View>
  );
};

export default PhotoAlbum;
