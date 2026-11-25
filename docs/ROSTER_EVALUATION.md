# Milestone 2 Roster Evaluation

## Mixed-team playtest

Open `?level=cooperation-lab` with the local development server running.

1. Select Ranger (`1`), hold `L`, and tap `F` to activate the far-bank target from the starting area.
2. Switch to Gardener (`2`), cross the first bridge, and press `F` near the seed bed. The grown platform splits the climb into two jumps. Land on the plant before jumping onto the ledge.
3. Switch to Tinkerer (`3`), climb the same route, and press `F` at the console to power the final bridge.
4. Bring all three to the exit. Use `R` to restart.

The browser run reached the shared exit with all three characters. After a manual reset, the first target and bridge returned to their inactive states. Walking into the unbridged gap triggered a whole-room reset.

## Scout, Brute, and Ranger playtest

Open `?level=scout-brute-ranger-lab` to try the Ranger as the third member of the Scout and Brute team.

1. As Scout (`1`), jump right into the purple wall. Release and press jump again to kick left onto the plate. Leave the Scout on the plate.
2. As Brute (`2`), approach the unlocked block, hold `F`, and push right until it stops. The block stays shifted when the Scout leaves the plate. Jump over the shifted block after clearing the overhead wall.
3. Move Brute onto the teal strip and tap `F` to brace. Switch to Ranger (`3`), jump onto Brute, then hold `L` and tap `F` to hit the target straight across.
4. Once the bridge turns green, switch back to Brute and tap `F` to release the brace. Bring all three to the exit. Press `R` to restart.

The target lines up with a horizontal shot from the Ranger while standing on the braced Brute. A horizontal shot from the ground passes below it. This gives the Brute's brace a second use after moving the block.

## Candidate observations

These are preliminary observations from the focused labs and the mixed-team run. During developer playtests, note which actions you understood without guidance, which you wanted to repeat, when switching felt useful, and whether a mistake was easy to undo.

- **Scout.** Wall clinging makes vertical exploration a distinct movement role. Reaching the plate turns that access into a team benefit. Wall timing and chamber geometry still shape how forgiving the route feels.
- **Brute.** Grip, pull, and brace offer several ways to help a teammate. The same contextual key handles grip and brace, so clear feedback matters when switching between them.
- **Pet.** The small body makes its route easy to read. The current tunnel demonstrates access for the Pet. Letting the Pet open a route for someone else would test its contribution to the team.
- **Tinkerer.** The nearby console is easy to understand and easy to reverse. A single console and bridge give the Tinkerer few decisions after reaching the console. Routing power between competing devices would test a broader role.
- **Ranger.** The first bridge rewards acting from a distance, while the separate aiming controls add an input learning cost. The mixed lab uses a straight shot and leaves aiming under pressure and target placement open for playtesting.
- **Gardener.** Growing the step changes how everyone climbs and makes its effect visible. The Brute can also provide height, so the roles need a puzzle that uses the plant and brace in different ways.

## Provisional recommendation

Advance **Scout, Brute, and Gardener** as the first trio to test together. They cover vertical access, object manipulation, and route creation. Before locking the roster, try a short puzzle where the plant stays in place to support the team while the Brute repositions a block or braces elsewhere. If the plant and brace feel interchangeable, test Ranger in the Gardener slot for a distinct remote interaction.

The final selection is open for both developers to review.
