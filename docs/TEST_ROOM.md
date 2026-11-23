# Movement Test Room

The movement test room is deliberately diagnostic rather than a finished level. Its geometry lives in `src/levels/data/test-room.json` and is instantiated by `TestRoomScene`; the scene does not maintain a duplicate geometry list.

Coordinates use pixels with the origin at the world's top-left. Static rectangles use top-left `x` and `y` coordinates.

## World measurements

- World bounds: 3600 × 1080 px.
- Nominal floor top: y = 920 px.
- Roster spawn markers: (160, 840), (240, 840), and (320, 840).
- Grid spacing: 64 px.

## Diagnostic obstacles

| Geometry | Measurement | Purpose |
| --- | --- | --- |
| Start ground | x 0–900, top y 920 | Safe spawn and approximately 700 px of acceleration runway after the spawn |
| Low platform | 180 × 32 at (300, 790) | 130 px rise test |
| High platform | 180 × 32 at (580, 680) | 240 px rise test |
| Short gap | x 900–1060 | 160 px baseline running gap |
| Middle step | 180 × 32 at (1260, 820) | Low running-jump landing target |
| Long gap | x 1620–1960 | 340 px long-jump target |
| Wall pair | x 2320 and 2540, 220 px apart | Collision checks and future wall-movement tuning |
| Recovery gap | x 2720–2900 | 180 px gap before the end ground |
| World boundaries | 40 px walls at each horizontal edge | Camera and collision boundary checks |

The dimensions are initial measurement fixtures, not final movement targets. Adjusting an obstacle to match a controller profile should be an explicit tuning change with updated documentation.

## Current roster behavior

- Schema version 2 defines one to three character spawns with stable IDs and candidate archetypes.
- The current room loads Brute, Scout, and Tinkerer placeholders using the shared `baseline-v1` movement profile.
- Number keys select roster slots directly; `Q` and `E` cycle selection.
- Inactive characters continue through physics with neutral movement input and do not collide with one another.
- The camera follows the selected character, whose label and heavier outline indicate active control.
- If any roster member falls below the room, all three return to their authored spawns and selection returns to slot one.
- All authored geometry remains fully solid. One-way platforms are not part of schema version 2.

