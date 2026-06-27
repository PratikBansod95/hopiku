"""Resize and optimize PNG assets for YouTube Playables size limits."""
from __future__ import annotations

import sys
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
IMAGES = ROOT / "public" / "assets" / "images"

# YouTube recommends individual files under 512 KiB.
MAX_FILE_BYTES = 512 * 1024

BACKGROUND_MAX_WIDTH = 960
SPRITE_MAX_WIDTH = 640
UI_MAX_WIDTH = 480


def target_width(path: Path) -> int:
    name = path.name.lower()
    if name.startswith("background"):
        return BACKGROUND_MAX_WIDTH
    if name.startswith("cta-") or name.startswith("title-"):
        return UI_MAX_WIDTH
    return SPRITE_MAX_WIDTH


def compress_png(path: Path) -> tuple[int, int]:
    before = path.stat().st_size
    img = Image.open(path).convert("RGBA")
    max_w = target_width(path)

    if img.width > max_w:
        ratio = max_w / img.width
        new_h = max(1, round(img.height * ratio))
        img = img.resize((max_w, new_h), Image.Resampling.LANCZOS)

    for quality in (9, 6, 3):
        img.save(path, format="PNG", optimize=True, compress_level=quality)
        after = path.stat().st_size
        if after <= MAX_FILE_BYTES:
            return before, after

    # Last resort: shrink further if still too large.
    while path.stat().st_size > MAX_FILE_BYTES and img.width > 320:
        new_w = max(320, round(img.width * 0.85))
        ratio = new_w / img.width
        new_h = max(1, round(img.height * ratio))
        img = img.resize((new_w, new_h), Image.Resampling.LANCZOS)
        img.save(path, format="PNG", optimize=True, compress_level=9)

    return before, path.stat().st_size


def main() -> int:
    if not IMAGES.exists():
        print(f"Missing images directory: {IMAGES}", file=sys.stderr)
        return 1

    pngs = sorted(IMAGES.rglob("*.png"))
    if not pngs:
        print("No PNG assets found.", file=sys.stderr)
        return 1

    total_before = 0
    total_after = 0
    over_limit: list[str] = []

    for path in pngs:
        before, after = compress_png(path)
        total_before += before
        total_after += after
        rel = path.relative_to(ROOT)
        flag = " !" if after > MAX_FILE_BYTES else ""
        print(f"{rel}: {before // 1024} KiB -> {after // 1024} KiB{flag}")
        if after > MAX_FILE_BYTES:
            over_limit.append(str(rel))

    print(
        f"\nTotal: {total_before // 1024} KiB -> {total_after // 1024} KiB "
        f"({total_after / (1024 * 1024):.2f} MiB)"
    )

    if over_limit:
        print("\nStill over 512 KiB:", ", ".join(over_limit), file=sys.stderr)
        return 2

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
