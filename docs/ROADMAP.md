# Roadmap

## Planning principles

- Build the smallest playable vertical slice first.
- Tune and validate movement before multiplying characters or puzzle systems.
- Keep issues independently reviewable and leave `main` playable.
- Treat milestone scope as a constraint; defer speculative systems.
- Use play-test evidence to resolve design questions.

Dates are intentionally omitted until team capacity and issue ownership are known.

## Milestone 0: Project foundation

Outcome: contributors can install, run, test, and build the same minimal browser application.

- Establish Vite, strict TypeScript, Phaser, Vitest, formatting/linting, and scripts.
- Add a minimal boot scene and visible smoke-test output.
- Document supported runtime/package-manager versions.
- Add continuous integration for type checking, tests, and production builds.

## Milestone 1: Movement prototype

Outcome: one character feels responsive in a reproducible test room.

- Load a data-defined test room with platforms, walls, and gaps.
- Implement device-independent input intent.
- Implement the configurable movement controller incrementally.
- Integrate Arcade Physics collision and contacts.
- Add camera follow and world bounds.
- Add a togglable movement-debug overlay.
- Validate behavior across representative browsers and refresh rates.
- Record initial tuning profiles and structured play-test notes.

Exit criteria:

- A new contributor can run the game from documented instructions.
- The character can traverse the full test room with reliable collision.
- Core timing rules have unit tests.
- The overlay makes movement and contact state observable.
- A production build runs from a static server with correct asset paths.
- The team agrees the movement baseline is strong enough to build upon.

## Milestone 2: Character cooperation prototype

Outcome: three in-world characters can be selected and positioned to solve a simple cooperative scenario.

- Decide switching rules and inactive-character behavior.
- Instantiate multiple characters from shared controller code and distinct profiles.
- Add clear selection and camera feedback.
- Define reset/checkpoint behavior that prevents costly soft locks.
- Prototype one meaningful ability per character; revise provisional archetypes as needed.

## Milestone 3: Reusable puzzle vocabulary

Outcome: a small level can be assembled from reusable, data-driven interactions.

- Define entity IDs and the first versioned level schema.
- Implement a pressure plate, switch, door/gate, pushable block, moving platform, trigger zone, and exit as required by designed puzzles.
- Validate the puzzle connection model with at least two different component combinations.
- Establish visual/audio feedback and reset semantics.

## Milestone 4: Vertical slice

Outcome: a short, polished level demonstrates the game's distinctive promise.

- Build an introductory level with a readable difficulty curve.
- Add final-quality direction for character readability and environment interactions.
- Add pause, restart, basic settings, accessibility foundations, and level completion flow.
- Conduct external play tests and prioritize findings.
- Publish a stable web build.

## Later milestones

Potential later work includes campaign structure, save/progression, expanded mechanics, content tools, polish, and broader device support. Multiplayer is a separate possible phase and requires a fresh architecture review; it is not implied by the initial roadmap.

## Proposed first five GitHub Issues

These issues are ordered to minimize overlapping work. They are proposals for review and have not been created on GitHub.

### Issue 1: Scaffold the Phaser + TypeScript browser project

**Suggested labels:** `milestone: foundation`, `type: infrastructure`

**Goal:** Create the smallest maintainable development environment and prove it builds in CI.

**Scope:**

- Add Vite, strict TypeScript, and Phaser with pinned package-manager metadata.
- Add scripts for development, type checking, unit tests, lint/format checks, and production builds.
- Add a minimal Phaser boot/test scene that visibly renders without gameplay.
- Add Vitest and a trivial smoke test proving the test pipeline works.
- Add CI for install, type check, test, and build.
- Expand the README with prerequisites and exact local commands.

**Acceptance criteria:**

- A clean checkout installs with the documented command.
- `npm run dev` opens a page containing a Phaser canvas and visible boot confirmation.
- Type check, test, and production build commands pass locally and in CI.
- No gameplay controller, puzzle system, or final asset work is included.

**Dependencies:** None.

### Issue 2: Define and load a data-driven movement test room

**Suggested labels:** `milestone: movement`, `type: feature`, `area: levels`

**Goal:** Provide reproducible geometry for movement and collision tuning without hardcoding the entire room in a scene.

