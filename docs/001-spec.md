# Border Chain — Product + Implementation Spec (Next.js, no DB)

## 1) Product brief

Build a lightweight meeting-end geography game called **Border Chain**.

A round shows a **start country** and a **target country**. The team must connect them by naming countries that share a **legal land border** with the **current endpoint** of the chain. The host runs the game on one shared screen and types guesses on behalf of the team.

The app should feel polished, quick, and presentation-friendly:
- round starts in seconds
- rules are explainable in one sentence
- visuals are big and readable on a Zoom/Meet screen share
- no sign-in, no backend, no database
- deterministic, shareable puzzles via URL
- all gameplay works offline once the site is built and hosted

## 2) Product goals

### Primary goal
Create a collaborative 1–2 minute game that is fun to play at the end of a meeting and has enough variety to feel reusable.

### UX goals
- The host can launch a round in under 10 seconds.
- The map is the star of the experience.
- Every correct guess creates a satisfying visual reveal.
- Validation is clear and fast: accepted, duplicate, unknown, or not adjacent.
- The app works well with keyboard only.

### Technical goals
- No DB and no auth in v1.
- Static deployable build.
- Minimal runtime dependencies.
- Most game logic is pure TypeScript and easy to test.
- Source-of-truth gameplay data is committed in the repo.

## 3) Non-goals for v1

Do **not** build any of the following in the initial version:
- real-time multiplayer or socket sync
- user accounts, cloud saves, or leaderboards
- chat, voice, or audience polling
- a CMS/admin panel
- daily streaks stored on a server
- map pan/zoom gestures
- full mobile-first redesign
- exhaustive geopolitical worldview customization
- sound effects or soundtrack
- AI-generated content

Those can all come later. v1 is a single-host, shared-screen game.

## 4) Recommended stack and architecture

Use **Next.js with the App Router**, **TypeScript**, and a small set of client components for the actual interactive game. Next.js’ App Router is file-system based, Server Components are the default, and interactive UI should sit behind a `'use client'` boundary. Static files can be served from the root `public/` folder, and Next.js supports static export so the finished app can be hosted on any static web server. `create-next-app` can bootstrap the project with TypeScript and ESLint.

### Architecture decisions that should be treated as fixed
1. **No database** in v1.
2. **No server runtime required** in v1. Build for static export.
3. **No API routes / route handlers required** in v1. They are available in App Router if needed later, but the initial build should avoid them.
4. **Use SVG for the map**, not Canvas.
5. **Use local JSON / TS data files** committed in the repo.
6. **Use query params**, not dynamic route segments, for puzzle configuration so static export stays simple.
7. **Keep gameplay logic in pure functions** under `src/lib/border-chain`, separate from React UI.

### Why this architecture
- It keeps deployment simple.
- It makes the game easy to hand off to a coding agent.
- It avoids introducing backend complexity for something that is fundamentally deterministic.
- It preserves a clean path to future upgrades if you later want hosted stats, multiplayer, or image generation.

## 5) Data source strategy

Use **Natural Earth** as the base boundary dataset for the world map. Natural Earth is public domain, has admin-0 country and boundary-line datasets, and provides multiple scales. Its admin-0 country data represents boundaries according to **de facto** control by default.

### Important design choice
Keep **visual geometry** and **gameplay adjacency** as **separate data artifacts**.

Do **not** rely on polygon-touching at runtime to decide whether a guess is legal.

Instead:
- use map geometry only for rendering
- use a curated adjacency graph for gameplay rules
- allow manual overrides for confusing or “gotcha” borders

This matters because “what touches what” in a boundary dataset is not always the same as “what feels fair in a casual meeting game.”

## 6) Game definition

### Core rule
Players must connect **Start** to **Target** by naming countries that share a **legal land border** with the **last correct country in the chain**.

### Example
Start: Senegal  
Target: Ethiopia

Valid chain:
Senegal → Mali → Niger → Chad → Sudan → Ethiopia

