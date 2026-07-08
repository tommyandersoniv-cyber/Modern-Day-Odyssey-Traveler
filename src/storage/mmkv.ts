// ============================================================================
// MMKV instance with a graceful Expo Go fallback.
//
// react-native-mmkv requires native code (a dev build). When the app runs in a
// context where MMKV's native module is unavailable (e.g. plain Expo Go), we
// fall back to a synchronous in-memory cache that write-through-persists to
// AsyncStorage and is hydrated from it on launch. The synchronous KV contract
// is preserved either way, so the stores never need to know the difference.
// ============================================================================

import AsyncStorage from '@react-native-async-storage/async-storage';

export interface KVStore {
  getString(key: string): string | undefined;
  set(key: string, value: string): void;
  delete(key: string): void;
  getAllKeys(): string[];
  clearAll(): void;
}

const FALLBACK_PREFIX = 'mdo:';

let kv: KVStore;
let mmkvAvailable = false;
let hydrated = false;

// ---- Try real MMKV first --------------------------------------------------
try {
  // Lazy require so a missing native module throws here rather than at import.
  // react-native-mmkv v4 (Nitro) exposes a `createMMKV` factory; `MMKV` is a type.
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { createMMKV } = require('react-native-mmkv') as typeof import('react-native-mmkv');
  const instance = createMMKV({ id: 'modern-day-odyssey' });
  // Touch the instance to force native init to surface any error now.
  instance.getString('__init_probe__');
  kv = {
    getString: (k) => instance.getString(k) ?? undefined,
    set: (k, v) => instance.set(k, v),
    delete: (k) => {
      instance.remove(k); // v4 renamed delete -> remove
    },
    getAllKeys: () => instance.getAllKeys(),
    clearAll: () => instance.clearAll(),
  };
  mmkvAvailable = true;
  hydrated = true; // MMKV is already persistent — nothing to hydrate.
} catch {
  // ---- Fallback: in-memory cache mirrored to AsyncStorage -----------------
  const cache = new Map<string, string>();
  kv = {
    getString: (k) => cache.get(k),
    set: (k, v) => {
      cache.set(k, v);
      // Fire-and-forget write-through; failures are non-fatal (offline-first).
      AsyncStorage.setItem(FALLBACK_PREFIX + k, v).catch(() => {});
    },
    delete: (k) => {
      cache.delete(k);
      AsyncStorage.removeItem(FALLBACK_PREFIX + k).catch(() => {});
    },
    getAllKeys: () => Array.from(cache.keys()),
    clearAll: () => {
      const keys = Array.from(cache.keys()).map((k) => FALLBACK_PREFIX + k);
      cache.clear();
      AsyncStorage.multiRemove(keys).catch(() => {});
    },
  };
  mmkvAvailable = false;
  // Expose the cache so hydrate() can fill it from AsyncStorage.
  (kv as KVStore & { __cache?: Map<string, string> }).__cache = cache;
}

/**
 * Hydrate the storage layer. No-op when MMKV is available (already persistent);
 * otherwise loads previously persisted values from AsyncStorage into the cache.
 * Awaited once at app launch before any store reads.
 */
export async function hydrate(): Promise<void> {
  if (hydrated) return;
  hydrated = true;
  const cache = (kv as KVStore & { __cache?: Map<string, string> }).__cache;
  if (!cache) return;
  try {
    const keys = await AsyncStorage.getAllKeys();
    const ours = keys.filter((k) => k.startsWith(FALLBACK_PREFIX));
    const pairs = await AsyncStorage.multiGet(ours);
    for (const [k, v] of pairs) {
      if (v != null) cache.set(k.slice(FALLBACK_PREFIX.length), v);
    }
  } catch {
    // Best-effort; an empty cache simply means a fresh start.
  }
}

export { kv, mmkvAvailable };
