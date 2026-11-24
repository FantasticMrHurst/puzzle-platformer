# Movement Controller

The movement controller is a plain TypeScript policy layer. It does not import Phaser, read keys, own a sprite, or advance a physics world. `ArcadeBodyAdapter` supplies resolved velocity and collision contacts to and from Arcade Physics.

## Units and contracts

- Distances use pixels.
- Speeds use pixels per second.
- Accelerations use pixels per second squared.
- Timing windows and frame deltas use seconds.
- Horizontal intent is normalized to the inclusive range `[-1, 1]`.
- Upward vertical velocity is negative, matching Phaser's screen coordinates.

`MovementConfig` contains every tuning value. Character-specific movement should use another configuration object with the same controller rather than a controller subclass.

`PlayerIntent` describes actions instead of physical keys. `KeyboardInput` maps arrow keys or A/D to horizontal intent and Up, W, or Space to jump. `PlayerIntentMapper` produces press and release edges so holding jump cannot repeatedly trigger `jumpPressed`.

## Update order

For each gameplay simulation step, the controller currently:

1. validates delta, velocity, and horizontal intent values;
2. selects ground or air acceleration/deceleration from resolved contacts;
3. moves horizontal velocity toward the requested target without overshoot;
4. refreshes or expires coyote time;
5. captures a new jump press or expires the existing jump buffer;
6. consumes a buffered jump when grounded or within coyote time;
7. for profiles with wall movement enabled, consumes a buffered jump during airborne wall contact, automatically launches away from the contacted wall, and starts the configured horizontal steering lock;
8. otherwise cuts upward velocity on a jump-release edge;
9. caps downward speed and records `wall-sliding` mode when an enabled profile falls against a wall;
10. records grounded, rising, or falling mode for all other states and returns requested velocity.

The controller does not apply gravity. Arcade Physics owns gravity in the initial integration; the controller receives the body's current velocity and returns any policy-driven changes.

## Timing behavior

Coyote time is refreshed from the configured duration on grounded steps. Once airborne, it counts down to zero. A jump consumes the remaining window so one ledge departure cannot produce multiple jumps.

A jump press refreshes the jump buffer. The buffer counts down while the player cannot jump, and is consumed on the first grounded/coyote-eligible step. Releasing jump while rising multiplies upward velocity by `jumpCutMultiplier`, producing a shorter jump.

The integration layer provides contacts resolved by the previous fixed physics step. Exact ordering and catch-up behavior are documented in `docs/PHYSICS_INTEGRATION.md`.

## Optional wall behavior

Wall behavior is absent unless a movement profile supplies `wallMovement`. While touching a wall, any jump press launches the character away from that wall; horizontal input does not gate the action. This keeps the player's attention on wall contact and jump timing instead of requiring a direction change at the same instant.

The controller also remembers the last contacted wall for the configured contact-grace duration. The Scout can therefore peel slightly away and still wall-jump, similar to ground coyote time. Wall sliding still requires real wall contact; the grace window affects jump eligibility only.

The optional configuration defines maximum wall-slide fall speed, a small inward cling speed, horizontal and vertical wall-jump launch speeds, and a short horizontal steering lock after launch. The cling speed keeps Arcade contact active from the initial airborne wall touch through the downward slide while the player is neutral or pressing toward the wall; pressing away intentionally releases it. The launch lock makes the away-from-wall impulse readable before normal air control resumes; it does not disable jump cutting or vertical physics. The controller checks configuration and contacts rather than character identity, so the Scout prototype uses the same controller as baseline characters.

Wall-jump tuning, contact-grace duration, and steering-lock duration remain play-test questions. Animation and character abilities remain outside this module.

