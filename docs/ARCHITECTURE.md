# Architecture

## Status and goals

This document proposes the architecture for the first playable milestone. No application code exists yet, so these boundaries should be validated by the vertical slice and refined deliberately.

The architecture should:

- deliver responsive, deterministic-enough movement in current desktop browsers;
- isolate gameplay rules from rendering and physical input devices;
- support data-driven levels and reusable puzzle components;
- remain understandable to a small team working in parallel;
- preserve reasonable seams for later replay, AI, or multiplayer work without implementing them now.

## Technology direction

| Concern | Initial choice | Notes |
| --- | --- | --- |
| Language | TypeScript, strict mode | Explicit contracts for gameplay and level data |
| Build/dev server | Vite | Fast local feedback and static production builds |
| Rendering/scenes/camera | Phaser | Browser-focused 2D framework |
| Physics | Phaser Arcade Physics | Collision and basic integration; custom code owns movement policy |
| Level data | JSON plus TypeScript validation | Exact authoring workflow remains open |
| Unit tests | Vitest | Movement rules, schemas, and deterministic state transitions |
| Browser tests | Playwright | Boot, scene loading, and critical input smoke tests |
| Hosting | Static host, likely GitHub Pages initially | Deployment choice is not final |

Dependencies beyond these should solve a demonstrated need and be discussed in the pull request.

## Proposed repository structure

```text
.
├── public/
│   └── assets/                 # Runtime-served art, audio, and level assets
├── src/
│   ├── main.ts                 # Browser entry point
│   ├── game/
│   │   ├── config.ts           # Phaser game configuration
│   │   ├── Game.ts             # Game creation/lifecycle
│   │   └── scenes/             # Boot, preload, test-room, later gameplay scenes
│   ├── input/
│   │   ├── PlayerIntent.ts     # Device-independent action state
│   │   └── KeyboardInput.ts    # Keyboard-to-intent adapter
│   ├── movement/
│   │   ├── MovementConfig.ts   # Tunable per-character values
│   │   ├── MovementState.ts    # Timers and controller state
│   │   └── MovementController.ts
│   ├── entities/
│   │   ├── Character.ts        # Character composition/root
│   │   └── abilities/          # Added only when abilities exist
│   ├── physics/
│   │   └── ArcadeBodyAdapter.ts # Narrow Phaser physics boundary
│   ├── environment/            # Plates, doors, blocks, platforms, triggers
│   ├── levels/
│   │   ├── LevelSchema.ts      # Versioned data types and validation
│   │   ├── LevelLoader.ts
│   │   └── data/               # Authored level JSON if bundled by Vite
│   ├── ui/
│   │   └── MovementDebugOverlay.ts
│   └── shared/                 # Small, genuinely shared utilities only
├── tests/
│   ├── unit/
│   └── e2e/
├── docs/
├── index.html
└── package.json
```

This is a boundary proposal, not a requirement to create empty directories. Add directories when the corresponding feature is implemented.

## Runtime composition

The gameplay loop should keep the following flow explicit:

```text
physical device
    -> input adapter
    -> PlayerIntent
    -> MovementController + MovementState + contact snapshot
    -> requested velocity/action
    -> ArcadeBodyAdapter / Phaser Arcade Physics
    -> resulting body/contact state
    -> Character presentation and debug UI
```

The direction of dependency is important:

- Input adapters know about browser or Phaser keys; the movement controller does not.
- The movement controller knows movement configuration and a small collision/contact contract; it does not know sprites, animation names, scenes, or cameras.
- Character presentation reads gameplay state to choose visuals; visuals do not define movement behavior.
- Scenes create and coordinate objects, but rules live in their owning modules.

## Input contract

Input should represent player intent, not raw key codes. Movement intent contains horizontal direction and edge-aware jump state. Milestone 2 adds named actions for direct/cycled character selection, contextual interaction or primary ability, room reset, and an optional device-independent aim vector.

The input layer is responsible for:

