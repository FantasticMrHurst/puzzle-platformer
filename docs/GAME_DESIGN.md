# Game Design

## Status

This is a living pre-production document. It distinguishes current direction from settled design. Unless a section says **Decision**, its details remain open to play-testing.

## High concept

A browser-based 2D puzzle-platformer about coordinating three switchable characters. Each character contributes a distinct way to move through or alter the environment, and completing a level requires the whole group to cooperate.

The intended experience combines:

- the complementary-character puzzles of *The Lost Vikings*;
- the playful environmental interactions of *A Boy and His Blob*; and
- the precision, responsiveness, and readable hazards associated with *N++*.

These are directional references, not targets for direct mechanical or visual imitation.

## Design pillars

### Precise movement

Movement should feel predictable, responsive, and satisfying before it becomes complicated. The player should understand why a jump succeeded or failed. Inputs should not be lost at common timing boundaries such as just before landing or just after leaving a ledge.

### Cooperative problem solving

Puzzles should ask the player to combine character capabilities, positioning, and timing. Character switching should produce meaningful planning rather than three isolated routes through the same space.

### Legible interactions

The environment should clearly communicate what can move, break, activate, block, or harm. Feedback should show both immediate action and remote consequences, such as a switch opening a distant gate.

### Reusable systems, surprising combinations

A small vocabulary of consistent components should create varied puzzles through arrangement and combination. One-off rules should be rare and deliberately introduced.

### Respect for experimentation

Restarts should be quick and failure should teach. Avoid long repetition between forming an idea and testing it.

## Initial player verbs

The first prototype contains only the verbs needed to evaluate movement:

- move left and right;
- jump with variable height;
- traverse platforms, walls, and gaps;
- inspect movement state through an optional debug overlay.

Interaction, character switching, wall movement, and abilities should be added only as their milestones require them. Their eventual control scheme is unresolved.

## Provisional character concepts

These archetypes establish the kind of complementarity the game may use. Names, abilities, body sizes, and exact constraints are not final.

### Brute

Provisional role: alter heavy or reinforced parts of the environment.

Candidate abilities include pushing heavy blocks, breaking barriers, bracing mechanisms, or carrying another character. The design must avoid reducing this character to a slow key for strength-marked locks.

### Scout

Provisional role: reach spaces through advanced traversal.

Candidate abilities include higher jumps, wall jumps, wall slides, and narrow-space navigation. If the shared controller eventually supports some of these moves for everyone, the Scout will need a clearer exclusive identity.

### Tinkerer

Provisional role: understand and reconfigure mechanisms.

Candidate abilities include powering devices, routing signals, repairing machines, and changing switch behavior. Interactions should remain visually understandable and should not turn every mechanism into a separate mini-game.

## Character cooperation principles

- Every character should contribute decisions, not merely be transported to the exit.
- Unique abilities should create tradeoffs and combinations rather than strict color-coded locks.
- Switching characters should be fast and should preserve the player's mental model of the level.
- Leaving a character in a location may itself be part of a solution, for example holding a plate or bracing a platform.
- Levels should minimize unrecoverable soft locks. When a state can become unwinnable, recovery should be obvious and quick.

## Initial environment vocabulary

Candidate reusable components are:

- static platforms, one-way platforms, walls, slopes if later validated, and hazards;
- pressure plates and switches;
- doors and gates;
- pushable blocks with weight or permission rules;
- moving platforms;
- trigger zones and signal connections;
- character-specific obstacles;
- spawn points, checkpoints, and level exits.

Each component needs consistent visual language, audio/animation feedback, and defined reset behavior before it becomes part of the core puzzle vocabulary.

## First playable test room

The movement test level should measure control quality rather than resemble a finished level. It should include:

- a safe starting area;
- short and long jumps at known distances;
- low and high platforms;
- a gap with clear failure/recovery behavior;
- walls suitable for collision and future wall-movement tests;
- enough horizontal space to evaluate acceleration and stopping;
- a camera boundary and a section that exercises camera follow;
- labeled or measurable geometry so tuning observations are reproducible.

Art can be simple authored shapes or clearly licensed placeholders. Readability matters more than theme in this milestone.

## Movement quality targets

The controller should eventually support configurable:

- ground acceleration and deceleration;
- maximum horizontal speed;
- separate ground and air control;
- jump speed and variable jump height;
- coyote time and jump buffering;
- wall detection, wall slide, and wall jump behavior;
- fall-speed limits and collision response;
- per-character movement profiles.

The first implementation should not enable every feature at once. Establish a baseline, expose measurements, play-test, and add one behavior at a time.

## Difficulty and accessibility direction

The target difficulty has not been selected. Regardless of final difficulty, early implementation should avoid unnecessary barriers:

- actions should be remappable in the eventual settings system;
- important state should not rely on color alone;
- camera motion should avoid surprise and provide options if strong effects are added;
- restarts and character switching should require minimal friction;
- timing windows should live in configuration so they can be tuned or exposed as assists later.

This section is intent, not a committed accessibility feature list.

## Out of scope for the initial milestone

- multiplayer and network synchronization;
- final art, animation, music, or narrative;
- the complete three-character roster;
- a full campaign, save system, or level-select flow;
- an in-browser level editor;
- procedural generation;
- mobile/touch controls unless selected as a target platform.

## Unresolved design decisions

These questions should be answered through discussion and prototypes rather than assumed in implementation:

1. What are the final three character identities and truly unique abilities?
2. Must all three characters physically reach every exit, or can completion use other conditions?
3. Can inactive characters be harmed, move autonomously, or react to nearby hazards?
4. Is switching global and instant, limited by line of sight/range, or represented in-world?
5. Are advanced moves such as wall jumping shared, character-specific, unlockable, or removed?
6. What is the primary interaction model: automatic context actions, one interaction button, or ability-specific controls?
7. What happens on death or an unwinnable puzzle state: individual respawn, room reset, checkpoint reset, or rewind?
8. What level length, difficulty curve, and target audience should guide puzzle design?
9. Is the game keyboard-first, gamepad-first, or equally committed to both? Are touch devices supported?
10. What viewport, aspect-ratio, and camera behavior are required?
11. What art direction, theme, narrative premise, and tone distinguish the game from its inspirations?
12. Are levels authored as JSON directly, exported from Tiled, or built with a later custom tool?
13. What progression, persistence, scoring, collectibles, or optional challenges exist?
14. How much execution precision should puzzles require relative to planning?
15. Which accessibility options are launch requirements?

## Near-term validation questions

The movement prototype should answer:

- Does the chosen Phaser Arcade Physics integration remain stable across common refresh rates?
- Which acceleration, stopping, air-control, jump, coyote, and buffer values feel best?
- Is a fixed simulation step practical with Phaser's scene and physics lifecycle, and what interpolation is needed?
- How should collision state be represented so movement rules remain testable?
- What telemetry makes play-test feedback specific and repeatable?

