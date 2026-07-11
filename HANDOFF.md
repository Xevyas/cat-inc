# Cat Inc — Handoff Document

Living state doc for continuing work on this game in a fresh conversation. Not a changelog — keep this updated to reflect *current* state, not history. When something here goes stale, fix it in place rather than appending a correction.

## What this is

"Cat Inc" — vanilla JS incremental/idle browser game. No framework, no build step. Player recruits kitties, assigns them to gather/process resources, explores a map, trains jobs, builds houses.

## Critical rules (do not violate)

- **Work in `V3/` only.** This is the live, deployed folder. `V2/` is not it.
- **Never auto-publish to GitHub.** Only commit + push when the user explicitly says "publie" / "publie sur github" / "publie le".
- **Cache-busting versioning**: every asset/script/style reference uses `?v=X.XXXX`. Bump by exactly **+0.0001** on every publish, across *all* occurrences (index.html, style.css, jeu.js — including image paths baked into JS string constants like `KITTY_ICON`, `CAT_FACES`, `LIVRE_ICONE`, `CHECK_ICON`). Current version: **v0.0022** (last published). One pre-existing straggler not on this scheme: `img/interface/Work_Final.png?v=2` (index.html, Work tab icon) — not part of the `0.00XX` convention, left alone.
  - Any time an image file is swapped or a new image constant is added, it needs a `?v=` matching the current release, or it'll get stuck in browser/GitHub Pages cache after future updates.
- **Never commit these folders**: `img/Backupo/`, `Perso - pas pour github/`. There's no `.gitignore` for them — when publishing, stage files explicitly by name (`git add index.html style.css jeu.js img/SpecificFolder`), never `git add -A` / `git add .`.
- **Game is 100% English.** Always translate French feature names/labels before implementing. Confirm if a translation is non-obvious. (Note: `NOMS_KITTIES` in jeu.js still has one French name "Cléopatra" — pre-existing, not yet flagged for fix.)
- **Case sensitivity matters.** GitHub Pages runs Linux (case-sensitive), dev/testing happens on Windows (case-insensitive) — mismatched file/folder casing works locally but breaks live. Double check new asset paths match actual on-disk casing exactly.

## Resource tier framework (established, keep using this)

- **Tier 1** = the first/cheapest resource pair in time and materials.
- **Basic resource** = raw/gathered resource (left side of a pair, e.g. Cardboard Pieces).
- **Complex resource** = processed resource that consumes basic resources + extra time to produce (right side, e.g. Cardboard Planks).
- **Consumption rule**: every complex resource always consumes exactly **10 units of its paired basic resource** over the course of one full craft cycle, evenly spread (i.e. `secondesParRaw = secondesParComplex / 10`). Apply this to any new resource pair added later.

Current pairs and timings (`CONFIG` in jeu.js):
| Family | Basic | Complex | Complex craft time | Raw consumed every |
|---|---|---|---|---|
| Wood/Sawmill | Cardboard Pieces (60s) | Cardboard Planks | 120s (tier 1) | 12s |
| Rock/Pawsonry | Pebbles (60s) | Pebble Bricks | 120s (tier 1) | 12s |
| Food/Catchen | Catnip (60s) | Salads | 120s (tier 1) | 12s |
| Wood/Sawmill (alt) | Basic Wood (600s) | Basic Wood Planks | 1200s (tier 2) | 120s |
| Food/Anchovy | Anchovy (600s) | Grilled Anchovy | 1200s (tier 2) | 120s |

## Architecture / key concepts

