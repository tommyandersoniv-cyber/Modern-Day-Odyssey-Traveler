# Modern Day Odyssey 🧭

A pixel-art travel RPG for real-world Thailand. Real travel activities become quests,
real people you meet become character cards, and everything you do earns XP and fills a
permanent Archive. Built in React Native / Expo, fully **local-first and offline-first** —
no backend, no network required.

## Tech stack (as built)

| Concern | Choice |
|---|---|
| Framework | **Expo SDK 56** (managed) · React 19 · React Native 0.85 · TypeScript |
| Navigation | React Navigation v7 (Stack + Bottom Tabs + modal groups) |
| State | Zustand (in-memory) + **MMKV** (persistent, with AsyncStorage fallback) |
| Animation | React Native Reanimated 4 (worklets) |
| Graphics | react-native-svg (maps, wheel, dice) |
| Media | expo-camera · expo-image-picker · expo-image-manipulator · expo-file-system · expo-video |
| Fonts | Press Start 2P (`@expo-google-fonts/press-start-2p`) for all game UI |

> **Note on SDK version:** the original spec named SDK 51, but `create-expo-app` installs
> the current SDK (56). SDK 51 is now outdated; the app targets 56 and all native module
> APIs (MMKV v4 factory, expo-file-system new+legacy, expo-image-manipulator contextual
> API, expo-video) were written against the actually-installed v56 type definitions.

## Running it

```bash
cd OdysseyTraveler
# This machine's global npm cache had a permissions issue; use a dedicated cache:
npm_config_cache=/tmp/odyssey-npm-cache npm install

# A DEVELOPMENT BUILD is required (see below) — Expo Go is not enough:
npx expo run:ios      # or: npx expo run:android
```

### Why a dev build (not Expo Go)

`react-native-mmkv` (v4/Nitro), `react-native-reanimated` 4, `react-native-gesture-handler`,
and `react-native-screens` all ship native code that plain **Expo Go does not include**.
Build a dev client with `npx expo run:ios` / `run:android` (or EAS).

The storage layer degrades gracefully if MMKV's native module is missing (e.g. Expo Go):
it falls back to an in-memory cache mirrored to AsyncStorage, so the app never crashes —
but a dev build gives you true MMKV persistence and working animations.

### Validate without a device

```bash
npx tsc --noEmit                                   # 0 errors
npx expo export --platform ios --output-dir /tmp/x # bundles all modules via Metro
```

## Architecture

```
App.tsx                 # font load → storage hydrate → store bootstrap → navigator + overlays
src/
  types/                # all TypeScript interfaces (the contract)
  utils/                # constants (design system + game config), xp, badges, chaos,
                        #   pixelFilter, media, quests (JSON normaliser), helpers
  data/                 # the 3 provided quest JSON files (loaded as-is)
  storage/              # mmkv (native + fallback) + unified typed storage interface
  store/                # 5 Zustand stores + bootstrap
  navigation/           # RootNavigator (stack), MainTabs, typed nav hook
  components/           # ui · quests · chaos · codex · archive · map  (27 components)
  screens/              # 16 screens
```

### Data flow

- **Quests**: `useQuestStore` holds the 99 regular + 54 legacy quests (normalised from JSON).
  `useChaosStore` holds the 97 chaos quests + the boss wheel. Completing a quest persists

**Note on this public repo:** the full quest dataset (Thailand, Cambodia, Laos, Vietnam — 200+ curated location-based quests) is maintained in a private data repository and loaded at build time. This public repo ships `bangkok_sample.json`, a representative slice across all rarity tiers, so the schema and quest design are visible without publishing the complete content library.
  media to the document directory, writes an `ArchiveEntry`, awards XP, and recomputes badges.
- **XP / Level**: `useGameStore.addXP` recomputes level (10 tiers, Wanderer → Legend),
  updates the daily streak, and raises a `pendingLevelUp` signal that `AppOverlays` turns
  into the level-up cutscene. XP gains float up via `XPPopup`.
- **Badges**: recomputed after every completion — Zone (70% + category spread), City (70%),
  Region (boss done + chaos quota met + ≥5 characters + 70% region quests), Country (70% of
  all 153 standard quests). New unlocks queue into `BadgeUnlockModal`.
- **Region entry**: tapping a fresh region runs the mandatory **Boss Wheel** (3× XP boss)
  then the **1d20 Chaos Randomizer**, which locks that region's chaos requirement.

## Spec reconciliations (decisions made during the build)

1. **Boss wheel quests** — the chaos data ships **zero** quests flagged `is_boss_wheel`, but
   the spec requires 8. We designate the 2 legendary + 6 highest-impact epic chaos quests as
   the boss wheel (`BOSS_WHEEL_QUEST_IDS` in `utils/constants.ts`), each with a 3× multiplier.
2. **Badge thresholds** — used the spec's explicit badge code (zone/city/country all 70%).
   The country badge measures 70% of all 153 standard quests (regular + legacy).
3. **Camera flow** — uses `expo-image-picker` (`launchCameraAsync` / `launchImageLibraryAsync`)
   for capture + pick; simpler and more reliable than a raw `CameraView` ref.
4. **Maps** — rendered with `react-native-svg` + scaled 800×600 canvases rather than Skia
   (broader compatibility). Skia and Lottie are installed per spec but currently unused.
5. **Storage** — MMKV v4 uses the new `createMMKV` factory; wrapped with an Expo Go fallback.

## Status

`tsc` passes with 0 errors and the full app bundles through Metro (1544 modules). Every
screen in the tab bar and every modal route is implemented and wired to persistent state.
