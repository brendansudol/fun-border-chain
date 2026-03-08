# Border Chain

Border Chain is a static Next.js geography game for the end of a meeting. A round gives you a start country and a target country, and the team has to connect them by naming countries that share a legal land border with the current endpoint.

The app is presenter-first:

- one shared screen
- keyboard-friendly input
- deterministic seeded puzzles via URL
- no auth, no database, no backend
- static export friendly

## Stack

- Next.js App Router
- React 19
- TypeScript
- SVG world map rendered from committed JSON
- Pure gameplay logic under `src/lib/border-chain`
- Local JSON artifacts for country metadata, adjacency graph, puzzle pool, and map geometry

## Features

- Random, daily, and custom rounds
- Difficulty and timer settings
- Input normalization and alias handling
- Country autocomplete
- Timer, hint, undo, and reveal
- Results sheet with shortest-path comparison
- Local persistence for settings, recent rounds, daily completion, and last custom puzzle

## Routes

- `/` setup and launch screen
- `/play` main game screen

`/play` uses query params rather than dynamic routes so rounds are reproducible and static-export friendly.

## Getting Started

Install dependencies:

```bash
npm install
```

Run the app locally:

```bash
npm run dev
```

Open `http://localhost:3000`.

## Scripts

```bash
npm run dev
npm run lint
npm run test
npm run build
npm run build:data
```

What they do:

- `npm run dev` starts the Next.js dev server
- `npm run lint` runs ESLint
- `npm run test` runs the Vitest unit suite
- `npm run build` creates the static production build
- `npm run build:data` regenerates the committed map, graph, puzzle pool, and verification outputs

## Data Pipeline

The gameplay and rendering data are committed to the repo.

Generated artifacts:

- `public/data/world-map.v1.json`
- `src/lib/data/countryMeta.json`
- `src/lib/data/countryGraph.json`
- `src/lib/data/puzzlePool.v1.json`

Generation scripts:

- `scripts/build-map-data.ts`
- `scripts/build-graph.ts`
- `scripts/build-puzzle-pool.ts`
- `scripts/verify-data.ts`

Source datasets used by the scripts:

- `world-atlas` for Natural Earth-derived map geometry
- `world-countries` for country metadata and border lists

The important design choice is that map geometry and gameplay adjacency are separate. The SVG is only for rendering; the border graph is the gameplay source of truth.

## Project Structure

```text
src/
  app/
  components/border-chain/
  lib/
    border-chain/
    data/
  styles/

public/
  data/

scripts/
tests/
  unit/
```

## Docs

- `docs/001-spec.md` product and implementation spec
- `docs/running-notes.md` working notes for ongoing design and implementation decisions

## Testing

Current coverage is focused on pure gameplay logic:

- input normalization and alias resolution
- shortest-path search
- guess validation
- deterministic puzzle generation
- undo behavior

Run the suite with:

```bash
npm run test
```

## Build Notes

The project is configured for static export in `next.config.ts`. There is no server-side runtime dependency for gameplay.

Production verification used during implementation:

```bash
npm run lint
npm run test
npm run build
```

## Current Limits

- No multiplayer or real-time sync
- No backend or persistence beyond `localStorage`
- No E2E test suite yet
- No alternate border rule sets beyond curated land borders
