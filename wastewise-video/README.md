# WasteWise: 30-second hackathon film

A 16:9, 30 s motion-graphics film (kinetic type and UI animation), built only with [HyperFrames](https://github.com/heygen-com/hyperframes): HTML, GSAP and the HyperFrames renderer.

**Final render:** [`renders/wastewise-30s.mp4`](renders/wastewise-30s.mp4) (1920×1080, 30 fps, H.264 + AAC, about -16 LUFS)

## Scenes

| Time | Scene | File |
| --- | --- | --- |
| 00–04 | The problem: a bag drops, then NO COLLECTOR / NO CLEAR DISPOSAL / NO BACKUP pile up into chaos | `compositions/s1-problem.html` |
| 04–08 | The insight: freeze, WHAT DO I DO?, then WHAT IF WASTE HAD A NEXT STEP? with a green sweep | `compositions/s2-insight.html` |
| 08–12 | WasteWise: NEXT STEP collapses into the logo, the tagline appears and the landing page bursts out | `compositions/s3-brand.html` |
| 12–19 | How it works: I HAVE WASTE → PLASTIC → RECYCLABLE → SELL / COLLECT / FIND → BOOK PICKUP, on the phone UI | `compositions/s4-flow.html` |
| 19–23 | Differentiator: COLLECTOR UNAVAILABLE, then BACKUP COLLECTOR AVAILABLE ✓ and CONFIRM | `compositions/s5-backup.html` |
| 23–27 | AI and impact: ChatGPT → NotebookLM → Lovable → WasteWise, then three impact flashes | `compositions/s6-pipeline.html` |
| 27–30 | Final: everything collapses into the WasteWise logo and sign-off | `compositions/s7-final.html` |

`index.html` lays the scenes out in time and mounts the score, the SFX and seven voiceover clips.

The prototype screens (landing, resident home, book pickup) are rebuilt in HTML from the prototype screenshots.

## Audio

- **Voiceover:** `assets/vo/vo1–7.wav`, generated locally with `hyperframes tts` (Kokoro, voice `am_michael`) and loudness-normalized. To use your own voice, drop recordings in with the same file names (keep each clip within its window in `index.html`).
- **Music and SFX:** `assets/music/score.wav` and `sfx.wav` are synthesized by `tools/make_audio.py` (a 120 BPM electronic bed; impacts, whooshes and UI ticks land on the scene cuts). Regenerate with `npm run audio` (needs `numpy` and `soundfile`).

## Commands

```bash
npm install
npx hyperframes preview          # Studio preview / editing
npm run check                    # lint + runtime + layout + contrast
npm run render                   # → renders/wastewise-30s.mp4
```

Everything is local: GSAP is vendored in `assets/vendor/` and fonts (Manrope, Space Grotesk, JetBrains Mono) are in `assets/fonts/`, so renders need no network.
