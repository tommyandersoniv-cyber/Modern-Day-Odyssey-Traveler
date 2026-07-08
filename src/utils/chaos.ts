// ============================================================================
// Chaos draw math — weighted random selection + dice.
// ============================================================================

import type { Quest } from '../types';

/**
 * Weighted random draw from a pool. Higher `weight` (1-10) - drawn more often.
 * Excludes any quest id in `exclude`. Returns null only if nothing is eligible.
 */
export function weightedDraw(pool: Quest[], exclude: string[] = []): Quest | null {
  const excludeSet = new Set(exclude);
  const eligible = pool.filter((q) => !excludeSet.has(q.id));
  if (eligible.length === 0) return null;

  const totalWeight = eligible.reduce((sum, q) => sum + Math.max(1, q.weight ?? 1), 0);
  let roll = Math.random() * totalWeight;
  for (const q of eligible) {
    roll -= Math.max(1, q.weight ?? 1);
    if (roll <= 0) return q;
  }
  return eligible[eligible.length - 1];
}

/** Uniform 1..20. */
export function rollD20(): number {
  return Math.floor(Math.random() * 20) + 1;
}

/** Uniform integer in [min, max]. */
export function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/** Pick a uniformly random element (used by the boss wheel landing). */
export function pickRandom<T>(arr: T[]): T | null {
  if (arr.length === 0) return null;
  return arr[Math.floor(Math.random() * arr.length)];
}
