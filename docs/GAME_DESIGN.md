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

## Selected roster

| Character | Abilities |
| --- | --- |
| Brute | Push and pull heavy objects, and break marked barriers. |
| Pilot | Cling and wall-jump, and deploy a rope ladder for teammates. |
| Tinkerer | Route power and reconfigure powered machinery. |

All three can use ordinary pressure plates, buttons, and switches. The [Crew Abilities Lab](CREW_ABILITIES_LAB.md) is the reference for how their abilities work together. See the [character development standard](CHARACTER_DEVELOPMENT.md) for implementation and playtest guidance.

## Earlier character experiments

These notes record the concepts evaluated in Milestone 2. Use the selected roster above for the vertical slice.

### Brute

Provisional role: reposition heavy or reinforced parts of the environment.

Candidate abilities include pushing and pulling heavy blocks, breaking barriers, bracing mechanisms, or carrying another character. Pulling uses a clear grip state so ordinary movement does not accidentally drag objects. The current brace experiment lets the Brute become a stationary one-way platform for another character, creating a cooperative height boost without a separate carry system. The design must avoid reducing this character to a slow key for strength-marked locks.

### Pilot

Provisional role: reach spaces through advanced traversal.

Candidate abilities include higher jumps, wall jumps, wall slides, and narrow-space navigation. If the shared controller eventually supports some of these moves for everyone, the Pilot will need a clearer exclusive identity.

### Tinkerer

Provisional role: understand and reconfigure mechanisms.

Candidate abilities include powering devices, routing signals, repairing machines, and changing switch behavior. Interactions should remain visually understandable and should not turn every mechanism into a separate mini-game.

### Ranger

Provisional role: manipulate the environment precisely from a distance.

Candidate abilities include hitting remote targets, cutting or attaching ropes, pinning moving objects, and creating temporary tether lines. The ranged verb should primarily support environmental problem-solving rather than turn the game into a combat platformer.

### Pet

Provisional role: enter, inspect, and affect spaces the other characters cannot reach directly.

The Pet should have a substantially shorter collision body for small passages. Candidate abilities include retrieving small objects, crawling through machinery, following readable scent trails, and riding with another character when regrouping. Small tunnels alone are not enough: actions inside them should change the shared puzzle for the rest of the team.

### Gardener

Provisional role: reshape traversal and mechanisms by growing temporary plant structures.

Candidate abilities include growing vines, platforms, bridges, roots that restrain objects, and plants that react to water or light. Growth rules and limits must remain predictable, visually legible, and easy to reset.

## Character prototype evaluation

Milestone 2 is a playability lab, not a commitment to ship six characters. Each candidate should receive the smallest prototype that expresses its defining verb. Prototypes may use focused test chambers rather than requiring all abilities in one polished level.

Evaluate each candidate against the same questions:

- Is the defining action enjoyable and understandable without lengthy instruction?
- Does it create useful consequences for the whole team rather than an isolated character-only route?
- Can the action combine with multiple characters and environmental systems?
- Is the character still interesting when its obvious matching obstacle is absent?
- Does the character create excessive aiming, physics, reset, camera, or level-authoring complexity?
- Can the player recover and regroup without tedious backtracking or frequent soft locks?
- Is the character's movement, silhouette, and interaction language clearly distinct from the other candidates?

The initial prototype verbs are:

| Candidate | First verb to test |
| --- | --- |
| Brute | Grip/push/pull a heavy block; brace as a character platform |
| Pilot | Wall slide and wall jump |
| Tinkerer | Operate or reconfigure a powered mechanism |
| Ranger | Aim and fire one environmental shot that toggles a remote target |
| Pet | Traverse a half-height passage and retrieve or activate something useful |
| Gardener | Grow one temporary, resettable traversal structure |

## Character cooperation principles

- Every character should contribute decisions, not merely be transported to the exit.
- Unique abilities should create tradeoffs and combinations rather than strict color-coded locks.
- Switching characters should be fast and should preserve the player's mental model of the level.
- Leaving a character in a location may itself be part of a solution, for example holding a plate or bracing a platform.
- Levels should minimize unrecoverable soft locks. When a state can become unwinnable, recovery should be obvious and quick.

## Milestone 2 switching rules

**Decision for prototype:** Switching is global, immediate, and available during ordinary movement. A playable scenario contains up to three characters selected from the candidate roster; the playability lab does not place all six candidates into every room.

