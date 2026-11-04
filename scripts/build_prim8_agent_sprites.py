#!/usr/bin/env python3
"""Recolor LimeZu character sheets into PRIM8 streetwear agents.

Turns clothing toward matte black / charcoal with a magenta PRIM8 accent
while preserving skin, hair, and animation layout (32x64 frames).
Also copies high-res portrait references into the frontend public assets.
"""
from __future__ import annotations

import shutil
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
CHAR_DIR = ROOT / "frontend/public/assets/sprites/characters"
PORTRAIT_DIR = ROOT / "frontend/public/assets/portraits"
ASSET_SRC = Path("/home/ubuntu/.cursor/projects/workspace/assets")
STATIC_CHAR = ROOT / "app/static/office/assets/sprites/characters"
STATIC_PORTRAIT = ROOT / "app/static/office/assets/portraits"

# Agent → source char sheet + palette hints
# Magenta accent: #ec4899-ish
MAGENTA = (236, 72, 153)

AGENT_SHEETS = {
    # slug: (source_char, hair_boost_rgb or None, skin_tint or None)
    "jarvis": ("char_02", (236, 72, 153), None),       # pink accent hair vibe
    "aria": ("char_03", (34, 197, 94), None),           # green
    "simone": ("char_05", (244, 114, 182), None),       # pink
    "spike": ("char_06", (167, 139, 250), None),        # purple
    "dre": ("char_07", (96, 165, 250), None),           # blue
    "shakir": ("char_08", (45, 212, 191), None),        # teal
    "echo": ("char_09", (34, 211, 238), None),          # cyan
    "data_engineer": ("char_04", (148, 163, 184), None),
    "dispatcher": ("char_01", (201, 155, 84), None),
}

# Portrait mapping from uploaded references
PORTRAITS = {
    "dre": "36D13DAF-71E4-4A0F-8991-A7D70D13B4BA_L0_001.jpg",       # cameraman / blue
    "shakir": "6EBBAEE0-DB36-4182-82A6-F582FC615EF2_L0_001.jpg",    # beanie / magenta
    "aria": "42D20F7B-75D2-441E-BE16-45BCF1587613_L0_001.jpg",      # professional / green
    "echo": "C58533F2-0075-4404-AA95-4AB0CEAEF7E8_L0_001.jpg",      # headphones / orange
    "simone": "463D8A7F-A35E-4341-94C3-9E43C1EA9B9B_L0_001.jpg",    # streetwear / pink
}


def is_skin(r: int, g: int, b: int) -> bool:
    # Broad skin-tone detector for pixel art
    if r < 60 or g < 40 or b < 30:
        return False
    if r > g + 8 and r > b + 8 and g > b - 20 and r < 250:
        # exclude pure orange/red clothing
        if r > 200 and g < 100:
            return False
        return True
    # deeper skin
    if 70 < r < 160 and 40 < g < 120 and 30 < b < 100 and r > g > b:
        return True
    return False


def is_hair(r: int, g: int, b: int) -> bool:
    # Dark hair or already-vivid hair on stock sheets
    lum = (r + g + b) / 3
    if lum < 45 and max(r, g, b) < 70:
        return True
    # saturated non-skin colors often used as hair on LimeZu sheets
    mx, mn = max(r, g, b), min(r, g, b)
    if mx - mn > 50 and mx > 80 and not is_skin(r, g, b):
        # exclude greens that are plants (n/a on character sheets) and UI sparkles
        return True
    return False


def is_clothing(r: int, g: int, b: int, a: int) -> bool:
    if a < 20:
        return False
    if is_skin(r, g, b):
        return False
    # white / light shirts → black
    lum = (r + g + b) / 3
    if lum > 170 and abs(r - g) < 35 and abs(g - b) < 35:
        return True
    # blues / jeans / colored shirts
    if 40 < lum < 200 and not is_hair(r, g, b):
        # keep pure black boots-ish
        if lum < 35:
            return False
        return True
    return False


