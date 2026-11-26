# Tinkerer Plug Lab

The plug lab explores a deliberate carry-and-connect interaction for the Tinkerer. Load it with `?level=tinkerer-plug-lab`.

## Controls and sequence

1. Select the Tinkerer with `1` and approach the red plug.
2. Press `C` beside it to grab it.
3. Move across the room to drag the plug; the wire base stays at the first pickup point while the cable extends or retracts with a little slack.
4. Press `C` again to place the plug. If its prongs are aligned with the outlet, it snaps in and the outlet reads `POWERED`.

Only the active Tinkerer can grab or place the plug. Brute and Scout see a `TINKERER ONLY` prompt near the object. Switching characters or leaving the ground releases the plug. Press `R` to reset it to its starting location.

## Prototype behavior

- The plug is a 42 × 50 px red object, slightly smaller than the Tinkerer’s 48 × 72 px body. Two metal prongs give it a recognizable plug silhouette.
- The outlet plate is red to match the plug. Two dark sockets make the target visible from a distance.
- Press `C` once to grab; movement input carries the plug at the Tinkerer’s side. Press `C` again to drop it, or to plug it in when aligned.
- The wire base stays at the first pickup point. The cable extends and retracts with the plug without a gameplay length limit, and damped motion keeps a small amount of slack without leaving excess wire on the floor.
- The plug is visual-only and does not block characters. The wire's contact with the floor is visual; it does not affect movement or collision.
- Level schema v8 adds authored plug start and outlet positions. Older level schemas load with no plug puzzles.

## Play-test questions

- Is it clear where to stand to grab the plug?
- Does pressing `C` to grab and place feel clear and predictable?
- Is the plug’s carrying position readable without blocking the Tinkerer?
- Is the matching outlet obvious, and does snapping into place feel satisfying?
- Does the trailing wire feel fluid without feeling too loose or too springy?
- Is switching and re-grabbing behavior predictable?
