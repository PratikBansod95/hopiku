"""Generate distinctive Hopiku panda skin PNGs from base sprites."""
from __future__ import annotations

from collections import deque
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter

ROOT = Path(__file__).resolve().parents[1]
IMG = ROOT / "public" / "assets" / "images"
OUT = IMG / "skins"

PANDA = IMG / "panda.png"
PANDA_DEAD = IMG / "panda-dead.png"

SKINS = ("ninja", "cloud", "summit", "golden")


def is_screen_green(r: int, g: int, b: int, a: int) -> bool:
    if a < 8:
        return True
    if g < 165:
        return False
    if r > 115 or b > 115:
        return False
    if g < r + 55 or g < b + 55:
        return False
    return True


def chroma_key(img: Image.Image) -> Image.Image:
    rgba = img.convert("RGBA")
    w, h = rgba.size
    px = rgba.load()
    keyed = bytearray(w * h)
    queue: deque[tuple[int, int]] = deque()

    def seed(x: int, y: int) -> None:
        idx = y * w + x
        if keyed[idx]:
            return
        r, g, b, a = px[x, y]
        if not is_screen_green(r, g, b, a):
            return
        keyed[idx] = 1
        queue.append((x, y))

    for x in range(w):
        seed(x, 0)
        seed(x, h - 1)
    for y in range(h):
        seed(0, y)
        seed(w - 1, y)

    while queue:
        x, y = queue.popleft()
        for nx, ny in ((x - 1, y), (x + 1, y), (x, y - 1), (x, y + 1)):
            if 0 <= nx < w and 0 <= ny < h:
                seed(nx, ny)

    for y in range(h):
        for x in range(w):
            if keyed[y * w + x]:
                px[x, y] = (0, 0, 0, 0)

    return crop_opaque(rgba)


def crop_opaque(img: Image.Image) -> Image.Image:
    bbox = img.getbbox()
    return img.crop(bbox) if bbox else img


def content_box(img: Image.Image) -> tuple[int, int, int, int]:
    return img.getbbox() or (0, 0, img.width, img.height)


def rel_box(img: Image.Image, l: float, t: float, r: float, b: float) -> tuple[int, int, int, int]:
    x0, y0, x1, y1 = content_box(img)
    w, h = x1 - x0, y1 - y0
    return (
        int(x0 + w * l),
        int(y0 + h * t),
        int(x0 + w * r),
        int(y0 + h * b),
    )


def is_blue_scarf(r: int, g: int, b: int, a: int) -> bool:
    return a > 20 and b > 120 and b > r + 18 and b > g + 5


def recolor_scarf(img: Image.Image, color: tuple[int, int, int]) -> None:
    px = img.load()
    w, h = img.size
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if is_blue_scarf(r, g, b, a):
                mix = 0.88
                px[x, y] = (
                    int(r * (1 - mix) + color[0] * mix),
                    int(g * (1 - mix) + color[1] * mix),
                    int(b * (1 - mix) + color[2] * mix),
                    a,
                )


def composite_soft(base: Image.Image, overlay: Image.Image) -> Image.Image:
    blurred = overlay.filter(ImageFilter.GaussianBlur(radius=0.6))
    return Image.alpha_composite(base, blurred)


def draw_star(draw: ImageDraw.ImageDraw, cx: int, cy: int, r: int, fill: tuple[int, ...]) -> None:
    import math

    pts = []
    for i in range(10):
        ang = math.pi / 2 + i * math.pi / 5
        rad = r if i % 2 == 0 else r * 0.42
        pts.append((cx + math.cos(ang) * rad, cy - math.sin(ang) * rad))
    draw.polygon(pts, fill=fill)


def apply_ninja_alive(base: Image.Image) -> Image.Image:
    out = base.copy()
    recolor_scarf(out, (28, 32, 48))

    overlay = Image.new("RGBA", out.size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay)

    band = rel_box(out, 0.20, 0.04, 0.80, 0.13)
    draw.rounded_rectangle(band, radius=8, fill=(178, 22, 22, 245))
    draw.rounded_rectangle(
        (band[0], band[3] - 5, band[2], band[3] + 2),
        radius=4,
        fill=(120, 10, 10, 255),
    )

    mask = rel_box(out, 0.30, 0.20, 0.70, 0.37)
    draw.ellipse(mask, fill=(16, 18, 28, 210))
    inner = (mask[0] + 8, mask[1] + 8, mask[2] - 8, mask[3] - 4)
    draw.ellipse(inner, fill=(8, 10, 18, 185))

    knot = rel_box(out, 0.40, 0.42, 0.60, 0.50)
    draw.ellipse(knot, fill=(178, 22, 22, 230))

    shx, shy, _, _ = rel_box(out, 0.74, 0.36, 0.82, 0.44)
    draw.polygon(
        [
            (shx, shy - 12),
            (shx + 4, shy - 3),
            (shx + 12, shy),
            (shx + 4, shy + 3),
            (shx, shy + 12),
            (shx - 4, shy + 3),
            (shx - 12, shy),
            (shx - 4, shy - 3),
        ],
        fill=(205, 212, 222, 235),
        outline=(70, 78, 92, 255),
    )

    return composite_soft(out, overlay)


