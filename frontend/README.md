# PRIM8 Claymation Office (frontend)

Browser prototype of the PRIM8 Productions studio as a **Sims-style isometric claymation office**, built with React + React Three Fiber + drei.

## Features (this prototype)

- One diorama scene with **five handmade rooms** and **five clay puppet agents**
- Agent states: `idle` · `working` · `blocked` · `done` (speech bubble + matching stop-motion anim)
- High-angle orbit camera with zoom, pan, and click-to-focus (room or character)
- Side panel: name, role, status, activity log, stubbed chat
- Mock data in `src/claymation/mockOffice.ts` with a clean `getMockOffice()` seam for a future backend

## Run locally

```bash
cd frontend
npm install
npm run dev
```

Open **http://localhost:5174/static/office/** (Vite `base` is `/static/office/` so the build also serves under the FastAPI static path).

```bash
npm run build   # outputs to ../app/static/office
npm run preview # preview the production build
```

## Roster

| Agent  | Role                 | Room             |
|--------|----------------------|------------------|
| Aria   | A&R Manager          | Corner Office    |
| Simone | Catalog Manager      | Catalog Desk     |
| Spike  | Music Video Director | Screening Room   |
| Dre    | Music Production     | Recording Studio |
| Shakir | Promotion Strategy   | War Room         |

## Scope (intentionally out)

No live agent backend, office builder, meetings, or authored GLB models yet — figures are procedural clay shapes with thumbprint displacement.
