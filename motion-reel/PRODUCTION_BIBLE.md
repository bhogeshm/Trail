# Bhogesh Molagavalli — "Think Beyond the Frame"
### 20-second experimental motion film · production bible

Master: 1920 × 1080 · 25 fps · 500 frames · 16:9 · stereo 48 kHz
Built and rendered in **HyperFrames** (`index.html` + `compositions/`). The rendered reference is `renders/bhogesh-molagavalli-reel-20s.mp4`. This document is also the After Effects rebuild spec. Every time below is checked against the HyperFrames timeline, which is the source of truth.

Frame notation: `f` = absolute frame at 25 fps (`f = seconds × 25`). Chapter-local times are in brackets.

---

## Stage 1 — What the PDF asks for

| PDF element | What it means for the film |
| --- | --- |
| Cover: *Think beyond the frame*, "SERIOUS → STRATEGIC → FUNNY → ENGAGING" | The film should show how he thinks, not list services. Tone moves from restraint to wit to warmth. |
| 6-line VO, delivery "mysterious → thoughtful → playful → assured → inviting" | VO is dense for 20 s (the PDF says so). **Decision:** each VO line also appears as a quiet sentence-case line on screen, so the film works muted, with or without a VO. The stomp text carries the punch. |
| Master stomp text, 9 cues | Used word for word. Two small changes: "BHOGESH! MOLAGAVALLI!" became BHOGESH / MOLAGAVALLI without exclamation marks (a dry tone does not shout), and "ARTIST. STRATEGIST." takes its "by craft, / by instinct." from the VO. |
| Key visuals: hand through paper → slit → line → split → geometry → name → misaligned square → square duplicates → cube → film strip → convergence → lockup | Kept in this order. Each one **is** the next one: the film is one continuous object changing form. |
| AE precomp plan (01–06 + MASTER) | Kept as scene files (HyperFrames) and as the AE project structure (Part F). |
| "Use real portfolio work where possible; never imply self-initiated work was commissioned" | No portfolio footage was supplied, so **none is shown or implied**. The film strip in chapter 4 shows the film's own beats as thumbnails, so it makes no claim about clients. Slots for real excerpts are marked in Part G. |

**The strongest reading:** the PDF's sequence is an argument about perception, and one shape can carry the whole argument. A cut in the paper becomes a ruled line, the line becomes a question, the question becomes a frame, the frame becomes a name, and the name becomes one square that is out of line. That square is the joke, and it becomes every capability. Finally it becomes the full stop on the invitation. The viewer sees one idea develop for 20 s, not five scenes.

---

## A. Creative treatment and visual system

**Idea: the full stop.** Everything in the film comes from one small black mark and ends as one. The paper cut is a mark, the line is a mark stretched out, and the misaligned square is a mark in the wrong place. The last thing that moves in the film is the period of "LET'S CREATE SOMETHING UNEXPECTED." landing 3 px off and correcting itself. That callback answers the brief's humour, detail and connection points with one object.

**Medium: paper and ink, nothing else.** In this film, paper gets cut, stretched, folded and opened. Ink gets printed, and only in flat black. There is no glow, colour, gradient UI, glitch or neon. The only grey is graphite (`#5E5B55`), and it is used only for quiet lines and secondary forms.

| Token | Value | Use |
| --- | --- | --- |
| `--paper` | `#EDEAE3` + fibre texture (`assets/paper.jpg`: 3.5% mottle, 2 % cloud, 1.2 % fine noise, 2 600 fibres) | Ground for chapters 1–5 |
| `--paper-clean` | `#F2F0EA` flat | The fresh sheet revealed by the fold in chapter 5 (Connection) |
| `--ink` | `#111110` | Every word that must be read, every structural line, every square |
| `--graphite` | `#5E5B55` | Quiet VO lines, secondary geometry, guides |
| `--void` | `#0A0A09` | The inside of the cut and the final black |
| Plaster (hands, cube) | `#FBF9F5 → #E6E1D8 → #A49D90` | The only "material". It is sculptural and monochrome, and the light comes from the upper left |
| Grain | 640 px tile, soft-light at 42 %, new offset every frame | Analogue texture over everything |
| Shadows | Contact shadow offset (5–10, 11–12) px, blur 7 px, 32–34 % | Hands only |

**Motion principles (the numbers behind the adjectives)**
- **Slow deformation, sudden precision.** Paper moves on `power2/3.inOut` over 0.3–0.8 s. Type lands on `expo.out` / `power4.out` in 3–8 frames.
- **Arrive slow, leave fast.** Exits are 40–50 % of entrance duration (0.12–0.2 s blur-outs).
- **Landed type is dead still.** After a word lands, the motion moves to the next object.
- **One hero move per shot.** Secondary moves start 1–3 frames later and travel less far.
- **Every chapter ends on the frame the next one starts on.** The six seams are match cuts (Part B).
- **Silence is a material.** True silence (2 frames) before the pixel hit, and near-silence after "WHAT IS."

**Banned in this film:** dark void grounds, glow, neon, gradients as decoration, glitch, floating icons, random particles, the same entrance twice in a row, sliding-up fades, HUD or corner labels, timecode overlays, crop marks, monospace caps labels, logos docked in a corner, comic bounce, cartoon faces.

