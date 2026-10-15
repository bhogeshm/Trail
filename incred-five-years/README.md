# InCred Global — The First Five Years

A 60-second, 1920×1080 anniversary film built with [HyperFrames](https://hyperframes.heygen.com), following the revised 12-scene storyboard.

All visuals are made in code: glass architecture, city skylines (Singapore, Dubai, London, New York), and a dot-matrix world map, animated with GSAP. The score in `assets/score.m4a` is an original ambient piece synthesized by `build/score.py`.

## Render

```bash
npm run render            # -> renders/*.mp4
npx hyperframes render -q high -f 30 -o incred-five-years.mp4
```

## Edit

`index.html` is generated. Change copy, timing or visuals in `build/build.mjs`, then run:

```bash
node build/build.mjs      # rewrites index.html
```

`build/gen-map.mjs` regenerates `build/map.json` (needs `world-atlas`, `topojson-client` and `d3-geo`).

## Placeholders before release

- Scene 12: replace the text wordmark with the approved InCred Global logo and anniversary unit.
- Scene 12: replace "Approved disclaimer to be inserted here." with the approved disclaimer.
- Scene 9: team imagery can replace the 90-dot "team" motif.
