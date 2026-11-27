# Character development standard

Use this guide when adding a crew character, changing an ability, or replacing character art. The production roster is **Pilot, Brute, and Tinkerer**. The Crew Abilities Lab is the shared gameplay reference.

## Audit of the current implementation

| Area               | Standard and outcome                                                                                                                                                                                                                                                                                |
| ------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Input and movement | Retain device-independent intent, one movement controller, and fixed-step Arcade Physics. The roster sends live intent to the selected character and neutral intent to their teammates. Each character keeps an independent controller instance and profile.                                        |
| Body and camera    | The character catalog owns body dimensions. A separate visual follows the authoritative body through interpolation. Sprite scale, atlas frame bounds, and visual offsets do not change how the character fits through a passage.                                                                    |
| Ability ownership  | The catalog declares capabilities. An interactive object checks permission, contact or range, and its current state before acting. The room owns signals and resets. Existing authored archetype restrictions still apply to objects that declare them.                                             |
| Animation          | Pilot and Brute share one pose player, one atlas-loading path, and one art definition each. Locomotion uses movement and contact data. Idle uses elapsed time and run and grip cycles use distance.                                                                                                 |
| Remaining work     | Rope deployment and climb, Brute break, and Tinkerer lift operation still need dedicated poses. The Tinkerer already has plug carry poses. The scene still coordinates some older lab-specific actions. Add an action presentation hook when its art is ready to playtest. |

The engine supports separate body sizing and named frame-based animation. We keep the project-owned pose selection because it uses our fixed-step movement contacts, velocities, and action state. [Phaser Arcade Body](https://docs.phaser.io/api-documentation/3.90.0/class/physics-arcade-body) · [Phaser animation frames](https://docs.phaser.io/api-documentation/3.90.0/class/animations-animation) · [Phaser atlas frame metadata](https://docs.phaser.io/api-documentation/3.90.0/class/textures-frame)

## Where each change belongs

| Change                                                                        | Source of truth                                                                                                           |
| ----------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| Identity, label, collision size, movement values, capabilities, art reference | [CharacterCatalog.ts](../src/entities/CharacterCatalog.ts)                                                                |
| Jump, braking, wall contact, and landing rules                                | [MovementController.ts](../src/movement/MovementController.ts) and [MovementConfig.ts](../src/movement/MovementConfig.ts) |
| Texture key, named frames, ground origin, and visual defaults                 | [CharacterArt.ts](../src/rendering/CharacterArt.ts) and [PoseTuning.ts](../src/rendering/PoseTuning.ts)                   |
| Visual pose selection, facing, and playback                                   | [CharacterPosePlayer.ts](../src/rendering/CharacterPosePlayer.ts)                                                         |
| Shared prompts, components, and resettable interactions                       | [Environment components](../src/environment) and [level data](../src/levels/data)                                         |
| Live experimentation and sharing settings                                     | [Crew Abilities Lab](CREW_ABILITIES_LAB.md) and the development-only Crew Tuning panel                                    |

## Add or revise a character

1. **Define a reason to switch.** Specify the problem the character solves, who gets them into position, and how their action helps someone else advance. Author a small room with a successful route and a recovery path.
2. **Register a definition.** For a new archetype, add a stable ID to the existing archetype list and add the matching catalog entry. Start with the shared movement defaults and change only the values that support the role. Opt into wall movement through the controller's typed wall profile. Choose the collision size using authored clearances and landings.
3. **Connect the interaction.** Reuse the current input intent and component where possible. Give the character a capability if an object needs to check who can use it. Keep the object's eligibility checks and state transitions together. A teammate may still use a shared control such as a pressure plate or the lift call point. Record which states survive switching and which states reset on restart.
4. **Attach art by configuration.** Add a native-size atlas PNG and named-frame JSON, then register it in `CharacterArt.ts` and reference it from the catalog. Existing player construction, preloading, and the crew tuning panel can discover the registered art. Author an explicit hook for a new action pose when gameplay can report when that action is active. Use the [art export specifications](ART_ASSET_PIPELINE.md).
5. **Tune in context.** Open Crew Tuning, compare values against authored defaults, and save experiments as JSON. When you agree on a change, update the catalog or art definition in the PR and keep the room solvable. For example, retest the counterweight grip if you change the Brute's run speed because the block has its own speed cap. Keep hitbox adjustments and changes to puzzle signal behavior reviewable as gameplay changes.

## Release checks for a character change

- Exercise short and full jumps, start and stop, landing, facing changes, and wall behavior where supported. Review the visible contact and authoritative collision at the same time.
- Switch while another character is moving or an ability-created object is active. Verify inactive teammates, ability ownership, whole-room restart, and the shared exit. Check that a wrong character receives readable feedback or cannot trigger a restricted interaction.
- Verify the requested atlas loads and every configured frame is present. Watch the idle seam, run stride, mirrored poses, and overlaps with a crate, wall, or ladder. Check the production build in Network and profile representative play on a target gaming laptop before expanding the art set.
- Include the lab link, any changed defaults, and a short clip or playtest note in the PR. Keep prototype-only moves in their existing labs until the team explicitly chooses to bring them into the production roster.
