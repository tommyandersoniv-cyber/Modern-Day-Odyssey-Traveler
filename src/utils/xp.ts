// ============================================================================
// XP math — level thresholds, titles, and progress.
// ============================================================================

import { LEVELS, MAX_LEVEL } from './constants';
import type { LevelDef } from '../types';

/** The level definition for a given cumulative XP total. */
export function getLevelDef(xpTotal: number): LevelDef {
  let current = LEVELS[0];
  for (const def of LEVELS) {
    if (xpTotal >= def.threshold) current = def;
    else break;
  }
  return current;
}

export function getLevel(xpTotal: number): number {
  return getLevelDef(xpTotal).level;
}

export function getTitle(xpTotal: number): string {
  return getLevelDef(xpTotal).title;
}

export function titleForLevel(level: number): string {
  return LEVELS.find((l) => l.level === level)?.title ?? 'Wanderer';
}

/** XP threshold required to reach the next level, or null if max level. */
export function getNextLevelDef(xpTotal: number): LevelDef | null {
  const level = getLevel(xpTotal);
  if (level >= MAX_LEVEL) return null;
  return LEVELS.find((l) => l.level === level + 1) ?? null;
}

/** Cumulative XP still needed to reach the next level (0 at max). */
export function getXPToNext(xpTotal: number): number {
  const next = getNextLevelDef(xpTotal);
  if (!next) return 0;
  return Math.max(0, next.threshold - xpTotal);
}

/**
 * Progress through the current level as a 0-1 fraction.
 * At max level this returns 1.
 */
export function getLevelProgress(xpTotal: number): number {
  const current = getLevelDef(xpTotal);
  const next = getNextLevelDef(xpTotal);
  if (!next) return 1;
  const span = next.threshold - current.threshold;
  if (span <= 0) return 1;
  return Math.min(1, Math.max(0, (xpTotal - current.threshold) / span));
}

/** XP earned within the current level band, and the band size. */
export function getLevelBand(xpTotal: number): { earned: number; size: number } {
  const current = getLevelDef(xpTotal);
  const next = getNextLevelDef(xpTotal);
  if (!next) return { earned: 1, size: 1 };
  return {
    earned: xpTotal - current.threshold,
    size: next.threshold - current.threshold,
  };
}
