"""Geometric mask of the large "5" in assets/final.png (1920x1080)."""
import numpy as np
import cv2

W, H = 1920, 1080

# Hand-fitted outline (pixels). Edges were measured from the tint boundary.
TOP = 112
BAR_BOTTOM = 252
LEFT_EDGE = ((1251, TOP), (1199, 545))     # slanted left edge of bar + stem
BAR_RIGHT = ((1709, TOP), (1690, BAR_BOTTOM))
STEM_RIGHT = ((1388, BAR_BOTTOM), (1371, 360))
OUTER = (1499, 560, 226)                    # bowl outer circle cx, cy, R
HOLE = (1440, 596, 108)                     # counter cx, cy, r
TAIL_TOP = 612                              # top edge of the lower-left terminal
TAIL_LEFT = ((1175, TAIL_TOP), (1198, 820)) # left edge of the terminal
STEM_BOTTOM = 545


def five_mask(scale=1):
    m = np.zeros((H * scale, W * scale), np.uint8)
    s = scale
    pt = lambda p: (int(round(p[0] * s)), int(round(p[1] * s)))
    # Bar + stem: polygon down to the stem bottom.
    lx = lambda y: LEFT_EDGE[0][0] + (LEFT_EDGE[1][0] - LEFT_EDGE[0][0]) * (y - TOP) / (LEFT_EDGE[1][1] - TOP)
    sx = lambda y: STEM_RIGHT[0][0] + (STEM_RIGHT[1][0] - STEM_RIGHT[0][0]) * (y - BAR_BOTTOM) / (STEM_RIGHT[1][1] - BAR_BOTTOM)
    poly = [(lx(TOP), TOP), (BAR_RIGHT[0][0], TOP), (BAR_RIGHT[1][0], BAR_BOTTOM),
            (sx(BAR_BOTTOM), BAR_BOTTOM), (sx(STEM_BOTTOM), STEM_BOTTOM), (lx(STEM_BOTTOM), STEM_BOTTOM)]
    cv2.fillPoly(m, [np.array([pt(p) for p in poly], np.int32)], 255, cv2.LINE_AA, 0)
    # Bowl: outer disc, but only right of the stem / below the gap on the left.
    bowl = np.zeros_like(m)
    cv2.circle(bowl, pt(OUTER[:2]), int(OUTER[2] * s), 255, -1, cv2.LINE_AA)
    # the bowl's right flank is flatter than a circle below its widest point
    flank = np.zeros_like(m)
    cv2.ellipse(flank, pt((OUTER[0], 610)), (int(231 * s), int(125 * s)), 0, 0, 360, 255, -1, cv2.LINE_AA)
    flank[:, : int(1660 * s)] = 0
    bowl = cv2.max(bowl, flank)
    # Lower-left terminal: extends the bowl leftward below TAIL_TOP.
    tail = np.zeros_like(m)
    tpoly = [(TAIL_LEFT[0][0], TAIL_TOP), (OUTER[0], TAIL_TOP), (OUTER[0], 1000), (TAIL_LEFT[1][0], 1000)]
    cv2.fillPoly(tail, [np.array([pt(p) for p in tpoly], np.int32)], 255, cv2.LINE_AA, 0)
    # Open gap between stem bottom and terminal top, left of the counter.
    gap = np.zeros_like(m)
    cv2.rectangle(gap, pt((0, STEM_BOTTOM)), pt((HOLE[0], TAIL_TOP)), 255, -1)
    bowl = cv2.bitwise_and(bowl, cv2.bitwise_not(gap))
    m = cv2.max(m, bowl)
    m = cv2.max(m, tail)
    cv2.circle(m, pt(HOLE[:2]), int(HOLE[2] * s), 0, -1, cv2.LINE_AA)
    return m


def real_edges(mask):
    """Edges of the mask that are the glyph's true outline (its bottom is hidden behind the city)."""
    e = cv2.Canny(mask, 40, 120) > 0
    ys, xs = np.mgrid[0:H, 0:W]
    e &= (ys < 700) | (xs < 1262)
    return e
