# After Effects expressions

These are written for the **JavaScript** expression engine (File > Project Settings > Expressions). They have **not been tested inside After Effects** in this environment. Each one says where it goes and what it assumes.

## 1. Slit lens rig (01, `SHP_SLIT` › Path)
It needs a null `CTRL_SLIT` with sliders `h` (length) and `w` (half-opening). The lens bulges to 0.75 w at its middle, which is what the hands lock to.
```js
var c = thisComp.layer("CTRL_SLIT");
var h = c.effect("h")(1), w = c.effect("w")(1);
var k = h * 0.3, m = w * 0.75;
createPath(
  [[0, -h / 2], [m, 0], [0, h / 2], [-m, 0]],
  [[0, 0], [0, -k], [0, 0], [0, k]],
  [[0, 0], [0, k], [0, 0], [0, -k]],
  true
);
```
Put the same expression on the lip strokes, or pick-whip their Path to this one.

## 2. Hands locked to the lips (01, `PC_HAND_L/R` › Position)
```js
// left hand; for the right use "+" before the width term and "emerge R"
var c = thisComp.layer("CTRL_SLIT");
[560 - c.effect("w")(1) * 0.75 + c.effect("emerge L")(1), value[1]];
```
The matte for each hand is a rectangle whose inner edge follows the *opposite* lip, so the fingers appear to come out of the dark:
```js
// MATTE_HAND_L › Rectangle Size (anchor at the left edge of the comp)
var w = thisComp.layer("CTRL_SLIT").effect("w")(1);
[560 + w * 0.75, 1080];
```

## 3. Stick-slip (01, `CTRL_SLIT` › w), optional procedural version
Use this instead of keyframing the resist step by hand:
```js
var t = time;
function seg(t0, t1, v0, v1, p) { var u = clamp((t - t0) / (t1 - t0), 0, 1); return v0 + (v1 - v0) * (1 - Math.pow(1 - u, p)); }
t < 1.44 ? seg(1.2, 1.44, 12, 46, 2) :
t < 1.56 ? linear(t, 1.44, 1.56, 46, 49) :
           seg(1.56, 1.96, 49, 172, 3);
```

## 4. One overshoot, settled in 7 frames (WHAT IS., REIMAGINE., the BHOGESH slam)
On Scale (or Position) **after** two keyframes (start → end). It adds a single damped overshoot and is fully settled 7 frames after the last key.
```js
var n = numKeys;
if (n > 1 && time > key(n).time) {
  var t = time - key(n).time, f = 7 * thisComp.frameDuration;
  var v = velocityAtTime(key(n).time - thisComp.frameDuration / 2);
  var amp = 0.06, freq = 1 / (2 * f), decay = 9;
  value + v * amp * Math.sin(2 * Math.PI * freq * t) / Math.exp(decay * t) * (t < f ? 1 : 0);
} else value;
```
In this film the WHAT IS. overshoot is keyframed explicitly (112 → 98.5 → 100), which is more controllable. Use this expression only if you want a rig.

## 5. One-frame background shake (MASTER, `PC_PAPER_PLATE` › Position)
This shakes the background only, never the type. It fires on a layer marker named `HIT`.
```js
var m = thisLayer.marker, out = value;
for (var i = 1; i <= m.numKeys; i++) {
  if (m.key(i).comment !== "HIT") continue;
  var f = timeToFrames(time - m.key(i).time);
  if (f === 0) out = value + [14, -9];
  if (f === 1) out = value + [-6, 4];
}
out;
```

## 6. Grain: a new pattern every frame (MASTER, `PC_GRAIN` › Fractal Noise › Random Seed)
```js
timeToFrames(time) * 37 % 9973;
```
Settings: Fractal Noise, Contrast 160, Scale 4, Soft Light at 42 %. Seeded per frame, so every render is identical.

## 7. Dead-still titles (any landed type)
A guard you can paste on Position or Scale of a title. Once its last key has passed, it locks to the last key's value so nothing drifts.
```js
numKeys && time >= key(numKeys).time ? key(numKeys).value : value;
```

## 8. Letter-by-letter from split halves (03, `TYPE_MOLAGAVALLI` duplicates)
Text Animator › Position (0, −70) and Opacity 0. Range Selector › Advanced › Based On: Characters, Shape: Ramp Up, Ease High 100. Then put this on the Offset property:
```js
// one letter per frame, 11 letters, starting at the layer's in-point + 0.34 s
var start = 0.34, perChar = thisComp.frameDuration;
linear(time - inPoint, start, start + 11 * perChar + 0.28, 0, 100);
```
Duplicate the layer for the bottom halves (Position 0, +70; delay 2 frames). Matte each with a rectangle covering the top or bottom 50 % of the cap height.

## 9. Velocity-ramped strip with a hard stop (05, `CTRL_STRIP` › Position)
```js
var t0 = 1.95, t1 = 2.35, x0 = 1220, x1 = 184;
var u = clamp((time - inPoint - t0) / (t1 - t0), 0, 1);
var x = x0 + (x1 - x0) * Math.pow(u, 4);   // power4.in: fastest on the stop frame
if (time - inPoint > t1) x = linear(time - inPoint, t1, t1 + 0.08, x1, 188);
[x, value[1]];
```
Turn on motion blur for this layer only (shutter 180°).
