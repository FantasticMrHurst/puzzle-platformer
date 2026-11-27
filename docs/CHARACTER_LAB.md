# Character Cooperation Lab

The character traversal lab combines the first Pilot, Brute, and Pet experiments into one completable cooperation loop. Its data lives in `src/levels/data/traversal-lab.json`; both rooms use the same scene, fixed-step simulation, shared movement controller, roster, reset, and exit systems.

## Launch

Start the development server and open the lab-specific URL:

```sh
npm run dev
```

```text
http://localhost:5173/?level=traversal-lab
```

An absent `level` query continues to load the original movement test room. Unknown level IDs fail with an error listing the available IDs.

## Prototype roster

| Slot | Candidate | Profile | Body | Initial differences |
| ---: | --- | --- | ---: | --- |
| 1 | Pilot | `scout-prototype-v2` | 44 × 68 px | 340 px/s run speed, 860 px/s jump, stronger air acceleration, wall cling and wall jump |
| 2 | Pet | `pet-prototype-v2` | 48 × 36 px | Half baseline height, 350 px/s run speed, quicker ground acceleration, lower 650 px/s jump |
| 3 | Brute | `brute-prototype-v1` | 48 × 72 px | 300 px/s run speed, slower acceleration and air steering, 680 px/s jump |

These are deliberately distinct test values, not final balance.

## Cooperation sequence

1. Use the Pilot to enter the wall chamber, wall-jump to the landing, and stand on the pressure plate.
2. Leave the Pilot on the plate and switch to the Brute. The plate unlocks the reinforced lower section of the second wall.
3. Stand beside the unlocked block, hold `F`, and move right to push it until the full-height ground passage is clear.
4. Bring the Pet through the opened wall and under the 50 px tunnel.
5. Take the Pilot and Brute over the tunnel's top route, then gather all three characters in the shared exit.

The plate is momentary: the Pilot must remain on it while the Brute begins and completes the push. The block stays where it was pushed, so the Pilot can then leave the plate and rejoin the roster.

## Focused chambers

### Pilot wall chamber

- Parallel walls begin at x = 520 and x = 700 with 180 px between them.
- The left wall leaves an 80 px ground-level entry gap. The second wall is split into a fixed upper section and a reinforced lower block.
- Airborne wall contact applies a 30 px/s inward hug while input is neutral or points into the wall, preserving the contact into a 110 px/s downward slide. Pressing away intentionally releases the cling.
- During airborne wall contact, pressing jump automatically launches the Pilot away from the wall at 420 px/s horizontally and 850 px/s upward. No directional input is required.
- Horizontal air steering pauses for 0.14 seconds after the launch so the away-from-wall direction cannot be immediately cancelled.
- Wall contact remains jump-eligible for 0.18 seconds after the Pilot begins to peel away, giving the player more time to press jump.
- Brute and Pet retain ordinary falling and jumping when touching the same walls.

Evaluate whether contact is readable, the slide is controllable, the launch direction is predictable, and air control allows recovery without erasing commitment.

### Plate and Brute wall block

- The Pilot plate sits on the landing after the wall-jump chamber.
- Standing on it sends the named `split-wall-lock` signal and visibly unlocks the reinforced lower wall block.
- Only the active, grounded Brute can grip the unlocked block. Hold `F` while beside either face, then move to push or pull it.
- Ordinary contact does not move the block. Releasing `F`, jumping, switching characters, or losing contact releases the grip.

### Brute brace stance

- While grounded and away from a grippable block, tap `F` to toggle the Brute's brace stance.
- A braced Brute cannot move and remains braced after switching characters. The Pilot or Pet can pass through from below, land on top, and jump from the Brute as a temporary platform.
- Select the Brute and tap `F` again to stand. Resetting the room also clears the stance.
- The block turns yellow and reads `GRIPPED ↔` while attached; an unlocked but unattached block prompts `HOLD F`.
- Moving the block to its stop opens a 100 px-high passage for the full roster.

Evaluate whether attachment is obvious, whether push and pull directions feel predictable from either side, and whether releasing the block is immediate enough to avoid accidental dragging.

### Pet passage

- The passage spans x = 1100–1500.
- The solid ceiling leaves 50 px between its underside and the floor.
- The 36 px-tall Pet can run through the passage.
- Taller characters use the top route, making the body-size difference visible without trapping the roster.

Evaluate camera readability, collision reliability at both tunnel entrances, and whether the smaller body feels like a useful verb rather than a character-shaped key.

## Reset and completion

`R` restores all three lab characters, the plate, and the wall block to their authored state. The shared exit remains at the far right and requires the complete roster, so the cooperation sequence can now be completed in one recoverable run.
