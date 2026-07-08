# Contract — Full-app audit: bug fixes, dead-code removal, data-integrity repair

**STATUS: COMPLETE** — all A/B/C items implemented and verified (tsc clean,
integrity script 0 issues, removed-symbol grep clean, app boots in preview
with no console/bundler errors). Section D items remain open user decisions.
(Previous contract — food-dish tier rework — was COMPLETE; see log.md.)

Scope: fixes arising from the 2026-07-03 whole-app audit (architecture, bugs,
security, dead code, decision conflicts). User instruction: "propose and
implement fixes" — implementing directly, with judgment calls flagged in
section D rather than silently decided.

## A. Bug fixes (behavior changes, each one provably a defect)

- [x] A1. `toCategory()` misbuckets 57 Thailand quests: raw categories
      `Park` (19), `Scenic` (28), `Landmark` (2), `Festival` (8) are missing
      from CATEGORY_MAP so they fall to the default **'Social'** bucket (wrong
      filters/zone tints/user-quest multipliers). Fix: Park/Scenic → Adventure,
      Landmark/Festival → Culture (mirrors CARD_CATEGORY_MAP, which already
      maps them). Verify: node script shows 0 unmapped raw categories across
      all datasets falling to the default.
- [x] A2. `resetGame()` never clears the persisted `CURRENT_LOCATION` key —
      state is nulled in memory but the next app launch rehydrates the stale
      pre-reset location. Fix: persist the cleared location in resetGame.
      Verify: code path writes `{region:null,city:null,zone:null}`.
- [x] A3. Chaos XP multiplier hardcoded as `quest.xp * 2` in two places
      (useChaosStore.completeChaosQuest, ChaosCard) while the
      `CHAOS_MULTIPLIER = 2` constant sits unused. Fix: use the constant
      (identical behavior today; single source of truth going forward).
- [x] A4. Data: `TH_REG_BKK_027` (Siam Amazing Park) has zone "East Bangkok"
      but Bangkok's `zones[]` in thailand_regular_quests.json was never
      updated (only constants.ts was) — the exact invisible-quest bug class,
      currently masked because runtime uses constants.ts for Bangkok. Fix:
      add "East Bangkok" to the JSON. Verify: integrity script → 0 orphan zones.
