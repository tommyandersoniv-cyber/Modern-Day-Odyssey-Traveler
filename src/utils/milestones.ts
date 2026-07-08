// ============================================================================
// Milestones — pure achievement logic. Given an ActivityStats snapshot, return
// every milestone instance the player has EARNED. The store diffs this against
// what's already been awarded to grant XP + a medal exactly once.
//
// Two milestone shapes:
//   • one-shot   — crossed a fixed threshold once (50 quests, first boss, LV 5…)
//   • repeating  — awarded again at every Nth (every 15 foods, every 10 markets)
//
// Every earned instance has a STABLE id (e.g. 'quests_50', 'food_x45') so the
// award ledger is idempotent: re-evaluating never double-awards.
// ============================================================================

import { COLORS, LEVELS } from './constants';
import { titleForLevel } from './xp';
import type { ActivityStats } from './activity';

export type MilestoneCategory =
  | 'quest'
  | 'temple'
  | 'food'
  | 'market'
  | 'island'
  | 'beach'
  | 'level'
  | 'boss'
  | 'chaos'
  | 'character'
  | 'place'
  | 'region';

export interface EarnedMilestone {
  id: string; // stable unique instance id
  category: MilestoneCategory;
  title: string; // medal name
  description: string; // how it was earned
  xp: number;
  glyph: string; // medal face glyph (emoji renders via PixelText body fallback)
  color: string;
}

// Per-category medal styling. Glyphs are emoji so they render crisply (PixelText
// falls back to the system font for non-ASCII glyphs).
const STYLE: Record<MilestoneCategory, { glyph: string; color: string }> = {
  quest: { glyph: '⚔️', color: COLORS.BLUE },
  temple: { glyph: '⛩️', color: COLORS.GOLD },
  food: { glyph: '🍜', color: COLORS.ORANGE },
  market: { glyph: '🏮', color: COLORS.RED },
  island: { glyph: '🏝️', color: COLORS.TEAL },
  beach: { glyph: '🏖️', color: COLORS.BLUE },
  level: { glyph: '⭐', color: COLORS.GOLD },
  boss: { glyph: '👑', color: COLORS.QUEST_BOSS },
  chaos: { glyph: '🎲', color: COLORS.QUEST_CHAOS },
  character: { glyph: '🤝', color: COLORS.TEAL },
  place: { glyph: '📍', color: COLORS.GREEN },
  region: { glyph: '🗺️', color: COLORS.PURPLE },
};

function mk(
  id: string,
  category: MilestoneCategory,
  title: string,
  description: string,
  xp: number,
): EarnedMilestone {
  return { id, category, title, description, xp, glyph: STYLE[category].glyph, color: STYLE[category].color };
}

// ---- One-shot threshold tables --------------------------------------------
// [threshold, xp, medal name]
const QUEST_TIERS: [number, number, string][] = [
  [1, 250, 'First Steps'],
  [10, 750, 'Getting Started'],
  [25, 1500, 'Seasoned'],
  [50, 3000, 'Questmaster'],
  [100, 7500, 'Centurion'],
  [250, 25000, 'Legend of the Road'],
  [500, 100000, 'Living Myth'],
];

const TEMPLE_TIERS: [number, number, string][] = [
  [1, 500, 'First Prayer'],
  [10, 1500, 'Devotee'],
  [25, 3000, 'Pilgrim'],
  [50, 5000, 'Temple Walker'],
  [100, 10000, 'Keeper of Shrines'],
  [250, 50000, 'Enlightened'],
];

// ---- Repeating ladders -----------------------------------------------------
// facet -> [step, xpPerTier, medal name]
const REPEATING: { category: MilestoneCategory; count: (s: ActivityStats) => number; step: number; xp: number; name: string; noun: string }[] = [
  { category: 'food', count: (s) => s.foods, step: 15, xp: 2500, name: 'Gourmand', noun: 'foods eaten' },
  { category: 'market', count: (s) => s.markets, step: 10, xp: 2500, name: 'Market Hopper', noun: 'markets visited' },
  { category: 'island', count: (s) => s.islands, step: 10, xp: 5000, name: 'Island Hopper', noun: 'islands visited' },
  { category: 'beach', count: (s) => s.beaches, step: 10, xp: 3500, name: 'Beachcomber', noun: 'beaches visited' },
];

// ---- Firsts ----------------------------------------------------------------
const FIRSTS: { id: string; category: MilestoneCategory; title: string; description: string; xp: number; met: (s: ActivityStats) => boolean }[] = [
  { id: 'first_boss', category: 'boss', title: 'Boss Slayer', description: 'Win your first boss challenge', xp: 1000, met: (s) => s.bossWins >= 1 },
  { id: 'first_chaos', category: 'chaos', title: 'Embrace Chaos', description: 'Complete your first chaos quest', xp: 500, met: (s) => s.chaosDone >= 1 },
  { id: 'first_custom_quest', category: 'quest', title: 'Author of Adventure', description: 'Create your first custom quest', xp: 500, met: (s) => s.customQuestsCreated >= 1 },
  { id: 'first_character', category: 'character', title: 'New Friend', description: 'Tag your first character', xp: 500, met: (s) => s.characters >= 1 },
  { id: 'first_place', category: 'place', title: 'Cartographer', description: 'Save your first custom place', xp: 500, met: (s) => s.placesSaved >= 1 },
  { id: 'first_region', category: 'region', title: 'Threshold Crossed', description: 'Enter your first region', xp: 750, met: (s) => s.regionsEntered >= 1 },
];

