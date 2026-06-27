"""Remove baked-in checkerboard backgrounds from UI PNGs and trim to content."""
from __future__ import annotations

from collections import deque
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
UI_DIR = ROOT / "public" / "assets" / "images"
FILES = ("title-hopiku.png", "cta-tap-to-jump.png", "cta-play-again.png")


def is_bg(r: int, g: int, b: int, a: int) -> bool:
    if a < 8:
        return True
    # Light neutral pixels used in fake transparency checkers.
    if abs(r - g) > 12 or abs(g - b) > 12 or abs(r - b) > 12:
        return False
    avg = (r + g + b) / 3
    return avg >= 168


def flood_key(data: bytearray, w: int, h: int) -> None:
    keyed = bytearray(w * h)
    queue: deque[int] = deque()

    def seed(x: int, y: int) -> None:
        idx = y * w + x
        if keyed[idx]:
            return
        o = idx * 4
        if not is_bg(data[o], data[o + 1], data[o + 2], data[o + 3]):
            return
        keyed[idx] = 1
        queue.append(idx)

    for x in range(w):
        seed(x, 0)
        seed(x, h - 1)
    for y in range(h):
        seed(0, y)
        seed(w - 1, y)

    while queue:
        idx = queue.popleft()
        x = idx % w
        y = idx // w
        for nx, ny in ((x - 1, y), (x + 1, y), (x, y - 1), (x, y + 1)):
            if nx < 0 or ny < 0 or nx >= w or ny >= h:
                continue
            nidx = ny * w + nx
            if keyed[nidx]:
                continue
            o = nidx * 4
            if not is_bg(data[o], data[o + 1], data[o + 2], data[o + 3]):
                continue
            keyed[nidx] = 1
            queue.append(nidx)

    for idx in range(w * h):
        if keyed[idx]:
            o = idx * 4
            data[o + 3] = 0


def trim(img: Image.Image, pad: int = 4) -> Image.Image:
    bbox = img.getbbox()
    if not bbox:
        return img
    x0, y0, x1, y1 = bbox
    x0 = max(0, x0 - pad)
    y0 = max(0, y0 - pad)
    x1 = min(img.width, x1 + pad)
    y1 = min(img.height, y1 + pad)
    return img.crop((x0, y0, x1, y1))


def process(path: Path) -> None:
    img = Image.open(path).convert("RGBA")
    data = bytearray(img.tobytes())
    flood_key(data, img.width, img.height)
    out = Image.frombytes("RGBA", img.size, bytes(data))
    out = trim(out)
    out.save(path, optimize=True)
    print(f"  {path.name} -> {out.width}x{out.height}")


def main() -> None:
    print("Stripping UI alpha backgrounds...")
    for name in FILES:
        process(UI_DIR / name)
    print("Done.")


if __name__ == "__main__":
    main()