### Win condition
The chain reaches the target country.

### Lose condition
The timer expires before the target is reached.

### Default round settings
- mode: one-ended chain
- timer: 90 seconds
- hints: 1
- difficulty: medium
- show shortest-path count: on
- show invalid guess reasons: on

### Rules that must be explicit in UI
- **Land borders only**
- **No repeats**
- **Guesses must border the current endpoint**
- **Island countries with no land borders are not playable**
- **The host types guesses for the team**

## 7) Scope of MVP gameplay

### Included
- random puzzle
- custom puzzle via URL params
- deterministic seeded puzzle generation
- timer
- one hint
- undo last valid guess
- reveal solution on loss
- results screen
- local settings persistence
- local recent puzzles list

### Excluded from MVP
- two-ended chain mode
- daily streaks / trophies
- per-user profiles
- custom worldviews
- alternate border rules (maritime, tunnels, ferries, etc.)
- competition mode between teams
- spectator devices

## 8) UX and screen flow

## 8.1 Home / setup screen (`/`)

Purpose: launch a round fast.

### Required UI
- Title: “Border Chain”
- Short rules sentence
- Primary buttons:
  - **Play Random**
  - **Play Daily** (optional but cheap once seed logic exists)
  - **Custom**
- Settings panel:
  - Difficulty: easy / medium / hard / expert
  - Timer seconds: 60 / 90 / 120
  - Show shortest-path count: toggle
  - Hints enabled: toggle
- Custom puzzle fields:
  - Start country
  - Target country
  - “Generate link” button

### UX notes
- The default action should be **Play Random**.
- The home screen should not feel like a dashboard.
- Host should be able to start a round with one click.

## 8.2 Play screen (`/play?...`)

Purpose: run one round.

### Layout priority
Map should dominate the screen.

Recommended layout on desktop:
- Top bar: start, target, timer, controls
- Main area: large world map
- Bottom area:
  - chain breadcrumbs
  - country input + autocomplete
  - compact guess/invalid log

### Required play-screen elements
1. **Header**
   - Start country chip
   - Target country chip
   - Remaining time
   - Difficulty label
   - Optional shortest path count (“Shortest: 6”)
   - Buttons: Hint, Undo, Reveal, New Round

2. **World map**
   - Full-width SVG
   - All countries dimmed by default
   - Start highlighted in one accent
   - Target highlighted in a second accent
   - Correct guesses become illuminated
   - Connecting line segments animate in between chain nodes
   - Current endpoint has an outer glow/ring
   - Hint state can pulse one suggested next country

3. **Chain trail**
   - Render current chain as chips or breadcrumb pills
   - Example:
     `Senegal → Mali → Niger`
   - The current endpoint should be visually emphasized

4. **Input**
   - Large text field with clear placeholder: “Type a country…”
   - Autocomplete dropdown
   - Submit on Enter
   - Escape clears
   - `/` focuses input
   - Ctrl/Cmd+Z triggers Undo
   - Disable input after win/loss

5. **Feedback**
   - Inline toast or banner for:
     - accepted guess
     - duplicate
     - unknown country
     - not adjacent
     - not playable in this mode
   - Keep feedback short and unambiguous

6. **Compact guess log**
   - Show recent invalid attempts and reasons
   - Show count of valid moves made
   - Do not let this panel overpower the map

### Visual reveal behavior
This is the centerpiece of the product.

#### Initial state
- Entire world map is dark/muted
- Start and target are visible immediately
- Optional labels for start/target only

#### On correct guess
- Country fill transitions from muted to active
- A line draws from previous endpoint to new endpoint
- Chain breadcrumb updates
- Current endpoint ring moves
- Optional micro-celebration pulse

#### On invalid guess
- No map change
- Brief shake or red outline on input
- Toast explains reason

#### On hint
- One valid shortest-path next country pulses on map for ~2 seconds
- Its name may appear in helper text
- Hint state is then cleared

