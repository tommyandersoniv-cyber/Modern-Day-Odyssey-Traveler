// ============================================================================
// AvatarCustomizer — a reusable control panel for editing a CharacterAppearance.
//   Live pixel preview on top, then option rows: gender, skin, hair style +
//   colour, hat style + colour, shirt, pants, shoes. Pure controlled component.
// ============================================================================

import React from 'react';
import { Pressable, View } from 'react-native';
import type { CharacterAppearance, Gender } from '../../types';
import {
  CLOTH_COLORS,
  GENDERS,
  HAIR_COLORS,
  HAIR_STYLES,
  HATS,
  SKIN_TONES,
  Swatch,
} from '../../utils/appearance';
import { COLORS, SIZES } from '../../utils/constants';
import { PixelText } from '../ui/PixelText';
import { PixelButton } from '../ui/PixelButton';
import { CustomSprite } from './CustomSprite';

export interface AvatarCustomizerProps {
  value: CharacterAppearance;
  onChange: (next: CharacterAppearance) => void;
}

const STYLE_LABEL: Record<string, string> = {
  short: 'Short',
  long: 'Long',
  ponytail: 'Ponytail',
  bun: 'Bun',
  spiky: 'Spiky',
  buzz: 'Buzz',
  bald: 'Bald',
  none: 'None',
  cap: 'Cap',
  beanie: 'Beanie',
  sunhat: 'Sun Hat',
  headband: 'Headband',
};

const Row: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <View style={{ marginTop: SIZES.spacingMd }}>
    <PixelText size={8} color={COLORS.TEAL} style={{ marginBottom: 6 }}>
      {label}
    </PixelText>
    <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>{children}</View>
  </View>
);

const SwatchButton: React.FC<{ swatch: Swatch; selected: boolean; onPress: () => void }> = ({
  swatch,
  selected,
  onPress,
}) => (
  <Pressable
    onPress={onPress}
    style={{
      width: 30,
      height: 30,
      marginRight: 8,
      marginBottom: 8,
      backgroundColor: swatch.hex,
      borderWidth: selected ? 3 : SIZES.borderWidth,
      borderColor: selected ? COLORS.GOLD : COLORS.BG_BORDER,
    }}
  />
);

const Chip: React.FC<{ label: string; selected: boolean; onPress: () => void }> = ({
  label,
  selected,
  onPress,
}) => (
  <PixelButton
    label={label}
    size="sm"
    color={selected ? COLORS.TEAL : COLORS.BG_BORDER}
    textColor={selected ? COLORS.BG_DARK : COLORS.TEXT_SECONDARY}
    onPress={onPress}
    style={{ marginRight: 6, marginBottom: 6 }}
  />
);

export const AvatarCustomizer: React.FC<AvatarCustomizerProps> = ({ value, onChange }) => {
  const patch = (p: Partial<CharacterAppearance>) => onChange({ ...value, ...p });

  return (
    <View>
      {/* Live preview */}
      <View
        style={{
          alignItems: 'center',
          justifyContent: 'center',
          paddingVertical: SIZES.spacingMd,
          backgroundColor: COLORS.BG_SURFACE,
          borderWidth: SIZES.borderWidth,
          borderColor: COLORS.BG_BORDER,
        }}
      >
        <CustomSprite appearance={value} size={75} />
      </View>

      <Row label="GENDER">
        {GENDERS.map((g: Gender) => (
          <Chip
            key={g}
            label={g === 'M' ? 'MALE' : 'FEMALE'}
            selected={value.gender === g}
            onPress={() => patch({ gender: g })}
          />
        ))}
      </Row>

      <Row label="SKIN">
        {SKIN_TONES.map((s) => (
          <SwatchButton key={s.key} swatch={s} selected={value.skin === s.hex} onPress={() => patch({ skin: s.hex })} />
        ))}
      </Row>

      <Row label="HAIR STYLE">
        {HAIR_STYLES.map((h) => (
          <Chip key={h} label={STYLE_LABEL[h]} selected={value.hair === h} onPress={() => patch({ hair: h })} />
        ))}
      </Row>

      <Row label="HAIR COLOUR">
        {HAIR_COLORS.map((s) => (
          <SwatchButton
            key={s.key}
            swatch={s}
            selected={value.hairColor === s.hex}
            onPress={() => patch({ hairColor: s.hex })}
          />
        ))}
      </Row>

      <Row label="HAT">
        {HATS.map((h) => (
          <Chip key={h} label={STYLE_LABEL[h]} selected={value.hat === h} onPress={() => patch({ hat: h })} />
        ))}
      </Row>

      {value.hat !== 'none' ? (
        <Row label="HAT COLOUR">
          {CLOTH_COLORS.map((s) => (
            <SwatchButton
              key={s.key}
              swatch={s}
              selected={value.hatColor === s.hex}
              onPress={() => patch({ hatColor: s.hex })}
            />
          ))}
        </Row>
      ) : null}

      <Row label="SHIRT">
        {CLOTH_COLORS.map((s) => (
          <SwatchButton key={s.key} swatch={s} selected={value.shirt === s.hex} onPress={() => patch({ shirt: s.hex })} />
        ))}
      </Row>

      <Row label="PANTS">
        {CLOTH_COLORS.map((s) => (
          <SwatchButton key={s.key} swatch={s} selected={value.pants === s.hex} onPress={() => patch({ pants: s.hex })} />
        ))}
      </Row>

      <Row label="SHOES">
        {CLOTH_COLORS.map((s) => (
          <SwatchButton key={s.key} swatch={s} selected={value.shoes === s.hex} onPress={() => patch({ shoes: s.hex })} />
        ))}
      </Row>
    </View>
  );
};

export default AvatarCustomizer;