- Exactly one character receives player intent at a time.
- Direct selection and previous/next cycling are both supported. Initial keyboard mappings are number keys for direct selection and `Q`/`E` for cycling; these bindings remain provisional and must be represented as named actions.
- Switching has no cooldown, range, or line-of-sight requirement.
- The newly inactive character retains its position and physical momentum, then continues to obey gravity and collisions with neutral movement input. It does not walk, jump, or use abilities autonomously.
- Inactive characters remain part of the puzzle and can continue holding plates, bracing objects, or sustaining an already-created world effect when that ability explicitly allows it.
- A held or channeled action ends on switching unless its prototype defines a persistent result. Input press edges are cleared during control transfer so held keys cannot trigger an action on the newly selected character.
- Characters do not collide with one another during the first prototype. This avoids accidental blocking and stacking while object and environment collisions are evaluated.
- Switching changes control immediately. The camera follows with a short eased transition and does not pause input while moving.
- Selection feedback includes a marker and character label or icon; it must not rely on color alone.
- Hazard behavior for unattended characters remains deferred until a prototype contains meaningful hazards. The initial character lab should not punish the player with unseen off-camera threats.

These rules should be revisited if play tests show that unrestricted switching removes useful tension, camera travel causes disorientation, or neutral inactive physics makes precise placement unreliable.

## Milestone 2 cooperation and completion rules

**Decision for prototype:** A scenario is complete when all three characters in its active roster reach the shared exit. Candidate-focused chambers may use a shorter local objective, but they must still demonstrate how the candidate creates value for the team.

- All characters retain the baseline movement fundamentals and use the same movement controller. Typed profiles may adjust values such as jump height, acceleration, or body dimensions.
- Advanced traversal is character-specific when it defines a candidate's role. The first such experiment is the Pilot's wall slide and wall jump.
- `F` is the initial contextual interaction or primary-ability key. Abilities consume named actions, not physical keys. Aimed abilities also consume device-independent aim intent.
- Automatic interactions are reserved for unambiguous physical behavior such as standing on a plate. The Brute prototype confirms that moving a heavy object is deliberate: hold the contextual action while beside an unlocked block, then move to push or pull it. Using a console, firing a tether, or growing a plant likewise requires input.
- Keyboard is the first supported input device. The action contracts must permit a gamepad adapter later without changing gameplay rules; touch controls are out of scope for Milestone 2.
- The prototype targets current desktop Chromium browsers. Broader browser certification and required gamepad support are later decisions.

## Milestone 2 reset and recovery rules

**Decision for prototype:** Recovery uses a fast whole-room reset to the latest checkpoint, with no lives, inventory penalty, rewind system, or persistent failure cost.

- `R` manually resets the room so a player can immediately recover from a soft lock.
- Falling out of the world or a future character-death event triggers the same whole-room reset.
- A reset restores all three characters, active selection, puzzle objects, mechanisms, ability-created objects, and completion state to the checkpoint snapshot.
- Until checkpoint entities are implemented, the authored room start is the checkpoint.
- Reset feedback should be brief and readable; it must not require reloading the page or replaying a long traversal.

Whole-room reset is intentionally simple and deterministic for the character lab. Individual respawn, rewind, and partial puzzle persistence can be reconsidered only after a designed scenario demonstrates a clear benefit.

## Milestone 2 authoring direction

**Decision for prototype:** Continue authoring validated JSON directly. Candidate chambers should extend the existing versioned level data only as required by a current prototype. Reconsider Tiled or another authoring tool when repeated geometry editing becomes a measured bottleneck.

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
2. How should inactive characters react to hazards once meaningful hazards exist?
3. What level length, difficulty curve, and target audience should guide puzzle design?
4. What viewport and aspect-ratio requirements should guide final camera behavior?
5. What art direction, theme, narrative premise, and tone distinguish the game from its inspirations?
6. What progression, persistence, scoring, collectibles, or optional challenges exist?
7. How much execution precision should puzzles require relative to planning?
8. Which accessibility options are launch requirements?

## Near-term validation questions

The movement prototype should answer:

- Does the chosen Phaser Arcade Physics integration remain stable across common refresh rates?
- Which acceleration, stopping, air-control, jump, coyote, and buffer values feel best?
- Is a fixed simulation step practical with Phaser's scene and physics lifecycle, and what interpolation is needed?
- How should collision state be represented so movement rules remain testable?
- What telemetry makes play-test feedback specific and repeatable?

