"""Chroma-key and crop AI-generated skin PNGs into public/assets/images/skins/."""
from __future__ import annotations

from collections import deque
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
GEN = ROOT / "assets"
OUT = ROOT / "public" / "assets" / "images" / "skins"

PAIRS = (
    ("panda-ninja-gen.png", "panda-ninja.png"),
    ("panda-dead-ninja-gen.png", "panda-dead-ninja.png"),
    ("panda-cloud-gen.png", "panda-cloud.png"),
    ("panda-dead-cloud-gen.png", "panda-dead-cloud.png"),
    ("panda-summit-gen.png", "panda-summit.png"),
    ("panda-dead-summit-gen.png", "panda-dead-summit.png"),
    ("panda-golden-gen.png", "panda-golden.png"),
    ("panda-dead-golden-gen.png", "panda-dead-golden.png"),
)


def is_key(r: int, g: int, b: int, a: int) -> bool:
    if a < 8:
        return True
    if g < 140:
        return False
    if g < r + 40 or g < b + 40:
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
        if not is_key(r, g, b, a):
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

    bbox = rgba.getbbox()
    return rgba.crop(bbox) if bbox else rgba


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    for src_name, dst_name in PAIRS:
        src = GEN / src_name
        if not src.exists():
            raise SystemExit(f"Missing generated asset: {src}")
        out = chroma_key(Image.open(src))
        out.save(OUT / dst_name, optimize=True)
        print(f"{src_name} -> skins/{dst_name} ({out.width}x{out.height})")
    print(f"\nProcessed {len(PAIRS)} skin sprites.")


if __name__ == "__main__":
    main()