---

## B. Frame-accurate timeline (20.00 s = f0–f500)

| Abs. time | Frames | Chapter | What happens | Hand-off |
| --- | --- | --- | --- | --- |
| 0.00–0.70 | f0–17 | 01 Hook | Empty paper, 2 % push. From f5 a pressure dimple swells: something is pushing from behind. | — |
| 0.70–0.82 | f17–21 | 01 | A hairline cut runs top to bottom (560 px, 3 frames). | — |
| 0.84–1.26 | f21–31 | 01 | Eight plaster fingertips push through. Left hand at 0.86 s, right hand 1 frame later. | — |
| 1.20–2.08 | f30–52 | 01 | The hands pull the cut open with stick-slip: 46 px → resist 3 f → give way to 172 → settle 166. | — |
| 2.00–2.28 | f50–57 | 01 | **Freeze. "WHAT IS."** matte wipe + 112 % → 98.5 % → 100 %, settled in 7 f. | — |
| 2.36–2.57 | f59–64 | 01 | "Most people see", one word every 0.07 s | — |
| 2.28–3.30 | f57–83 | 01 | Held still: 1.0 s with only air in the sound | — |
| 3.30–4.00 | f83–100 | 01 | Words blur out, fingers withdraw, the cut closes to a ruled line, the camera pushes 1→1.35× and +400 px, accelerating | **Match cut:** 4 px vertical line at x = 960 |
| 4.00–4.40 | f100–110 | 02 Strategy | The push carries on and decelerates (1→1.10×) | — |
| 4.10–4.36 | f103–109 | 02 | **OBSERVE.** vertical matte + 105→100 %, dry click on lock. A 14 px "eye" square on the line. | — |
| 5.00–5.28 | f125–132 | 02 | The line splits. Top half rotates 90° about its foot (7 f), bottom half slides 120 px left. | — |
| 5.08–5.44 | f127–136 | 02 | **QUESTION.** "QUES" drops, "TION." slides in 3 f later, into the corner the lines leave. | — |
| 6.00–6.64 | f150–166 | 02 | Two segments become a square, which grows a second square and a circle: a briefly impossible, ambiguous cube that tilts −7°. | — |
| 6.64–6.78 | f166–170 | 02 | It resolves: the back square slides onto the front, the diagonals vanish. | — |
| 6.78–7.10 | f170–178 | 02 | The frame expands to 1560 × 296, **REIMAGINE.** lands 120→100 % (largest word so far), soft bass. | — |
| 7.56–7.92 | f189–198 | 02 | The frame folds flat into a 1400 px rule | **Match cut:** horizontal rule at y = 540 |
| 8.02–8.22 | f200–206 | 03 Name | The rule splits; a copy drops 222 px, tilted 1.4° | — |
| 8.10–8.42 | f202–211 | 03 | **BHOGESH** slams down (power4.in), overshoots 10 px, settles. The rule flexes 1 frame. Bass. | — |
| 8.34–9.06 | f208–227 | 03 | **MOLAGAVALLI** assembles from split letter halves, 1 frame apart | — |
| 8.80–8.88 | f220–222 | 03 | The tilted baseline snaps level (2 f), click | — |
| 9.72–10.22 | f243–256 | 03 | The name splits away; the rules close and rotate into a 260 px vertical divider | — |
| 10.10–10.50 | f252–263 | 03 | **ARTIST.** slides in, "by craft," | — |
| 10.55–10.89 | f264–272 | 03 | A black block wipes across and leaves **STRATEGIST.** (heavier, +8 %), "by instinct." | — |
| 11.55–11.94 | f289–299 | 03 | The words leave and the divider shrinks to an 18 px square | **Match cut:** one square at centre |
| 12.00–12.30 | f300–308 | 04 Pixel | A perfect 11 × 5 grid prints out from that square. One square is 5 px right and 3 px low. | — |
| 12.16–12.56 | f304–314 | 04 | The camera finds it (2.6×). Guides draw through its row and column. | — |
| 12.30–12.66 | f308–317 | 04 | A cursor travels to it and stops | — |
| 12.64–12.72 | f316–318 | 04 | **All sound cuts out. 2 frames of true silence.** | — |
| 12.72–12.80 | f318–320 | 04 | **Click.** The square moves 5 px. A disproportionate boom, and the background (only) jolts 1 frame. | — |
| 12.80–13.08 | f320–327 | 04 | The other squares step back to 16 % opacity. **"YES. EVEN THAT PIXEL."** word by word. | — |
| 13.80–14.00 | f345–350 | 04 | Everything clears except the corrected square | **Match cut:** the same square, 47 px at centre |
| 14.02–14.32 | f350–358 | 05 Capability | The square travels to the stage; **AI FILMS.** rolls in | — |
| 14.30–14.60 | f357–365 | 05 | Six possible forms fan out from it | — |
| 14.54–14.74 | f363–368 | 05 | A selection frame tries three of them (2 frames each) and chooses one. Click. | — |
| 14.74–14.92 | f368–373 | 05 | The others collapse and the chosen form becomes a 160 px square | — |
| 14.90–15.60 | f372–390 | 05 | **3D + MOTION.** The square unfolds into a net, folds into a cube and turns to (−24°, −36°) | — |
| 15.38–15.80 | f384–395 | 05 | A light sweep crosses the three visible faces | — |
| 15.80–15.95 | f395–399 | 05 | **STORIES / WITH PURPOSE.** The cube squares up and flattens into a 200 × 120 frame | — |
| 15.95–16.35 | f399–409 | 05 | The frame becomes a strip of 7 frames that accelerates 1036 px and **stops dead** | — |
| 16.44–16.95 | f411–424 | 05 | The frames take a hierarchy: hero (2.2×), column (0.8×), row (1×) | Frames stay put |
| 17.00–17.52 | f425–438 | 06 Finish | The frames converge on the centre, each along its own path, slowing as they arrive | — |
| 17.42–17.84 | f435–446 | 06 | The old sheet folds open like two doors onto a clean sheet | — |
| 17.44–17.62 | f436–441 | 06 | Everything has become one square at the centre | — |
| 17.55–17.97 | f439–449 | 06 | **BHOGESH**, then **MOLAGAVALLI** 3 f later (mask wipes) | — |
| 17.74–18.08 | f444–452 | 06 | Rule, skills, "Got a good problem?", **LET'S CREATE SOMETHING UNEXPECTED** | — |
| 18.24–18.54 | f456–464 | 06 | The square travels to the end of the line and lands 3 px right, 2 px high | — |
| 18.66–18.72 | f467–468 | 06 | It nudges into place. Restrained click and soft bass. | — |
| 18.72–19.92 | f468–498 | 06 | Held still (the name has been readable for 2.3 s, the invitation for 1.8 s) | — |
| 19.92–20.00 | f498–500 | — | Clean cut to black | — |

