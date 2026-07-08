// ============================================================================
// Small shared helpers: ids, dates, text.
// ============================================================================

let counter = 0;

/** Reasonably-unique id for runtime entities (characters, archive entries…). */
export function genId(prefix = 'id'): string {
  counter = (counter + 1) % 1_000_000;
  const rand = Math.random().toString(36).slice(2, 8);
  return `${prefix}_${Date.now().toString(36)}_${counter.toString(36)}_${rand}`;
}

export function nowISO(): string {
  return new Date().toISOString();
}

/** Local YYYY-MM-DD date key (used for daily chaos draw + streaks). */
export function todayKey(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Whole-day difference between two YYYY-MM-DD keys (b - a). */
export function dayDiff(aKey: string, bKey: string): number {
  if (!aKey || !bKey) return 0;
  const a = new Date(aKey + 'T00:00:00');
  const b = new Date(bKey + 'T00:00:00');
  const ms = b.getTime() - a.getTime();
  return Math.round(ms / 86_400_000);
}

// The trip's day counter and displayed clock read Indochina Time (ICT, UTC+7
// — shared by Thailand/Laos/Cambodia/Vietnam, no DST) regardless of the
// device's own timezone, so a traveler's day rolls over at midnight where
// they're actually traveling, not wherever their phone thinks it is.
const TRIP_TIMEZONE = 'Asia/Bangkok';

/** `d`'s calendar date/time as observed in Indochina Time (ICT, UTC+7). */
function ictParts(d: Date) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: TRIP_TIMEZONE,
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(d);
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value ?? 0);
  return { year: get('year'), month: get('month'), day: get('day'), hour: get('hour'), minute: get('minute'), second: get('second') };
}

/** YYYY-MM-DD calendar-day key in Indochina Time (ICT, UTC+7). */
function ictDateKey(d: Date): string {
  const p = ictParts(d);
  return `${p.year}-${String(p.month).padStart(2, '0')}-${String(p.day).padStart(2, '0')}`;
}

/** Short date, MM/DD/YY, in Indochina Time (ICT, UTC+7) (e.g. 06/29/26). */
export function shortDate(d: Date = new Date()): string {
  const p = ictParts(d);
  return `${String(p.month).padStart(2, '0')}/${String(p.day).padStart(2, '0')}/${String(p.year % 100).padStart(2, '0')}`;
}

/** 1-based trip day, counted by ICT calendar-date boundaries: day 1 is the ICT
 *  calendar date `startISO` falls on; the count rolls over at ICT midnight —
 *  not 24h-after-start, and not the device's local midnight. */
export function tripDay(startISO: string, now: Date = new Date()): number {
  const start = new Date(startISO);
  if (Number.isNaN(start.getTime())) return 1;
  return Math.max(1, dayDiff(ictDateKey(start), ictDateKey(now)) + 1);
}

/** HH:MM:SS clock in Indochina Time (ICT, UTC+7), regardless of device timezone. */
export function clockTime(d: Date = new Date()): string {
  const p = ictParts(d);
  return `${String(p.hour).padStart(2, '0')}:${String(p.minute).padStart(2, '0')}:${String(p.second).padStart(2, '0')}`;
}

export function wordCount(text?: string): number {
  if (!text) return 0;
  const trimmed = text.trim();
  if (!trimmed) return 0;
  return trimmed.split(/\s+/).length;
}

/** Human date like "Jun 22, 2026". */
export function formatDate(iso?: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatNumber(n: number): string {
  return n.toLocaleString(undefined);
}

export function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

export function pct(part: number, whole: number): number {
  if (whole <= 0) return 0;
  return clamp(part / whole, 0, 1);
}
