#!/usr/bin/env python3
"""Re-registers Alfred's animation frames so they stop shaking, and rebuilds the sheets at display size.

Each frame of a sequence is a separately painted pose, so the feet and head drift a few pixels
from frame to frame. Played back, that reads as a tremble. This script:
  1. finds each frame's feet (the lowest part of the figure) and pins them to the same spot,
  2. clears faint stray pixels that could bleed into a neighbouring frame,
  3. resamples once, with Lanczos, to the size he is actually shown at (2x for sharp screens).

Input : public/alfred/sprites-source/<state>.webp   (4x4 atlas of 256x320 cells)
Output: public/alfred/v3/<state>.webp                (4x4 atlas of 208x260 cells)
"""
import os
import sys
from PIL import Image

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
SRC = os.path.join(ROOT, "public/alfred/sprites-source")
OUT = os.path.join(ROOT, "public/alfred/v3")
SRC_W, SRC_H = 256, 320
DST_W, DST_H = 208, 260
COLS = 4
BASELINE = 303   # y where the feet rest in the source cells
CENTER_X = 128
ALPHA_FLOOR = 10


def frames_of(sheet):
    for i in range(COLS * COLS):
        x, y = (i % COLS) * SRC_W, (i // COLS) * SRC_H
        yield sheet.crop((x, y, x + SRC_W, y + SRC_H))


MIN_PIECE = 500   # pixels: anything smaller that is not joined to the figure is debris


def components(alpha):
    """Labels the 8-connected regions of visible pixels. Returns (labels, sizes)."""
    w, h = alpha.size
    px = alpha.load()
    labels = [[0] * w for _ in range(h)]
    sizes = [0]
    for y0 in range(h):
        for x0 in range(w):
            if px[x0, y0] > 40 and not labels[y0][x0]:
                lab = len(sizes)
                sizes.append(0)
                stack = [(x0, y0)]
                labels[y0][x0] = lab
                while stack:
                    x, y = stack.pop()
                    sizes[lab] += 1
                    for ny in range(max(0, y - 1), min(h, y + 2)):
                        for nx in range(max(0, x - 1), min(w, x + 2)):
                            if px[nx, ny] > 40 and not labels[ny][nx]:
                                labels[ny][nx] = lab
                                stack.append((nx, ny))
    return labels, sizes


def clean(frame):
    """Drops faint fringe and any loose fragment that is not part of the figure.

    Some frames carry stray slivers (bits of hair or shoe) floating near the head or edge of
    the cell. They are what looked like Alfred's head 'breaking and overflowing'.
    """
    r, g, b, a = frame.split()
    a = a.point(lambda v: 0 if v < ALPHA_FLOOR else v)
    labels, sizes = components(a)
    if len(sizes) > 1:
        keep = {i for i, n in enumerate(sizes) if i and (n >= MIN_PIECE or n == max(sizes))}
        px = a.load()
        w, h = a.size
        for y in range(h):
            row = labels[y]
            for x in range(w):
                if px[x, y] and row[x] not in keep and row[x] != 0:
                    px[x, y] = 0
                elif px[x, y] and row[x] == 0:
                    # Soft edge pixels (alpha 10-40) belong to whichever piece they touch; keep them.
                    pass
    return Image.merge("RGBA", (r, g, b, a))


def feet_anchor(frame):
    """(centre x of the feet, lowest y) measured on the bottom 15% of the figure."""
    mask = frame.getchannel("A").point(lambda v: 255 if v > 40 else 0)
    bbox = mask.getbbox()
    if not bbox:
        return CENTER_X, BASELINE
    left, top, right, bottom = bbox
    band_top = bottom - max(8, int((bottom - top) * 0.15))
    band = mask.crop((0, band_top, SRC_W, bottom))
    px = band.load()
    xs = [x for y in range(band.height) for x in range(band.width) if px[x, y]]
    return (sum(xs) / len(xs) if xs else CENTER_X), bottom


def stabilise(name):
    sheet = Image.open(os.path.join(SRC, f"{name}.webp")).convert("RGBA")
    frames = [clean(f) for f in frames_of(sheet)]
    anchors = [feet_anchor(f) for f in frames]

    # Pin every frame's feet to the median feet position of the sequence so the figure
    # keeps its natural place in the cell and only the pose changes.
    med_x = sorted(a[0] for a in anchors)[len(anchors) // 2]
    dx_all = [round(med_x - a[0]) for a in anchors]
    out = Image.new("RGBA", (DST_W * COLS, DST_H * COLS), (0, 0, 0, 0))
    scale_x, scale_y = DST_W / SRC_W, DST_H / SRC_H
    report = []
    for i, frame in enumerate(frames):
        dx = dx_all[i]
        dy = BASELINE - anchors[i][1]
        moved = Image.new("RGBA", (SRC_W, SRC_H), (0, 0, 0, 0))
        moved.paste(frame, (dx, dy))
        # Nothing may touch the cell edge: a clipped head is far worse than a small shift.
        bbox = moved.getchannel("A").point(lambda v: 255 if v > 0 else 0).getbbox()
        if bbox and (bbox[0] < 2 or bbox[1] < 2 or bbox[2] > SRC_W - 2 or bbox[3] > SRC_H - 2):
            moved = Image.new("RGBA", (SRC_W, SRC_H), (0, 0, 0, 0))
            moved.paste(frame, (0, dy))
            bbox = moved.getchannel("A").getbbox()
        small = moved.resize((DST_W, DST_H), Image.LANCZOS)
        out.paste(small, ((i % COLS) * DST_W, (i // COLS) * DST_H))
        report.append((dx, dy))
    os.makedirs(OUT, exist_ok=True)
    out.save(os.path.join(OUT, f"{name}.webp"), "WEBP", quality=92, method=6, exact=True)
    return report


if __name__ == "__main__":
    names = sorted(f[:-5] for f in os.listdir(SRC) if f.endswith(".webp"))
    for n in names:
        r = stabilise(n)
        print(f"{n:12s} max shift x={max(abs(d[0]) for d in r):3d} y={max(abs(d[1]) for d in r):3d}")