def recolor_sheet(src: Path, dest: Path, hair_rgb: tuple[int, int, int] | None) -> None:
    im = Image.open(src).convert("RGBA")
    px = im.load()
    w, h = im.size
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if a < 10:
                continue
            if is_skin(r, g, b):
                continue
            if hair_rgb and is_hair(r, g, b):
                # blend toward target hair while keeping shading
                lum = (r + g + b) / 3 / 255.0
                factor = 0.45 + 0.55 * lum
                px[x, y] = (
                    min(255, int(hair_rgb[0] * factor)),
                    min(255, int(hair_rgb[1] * factor)),
                    min(255, int(hair_rgb[2] * factor)),
                    a,
                )
                continue
            if is_clothing(r, g, b, a):
                lum = (r + g + b) / 3
                # matte black streetwear with slight charcoal variation
                shade = int(18 + (lum / 255.0) * 42)
                # sprinkle magenta PRIM8 accent on a few mid-tone pixels (logo hint)
                if 120 < lum < 160 and (x + y) % 97 == 0:
                    px[x, y] = (*MAGENTA, a)
                else:
                    px[x, y] = (shade, shade, shade + 2, a)
    dest.parent.mkdir(parents=True, exist_ok=True)
    im.save(dest)
    print(f"wrote {dest.name}")


def copy_portraits() -> None:
    PORTRAIT_DIR.mkdir(parents=True, exist_ok=True)
    for slug, filename in PORTRAITS.items():
        src = ASSET_SRC / filename
        if not src.exists():
            print(f"missing portrait source {src}")
            continue
        dest = PORTRAIT_DIR / f"{slug}.jpg"
        # Center-crop square-ish portrait for UI
        im = Image.open(src).convert("RGB")
        w, h = im.size
        side = min(w, h)
        left = (w - side) // 2
        top = max(0, (h - side) // 2 - side // 10)  # bias upward toward face
        im = im.crop((left, top, left + side, top + side)).resize((256, 256), Image.Resampling.LANCZOS)
        im.save(dest, quality=90)
        print(f"portrait {slug} -> {dest}")
        if STATIC_PORTRAIT.parent.exists():
            STATIC_PORTRAIT.mkdir(parents=True, exist_ok=True)
            shutil.copy2(dest, STATIC_PORTRAIT / dest.name)

    # Fallback portraits for agents without custom art: tinted solid cards
    for slug, (sheet, hair, _) in AGENT_SHEETS.items():
        dest = PORTRAIT_DIR / f"{slug}.jpg"
        if dest.exists():
            continue
        color = hair or (80, 80, 90)
        im = Image.new("RGB", (256, 256), (12, 12, 16))
        # simple branded card
        from PIL import ImageDraw, ImageFont

        draw = ImageDraw.Draw(im)
        draw.rounded_rectangle((24, 24, 232, 232), radius=28, fill=(24, 24, 28), outline=color, width=4)
        draw.ellipse((78, 56, 178, 156), fill=color)
        draw.rounded_rectangle((70, 150, 186, 210), radius=40, fill=(30, 30, 34))
        draw.text((128, 228), "PRIM8", fill=(236, 72, 153), anchor="mm")
        im.save(dest, quality=90)
        print(f"fallback portrait {slug}")
        if STATIC_PORTRAIT.parent.exists():
            STATIC_PORTRAIT.mkdir(parents=True, exist_ok=True)
            shutil.copy2(dest, STATIC_PORTRAIT / dest.name)


def main() -> None:
    # Recolor into dedicated prim8_*.png sheets (keep originals intact)
    out_dir = CHAR_DIR
    for slug, (sheet, hair, _) in AGENT_SHEETS.items():
        src = CHAR_DIR / f"{sheet}.png"
        if not src.exists():
            print(f"missing {src}")
            continue
        dest = out_dir / f"prim8_{slug}.png"
        recolor_sheet(src, dest, hair)
        if STATIC_CHAR.exists():
            shutil.copy2(dest, STATIC_CHAR / dest.name)

    copy_portraits()
    print("done")


if __name__ == "__main__":
    main()
