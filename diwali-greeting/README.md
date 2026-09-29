# Happy Diwali — premium greeting (HyperFrames)

A 10-second, 1080×1920 (9:16) single-scene motion greeting built as a
[HyperFrames](https://github.com/heygen-com/hyperframes) HTML composition.
The design follows the reference card: ivory paper, layered champagne-gold
paper curves, a patterned terracotta diya with a nested paper-cut flame and
faint mandala line art.

## Timeline

| Time | What happens |
|------|--------------|
| 0–3 s | Gold paper layers glide in from the edges (staggered), the diya fades in while rising slightly, the nested flame shapes open from the base and the mandala line art draws in. |
| 3–5 s | Message fades up line by line: *Wishing you renewed opportunities, progress and continued success* |
| 5–6 s | **Happy Diwali!** in a high-contrast serif (Playfair Display), muted terracotta |
| 6–7 s | Signature: *Prasan Firodia,* / *Managing Director* (Jost) |
| 7–10 s | Hold. Only the small inner flame core flickers very subtly (deterministic, seeded). |

Locked camera, one continuous composition; the text area is reserved from
frame one so no artwork moves around the words.

## Files

- `index.html` — the composition (`data-composition-id="diwali"`, GSAP timeline registered on `window.__timelines`)
- `ornaments.js` — procedurally draws the mandalas, feather texture and diya pattern (no randomness)
- `fonts/` — self-hosted Playfair Display and Jost (OFL)
- `vendor/gsap.min.js` — GSAP, loaded locally so rendering works offline
- `renders/diwali-greeting.mp4` — the rendered video

## Render

```bash
cd diwali-greeting
npx hyperframes preview                 # live preview in the browser
npx hyperframes render --output renders/diwali-greeting.mp4
```
