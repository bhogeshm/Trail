# The Medium Changes — Bhogesh Molagavalli portfolio film

40-second 1920×1080 motion-design film built with [HyperFrames](https://hyperframes.heygen.com), following the
"30-Second Personal Portfolio Film" creative brief (art direction, palette, VO script), with an extra
"The work, seen" section that uses the Instagram and LinkedIn profiles.

**Final render:** `renders/bhogesh-portfolio-film.mp4`

| Time | Section | VO |
| --- | --- | --- |
| 0–4 | The idea — dot → line → cursor | "Every creation starts with an idea." |
| 4–8 | Animate — strokes, shapes, kinetic type | "I give ideas motion." |
| 8–12 | Design ecosystem — Ps → Ai → Ae → Pr | "From design… to motion." |
| 12–16 | 3D / CGI — grid dive, wireframe → render cube | "From pixels… to worlds." |
| 16–21 | AI constellation | "And AI opened another canvas." |
| 21–25.5 | Portfolio montage (reels) | "I'm not limited to one medium." |
| 25.5–30.5 | The work, seen — IG / LinkedIn + counters | "Seen by thousands. Built frame by frame." |
| 30.5–34.5 | Human reveal (music hard-cut) | "I'm Bhogesh Molagavalli." |
| 34.5–40 | Signature lock-up + bhogeshm.in | "The tools change. The story doesn't." |

## Rebuild

```bash
# voice-over: Kokoro TTS (open model), Hindi male voice `hm_omega` reading English → Indian-English accent
pip install kokoro-onnx soundfile
# model files: github.com/thewh1teagle/kokoro-onnx/releases (model-files-v1.0)
python3 scripts/vo_generate.py <dir-with-kokoro-v1.0.onnx-and-voices-v1.0.bin> assets/audio
python3 scripts/vo_polish.py      # warmth + room reverb (run once on fresh VO files)
python3 scripts/score.py          # synthesized score + sound design, ducked under VO

npm run check
npm run render -- -q high -o renders/bhogesh-portfolio-film.mp4
```

Images in `assets/img` are crops of the supplied Instagram / LinkedIn screenshots.
