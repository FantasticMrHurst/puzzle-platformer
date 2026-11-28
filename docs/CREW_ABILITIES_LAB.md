# Crew Abilities Lab

Choose **Crew Abilities Lab** from the lab menu. To share the room with the current Pilot and Brute art enabled, use `?level=crew-abilities-lab&pilotArt=1&bruteArt=1`.

The room prototypes the agreed Brute, Pilot, and Tinkerer abilities. Its standard level data uses the existing schema. The cracked floor, counterweight, and lift stops have a separate typed fixture while their authoring needs are still being tested. The Pilot finds rope drop points from the terrain.

## Live tuning

Run `npm run dev` and choose **Crew Tuning** from the lab menu. The direct link uses `?level=crew-abilities-lab&tune=1` and enables the Pilot and Brute sprite previews. The tuning panel is available in the development build.

| Panel | Settings to try |
| --- | --- |
| Movement | Select a character and adjust run speed, jump launch, landing forgiveness, acceleration, or braking. The Pilot also has wall cling, slide, kick, and steering delay controls. |
| Animation & alignment | Adjust the Pilot or Brute's idle hold, run stride, sprite scale, or visual offset. The Tinkerer has dedicated carry poses with fixed animation settings. |
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

The Pilot carries one ladder inside the satchel. When **F · THROW ROPE** appears near a clear drop, press the ability button to pull out the coil and throw it down. The ladder reaches the first landing below, up to 480 px. The crew can climb once it unrolls. At either reachable end, wait for the crew to get off and press the ability button again to retract the ladder. The Pilot reels it toward that end and stows it inside the satchel. A room reset also returns it to the satchel.

## Playtest route

1. **Pilot.** Wall-jump onto the west shelf, cross the starting shaft, and deploy the ladder from the upper-right ledge. Bring the Brute and Tinkerer up, then have the Pilot retract the ladder.
2. **Brute.** Break the cracked floor and follow the counterweight to the main deck. Approach the weight from the right, hold the ability, and pull it onto the pressure plate to keep the service gate open.
3. **Tinkerer.** Drop from the end of the main deck while the Pilot stays above. Pass the green square, blue circle, and red triangle signs. Grab the plain red plug with C, then use the signs to choose among the three white outlets. Connect to the triangle outlet with C. It turns red and powers the lift. The other two outlets reject the plug, and the Tinkerer keeps holding it.
4. **Pilot.** Deploy the ladder at the edge of the power chamber. The lower floor is 380 px below the main deck. Have the Tinkerer climb back up, then gather the crew on the lift to the left of the drop.
5. **Tinkerer.** Use F aboard the lift to reach Service. At Service, press F again for Exit. Walk all three crew members east to the nearby exit. Press R to reset the ladder, floor, gate, plug, and lift.

<details>
<summary>Optional secret playtest</summary>

The grey wall immediately left of the lower chamber landing has a faint crack. Bring the Brute down and press F beside it to open the concealed alcove. Confirm the cavity stays covered until the wall breaks and that R reseals it. The alcove is empty for now.

</details>

For implementation context, see [Brute barriers](https://github.com/FantasticMrHurst/puzzle-platformer/issues/27), [Pilot ladder](https://github.com/FantasticMrHurst/puzzle-platformer/issues/28), [Tinkerer power](https://github.com/FantasticMrHurst/puzzle-platformer/issues/29), and [lift reconfiguration](https://github.com/FantasticMrHurst/puzzle-platformer/issues/33).