**Scope:**

- Define the minimal versioned level shape for world bounds, spawn, and static collision geometry.
- Add development-time validation with useful errors.
- Add JSON data for a test room containing a safe start, acceleration runway, short and long gaps, platforms of varied height, walls, and camera boundaries.
- Instantiate visible placeholder geometry and collision bodies from the data.
- Document test obstacles and their dimensions.

**Acceptance criteria:**

- The room loads from data and invalid required fields fail with an actionable message.
- Geometry includes every test case listed above and is visually legible.
- The scene does not contain a separate hardcoded list duplicating the JSON geometry.
- Unit tests cover representative valid and invalid level data.

**Dependencies:** Issue 1.

### Issue 3: Implement device-independent input and the core movement controller

**Suggested labels:** `milestone: movement`, `type: feature`, `area: controls`

**Goal:** Build a renderer-independent, configurable controller for excellent baseline running and jumping.

**Scope:**

- Define `PlayerIntent`, contact state, movement configuration, and controller state.
- Map keyboard controls to intent without exposing keys to the controller.
- Implement horizontal acceleration/deceleration, maximum speed, ground/air control, jump, variable jump height, coyote time, and jump buffering.
- Use explicit delta time and document update ordering.
- Defer wall slide/wall jump until baseline movement is validated, unless included behind disabled configuration.

**Acceptance criteria:**

- Controller logic can run in Vitest without Phaser, a canvas, or keyboard APIs.
- Timing-window boundary tests cover coyote time and jump buffering.
- Tests cover jump cutting, maximum speed, braking/reversal, and reduced air control.
- All meaningful movement values live in a typed configuration object.
- Holding a key does not incorrectly reproduce press-edge actions.

**Dependencies:** Issue 1. Can proceed alongside Issue 2 after shared contracts are agreed.

### Issue 4: Integrate the controller with Arcade Physics and camera follow

**Suggested labels:** `milestone: movement`, `type: feature`, `area: physics`

**Goal:** Make the controller playable in the test room with robust collision and camera behavior.

**Scope:**

- Add a narrow adapter between movement state and the Phaser Arcade Physics body.
- Translate grounded, ceiling, and wall contacts into the controller contract.
- Establish and document simulation/update ordering and delta-time handling.
- Add player spawn, world bounds, camera follow, and camera bounds.
- Add simple reset behavior for falling out of the room.
- Test at representative rendering rates and record observations.

**Acceptance criteria:**

- The character traverses the test room without passing through static geometry under normal play.
- Buffered and coyote jumps work at collision boundaries in the running game.
- The camera follows without exposing space beyond defined bounds.
- The implementation does not put keyboard mapping or animation decisions into movement rules.
- The pull request documents measured timing behavior and any deviation from a fixed-step design.

**Dependencies:** Issues 2 and 3.

### Issue 5: Add movement diagnostics, browser smoke tests, and tuning notes

**Suggested labels:** `milestone: movement`, `type: tooling`, `area: testing`

**Goal:** Make movement behavior observable, reproducible, and safe to iterate on.

**Scope:**

- Add a togglable overlay showing position, velocity, contacts, input edges, movement mode, coyote/buffer state, timing, and active profile.
- Keep debug presentation read-only and off by default in production.
- Add Playwright smoke coverage for app boot, room load, player response, and overlay toggle.
- Add a play-test note template recording build, browser, refresh rate, device, configuration, obstacle, and observation.
- Document initial tuning values as a baseline, not final design.

**Acceptance criteria:**

- A documented control toggles the overlay during development.
- Displayed state comes from an explicit debug snapshot rather than UI-owned gameplay state.
- Browser smoke tests pass against a production-style served build.
- At least two refresh-rate conditions are manually evaluated, using emulation or available hardware, with results recorded.
- The README links to the play-test procedure.

**Dependencies:** Issue 4.

## Decisions required before Milestone 2

- final switching behavior and inactive-character rules;
- whether all characters share or specialize in advanced traversal;
- death, reset, checkpoint, and soft-lock recovery behavior;
- initial ability prototypes and their control scheme;
- keyboard/gamepad priority and target browser matrix;
- first-published-level authoring workflow.