Emotional arc check: **Mystery** (f0–100) → **Strategy** (f100–200) → **Humour** (f200–350; it builds through the name, peaks at f318) → **Capability** (f350–425) → **Connection** (f425–500).

---

## C. Shot-by-shot animation specification

Coordinates are comp pixels (origin top-left, 1920 × 1080). Easing names follow GSAP. The AE equivalents are in Part I.

### 01 SURFACE_HOOK (0–4 s)
| Layer | Property | Keys (chapter time → value) | Ease | Notes |
| --- | --- | --- | --- | --- |
| PAPER_PLATE (2304 × 1296) | Scale | 0 → 100 %, 4.0 → 102 % | linear | Oversized so the shake never shows an edge |
| DIMPLE (520 × 740 ellipse, radial highlight 70 % white at 44/46 %, shadow 30 % at 58/56 %) | Scale / Opacity | 0.20 → 55 % / 0, 0.75 → 100 % / 100 | inOut 2 | Scale X → 122 % from 1.2 to 2.0 s while the cut opens |
| SLIT (lens path, centre 560, 540) | h / w | 0.70 → h 0 w 0; 0.82 → h 560 w 2 (power4.out) · 0.84 → 1.14 w 12 · 1.20 → 1.44 w 46 · 1.44 → 1.56 w 49 (linear, **resist**) · 1.56 → 1.96 w 172 (power3.inOut) · 1.96 → 2.08 w 166 | mixed | Lens = cubic Béziers, control points at ±w, ±0.2 h. Visible half-width is 0.75 w. |
| LIPS | Stroke | Light lip 3 px white 85 % offset (−3, −1); shadow lip 10 px `#5A5247` 55 % blur 2.2 | — | Follow the slit path (expression-linked) |
| HAND_L / HAND_R (4 tapered fingers each, nails, knuckle creases) | Position X | Edge-locked to x = 560 ∓ 0.75 w, plus an emerge offset ±150 → 0 (L at 0.86 s, R at 0.90 s, 0.36 s power3.out) | power3.out | A track matte clips each hand to its own side of the opposite lip. A root shading gradient (66 %→93 % black) means the part inside the wall stays unlit. |
| WHAT IS. (Inter Black 184 px, −45 tracking) | Matte / Scale | 2.00 → inset 100 % → 0 in 3 f; scale 112 → 98.5 (2.00–2.12, power4.out) → 100 (2.12–2.28, power2.out); anchor at the left edge | — | One impact only, then dead still |
| "Most people see" (Inter Regular 40, graphite) | Opacity + blur | 2.36, +0.07 per word, 6 px → 0 in 0.14 s | power2.out | — |
| CAM (null parent) | Scale / Position | 3.38 → 100 %, 0; 4.00 → 135 %, +400 px X; anchor 560, 540 | power3.in | The cut lands on the fastest frame |
| SLIT → LINE | Swap | 3.82: lens hidden, 3 × 560 px rule shown | hold | Becomes 4 × 756 px after the camera scale |

