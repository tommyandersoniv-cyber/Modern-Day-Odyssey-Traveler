// ============================================================================
// Appearance model + pixel-sprite generator.
//
// A CharacterAppearance is a small set of choices (gender, skin, hair, hat,
// clothes) that we compose into a 12x15 pixel grid at render time. The grid is
// an array of 12-char strings; each non-'_' char maps to a hex via the palette
// returned alongside it. CustomSprite turns this into SVG rects.
//
// One generator powers EVERY pixel character in the app: the player, the people
// you meet, and their tokens on the map. No emoji, no copyrighted art.
// ============================================================================

import type { CharacterAppearance, Gender } from '../types';

// ---------------------------------------------------------------------------
// Option palettes (key + hex + human label) — consumed by the customizer UI.
// ---------------------------------------------------------------------------

export interface Swatch {
  key: string;
  hex: string;
  label: string;
}

export const SKIN_TONES: Swatch[] = [
  { key: 'porcelain', hex: '#ffe0c8', label: 'Porcelain' },
  { key: 'light', hex: '#f0c098', label: 'Light' },
  { key: 'tan', hex: '#d99a6c', label: 'Tan' },
  { key: 'brown', hex: '#a86b42', label: 'Brown' },
  { key: 'deep', hex: '#7a4a2b', label: 'Deep' },
  { key: 'ebony', hex: '#4e2f1c', label: 'Ebony' },
];

export const HAIR_COLORS: Swatch[] = [
  { key: 'black', hex: '#23232f', label: 'Black' },
  { key: 'brown', hex: '#5a3a23', label: 'Brown' },
  { key: 'chestnut', hex: '#7a4a2b', label: 'Chestnut' },
  { key: 'blonde', hex: '#e3c266', label: 'Blonde' },
  { key: 'red', hex: '#b5482e', label: 'Auburn' },
  { key: 'gray', hex: '#b8b8c4', label: 'Gray' },
  { key: 'blue', hex: '#3a6ea8', label: 'Blue' },
  { key: 'pink', hex: '#d96b9e', label: 'Pink' },
];

export const HAIR_STYLES = ['short', 'long', 'ponytail', 'bun', 'spiky', 'buzz', 'bald'] as const;
export type HairStyle = (typeof HAIR_STYLES)[number];

export const HATS = ['none', 'cap', 'beanie', 'sunhat', 'headband'] as const;
export type HatStyle = (typeof HATS)[number];

/** Shared clothing/hat palette (shirt, pants, shoes, hat). */
export const CLOTH_COLORS: Swatch[] = [
  { key: 'red', hex: '#e23b3b', label: 'Red' },
  { key: 'orange', hex: '#ff9800', label: 'Orange' },
  { key: 'gold', hex: '#f0c020', label: 'Gold' },
  { key: 'green', hex: '#4caf50', label: 'Green' },
  { key: 'teal', hex: '#00bcd4', label: 'Teal' },
  { key: 'blue', hex: '#2f6fe0', label: 'Blue' },
  { key: 'purple', hex: '#9c27b0', label: 'Purple' },
  { key: 'pink', hex: '#d96b9e', label: 'Pink' },
  { key: 'white', hex: '#e8e8f0', label: 'White' },
  { key: 'gray', hex: '#6b6b80', label: 'Gray' },
  { key: 'black', hex: '#2b2b3a', label: 'Black' },
  { key: 'brown', hex: '#6b4a2b', label: 'Brown' },
];

export const GENDERS: Gender[] = ['M', 'F'];

// ---------------------------------------------------------------------------
// Defaults + helpers
// ---------------------------------------------------------------------------

/** The classic red-cap / blue-jacket traveler — used as the player default. */
export const DEFAULT_PLAYER_APPEARANCE: CharacterAppearance = {
  gender: 'M',
  skin: '#f0c098',
  hair: 'short',
  hairColor: '#5a3a23',
  hat: 'cap',
  hatColor: '#e23b3b',
  shirt: '#2f6fe0',
  pants: '#2b2b3a',
  shoes: '#141414',
};

const DEFAULT_NPC_APPEARANCE: CharacterAppearance = {
  gender: 'F',
  skin: '#d99a6c',
  hair: 'long',
  hairColor: '#23232f',
  hat: 'none',
  hatColor: '#4caf50',
  shirt: '#4caf50',
  pants: '#2b2b3a',
  shoes: '#141414',
};

export function defaultAppearance(gender: Gender = 'M'): CharacterAppearance {
  return { ...(gender === 'F' ? DEFAULT_NPC_APPEARANCE : DEFAULT_PLAYER_APPEARANCE) };
}

/** Coerce a possibly-partial/persisted value into a complete appearance. */
export function normalizeAppearance(a?: Partial<CharacterAppearance> | null): CharacterAppearance {
  return { ...DEFAULT_PLAYER_APPEARANCE, ...(a ?? {}) };
}

