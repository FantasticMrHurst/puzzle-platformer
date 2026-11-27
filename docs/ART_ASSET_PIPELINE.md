# Art asset pipeline

This guide covers sprites, animations, and tiles for the Brute, Pilot, and Tinkerer game. Use the Crew Abilities Lab to prove an asset at gameplay scale before expanding it into a full set. The specifications below are the starting point for the vertical slice.

## What the labs tell us

- **Keep the movement and art separate.** The crew already uses a hidden Arcade Physics body with a separately interpolated visual. The shared pose player picks jump poses from actual movement, and running cycles advance with distance. Keep those properties so changing a sprite or a clip cannot change jump height, collision, or ability timing. [Physics integration](PHYSICS_INTEGRATION.md) · [Shared pose player](../src/rendering/CharacterPosePlayer.ts)
- **Use the current previews as art references.** The Pilot's cape and narrow silhouette and the Brute's broad stance already distinguish the two. Both have grounded idle frames with a consistent baseline. The crew lab still shows the Tinkerer as a placeholder and uses labels to explain several interactions. The next art test should put the trio and the actual props together so their shapes and actions can do more of that work. [Crew Abilities Lab](CREW_ABILITIES_LAB.md)
- **Use named frames and shared playback.** The Pilot and Brute each load a native-size atlas from a single art definition. Keep timing and origins in the art definition and use the shared player to drive their poses. The Tinkerer uses a placeholder until a matching atlas is ready. [Character art definitions](../src/rendering/CharacterArt.ts)
- **Review the crew together.** Use the gameplay camera in the Crew Abilities Lab as the first comparison for silhouettes and contact points. Confirm the intended viewport and visual scale before finishing the production atlases. [Crew game config](../src/game/config.ts)

### Measured browser baseline

In a cold Chromium load of the production crew lab, the Pilot and Brute used two atlas PNGs totaling 408 KiB and two atlas JSON responses totaling about 1 KiB. The previous build loaded 61 individual character PNGs totaling 432 KiB. The untrimmed rows and padding raise estimated decoded RGBA from about 2.50 MiB to 2.92 MiB. GPU usage and target-laptop frame pacing still need a playthrough profile.

## Shared art direction

Start with one representative screen containing the three characters, a floor and wall corner, and one object from each ability chain. Review it at gameplay scale, then zoom in for pixel cleanup.

- Give each character a distinct silhouette in idle, motion, and when standing next to the other two. Keep the Pilot's cape and quick shifts of weight, the Brute's mass and deliberate contact, and give the Tinkerer a readable tool or cable shape. Agree on the Tinkerer's silhouette in that screen before drawing a full set.
- Use stepped silhouettes and restrained contrast to give the setting depth. Reserve the strongest contrast for the characters, landable edges, and puzzle props. Agree on a palette strip, light direction, and outline treatment using the same room.
- Check interaction states in grayscale or with the color muted. A cracked floor should have a distinctive break line, a ladder anchor should have a recognizable socket or hook, and a live outlet or selected lift stop should change shape, indicator, or label as well as color.
- Build the pose around the point of contact. Plant the foot, hand, or tool first. Add cape follow-through, coat movement, recoil, or settling afterward. Use a few strong poses and deliberate holds before adding in-betweens.

## Character sprite specifications

| Field           | Starting specification                                                                                                                                                                                                                                 |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Source          | Keep editable, layered masters in shared storage. Export approved runtime art to the repository with its source reference and credit or usage terms. Follow the repository's rules for licensed source files.                                          |
| Runtime frame   | Transparent RGBA PNG, sRGB, **96 × 112 px** at native size for the trio. Leave room for feet, hands, capes, and tools to travel within the frame.                                                                                                      |
| Origin          | **(48, 96)** in the untrimmed frame, measured from the top-left. This is the character's ground reference at the center of the body. Keep it fixed across poses. Airborne feet may rise above that reference.                                          |
| Facing          | Author the standard set facing right. Preview it mirrored. Include explicit left-facing frames when an asymmetric tool, costume detail, or wall pose reads incorrectly after mirroring. State the authored direction for each exception.               |
| Naming          | Use lowercase stable names such as `pilot_run_01.png`, `brute_break_01.png`, and `tinkerer_plug_place_01.png`. Keep frame order in the handoff rather than relying on filenames to choose timing.                                                      |
| Contact markers | Record frame-local coordinates for the planted foot, wall hand, ladder grip, crate hand, or tool tip where relevant. Preview at least one matching in-game contact before finishing the set. The game's body and interaction checks govern the action. |

