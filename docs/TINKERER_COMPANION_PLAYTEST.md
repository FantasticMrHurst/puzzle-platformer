# Tinkerer Companion Movement Play-Test

Session sheet prepared from the movement play-test template for the local Tinkerer companion prototype.

## Session

- Date: 2026-11-26
- Commit/build: local development server, base commit `d6d7919`, working changes on `feature/tinkerer-companion`
- Tester: fill in after the session
- Browser and version: record during the session
- Operating system: Windows
- Display refresh rate: record if known
- Input device: keyboard
- Movement profile: Tinkerer `baseline-v2` plus the visual companion prototype
- Debug overlay used: optional; press `F3` to show it

## Setup

- Lab: Movement Test Room (`?level=movement-test-room`)
- Character: select slot `3` for Tinkerer
- Movement: `A`/`D` or Left/Right; jump with `W`, Up, or Space
- Reset: `R`
- Companion prototype: 16 × 24 px yellow block, 12 px following gap, 0.1 second jump delay, 64 px hop, 0.6 seconds airborne
- Note: the companion is visual-only and does not collide with level geometry.

## Test cases

### 1. Run, stop, and reverse

- Starting position/state: at the authored Tinkerer spawn, grounded and facing right
- Intended action: run for several seconds, release movement, then reverse direction
- Expected: companion follows closely behind with a visible gap and remains on the Tinkerer’s trailing side
- Result:
- Reproducibility: always / intermittent / once
- What felt good:
- What felt unclear or unresponsive:
- Notes on spacing or side changes: The companion felt too close; increase the following gap.

### 2. Short and full jumps

- Starting position/state: grounded on the long runway
- Intended action: tap jump, then repeat while holding jump; try a second jump after landing
- Expected: companion waits briefly, then makes its own noticeably shorter hop instead of inheriting the Tinkerer’s jump height
- Result: Jumping felt good.
- Reproducibility: always / intermittent / once
- Perceived delay: too short / about right / too long
- Perceived hop height: too low / about right / too high
- Did the companion stay near the take-off height while the Tinkerer was airborne?
- Notes:

### 3. Direction control in the air

- Starting position/state: grounded near a runway marker
- Intended action: jump while steering left or right, then release and steer back
- Expected: companion tracks horizontal movement while keeping the same small hop and visible spacing
- Result:
- Reproducibility: always / intermittent / once
- Notes:

### 4. Ledges, landing, and reset

- Starting position/state: near the low-running-jump target or a platform edge
- Intended action: jump onto or over the obstacle; also walk off an edge once; press `R` after the trial
- Expected: the companion follows the Tinkerer’s movement, returns to ground alignment after landing, and resets cleanly with the room
- Result: The companion did not always stay next to the Tinkerer when landing on higher platforms.
- Reproducibility: intermittent
- Did the companion appear to snap, float, or fall out of step? It sometimes fell out of step after a higher-platform landing.
- Notes: Improve the companion's vertical alignment after the Tinkerer lands.

## Session observations

- What felt good: The Tinkerer’s jump felt good.
- What felt unclear or unresponsive: The companion's follow distance felt too small, and its hop ended before the Tinkerer landed.
- Expected behavior that differed from actual behavior: The companion should stay airborne until the Tinkerer lands; it landed too soon and did not always stay next to the Tinkerer on higher platforms.
- Relevant movement overlay values:
- Console or visual errors, if any:

## Follow-up

- Main hypothesis: Extending the hop duration to align landings made the companion's movement feel worse.
- Longer-airtime trial: Increasing airborne time from 0.6 to 1.06 seconds did not feel good; the previous 0.6 second hop is restored.
- Proposed tuning or code change: Keep the 0.1 second launch delay and 0.6 second hop; retain the 12 px following gap and grounded alignment behavior.
- Risk to other movement cases: The companion may still finish its hop before the Tinkerer lands on some jumps or elevated platforms.
- Retest cases: Check the restored hop on short and full jumps and on higher-platform landings.