def apply_ninja_dead(base: Image.Image) -> Image.Image:
    out = base.copy()
    recolor_scarf(out, (28, 32, 48))

    overlay = Image.new("RGBA", out.size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay)

    band = rel_box(out, 0.14, 0.02, 0.58, 0.12)
    draw.polygon(
        [(band[0], band[3]), (band[2], band[1]), (band[2] + 10, band[3] + 4)],
        fill=(178, 22, 22, 220),
    )

    belt = rel_box(out, 0.30, 0.50, 0.70, 0.66)
    draw.rounded_rectangle(belt, radius=14, fill=(24, 28, 42, 200))
    draw.ellipse((belt[0] + 18, belt[1] + 6, belt[2] - 18, belt[1] + 22), fill=(178, 22, 22, 240))

    return composite_soft(out, overlay)


def apply_cloud_alive(base: Image.Image) -> Image.Image:
    out = base.copy()
    recolor_scarf(out, (220, 236, 255))

    overlay = Image.new("RGBA", out.size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay)

    def puff(cx: int, cy: int, r: int, alpha: int = 220) -> None:
        draw.ellipse((cx - r, cy - r, cx + r, cy + r), fill=(248, 252, 255, alpha))
        draw.ellipse((cx - r + 10, cy - r - 8, cx + r - 6, cy + r - 10), fill=(255, 255, 255, alpha))

    cx = (rel_box(out, 0, 0.36, 1, 0.38)[0] + rel_box(out, 0, 0.36, 1, 0.38)[2]) // 2
    cy = rel_box(out, 0, 0.34, 1, 0.40)[1]
    puff(cx - 36, cy - 6, 24)
    puff(cx + 34, cy - 10, 20)
    puff(cx, cy - 22, 28, 235)

    cape = rel_box(out, 0.26, 0.40, 0.74, 0.58)
    draw.rounded_rectangle(cape, radius=20, fill=(196, 224, 255, 175))
    draw.rounded_rectangle(
        (cape[0] + 5, cape[1] + 5, cape[2] - 5, cape[3] - 5),
        radius=16,
        fill=(238, 246, 255, 195),
    )

    for ox in (0.14, 0.80):
        px = rel_box(out, ox, 0.10, ox + 0.02, 0.12)[0]
        py = rel_box(out, ox, 0.10, ox + 0.02, 0.12)[1]
        draw.ellipse((px - 14, py - 10, px + 14, py + 10), fill=(210, 232, 255, 70))

    return composite_soft(out, overlay)


def apply_cloud_dead(base: Image.Image) -> Image.Image:
    out = base.copy()
    recolor_scarf(out, (220, 236, 255))

    overlay = Image.new("RGBA", out.size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay)

    hx = (rel_box(out, 0.42, 0.02, 0.58, 0.08)[0] + rel_box(out, 0.42, 0.02, 0.58, 0.08)[2]) // 2
    hy = rel_box(out, 0.42, 0.02, 0.58, 0.08)[1]
    draw.ellipse((hx - 30, hy - 8, hx + 30, hy + 20), fill=(240, 248, 255, 200))
    draw.ellipse((hx - 48, hy + 2, hx - 8, hy + 24), fill=(255, 255, 255, 215))
    draw.ellipse((hx + 10, hy + 4, hx + 42, hy + 22), fill=(228, 240, 255, 210))

    return composite_soft(out, overlay)


def apply_summit_alive(base: Image.Image) -> Image.Image:
    out = base.copy()
    recolor_scarf(out, (210, 96, 48))

    overlay = Image.new("RGBA", out.size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay)

    peak_x = (rel_box(out, 0.2, 0, 0.8, 0.2)[0] + rel_box(out, 0.2, 0, 0.8, 0.2)[2]) // 2
    peak_top = rel_box(out, 0.2, 0.0, 0.8, 0.18)[1]
    peak_base = rel_box(out, 0.2, 0.0, 0.8, 0.18)[3]
    draw.polygon(
        [(peak_x - 42, peak_base), (peak_x + 42, peak_base), (peak_x, peak_top)],
        fill=(248, 250, 252, 245),
        outline=(150, 168, 188, 255),
    )
    draw.polygon(
        [(peak_x - 16, peak_top + 10), (peak_x + 16, peak_top + 10), (peak_x, peak_top + 28)],
        fill=(255, 255, 255, 255),
    )
    draw.ellipse((peak_x - 9, peak_base - 8, peak_x + 9, peak_base + 6), fill=(204, 72, 48, 255))

    vest = rel_box(out, 0.22, 0.38, 0.78, 0.72)
    draw.rounded_rectangle(vest, radius=16, fill=(198, 88, 42, 215))
    draw.rounded_rectangle(
        (vest[0] + 8, vest[1] + 8, vest[2] - 8, vest[3] - 8),
        radius=12,
        fill=(232, 124, 58, 205),
    )
    draw.line([(vest[0] + 14, vest[1] + 20), (vest[2] - 14, vest[1] + 20)], fill=(168, 68, 28, 255), width=3)

    flag = rel_box(out, 0.70, 0.28, 0.86, 0.56)
    draw.rectangle(flag, fill=(248, 248, 248, 235), outline=(168, 68, 28, 255), width=2)
    draw.polygon([(flag[2] - 4, flag[1] + 8), (flag[2] + 12, flag[1] + 20), (flag[2] - 4, flag[1] + 32)], fill=(198, 88, 42, 255))

    return composite_soft(out, overlay)


