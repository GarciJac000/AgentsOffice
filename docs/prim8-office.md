# PRIM8 Productions office

Default AgentsOffice roster + visual theme for Jacob’s PRIM8 Productions studio.

**Skydive source:** https://www.skydive.com/o/eJJbcZSS5f5Gi3KrCi1u_g

## Brand

| Field | Value |
|-------|-------|
| Name | PRIM8 Productions |
| Primary | `#0B0C0E` |
| Secondary | `#F4F3EF` |
| Accent | `#ec4899` (magenta `8`) |
| UI chrome | Black / charcoal with pink accents |

## Visual design

The office is a **full 3D isometric Three.js scene** (orthographic camera, soft shadows) inspired by the Skydive / Gather open floor plan:

| Zone | Room id | Notes |
|------|---------|-------|
| Creative Wall | `showroom` | Left wall shelves, posters, plants |
| Control | `manager` | Back-wall desks under PRIM8 monitor |
| Lounge | `meeting` | Sofa + coffee table |
| Studio Floor | `workspace` | Center 2×2 desk cluster on a rug |
| Kitchen / Edit | `datacenter` | Fridge, dining table, vending |

Agents are **real 3D avatars** (`frontend/src/three/avatars.ts`) with look-specific streetwear meshes:

| Look | Signature | Agents |
|------|-----------|--------|
| cameraman | Cap, backpack, cinema camera | DRE, SPIKE |
| beanie | Beanie, sunglasses, crossed arms | Jarvis, SHAKIR |
| executive | Bun, glasses, gold hoops, laptop | ARIA, Dispatcher |
| street | Curly ponytail, gold hoops, pink kicks | SIMONE |
| producer | Backward cap, headphones | Echo, Data Engineer |

Walk/idle limb animation + facing toward movement. Portrait cards still power the React UI (`assets/portraits/{slug}.jpg`).

Source: `frontend/src/three/` (`OfficeApp.ts`, `buildOffice.ts`, `agents.ts`, `avatars.ts`, `rooms.ts`).

## Agents

Seed JSON: [`office/prim8/agents.json`](../office/prim8/agents.json)  
Runtime builtins: [`app/services/agents/definitions.py`](../app/services/agents/definitions.py)

| Slug | Name | Skydive key | Role (reconstructed) |
|------|------|-------------|----------------------|
| jarvis | Jarvis | `htpkcE2QxtLvKLGr` | Office lead & coordinator |
| aria | ARIA | `6xrZYE9ftwk_Ech8` | A&R / creative repertoire |
| simone | SIMONE | `ntTz4BSeF99z5fO1` | Creative direction & artist development |
| spike | SPIKE | `vb5E_z_Jtl3BXJKw` | Session producer & project momentum |
| dre | DRE | `DsXigmtVdNH3gz0P` | Music / audio producer |
| shakir | SHAKIR | `AkG94XdD2l45INO3` | Performance & release operations |
| echo | Echo | `TxqDpLuTSAj9daFX` | Mix / sound & signal chain |
| data_engineer | Data Engineer | — | AgentsOffice file/SQL tooling (retained) |

Names, keys, and avatars come from Skydive `GET /api/v2/public/offices?token=…`.  
**Roles and system prompts were not exportable** from the public share API.

## Gaps vs Skydive

- No true 3D isometric GLB interior (Phaser orthogonal tilemap approximating the open plan)
- No Skydive-native routines engine, hosted apps, or OAuth integrations
- No verified original system prompts from the PRIM8 org
