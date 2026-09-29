# School Miles — HyperFrames edit

Professional re-edit of the School Miles (Unipads Foundation × Wealth First) event footage.

- `source.mp4` — original upload
- `clips.txt` — cut list (`name srcIn srcOut outDuration`); clips in `assets/clips/` were cut from `source.mp4` with ffmpeg (light-leak/glitch transitions removed, gentle slow-motion to fit the title timings)
- `music/score.cjs` — original stomp/clap + piano/strings score (120 BPM, hits on each title change). `node music/score.cjs` writes `assets/score.wav`; encode to `assets/score.m4a`
- `index.html` — the composition (titles, push-ins, dissolves, end card)

Render: `npx hyperframes@0.8.91 render -f 30 -q delivery -o renders/school-miles-final.mp4 .`
