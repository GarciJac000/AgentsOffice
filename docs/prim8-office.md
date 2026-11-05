# PRIM8 Productions office

3D studio prototype of Jacob’s PRIM8 Productions inside AgentsOffice.

**Skydive source (roster inspiration):** https://www.skydive.com/o/eJJbcZSS5f5Gi3KrCi1u_g

## Brand

| Field | Value |
|-------|-------|
| Name | PRIM8 Productions |
| Primary | `#0B0C0E` |
| Secondary | `#F4F3EF` |
| Accent | `#ec4899` (magenta `8`) |
| UI chrome | Charcoal with pink accents |

## Visual design (current prototype)

React + **React Three Fiber** + **drei** isometric / high-angle office with a **video-game / PBR** look:

- Smooth shaded characters (higher-segment capsules/spheres)
- Material helpers for wood, paint, metal, glass, fabric, skin
- HDRI `Environment`, hemisphere + key/fill lights, contact shadows
- ACES Filmic tone mapping
- Continuous (non–stop-motion) status animations

Source: `frontend/src/App.tsx`, `frontend/src/office/`, mock seam `frontend/src/office/mockOffice.ts`.

## Rooms & agents

| Agent | Role | Room |
|-------|------|------|
| Aria | A&R Manager | Corner office overlooking studio floor |
| Simone | Catalog Manager | Desk by shelves (songs, masters, rights) |
| Spike | Music Video Director | Screening room, storyboard wall, large monitor |
| Dre | Music Production | Recording studio, mixing board, booth |
| Shakir | Promotion Strategy | War room, whiteboard, social numbers screen |

States: `idle` | `working` | `blocked` | `done`.

## Mock → backend seam

`getMockOffice()` returns the typed `OfficeMock` payload. Replace that function (or point it at `/api/...`) without changing the scene or panel consumers.

Seed JSON (broader roster history): [`office/prim8/agents.json`](../office/prim8/agents.json)

## Out of scope (for now)

- Live agent / LLM connection
- Office builder / editable layout
- Meetings
- Authored character GLBs (procedural figures for now)
