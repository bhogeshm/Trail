# Navratri — cinematic sound design & score

- `navratri_final.mp4`: the finished film. It's 1920×1080 at 30 fps, 46.8 s long, with a 2.35:1 letterbox, rendered with HyperFrames.
- `navratri_score_mix.wav`: the full mix on its own (48 kHz, −13 LUFS, −1.5 dBTP).
- `stems/`: separate music, drums and SFX stems, so you can remix them in any editor.

All of the audio is synthesized from code in `audio/`. It uses no samples or stock libraries, so it has no licensing strings attached.

## The edit (beat-locked)
The original cut already sat almost on a 120 BPM / 2-second bar grid. Every cut was
snapped onto that grid, with a beat every 0.5 s starting at 0.1 s. Each shot is trimmed by a few frames or slowed slightly (at most 11%, on the dandiya
and DJ shots). The last frame is held for 2 s so the film can resolve. See `audio/edit.py`.

## Cue sheet
| Time | Picture | Sound |
|---|---|---|
| 0.0 | Girl in the van | Letterbox curtain opens. Tanpura drone, airy pad, van cabin tone |
| 1.0 / 1.5 / **2.0** | Basket falls | **tap · tap · THUMP**: deep woody knocks, then the basket lands exactly on frame 60. Sub hit, wicker crunch, then marigolds patter and bounce |
| 3.67–5.2 | Blue indicator | Relay **tick** (lamp on) and **tock** (lamp off), synced to each blink |
| 5.6 | Tyre on gravel | Weight thump + stones crunching |
| 7.6 | Gurkha on wet rangoli | Wet tyre roll, engine idle, heartbeat dhol |
| 10.1 | Traveller door | Latch click + swing; a riser and dhol roll build to… |
| **11.6** | Dhol close-up | **DROP**: a beat of silence, then impact + warm light flash. Full garba groove starts (dhol dhum/tak, dandiya clacks, bass, harmonium) |
| 13.6 | Women clapping | Claps come forward; the shehnai + flute hook enters |
| 15.6 | Dandiya cross | Hero stick **CLACK** with ghungroo jingle |
| 19.1 | DJ | Four-on-the-floor kick, sidechain pump, off-beat supersaw stabs |
| 21.1 / 23.1 | Gurkha | Engine rev, then headlight snap with a cool light flash |
| 23.35 | Garba ground | Crowd cheer + cymbal |
| 25.1 | Durga temple | Breakdown: temple bell, aarti hand-bell, shankh (conch), alaap on the shehnai |
| 28.0 → **28.1** | Blackout → aerial | Dhol roll, a 0.1 s vacuum, then **BOOM**. Searchlight whooshes, second drop |
| 34.1 / 36.9 | Solo dancer / couple | Skirt-spin whoosh / gulal colour-burst *poof* + pink flash |
| 37.6 | DJ stage | Cheer, the hook repeats an octave up |
| 40.6 | Headlight + marigold | Music falls away; the indicator clicks return (echoing the opening) under a riser |
| **42.6** | Fleet line-up | Finale: impact, dhol “DHA… DHA-DHAAA”, lights-on thunk, bell, conch, D-major chord ringing out. Letterbox closes |

## Re-rendering
```bash
pip install numpy scipy pillow
cd audio && bash master.sh                 # -> mix.wav (+ stems)
python3 tools/mkedit.py                    # expects in.mp4 + audio/edit.py alongside; -> edit.mp4
# copy edit.mp4 + mix.wav + gsap.min.js (npm i gsap) into hyperframes/assets/
cd hyperframes && HYPERFRAMES_BROWSER_PATH=<chrome> npx hyperframes render -q high -o out.mp4
```
To change timing or levels, edit `audio/score.py`. Each cue is one line, and the `sfx.add(..., time, gain, pan)` arguments control it.
