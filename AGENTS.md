# AGENTS.md

This file defines working agreements for humans and coding agents contributing to this repository. It applies to the entire repository. More specific `AGENTS.md` files may be added later for specialized areas, and take precedence within their directories.

## Project intent

Build a polished, single-player browser puzzle-platformer in which three switchable characters cooperate through complementary abilities. The immediate goal is a small vertical slice with one excellent-feeling character, not the complete game.

Treat character names, abilities, rules, and presentation described in the design documents as provisional unless explicitly marked as decided.

## Current phase

The project is in pre-production. The first milestone is a movement prototype using Phaser, TypeScript, and Vite. Do not add multiplayer, backend services, accounts, or synchronization code during this phase.

## Working agreements

- Work on a dedicated feature branch and keep changes small enough to review independently.
- Check `git status` before editing. Preserve changes you did not create and do not rewrite unrelated work.
- Associate changes with a GitHub Issue and explain the player-facing or developer-facing outcome in the pull request.
- Keep `main` runnable. Avoid combining broad refactors with gameplay changes.
- Discuss changes that alter the architecture, physics model, level format, core dependencies, or saved-data format before implementing them.
- Record consequential decisions and unresolved questions in the relevant document under `docs/`.
- Do not commit generated build output, browser traces, coverage output, credentials, or licensed source assets.

## Engineering principles

- Prefer minimal dependencies and browser-native capabilities.
- Separate input intent, simulation state, physics integration, and rendering.
- Keep movement logic independent of sprite animation and keyboard APIs.
- Use configuration objects for character movement differences; do not fork the controller per character.
- Favor data-driven levels and reusable environment components over scene-specific puzzle code.
- Use explicit types at module boundaries. Avoid `any` unless an external API makes it unavoidable and the reason is documented.
- Keep modules focused. Phaser scenes coordinate systems; they should not become containers for all game logic.
- Do not introduce speculative abstractions. Add extension points when a current feature or test needs them.
- Preserve a future seam for alternative input sources, replay, AI, and networking, but do not implement those systems now.

## Proposed source boundaries

When the application is scaffolded, use the structure described in `docs/ARCHITECTURE.md`. In particular:

- `src/input/` owns device mapping and produces player intent.
- `src/movement/` owns configurable movement rules and controller state.
- `src/entities/` composes gameplay entities from movement, abilities, physics, and presentation.
- `src/environment/` owns reusable puzzle components.
- `src/levels/` owns level data, schemas, loading, and validation.
- `src/ui/` owns debug and player-facing overlays.
- Phaser-specific adaptation belongs at integration boundaries, not in otherwise portable gameplay rules.

## Movement and simulation rules

- Tune one character to a high standard before adding the full roster.
- Keep gameplay timing expressed in seconds or clearly named milliseconds; never use unlabeled frame counts.
- Coyote time, jump buffering, variable jump height, acceleration, deceleration, and air control must be configurable and independently testable.
- Apply gameplay state in a stable, documented order each tick.
- Do not make behavior depend directly on display frame rate.
- Start with Phaser Arcade Physics. Replacing the physics engine requires an explicit project decision.
- Treat a fixed gameplay timestep as a hypothesis to validate in the prototype, including Phaser integration behavior, rather than an unquestioned requirement.

## Level and puzzle rules

- Level files contain data, stable identifiers, and configuration—not executable behavior.
- Validate level data at load time in development and fail with actionable errors.
- Environmental components communicate through narrow contracts such as signals, channels, or typed events; avoid components reaching into scene internals.
- Prefer composition for character-specific obstacles and abilities.
- Version the level schema before published levels depend on it.

## Testing expectations

Once the tooling exists, run the relevant checks before handing off a change:

```sh
npm run typecheck
npm run lint
npm test
npm run build
```

Run Playwright smoke tests for changes affecting boot, controls, scenes, level loading, or deployment.

Testing should be proportional to risk:

- Unit-test deterministic movement timing and transitions with Vitest.
- Add integration tests at the Phaser/Arcade Physics boundary where unit tests cannot establish behavior.
- Use Playwright for application boot and a small number of critical browser flows, not frame-perfect physics assertions.
- Include manual play-test notes for changes to movement feel. Automated tests protect rules; they do not decide whether movement feels good.

If a command is not available yet, state that clearly instead of inventing a passing result.

## Definition of done

A change is done when:

- Its acceptance criteria are met.
- Relevant automated checks pass.
- Player-facing behavior has been manually exercised when applicable.
- New configuration and non-obvious logic are documented.
- Temporary debug behavior is off by default or intentionally exposed.
- The pull request calls out tradeoffs, follow-up work, and any unresolved decisions.

## Documentation map

- `docs/GAME_DESIGN.md`: player experience, mechanics, design principles, and open design questions.
- `docs/ARCHITECTURE.md`: technical boundaries, data flow, proposed structure, and architectural decisions.
- `docs/ROADMAP.md`: milestone sequence and proposed GitHub Issues.