def apply_summit_dead(base: Image.Image) -> Image.Image:
    out = base.copy()
    recolor_scarf(out, (210, 96, 48))

    overlay = Image.new("RGBA", out.size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay)

    hat = rel_box(out, 0.08, 0.0, 0.50, 0.12)
    draw.polygon([(hat[0], hat[3]), (hat[2], hat[1]), (hat[2] + 8, hat[3] + 4)], fill=(248, 250, 252, 225))

    vest = rel_box(out, 0.28, 0.44, 0.74, 0.66)
    draw.rounded_rectangle(vest, radius=12, fill=(198, 88, 42, 190))

    return composite_soft(out, overlay)


def apply_golden_alive(base: Image.Image) -> Image.Image:
    out = base.copy()
    recolor_scarf(out, (255, 196, 32))

    px = out.load()
    w, h = out.size
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if a < 20:
                continue
            if r < 95 and g < 95 and b < 95:
                px[x, y] = (
                    min(255, int(r * 0.55 + 120)),
                    min(255, int(g * 0.55 + 90)),
                    max(0, int(b * 0.6 + 10)),
                    a,
                )

    overlay = Image.new("RGBA", out.size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay)

    cx = (rel_box(out, 0.2, 0.04, 0.8, 0.18)[0] + rel_box(out, 0.2, 0.04, 0.8, 0.18)[2]) // 2
    cy = rel_box(out, 0.2, 0.06, 0.8, 0.18)[1]
    draw.rectangle((cx - 32, cy + 6, cx + 32, cy + 14), fill=(255, 183, 0, 255))
    for i in range(-2, 3):
        draw_star(draw, cx + i * 15, cy - 2, 9, (255, 215, 64, 255))

    for sx, sy in ((0.16, 0.12), (0.80, 0.14), (0.86, 0.40)):
        px2, py2 = rel_box(out, sx, sy, sx + 0.01, sy + 0.01)[0], rel_box(out, sx, sy, sx + 0.01, sy + 0.01)[1]
        draw_star(draw, px2, py2, 7, (255, 236, 120, 210))

    return composite_soft(out, overlay)


def apply_golden_dead(base: Image.Image) -> Image.Image:
    out = base.copy()
    recolor_scarf(out, (255, 196, 32))

    overlay = Image.new("RGBA", out.size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay)

    cx, cy = rel_box(out, 0.36, 0.02, 0.58, 0.12)[0], rel_box(out, 0.36, 0.02, 0.58, 0.12)[1]
    draw.rectangle((cx - 18, cy + 4, cx + 24, cy + 12), fill=(255, 183, 0, 225))
    draw_star(draw, cx + 16, cy, 8, (255, 215, 64, 235))

    return composite_soft(out, overlay)


ALIVE_FNS = {
    "ninja": apply_ninja_alive,
    "cloud": apply_cloud_alive,
    "summit": apply_summit_alive,
    "golden": apply_golden_alive,
}

DEAD_FNS = {
    "ninja": apply_ninja_dead,
    "cloud": apply_cloud_dead,
    "summit": apply_summit_dead,
    "golden": apply_golden_dead,
}


def main() -> None:
    if not PANDA.exists() or not PANDA_DEAD.exists():
        raise SystemExit(f"Missing base sprites: {PANDA} and {PANDA_DEAD}")

    OUT.mkdir(parents=True, exist_ok=True)
    alive_base = chroma_key(Image.open(PANDA))
    dead_base = chroma_key(Image.open(PANDA_DEAD))

    for skin in SKINS:
        alive = ALIVE_FNS[skin](alive_base.copy())
        dead = DEAD_FNS[skin](dead_base.copy())
        alive_path = OUT / f"panda-{skin}.png"
        dead_path = OUT / f"panda-dead-{skin}.png"
        alive.save(alive_path, optimize=True)
        dead.save(dead_path, optimize=True)
        print(f"Wrote {alive_path.name}, {dead_path.name}")

    print(f"\nGenerated {len(SKINS) * 2} skin sprites in {OUT}")


if __name__ == "__main__":
    main()
