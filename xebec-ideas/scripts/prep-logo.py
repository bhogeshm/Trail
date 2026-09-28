# Separates the uploaded logo (assets/logo/xebec-logo-original.png) from its white
# background into transparent layers (arcs, swoosh, word, full) at 4x, keeping the
# original pixels' coverage and the exact brand colours sampled from the file.
import os
from collections import Counter
import numpy as np
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
DIR = os.path.join(HERE, "..", "assets", "logo")
src = Image.open(os.path.join(DIR, "xebec-logo-original.png")).convert("RGB")
im = np.asarray(src).astype(float)
r, b = im[..., 0], im[..., 2]

a_navy = np.clip((255 - r) / 254, 0, 1)
a_amber = np.clip(((255 - b) - a_navy * (255 - 104)) / (255 - 29), 0, 1)
# Drop JPEG-style speckle noise from the white background.
a_navy = np.where(a_navy < 0.12, 0, a_navy)
a_amber = np.where(a_amber < 0.12, 0, a_amber)

def solid(mask):
    px = [tuple(p) for p in np.asarray(src)[mask]]
    return Counter(px).most_common(1)[0][0]

NAVY = solid(a_navy > 0.98)
AMBER = solid((a_amber > 0.98) & (r > 200))
print("navy", "#%02X%02X%02X" % NAVY, "amber", "#%02X%02X%02X" % AMBER)

H, W = r.shape
yy, xx = np.mgrid[0:H, 0:W]
word = (xx > 100) & (yy > 82) & (yy < 118)
CROP = (8, 16, 194, 182)
UP = 4

def layer(alpha, color, name):
    rgba = np.zeros((H, W, 4), np.uint8)
    rgba[..., :3] = color
    rgba[..., 3] = (alpha * 255).round().astype(np.uint8)
    img = Image.fromarray(rgba, "RGBA").crop(CROP)
    img = img.resize((img.width * UP, img.height * UP), Image.LANCZOS)
    img.save(os.path.join(DIR, f"xebec-{name}.png"))

layer(np.where(word, 0, a_navy), NAVY, "arcs")
layer(np.where(word, a_navy, 0), NAVY, "word")
layer(a_amber, AMBER, "swoosh")

full = Image.new("RGBA", ((CROP[2] - CROP[0]) * UP, (CROP[3] - CROP[1]) * UP))
for n in ("arcs", "swoosh", "word"):
    full = Image.alpha_composite(full, Image.open(os.path.join(DIR, f"xebec-{n}.png")))
full.save(os.path.join(DIR, "xebec-logo.png"))
print("size", full.size)
