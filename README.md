# Puzzle Platformer

A browser-based 2D puzzle-platformer about coordinating three characters with complementary abilities. The project is currently building its first movement-focused vertical slice.

## Prerequisites

- [Node.js](https://nodejs.org/) 22.13 or newer (Node 22 LTS recommended)
- npm 10 or newer

The repository includes an `.nvmrc`, so contributors using `nvm` can select the expected Node major with `nvm use`.

## Local development

```sh
npm ci
npm run dev
```

Vite prints the local development URL, normally `http://localhost:5173`.

Install the pinned Chromium runtime once before running browser tests:

```sh
npx playwright install chromium
```

## Project checks

```sh
npm run typecheck
npm run lint
npm run format:check
npm test
npm run build
npm run test:e2e
```

The production build is written to `dist/`. Preview it locally with:

```sh
npm run preview
```

## Playable build

Merges to `main` are validated and published to GitHub Pages by the
`Deploy playable build` workflow. The repository must use **GitHub Actions** as
its Pages source under **Settings → Pages**.

Once the first deployment completes, the playable build will be available at
[fantasticmrhurst.github.io/puzzle-platformer](https://fantasticmrhurst.github.io/puzzle-platformer/).

## Current state

The application currently provides a three-character prototype roster in the validated, data-driven movement test room. Device-independent input drives a shared custom movement controller through a fixed-step Arcade Physics integration with collision, camera follow, switching, and whole-roster fall reset.

Use `1`–`3` to select a character directly or `Q`/`E` to cycle the roster. Movement remains `A`/`D` or the arrow keys, with `W`, Up, or Space to jump. `F` is the contextual ability: the Brute grips or braces, the Tinkerer operates nearby powered consoles, and the Ranger fires along the current `I`/`J`/`K`/`L` aim direction. Press `R` to reset the complete room to its authored checkpoint. Bring all three characters into the shared exit to complete the room.

Focused labs are selected with a query parameter: `?level=traversal-lab` for Scout, Pet, and Brute cooperation, `?level=mechanism-lab` for the Tinkerer powered-bridge experiment, `?level=ranger-lab` for the Ranger's aimed environmental shot, and `?level=gardener-lab` for the Gardener's living platform.

Press `F3` to toggle the read-only movement diagnostics overlay. It starts hidden in all builds.

See the project documents for current direction:

- [Game design](docs/GAME_DESIGN.md)
- [Architecture](docs/ARCHITECTURE.md)
- [Roadmap and proposed issues](docs/ROADMAP.md)
- [Movement test-room measurements](docs/TEST_ROOM.md)
- [Scout, Brute, and Pet cooperation lab](docs/CHARACTER_LAB.md)
- [Tinkerer powered-mechanism lab](docs/TINKERER_LAB.md)
- [Ranger ranged-action lab](docs/RANGER_LAB.md)
- [Gardener growth lab](docs/GARDENER_LAB.md)
- [Movement-controller contracts and timing](docs/MOVEMENT_CONTROLLER.md)
- [Physics integration and fixed-step ordering](docs/PHYSICS_INTEGRATION.md)
- [Movement tuning baseline](docs/MOVEMENT_TUNING.md)
- [Movement play-test template](docs/PLAYTEST_TEMPLATE.md)
- [Contributor and agent guidance](AGENTS.md)
