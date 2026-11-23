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

## Project checks

```sh
npm run typecheck
npm run lint
npm run format:check
npm test
npm run build
```

The production build is written to `dist/`. Preview it locally with:

```sh
npm run preview
```

## Current state

The application currently provides a playable placeholder character in the validated, data-driven movement test room. Device-independent input drives the custom movement controller through a fixed-step Arcade Physics integration with collision, camera follow, and fall reset.

See the project documents for current direction:

- [Game design](docs/GAME_DESIGN.md)
- [Architecture](docs/ARCHITECTURE.md)
- [Roadmap and proposed issues](docs/ROADMAP.md)
- [Movement test-room measurements](docs/TEST_ROOM.md)
- [Movement-controller contracts and timing](docs/MOVEMENT_CONTROLLER.md)
- [Physics integration and fixed-step ordering](docs/PHYSICS_INTEGRATION.md)
- [Contributor and agent guidance](AGENTS.md)