// Extra one-shot ladders for the non-facet collectibles, so characters/places
// also reward the 10/25/50th, matching the request's spirit.
const CHARACTER_TIERS: [number, number, string][] = [
  [10, 1500, 'Connector'],
  [25, 3000, 'People Person'],
  [50, 6000, 'Master of Ceremonies'],
];
const PLACE_TIERS: [number, number, string][] = [
  [5, 1000, 'Worldbuilder'],
  [10, 2500, 'Mapmaker'],
];
const BOSS_TIERS: [number, number, string][] = [
  [5, 5000, 'Boss Hunter'],
  [10, 12000, 'Bane of Bosses'],
];

function tierMilestones(
  tiers: [number, number, string][],
  count: number,
  category: MilestoneCategory,
  idPrefix: string,
  describe: (n: number) => string,
): EarnedMilestone[] {
  return tiers
    .filter(([threshold]) => count >= threshold)
    .map(([threshold, xp, name]) => mk(`${idPrefix}_${threshold}`, category, name, describe(threshold), xp));
}

/**
 * Every milestone the player currently QUALIFIES for, given their stats.
 * Pure + idempotent — callers diff ids against the award ledger.
 */
export function evaluateMilestones(s: ActivityStats): EarnedMilestone[] {
  const out: EarnedMilestone[] = [];

  out.push(...tierMilestones(QUEST_TIERS, s.quests, 'quest', 'quests', (n) => `Complete ${n} quest${n === 1 ? '' : 's'}`));
  out.push(...tierMilestones(TEMPLE_TIERS, s.temples, 'temple', 'temples', (n) => `Visit ${n} temple${n === 1 ? '' : 's'}`));
  out.push(...tierMilestones(CHARACTER_TIERS, s.characters, 'character', 'characters', (n) => `Tag ${n} characters`));
  out.push(...tierMilestones(PLACE_TIERS, s.placesSaved, 'place', 'places', (n) => `Save ${n} custom places`));
  out.push(...tierMilestones(BOSS_TIERS, s.bossWins, 'boss', 'bosses', (n) => `Win ${n} boss challenges`));

  // Repeating ladders — one medal per completed tier.
  for (const r of REPEATING) {
    const tiers = Math.floor(r.count(s) / r.step);
    for (let t = 1; t <= tiers; t++) {
      const n = t * r.step;
      out.push(mk(`${r.category}_x${n}`, r.category, `${r.name} ${t}`, `Reach ${n} ${r.noun}`, r.xp));
    }
  }

  // Level milestones (LV 2..max).
  for (const lv of LEVELS) {
    if (lv.level >= 2 && s.level >= lv.level) {
      out.push(mk(`level_${lv.level}`, 'level', `${titleForLevel(lv.level)}`, `Reach level ${lv.level}`, 1000));
    }
  }

  // Firsts.
  for (const f of FIRSTS) {
    if (f.met(s)) out.push(mk(f.id, f.category, f.title, f.description, f.xp));
  }

  return out;
}

export function milestoneStyle(category: MilestoneCategory): { glyph: string; color: string } {
  return STYLE[category];
}

// ---- Progress toward the next milestone (for the Achievements screen) -------

export interface LadderProgress {
  key: string;
  label: string;
  glyph: string;
  color: string;
  current: number;
  target: number | null; // null once the ladder is fully maxed
  xp: number | null; // XP for hitting `target`
}

function nextTier(tiers: [number, number, string][], current: number): { target: number; xp: number } | null {
  for (const [threshold, xp] of tiers) {
    if (current < threshold) return { target: threshold, xp };
  }
  return null;
}

/** One progress row per trackable ladder, showing how close the player is to
 *  the next medal on that track. */
export function progressLadders(s: ActivityStats): LadderProgress[] {
  const oneShot: { key: string; label: string; category: MilestoneCategory; tiers: [number, number, string][]; current: number }[] = [
    { key: 'quest', label: 'Quests', category: 'quest', tiers: QUEST_TIERS, current: s.quests },
    { key: 'temple', label: 'Temples', category: 'temple', tiers: TEMPLE_TIERS, current: s.temples },
  ];
  const repeating = REPEATING.map((r) => ({
    key: r.category,
    label: r.noun.replace(/ (eaten|visited)$/, '').replace(/^./, (c) => c.toUpperCase()),
    category: r.category,
    step: r.step,
    xp: r.xp,
    current: r.count(s),
  }));

  const rows: LadderProgress[] = [];
  for (const o of oneShot) {
    const nt = nextTier(o.tiers, o.current);
    rows.push({ key: o.key, label: o.label, glyph: STYLE[o.category].glyph, color: STYLE[o.category].color, current: o.current, target: nt?.target ?? null, xp: nt?.xp ?? null });
  }
  for (const r of repeating) {
    const target = (Math.floor(r.current / r.step) + 1) * r.step;
    rows.push({ key: r.key, label: r.label, glyph: STYLE[r.category].glyph, color: STYLE[r.category].color, current: r.current, target, xp: r.xp });
  }
  return rows;
}
