// ============================================================================
// Pixelisation filter for Character Codex avatars.
//
// Technique (per PRD): downscale hard to 64x64 to destroy fine detail, then
// scale back up to 320x320. The two-step resize yields a chunky, low-res
// pixel-art look from any source photo. Works with both the modern contextual
// ImageManipulator API and the legacy `manipulateAsync` fallback.
// ============================================================================

import * as IM from 'expo-image-manipulator';

const DOWN = 64;
const UP = 320;

export async function pixelizePhoto(uri: string): Promise<string> {
  if (!uri) return uri;
  try {
    const SaveFormat = (IM as any).SaveFormat ?? { JPEG: 'jpeg' };
    const Manipulator = (IM as any).ImageManipulator;

    // ---- Modern contextual API --------------------------------------------
    if (Manipulator && typeof Manipulator.manipulate === 'function') {
      const downCtx = Manipulator.manipulate(uri);
      downCtx.resize({ width: DOWN, height: DOWN });
      const downRef = await downCtx.renderAsync();
      const downImg = await downRef.saveAsync({ format: SaveFormat.JPEG, compress: 1 });

      const upCtx = Manipulator.manipulate(downImg.uri);
      upCtx.resize({ width: UP, height: UP });
      const upRef = await upCtx.renderAsync();
      const upImg = await upRef.saveAsync({ format: SaveFormat.JPEG, compress: 1 });
      return upImg.uri;
    }

    // ---- Legacy API --------------------------------------------------------
    const manipulateAsync = (IM as any).manipulateAsync;
    if (typeof manipulateAsync === 'function') {
      const small = await manipulateAsync(uri, [{ resize: { width: DOWN, height: DOWN } }], {
        compress: 1,
        format: SaveFormat.JPEG,
      });
      const big = await manipulateAsync(small.uri, [{ resize: { width: UP, height: UP } }], {
        compress: 1,
        format: SaveFormat.JPEG,
      });
      return big.uri;
    }
  } catch {
    // Fall through — return the original so the flow never blocks on filtering.
  }
  return uri;
}