### Timing
- Default timer counts down from 90 seconds
- At 0:
  - input locks
  - results sheet opens
  - optimal solution path is revealed on the map

## 8.3 Results screen / end-of-round sheet

This can be a modal sheet or inline panel.

### Required content
- Win / loss headline
- Team path
- Shortest path
- Path length comparison
- Time used
- Number of invalid guesses
- Whether a hint was used
- Buttons:
  - New random round
  - Replay same puzzle
  - Copy link

### Nice-to-have polish
- Show “You solved it in 7; shortest was 6”
- Animate the optimal path on the map
- Show a small “efficiency” badge if useful

## 9) Gameplay and content rules

## 9.1 Node model
Each playable country/entity is a node in the graph.

Each node needs:
- `code`: stable internal ID (use ISO3 wherever possible)
- `name`: canonical display name
- `aliases`: accepted input names
- `region`: continent/subregion metadata
- `playable`: boolean
- `labelPoint`: x/y for map label/line anchoring

## 9.2 Edge model
Each legal border is an undirected edge.

Each edge may optionally have tags:
- `surprising`
- `disputed`
- `micro`
- `manual`
- `disabledForGenerator`

### Important rule
The **gameplay graph** is the source of truth, not the raw map dataset.

## 9.3 Playable set
For v1:
- include only nodes with at least one legal land-border edge
- exclude Antarctica
- allow manual exclusions if a country creates more confusion than fun

Map may still render non-playable countries, but the validator should reject them with a helpful explanation.

## 9.4 Border policy
This needs to be consistent, even if imperfect.

Recommended policy for v1:
- land borders only
- no maritime adjacency
- no tunnels/ferries/bridges unless explicitly added later
- no repeated countries
- use a **curated graph** that may intentionally exclude obscure or “gotcha” borders if they make puzzles less intuitive

### Philosophy
Favor **intuitive casual play** over maximal geopolitical completeness.

## 10) URL and routing spec

Use query params rather than dynamic path segments.

### Routes
- `/` — setup / home
- `/play` — game page
- optional `/about` — tiny explainer / credits

### `play` query params
- `mode=random|daily|custom`
- `seed=<string>`
- `difficulty=easy|medium|hard|expert`
- `timer=60|90|120`
- `start=<ISO3>`
- `target=<ISO3>`
- `shortest=1|0`
- `hints=1|0`
- `debug=1|0` (development / manual testing)

### Behavior
- If `start` and `target` are provided, use custom mode.
- Else if `seed` exists, generate deterministically from that seed.
- Else generate a random puzzle and update the URL.
- Invalid params should be sanitized, not crash the page.

## 11) Suggested file structure

```text
app/
  layout.tsx
  page.tsx
  play/
    page.tsx

src/
  components/
    border-chain/
      GameShell.tsx
      HeaderBar.tsx
      WorldMap.tsx
      ChainTrail.tsx
      CountryInput.tsx
      AutocompleteList.tsx
      GuessLog.tsx
      Toast.tsx
      ResultsSheet.tsx
      SettingsPanel.tsx
      HintButton.tsx

  lib/
    border-chain/
      types.ts
      config.ts
      engine.ts
      puzzle.ts
      seed.ts
      input.ts
      selectors.ts
      storage.ts
      reducer.ts
      hints.ts
      validation.ts

    data/
      countryMeta.json
      countryAliases.json
      countryGraph.json
      puzzlePool.v1.json

  styles/
    globals.css
    tokens.css

public/
  data/
    world-map.v1.json

scripts/
  build-map-data.ts
  build-graph.ts
  build-puzzle-pool.ts
  verify-data.ts

tests/
  unit/
    engine.test.ts
    input.test.ts
    puzzle.test.ts
    validation.test.ts
  e2e/
    play.spec.ts
```

## 12) Data artifacts

## 12.1 `public/data/world-map.v1.json`
This is the rendering artifact for the SVG map.

