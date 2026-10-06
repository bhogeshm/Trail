# NPAV Navratri — 9 Days Intro Reel (HyperFrames)

20s, 9:16, 4K (2160×3840) motion graphic built with [HyperFrames](https://hyperframes.heygen.com).

| Time | Scene | Visual |
|---|---|---|
| 0–3s | THIS NAVRATRI | Aerial Garba push-in → circle becomes a digital ring |
| 3–6s | 9 DAYS. 9 INTERACTIVE DROPS. | Nine golden nodes ignite in sequence → burst |
| 6–10s | EXCITING PRIZES EVERY DAY! | Instagram / Facebook voucher cards → merge into light |
| 10–14s | PLUS… A SURPRISE GIFT! | Spotlit crimson gift, nine-point halo lights up |
| 14–17s | PARTICIPATE ALL 9 DAYS / WIN A SMARTWATCH | Macro → hero smartwatch, halo, rim light |
| 17–20s | READY TO PLAY? → FOLLOW NPAV CYBER SECURITY | Garba finale, nine points burst, cut to black, T&C |

- `index.html` — the composition (shared procedural canvas carries the 9-point device; DOM layers for type and products)
- `tools/score.py` — regenerates the original synthesized score (`assets/audio/score.wav`)
- `renders/` — rendered MP4

```bash
npx hyperframes check                     # validate
npx hyperframes preview                   # Studio preview / edit
npx hyperframes render -f 30 -q high -o renders/npav-navratri-reel-4k.mp4
```
