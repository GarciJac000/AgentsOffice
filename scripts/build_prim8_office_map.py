#!/usr/bin/env python3
"""Rebuild AgentsOffice tilemap as an open-plan PRIM8 studio (Skydive-style layout).

Zones (matching the Gather/Skydive reference):
  - Perimeter walls + window-ish top/right edge
  - Warm wood floor throughout
  - Center: 2x2 desk cluster on a rug
  - Back wall: twin desks under a large monitor
  - Lounge (top-right): sofa + coffee table
  - Kitchen (bottom-right): fridge, counter, dining table
  - Left wall: shelves / sideboard / plants
"""
from __future__ import annotations

import copy
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "frontend/public/assets/tilemaps/office.json"
OUT = SRC  # overwrite in place
STATIC_OUT = ROOT / "app/static/office/assets/tilemaps/office.json"

W, H = 40, 30
TW, TH = 32, 32

# FloorAndGround firstgid = 1
# Useful wall / floor gids observed in the original map
WALL_L = 152
WALL_R = 154
WALL_T = 90
WALL_B = 217
WALL_TL = 88
WALL_TR = 90
WALL_BL = 216
WALL_BR = 218
WALL_INNER_H = 722
FLOOR_WOOD = 48          # warm wood plank
FLOOR_WOOD_ALT = 50
FLOOR_RUG = 412          # light gray rug tiles
FLOOR_RUG_EDGE = 411
OUTSIDE = 0

# Modern_Office firstgid = 2584  → local + 2584
# Chair firstgid = 2561
# Computer firstgid = 4680
# Generic firstgid = 3432
# Whiteboard firstgid = 4685
# Vending firstgid = 5488
# Basement firstgid = 4688

CHAIR_DOWN = 2562
CHAIR_LEFT = 2563
CHAIR_RIGHT = 2564
CHAIR_UP = 2566

# Desk / table pieces from Modern Office (reusing popular gids from original)
DESK_A = 2612
DESK_B = 2613
DESK_C = 2628
DESK_D = 2629
TABLE_A = 3017
TABLE_B = 3018
TABLE_C = 3019
TABLE_D = 3021
CABINET = 2776
SHELF = 2782
PLANT = 3003
SOFA_L = 3065
SOFA_M = 3066
SOFA_R = 3067
FRIDGE = 2836
MONITOR_WALL = 2596

# Generic plants / decor
GEN_PLANT = 4130
GEN_PLANT2 = 4146

COMPUTER_GIDS = [4680, 4681, 4682, 4683, 4684]
WHITEBOARD = 4685
VENDING = 5488


def idx(x: int, y: int) -> int:
    return y * W + x


def blank_ground() -> list[int]:
    return [OUTSIDE] * (W * H)


def fill_rect(data: list[int], x0: int, y0: int, x1: int, y1: int, gid: int) -> None:
    for y in range(y0, y1 + 1):
        for x in range(x0, x1 + 1):
            data[idx(x, y)] = gid


def wood_fill(data: list[int], x0: int, y0: int, x1: int, y1: int) -> None:
    for y in range(y0, y1 + 1):
        for x in range(x0, x1 + 1):
            data[idx(x, y)] = FLOOR_WOOD if (x + y) % 3 else FLOOR_WOOD_ALT


def obj(oid: int, gid: int, x: int, y: int, w: int = 32, h: int = 32, props=None) -> dict:
    o = {
        "gid": gid,
        "height": h,
        "id": oid,
        "name": "",
        "rotation": 0,
        "type": "",
        "visible": True,
        "width": w,
        "x": x,
        "y": y,
    }
    if props:
        o["properties"] = props
    return o


