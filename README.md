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

The home page lists all play labs. Each lab has an **All play labs** link back to the menu, and its URL can be shared directly.

Choose **Crew Abilities Lab** to try the Brute, Pilot, and Tinkerer in one room. See the [playtest guide](docs/CREW_ABILITIES_LAB.md) for controls and the full route.

## Player roster

The playable trio is Brute, Pilot, and Tinkerer. All three can use ordinary pressure plates, buttons, and switches. Each character also has two unique abilities:

| Character    | Ability 1                                                                                                          | Ability 2                                                                                                                                                |
| ------------ | ------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Brute**    | **Push and pull heavy objects.** Reposition crates and counterweights, including pulling them out of corners.      | **Break marked barriers.** Smash cracked walls and floors to open routes or drop objects to a lower floor. Restarting the room restores broken barriers. |
| **Pilot**    | **Cling and wall jump.** Slide slowly down walls and jump away to climb shafts or cross between walls.             | **Deploy a rope ladder.** Lower a ladder from a designated anchor so teammates can follow.                                                               |
| **Tinkerer** | **Route power.** Carry and connect a power plug or redirect a circuit between devices such as a bridge and a gate. | **Reconfigure machinery.** Change how a powered device behaves, such as reversing a conveyor or choosing which floor a lift serves.                      |

The table describes the agreed design. The play lab controls below describe what you can try in the current build.

## Current state

The validated, data-driven movement test room supports three switchable characters. Device-independent input drives a shared custom movement controller through a fixed-step Arcade Physics integration with collision, camera follow, switching, and whole-roster fall reset.

Use `1`–`3` to select a character directly or `Q`/`E` to cycle the roster. Movement remains `A`/`D` or the arrow keys, with `W`, Up, or Space to jump. `F` is the contextual ability: the Brute grips or braces, the Tinkerer operates nearby powered consoles, and the Ranger fires along the current `I`/`J`/`K`/`L` aim direction. In the Tinkerer Plug Lab, press `C` to grab the plug and press it again to place it. Press `R` to reset the complete room to its authored checkpoint. Bring all three characters into the shared exit to complete the room.

Focused labs are selected with a query parameter: `?level=traversal-lab` for Pilot, Pet, and Brute cooperation, `?level=mechanism-lab` for the Tinkerer powered-bridge experiment, `?level=tinkerer-plug-lab` for the Tinkerer-only plug-and-outlet puzzle, `?level=ranger-lab` for the Ranger's aimed environmental shot, and `?level=gardener-lab` for the Gardener's living platform.

Open `?level=gate-lab` to try shared environmental controls. Leave one character on the pressure plate, take another through the gate, then press `F` at the far-side switch to let the whole team through. The gate waits for occupied doorways to clear. Press `R` to reset.

Choose **Relay Station** from the lab menu to playtest Pilot, Brute, and Tinkerer as a team. Restore the service crossing and bring all three to the exit. Use `F` for contextual abilities and switches. Relay Station also accepts a standard-mapped gamepad. On a PlayStation controller, use the D-pad or left stick to move, Cross to jump, Square to use abilities, L1/R1 to cycle characters, and Options to reset. Hold Square beside an unlocked block to grip it as the Brute.

Press `3` in **Relay Station** to play as the animated Tinkerer, or start as him in **Tinkerer Plug Lab**. Let him stand for a few seconds to see his arm swing and blink, then run and jump to see the movement poses. His flower companion sways while waiting, scuttles after him, and makes a short hop when he jumps.

Press `F3` to toggle the read-only movement diagnostics overlay. It starts hidden in all builds.

Open `?level=pilot-brute-ranger-lab&pilotArt=1` to preview the Pilot's eight-frame idle loop, eight-frame run, and five jump poses. The jump follows the actual arc from liftoff through falling, followed by the existing landing pose. Jump against a wall to see the cling, slide, and kick.

Choose **Brute Animation Preview** from the lab menu to see both animated characters. Press `2` to select the Brute. Tap `F` on open ground to brace or release. Once the Pilot unlocks the block, hold `F` beside it and move toward it to push or away to pull. The preview uses the current collision bodies and movement rules.

Choose **Forest of the Verdant Ruins** from the lab menu, or open `?level=verdant-ruins`, to try the separate red-explorer puzzle. See [Verdant Ruins playtest](docs/VERDANT_RUINS_LAB.md) for controls and integration details.

See the project documents for current direction:

- [Game design](docs/GAME_DESIGN.md)
- [Art asset pipeline and export specifications](docs/ART_ASSET_PIPELINE.md)
- [Character development standard](docs/CHARACTER_DEVELOPMENT.md)
- [Architecture](docs/ARCHITECTURE.md)
- [Roadmap and proposed issues](docs/ROADMAP.md)
- [Movement test-room measurements](docs/TEST_ROOM.md)
- [Pilot, Brute, and Pet cooperation lab](docs/CHARACTER_LAB.md)
- [Tinkerer powered-mechanism lab](docs/TINKERER_LAB.md)
- [Tinkerer plug lab](docs/TINKERER_PLUG_LAB.md)
- [Ranger ranged-action lab](docs/RANGER_LAB.md)
- [Gardener growth lab](docs/GARDENER_LAB.md)
- [Mixed-team cooperation lab and roster evaluation](docs/ROSTER_EVALUATION.md)
- [Movement-controller contracts and timing](docs/MOVEMENT_CONTROLLER.md)
- [Physics integration and fixed-step ordering](docs/PHYSICS_INTEGRATION.md)
- [Movement tuning baseline](docs/MOVEMENT_TUNING.md)
- [Movement play-test template](docs/PLAYTEST_TEMPLATE.md)
- [Contributor and agent guidance](AGENTS.md)
