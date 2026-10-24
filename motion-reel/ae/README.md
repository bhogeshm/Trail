# After Effects rebuild kit

The film itself is built and rendered in HyperFrames (`../index.html`). This folder is for rebuilding or finishing it in After Effects.

| File | Use |
| --- | --- |
| `build_project.jsx` | File › Scripts › Run Script File. It creates the folder tree, the six chapter comps plus MASTER_20SEC (1920 × 1080, 25 fps), every text layer, the slit rig, the hero keyframes, the background shake, grain, and a marker plus an audio layer for every sound cue. It imports `../assets/paper.jpg` and `../assets/sfx/*` when they're next to it. |
| `EXPRESSIONS.md` | The rigs: lens slit, hand lock, stick-slip, overshoot, one-frame shake, stepped grain, letter halves, velocity-ramped strip |
| `assets/hand-left.svg`, `assets/hand-right.svg` | The fingertip hands as vectors. Open them in Illustrator, paste into AE, then Layer › Create › Create Shapes from Vector Layer. |

**Honest status:** the script and expressions were written against the After Effects scripting API but **have not been run in After Effects** (it isn't available where this was built). The JavaScript parses cleanly. Expect small fixes: text baselines that differ by a few pixels, and display-name lookups such as `Contrast` / `Random Seed` that assume an English UI.

**What the script does not build** (it marks each one with a comp marker): the GEO trim-path drawing in 02, the split-half letter mattes in 03, the variants and the 3D cube in 05, the frame thumbnails, and the doors in 06. The exact numbers for each are in `../PRODUCTION_BIBLE.md` Part C.

**Fastest path to a finished AE comp:** render the HyperFrames film as an image sequence (`npx hyperframes render --format png-sequence -o renders/frames`), drop it into `90_REF` as a guide layer at 50 % opacity, and match the rebuild to it frame by frame.