Suggested shape:

```ts
type WorldMapData = {
  version: string;
  viewBox: [number, number, number, number];
  countries: Record<string, {
    code: string;          // ISO3
    name: string;
    path: string;          // SVG path data
    labelPoint: [number, number];
    bbox?: [number, number, number, number];
  }>;
};
```

Notes:
- Keep this file render-ready.
- Do not ship raw heavy GeoJSON if avoidable.
- Precompute path strings offline in a script.
- Keep file size modest by simplifying geometry.

## 12.2 `src/lib/data/countryMeta.json`

Suggested shape:

```ts
type CountryMeta = Record<string, {
  code: string;
  name: string;
  shortName?: string;
  aliases: string[];
  region: string;
  subregion?: string;
  playable: boolean;
  labelPoint?: [number, number];
  degree?: number;
}>;
```

## 12.3 `src/lib/data/countryGraph.json`

Suggested shape:

```ts
type CountryGraph = {
  version: string;
  nodes: Record<string, {
    neighbors: string[];
  }>;
  edgeTags?: Record<string, string[]>;
};
```

Where `edgeTags` key can be normalized like `"FRA|BRA"`.

## 12.4 `src/lib/data/puzzlePool.v1.json`

Suggested shape:

```ts
type PuzzlePoolEntry = {
  id: string;
  start: string;
  target: string;
  shortestLength: number;
  difficulty: 'easy' | 'medium' | 'hard' | 'expert';
  sameRegion?: boolean;
  endpointDegrees?: [number, number];
  tags?: string[];
};
```

This file should be generated offline from the graph.

## 13) State model

Use `useReducer` for the game state.

```ts
type Phase = 'setup' | 'playing' | 'won' | 'lost' | 'revealed';

type GameSettings = {
  difficulty: 'easy' | 'medium' | 'hard' | 'expert';
  timerSeconds: 60 | 90 | 120;
  showShortestPathCount: boolean;
  hintsEnabled: boolean;
};

type Puzzle = {
  id: string;
  mode: 'random' | 'daily' | 'custom';
  seed: string;
  start: string;          // ISO3
  target: string;         // ISO3
  shortestLength: number;
  difficulty: GameSettings['difficulty'];
};

type InvalidGuessReason =
  | 'unknown'
  | 'not_playable'
  | 'duplicate'
  | 'not_adjacent'
  | 'already_complete';

type GuessRecord =
  | { kind: 'valid'; code: string; atMs: number }
  | { kind: 'invalid'; raw: string; reason: InvalidGuessReason; atMs: number };

type GameState = {
  phase: Phase;
  puzzle: Puzzle | null;
  settings: GameSettings;
  chain: string[];                 // includes start
  guessHistory: GuessRecord[];
  startedAtMs: number | null;
  elapsedMs: number;
  remainingMs: number;
  hintUsed: boolean;
  solutionPath: string[] | null;
  toast: { kind: 'success' | 'error' | 'info'; message: string } | null;
};
```

## 14) Core engine functions

All of these should be pure functions with unit tests.

```ts
normalizeInput(raw: string): string
canonicalizeCountry(raw: string, aliases: AliasMap, meta: CountryMeta): string | null
isAdjacent(a: string, b: string, graph: CountryGraph): boolean
validateGuess(code: string, state: GameState, graph: CountryGraph, meta: CountryMeta): ValidationResult
applyValidGuess(state: GameState, code: string): GameState
undoLastValidGuess(state: GameState): GameState
bfsShortestPath(start: string, target: string, graph: CountryGraph): string[] | null
getHintNextStep(current: string, target: string, graph: CountryGraph, visited: Set<string>): string | null
generatePuzzle(seed: string, difficulty: Difficulty, pool: PuzzlePoolEntry[]): Puzzle
computeMapStatuses(state: GameState): Record<string, 'base' | 'start' | 'target' | 'chain' | 'current' | 'hint' | 'solution'>
```