### 02 TYPE_TRANSFORM (4–8 s)
| Layer | Keys | Ease |
| --- | --- | --- |
| CAM | 0 → 0.40: 100 → 110 % (anchor 960, 540); 2.0 → 2.5: back to 100 % | power3.out / power2.inOut |
| SEG_TOP / SEG_BOT (4 × 378 each, joined at y 540) | 1.00 → 1.28: TOP rotation 0 → 90° (anchor at foot); BOT x 0 → −120 | power4.out |
| EYE (14 px square at 918, 533) | 0.10 → 0.26 scale 0 → 100 | expo.out |
| OBSERVE. (Black 132, left 1000) | 0.10 → 0.36 matte inset-top 100 % → 0, scale 105 → 100 (anchor left); out 0.88 → 1.02 (blur 8) | expo.out |
| QUES / TION. (Black 132, two layers) | QUES 1.08 → 1.32 y −110 → 0; TION. 1.20 → 1.44 x +160 → 0; out 1.84 | expo.out |
| "I see what it / could become." (Regular 40, right-aligned at x 880) | 0.30, 0.06 per word; out 1.80 | power2.out |
| GEO: H/V segments | 2.00 → 2.26: to (780, 360)–(1140, 360) and (780, 360)–(780, 720) | power3.inOut |
| GEO: right/bottom sides | 2.20 / 2.26, 0.16 s draw | power2.out |
| GEO: back square (offset +100, −100), 4 diagonals, circle r 180 (graphite) | Draw 2.30 → 2.64 (trim paths); group rotation 0 → −7° (2.30 → 2.64) | power2.inOut |
| GEO resolve | 2.64 → 2.78: back square onto front, diagonals out, circle r → 0, rotation → 0 | power3.in |
| FRAME (stroke 4) | 2.78 → 3.08: 360² → 1560 × 296 at (180, 392); 3.56 → 3.92: → 1400 × 0 at (260, 540) | power4.out / power3.inOut |
| REIMAGINE. (Black 196, centred) | 2.80 → 3.10 scale 120 → 100, opacity in 2 f; 3.56 matte closes to the centre + fade | expo.out |

### 03 NAME_INTRO (8–12 s)
| Layer | Keys | Ease |
| --- | --- | --- |
| RULE_A (1400 × 4 at 260, 538) | 0.30 → 0.34 scale Y 100 → 300 → 100 (0.46); 1.92 → 2.22 scale X → 18.6 %, rotation → 90° (the divider); 3.62 → 3.94 → 18 × 18 px | linear / power2.out / power3.inOut |
| RULE_B (copy) | 0.02 → 0.22 y +222, rotation 1.4°, scale X 97 %; **0.80 → 0.88 snap to 0°, 100 %**; 1.80 → 2.02 back to y 0, then hidden | power3.out / power4.out |
| BHOGESH (Black 190, −50 tracking, top 370) | 0.10 → 0.30 y −470 → +10; 0.30 → 0.42 → 0 | power4.in / power2.out |
| MOLAGAVALLI (11 letters × top/bottom halves) | Letter i at 0.34 + 0.04 i: top half from (jx, −70), bottom half from (−jx, +70) 2 f later, 0.28 s; jx = −38, 24, −16, 42, −30, 12, −44, 20, −8, 36, −26 | expo.out |
| Name out | 1.72 → 1.92 BHOGESH y −40 + blur; halves blur out 0.012 stagger | power3.in |
| ARTIST. (Bold 104, right-aligned to x 920) | 2.10 → 2.50 x −90 → 0; 2.70 → 3.00 x → −14 (makes room) | expo.out / power2.out |
| WIPE (860 × 196 black) | 2.55 → 2.71 scale X 0 → 100 (anchor left); 2.71 → 2.89 → 0 (anchor right) | power3.in / power3.out |
| STRATEGIST. (Black 112, left 1000) | Matte opens at 2.71 under the block | hold |
| "by craft," / "by instinct." (Regular 40) | 2.30 / 2.86 | power2.out |

### 04 PIXEL_JOKE (12–14 s)
| Layer | Keys | Ease |
| --- | --- | --- |
| GRID (55 squares, 18 px, pitch 64, centre square at 960, 540) | 0 → 0.36 scale 0 → 100, staggered from the centre (0.22 s spread) | power3.out |
| OFFENDER (col 8, row 1 → 1152, 476 + **5, 3 px**) | 0.72 → 0.80 x −5, y −3 | power4.out |
| GRID_CAM | 0.16 → 0.56 scale 260 %, x −192, y +64, anchor 1152, 476 | power2.inOut |
| GUIDES (1 px graphite) | 0.30 / 0.36 draw 0.2 s; out 0.96 | power2.out |
| CURSOR | 0.30 → 0.66 from (2000, 1160) to (990, 570); click 0.72 scale 88 % for 1 f; drags with the square; exits 1.16 | power3.inOut |
| PAPER_PLATE (master) | **12.72: +14, −9 · 12.76: −6, +4 · 12.80: 0, 0** (hold keys) | hold |
| OTHER SQUARES | 0.78 → 0.98 opacity → 16 % | power2.out |
| "And professionally… I overthink the details." | 0.12, 0.06 per word | power2.out |
| YES. EVEN THAT PIXEL. (Black 96, centred, top 800) | 0.80, 0.07 per word, blur 6 → 0; out 1.86 | power2.out |