- mapping devices to named actions;
- tracking press/hold/release edges consistently;
- making the current intent available for a simulation tick;
- supporting keyboard first and gamepad later without changing movement rules.

Input recording, replay, and network sources are possible future adapters. They should not be implemented until required.

## Movement controller boundary

The custom controller owns policy such as:

- acceleration, braking, maximum speed, and direction changes;
- ground and air-control differences;
- jump eligibility and jump-cut behavior;
- coyote and jump-buffer timers;
- wall slide and wall jump transitions when that feature is introduced;
- character-specific values supplied through `MovementConfig`.

Phaser Arcade Physics owns broad-phase collision, overlap detection, gravity integration where selected, and body resolution. A narrow adapter should translate body state into a contact snapshot and apply the controller's requested motion.

Controller tests should use plain objects and explicit time deltas. They should not need a canvas, texture, or running Phaser game.

## Simulation timing

Consistent movement across rendering rates is a requirement. A fixed gameplay timestep is the preferred starting experiment, not yet a final decision.

The prototype should document and test:

1. where input is sampled;
2. how accumulated time produces simulation steps;
3. the maximum catch-up work allowed after a stall;
4. when Arcade Physics advances relative to controller updates;
5. whether rendering interpolation is needed;
6. behavior at 60 Hz, high refresh rates, and throttled frames.

Do not combine Phaser's implicit update behavior with a separate accumulator without establishing which system owns stepping. If Arcade Physics cannot be cleanly driven by the selected fixed-step approach, choose and document a bounded-delta alternative after measurement.

## Gameplay state order

A tick should follow a stable order, refined during implementation:

1. sample or consume `PlayerIntent`;
2. read the previous resolved contact state;
3. update controller timers and choose movement actions;
4. apply requested velocity/acceleration to the physics body;
5. advance physics and resolve collisions;
6. capture contacts and gameplay events for the next decision/presentation;
7. update camera, animation, and debug presentation.

The exact Phaser hook for each step is an implementation question. The invariant is that the order is intentional and tested.

## Character composition

Characters should share the same controller implementation and differ through configuration and composed abilities. A character consists conceptually of:

- identity and current gameplay state;
- a movement configuration;
- an input/control source;
- a physics body adapter;
- zero or more abilities;
- presentation components for sprite, animation, sound, and effects.

Avoid deep class hierarchies such as a base character with a subclass for every ability. Prefer small interfaces and composition once multiple characters exist.

The Milestone 2 candidate lab adds three requirements without selecting final implementations prematurely:

- Body dimensions belong to character configuration so the Pet can test half-height passages without forking movement rules.
- Aimed actions such as the Ranger's shot must receive device-independent aim intent rather than reading pointer or keyboard state inside the ability.
- Spawned or transformed world state such as Gardener growth must have clear ownership and participate in the same room-reset contract as other puzzle entities.

Ability prototypes should implement only the contract needed by their focused test. Do not create a universal ability framework, inventory system, projectile hierarchy, or plant simulation before two real prototypes demonstrate a shared need.

### Control transfer

The scene-level roster owns which character is active; individual characters do not select one another. At each simulation step it supplies live player intent to exactly one character and neutral intent to the rest. All characters still advance through the same physics world.

Control transfer must clear unconsumed press/release edges without resetting position, velocity, controller timers, or persistent world effects. Camera target, selection presentation, and debug output observe the active identity but do not own it. Candidate rooms should contain no more than three active-roster slots even though the lab can load different candidate combinations.

Character-to-character collision is disabled for the first cooperation prototype. Environment and puzzle-object collision remain normal. Add character collision later only if a designed interaction, such as carrying or boosting, demonstrates that its benefits outweigh blocking and stacking complexity.

### Room reset contract

The gameplay scene owns room recovery. A reset restores an authored or checkpoint state for the complete room rather than calling unrelated partial-reset methods from UI or input code. Reset participants include the roster, active selection, character controllers and bodies, puzzle entities, ability-created entities, signal state, and completion state.

