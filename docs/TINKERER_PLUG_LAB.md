# Tinkerer Plug Lab

The plug lab explores a deliberate carry-and-connect interaction for the Tinkerer. Load it with `?level=tinkerer-plug-lab`.

## Controls and sequence

1. Select the Tinkerer with `1` and approach the red plug.
2. Press `C` within reach to grab it. The grab area extends 64 px from each edge of the plug, including above and below.
3. Run or jump with the plug in both hands. The cable stays anchored at the pickup point and swings as the Tinkerer moves.
4. Press `C` again to drop the plug. When its prongs line up with the outlet, the prompt reads `PRESS C TO CONNECT` and the plug snaps into place.

Only the active Tinkerer can grab or place the plug. Brute and Pilot see a `TINKERER ONLY` prompt near the object. The Tinkerer keeps his grip through jumps, landings, and character switches. Press `R` to reset the room and return the plug to its starting location.

## Prototype behavior

- The plug is a 42 × 50 px red object, slightly smaller than the Tinkerer’s 48 × 72 px body. Two metal prongs give it a recognizable plug silhouette.
- The outlet plate is red to match the plug. Two dark sockets make the target visible from a distance.
- The carry animation has a reach, a two-handed hold, two strides, a jump, and a landing. The plug follows the grip in each pose and falls to the floor if dropped in midair.
- The cable is a chain with two pinned ends. The middle sags, swings, and drags against the floor as the cable extends or retracts.
- The plug is visual-only and does not block characters. The wire's contact with the floor is visual; it does not affect movement or collision.
- Level schema v8 adds authored plug start and outlet positions. Older level schemas load with no plug puzzles.

## Play-test questions

- Is it clear where to stand to grab the plug?
- Does pressing `C` to grab and place feel clear and predictable?
- Is the plug’s carrying position readable without blocking the Tinkerer?
- Is the matching outlet obvious, and does snapping into place feel satisfying?
- Does the trailing wire feel fluid without feeling too loose or too springy?
- Is switching and re-grabbing behavior predictable?