### 05 SKILL_METAPHORS (14–17 s)
| Layer | Keys | Ease |
| --- | --- | --- |
| SEED (120 px) | 0.02 → 0.32 from centre (scale 39 %) to the stage (1320, 560), 70 %; out 0.74 | power3.inOut |
| VARIANTS ×6 (84 px: circle, diamond, triangle, rounded graphite, outline, split) | 0.30 + 0.03 i: ring R 210 at −90, −30, 30, 90, 150, 210°, scale 30 → 100 | expo.out |
| SELECT (116 px outline) | Hold keys 0.54 (diamond), 0.60 (outline), 0.66 (rounded); 0.70 1 f squeeze; out 0.74 | hold |
| CHOSEN (rounded) | 0.74 → 0.92 to centre, 160 px, radius 22 → 0, fill graphite → `#D8D3C9` | power3.inOut |
| CUBE (5 faces, 160 px, 2 px ink edge, 3D layers) | Net in at 0.92; fold: top X 0 → 90 (1.02), right Y 0 → 90 (1.05), bottom X → −90 (1.08), left Y → −90 (1.11), 0.3 s each; cube 1.16 → 1.61 to X −24 / Y −36 | power3.inOut / expo.out |
| SHEEN (105° white band 60 %) | 1.38 → 1.74 across front, top, right (0.04 stagger) | power2.inOut |
| CUBE → FRAME | 1.80 → 1.95 rotation → 0, scale 125 × 75 %, y +240 | power3.in |
| STRIP (7 frames, 200 × 120, 3 px ink, gap 24) | 1.95 → 2.35 x 0 → −1036; 2.35 → 2.43 → −1032 | **power4.in (velocity ramp, hard stop)** / power2.out |
| FRAMES reorganise | 2.44 + order × 0.025 → 0.42 s to layout: f0 (1180, 800) 1×, f1 (1420, 800), f2 (1660, 800), f3 (1300, 520) 2.2×, f4–f6 (1650, 420/540/660) 0.8× | power3.inOut |
| Say lines (Black 112, roll in a 240 px mask) | AI FILMS. 0.08; 3D + MOTION. 0.90; STORIES / WITH PURPOSE. 1.80; ±250 px, 0.24 s | power3.inOut |

### 06 FINAL_LOCKUP (17–20 s)
| Layer | Keys | Ease |
| --- | --- | --- |
| FRAMES ×7 | 0.02 i → durations 0.48, 0.42, 0.52, 0.38, 0.45, 0.50, 0.46. X and Y on different eases (curved paths), scale → 6 %, ±8° rotation, opacity out in the last 2 f | x power1–4.out, y power2–4.inOut |
| DOORS (two 960 px halves of the paper) | 0.42 → 0.84 rotation Y −100° / +100° (hinges at the outer edges); shade 0 → 55 % | power2.inOut |
| PERIOD (15 px square) | 0.44 → 0.62 at the centre, 0 → 160 %; 1.24 → 1.54 to the end of the line +3, −2 px, 100 %; **1.66 → 1.72 → 0, 0** | expo.out / power3.inOut / power4.out |
| BHOGESH / MOLAGAVALLI (Black 150) | 0.55 / 0.67 matte wipe left → right 0.28–0.30 s | power3.out |
| RULE (1560 × 2) | 0.74 → 1.06 scale X 0 → 100 | power3.inOut |
| Skills (Bold 28, +160 tracking, graphite) | 0.78 / 0.84 | power2.out |
| "Got a good problem?" (Regular 40) | 0.84 | power2.out |
| LET'S CREATE SOMETHING UNEXPECTED (Black 68) | 0.88, 0.067 per word | power2.out |
| BLACK (master) | 19.92 → 20.00 | hold |

---

## D. Typography system

One family (**Inter**) in three weights, so the hierarchy comes from weight and size, never from different typefaces.

| Role | Weight | Size @1080 | % frame H | Tracking | Leading | Alignment | Behaviour |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Hero stomp (REIMAGINE., BHOGESH, MOLAGAVALLI) | Black 900 | 190–196 px | 18 % | −45 to −50 | 1.0 | Left (name), centre (REIMAGINE.) | Lands once, then dead still |
| Stomp (WHAT IS., OBSERVE., QUESTION., STRATEGIST.) | Black 900 | 112–184 px | 10–17 % | −40 to −45 | 1.0 | Left, aligned to a line in the artwork | Mattes, never a fade-and-slide |
| Secondary stomp (ARTIST.) | Bold 700 | 104 px | 9.6 % | −40 | 1.0 | Right, against the divider | Slide |
| Lockup name | Black 900 | 150 px | 14 % | −50 | 160 px pitch | Left at x 172–180 | Mask wipe, 3 f stagger |
| Invitation | Black 900 | 68 px | 6.3 % | −35 | 1.0 | Left | Word by word, blur 6 → 0 |
| Skills | Bold 700, caps | 28 px | 2.6 % (floor) | +160 | 44 px pitch | Left | Blur-in, 0.06 s stagger |
| Quiet VO lines | Regular 400, sentence case | 40 px | 3.7 % | −10 / 0 | 1.25 | Left or right, aligned to the nearest form | Word by word, 0.06–0.07 s |

Rules: one hero word per frame. Quiet lines are always graphite and always sentence case. Stomp is always ink and always caps. Text is never smaller than 28 px. Every readable line sits inside the 90 % action-safe box. Readability at 360 px phone width was checked on `snapshot --review`: all stomp and lockup lines read. The 40 px quiet lines and the 28 px skills line are small at that size; for a social cut, raise them to 48 px and 34 px.