`R`, out-of-world detection, and future death events request the same reset operation. Until checkpoints exist, re-instantiating from validated level data is an acceptable simple implementation. Persistent progression and save data are outside this contract.

## Level data

Levels should be data, not imperative scene code. The first schema only needs what the test room uses, likely:

- schema version and level identifier;
- world bounds and optional presentation metadata;
- one to three character entries with stable IDs, archetypes, and spawn points;
- one shared exit rectangle with a stable ID;
- static collision geometry or a reference to tile data;

Later revisions can add typed component configuration, signal connections, and checkpoint entities.

Directly authored, validated JSON remains the Milestone 2 format. Add only fields required by a current character chamber or cooperation scenario. Tiled and custom editors remain deferred until direct authoring produces specific, repeated friction.

Validation should run when loading a level in development and produce a message containing the level, entity, and invalid field. The schema must be versioned before compatibility matters. Whether validation uses a small handwritten validator or a library remains open; do not add a schema dependency until the data warrants it.

## Puzzle communication

Puzzle components should communicate through explicit, inspectable connections rather than direct scene lookups. A likely model is:

- sources such as plates and switches emit a typed state or event on a named connection;
- receivers such as doors consume that signal;
- level data declares the connection using stable entity IDs or channels;
- reset behavior is part of each component's contract.

The first real plate-and-door puzzle should validate whether signals are stateful, event-based, or a small combination. Do not build a general event bus before that use case exists.

## Debugging and observability

The movement overlay should be togglable and off by default in production builds. Useful initial values include:

- position and velocity;
- grounded, ceiling, and wall contacts;
- input direction and jump edges;
- coyote and jump-buffer timer state;
- current movement mode;
- simulation delta/step count and rendered frames per second;
- active movement configuration/profile.

Prefer a snapshot interface that both the overlay and tests can consume. Debug UI must not become a source of gameplay state.

## Testing strategy

### Unit tests

Use Vitest for pure movement rules, timing boundaries, input edge tracking, and level validation. Important cases include buffered jumps on landing, coyote-window expiration, jump cutting, opposite-direction braking, and air-control limits.

### Integration tests

Use targeted tests or a deterministic harness for the Arcade Physics adapter and collision/contact translation. These tests should protect assumptions that pure controller tests cannot observe.

### Browser tests

Use Playwright for a small number of smoke flows: the game boots, the test room loads, the character responds to input, the overlay toggles, and the production build serves with correct asset paths. Avoid pixel-perfect or timing-fragile movement assertions.

### Manual play tests

Movement feel requires structured manual testing. Record configuration, browser, refresh rate, input device, test-room obstacle, and observation so feedback can be reproduced.

## Deployment

The production artifact should be static. Vite's base path must support the selected host and repository subpath. Deployment should run type checks, tests, and a production build before publishing. GitHub Pages is the leading early option, but no host is committed yet.

## Architectural decisions and open questions

### Current direction

- Use Phaser Arcade Physics for the first prototype.
- Keep movement policy custom and separate from sprites.
- Use one configurable controller across characters.
- Represent levels as validated, versioned data.
- Author Milestone 2 rooms directly as JSON.
- Target keyboard input and current desktop Chromium first while keeping device-independent action contracts.
- Reset the whole room to its latest checkpoint on manual reset, fall, or future death.
- Publish validated builds through GitHub Pages.
- Keep multiplayer out of scope while maintaining clean input/state/rendering seams.

### Not yet decided

- exact Phaser and other dependency versions at scaffold time;
- whether Phaser gravity or controller-applied vertical acceleration owns gravity policy;
- handwritten versus library-based runtime schema validation;
- entity/component registry design for level instantiation;
- event, signal, or state model for puzzle connections;
- save-data representation and compatibility policy;
- final browser/version matrix and required gamepad support.

Resolve these only when the responsible milestone provides evidence.

