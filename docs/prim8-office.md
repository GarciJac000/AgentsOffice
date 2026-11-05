# PRIM8 Productions office

Claymation prototype of Jacob’s PRIM8 Productions studio inside AgentsOffice.

**Skydive source (roster inspiration):** https://www.skydive.com/o/eJJbcZSS5f5Gi3KrCi1u_g

## Brand

| Field | Value |
|-------|-------|
| Name | PRIM8 Productions |
| Primary | `#0B0C0E` |
| Secondary | `#F4F3EF` |
| Accent | `#ec4899` (magenta `8`) |
| UI chrome | Black / charcoal with pink accents |

## Visual design (current prototype)

React + **React Three Fiber** + **drei** isometric / high-angle claymation diorama:

- Chunky procedural clay puppets (thumbprint vertex displacement, matte clay materials)
- Warm key + fill lighting, soft shadows
- Stop-motion feel via stepped animation clock (~10 fps)
- Orbit camera with zoom + pan; click room or character to focus

Source: `frontend/src/App.tsx`, `frontend/src/claymation/`, mock seam `frontend/src/claymation/mockOffice.ts`.

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
- Authored claymation GLB models (procedural shapes only in this pass)