---

## E. Sound design cue sheet

Every cue is an `<audio>` element in `index.html`, so you can retime it in the HyperFrames Studio. Each file's peak lands **1 frame after** its picture event, because light arrives before sound. Synthesised foley comes from `tools/make_assets.py` (seeded, so it is reproducible). Clicks and bass come from the Pixabay-licensed set bundled with HyperFrames (see `assets/sfx`). The mix measures −17.2 LUFS integrated, −1.5 dBTP true peak, with no clipping.

| # | Abs. start | Peak lands | File | Vol | Picture event | Why |
| --- | --- | --- | --- | --- | --- | --- |
| 0 | 0.00 → 12.64, 12.72 → 19.92 | — | room-tone.wav | 0.22 | Whole film | An air bed, so the silences can be heard by contrast. Cut for 2 frames before the pixel hit. |
| 1 | 0.40 | builds to 2.0 | paper-tension.wav | 0.75 | Dimple → pull | Stick-slip creaks tighten as the hands pull. The sound is the paper's resistance. |
| 2 | 0.70 | 0.71 | paper-tear.wav | 0.80 | The cut | A short, bright tear |
| 3 | 1.967 | 2.04 | impact-bass-1 | 0.80 | WHAT IS. lands | One restrained low hit, then near-silence for 1 s |
| 4 | 3.66 | 3.82 | whoosh-short | 0.30 | Push into the line | Air moving with the camera |
| 5 | 4.00 | swells to 6.0 | sub-swell.wav | 0.55 | Chapter 2 | A filtered sub breath under the "thinking" chapter: restrained cinematic bass |
| 6 | 4.327 | 4.40 | click | 0.75 | OBSERVE. locks | Dry, mechanical precision |
| 7 | 5.00 | 5.01 | paper-cut-a.wav | 0.70 | The line splits | Paper being cut |
| 8 | 5.327 | 5.40 | click | 0.40 | QUESTION. snaps | A quieter echo of 6 |
| 9 | 6.767 | 6.84 | impact-bass-1 | 0.50 | REIMAGINE. lands | Musical accent on the resolution |
| 10 | 7.58 | 7.59 | paper-cut-b.wav | 0.60 | The frame folds flat | — |
| 11 | 8.287 | 8.36 | impact-bass-1 | 0.75 | BHOGESH slams | The slam is the downbeat of the personal chapter |
| 12 | 8.767 | 8.84 | click | 0.50 | The baseline snaps level | A pedant's click |
| 13 | 10.55 | 10.56 | paper-cut-b.wav | 0.60 | The black block wipes | — |
| — | 12.64 → 12.72 | — | (silence) | 0 | Cursor stops | **2 frames of true digital silence** |
| 14 | 12.687 | 12.76 | click | 0.80 | Cursor click | — |
| 15 | 12.728 | 12.76 | boom.wav | 1.00 | The 5 px nudge | **Absurdly large:** a falling sub 90 → 34 Hz with a noise crack, over 2.4 s |
| 16 | 12.687 | 12.76 | impact-bass-1 | 0.90 | Same | Body under the boom |
| 17 | 14.667 | 14.74 | click | 0.35 | The selection is made | Choice is a click |
| 18 | 15.02 | ~15.45 | paper-fold.wav | 0.55 | The cube folds | Paper folding with a thump |
| 19 | 16.15 | 16.31 | whoosh-short | 0.45 | The strip races | — |
| 20 | 16.317 | 16.39 | click + impact-bass-1 @0.30 | 0.80 | The strip stops dead | An edit landing on the beat |
| 21 | 17.40 | ~17.83 | paper-fold.wav | 0.70 | The doors fold open | — |
| 22 | 18.627 | 18.70 | click + impact-bass-1 @0.35 (fade 0.3) | 0.60 | The period corrects itself | The joke, told once more, quietly and warmly |
| — | 19.92 | — | (silence) | — | Black | — |

**Music:** none is in the render. No music source was available offline in this environment. The sound design is built to work alone, and the sub-swell and the bass hits act as the musical spine. To add a bed: a sparse, minimal piano or felt-piano pulse at **75 BPM** (one beat = 20 frames) lines up with the cuts at f100, f200, f300 and f500. Duck it −8 dB under the pixel joke and cut it completely from f316 to f318. If you add a VO, put the music at about 0.14 and keep cues 3, 15 and 22.

**VO placement (if recorded):** line 1 at 1.0 s, 2 at 4.2 s, 3 at 8.1 s, 4 ("And professionally…") at 11.9 s so that "details" lands just before the click at 12.72, 5 at 14.1 s, 6 at 17.4 s. The PDF warns the VO is dense; if the read runs long, drop "Artist by craft, strategist by instinct" (the screen already says it).

---

## F. After Effects project architecture

