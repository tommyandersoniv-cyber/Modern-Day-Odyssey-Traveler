// ============================================================================
// Media persistence — copies picked/captured photos & videos into the app's
// document directory so they survive beyond the OS cache.
//
// Layout (per PRD):
//   {doc}/odyssey/photos/{questId}/{timestamp}.jpg
//   {doc}/odyssey/videos/{questId}/{timestamp}.mp4
//   {doc}/odyssey/codex/photos/{characterId}_original.jpg
//   {doc}/odyssey/codex/avatars/{characterId}_pixel.jpg
//
// Every operation is best-effort: on any failure we return the original source
// URI so a flow is never blocked by a copy error (offline-first).
// ============================================================================

import * as FileSystem from 'expo-file-system/legacy';

const ROOT = (FileSystem.documentDirectory ?? '') + 'odyssey/';

async function ensureDir(uri: string): Promise<void> {
  try {
    const info = await FileSystem.getInfoAsync(uri);
    if (!info.exists) {
      await FileSystem.makeDirectoryAsync(uri, { intermediates: true });
    }
  } catch {
    // ignore — copy below will surface real problems and fall back
  }
}

function extOf(uri: string, fallback: string): string {
  const clean = uri.split('?')[0];
  const dot = clean.lastIndexOf('.');
  if (dot === -1 || dot < clean.length - 6) return fallback;
  return clean.slice(dot + 1);
}

async function copyInto(dir: string, filename: string, srcUri: string): Promise<string> {
  if (!FileSystem.documentDirectory || !srcUri) return srcUri;
  try {
    await ensureDir(dir);
    const dest = dir + filename;
    await FileSystem.copyAsync({ from: srcUri, to: dest });
    return dest;
  } catch {
    return srcUri;
  }
}

let seq = 0;
function stamp(): string {
  seq = (seq + 1) % 100000;
  return `${Date.now()}_${seq}`;
}

export async function persistQuestPhoto(questId: string, srcUri: string): Promise<string> {
  const dir = `${ROOT}photos/${questId}/`;
  return copyInto(dir, `${stamp()}.${extOf(srcUri, 'jpg')}`, srcUri);
}

export async function persistQuestVideo(questId: string, srcUri: string): Promise<string> {
  const dir = `${ROOT}videos/${questId}/`;
  return copyInto(dir, `${stamp()}.${extOf(srcUri, 'mp4')}`, srcUri);
}

export async function persistQuestPhotos(questId: string, uris: string[]): Promise<string[]> {
  return Promise.all(uris.map((u) => persistQuestPhoto(questId, u)));
}

export async function persistQuestVideos(questId: string, uris: string[]): Promise<string[]> {
  return Promise.all(uris.map((u) => persistQuestVideo(questId, u)));
}

export async function persistCharacterOriginal(characterId: string, srcUri: string): Promise<string> {
  const dir = `${ROOT}codex/photos/`;
  return copyInto(dir, `${characterId}_original.${extOf(srcUri, 'jpg')}`, srcUri);
}

export async function persistCharacterAvatar(characterId: string, srcUri: string): Promise<string> {
  const dir = `${ROOT}codex/avatars/`;
  return copyInto(dir, `${characterId}_pixel.${extOf(srcUri, 'jpg')}`, srcUri);
}