## 15) Validation rules

Given a submitted guess:

1. Normalize the raw text.
2. Resolve it to a canonical country code via alias map.
3. If not found, reject with `unknown`.
4. If found but not playable, reject with `not_playable`.
5. If game is already won/lost, reject with `already_complete`.
6. If code already exists in `chain`, reject with `duplicate`.
7. Let `current = chain[chain.length - 1]`.
8. If `!isAdjacent(current, code)`, reject with `not_adjacent`.
9. Else accept and append to chain.
10. If `code === target`, mark `won`.

### UX copy for invalid reasons
Keep strings short:
- unknown → “Unknown country”
- not_playable → “Not playable in Border Chain”
- duplicate → “Already used”
- not_adjacent → “Doesn’t border {currentCountryName}”

## 16) Input normalization and aliasing

This needs real attention because input UX will heavily affect the feel of the game.

### Normalize by:
- lowercase
- trim
- Unicode normalize (`NFD`) and strip diacritics
- replace ampersands with “and”
- strip punctuation/apostrophes
- collapse whitespace
- optionally strip leading “the”

### Alias support examples
At minimum support well-known alternates such as:
- USA / United States / United States of America
- UK / United Kingdom
- Czechia / Czech Republic
- Ivory Coast / Côte d’Ivoire
- DRC / Democratic Republic of the Congo / Congo-Kinshasa
- Republic of the Congo / Congo-Brazzaville
- South Korea / Republic of Korea
- North Korea / DPRK
- Eswatini / Swaziland
- Myanmar / Burma
- North Macedonia / Macedonia

### Autocomplete behavior
- Prefer exact alias match
- Then prefix matches on canonical name and aliases
- Then contains matches
- Limit dropdown to top 5
- Keyboard navigation with up/down arrows

Do **not** silently auto-correct to the wrong country.

## 17) Puzzle generation

## 17.1 Why precompute a pool
For a casual game, not all country pairs are equally fun. Precomputing a puzzle pool lets you filter out bad pairs and keep generation deterministic and simple.

## 17.2 Build-time generation
A script should:
1. Load the curated graph.
2. Enumerate all unordered playable country pairs.
3. Compute shortest path length for each pair.
4. Exclude unsolved / disconnected pairs.
5. Exclude same-country pairs.
6. Bucket into difficulty bands.
7. Optionally exclude paths or endpoints tagged as too confusing.
8. Write `puzzlePool.v1.json`.

## 17.3 Difficulty bands
Recommended default:
- easy: shortest path length 2–3
- medium: 4–5
- hard: 6–7
- expert: 8+

This can be tuned later.

## 17.4 Runtime selection
Given a seed:
1. Filter pool to desired difficulty.
2. Hash the seed to an integer.
3. Select a stable index from the filtered pool.
4. Return that puzzle.

### Seed examples
- random mode: generated random string
- daily mode: local date string like `2026-03-07`
- custom mode: derived from `start-target`

## 18) Hint behavior

Keep v1 simple.

### v1 hint design
Only one hint per round.

Behavior:
- Compute one shortest path from current endpoint to target using BFS.
- Take the next node after current.
- Temporarily highlight that country on the map.
- Optionally show helper text:
  - `Hint: one shortest-path next step is Chad`

### Why this hint
- easy to explain
- easy to implement
- highly useful
- visually satisfying

## 19) Undo behavior

Undo should remove the **last valid guess only**.

Rules:
- cannot undo the start node
- invalid guesses remain in history
- undo is disabled after reveal if you want to keep results immutable
- keyboard shortcut: Ctrl/Cmd+Z

## 20) Solution reveal

On loss or manual reveal:
- compute and store one shortest path from start to target
- overlay that path on the map in a distinct style
- keep the team’s actual path visible if possible
- show both in results

If the team already deviated, still show the shortest path from original start to target on results.

## 21) Map rendering spec

