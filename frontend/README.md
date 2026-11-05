# PRIM8 Studio Office (frontend)

Browser prototype of the PRIM8 Productions studio as a **Sims-style isometric 3D office** with a realistic video-game look (React + React Three Fiber + drei).

## Features

- One studio scene with **five rooms** and **five agents**
- Agent states: `idle` · `working` · `blocked` · `done` (status HUD + smooth anims)
- High-angle orbit camera with zoom, pan, and click-to-focus (room or character)
- Side panel: name, role, status, activity log, stubbed chat
- Mock data in `src/office/mockOffice.ts` with a clean `getMockOffice()` seam for a future backend

## Run locally

```bash
cd frontend
npm install
npm run dev
```

Open **http://localhost:5174/static/office/** (Vite `base` is `/static/office/` so the build also serves under the FastAPI static path).

```bash
npm run build   # outputs to ../app/static/office
npm run preview
```

## Roster

| Agent  | Role                 | Room             |
|--------|----------------------|------------------|
| Aria   | A&R Manager          | Corner Office    |
| Simone | Catalog Manager      | Catalog Desk     |
| Spike  | Music Video Director | Screening Room   |
| Dre    | Music Production     | Recording Studio |
| Shakir | Promotion Strategy   | War Room         |

## Art direction

PBR-ish materials (wood / paint / metal / glass / fabric), HDRI environment reflections, ACES tone mapping, contact shadows, and smooth continuous character animation — not claymation / stop-motion.
