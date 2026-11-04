#!/usr/bin/env python3
"""Cut PRIM8 character renders into transparent standing sprites (rembg)."""
from __future__ import annotations

from pathlib import Path

from PIL import Image
from rembg import remove

ROOT = Path(__file__).resolve().parents[1]
SRC = Path("/home/ubuntu/.cursor/projects/workspace/assets")
OUT = ROOT / "frontend/public/assets/agents"
STATIC = ROOT / "app/static/office/assets/agents"
PORTRAITS = ROOT / "frontend/public/assets/portraits"
STATIC_PORTRAITS = ROOT / "app/static/office/assets/portraits"

LOOKS = {
    "cameraman": "36D13DAF-71E4-4A0F-8991-A7D70D13B4BA_L0_001.jpg",
    "beanie": "6EBBAEE0-DB36-4182-82A6-F582FC615EF2_L0_001.jpg",
    "executive": "42D20F7B-75D2-441E-BE16-45BCF1587613_L0_001.jpg",
    "street": "463D8A7F-A35E-4341-94C3-9E43C1EA9B9B_L0_001.jpg",
    "producer": "C58533F2-0075-4404-AA95-4AB0CEAEF7E8_L0_001.jpg",
}

AGENT_LOOKS = {
    "dre": "cameraman",
    "spike": "cameraman",
    "shakir": "beanie",
    "jarvis": "beanie",
    "aria": "executive",
    "dispatcher": "executive",
    "simone": "street",
    "echo": "producer",
    "data_engineer": "producer",
}


def cutout(src: Path) -> Image.Image:
    im = Image.open(src).convert("RGBA")
    out = remove(im)
    bbox = out.split()[-1].getbbox()
    if bbox:
        pad = 10
        l, t, r, b = bbox
        out = out.crop(
            (max(0, l - pad), max(0, t - pad), min(out.width, r + pad), min(out.height, b + pad))
        )
    target_h = 1024
    scale = target_h / out.height
    return out.resize((max(1, int(out.width * scale)), target_h), Image.Resampling.LANCZOS)


def write_portrait(slug: str, sprite: Image.Image) -> None:
    PORTRAITS.mkdir(parents=True, exist_ok=True)
    STATIC_PORTRAITS.mkdir(parents=True, exist_ok=True)
    w, h = sprite.size
    crop = sprite.crop((0, 0, w, int(h * 0.62)))
    bg = Image.new("RGB", (256, 256), (12, 12, 16))
    scale = min(256 / crop.width, 256 / crop.height)
    nw, nh = int(crop.width * scale), int(crop.height * scale)
    crop = crop.resize((nw, nh), Image.Resampling.LANCZOS)
    bg.paste(crop, ((256 - nw) // 2, (256 - nh) // 2), crop)
    bg.save(PORTRAITS / f"{slug}.jpg", quality=90)
    bg.save(STATIC_PORTRAITS / f"{slug}.jpg", quality=90)


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    STATIC.mkdir(parents=True, exist_ok=True)

    look_imgs: dict[str, Image.Image] = {}
    for look, filename in LOOKS.items():
        img = cutout(SRC / filename)
        look_imgs[look] = img
        path = OUT / f"look_{look}.png"
        img.save(path, optimize=True)
        (STATIC / path.name).write_bytes(path.read_bytes())
        print(f"look {look}: {img.size}")

    for slug, look in AGENT_LOOKS.items():
        img = look_imgs[look]
        dest = OUT / f"{slug}.png"
        img.save(dest, optimize=True)
        (STATIC / dest.name).write_bytes(dest.read_bytes())
        write_portrait(slug, img)
        print(f"agent {slug} <- {look}")


if __name__ == "__main__":
    main()