Use plain SVG.

### Why SVG
- country-by-country styling is straightforward
- 200-ish country paths is manageable
- transitions are easy
- DOM inspection/debugging is easy
- coding agents handle it well

### Layers
Render in this order:
1. base countries
2. start/target highlight layer (can just be classes on paths)
3. chain line segments
4. endpoint ring
5. labels for start/target or hint
6. optional solution overlay

### Path styling states
Each country path should support:
- `base`
- `start`
- `target`
- `chain`
- `current`
- `hint`
- `solution`

Use CSS classes or data attributes, not inline per-path style objects everywhere.

### Labels
Do not label the whole map.
Only label:
- start
- target
- optionally current endpoint
- hint target while hint is active

This keeps the map readable on screen share.

## 22) Presenter-first UX details

This is not a solo mobile puzzle first. It is a presenter tool first.

### Therefore:
- optimize for 1280px+ desktop layout
- big hit areas
- large text
- minimal chrome
- keyboard-driven flow
- avoid hover-only interactions
- ensure all important game state is visible without scrolling

### Recommended keyboard shortcuts
- `/` focus input
- `Enter` submit
- `Esc` clear input
- `↑/↓` navigate autocomplete
- `Ctrl/Cmd+Z` undo
- `H` hint
- `R` reveal
- `N` new round

## 23) Local persistence (no DB)

Use `localStorage` only for:
- settings
- recent puzzle seeds
- daily completion marker
- last custom start/target

Suggested keys:
- `border-chain:settings:v1`
- `border-chain:recent:v1`
- `border-chain:daily:v1`
- `border-chain:last-custom:v1`

Do not store giant blobs.

## 24) Build scripts

## 24.1 `build-map-data.ts`
Purpose:
- ingest raw world boundary data
- simplify geometry
- project to a single viewBox
- output render-ready SVG path data JSON
- compute label points

Output:
- `public/data/world-map.v1.json`

## 24.2 `build-graph.ts`
Purpose:
- create or validate the curated adjacency graph
- apply manual overrides
- ensure symmetry
- ensure all referenced country codes exist

Output:
- `src/lib/data/countryGraph.json`

## 24.3 `build-puzzle-pool.ts`
Purpose:
- compute pairwise shortest paths
- assign difficulty buckets
- exclude poor candidates
- emit stable puzzle pool

Output:
- `src/lib/data/puzzlePool.v1.json`

## 24.4 `verify-data.ts`
Checks:
- all graph nodes exist in metadata
- graph is symmetric
- no self-loops
- every pool entry is solvable
- every map path has a matching meta entry where relevant
- every alias resolves to a valid node
- no duplicate alias collisions without explicit tie-break handling

## 25) Package scripts

