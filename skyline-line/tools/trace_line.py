"""Trace the blue curve, its vertical ticks and the two dots in assets/source.png.

Writes tools/line.json: the curve as (x, y) points every 4 px, the stroke width and
colour, and each tick as x, y_top, y_bottom.
"""
import json
import os

import cv2
import numpy as np
from scipy.interpolate import UnivariateSpline

HERE = os.path.dirname(os.path.abspath(__file__))
src = cv2.imread(os.path.join(HERE, "..", "assets", "source.png")).astype(np.float32)[..., ::-1]
H, W = src.shape[:2]
BLUE = np.array([28, 128, 198], np.float32)
d = np.sqrt(((src - BLUE) ** 2).sum(2))
hit = d < 45

# ticks: columns with a long vertical run of line colour
ticks = []
col_runs = []
for x in range(W):
    ys = np.where(hit[300:800, x])[0] + 300
    if len(ys) == 0:
        col_runs.append(0)
        continue
    best, cur = 1, 1
    for a, b in zip(ys[:-1], ys[1:]):
        cur = cur + 1 if b - a <= 2 else 1
        best = max(best, cur)
    col_runs.append(best)
col_runs = np.array(col_runs)
tick_cols = np.where(col_runs > 60)[0]
groups = np.split(tick_cols, np.where(np.diff(tick_cols) > 3)[0] + 1)

# the curve: follow the line colour column by column from the left edge
ys_out = np.full(W, np.nan)
prev = 503.0
skip = np.zeros(W, bool)
for g in groups:
    skip[max(0, g[0] - 16): g[-1] + 17] = True  # tick columns and the dots on them
# a stroke pixel run of 2-7 rows whose neighbours a few rows out are not line colour
# (the stroke has a thin white halo); keep the run nearest the previous accepted row
GHERKIN = (1160, 1300)  # the stroke runs behind the Gherkin here


def follow(xrange_, start_y):
    prev = start_y
    for x in xrange_:
        if skip[x] or GHERKIN[0] <= x <= GHERKIN[1]:
            continue
        ys = np.where(hit[250:850, x])[0] + 250
        if not len(ys):
            continue
        clusters = [c for c in np.split(ys, np.where(np.diff(ys) > 1)[0] + 1)
                    if 2 <= len(c) <= 7 and not hit[c[0] - 4, x] and not hit[c[-1] + 4, x]
                    and abs(c.mean() - prev) < 25]
        if not clusters:
            continue
        c = min(clusters, key=lambda c: abs(c.mean() - prev))
        ys_out[x] = c.mean()
        prev = c.mean()


# from the left edge up to the Gherkin, and from the right edge back to it
follow(range(0, GHERKIN[0]), 503.0)
follow(range(W - 1, GHERKIN[1], -1), 434.0)
xs = np.where(~np.isnan(ys_out))[0]
keep = np.ones(len(xs), bool)
for _ in range(6):  # refit without outliers (window frames and edges that look like the stroke)
    spl = UnivariateSpline(xs[keep], ys_out[xs][keep], s=keep.sum() * 0.35)
    res = ys_out[xs] - spl(xs)
    keep = np.abs(res) < 2.5
xs = xs[keep]
res = ys_out[xs] - spl(xs)
print("traced columns", len(xs), "residual rms", round(float(np.sqrt((res ** 2).mean())), 2))

ticks_out = []
for g in groups:
    x = float(g.mean())
    rows = np.where(hit[250:820, int(round(x))])[0] + 250
    # the run that touches the curve
    yc = float(spl(x))
    runs = np.split(rows, np.where(np.diff(rows) > 12)[0] + 1)
    # runs touching the curve; the Gherkin hides up to ~40 px of a tick next to it
    near = [r for r in runs if len(r) > 10 and r.min() - 20 <= yc <= r.max() + 45]
    if not near or len(g) > 6:
        print("not a tick:", g[0], g[-1])
        continue
    lo = min(r.min() for r in near)
    hi = max(max(r.max() for r in near), int(round(yc)))
    ticks_out.append({"x": round(x, 1), "top": int(lo), "bottom": int(hi), "lineY": round(yc, 1),
                      "width": int(len(g))})

pts = [[x, round(float(spl(x)), 2)] for x in range(0, W + 1, 4)]
widths = []
for x in xs[::10]:
    col = hit[int(ys_out[x]) - 6: int(ys_out[x]) + 7, x]
    widths.append(col.sum())
out = {"points": pts, "stroke": float(np.median(widths)), "color": "#1c80c6", "ticks": ticks_out}
json.dump(out, open(os.path.join(HERE, "line.json"), "w"), indent=1)
print("stroke", out["stroke"], "ticks", ticks_out)
