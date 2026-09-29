"""Beat-locked re-edit: every cut snapped to a 120 BPM grid (beat = 0.1 + 0.5k s)."""

# (src_in, src_out, out_start, out_end) – src trimmed or gently re-timed to fit
EDIT = [
    (0.0000, 1.6016, 0.0, 1.6),     # girl in the van
    (1.6016, 3.6016, 1.6, 3.6),     # marigold basket drop
    (3.6370, 5.6056, 3.6, 5.6),     # indicator blink (blue)
    (5.6056, 7.6076, 5.6, 7.6),     # tyre on gravel
    (7.6076, 10.0767, 7.6, 10.1),   # Gurkha tyre on rangoli
    (10.0767, 11.5767, 10.1, 11.6), # Traveller door
    (11.7117, 13.6803, 11.6, 13.6), # dhol  (DROP)
    (13.6803, 15.6803, 13.6, 15.6), # women clapping
    (15.7157, 16.6166, 15.6, 16.6), # dandiya cross (slight slow-mo)
    (16.6166, 19.0857, 16.6, 19.1), # blue van + dancers
    (19.0857, 20.9209, 19.1, 21.1), # DJ
    (21.0070, 23.2566, 21.1, 23.35),# Gurkha headlights
    (23.2566, 24.9249, 23.35, 25.1),# wide garba ground
    (25.0977, 31.0977, 25.1, 31.1), # temple -> blackout -> aerial
    (31.0977, 34.0977, 31.1, 34.1), # dandiya in pink smoke
    (34.2008, 35.6022, 34.1, 35.6), # solo dancer (slight slow-mo)
    (35.6022, 37.5709, 35.6, 37.6), # couple + gulal
    (37.5709, 40.5071, 37.6, 40.6), # DJ stage wide
    (40.5071, 42.5071, 40.6, 42.6), # blue headlight + marigold
    (42.5425, 44.7400, 42.6, 44.7975), # fleet line-up (then held)
]
HOLD = 2.0          # freeze last frame, fade to black
TOTAL = EDIT[-1][3] + HOLD


def out_time(src):
    for a, b, c, d in EDIT:
        if a <= src < b:
            return c + (src - a) * (d - c) / (b - a)
    raise ValueError(src)


def beat(k):
    return 0.1 + 0.5 * k
