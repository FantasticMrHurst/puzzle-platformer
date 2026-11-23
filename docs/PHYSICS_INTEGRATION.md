# Physics Integration

Task 4 connects the plain TypeScript movement controller to a Phaser Arcade Physics body through `ArcadeBodyAdapter`. Rendering, keyboard mapping, movement policy, and physics translation remain separate modules.

## Simulation policy

Gameplay uses a project-owned 60 Hz fixed-step accumulator. Phaser's automatic Arcade update is disabled with `customUpdate: true`; the scene explicitly advances the physics world once per gameplay step.

The accumulator accepts display-frame delta time and runs zero or more 1/60-second gameplay steps. It retains fractional time for the next display frame and caps catch-up work at five steps. Excess time after a long stall is discarded to avoid a spiral of death.

Synthetic clock tests produce exactly 60 gameplay steps over one second of 30, 60, and 120 Hz render deltas. These tests establish scheduling behavior; they do not replace play-testing on real displays.

## Per-frame and per-step order

Once per rendered frame:

1. `KeyboardInput` samples device state.
2. Press and release edges merge into pending intent and remain pending if no gameplay step runs.
3. The fixed-step clock determines how many gameplay steps to simulate.

For each gameplay step:

1. `PlayerCharacter` reads velocity and the contacts resolved by the previous physics step.
2. `MovementController` advances by exactly 1/60 second.
3. `ArcadeBodyAdapter` applies the controller's requested velocity.
4. Input press/release edges are cleared; held and horizontal state remain available to catch-up steps.
5. The scene advances Arcade Physics by exactly 1/60 second, resolving collisions.
6. Falling below the world reset threshold returns the character to spawn.

Phaser performs its normal physics `postUpdate` once after the scene update, synchronizing the final body position to the rectangle used for rendering and camera follow.

## Contact translation

The adapter combines Arcade's `blocked` and `touching` flags:

- either downward flag means grounded;
- either upward flag means touching the ceiling;
- a contact exclusively on the left or right produces wall direction -1 or 1;
- simultaneous contacts on both sides produce wall direction 0 because there is no unambiguous wall side.

The controller never imports Phaser and does not know about body or collider APIs.

## Camera and reset behavior

The camera follows the character with a dead zone and smoothing, constrained to the level's declared world bounds. It cannot reveal space beyond those bounds. Static geometry and the character collide through a Phaser static group.

The character does not collide with the world's bottom edge. Falling 64 pixels below the declared world height resets body position, velocity, controller timers, pending input edges, and recenters the camera. The physical-key edge tracker is intentionally not reset, so a jump key held through a fall cannot become a new press after respawn.

## Validation observations

- Automated clock tests cover synthetic 30, 60, and 120 Hz render deltas and produce 60 simulation steps per elapsed second.
- Manual browser play at the available display rate confirmed ground acceleration, braking, full and cut jumps, static collision, short-gap traversal, camera tracking, and fall-to-spawn reset.
- No browser console warnings or errors were observed during the manual pass.

## Current limitations

- The orange rectangle is intentionally placeholder presentation.
- Controller tuning is an initial baseline and needs structured play-testing.
- There is no movement-debug overlay yet; that is Task 5.
- Browser smoke automation and measured real-display observations are Task 5.
- Wall contacts are translated, but wall sliding and wall jumping remain deferred.