// ---------------------------------------------------------------------------
// Colour math — lighten (+) / darken (-) a hex by a percentage.
// ---------------------------------------------------------------------------

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  const v = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  const n = parseInt(v, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function rgbToHex(r: number, g: number, b: number): string {
  const f = (x: number) => Math.max(0, Math.min(255, Math.round(x))).toString(16).padStart(2, '0');
  return `#${f(r)}${f(g)}${f(b)}`;
}

export function shade(hex: string, pct: number): string {
  const [r, g, b] = hexToRgb(hex);
  const target = pct < 0 ? 0 : 255;
  const f = Math.abs(pct) / 100;
  return rgbToHex(r + (target - r) * f, g + (target - g) * f, b + (target - b) * f);
}

// ---------------------------------------------------------------------------
// Sprite generator — composes the 12x15 grid layer by layer.
// ---------------------------------------------------------------------------

export const SPRITE_COLS = 12;
export const SPRITE_ROWS = 15;

type Set = (r: number, c: number, ch: string) => void;
type Span = (r: number, c0: number, c1: number, ch: string) => void;

function paintHair(style: HairStyle, set: Set, span: Span): void {
  if (style === 'bald') return;
  const cap = () => {
    span(0, 4, 7, 'h');
    span(1, 3, 8, 'h');
    span(2, 2, 9, 'h');
    span(3, 2, 9, 'H');
  };
  switch (style) {
    case 'buzz':
      span(1, 4, 7, 'h');
      span(2, 3, 8, 'h');
      span(3, 3, 8, 'H');
      break;
    case 'short':
      cap();
      set(4, 2, 'h');
      set(4, 9, 'h');
      break;
    case 'long':
      cap();
      // frame the face and fall past the shoulders
      for (let r = 4; r <= 8; r++) {
        set(r, 2, 'h');
        set(r, 9, 'h');
      }
      set(4, 1, 'h');
      set(5, 1, 'h');
      set(4, 10, 'h');
      set(5, 10, 'h');
      set(9, 2, 'H');
      set(9, 9, 'H');
      break;
    case 'ponytail':
      cap();
      for (let r = 2; r <= 6; r++) set(r, 10, 'h');
      set(7, 10, 'H');
      break;
    case 'bun':
      cap();
      set(0, 5, 'H');
      set(0, 6, 'H');
      break;
    case 'spiky':
      set(0, 3, 'h');
      set(0, 5, 'h');
      set(0, 7, 'h');
      set(0, 9, 'h');
      span(1, 3, 8, 'h');
      span(2, 2, 9, 'h');
      span(3, 2, 9, 'H');
      break;
  }
}

function paintHat(style: HatStyle, set: Set, span: Span): void {
  switch (style) {
    case 'none':
      return;
    case 'cap':
      span(0, 4, 7, 'a');
      span(1, 3, 8, 'a');
      span(2, 2, 9, 'a');
      span(3, 1, 10, 'A'); // brim sticks out
      break;
    case 'beanie':
      span(0, 4, 7, 'a');
      span(1, 3, 8, 'a');
      span(2, 2, 9, 'a');
      span(3, 3, 8, 'a'); // folded band, same tone
      break;
    case 'sunhat':
      span(1, 4, 7, 'a');
      span(2, 3, 8, 'a');
      span(3, 0, 11, 'A'); // wide flat brim
      break;
    case 'headband':
      span(3, 2, 9, 'a'); // thin band; hair shows above
      break;
  }
}

export interface BuiltSprite {
  rows: string[];
  cols: number;
  palette: Record<string, string>;
}

/** Compose an appearance into a pixel grid + palette. */
export function buildSprite(input: CharacterAppearance, blink = false): BuiltSprite {
  const a = normalizeAppearance(input);
  const rows = Array.from({ length: SPRITE_ROWS }, () => '_'.repeat(SPRITE_COLS));
  const set: Set = (r, c, ch) => {
    if (r < 0 || r >= SPRITE_ROWS || c < 0 || c >= SPRITE_COLS) return;
    rows[r] = rows[r].slice(0, c) + ch + rows[r].slice(c + 1);
  };
  const span: Span = (r, c0, c1, ch) => {
    for (let c = c0; c <= c1; c++) set(r, c, ch);
  };

  const female = a.gender === 'F';

  // Scalp dome (guarantees a head even when bald + hatless).
  span(1, 4, 7, 's');
  span(2, 3, 8, 's');
  span(3, 3, 8, 's');

  // Face.
  span(4, 2, 9, 's');
  span(5, 2, 9, 's');
  span(6, 2, 9, 's');
  if (!blink) {
    set(5, 3, 'e');
    set(5, 8, 'e');
  }

  paintHair(a.hair as HairStyle, set, span);
  paintHat(a.hat as HatStyle, set, span);

  // Torso (shirt) — collar + body + belt.
  span(7, 2, 9, 'b');
  span(7, 4, 7, 'w'); // collar trim
  span(8, 2, 9, 'b');
  span(9, 2, 9, 'b');
  set(9, 1, 's'); // hands
  set(9, 10, 's');
  if (female) {
    span(10, 3, 8, 'b'); // narrower waist
    span(10, 5, 6, 'w');
  } else {
    span(10, 2, 9, 'b');
    span(10, 5, 6, 'w'); // belt buckle
  }

  // Legs (pants) + shoes.
  span(11, 2, 9, 'p');
  span(12, 2, 9, 'p');
  set(13, 2, 'p');
  set(13, 3, 'p');
  set(13, 8, 'p');
  set(13, 9, 'p');
  set(14, 2, 'o');
  set(14, 3, 'o');
  set(14, 8, 'o');
  set(14, 9, 'o');

  const palette: Record<string, string> = {
    s: a.skin,
    e: '#1b1b24',
    b: a.shirt,
    w: shade(a.shirt, 32),
    p: a.pants,
    o: a.shoes,
    h: a.hairColor,
    H: shade(a.hairColor, -28),
    a: a.hatColor,
    A: shade(a.hatColor, -32),
  };

  return { rows, cols: SPRITE_COLS, palette };
}
