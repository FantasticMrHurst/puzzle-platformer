# Ranger Ranged-Action Lab

The Ranger lab is the smallest prototype of an aimed environmental action. Load it with `?level=ranger-lab`.

## Controls and sequence

1. Hold an aim direction with `I`, `J`, `K`, or `L`; the initial target is directly right, so hold `L`.
2. Press `F` to fire a visible shot along that aim vector.
3. Hitting the remote target latches its signal on and extends the bridge.
4. Take the Ranger, Brute, and Pet across the bridge into the shared exit.

Only the active Ranger can fire, and firing requires a non-neutral aim vector. The shot may finish traveling after a character switch. Pressing `R` removes all active shots and restores the target and bridge to their authored inactive states.

## Input and world-state seams

`KeyboardAimInput` maps the provisional keyboard bindings to a normalized `AimIntent`. The Ranger shot receives that device-independent vector; it never reads physical keys. This permits a later gamepad stick or pointer adapter without changing shot behavior.

Schema v5 adds ranged targets as latched signal sources. The powered bridge consumes the same narrow channel contract used by the mechanism lab. The prototype intentionally omits damage, enemies, ammunition, inventory, and a general projectile hierarchy.

## Play-test questions

- Is separating movement and aim onto two key clusters understandable?
- Should the Ranger remember the last non-neutral aim direction, or continue requiring an aim input while firing?
- Is a visible traveling shot more satisfying than an instant ray for environmental puzzles?
- Should targets toggle, activate permanently, or require repeated shots depending on authored configuration?
- Does ranged activation create interesting spatial decisions, or merely replace walking to a switch?