def build() -> dict:
    with SRC.open() as f:
        base = json.load(f)

    data = blank_ground()

    # Interior bounds (tile coords inclusive)
    x0, y0, x1, y1 = 5, 3, 34, 26

    # Wood floor
    wood_fill(data, x0 + 1, y0 + 1, x1 - 1, y1 - 1)

    # Center rug under desk cluster
    fill_rect(data, 14, 11, 23, 18, FLOOR_RUG)
    # Lounge circular-ish rug (approx square of lighter tiles)
    fill_rect(data, 26, 6, 32, 11, FLOOR_RUG_EDGE)

    # Perimeter walls on ground layer for continuity
    for x in range(x0, x1 + 1):
        data[idx(x, y0)] = WALL_INNER_H
        data[idx(x, y1)] = WALL_B
    for y in range(y0, y1 + 1):
        data[idx(x0, y)] = WALL_L
        data[idx(x1, y)] = WALL_R
    data[idx(x0, y0)] = WALL_TL
    data[idx(x1, y0)] = WALL_TR
    data[idx(x0, y1)] = WALL_BL
    data[idx(x1, y1)] = WALL_BR

    # Soft "window" gaps along top and right (leave floor visible = brighter)
    for x in (10, 11, 12, 18, 19, 20, 26, 27, 28):
        if x0 < x < x1:
            data[idx(x, y0)] = FLOOR_WOOD
    for y in (8, 9, 10, 16, 17, 18):
        if y0 < y < y1:
            data[idx(x1, y)] = FLOOR_WOOD

    next_id = 1000
    walls: list[dict] = []
    chairs: list[dict] = []
    objects: list[dict] = []
    objects_collide: list[dict] = []
    generic: list[dict] = []
    generic_collide: list[dict] = []
    computers: list[dict] = []
    whiteboards: list[dict] = []
    basement: list[dict] = []
    vending: list[dict] = []

    def add(layer: list, gid: int, tx: int, ty: int, w: int = 32, h: int = 32, props=None):
        nonlocal next_id
        # Tiled object y is bottom of tile for gid objects
        layer.append(obj(next_id, gid, tx * TW, (ty + 1) * TH if h == 32 else ty * TH + h, w, h, props))
        # Fix: for standard 32x32, y in original map is the bottom edge in pixels
        layer[-1]["y"] = ty * TH + h
        layer[-1]["x"] = tx * TW
        next_id += 1

    # --- Perimeter wall objects (so agents depth-sort against walls) ---
    for x in range(x0, x1 + 1):
        add(walls, WALL_INNER_H, x, y0)
        add(walls, 217, x, y1)
    for y in range(y0 + 1, y1):
        add(walls, WALL_L, x0, y)
        add(walls, WALL_R, x1, y)

    # --- Left wall storage / plants ---
    for ty, gid in [(6, SHELF), (8, SHELF), (10, CABINET), (12, CABINET), (20, SHELF)]:
        add(objects_collide, gid, 7, ty)
    for ty in (7, 14, 22):
        add(objects, PLANT, 8, ty)
        add(generic, GEN_PLANT, 9, ty)

    # Wall art / posters (whiteboard tiles as proxy for posters)
    add(whiteboards, WHITEBOARD, 7, 5, 64, 64)
    add(whiteboards, 4686, 7, 16, 64, 64)

    # --- Back wall: twin desks + big monitor branding wall ---
    add(objects, MONITOR_WALL, 16, 5)
    add(objects, MONITOR_WALL, 17, 5)
    add(objects, MONITOR_WALL, 18, 5)
    add(objects, MONITOR_WALL, 19, 5)
    add(whiteboards, 4687, 16, 4, 64, 64)  # "PRIM8" screen stand-in

    for tx in (14, 20):
        add(objects_collide, DESK_A, tx, 7)
        add(objects_collide, DESK_B, tx + 1, 7)
        add(objects_collide, DESK_C, tx, 8)
        add(objects_collide, DESK_D, tx + 1, 8)
        add(chairs, CHAIR_UP, tx, 9, 32, 64, [{"name": "direction", "type": "string", "value": "up"}])
        add(computers, COMPUTER_GIDS[(tx // 2) % len(COMPUTER_GIDS)], tx - 1, 6, 96, 64)

    # --- Center 2x2 desk cluster ---
    desk_spots = [(15, 13), (19, 13), (15, 16), (19, 16)]
    for i, (tx, ty) in enumerate(desk_spots):
        add(objects_collide, DESK_A, tx, ty)
        add(objects_collide, DESK_B, tx + 1, ty)
        add(objects_collide, DESK_C, tx, ty + 1)
        add(objects_collide, DESK_D, tx + 1, ty + 1)
        add(chairs, CHAIR_UP, tx, ty + 2, 32, 64, [{"name": "direction", "type": "string", "value": "up"}])
        add(computers, COMPUTER_GIDS[i % len(COMPUTER_GIDS)], tx - 1, ty - 1, 96, 64)
        add(objects, PLANT, tx + 2, ty)

    # --- Lounge (top-right) ---
    add(objects_collide, SOFA_L, 27, 8)
    add(objects_collide, SOFA_M, 28, 8)
    add(objects_collide, SOFA_R, 29, 8)
    add(objects_collide, TABLE_A, 28, 10)
    add(objects_collide, TABLE_B, 29, 10)
    add(objects, PLANT, 31, 7)
    add(generic, GEN_PLANT2, 26, 7)
    add(chairs, CHAIR_LEFT, 30, 10, 32, 64, [{"name": "direction", "type": "string", "value": "left"}])

    # --- Kitchen / break (bottom-right) ---
    add(objects_collide, FRIDGE, 30, 20)
    add(objects_collide, CABINET, 28, 20)
    add(objects_collide, CABINET, 29, 20)
    add(objects_collide, TABLE_C, 26, 22)
    add(objects_collide, TABLE_D, 27, 22)
    add(objects_collide, TABLE_A, 28, 22)
    add(objects_collide, TABLE_B, 26, 23)
    add(chairs, CHAIR_DOWN, 26, 21, 32, 64, [{"name": "direction", "type": "string", "value": "down"}])
    add(chairs, CHAIR_DOWN, 27, 21, 32, 64, [{"name": "direction", "type": "string", "value": "down"}])
    add(chairs, CHAIR_DOWN, 28, 21, 32, 64, [{"name": "direction", "type": "string", "value": "down"}])
    add(chairs, CHAIR_UP, 26, 24, 32, 64, [{"name": "direction", "type": "string", "value": "up"}])
    add(vending, VENDING, 32, 19, 48, 72)
    add(objects, PLANT, 25, 20)

    # Corner plants
    for tx, ty in [(8, 5), (8, 24), (32, 5), (22, 24)]:
        add(objects, PLANT, tx, ty)
        add(generic, GEN_PLANT, tx + 1, ty)

    # Build layers preserving tilesets from original
    ground = {
        "data": data,
        "height": H,
        "id": 2,
        "locked": True,
        "name": "Ground",
        "opacity": 1,
        "type": "tilelayer",
        "visible": True,
        "width": W,
        "x": 0,
        "y": 0,
    }

    def ogroup(name: str, lid: int, objects_list: list) -> dict:
        return {
            "draworder": "topdown",
            "id": lid,
            "locked": True,
            "name": name,
            "objects": objects_list,
            "opacity": 1,
            "type": "objectgroup",
            "visible": True,
            "x": 0,
            "y": 0,
        }

    out = copy.deepcopy(base)
    out["layers"] = [
        ground,
        ogroup("Wall", 3, walls),
        ogroup("Chair", 4, chairs),
        ogroup("Objects", 5, objects),
        ogroup("ObjectsOnCollide", 6, objects_collide),
        ogroup("GenericObjects", 7, generic),
        ogroup("GenericObjectsOnCollide", 8, generic_collide),
        ogroup("Computer", 9, computers),
        ogroup("Whiteboard", 10, whiteboards),
        ogroup("Basement", 11, basement),
        ogroup("VendingMachine", 12, vending),
    ]
    out["nextobjectid"] = next_id + 1
    out["nextlayerid"] = 13
    return out


def main() -> None:
    office = build()
    text = json.dumps(office, indent=1)
    # Tiled-ish compact: keep readable enough
    OUT.write_text(text)
    if STATIC_OUT.parent.exists():
        STATIC_OUT.write_text(text)
    print(f"Wrote {OUT}")
    print(f"Ground non-empty tiles: {sum(1 for g in office['layers'][0]['data'] if g)}")
    for layer in office["layers"][1:]:
        print(f"  {layer['name']}: {len(layer['objects'])} objects")


if __name__ == "__main__":
    main()
