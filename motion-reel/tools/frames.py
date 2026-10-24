"""Shared markup for the seven 'frames' (the film's own beats as thumbnails) used by 05 and 06."""

INK = "#111110"
GR = "#5e5b55"

THUMBS = [
    # 0 the slit
    f'<path d="M100,16 C80,44 80,76 100,104 C120,76 120,44 100,16Z" fill="{INK}"/>',
    # 1 observe: line + word bar
    f'<rect x="70" y="18" width="3" height="84" fill="{INK}"/><rect x="84" y="52" width="82" height="16" fill="{INK}"/>',
    # 2 question: the corner
    f'<rect x="84" y="68" width="88" height="3" fill="{INK}"/><rect x="62" y="68" width="3" height="40" fill="{INK}"/><rect x="88" y="44" width="70" height="16" fill="{INK}"/>',
    # 3 reimagine: the ambiguous cube
    f'<g fill="none" stroke="{INK}" stroke-width="2.5"><rect x="66" y="34" width="56" height="56"/><rect x="82" y="20" width="56" height="56" stroke-width="1.5"/>'
    f'<path d="M66 34 L82 20 M122 34 L138 20 M122 90 L138 76 M66 90 L82 76" stroke-width="1.5"/></g><circle cx="94" cy="62" r="28" fill="none" stroke="{GR}" stroke-width="1.5"/>',
    # 4 the name
    f'<rect x="28" y="36" width="104" height="18" fill="{INK}"/><rect x="28" y="62" width="144" height="18" fill="{INK}"/><rect x="28" y="56" width="150" height="2" fill="{INK}"/><rect x="28" y="82" width="150" height="2" fill="{INK}"/>',
    # 5 the grid, one square out of line
    "".join(
        f'<rect x="{46 + c * 22 + (2 if (r, c) == (1, 4) else 0)}" y="{30 + r * 22 + (2 if (r, c) == (1, 4) else 0)}" width="8" height="8" fill="{INK}"/>'
        for r in range(4) for c in range(6)
    ),
    # 6 the cube
    f'<path d="M100 22 L138 42 L100 62 L62 42Z" fill="#f1eee8" stroke="{INK}" stroke-width="2"/>'
    f'<path d="M62 42 L100 62 L100 102 L62 82Z" fill="#d8d3c9" stroke="{INK}" stroke-width="2"/>'
    f'<path d="M100 62 L138 42 L138 82 L100 102Z" fill="#8f897f" stroke="{INK}" stroke-width="2"/>',
]

# Where each frame sits after 05 rearranges the strip: centre (x, y) and scale.
LAYOUT = [(1180, 800, 1.0), (1420, 800, 1.0), (1660, 800, 1.0), (1300, 520, 2.2), (1650, 420, 0.8), (1650, 540, 0.8), (1650, 660, 0.8)]


def frames_markup(prefix):
    out = []
    for i, t in enumerate(THUMBS):
        out.append(
            f'<div id="{prefix}-f{i}" class="{prefix}-frame" style="left:{i * 224}px">'
            f'<svg viewBox="0 0 200 120" width="200" height="120">{t}</svg></div>'
        )
    return "\n        ".join(out)