```
BM_ThinkBeyondTheFrame_v001.aep
├── 00_COMPS
│   ├── MASTER_20SEC                (1920×1080, 25 fps, 20:00, 500 f)
│   ├── 01_SURFACE_HOOK             (0:00–4:00)
│   ├── 02_TYPE_TRANSFORM           (4:00–8:00)
│   ├── 03_NAME_INTRO               (8:00–12:00)
│   ├── 04_PIXEL_JOKE               (12:00–14:00)
│   ├── 05_SKILL_METAPHORS          (14:00–17:00)
│   └── 06_FINAL_LOCKUP             (17:00–20:00)
├── 10_PRECOMPS
│   ├── PC_PAPER_PLATE              (2304×1296, shared by MASTER and the 06 doors)
│   ├── PC_GRAIN                    (fractal noise, stepped per frame)
│   ├── PC_HAND_L / PC_HAND_R       (fingertips, shading, contact shadows)
│   ├── PC_CUBE                     (5 × 3D solid faces + sheen)
│   └── PC_FRAME_00 … PC_FRAME_06   (thumbnails; replace with portfolio excerpts)
├── 20_ASSETS
│   ├── IMG  (paper.jpg, grain.png)
│   ├── VEC  (hand-left.svg, hand-right.svg)
│   └── SFX  (all cues in Part E)
└── 90_REF   (bhogesh-molagavalli-reel-20s.mp4 as a guide layer)
```

**Layer naming:** `TYPE_`, `SHP_`, `CTRL_` (nulls and expression controls), `MATTE_`, `FX_`, `CAM_`, `SFX_`. Every animated layer is parented to a `CTRL_` null that holds its slider controls. Mattes sit directly above their target with the `Alpha Matte` track matte (AE 2023+ track-matte picker), so they survive reordering.

