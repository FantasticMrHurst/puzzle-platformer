# Crew Abilities Lab

Choose **Crew Abilities Lab** from the lab menu. To share the room with the current Pilot and Brute art enabled, use `?level=crew-abilities-lab&pilotArt=1&bruteArt=1`.

The room prototypes the agreed Brute, Pilot, and Tinkerer abilities. Its standard level data uses the existing schema. The rope anchor, cracked floor, counterweight, and lift stops have a separate typed fixture while their authoring needs are still being tested.

## Live tuning

Run `npm run dev` and choose **Crew Tuning** from the lab menu. The direct link uses `?level=crew-abilities-lab&tune=1` and enables the Pilot and Brute sprite previews. The tuning panel is available in the development build.

| Panel | Settings to try |
| --- | --- |
| Movement | Select a character and adjust run speed, jump launch, landing forgiveness, acceleration, or braking. The Pilot also has wall cling, slide, kick, and steering delay controls. |
| Animation & alignment | Adjust the Pilot or Brute's idle hold, run stride, sprite scale, or visual offset. Tinkerer uses placeholder art. |
| Room & mechanisms | Adjust gravity, rope climb speed, maximum break reach, or lift travel speed for the current room. |

Commit a field by pressing Enter or leaving it. **Restart room** restores the puzzle while keeping the current tuning. **Restore defaults** restores the authored settings. Download a JSON preset with **Save preset** and use **Load preset** to compare or share it. Reloading the page starts a fresh tuning session.

Keep terrain placement, collision dimensions and signal connections in validated level data or the lab fixture. Keep frame order, frame-specific holds, and contact markers with the art. The panel is for testing numeric choices in context. Once a value is agreed, review the preset and update the authored defaults in a PR. Large movement or gravity changes can make the existing room harder to solve, so retest the whole route after adopting them. [Art asset pipeline](ART_ASSET_PIPELINE.md)

## Controls

| Action | Keyboard | PlayStation controller |
| --- | --- | --- |
| Move and jump | A/D or ←/→, Space to jump | Left stick or D-pad, Cross to jump |
| Switch characters | 1–3 or Q/E | L1/R1 |
| Use ability | F | Square |
| Climb a deployed ladder | W/S or ↑/↓ | Stick or D-pad up/down |
| Grab or place the plug | C | Triangle |
| Reset the room | R | Options |

Use Space for wall jumps in the shaft. On the ladder, keep climbing until the character steps onto the upper deck. Release climb and move sideways to let go early.

## Playtest route

1. **Pilot.** Jump into the right wall, then wall-jump left onto the west shelf. Jump from that shelf to the upper-right deck and use the ability at the anchor to lower the rope ladder. Bring the Brute and Tinkerer up.
2. **Brute.** Stand beside the cracked floor and use the ability to break it. Follow the falling counterweight down to the lower deck. Approach the weight from the right, hold the ability, and pull it onto the plate. Leave it there to hold the gate for everyone.
3. **Tinkerer.** Approach the red plug from the left, grab it, then line up its prongs with the outlet and place it. Board the powered lift with the whole crew. Use the ability aboard to select service, then exit. An ability press at the ground call point brings the lift back down.
4. Walk all three onto the exit deck. Restart and verify the ladder stows, the floor and counterweight return, the gate closes, and the lift loses power and returns to ground.

For implementation context, see [Brute barriers](https://github.com/FantasticMrHurst/puzzle-platformer/issues/27), [Pilot ladder](https://github.com/FantasticMrHurst/puzzle-platformer/issues/28), [Tinkerer power](https://github.com/FantasticMrHurst/puzzle-platformer/issues/29), and [lift reconfiguration](https://github.com/FantasticMrHurst/puzzle-platformer/issues/33).