Suggested scripts:

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "test": "vitest run",
    "test:e2e": "playwright test",
    "build:data": "tsx scripts/build-map-data.ts && tsx scripts/build-graph.ts && tsx scripts/build-puzzle-pool.ts && tsx scripts/verify-data.ts"
  }
}
```

If using static export, `next start` is not required for production, but it is still fine for local verification.

## 26) Suggested implementation order

## Phase 1 — scaffold
- create Next.js app with TypeScript
- add global styles/tokens
- add routes `/` and `/play`
- wire query-param parsing
- add basic setup UI

## Phase 2 — core data
- commit initial country metadata
- commit curated graph
- commit alias map
- add a small placeholder map or mock SVG
- implement engine functions and tests

## Phase 3 — actual map
- generate `world-map.v1.json`
- render SVG map
- add state-based country styling
- add line overlay and endpoint ring

## Phase 4 — gameplay
- timer
- input + autocomplete
- validation
- hint
- undo
- results sheet
- reveal solution

## Phase 5 — polish
- keyboard shortcuts
- localStorage persistence
- copy-link action
- empty/error states
- transitions and reduced-motion support
- responsive cleanup

## Phase 6 — test and harden
- run unit and E2E coverage
- manually test a set of known tricky aliases
- manually test a set of known tricky borders
- verify static export build

## 27) Testing plan

## 27.1 Unit tests
Test pure functions heavily.

Required:
- input normalization
- alias resolution
- adjacency lookup
- valid guess acceptance
- invalid guess reasons
- duplicate rejection
- BFS shortest path
- hint next step
- deterministic puzzle generation
- undo behavior

## 27.2 Data integrity tests
Required:
- graph symmetry
- no missing nodes
- pool solvability
- all puzzles respect difficulty bands
- all aliases are unique after normalization, or collisions are explicitly handled

## 27.3 E2E tests
At minimum:
1. Load home page and start random game
2. Submit invalid country
3. Submit non-adjacent country
4. Submit valid chain until win
5. Timer expiry causes reveal
6. Custom URL loads correct start/target
7. Undo removes last valid guess
8. Copy link contains same puzzle settings

## 27.4 Accessibility checks
- input has visible label
- buttons have accessible names
- contrast is acceptable
- focus ring visible
- color is not the only carrier of meaning
- respect `prefers-reduced-motion`

## 28) Acceptance criteria

The MVP is done when all of the following are true:

1. A user can open the app and start a random round from the home screen.
2. The play screen shows start country, target country, timer, map, chain, and input.
3. Valid guesses are accepted only when they border the current endpoint.
4. Invalid guesses show specific reasons.
5. Correct guesses update the map and chain immediately.
6. The hint button highlights one valid shortest-path next step.
7. Undo removes the most recent valid guess.
8. The round ends in a win when the target is reached.
9. The round ends in a loss/reveal when the timer expires.
10. The results screen shows team path and shortest path.
11. Puzzle state is reproducible via URL.
12. The app builds and runs without any database or backend service.
13. The app can be deployed as a static site.

## 29) Nice-to-have post-MVP backlog

Once v1 is stable, good next additions would be:
- two-ended chain mode
- continent filters
- team-vs-team mode
- “fog of war” reveal mode
- difficulty-aware daily puzzle
- animated shortest-path replay
- custom rule sets
- per-round stats export
- presenter fullscreen mode
- multiple map themes

## 30) Implementation notes for the coding agent

These should be treated as direct instructions:

1. Keep the runtime app simple. Do not introduce a backend.
2. Prefer static committed JSON data over runtime fetches to third-party APIs.
3. Keep gameplay logic pure and separate from components.
4. Use query params, not database IDs, for reproducibility.
5. Use SVG and CSS classes for map state changes.
6. Do not compute country adjacency from rendered polygons in the browser.
7. Build a small but robust alias system.
8. Make the map readable on a screen share before worrying about mobile.
9. Add tests early for graph integrity and BFS correctness.
10. Optimize for clarity and reliability over cleverness.

## 31) Optional reference implementation details

If the coding agent wants a concrete target, here is the intended behavior for a typical round:

1. User clicks **Play Random** on `/`.
2. App navigates to `/play?mode=random&seed=abc123&difficulty=medium&timer=90&shortest=1&hints=1`.
3. The page loads a deterministic puzzle, for example:
   - Start: Senegal
   - Target: Ethiopia
   - Shortest path length: 6
4. The host types “mali”.
5. Input resolves to `MLI`.
6. Validator checks `SEN -> MLI` adjacency and accepts.
7. Map lights up Mali, line draws Senegal→Mali, chain updates.
8. The process repeats until target is reached or timer expires.
9. On win, show the path and compare against shortest.
10. On loss, reveal a shortest solution path.

## 32) Summary

Build **Border Chain** as a **static Next.js App Router app** with:
- local committed data
- SVG world map
- curated land-border graph
- seeded puzzle generation
- single-host shared-screen UX
- no DB, no auth, no backend

That is the right tradeoff for a polished internal meeting game that is easy to build, easy to deploy, and easy to extend later.