**Per chapter (key layers)**
- 01: `CAM_HOOK` (null, scale + position) → `SHP_SLIT` (path driven by `CTRL_SLIT` sliders *h*, *w*, *emL*, *emR*; see the expressions) · `SHP_LIP_LIGHT`, `SHP_LIP_SHADOW` (same path, linked) · `PC_HAND_L` + `MATTE_HAND_L` · `PC_HAND_R` + `MATTE_HAND_R` · `SHP_DIMPLE` · `TYPE_WHATIS` + `MATTE_WHATIS` · `TYPE_KICKER_01`.
- 02: `CAM_STRAT` · `SHP_SEG_TOP`, `SHP_SEG_BOT`, `SHP_EYE` · `TYPE_OBSERVE` + `MATTE_OBSERVE` · `TYPE_QUES`, `TYPE_TION` · `SHP_GEO` (groups: square sides, back square, diagonals, circle — all on Trim Paths) · `SHP_FRAME` (rectangle size keyed) · `TYPE_REIMAGINE` + `MATTE_REIMAGINE`.
- 03: `SHP_RULE_A`, `SHP_RULE_B` · `TYPE_BHOGESH` · `TYPE_MOLAGAVALLI` (Animator: Position + Opacity, Range Selector *by characters*, Offset keyed; two duplicates with a top/bottom rectangle matte for the halves) · `TYPE_ARTIST`, `TYPE_STRATEGIST` + `MATTE_STRATEGIST`, `SHP_WIPE`.
- 04: `SHP_GRID` (Repeater ×11 × Repeater ×5, with the offender as its own layer) · `CAM_GRID` · `SHP_GUIDES` · `SHP_CURSOR` · `TYPE_PUNCH`.
- 05: `SHP_SEED`, `SHP_VAR_0…5`, `SHP_SELECT` · `PC_CUBE` (3D) · `PC_FRAME_00…06` inside a `CTRL_STRIP` null · `TYPE_SAY_1…3` + `MATTE_SAY`.
- 06: `PC_FRAME_00…06` (start transforms copied from 05's last frame) · `PC_PAPER_PLATE` ×2 as `3D_DOOR_L/R` · `SHP_PERIOD` · `TYPE_FIRST`, `TYPE_LAST` + mattes · `SHP_RULE` · `TYPE_SKILLS_1/2`, `TYPE_ASK`, `TYPE_INVITE`.
- MASTER: `PC_PAPER_PLATE` (shake keys), chapters 01–06, `PC_GRAIN` (Soft Light, 42 %), `SOLID_BLACK` at 19:23, every `SFX_` cue at the times in Part E, and one comp marker per cue.

`ae/build_project.jsx` builds this skeleton: folders, comps, chapter placement, every text layer with its font, size, tracking and position, the slit path rig, the key keyframes for each hero move, the background shake, the grain, and comp markers for every sound cue. **It has not been run here** (After Effects isn't available in this environment). See `ae/README.md`.

---

## G. Production checklist

**Must be created or supplied by a person**
- [ ] VO recording (optional: the film is designed to work without it). Times are in Part E.
- [ ] Music bed (optional): sparse, 75 BPM. Clear the licence.
- [ ] **Real portfolio excerpts** for `PC_FRAME_00…06` if you want the strip to show work. Use 1–2 s clips, and **label self-initiated work as such** (for example a small "Personal experiment" caption in graphite). None was supplied, so none appears.
- [ ] Final check of the name spelling and the preferred lockup line (currently "LET'S CREATE SOMETHING UNEXPECTED.").
- [ ] Optional upgrade: replace the vector fingertips with a photographed or 3D plaster hand (C4D / Blender, 25 fps PNG sequence with alpha, light from the upper left, monochrome). This is the one shot where a real sculpt raises the ceiling.

**Generated procedurally (done, in the repo)**
- [x] Paper texture `assets/paper.jpg` and grain tile `assets/grain.png` (`tools/make_assets.py`, seeded)
- [x] Foley: paper tension, tear, two cuts, fold, room tone, sub swell, boom (`tools/make_assets.py`)
- [x] Fingertip hands (SVG, in `compositions/s1-hook.html`; exported to `ae/assets/hand-*.svg`)
- [x] All geometry, grid, cube, film strip and thumbnails (HTML/SVG; in AE these are shape layers)
- [x] All typography (Inter, editable text)
- [x] Timing, easing and the sound placement (HyperFrames timeline)

**Delivery**
- [x] `renders/bhogesh-molagavalli-reel-20s.mp4`: H.264, 1920 × 1080, 25 fps, 500 frames, AAC
- [ ] Optional: `npx hyperframes render --format mov` for ProRes 4444, or `--format png-sequence` to finish in AE or Resolve
- [ ] Optional: a 1080 × 1350 social cut (the left-aligned lockups reflow; the slit and the grid stay centred)

---

## H. Implementation plan (most important moments first)

1. **The first second (f0–30).** The dimple and the cut are the hook. If only one thing gets extra time, it is a real plaster hand and a displacement-mapped paper surface here.
2. **The pixel joke (f300–350).** It depends on timing more than images: 2 frames of silence, a 2-frame nudge, a 1-frame shake, and a boom far too large. Lock the sound before you polish anything else.
3. **The six match cuts.** Line → line → rule → square → square → frames. If a cut jumps, the film stops reading as one object. Check each one at −1 / 0 / +1 frame.
4. **The final period (f456–468).** It closes the film's idea. It must land 3 px off and correct with a quiet click, not a big one.
5. **REIMAGINE.'s impossible cube (f157–178).** It is the most "art-directed" frame in the middle of the film. It stays briefly ambiguous, then resolves.
6. **Chapter 4's cube and strip.** These are capability proof. Swap in portfolio footage once it exists.
7. Polish pass: grain amount, the shading of the lips, the sheen angle.

Re-render after changes: `cd motion-reel && npx hyperframes render --fps 25 --quality delivery -o renders/bhogesh-molagavalli-reel-20s.mp4`.

---

## I. Code (what is provided and what it does)

| File | What it is | Status |
| --- | --- | --- |
| `index.html`, `compositions/*.html` | The film: HyperFrames compositions (HTML + GSAP), seek-deterministic | **Rendered and verified** (check passes, frames and audio measured) |
| `tools/make_assets.py` | Seeded generator for the paper, grain and foley | Run (`python3 -I tools/make_assets.py`) |
| `tools/frames.py` | Markup for the 7 strip thumbnails, shared by chapters 5 and 6 | Used to write the scenes |
| `ae/build_project.jsx` | ExtendScript that builds the AE skeleton described in Part F | **Not executed** (no After Effects here) |
| `ae/EXPRESSIONS.md` | Expressions: lens slit rig, hand edge-lock, overshoot settle, stepped grain, one-frame shake, stick-slip | Untested in AE; written for the JavaScript expression engine |

**Native AE versus plugins:** everything above is native. The paper deformation uses Displacement Map (driven by the dimple layer) and Bezier Warp if you need more bulge. The 3D cube uses 3D layers with the Classic 3D or Advanced 3D renderer. Motion blur comes from the comp switch, used only on the camera push, the slam and the strip. Optional: Rowbyte Plexus or Element 3D are **not** needed. If you want a physical hand, it's a 3D or photo asset, not a plugin.

---

## Creative quality control (answered honestly)

| Question | Answer |
| --- | --- |
| Does the first second create curiosity? | Yes: the paper visibly swells from 0.2 s and is cut at 0.7 s. It's subtle on a phone, so a real displacement pass would make it stronger (H.1). |
| Does the middle show thinking? | Yes: observe → question → reimagine is shown as one line becoming a corner, an impossible cube, and then a frame. The words are the result of a visible process. |
| Is the humour unexpected but on-brand? | Yes: a 5 px correction gets a 2-second boom. It is set up by "I overthink the details" and paid off again by the final period. There are no faces and no bounce. |
| Capabilities without a skills list? | Mostly: chosen variations (AI), a folded cube (3D), a strip that stops on the beat (edit), a layout with hierarchy (art direction). The literal list appears only once, in the lockup, as the brief asks. |
| One continuous idea? | Yes: all six seams are match cuts on the same mark (Part B). |
| Every word readable at playback size? | Yes at 1080. At 360 px wide the stomp text and lockup read, while the quiet lines and the skills line get small (fix for social in D). One line is held under the automatic "read time" rule: "YES. EVEN THAT PIXEL." for 1.16 s. It's four short words, and the timing of a punchline beats the rule. |
| Clear invitation? | "Got a good problem?" plus "LET'S CREATE SOMETHING UNEXPECTED." held 1.8 s, with the name held 2.3 s. |
| Realistic in AE? | Yes: shape layers, text animators, mattes, 3D layers, Displacement Map. The script gives the skeleton; the hand is the one asset worth upgrading. |
