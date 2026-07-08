# Progress

## Full-app audit → fixes: 6 bugs, dead-code purge, data repair (DONE, verified in-app)

**Status:** Complete. See contract.md for the graded item-by-item checklist (all A/B/C items pass; section D = open user decisions). User asked for a whole-app review of architectural inconsistencies, bugs, security gaps, dead code, and decision conflicts, then to propose + implement fixes.

### Bugs fixed
1. **57 Thailand quests were in the wrong category bucket** — raw categories Park (19) / Scenic (28) / Landmark (2) / Festival (8) were missing from CATEGORY_MAP and silently defaulted to 'Social'. Now Park/Scenic→Adventure, Landmark/Festival→Culture (matching what CARD_CATEGORY_MAP already did).
2. **RESET GAME left the pre-reset location in storage** — next launch rehydrated it. resetGame now persists the cleared location.
3. **Chaos 2× multiplier was hardcoded in 2 places** while CHAOS_MULTIPLIER sat unused — now single-sourced (no behavior change).
4. **Bangkok's zones[] in the JSON was missing "East Bangkok"** (only constants.ts got it in the gap-fill session) — the invisible-quest bug class, latent because runtime uses constants for Bangkok. Fixed in data.
5. **Thailand meta drift was worse than documented** (736 vs 746; 5 cities' per-city counts wrong; Phetchabun absent) — the earlier session's "recomputed meta" claim was false for per-city counts. Recomputed everything; note meta is provably unused at runtime (only Laos/KH/VN were already correct).
6. **completed_at was lost on every restart** (only completed/status were rehydrated), silently breaking recency order in the temple-ranking picker — now restored from archive entries at load.

### Dead code removed (tsc clean before and after)
- The **entire old PRD badge model** (checkZoneBadge/checkCityBadge/checkRegionBadge/checkCountryBadge/getRegionQuestCompletionPct + ZoneBadge/CityBadge types + ZONE_BADGES/CITY_BADGES storage keys) — it conflicted with the live medal/jigsaw model in recomputeBadges and nothing called it.
- The **entire daily-chaos-draw subsystem** (drawDaily/hasDrawnToday/can_request_more + 3 storage keys) — unreachable from any screen; TodayScreen only ever used drawOnDemand. Notably, the ICT-timezone session's stated reason for keeping todayKey() device-local was this dead feature (todayKey stays — streaks still use it).
- Dead files ModeToggle.tsx + QuestMarker.tsx; dead constants BUCKET_LIST_QUEST_IDS, cityMetaFor, ZONE_PIN_COLORS/zonePinColor, CARD_TIER_ORDER; dead keys STREAK_DAYS/LAST_ACTIVITY; deprecated thaiRegions alias (3 call sites → builtInRegions); unused activeIds subscription in MapScreen; chaos-completions key registered properly as KEYS.COMPLETED_CHAOS (same string — saves unaffected).
- Misleading comments fixed (bootstrap "24h" day counter, "(153)" quest count, "Both countries" food hall, stale MYTHIC/offbeat note).

### Flagged, NOT fixed (user decisions — see contract.md §D)
- **Food-tier drift**: KH/VN gap-fills added food quests after tier cutoffs were calibrated — Cambodia now 56/44/8 common/rare/unique (contract said 9/42/8), Vietnam 32/58/15 (was 13/50/15). No softlock (every tier > max die 6) but balance shifted hard toward Common. Recalibrating cutoffs is a content call.
- 282 Thailand quests with null coordinates (0 elsewhere); TRIP_START surviving RESET GAME; unused offbeat_seasia_destinations.json; stale dist/ build; blank `* copy.md` templates; QuestLogScreen's Alert.alert being a no-op on web (INVENTORY FULL feedback invisible); **no version control** — pre-edit backup in session scratchpad; git init strongly recommended.

### Verified
- `tsc --noEmit` clean; integrity script (meta/dup-ids/orphan-zones/region-collisions/coords/categories/tiers) → 0 issues; grep proves 0 references to removed symbols.
- Live in preview: onboarding → SEA board (4 countries, Odyssey gates intact) → Today (ICT date, DAY 1, 2,274 regular avail, 464 food avail = 147 TH + 104 LA + 108 KH + 105 VN) → chaos draw works via refactored store, card shows "2× 1,000 XP". No console errors (only pre-existing RN-web pointerEvents deprecation warnings).

## Cambodia quest audit + 57-quest gap-fill: 2 new cities (DONE, verified in-app)

**Status:** Complete. Audit was thorough — most of Cambodia's data already exceeds the source audit (extra Angkor temples, extra festivals not in the checklist at all). Real gaps were much smaller in proportion than Laos/Vietnam.

### What shipped
- **2 new cities**: Sihanoukville & Koh Kong (South Coast region, 8 quests — the food audit treats this as its own coastal region with a distinct beach/seafood identity that had zero city representation before; only Koh Kong's mangrove interior existed via Cardamom Mountains) and Takeo (Central Cambodia, 2 quests — Phnom Chisor and the Angkor Borei boat trip already existed under Phnom Penh's day-trips, but Takeo town itself and the Takeo–Angkor Borei canal route had no home).
- **55 new quests in existing cities**: Phnom Penh (18 — the food audit's largest single region), Siem Reap & Angkor (13), Battambang (6), Kampot & Kep (4), Mondulkiri (2), Ratanakiri (1), Cardamom Mountains (1: Andoung Teuk), Kratie & Stung Treng (1: Koh Han), Kampong Thom & Central Lowlands (1: Kampong Cham riverside promenade).
- **Adapted the script to Cambodia's schema, not the Laos/Vietnam one** — Cambodia has no `quest_type` field, uses a 2-segment id (`KH_<CITY>_<NUM>` vs Laos/Vietnam's 3-segment `<CC>_<REGION>_<CITY>_<NUM>`), and a narrower 8-category vocabulary (Adventure, Cultural, Food, Market, Museum, Nature, Spiritual, Temple — no Heritage/Slow Travel/Viewpoint). Checked this before writing any quests rather than assuming the Laos template applied unchanged.
- Recomputed `meta.total_quests_by_city`, `total_quests` (212→269), and `country_badge_quest_requirement`.

### Verified
- `tsc --noEmit` clean.
- Node integrity check: 269 total quests, 0 duplicate ids, 0 orphaned zones, 0 invalid categories, all city regions match `cambodia.ts`'s 8 defined regions.
- Live in preview: South Coast region now shows 3 cities (was 2); "Sihanoukville & Koh Kong" renders its zone map correctly (Beaches & Night Markets / Koh Kong Coast) with 0/8 quests. No console/bundler errors.

## Vietnam quest audit gap-fill: 44 new quests + 6 new cities (DONE, verified in-app)

**Status:** Complete. Follow-on to the Vietnam audit from the previous session — user confirmed "they can have their own cities" for the provinces with no city representation, then said to gap-fill the same way as Laos.

### What shipped
- **6 new cities** added to `vietnam_regular_quests.json` (derived automatically into `VIETNAM_REGIONS`/`VIETNAM_CITIES` — `vietnam.ts` computes both live from the JSON, so no code changes were needed): Soc Trang (4 quests: Kh'Leang Temple, Bun Nuoc Leo, Banh Cong, Nga Nam Floating Market), Tra Vinh (2: Ang Pagoda, Khmer Culture Walk), Hau Giang (1: Nga Bay Floating Market) — all Mekong Delta; Bac Ninh (But Thap Pagoda), Thai Binh (Keo Pagoda), Hung Yen (Chuong Temple) — all Northern Vietnam, one temple each.
- **34 new quests in existing cities**, closing every gap from the audit: Hanoi (9 food dishes + Quan Su Pagoda + Giong Festival + Vu Lan), Lao Cai/Sapa (4: Sapa salmon, corn porridge, Black Hmong rice wine ceremony, Coc Ly Market), Ha Long (Yen Tu Mountain & Pagoda Complex — kept in Ha Long rather than a new city since it's the same province), Ha Giang (highland foraged bitter vegetable soup), Hue (5 food dishes), Hoi An (Mi Quang Hoi An style, Banh Dap), Da Lat (Banh Can, Linh Phuoc/Linh Son temples, Thit Rung), Ho Chi Minh City (Xa Loi Pagoda, Ben Thanh Night Market, 4 food dishes).
- **Handled the two ethically/legally sensitive dishes flagged in the audit factually, not by omission**: Thit Cho (dog meat, Hanoi) and Thit Rung (wild game, Da Lat) both got quests with descriptions that state the controversy/legal caveat directly, rather than silently dropping them or writing them as uncomplicated recommendations.
- Recomputed `meta.total_quests_by_city`, `total_quests` (509→553), and `country_badge_quest_requirement` the same way as the Laos pass.

### Verified
- `tsc --noEmit` clean.
- Node integrity check: 553 total quests, 0 duplicate ids, 0 orphaned zones, all 6 new cities' region keys (Mekong Delta / Northern Vietnam) match `vietnam.ts`'s 5 defined regions exactly — confirmed no code changes were needed for the new cities to appear.
- Live in preview: Mekong Delta region now shows 13 cities (was 10); Soc Trang (0/4), Tra Vinh (0/2), Hau Giang (0/1) all render with correct counts; opened Soc Trang's zone map, confirmed "Kh'Leang Temple" renders correctly (TEMPLE badge, RARE, 900 XP). No console/bundler errors.

## Laos quest audit + 40-quest gap-fill (DONE, verified in-app)

**Status:** Complete. Two-phase: (1) audit — cross-referenced the user's external Laos_Activities_Audit / Laos_Food_Audit docs against the app's `laos_regular_quests.json` and `laos_food_quests.json`; (2) gap-fill — user reviewed the gap report and said "turn all of those into new quests," including the ambiguous ones, without needing exact restaurant names.

### Audit findings
- Food audit: all 100 dishes matched existing game data — zero gaps.
- Activities audit: most cities matched 1:1. Real gaps concentrated in Luang Prabang temples (as expected — heavy temple density), plus scattered items in Muang Sing, Luang Namtha, Vientiane, Vang Vieng, Vieng Xai, Pakse, Champasak, and Savannakhet. One item ("Kong Phanang Panorama & Tham Pulan Caves") was a **misplacement**, not a missing quest — it existed in the data but filed under Thakhek instead of Savannakhet (coordinates put it ~30km from Savannakhet vs ~130km from Thakhek's loop area).
- Cross-checked against a separate `laos_quests_complete_updated.json` found in the user's source folder — confirmed it was the same lineage as the app's committed data (identical gaps), not an un-imported newer source. This ruled out "just re-import" as a fix.

### Gap-fill: 40 new quests + 1 relocation
- Added via a one-off Node script (`add_laos_quests.js`, run once against `laos_regular_quests.json` then discarded) rather than 40 manual edits — safer for id/zone consistency at this volume.
- Every new quest's `zone` was checked against its city's declared `zones[]` before writing (this exact bug — a quest zone not in the city's zone list making it invisible on the map — was found and fixed for Bangkok in an earlier session, so verified defensively this time).
- Recomputed `meta.total_quests_by_city`, `total_quests`, and `country_badge_quest_requirement` from the real array (361→401 quests). This also fixed a pre-existing meta/array drift as a side effect — meta previously said 369 total while the array actually had 361.
- **Judgment calls made without re-asking** (per the user's "you don't have to name the exact restaurant... just make new quests" instruction):
  - Vat Boun Huang placed in Luang Namtha, not Muang Sing (audit's own description ties it to the Nam Tha River cruise route).
  - Wat Muang Kang placed in Champasak, not Pakse (audit describes it as Champasak-province, pre-Angkorian).
  - Restaurant-specific quests (Vieng Xai "Sabaidee Odisha", Sam Neua "Dan Nao Meuang Xam") generalized to "Local Restaurant Dinner Quest" / "Local Restaurant & Scooter Hire Quest" rather than naming the exact business.
  - Ambiguous "possible duplicate" temples (Wat Xieng Chai, Houayxay's 3-wat circuit split, Wat Sainyaphum) all got their own quest entries per the user's explicit instruction, with descriptions that acknowledge the overlap rather than hiding it.
  - Coordinates: used real-world approximate knowledge for well-documented UNESCO-zone Luang Prabang temples; used city-center coordinates as an honest fallback for lesser-known additions rather than inventing false GPS precision.

### Verified
- `tsc --noEmit` clean.
- Node integrity check: 401 total quests, 0 duplicate ids, 0 orphaned zones (every quest's zone exists in its city's declared zone list).
- Live in preview: Luang Prabang shows 44 quests (was 30) including "Royal Palace / Haw Kham (National Museum)" rendering correctly (EPIC, 1,200 XP, HERITAGE badge); Savannakhet shows 27 quests (was 24) with "Kong Phanang Panorama & Tham Pulan Caves" now correctly appearing under its Mekong Riverfront zone instead of Thakhek. No console/bundler errors.

## Food-dish tier rework (Common/Rare/Unique) + Odyssey food-hall dice roll (DONE, verified in-app)

**Status:** Complete. See contract.md for the full checklist (all items pass) — this took several rounds of clarification before any code was written, since the content mapping and tier count both needed real confirmation (per the user's own explicit request).

### What shipped
- **New 3-tier food-dish system** replacing Must-Try/Nice-to-Try/If-You-Have-Time/One-of-One: Common (gray, 500xp) / Rare (blue, 1000xp) / Unique (gold, 2000xp). Migrated Thailand (147 dishes, from is_must_try/is_unique flags) and Laos (104 dishes, from tier_1-4) exactly per confirmed mapping. Retrofitted Cambodia (59) and Vietnam (78) Food-category quests too, using each country's own XP natural-break cutoffs (their location-quest rarity had zero legendary/mythic Food items, which would have made the Unique die's target permanently unmeetable).
- New `Quest.food_tier` field, kept deliberately separate from `rarity` — Cambodia/Vietnam's Food quests are still real location quests (region XP, leveling, QuestCard styling all keyed to their original `rarity`/`xp`); only Thailand/Laos's true dish-pool quests (never rendered via QuestCard) had `rarity`/`xp` directly overwritten to the new tier values.
- `FoodCard`/`FoodTradingCard` recolored by tier (gray/blue/gold) via new `foodTierPalette()`, replacing the old xp-threshold Gengar-purple/baby-blue split (which would have wrongly merged Rare and Unique into one bucket now that both sit ≥1000xp).
- **New Food Hall dice roll** (Odyssey mode only): first entry into a country's Food Hall auto-rolls 3 d6, one per tier, tier-colored; result = dishes-to-complete target, persisted forever per country (`useGameStore.food_hall_rolls`), never re-rolled. Live progress (`x/N`) shown per tier; "FOOD QUEST COMPLETE" when all 3 met. New `FoodHallDiceBanner` component works uniformly across all 4 countries.

### Files changed
`types/index.ts`, `utils/constants.ts`, `utils/quests.ts`, `utils/food.ts`, `store/useGameStore.ts`, `store/useQuestStore.ts`, `storage/storage.ts`, `screens/TodayScreen.tsx`, `screens/map/FoodHallView.tsx`, `components/quests/FoodCard.tsx`, `components/quests/QuestTradingCard.tsx`, new `components/quests/FoodHallDiceBanner.tsx`.

### Flagged, not done
- Dice-roll progress isn't wired into `country_badges` completion — it's a standalone tracker in the Food Hall. Say if you want "food quest complete" to count toward country conquest.
- User mentioned a separate future audit to confirm all countries' food/activity quests are fully represented in the codebase — explicitly deferred, not part of this round.

### Verified
- `tsc --noEmit` clean throughout.
- Node script confirmed exact tier counts per country against the confirmed mapping (Thailand 25/94/28, Laos 15/63/26, Cambodia 9/42/8, Vietnam 13/50/15).
- Live in preview: confirmed dice don't roll/show in Exploration mode; switched to Odyssey via the Travel-Dex toggle; Thailand Food Hall rolled Common=6/Rare=6/Unique=4; full page reload preserved the identical roll (also confirmed via localStorage dump); Common/Rare/Unique cards render gray/blue/gold respectively; Cambodia's retrofitted "Fish Amok" quest still shows its original 800 XP under a RARE tier stamp (rarity/xp correctly untouched for retrofitted countries).

## Legendary Quests halls → Food-Hall-style collectible cards (DONE, verified in-app)

**Status:** Complete. Follow-on to the rarity rework below — user said they like the halls being sparser and asked for the per-country Legendary Quests hall to visually match the Food Hall's collectible cards, with an emoji per activity type.

### What shipped
- New `QuestCollectibleCard` (`components/quests/QuestCollectibleCard.tsx`), modeled directly on `FoodCard`: full-bleed rarity-tinted background, header band (rarity label + xp), big category emoji, title + category footer, COLLECTED stamp when done.
- New `RARITY_CARD_PALETTE` (`utils/constants.ts`) — one background/edge/band/text palette per rarity tier (rare=navy/blue, epic=amber/gold, legendary=deep purple, mythic=near-white/silver — a deliberate "foil card" look for the rarest tier, distinct from the dark cards below it).
- New `cardCategoryEmoji()` + `CARD_CATEGORY_EMOJI` map — one emoji per the 8 category badge buckets (🛕 Temple, 🏞️ Nature, 🛍️ Market, 🧗 Adventure, 🏛️ Heritage, 🎭 Culture, 🖼️ Museum, 🍜 Food).
- `MapScreen.tsx`'s per-country Legendary Quests hall now renders a 2-column `QuestCollectibleCard` grid (same width math as `FoodHallView`) instead of a vertical `QuestCard` list. Matches Food Hall UX: tapping opens quest detail; no inline "add to inventory" action in the hall itself (mirrors how the Food Hall already behaves — add happens from the detail screen).

### Verified
- `tsc --noEmit` clean.
- Live in preview: Vietnam's hall (4 Adventure/cave quests) renders as a legendary-purple 2-column grid; Laos's hall shows the mix correctly — legendary purple cards next to one mythic near-white card (Long Tieng, 25,000 XP, Heritage 🏛️) — visually distinct as intended. Tapped a card, confirmed it opens `QuestDetailScreen` with the right quest. No console/bundler errors.

## Rarity rework (xp-based) + 8-category badge stamp (DONE, verified in-app)

**Status:** Complete. See contract.md for the full checklist (all items pass).

### What shipped
- **Rarity** now computed from xp for every location-based quest (regular/legacy/chaos), replacing the hand-authored tiers: `xp>10000→mythic`, `>5000→legendary`, `>=1000→epic`, `<1000→rare`. Lives in `rarityFromXP()` (`utils/constants.ts`), applied in `baseNormalise()` (`utils/quests.ts`). The two food-dish pools (Thai food regions, Laos dish tiers) are untouched — they never call `baseNormalise`.
- **Card color** (`components/quests/QuestCard.tsx`): Food category → pastel purple (`#b18ce0`) regardless of rarity; otherwise accent = `RARITY_COLOR[rarity]` (mythic=white, legendary=`#4B2E7A` dark purple, epic=gold, rare=blue). `QuestTradingCard`'s separate bronze/silver/gold/platinum/rare material-tier system (by xp, a distinct mechanic) is untouched.
- **Category badge stamp**: new 8-bucket taxonomy (Temple/Nature/Market/Adventure/Heritage/Culture/Museum/Food), independent of the existing 5-bucket `category` field used for filters/multipliers. New `Quest.card_category` field (`types/index.ts`), computed via `toCardCategory()` (`utils/constants.ts`) from the raw category string at load time. Rendered as a small bottom-right stamp on `QuestCard`, gated off for chaos quests (behavioral, not location-based).

### Flagged consequence, addressed
- MapScreen's per-country "Legendary Quests" hall (`rarity === 'legendary'` filter) shrinks hard under the new scheme (Cambodia 43→4, Vietnam 39→4, Thailand 32→18, Laos 29→8) since 'legendary' is no longer the top tier. Widened the filter to `legendary || mythic` (`screens/MapScreen.tsx`) so the halls stay meaningful — flagged, not silently absorbed.

### Files changed
`src/types/index.ts`, `src/utils/constants.ts`, `src/utils/quests.ts`, `src/screens/MapScreen.tsx`, `src/screens/TodayScreen.tsx`, `src/screens/map/FoodHallView.tsx`, `src/components/quests/QuestCard.tsx`.

### Verified
- `tsc --noEmit` clean.
- Node script over all 6 quest data files: new tier counts mythic=1 / legendary=44 / epic=945 / rare=892; sampled one quest per tier confirming rarity + card_category resolve correctly.
- Live in preview (shared `expo-web-laos` dev server, port 8083): computed-style checks confirmed exact accent colors — epic `rgb(255,215,0)`, legendary `rgb(75,46,122)`, food `rgb(177,140,224)` — and category stamps (MARKET, CULTURE, FOOD, NATURE, ADVENTURE) rendering bottom-right on real cards. No console/bundler errors.

## Four cross-page fixes: Vietnam tab sizing, chaos browse, region-visited, ICT timezone (DONE, verified)

**Status:** Complete. Both flagged assumptions confirmed true before implementing (see below).

### 1. Map — Vietnam tile sizing (`src/utils/countries.ts`)
Root cause confirmed content-driven, not component-driven: `WorldMap.tsx`'s `CountryBox` is one shared component for all 4 countries with zero per-country conditional styling — the only variable is `country.layout` (pure data). Vietnam's box had `h:82` vs siblings' `h:44-46` (a leftover "tall tile for a tall country" layout from when Vietnam was added). Replaced all 4 countries' layouts with a uniform `w:32 h:40` 2x2 grid (Thailand/Laos top row, Cambodia/Vietnam bottom row) via shared `COUNTRY_TILE_W`/`COUNTRY_TILE_H` constants, so future countries can't silently drift in size either. Verified live: all 4 tiles visually identical in size/shape.

### 2. Today — Browse chaos quests (`src/screens/TodayScreen.tsx`)
**Assumption confirmed:** chaos quests already exist as a fully-defined entity (`useChaosStore.chaos_pool`, 122 Thailand chaos quests, own `type:'chaos'`, own active/completed tracking) — did not need to invent anything. Better still: `QuestLogScreen` already fully supports `inventoryType:'chaos'` browsing (filters, category grouping, status) — it just had no entry point from Today. Added a "BROWSE" button next to "DRAW A CHAOS QUEST" (same row-pattern as the regular/food sections above it) navigating to `QuestLog` with `{ inventoryType: 'chaos' }`. Zero new screens/logic — pure wiring.

### 3. Travel Deck — Auto-mark regions visited (`src/screens/TravelerDexScreen.tsx`)
**Assumption confirmed:** `quest.region` (and `ArchiveEntry.region`, copied straight from it) is unambiguously the macro-region field (e.g. Vietnam's "Northern Vietnam"/"Central Highlands"/etc.) — there is no separate `country` field on `Quest` at all; country is only ever derived via `countryForRegionKey(region)` lookup. Confirmed via both `baseNormalise` code and live Vietnam data.
Root cause: the "COUNTRIES / REGIONS / CITIES" stat's Countries and Cities numbers were already correctly computed as "≥1 completed quest there" (via distinct `archiveEntries.map(e => e.city/countryOf(e.region))`) — but Regions used a completely different, stricter measure: `regionBadges.filter(b => b.unlocked).length`, which requires FULL badge completion (70%+ city-medal jigsaw), not just a visit. Fixed by computing `regionsVisited` the same way as its siblings (distinct `entries.map(e => e.region)`, filtered through `isOdysseyCountryRegion` to exclude the Cross-Region/legendary-hall sentinel keys that chaos and legendary-hall completions carry). The stricter "region badge complete" concept still exists untouched (`regionBadges`/`unlocked`) and still drives the separate jigsaw gold-border achievement view — visited and complete are now two distinct, correctly-separated concepts.
**Proof the fix changed real behavior (not coincidental):** inspected live persisted state — 2 completed quests, both in "Central Thailand", whose region badge is `unlocked: false`. Old logic would show 0 regions; new logic correctly shows 1 (visited). Confirmed live in the running app.

### 4. Today — ICT day counter + clock (`src/utils/helpers.ts`)
Root cause: `shortDate()`/`tripDay()`/`clockTime()` all used device-local `Date` getters (`getMonth()`/`getDate()`/`getHours()`, etc.) — a US-device user's day counter and displayed date were rolling over at US-local midnight, not Indochina Time. Added `TRIP_TIMEZONE = 'Asia/Bangkok'` (ICT, UTC+7, no DST — shared by Thailand/Laos/Cambodia/Vietnam) + an `ictParts()`/`ictDateKey()` helper pair using `Intl.DateTimeFormat` with `hourCycle:'h23'` (avoids the midnight-renders-as-"24" Intl quirk). Rewrote all three functions to read ICT regardless of device timezone. `tripDay()` now counts ICT **calendar-date** boundaries (via the existing `dayDiff` primitive) instead of raw 24h-since-start — matches the acceptance criterion "rolling over at midnight," not "24 hours after whenever the trip happened to start."
Deliberately did NOT touch `todayKey()` (used by the unrelated daily-chaos-draw reset) — kept scoped to exactly what was asked (day counter + clock), not a blanket timezone change across the app.
**Bonus, flagged not silently done:** `clockTime()` is only used by `LiveClock` on the Travel-Dex header (there is no live HH:MM:SS clock on Today itself — only a date). Fixed it anyway since it's the app's only real clock and the spirit of the ask ("the displayed clock... must read ICT") clearly covers it; happy to add a live clock to Today too if that's what was actually wanted.
**Verified:** standalone logic test forcing `TZ=America/New_York` — 9/9 checks pass, including a moment that's still "Jan 1" for a US Eastern viewer but already ICT day 2 (proves the fix is genuinely timezone-independent, not just re-testing the same zone).

## Vietnam — 4th playable country (DONE, verified in-app)

**Status:** Complete and verified end-to-end in the running Expo web preview.

### What shipped
- `src/data/vietnam_regular_quests.json` — 509 quests, 38 cities, 5 regions. Schema twin of the Cambodia file (transform: normalized 4 `coords`→`coordinates`, backfilled Con Dao's missing `base_coordinates` from centroid, renamed region keys for global uniqueness).
- `src/utils/vietnam.ts` — `VIETNAM_REGIONS` (5) + `VIETNAM_CITIES` (38), mirroring cambodia.ts. Red palette (flag-matched; distinct from TH gold / LA green / KH orange).
- Wired: `countries.ts` (Vietnam CountryMeta 🇻🇳 code VN, plus nudged Laos/Cambodia layout boxes left to fit Vietnam's tall right-edge tile), `quests.ts` (loadRegularQuests + dataCities), `world.ts` (DETAILED_CITIES).
- Halls: Food Hall (via shared FOOD_HALL_KEY → FoodHallView country='vietnam') + Legendary Quests (VIETNAM_LEGENDARY_KEY bucket, green outline). MapScreen mapRegions/HALL_COUNTRY/BUCKET_HALL_KEYS/foodHall-render all extended.
- FoodHallView: `isCambodia` special-case generalized to `usesRegularData` (cambodia||vietnam) — sources Food-category quests from all_quests grouped by geographic region; added VIETNAM_FOOD_REGION_ORDER (food.ts).
- TodayScreen: the hardcoded `cambodiaFood` merge generalized to `regularFood` = every Food quest whose country isn't in the dish pool — auto-includes Vietnam (and any future dish-pool-less country).

### Key decision — region-key collision
Vietnam's raw data used bare "North"/"South"; **"South" collided with Laos's existing "South" region** (would misresolve via countryForRegionKey). Renamed to globally-unique keys in the data + vietnam.ts (name===key so nothing leaks oddly): North→Northern Vietnam, North-Central→North-Central Coast, South→Southern Vietnam; Central Highlands & Mekong Delta already unique, kept as-is.

### Non-issues confirmed
- Heritage & Slow Travel categories (MD flagged as "unique to Vietnam") were already in CATEGORY_MAP (Heritage→Culture, Slow Travel→Spiritual). No change needed.

### Verified
- `tsc --noEmit` clean; 17/17 smoke checks (counts, coords, no-collision, wiring, layout non-overlap, food=78/legendary=39).
- In-app: SEA board shows all 4 countries (Vietnam label one line, no overlaps); Vietnam region board → 5 regions + Food Hall (78, red/purple-outline, right) + Legendary Quests (39, green-outline, left); city drill-down (Northern Vietnam → Hanoi → Old Quarter zone → real quests); Today food section shows a VIETNAM chip. No console/bundler errors.

## Cambodia food on Today + skip mandatory MY WORLD picker (DONE, verified in-app)

**Status:** Complete. See contract.md for the checklist.

### What shipped — Today screen (`src/screens/TodayScreen.tsx`)
- Cambodia's 59 Food-category regular quests (already in `all_quests`, no separate dish pool like Thailand/Laos) now merge into the Today page's "FOOD QUESTS" section: `cambodiaFood = allQuests.filter(category==='Food' && country==='cambodia')`, `allFood = [...foodQuests, ...cambodiaFood]`.
- `foodCountryOf`/`foodRegionOf` now fall back to the quest's real `region` field (via `countryForRegionKey`) when the food-pool-specific `food_country`/`food_region` tags aren't present — this is what makes Cambodia quests resolve to `'cambodia'` and their real region names instead of defaulting to `'thailand'`/`'Other'`.
- Added `CAMBODIA_FOOD_REGION_ORDER` to the region-chip ordering (`utils/food.ts`, already existed from the Cambodia Food Hall work — reused, not new).
- Collapsed header's far-right number changed from a flat, always-the-same `${completedCount}/${totalCount}` (310 total, never moved) to `${availableFood.length} avail` — the same variable already driving the "X dishes available in this area" line — so it now scopes to whatever country/region/tier filter is active, mirroring the regular quests' "DRAW FROM ... X avail" badge above it. Verified: 310 (all) → 59 (Cambodia) → 7 (Northern Cambodia only).

### What shipped — Map screen (`src/screens/MapScreen.tsx`)
- Added `SKIP_CONTINENT_PICKER` (derived from `CONTINENTS.filter(available)` — true only when Southeast Asia is the sole available continent). Used to pick the initial `mode` state (`'world'` instead of `'myworld'`) and in `useTabPressReset`'s callback, so both a fresh launch and re-tapping the Map tab land directly on the Southeast Asia country board.
- Nothing else touched: the MY WORLD globe screen, its "< MY WORLD" back button, and the whole continent-picker code path are unchanged and fully reachable — confirmed live (all 11 continent tiles render, only SEA unlocked, "coming soon" on the rest).
- Self-healing by construction: the moment a second continent's `available` flag flips true (or if some other continent becomes the sole available one), `SKIP_CONTINENT_PICKER` evaluates false and the globe becomes the default landing screen again — no code change needed at that point.

### Verified
- `tsc --noEmit` clean both times.
- Live in preview: Cambodia dish titles (Fish Amok, Saraman Curry, etc.) browse correctly with real region labels; Map tab → lands on Southeast Asia with zero intermediate clicks; "< MY WORLD" reachable and renders correctly; re-tapping Map tab from the globe snaps back to Southeast Asia (not the globe).

## Thailand gap-fill: 9 confirmed quests + Bangkok zone bug fix (DONE, verified in-app)

**Status:** Complete. See contract.md for the per-quest checklist.

### What shipped
- **Bug fix (found mid-audit, fixed with sign-off):** `constants.ts`'s hand-authored Bangkok zones list had drifted to only 5 zones while the data file and every quest's `zone` field used a 10-zone model. Result: 20 of Bangkok's 32 quests — including Grand Palace, Wat Pho, Wat Arun — were invisible on the City Map screen (`getQuestsByZone` does exact-string zone match against `city.zones`, which came from the stale 5-zone list). Fixed by expanding `constants.ts` Bangkok zones to the full 10 + a new 11th zone `East Bangkok`. Verified: 0 invisible quests after the fix (was 20); confirmed live that Grand Palace now opens from the City Map.
- **9 new quests added to `thailand_regular_quests.json`** (737 → 746 total): 4 Bangkok (`TH_REG_BKK_025–028`: Wat Paknam Phasi Charoen, Wat Ratchanatdaram Worawihan/Iron Monastery, Siam Amazing Park, Sook Siam), 1 Nakhon Pathom (`TH_CEN_NPT_007`: Don Wai Floating Market), 3 Chiang Mai (`TH_REG_CNX_031–033`: Chiang Mai Night Bazaar, Market-to-Table Thai Cooking Class, Ethical Elephant Sanctuary Visit), 1 Ayutthaya (`TH_CEN_AYU_021`: Riverside Café & Restaurant Crawl).
- Cooking class and elephant sanctuary written generic/criteria-based per user's call (not naming a specific commercial operator — ethical-sanctuary reputations vary too much between operators to endorse one by name).
- Backfilled previously-`null` coordinates for 2 existing quests: Wat Saket (`TH_REG_BKK_007`) and Wat Benchamabophit (`TH_REG_BKK_015`).
- Recomputed `total_quests`/`city_badge_requirement` for all 4 touched cities (field is cosmetic/unused at runtime — badges compute live from `BADGE_THRESHOLD.city` — but kept internally consistent).

### Known, not touched (flagged to user, out of scope for this round)
- 14 Bangkok quests still have `coordinates: null` (Patpong, Snake Farm, Jodd Fairs, etc.) — pre-existing, unrelated to the zone bug, not fixed.
- Bangkok quest IDs mix two prefix families (`TH_REG_BKK_*` and `TH_CEN_BKK_*`) — cosmetic merge artifact, not fixed.
- Full Thailand-wide gap sweep (beyond Bangkok + food) was not done — one bonus finding (Chiang Mai elephant sanctuary) surfaced opportunistically and got included in this round's 9; a systematic all-39-town sweep was offered but not requested.

### Verified
- `tsc --noEmit` clean. Node script confirmed: 746 total quests, 0 duplicate IDs, 0 invisible-zone quests, all 9 new quests present with correct city/zone/coordinates.
- Live in preview: Bangkok City Map shows all 11 zones; Grand Palace & Wat Phra Kaew opens from "Grand Palace & Rattanakosin"; Siam Amazing Park opens from the new "East Bangkok" zone.

## Cambodia — 3rd playable country (DONE, verified in-app)

**Status:** Complete and verified end-to-end in the running Expo web preview.

### What shipped
- `src/data/cambodia_regular_quests.json` — 212 quests, 12 cities, 10 regions. Schema twin of `laos_regular_quests.json` (renamed `coords`→`coordinates`, added `country` + computed `base_coordinates` centroid per city).
- `src/utils/cambodia.ts` — `CAMBODIA_REGIONS` (10) + `CAMBODIA_CITIES` (12), mirroring `laos.ts`.
- Wired into `countries.ts` (Cambodia CountryMeta, 🇰🇭, code KH, available), `quests.ts` (loadRegularQuests + dataCities + `coords` fallback in baseNormalise), `world.ts` (DETAILED_CITIES).
- `constants.ts` earlier gained `COLORS.MYTHIC` (unrelated prior task).

### Verified
- `npx tsc --noEmit` clean.
- Smoke test (scratchpad/smoke.cjs): 13/13 checks pass.
- In-app: Cambodia renders on SEA board (available) → 10 regions render (Nationwide has purple hall-outline) → city → zones → quests load with correct titles/rarity/XP. No bundler/console errors.

### Flagged to user (need decisions, non-blocking)
1. **Phantom city removed:** delivered meta listed "Kampong Cham & Mekong Corridor" (8 quests) but the JSON had zero backing quests for it. Removed from meta. If those 8 quests exist somewhere, they need to be supplied to restore that city.
2. **MD vs JSON count:** cambodia.md documents 210 quests / epic 46 / temple 29; the `_updated` JSON actually has 212 / epic 48 / temple 31. Shipped the JSON (authoritative). MD is now stale.
3. **No Cambodia Food Hall** (no dedicated dish pool supplied) — 59 Food-category quests live as normal side quests. **No separate Legendary hall** — 43 legendary quests appear ranked in their cities. Both are deliberate scope calls; say if you want either built.

## Cambodia restructure + cross-country food zones (DONE, verified in-app)

**Orange theme:** Cambodia country accent → orange; 9 region tiles use an orange/amber palette. (countries.ts, cambodia.ts)

**Nationwide region removed** → replaced by two hall tiles on the Cambodia board:
- **Food Hall** (`__cambodia_food__`) — cross-cutting view of all 59 Cambodia food-category quests. Purple hall-outline.
- **Legendary Quests** (`__cambodia_legendary__`) — view of all 43 Cambodia legendary quests. Orange outline.
- Both are bucket views (RegionDetailView), like the Laos legendary hall. Refactored the hall country-scoping from a Laos/non-Laos binary to explicit per-country (HALL_SPEC) — this also fixes a latent bug where Thailand's Cross-Region hall would have swallowed Cambodia's legendary quests.
- The old Nationwide city's 10 quests were rehomed into real cities (7 food → Phnom Penh/Food Circuit; Choul Chnam Thmey + Pchum Ben → Phnom Penh/Arts & Culture; Angkor Sankranta → Siem Reap/Angkor Core Temples). 212 total preserved; Phnom Penh 47, Siem Reap 44.

**Food zone rollout (Thailand + Laos):** every regular-data city that HAS food-category quests now has a food zone with those quests consolidated into it. Reused existing "Food"-named zones where present; added "Food & Markets" otherwise. Thailand: 7 food quests / 6 cities (most Thai food lives in the Food Hall dish pool, not regular data). Laos: 32 food quests / 16 cities. Chiang Mai also updated in constants.ts (only hand-authored city affected).

### Verified
- tsc clean; data integrity: orphanZones=0 (every quest's zone exists in its city), foodOutsideFoodZone=0.
- In-app: Cambodia board shows orange regions + Food Hall (59) + Legendary Quests (43), no Nationwide; rehomed festivals show correct new homes; Chiang Mai city map renders the new FOOD & MARKETS zone. No console/bundler errors.

### New flag
- **Pre-existing meta drift** (NOT caused by these edits): `laos_regular_quests.json` meta says total_quests 369 but the array has 361; `thailand_regular_quests.json` meta says 736 but array has 737. Surfaced while integrity-checking. Left as-is; fix in a separate pass if you want meta to match arrays.

## Current bottleneck
**Judgment** — the codebase itself is now clean (audit complete, all mechanical fixes shipped and verified; TH meta drift is fixed for good). What remains are content/product decisions only, consolidated in contract.md §D — the biggest being the KH/VN food-tier rebalance (heavy Common skew after the gap-fills) and whether to `git init` the project (strongly recommended; currently zero version control). Also still open from before: dice-roll completion feeding country_badges, and the Laos gap-fill placement calls. None block usage.
