# Forest of the Verdant Ruins

Open `?level=verdant-ruins` or choose **Forest of the Verdant Ruins** from the lab menu.

- Move with **A/D** or **←/→**, jump with **Space**, and climb with **W/S** or **↑/↓**.
- Press **F** to pick up a nearby crate. Press **F** again on solid ground to set it down in front of the explorer. The same key operates the tunnel lever.
- Press **R** to reset the puzzle. Once you reach the upper walkway, a fall onto spikes or a hard landing at the foot of the shaft returns you there and keeps the crate in place.

## Implementation

The forest lab uses the modular original art pack in [src/assets/verdant-ruins](../src/assets/verdant-ruins/README.md). The red explorer uses the supplied transparent recording cutouts. The idle, run, jump, landing, and carry poses use selected frames from their corresponding sequences. The ladder loop uses rear-facing turn frames, and the wall slide uses a reach pose. The carry poses include the held crate. The separate crate sprite appears on the ground. The explorer uses the existing movement controller and fixed simulation step with a lab-specific profile. Ladder travel drives the Arcade body while it is on the rungs. Crate weight activates the existing pressure plate, and the exit lever drives the existing gate. The shared props accept optional textures for this room.

Terrain and placed structures use a 32 × 32 world grid. Solid runs use contiguous collision rectangles while the tiles supply their appearance. The ladder ends at a one-way walkway whose surface matches the first opaque row in the bridge art. The canvas draws at 576 × 352 with nearest-neighbor filtering and scales in whole numbers when space permits. The sky, hills, distant forest, and midground repeat horizontally at manifest scroll factors 0, 0.12, 0.28, and 0.52.

## Playtest notes

The browser run checked blocked movement at the left wall and both gates, the crate making contact with the plate, traversal across the tiled floor, the ladder-to-walkway handoff, a retry from the spike bed, and a wall slide into the exit tunnel. It also checked horizontal and vertical camera travel, parallax ordering, integer display scaling, and a full reset after completion.
