// ============================================================================
// geo — project real-world {lat,lng} coordinates into the 800x600 map canvas.
//
// The map screens (city quest pins, region "More" city markers) reuse the same
// CityMap canvas, so we fit a set of coordinates to that pixel space. The
// projection is aspect-correct (longitude is compressed by cos(latitude) so a
// city isn't stretched) and north-up (max latitude sits at the top).
// ============================================================================

import type { Coord } from '../types';
import { CITY_CANVAS } from './constants';

export interface ProjectedPoint {
  x: number;
  y: number;
}

export interface ProjectOptions {
  /** Inset from the canvas edge, in canvas px. */
  pad?: number;
  width?: number;
  height?: number;
}

/**
 * Project `coords` into canvas px, preserving order. Empty input → []. A single
 * point (or a zero-span axis) is centred so it never collapses to a corner.
 */
export function projectCoords(coords: Coord[], opts: ProjectOptions = {}): ProjectedPoint[] {
  const W = opts.width ?? CITY_CANVAS.width;
  const H = opts.height ?? CITY_CANVAS.height;
  const pad = opts.pad ?? 90;
  if (coords.length === 0) return [];

  const lats = coords.map((c) => c.lat);
  const lngs = coords.map((c) => c.lng);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);
  const meanLat = (minLat + maxLat) / 2;

  // Equal-ground-distance world units: compress longitude by cos(latitude).
  const kx = Math.cos((meanLat * Math.PI) / 180) || 1;
  const wx = (c: Coord) => c.lng * kx;
  const wy = (c: Coord) => c.lat;

  const minWx = minLng * kx;
  const maxWx = maxLng * kx;
  const spanWx = maxWx - minWx;
  const spanWy = maxLat - minLat;

  const usableW = W - pad * 2;
  const usableH = H - pad * 2;

  // Uniform scale that fits the larger span; degenerate spans fall back so the
  // other axis still spreads out.
  const sx = spanWx > 0 ? usableW / spanWx : Infinity;
  const sy = spanWy > 0 ? usableH / spanWy : Infinity;
  let scale = Math.min(sx, sy);
  if (!Number.isFinite(scale)) scale = 0; // all points identical → centre them

  // Centre the scaled bounding box within the usable area.
  const drawW = spanWx * scale;
  const drawH = spanWy * scale;
  const offX = pad + (usableW - drawW) / 2;
  const offY = pad + (usableH - drawH) / 2;

  return coords.map((c) => ({
    x: spanWx > 0 ? offX + (wx(c) - minWx) * scale : W / 2,
    // North (max latitude) at the top → invert the y axis.
    y: spanWy > 0 ? offY + (maxLat - wy(c)) * scale : H / 2,
  }));
}