- [x] A5. Data: Thailand meta drift is WORSE than documented — meta says 736
      vs 746 actual; per-city drift in Chiang Mai (30→33), Bangkok (32→36),
      Ayutthaya (20→21), Nakhon Pathom (6→7), Doi Mae Salong (8→7); Phetchabun
      missing from meta entirely. (progress.md claimed these were recomputed —
      they weren't.) Meta is confirmed unused at runtime; fixing anyway so the
      files are self-consistent and future integrity checks are signal, not
      noise. Fix: recompute meta for all 4 regular-quest JSONs. Verify:
      integrity script → 0 META issues.
- [x] A6. `completed_at` on quests is lost on every app restart
      (loadQuestsFromJSON only restores completed/status, not completed_at),
      which silently breaks "most-recent first" ordering in the temple-ranking
      picker after a reload. Fix: restore completed_at from archive entries
      during load. Verify: code reads ARCHIVE_ENTRIES and stamps completed_at.

## B. Dead code removal (no behavior change; `tsc --noEmit` stays clean)

- [x] B1. badges.ts: `checkZoneBadge`, `checkCityBadge`, `checkRegionBadge`,
      `checkCountryBadge`, `getRegionQuestCompletionPct` — never called; they
      encode the OLD PRD badge model that conflicts with the live model in
      `recomputeBadges` (region = all cities medaled). Remove + fix the stale
      header ("regular 99 + legacy 54 = 153").
- [x] B2. storage.ts: `ZONE_BADGES`/`CITY_BADGES` keys never read or written —
      remove. Register the chaos-completions key properly: add
      `COMPLETED_CHAOS: 'completed_quest_ids_chaos'` (same string the store
      already composes ad-hoc via `KEYS.COMPLETED_QUESTS + '_chaos'` — no
      migration needed) and use it in useChaosStore.
- [x] B3. types/index.ts: remove now-orphaned `ZoneBadge`/`CityBadge` types.
- [x] B4. useChaosStore: the entire daily-draw subsystem is unreachable — no
      screen calls `drawDaily`/`hasDrawnToday` or reads `can_request_more`;
      TodayScreen only uses `drawOnDemand`. Remove: drawDaily, hasDrawnToday,
      daily_draw_date, daily_draw_quest_id, can_request_more, the `wasDaily`
      branch in completeChaosQuest, and storage keys DAILY_CHAOS_DATE /
      DAILY_CHAOS_ID / CAN_REQUEST_MORE_CHAOS. (Note: the ICT-timezone session
      justified keeping `todayKey()` device-local because it "drives the
      daily-chaos-draw reset" — that consumer was already dead; todayKey
      remains alive for streaks.)
- [x] B5. Delete never-imported component files: `components/ui/ModeToggle.tsx`
      (mode switch moved to Travel-Dex), `components/map/QuestMarker.tsx`.
- [x] B6. constants.ts: remove dead `BUCKET_LIST_QUEST_IDS` (superseded by the
      legendary/mythic hall filter), `cityMetaFor` (superseded by
      worldCityMeta), `ZONE_PIN_COLORS` + `zonePinColor`, `CARD_TIER_ORDER`.
      Fix the stale MYTHIC comment ("Not yet a QuestRarity member… until
      Vietnam/Cambodia are built out" — both false now).
- [x] B7. Replace deprecated `thaiRegions()` alias with `builtInRegions()` in
      its 3 call sites (CreateQuestScreen, CreatePlaceScreen, QuestLogScreen);
      remove the alias from world.ts.
- [x] B8. MapScreen RegionDetailView: remove the unused `activeIds` store
      subscription (dead variable causing pointless re-renders).

## C. Misleading-comment fixes (docs-in-code that contradict reality)

- [x] C1. bootstrap.ts "a new day every 24h from this moment" → ICT
      calendar-day semantics; quests.ts "(153)" count; FoodHallView "Both
      countries" header (it's four now).

## D. Flagged, NOT fixed — user judgment required (none block usage)

- **Food-tier drift vs contract**: the KH/VN gap-fill sessions added many Food
  quests AFTER the tier cutoffs were calibrated. Cambodia is now
  common=56/rare=44/unique=8 (contract said 9/42/8); Vietnam 32/58/15 (was
  13/50/15). The mechanism is intact and every tier still exceeds the max die
  roll of 6, so nothing softlocks — but the balance shifted heavily toward
  Common. Recalibrating cutoffs is a content/balance call.
- **282 Thailand quests with null coordinates** (0 in the other 3 countries) —
  pre-existing; can't be fixed without inventing GPS data.
- **TRIP_START not cleared by RESET GAME** — the "DAY N" counter survives a
  full reset. Arguably correct (it tracks the real-life trip, not the save);
  say the word and it becomes part of resetGame.
- **offbeat_seasia_destinations.json** — never imported; its referencing
  comment claimed it would wire in "when Vietnam/Cambodia are built" (they
  are). Kept the file (may be future content), fixed the comment.
- **dist/** — stale June 23 web build checked into the tree; Netlify builds
  fresh via netlify.toml anyway. Delete or rebuild at will.
- **`* copy.md` files** — blank templates, not stale duplicates. Left alone.
- **QuestLogScreen uses RN `Alert.alert`** for "INVENTORY FULL" / "CANNOT ADD"
  feedback — Alert is a no-op on web (the Netlify build), so on web the ADD
  button silently does nothing when the bag is full. The reset flow already
  solved this same problem with a PixelModal; the same treatment fits here.
- **No version control** — a 15k-line, 2MB-data project with zero git history.
  A pre-edit backup was made to the session scratchpad before this pass.
  Strongly recommend `git init` + first commit.

## Verify

- [x] V1. `tsc --noEmit` clean after all edits.
- [x] V2. Integrity script re-run: 0 meta issues, 0 orphan zones, 0 duplicate
      ids, 0 region-key collisions, 0 unmapped categories.
- [x] V3. Grep proves no references remain to any removed symbol.
- [x] V4. Item-by-item grading of this checklist in progress.md.
