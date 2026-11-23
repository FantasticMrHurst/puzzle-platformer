# Physics Integration

Task 4 connects the plain TypeScript movement controller to a Phaser Arcade Physics body through `ArcadeBodyAdapter`. Rendering, keyboard mapping, movement policy, and physics translation remain separate modules.

## Simulation policy

Gameplay uses a project-owned 60 Hz fixed-step accumulator. Phaser's automatic Arcade update is disabled with `customUpdate: true`; the scene explicitly advances the physics world once per gameplay step.

The accumulator accepts Phaser's unsmoothed `rawDelta` for each display frame and runs zero or more 1/60-second gameplay steps. Phaser's scene delta is intentionally not used because its startup smoothing clamps low render rates toward 60 Hz, which would make gameplay run slowly during the cooldown. The accumulator retains fractional time for the next display frame and caps catch-up work at five steps. Excess time after a long stall is discarded to avoid a spiral of death.

Synthetic clock tests produce exactly 60 gameplay steps over one second of 30, 60, and 120 Hz render deltas. These tests establish scheduling behavior; they do not replace play-testing on real displays.

## Per-frame and per-step order

Once per rendered frame:

1. `KeyboardInput` samples device state.
2. Press and release edges merge into pending intent and remain pending if no gameplay step runs.
3. The fixed-step clock determines how many gameplay steps to simulate.
4. The accumulator remainder becomes a generic interpolation factor between the previous and current authoritative positions.
5. A separate visual object is placed at that interpolated position, and the camera follows the visual.

For each gameplay step:

1. `PlayerCharacter` reads velocity and the contacts resolved by the previous physics step.
2. `MovementController` advances by exactly 1/60 second.
3. `ArcadeBodyAdapter` applies the controller's requested velocity.
4. Input press/release edges are cleared; held and horizontal state remain available to catch-up steps.
5. `world.singleStep()` advances Arcade Physics by exactly 1/60 second, resolves collisions, and synchronizes the hidden physics proxy before another catch-up step can begin.
6. The new authoritative position is recorded for presentation interpolation.
7. Falling below the world reset threshold returns the character to spawn.

Calling Phaser's paired single-step operation is important. Repeating `world.update()` before `postUpdate()` would allow the next body pre-update to restore a stale Game Object position, so controller timers could advance multiple times while displacement advanced only once.

The hidden physics proxy remains authoritative. The visible rectangle has no physics body and cannot feed an interpolated position back into collision state. Standard previous-to-current interpolation adds at most one 60 Hz step (about 16.7 ms) of presentation latency in exchange for smooth frame pacing on high-refresh and variable-refresh displays.

## Contact translation

The adapter combines Arcade's `blocked` and `touching` flags:

- either downward flag means grounded;
- either upward flag means touching the ceiling;
- a contact exclusively on the left or right produces wall direction -1 or 1;
- simultaneous contacts on both sides produce wall direction 0 because there is no unambiguous wall side.

The controller never imports Phaser and does not know about body or collider APIs.

## Camera and reset behavior

The camera follows the interpolated visual with a dead zone and smoothing, constrained to the level's declared world bounds. It cannot reveal space beyond those bounds. Static geometry collides only with the hidden authoritative physics proxy.

The character does not collide with the world's bottom edge. Falling 64 pixels below the declared world height resets body position, velocity, controller timers, pending input edges, both interpolation endpoints, and the visible object before recentering the camera. The physical-key edge tracker is intentionally not reset, so a jump key held through a fall cannot become a new press after respawn.

## Validation observations

- Automated clock tests cover synthetic 30, 60, and 120 Hz render deltas and produce 60 simulation steps per elapsed second.
- Browser cadence tests verify authoritative displacement as well as step counts, protecting multi-step catch-up behavior.
- Manual browser play at the available display rate confirmed ground acceleration, braking, full and cut jumps, static collision, short-gap traversal, camera tracking, and fall-to-spawn reset.
- No browser console warnings or errors were observed during the manual pass.

## Current limitations

- The orange rectangle is intentionally placeholder presentation.
- Controller tuning is an initial baseline and needs structured play-testing.
- Interpolation intentionally presents state up to one fixed step behind the authoritative body.
- Hardware testing on an additional physical high-refresh display remains useful; current cadence coverage includes browser emulation.
- Wall contacts are translated, but wall sliding and wall jumping remain deferred.