Deliver individual frames or a uniform review sheet with its cell size, order, margins, and spacing. Use one of those as the editable handoff. Pack approved frames into a Phaser atlas PNG plus JSON for runtime, with named frames, 2 px of extruded edge padding as a starting point, and rotation disabled initially. If trimming, preserve original frame dimensions and offsets and verify the feet and flip in-engine. Load the atlas as the runtime copy. Keep source frames available for re-export. The current crew atlases use untrimmed 96 × 112 frames, 2 px of extrusion on each edge, and Phaser JSON Hash metadata. Do not add unused poses to the atlas. [Phaser texture loading](https://docs.phaser.io/phaser/concepts/textures)

## Animation specifications

Start with 4–8 idle and 6–8 run frames per character. A jump needs clear liftoff, rise, apex, descent, and landing poses. Add a brake or turn when an in-game test shows the need. These counts are starting ranges. Holds and silhouette changes should come from the motion being portrayed.

| Character    | First ability poses to author                                                                                                                                                                              |
| ------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Pilot**    | Wall contact, cling or slide, kick away, and recovery. Rope deploy anticipation and release, ladder mount, alternating climb grips, and top dismount.                                                      |
| **Brute**    | Grip and release, separate push and pull cycles with stable hand placement, and break anticipation, impact, and recovery.                                                                                  |
| **Tinkerer** | Grab, carry, and place a plug with visible hand or tool contact. Operate a panel and react to the selected stop or machine state. Keep the plug and outlet as separate props so their state can be reused. |

- **Idle and one-shots.** Supply frame holds in milliseconds. Put the intended contact or impact frame in the handoff so animation, sound, and effects can line up with the gameplay event.
- **Run and grip locomotion.** Provide frame order and target distance for one cycle, in world pixels. Tune the distance at walking and full speed on the flat floor. Frame holds and the cycle distance are animation settings.
- **Jump, wall, ladder, and landing.** Bind poses to gameplay phase and direction. Verify short and full jumps, both wall sides, climbing pause, and the first and last rungs. Enter and leave poses when the movement or action changes.
- **State ownership.** Gameplay decides when contact, breaking, deployment, power, and lift movement happen. Presentation chooses a clip and places effects using contact markers. Keep required frame IDs, timing, and origin in one character definition and fail on missing frame IDs during development.

A handoff can be this small. These are example values to show the format. Translate the reviewed clip data into the runtime art definition.

```json
{
  "character": "pilot",
  "frameSizePx": [96, 112],
  "groundOriginPx": [48, 96],
  "facing": "right",
  "clips": {
    "run": {
      "frames": [
        "pilot_run_01",
        "pilot_run_02",
        "pilot_run_03",
        "pilot_run_04"
      ],
      "playback": "distance",
      "cycleWorldPx": 160,
      "loop": true
    },
    "rope_deploy": {
      "frames": [
        "pilot_rope_deploy_01",
        "pilot_rope_deploy_02",
        "pilot_rope_deploy_03"
      ],
      "playback": "timed",
      "frameHoldsMs": [90, 65, 105],
      "contactFrame": "pilot_rope_deploy_02",
      "contactMarkerPx": [73, 46],
      "loop": false
    }
  }
}
```

## Tiles, props, and backgrounds

- **Terrain.** Use a **32 × 32 px logical grid** for solid terrain and modular layout. Start with a repeatable top, fill, ends, inside and outside corners, and an underside. Make a 3 × 3 seam preview to check every tile family beside itself and its intended neighbors. Place the walkable line at the intended collision height and keep art overhangs decorative. Merge long solid runs into contiguous collision geometry.
- **Props.** Export each state at a shared origin and bounds, including inactive and active, open and closed, cracked and broken, and unpowered and powered as applicable. Include a manifest entry with stable ID, dimensions, anchor, grid footprint, and any intended interaction or collision line. Preview a gate when its doorway is occupied and a plate under a stationary crate.
- **Parallax.** Keep repeating layers in separate textures and test both ends of the horizontal loop while scrolling. For Phaser 3 WebGL TileSprites, choose power-of-two source dimensions such as 512 × 256 to avoid internal resizing. Keep each repeating viewport layer only as large as needed on screen. Check seams and sharpness when the camera scrolls in both directions. [Phaser 3.90 TileSprite](https://phaser.io/oss/docs/api-documentation/3.90.0/class/gameobjects-tilesprite)
- **Sampling and scale.** Use nearest-neighbor texture sampling for pixel art and prefer whole-number presentation scaling where space permits. Check quality at the actual browser window size. Keep display scaling separate from body size and the tile grid. Use atlas padding for tiled art. Move from individual tile objects to a culled tilemap or chunked drawing if a larger room profile shows rendering or object overhead.

## Handoff and playtest

1. **Agree on the gameplay moment.** Write one sentence describing what the player needs to see or understand. Sketch the key pose or tile corner, with its contact and scale. Either contributor can start an asset while the other builds the matching playtest fixture.
2. **Deliver a small first pass.** Share the source link, exported frames or tiles, ordered clip list, and anchors. Include a still that shows the sprite beside the other characters or the tile beside its neighbors. Keep reference boards, raw recordings, and editing files outside the shipped game.
3. **Integrate and play.** Use a short room and the real camera. Run left and right, start and stop, jump, land, switch characters, use each relevant ability, and reset. Look for planted feet, contact drift, seams, flicker on scroll, occlusion, and readable signals. Test keyboard and the supported controller when an asset represents an input prompt.
4. **Measure the production build.** Run `npm run build` and `npm run preview`. In DevTools Network, reload without cache and record art requests and encoded bytes. Account for inlined art when comparing builds. In Performance, record a repeatable sequence with camera movement, all three characters, and active props. Track dropped frames and recurring long frames on a target gaming laptop. Record browser, renderer, viewport, and hardware with the result. [Chrome Network panel](https://developer.chrome.com/docs/devtools/network) · [Chrome Performance panel](https://developer.chrome.com/docs/devtools/performance/reference)
5. **Review and merge.** Link the playable room and source handoff in the PR. Include a short clip captured at gameplay scale and the before/after load or memory figures if the texture set changed. Record the final export settings so either contributor can reproduce the result.

### Starting performance targets

For the first vertical-slice room, aim for **at most 12 initial raster requests**, **about 1 MiB or less of encoded art**, and **about 16 MiB or less of decoded RGBA for loaded texture sources**. These are initial working budgets to verify on the target laptop. Track frame pacing during a representative section, with a steady 60 fps as the first baseline. A 60 Hz display gives about 16.7 ms per frame.

Start with one small atlas per crew character and one for the room's shared terrain and props. Keep repeating parallax sources separate and load by room. Try to fit an atlas page within 2048 × 2048, using smaller pages where the art fits. A full RGBA page at that size alone represents 16 MiB before overhead. Compare actual packed dimensions and bytes against the loose originals.

## First production art pass

1. **Choose one corner of the Crew Abilities Lab.** Create a single production-scale reference screen with a Tinkerer idle, one solid floor and wall family, and the rope anchor, cracked floor, and power panel. Use the existing Pilot and Brute art to judge scale and style together.
2. **Prove one action per character.** Play the Pilot's rope deploy, the Brute's break, and the Tinkerer's plug placement with contact markers. Tune feet and hands before extending the frame lists.
3. **Prove the packaging on that room.** Compare one packed character and native-size textures with the production baseline. Record load and frame pacing. Expand the same handoff to the rest of the slice once both contributors can reproduce it.
