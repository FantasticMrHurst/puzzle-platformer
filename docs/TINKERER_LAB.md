# Tinkerer Powered-Mechanism Lab

The mechanism lab is the smallest prototype of the Tinkerer's first verb: deliberately operate a powered mechanism that creates a useful route for the whole team. Load it with `?level=mechanism-lab`.

## Prototype roster

1. Tinkerer operates the console.
2. Brute verifies that the resulting route supports a full-height character.
3. Pet verifies that the route is useful to a differently sized teammate.

All three use the shared `baseline-v2` movement profile except for the Pet's existing body and movement configuration.

## Cooperation sequence

1. Move the Tinkerer beside the blue bridge console.
2. Press `F` when the console reads `PRESS F · EXTEND`.
3. The connected bridge turns green and gains collision across the gap.
4. Switch characters and take the full roster across the powered bridge into the shared exit.

Pressing `F` at the powered console again retracts the bridge. Only the active Tinkerer can operate it. Switching suppresses a held ability key, so control transfer cannot accidentally toggle the console. `R` restores the console and bridge to their authored unpowered state.

## Data and ownership

Schema v4 adds `mechanismConsoles` and `poweredBridges`. A console owns its latched powered state and publishes that state on an authored channel. A bridge consumes its channel and owns its collision and presentation. The scene coordinates the two through the existing narrow signal lookup; neither component reaches into the other.

## Play-test questions

- Is the usable range and `F` prompt obvious without additional explanation?
- Is the off/on bridge state readable before the player risks the gap?
- Does toggling feel like operating a mechanism rather than opening a character-colored lock?
- Is a persistent toggle more interesting than a held or timed power action?
- What second receiver would make rerouting power more meaningful than a single bridge switch?
