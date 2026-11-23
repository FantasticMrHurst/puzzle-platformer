# Movement Tuning Baseline

Status: **Approved**

Confirmed: **November 22, 2026**

`baseline-v1` is the approved shared movement profile for the prototype and the starting point for the character-cooperation milestone. It was confirmed after manual play testing of running, stopping, jumping, air control, collision, camera behavior, and fall reset.

These values are a stable reference, not a prohibition on future tuning. Character-specific profiles may intentionally differ, and changes to the shared baseline should be recorded under a new profile version so comparisons remain reproducible.

## Change policy

- Preserve `baseline-v1` as the reference profile used for the completed movement milestone.
- Create a named character profile when behavior intentionally differs by character.
- Record future shared tuning as a new baseline version rather than silently changing this table.
- Re-run the movement test room, unit tests, and browser smoke tests after changing movement behavior.

## Baseline values

| Setting | Value | Unit |
| --- | ---: | --- |
| Maximum run speed | 320 | px/s |
| Ground acceleration | 2400 | px/s² |
| Ground deceleration | 3000 | px/s² |
| Air acceleration | 900 | px/s² |
| Air deceleration | 250 | px/s² |
| Jump speed | 650 | px/s upward |
| Maximum fall speed | 900 | px/s |
| Early-release jump multiplier | 0.45 | ratio |
| Coyote time | 0.100 | seconds |
| Jump buffer | 0.120 | seconds |
| Gameplay step | 60 | Hz |

At maximum acceleration, the character reaches full ground speed in approximately 0.133 seconds and stops from full speed in approximately 0.107 seconds. These calculated values help compare profiles; feel must still be judged through play.

## Validation record

| Condition | Method | Observation |
| --- | --- | --- |
| Available display rate | Manual browser play | Acceleration, braking, short/full jumps, collision, camera tracking, gap reset, and overlay toggle behaved consistently; no console errors |
| 30 Hz rendering | Browser `requestAnimationFrame` emulation | Fixed-step count remained approximately 60 simulation steps per elapsed second |
| 60 Hz rendering | Unit scheduler plus normal browser run | Scheduler produced exactly 60 steps per synthetic second; normal play remained responsive |
| 120 Hz rendering | Browser `requestAnimationFrame` emulation | Input edges persisted across render frames without losing the control update; fixed-step count remained approximately 60 per second |

The browser emulation changes render callback cadence; it does not reproduce every property of a physical high-refresh display. Hardware testing should be repeated when suitable displays are available.

## First play-test questions

- Does ground acceleration feel immediate without making direction changes abrupt?
- Is stopping distance predictable at the runway markers?
- Does the short jump offer a useful height difference from a held jump?
- Are the coyote and buffer windows helpful without feeling automatic?
- Is air control sufficient for correction without erasing commitment?
- Does camera smoothing lag behind fast direction changes or respawns?

