# Forest of the Verdant Ruins — v0.1

74 original modular pixel-art assets. Individual PNGs are native resolution, RGBA. Terrain is 32×32. Scene preview is illustrative, not a playable level.

## Integration

- Use nearest-neighbor filtering; disable texture smoothing. Render at integer scale.
- `manifest.json`: file paths, dimensions, suggested collision, anchors and parallax scroll factors.
- `terrain_atlas.png`: 8 columns × 3 rows, 32px grid, no gutters. Use clamp/nearest sampling.
- Tree trunks and vines are intended for vertical stacking; place roots at ground level and canopy at trunk top.
- Set gate closed/open sprites to match collision; use pressure plates, levers and moving platforms with game-specific logic.
- Four 512×240 parallax layers repeat horizontally; draw sky first, then hills, distant forest, midground.
- `contact_sheets/` are for visual review, not runtime sprites.

Original first-pass procedural pixel art; no third-party assets included. Visual seams and collision/physics should be evaluated in-engine. No character sprites included.
