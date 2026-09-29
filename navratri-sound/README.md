# Navratri: cinematic sound design (no background music)

- `navratri_final.mp4`: the finished film. It's 1920×1080 at 30 fps, 46.8 s long, with a 2.35:1 letterbox, rendered with HyperFrames.
- `navratri_sound_design_mix.wav`: the full mix on its own (48 kHz, about −13 LUFS).
- `stems/`: three separate tracks, so you can rebalance them in any editor.
  - `foreground_fx`: close-up effects.
  - `rhythm_perc`: the on-screen dhol, dandiya, claps and ghungroo.
  - `ambience`: background air and crowd.

There's no background music. The rhythm comes only from what's on screen: the dhol player, the claps, the dandiya
sticks, the ghungroo (anklet bells) and the footsteps. All of it follows the 120 BPM grid that the cuts are locked to.
Every sound is synthesized in code in `audio/`, with no samples, so there are no licensing issues.

Each hit was timed by stepping through the frames and measuring motion and brightness. The times below are film times.

| Time | Picture | Sound |
|---|---|---|
| 0.0 | Girl in the van | Cabin room tone, dupatta rustle, bangles |
| 1.0 / 1.5 / **2.00** | Basket falls | **tap · tap · THUMP**. The basket hits the ground on frame 60, followed by wicker crunch, the basket settling (2.27) and 18 marigolds bouncing and rolling away |
| 3.67 / 4.17 / 4.67 / 5.17 | Blue indicator | Relay **tick** when the lamp goes on, **tock** when it goes off. The ticking carries on softly under the next shot to keep the pulse |
| 5.6 | Tyre on gravel | Weight thump, gravel crunch, stones popping from the tread |
| 7.6 / 9.15 | Gurkha on wet rangoli | Wet tyre roll, diesel idle, **rangoli powder puff**. A distant festival dhol starts to be heard |
| 10.35 / 10.68 / **11.30** | Traveller door | Two footsteps, the door swings, **door slam and latch**, then a suck-in to silence |
| **11.6** / 11.9 / 13.07 | Dhol close-up | Impact + cheer. The dholi plays: the visible stick strikes land on those three frames, and the full garba pattern plays around them |
| 14.62 / 14.93 / 15.17 / 15.42 | Five women | Footsteps and anklets on each step, arm swishes, then **5-person claps with bangles**, a little out of unison, on each measured hand contact |
| 15.65 → **16.07** | Dandiya cross | Stick swing whoosh, then the **CLACK** at contact, the bells on the sticks shaking, and the ribbons fluttering |
| 16.88 / 17.55 / 17.85 / 18.2 / 18.6 | Blue van | Sliding door rolls open and thunks. Dancers hop out, with a footfall and anklet burst each. Cheer, then sticks raised together |
| 19.3–19.6 / 20.0 / 20.3–20.9 | DJ | Mixer clicks, arm whoosh, **stage lights switch** (hit + LED hum), crowd roar, fist-pump accents |
| 21.50 / 22.00 / **23.09** | Gurkha | Amber indicator tick/tock, engine rev, **headlight snap** |
| 23.35 | Whole garba ground | Big cheer, mass claps on every beat, dandiya and ghungroo from the crowd |
| 25.1–27.9 | Durga temple | Temple bell, **shankh** (conch), aarti hand-bell, the seated musicians' dhol, **manjira** (hand cymbals), dancers' ghungroo and claps, all in a temple reverb |
| **28.1** | Blackout → aerial | 0.1 s of silence, then a **BOOM**. High-altitude wind, searchlight sweeps, a distant crowd garba below |
| 31.1–33.7 | Pink smoke dandiya | Smoke-cannon hiss, then the hero pair's six stick strikes, the crowd's dandiya and dhol |
| 34.47 / 34.85 / 35.23 | Solo dancer | Overhead stick clacks, steps with anklets, a **skirt spin** at 35.0 |
| 36.7 / **36.85** / 37.12 / 37.4 | Couple | Stick strikes. The strike at 36.85 bursts the **gulal** (powder poof, bangles, a small cheer) |
| 37.6–40.6 | Main stage | Crowd roar, gulal throws, skirt twirls, the full festival rhythm |
| 41.30 / 41.73 / 42.17 | Headlight + marigold | **The hush.** The festival falls far away and the indicator ticks ring out on their own, echoing the opening |
| **42.6** | Fleet line-up | Impact, lights-on thunk, cheer, dhol, dandiya and claps together on "DHA… DHA-DHAAA", then a bell as the letterbox closes |

## Re-rendering
```bash
pip install numpy scipy pillow
cd audio && bash master_sd.sh              # -> mix.wav + stems (needs edit.py from this folder)
python3 tools/mkedit.py                    # beat-locked picture edit -> edit.mp4 (needs the source video as in.mp4)
# copy edit.mp4 + mix.wav + gsap.min.js (npm i gsap) into hyperframes/assets/
cd hyperframes && HYPERFRAMES_BROWSER_PATH=<chrome> npx hyperframes render -q high -o out.mp4
```
Every cue is one `add(bus, sound, time, gain, pan, ...)` line in `audio/sd.py`, so moving or rebalancing a sound is a one-line edit.