- **`CONFIG`** (top of jeu.js) — central game balance: unlock thresholds, timing per action (`secondesParUnite`, `secondesParPlanche`, etc).
- **`RESOURCE_PAIRS`** array (~jeu.js line 1298) — config-driven definition of each raw→processed resource pair, drives the Work tab rendering (`renduWorkPairs` / `renduPaireRessource`). Adding a new resource pair should go through this array, not bespoke HTML/JS.
- **Work tab layout**: `.pair-card` is CSS Grid (`display:grid; grid-template-columns: 1fr 1fr`) with children in row-major order (header-raw, header-proc, row1-raw, row1-proc, ...), colored via `:nth-child(odd/even)`. This guarantees row-height alignment between the raw and complex columns, and raw/complex stay **side by side at every width, including mobile** — don't switch this back to flexbox or add a mobile `grid-column:1/-1` stacking override (tried and reverted; the user wants a tier's two resources to always share one line).
- **Pair-row internal layout**: desktop is one compact flex line — icon (56px, `order:1`) → worker slots (`order:2`) → quantity pushed right via `margin-left:auto` (`order:3`). On mobile the row switches to a tiny grid instead (`grid-template-columns: auto 1fr`): icon on top or quantity in small text right under it (same column, stacked), worker slots beside that stack spanning both its rows — this is what keeps a tier's basic+complex resource on one line at narrow widths without wrapping. Name/craft-time/recipe-cost/rate live in `.pair-info`, `position:absolute` and hidden (`max-height:0`) by default, revealed via `.pair-row:hover .pair-info` (desktop) or a `.pair-info-ouverte` class toggled by a click delegate on `#section-work-pairs` (mobile tap, works everywhere). **Must stay `position:absolute`, not inline/flow-based** — a flow-based version grows the row's height on hover, which shifts content under the mouse and can re-trigger `:hover` on a different row (flicker/cascade bug). Because `.pair-info` can float past a row's own box, `.pair-card` uses `overflow: visible` — don't reintroduce `overflow:hidden` there without re-solving that.
- **Family cards side by side on wide screens**: `#section-work-pairs` (`.panneau-large`) is `display:grid; grid-template-columns: repeat(auto-fit, minmax(min(500px, 100%), 1fr))`. The `min(500px, 100%)` wrapper is required — plain `minmax(500px,1fr)` does not shrink below 500px on narrow viewports and causes horizontal overflow; always use the `min()`-wrapped form for this kind of responsive card grid.
- **Recipe/flow visualization**: each complex-resource row has a `.pair-recipe` tag (icon + "×10"), and a `::before` arrow badge (sideways `➜`) at the raw/complex column boundary — same on desktop and mobile now that both keep the side-by-side layout.
- **Work tab family filters** (`.btn-filtre-work`, "All / Wood & Planks / ...") are styled like the Log tab's sub-tabs (flat-top pill, `var(--couleur-accent)` when active). On mobile they move to a `position:fixed` bar just above the main tab bar (`bottom:56px`); "Unaffect all workers" stays in normal scroll flow. `#panneau-objectifs` (Tutorial panel) shifts up to `bottom: calc(56px + 44px + 8px)` specifically while this bar is showing, via `body[data-onglet-actif="work"] #panneau-objectifs` — `changerOnglet(id)` sets `document.body.dataset.ongletActif = id` on every tab switch specifically so CSS can target "which tab is active" for cases like this. Reuse that attribute rather than adding new ad-hoc body classes.
- **Resource production rate display** must use the *same* formula in the top resource bar (`renduRessources`) and the Work tab tooltip (`renduPaireRessource`/`tauxProductionTransformee`) — both should be worker-count-only (`allocationCount(action) / secondesParUnite`), **not** gated on the transient `xBloquee` "out of stock" flags. Gating on that flag was a bug: raw supply briefly running dry is normal and frequent, so the top bar rate blanked out most of the time while the tooltip (ungated) kept showing a rate — looked broken/inconsistent. `afficherTauxNet(elementId, net)` is the shared renderer; it abbreviates to `"/m"` (not `/min`).
- **`kittyAllocationLabel(kittyIdx)`** — shared function returning `{text, cls}` describing exactly what a kitty is doing right now (used in Gang tab + all assignment modals). Backed by `ACTION_DISPLAY` (maps worker action → exact resource name produced).
- **Force-reassignment pattern**: `.btn-forcer` buttons (always `margin-left:auto`, sits at the far right of its card) call `retirerKittyDeSesRoles(kittyIdx)` then delegate to the normal assignment function. Implemented via `forcerWorkerSlot`, `forcerManager`, `forcerKittySlot`, `forcerKittyFormation`. Never shown for kitties on expedition/zone-explo/scouting/training (non-interruptible); only for worker/manager slots.
- **Busy-state checks**: any modal that lets you assign a kitty must check the *full* set: `kittyIsOnExpedition`, `kittyIsOnZoneExplo`, `kittyIsOnScouting`/staging, `kittyIsInWorkerSlot`, `kittyIsInTraining`, `kittyEstManager`. Missing any of these was a recurring bug source — always copy the check set from `renduModalExplo` when adding a new assignment surface.
- **Kitty-picker sort order**: `renduModalExplo`'s list sorts by `metier === "explorator"` first, then by `niveau` descending (Exploration Power) — was missing the niveau tiebreak (fixed this session), which left high-EP kitties buried at the bottom in original catch order. `renduModalWorker`'s list already sorted by level descending; keep any new kitty-picker consistent with that (best/most useful kitty first).
- **`.ressource-taux`** (top bar production-rate text) has a fixed `width: 7ch` + `overflow:hidden; text-overflow:ellipsis` so the resource card doesn't resize every time the rate appears/disappears — don't remove that in favor of `min-width` alone, which doesn't fully prevent the jump (confirmed: still ~5px of drift with `min-width`).
- **`formaterTemps(sec)`** — shared time formatter, dynamically shows Year/Day/Hour/Minute/Second, omitting larger units when zero.
- **Per-kitty face icons** (added this session): `CAT_FACES` maps face images in `img/Cat faces/`. `assignerVisageChaton(nom)` — Bernardo/Mochi/Luna always get their fixed face; every other recruited kitty gets a random face from the pool (excluding Bernardo's). Stored per-kitty as `kitty.visage` at creation time (3 creation sites: normal catch, offline catch-up, and save migration backfill). Rendered via `kittyIconHtml(kitty)`. Generic/non-kitty-specific icon slots (slot counters, modal titles, multi-name lists) still use the old generic `KITTY_ICON` constant (`img/interface/Gang_Final.png`) — that's intentional, not a gap.
- **Settings modal** (`#settings-modal` in index.html, `ouvrirModalSettings`/`fermerModalSettings` in jeu.js) — has a toggle-switch pattern now (`.settings-toggle-row` / `.settings-toggle-switch` CSS) reusable for future boolean options. Current toggle: "Show adjusted time on recruit button" (`etat.afficherTempsAjusteRecrutement`) — switches the recruit-button countdown between raw game-time (`tempsRestantSequence()`) and real wall-clock time (`tempsRestantSequence() / vitesseAttrapage()`).
- **Icon rendering**: never use `mix-blend-mode: multiply` on resource/UI icon classes — it's a no-op on pure white backgrounds but visibly darkens icons over any non-white background (was removed from 6 classes this session: `.work-sprite`, `.cout-icone`, `.pair-icon`, `.obj-sprite`, `.livre-icone`, `.inv-res-sprite`). One known leftover: the Explorations-unlocked story image still has an inline `mix-blend-mode:multiply` style (index.html, story-5 block) — not yet cleaned up, low priority since it's on a white background there.
- **`afficherNotification`/`ajouterLog`** use `textContent`, not `innerHTML` — cannot render `<img>` tags. Keep this in mind when deciding where image icons can vs can't replace emoji.
- **Log tab has two sub-views** (added this session): `changerSousOngletLogs('log'|'stories')` toggles `#logs-vue-log` (the existing chronological event/unlock text list) vs `#logs-vue-stories` (a card gallery, `renduStories()`). The `STORIES` array (jeu.js, Section 12) lists every story screen id + display name + its `localStorage` "seen" flag; a card only appears once that flag is set (mirrors old dialogue-log behavior — no locked placeholders). Cards use `STORY_IMAGES[id]` for the image if one exists, else show just the name; clicking a card calls `afficherModal(id)` to replay the full story screen. The old `💬 Story` text filter and all `ajouterLog("dialogue", ...)` calls were removed — dialogue is only surfaced via this gallery now, not as log text.

## File map

- `index.html` — all DOM structure, modals, story dialogue screens. ~600 lines.
- `jeu.js` — all game logic. ~3700+ lines. Sections roughly: CONFIG/constants → OBJECTIFS → 4. UNLOCK CONDITIONS → render functions (`rendu*`) → tick/simulation loop → save/load.
- `style.css` — all styling, mobile breakpoints at the bottom via media queries.
- `.claude/launch.json` — dev server config (`python -m http.server 5500`). The Claude Code preview tool (`preview_start`) now works on this machine (fixed 2026-07-08). It had failed every prior session with `spawn npx ENOENT` because Node.js wasn't installed at all; installing it (`winget install OpenJS.NodeJS.LTS`) revealed a second issue — Node lands in `C:\Program Files\nodejs\`, and the space in that path broke the preview tool's internal unquoted spawn call. Fixed with a space-free junction (`C:\nodejs` → `C:\Program Files\nodejs`) plus repointing the `Path` env var (User *and* Machine level — Machine needed an elevated PowerShell) at the junction. This is a machine-level fix, not project config, and should persist across sessions/reboots on this PC. If `preview_start` ever fails again with an ENOENT or unquoted-path error, suspect Node having been reinstalled/updated somewhere that reset the PATH to `C:\Program Files\nodejs` before troubleshooting further — `.claude/launch.json` itself was never the problem.

## Recent work

Published as of v0.0023:
1. Tier-1 complex resource craft time: 600s → 120s (Cardboard Planks, Salads, Pebble Bricks).
2. Tier-2 complex resource craft time: 6000s → 1200s (Basic Wood Planks, Grilled Anchovy).
3. Fixed raw-consumption ratio to the "10 per complex, spread over full craft time" rule (previously inconsistent — was only ~2:1 for tier 1).
4. Added recipe tag (icon + ×10) + connector arrow on Work tab pair cards for visual clarity of the basic→complex relationship.
5. Added Settings toggle for raw vs. adjusted (real) time display on the recruit button.
6. Added per-kitty face icons (5 images in `img/Cat faces/`), replacing the generic gang icon everywhere a specific kitty is shown.
7. Log tab: added a Stories sub-tab (card gallery, one block per unlocked story with image + name) replacing the old inline dialogue text log — see "Log tab has two sub-views" above.
8. Work tab: redesigned resource rows into one compact line (big icon, worker slots, quantity) with name/time/cost/rate moved into a hover/tap details panel — see "Pair-row internal layout" above.
9. Work tab: family cards (Wood, Food, Rock) now sit side by side on wide screens via a responsive grid, collapsing to one column on narrow ones — see "Family cards side by side" above.
10. Work tab mobile: raw/complex resources now stay side by side (icon+qty stacked, workers beside) instead of wrapping to separate lines.
11. Work tab family filters restyled as sub-tabs, moved to a fixed bar above the mobile tab bar; Tutorial panel repositions to avoid overlapping it — see "Work tab family filters" above.
12. Top resource bar: fixed-width rate indicator (no layout jump), rate now consistent with the Work tab's own display instead of blanking during brief stock-outs, `/min` abbreviated to `/m` — see "Resource production rate display" above.
13. Fixed exploration/campaign kitty picker not sorting by Exploration Power — see "Kitty-picker sort order" above.
14. Added real icons for Anchovy and Grilled Anchovy (`img/resources/`), replacing the 🐟/🍟 emoji placeholders everywhere except the plain-text offline-summary screen (which can't render `<img>`).

## Open items / things to double check next session

- No pending feature requests right now.
- `NOMS_KITTIES` array has "Cléopatra" (French) — should be renamed to an English equivalent at some point per the "100% English" rule, but hasn't been explicitly requested.
- Leftover `mix-blend-mode:multiply` inline style on the Explorations story image (index.html, story-5 screen) — not cleaned up, cosmetic/low priority.

## Conventions to follow when adding new features

- New boolean settings → follow the `.settings-toggle-row` pattern already in the Settings modal.
- New resource pairs → add to `RESOURCE_PAIRS`, follow the tier framework and 10:1 consumption rule above.
- New kitty-specific UI → use `kittyIconHtml(kitty)`, not the raw `KITTY_ICON` constant.
- New assignable-kitty modals → copy the full busy-state check set (see "Busy-state checks" above).
- Any new image asset → add `?v=<current version>` from the start.
